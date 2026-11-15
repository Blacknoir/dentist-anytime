// Server-only payment primitives of the Lab marketplace.
//
// These functions move real money, so they are not exported from a
// "use server" module: every export of such a module is a public POST
// endpoint. The authorised entry points live in src/app/actions/lab.ts and
// src/app/api/lab/webhook/route.ts.

import "server-only"

import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { computeSplit } from "@/lib/lab"
import { LabActionError } from "@/lib/lab-domain"

export const LAB_CURRENCY = "eur"

/**
 * A claim of a webhook event that is older than this was left behind by a
 * process that died: the event is processed again.
 */
export const WEBHOOK_CLAIM_TTL_MS = 5 * 60 * 1000

export function caseTransferGroup(caseId: string) {
    return `lab_case_${caseId}`
}

/**
 * Marks a case as paid (escrow). Only called from the verified Stripe
 * webhook. The payment intent is checked against the case: same case, same
 * amount, same currency. A replayed event can never move a case that is
 * already refunded or released.
 *
 * The id of the charge (ch_...) is stored as well: the escrow transfer must
 * reference the charge and not the payment intent.
 */
export async function markCasePaymentHeldInternal(
    caseId: string,
    paymentIntentId: string,
    expectedAmountCents?: number,
    chargeId?: string | null,
    currency?: string | null
) {
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            paymentStatus: true,
            agreedPrice: true,
            stripePaymentIntentId: true,
            stripeChargeId: true,
        },
    })
    if (!target) return { applied: false as const, reason: "case_not_found" as const }

    if (target.paymentStatus === "RELEASED") {
        return { applied: false as const, reason: "already_released" as const }
    }
    if (target.paymentStatus === "REFUNDED") {
        return { applied: false as const, reason: "refunded" as const }
    }
    if (target.stripePaymentIntentId && target.stripePaymentIntentId !== paymentIntentId) {
        // Another payment intent is already attached to the case: do not
        // overwrite it, the money would become untraceable.
        return { applied: false as const, reason: "another_payment_intent" as const }
    }
    if (currency && currency.toLowerCase() !== LAB_CURRENCY) {
        return { applied: false as const, reason: "currency_mismatch" as const }
    }
    if (typeof expectedAmountCents === "number" && target.agreedPrice) {
        if (Math.round(target.agreedPrice * 100) !== expectedAmountCents) {
            return { applied: false as const, reason: "amount_mismatch" as const }
        }
    }
    if (target.stripeChargeId && chargeId && target.stripeChargeId !== chargeId) {
        return { applied: false as const, reason: "another_charge" as const }
    }

    await prisma.labCase.update({
        where: { id: caseId },
        data: {
            paymentStatus: "HELD",
            stripePaymentIntentId: paymentIntentId,
            ...(chargeId ? { stripeChargeId: chargeId } : {}),
        },
    })

    return { applied: true as const }
}

/**
 * Creates the escrow PaymentIntent of a case. The idempotency key is derived
 * from the case, so a double click or a page reload can never create two
 * payable intents for the same work.
 */
export async function createCasePaymentIntentInternal(caseId: string) {
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            agreedPrice: true,
            paymentStatus: true,
            stripePaymentIntentId: true,
            customerId: true,
            assignedDesignerId: true,
        },
    })
    if (!target) throw new LabActionError("NOT_FOUND", "Η εργασία δεν βρέθηκε.", 404)
    if (!target.agreedPrice || !target.assignedDesignerId) {
        throw new LabActionError(
            "NO_OFFER_ACCEPTED",
            "Δεν έχει επιλεγεί προσφορά για αυτή την εργασία.",
            409
        )
    }
    if (target.paymentStatus === "HELD") {
        throw new LabActionError("ALREADY_PAID", "Η εργασία έχει ήδη πληρωθεί.", 409)
    }
    if (target.paymentStatus === "RELEASED") {
        throw new LabActionError(
            "ALREADY_RELEASED",
            "Η πληρωμή έχει ήδη αποδεσμευτεί στον designer.",
            409
        )
    }
    if (target.paymentStatus === "REFUNDED") {
        throw new LabActionError(
            "REFUNDED",
            "Η εργασία έχει επιστραφεί και δεν μπορεί να πληρωθεί ξανά χωρίς νέα προσφορά.",
            409
        )
    }

    const split = computeSplit(target.agreedPrice)
    const amount = Math.round(target.agreedPrice * 100)

    const paymentIntent = await stripe.paymentIntents.create(
        {
            amount,
            currency: LAB_CURRENCY,
            automatic_payment_methods: { enabled: true },
            transfer_group: caseTransferGroup(target.id),
            metadata: {
                labCaseId: target.id,
                customerId: target.customerId,
                designerProfileId: target.assignedDesignerId,
                feeCents: String(Math.round(split.fee * 100)),
                payoutCents: String(Math.round(split.payout * 100)),
            },
        },
        { idempotencyKey: `lab:pi:${target.id}` }
    )

    await prisma.labCase.update({
        where: { id: target.id },
        data: {
            stripePaymentIntentId: paymentIntent.id,
            platformFee: split.fee,
            designerPayout: split.payout,
        },
    })

    return {
        clientSecret: paymentIntent.client_secret as string,
        id: paymentIntent.id,
        amountCents: amount,
        feeCents: Math.round(split.fee * 100),
        payoutCents: Math.round(split.payout * 100),
    }
}

/**
 * Releases the escrowed money to the assigned designer.
 *
 * Guards:
 *  - the case must be COMPLETED and the payment HELD,
 *  - the designer must have a connected account that can receive transfers,
 *  - the Stripe call uses an idempotency key derived from the case, so a retry
 *    after a crash returns the very same transfer instead of paying twice,
 *  - the transfer references the CHARGE (ch_...) of the payment and not the
 *    payment intent (pi_...): only a charge can be the source of a transfer,
 *  - the state change and the earnings are written in one transaction.
 */
export async function releaseCasePaymentInternal(caseId: string) {
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: {
            id: true,
            status: true,
            paymentStatus: true,
            designerPayout: true,
            platformFee: true,
            agreedPrice: true,
            assignedDesignerId: true,
            stripePaymentIntentId: true,
            stripeChargeId: true,
            assignedDesigner: { select: { stripeAccountId: true } },
        },
    })
    if (!target) {
        return { released: false as const, reason: "case_not_found" as const }
    }
    if (target.paymentStatus === "RELEASED") {
        return { released: true as const, reason: "already_released" as const }
    }
    if (target.paymentStatus !== "HELD") {
        return { released: false as const, reason: "payment_not_held" as const }
    }
    if (target.status !== "COMPLETED") {
        return { released: false as const, reason: "case_not_completed" as const }
    }
    if (!target.assignedDesignerId || !target.designerPayout) {
        return { released: false as const, reason: "no_designer_payout" as const }
    }

    const accountId = target.assignedDesigner?.stripeAccountId
    if (!accountId) {
        return { released: false as const, reason: "designer_without_account" as const }
    }

    // The escrow can only be released against the charge of the payment.
    // Without it the money could not be traced back to the customer.
    if (!target.stripeChargeId || !target.stripeChargeId.startsWith("ch_")) {
        return { released: false as const, reason: "missing_charge" as const }
    }

    const payoutCents = Math.round(target.designerPayout * 100)
    if (payoutCents <= 0) {
        return { released: false as const, reason: "invalid_amount" as const }
    }

    const designerProfileId = target.assignedDesignerId
    const payoutAmount = target.designerPayout

    const transfer = await stripe.transfers.create(
        {
            amount: payoutCents,
            currency: LAB_CURRENCY,
            destination: accountId,
            transfer_group: caseTransferGroup(target.id),
            source_transaction: target.stripeChargeId,
            metadata: { labCaseId: target.id, designerProfileId },
        },
        { idempotencyKey: `lab:tr:${target.id}` }
    )

    // The state of the work and the earnings of the designer are written in
    // one transaction. If it fails, the transfer already exists: the next
    // attempt returns the same transfer (idempotency key) and writes the
    // state again.
    try {
        await prisma.$transaction(async (tx) => {
            const updated = await tx.labCase.updateMany({
                where: { id: target.id, paymentStatus: "HELD" },
                data: { paymentStatus: "RELEASED", stripeTransferId: transfer.id },
            })

            // Only the run that actually flips the state credits the earnings.
            if (updated.count === 1) {
                await tx.designerProfile.update({
                    where: { id: designerProfileId },
                    data: {
                        earnings: { increment: payoutAmount },
                        completedCases: { increment: 1 },
                    },
                })
            }
        })
    } catch (error) {
        console.error(
            `[lab] The transfer ${transfer.id} was created but the state of the work ${target.id} could not be written:`,
            error
        )
        return { released: false as const, reason: "database_error" as const }
    }

    return { released: true as const, transferId: transfer.id }
}

/** Refunds a held payment. Idempotent per case. */
export async function refundCasePaymentInternal(caseId: string) {
    const target = await prisma.labCase.findUnique({
        where: { id: caseId },
        select: { id: true, paymentStatus: true, stripePaymentIntentId: true },
    })
    if (!target) return { refunded: false as const, reason: "case_not_found" as const }
    if (target.paymentStatus === "REFUNDED") {
        return { refunded: true as const, reason: "already_refunded" as const }
    }
    if (target.paymentStatus !== "HELD" || !target.stripePaymentIntentId) {
        return { refunded: false as const, reason: "nothing_to_refund" as const }
    }

    await stripe.refunds.create(
        { payment_intent: target.stripePaymentIntentId },
        { idempotencyKey: `lab:refund:${target.id}` }
    )

    await prisma.labCase.update({
        where: { id: target.id },
        data: { paymentStatus: "REFUNDED" },
    })

    return { refunded: true as const }
}

/**
 * Registers a Stripe event id. Returns false when the event was already
 * processed, so a webhook retry does not run the handler twice.
 *
 * A claim that was left behind by a process that died (the handler was
 * interrupted) is released after a few minutes: the event is then processed
 * again instead of being lost for good.
 */
export async function claimWebhookEvent(eventId: string, type: string) {
    const existing = await prisma.labWebhookEvent.findUnique({
        where: { id: eventId },
        select: { id: true, createdAt: true },
    })

    if (existing) {
        const age = Date.now() - existing.createdAt.getTime()
        if (age < WEBHOOK_CLAIM_TTL_MS) {
            // The event is being processed (or was processed).
            return false
        }
        // The previous attempt died: the claim is released.
        await prisma.labWebhookEvent
            .delete({ where: { id: eventId } })
            .catch(() => undefined)
    }

    try {
        await prisma.labWebhookEvent.create({ data: { id: eventId, type } })
        return true
    } catch (error: unknown) {
        const code =
            typeof error === "object" && error !== null && "code" in error
                ? (error as { code?: unknown }).code
                : undefined
        if (code === "P2002") return false
        throw error
    }
}

/** Releases the claim of an event, so that Stripe can retry it. */
export async function releaseWebhookEvent(eventId: string) {
    await prisma.labWebhookEvent
        .delete({ where: { id: eventId } })
        .catch(() => undefined)
}
