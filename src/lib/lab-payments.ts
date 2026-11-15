// Server-only payment primitives of the Lab marketplace.
//
// These functions move real money, so they are not exported from a
// "use server" module: every export of such a module is a public POST
// endpoint. The authorised entry points live in src/app/actions/lab.ts and
// src/app/api/lab/webhook/route.ts.

import "server-only"

import type { Prisma } from "@prisma/client"
import { prisma } from "@/lib/prisma"
import { stripe } from "@/lib/stripe"
import { computeSplit } from "@/lib/lab"
import { LabActionError } from "@/lib/lab-domain"

export const LAB_CURRENCY = "eur"

export function getLabWebhookSecret() {
    return process.env.STRIPE_LAB_WEBHOOK_SECRET?.trim() || ""
}

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
    currency?: string | null,
    db: Prisma.TransactionClient = prisma
) {
    const target = await db.labCase.findUnique({
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

    const updated = await db.labCase.updateMany({
        where: {
            id: caseId,
            paymentStatus: { in: ["UNPAID", "FAILED", "HELD"] },
            agreedPrice: target.agreedPrice,
            AND: [
                { OR: [{ stripePaymentIntentId: null }, { stripePaymentIntentId: paymentIntentId }] },
                { OR: [{ stripeChargeId: null }, { stripeChargeId: chargeId ?? target.stripeChargeId }] },
            ],
        },
        data: {
            paymentStatus: "HELD",
            stripePaymentIntentId: paymentIntentId,
            ...(chargeId ? { stripeChargeId: chargeId } : {}),
        },
    })

    return updated.count
        ? { applied: true as const }
        : { applied: false as const, reason: "payment_changed" as const }
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
            status: true,
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
    if (target.status !== "ASSIGNED") {
        throw new LabActionError("CASE_NOT_PAYABLE", "Η εργασία δεν είναι διαθέσιμη για πληρωμή.", 409)
    }

    const split = computeSplit(target.agreedPrice)
    const amount = Math.round(target.agreedPrice * 100)

    const paymentIntent = target.stripePaymentIntentId
        ? await stripe.paymentIntents.retrieve(target.stripePaymentIntentId)
        : await stripe.paymentIntents.create(
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

    const saved = await prisma.labCase.updateMany({
        where: {
            id: target.id,
            status: "ASSIGNED",
            paymentStatus: { in: ["UNPAID", "FAILED"] },
            OR: [{ stripePaymentIntentId: null }, { stripePaymentIntentId: paymentIntent.id }],
        },
        data: {
            stripePaymentIntentId: paymentIntent.id,
            platformFee: split.fee,
            designerPayout: split.payout,
        },
    })
    if (!saved.count) {
        throw new LabActionError("CASE_CHANGED", "Η κατάσταση της εργασίας άλλαξε. Ανανέωσε τη σελίδα.", 409)
    }
    if (["succeeded", "processing", "canceled"].includes(paymentIntent.status) || !paymentIntent.client_secret) {
        throw new LabActionError("PAYMENT_PENDING", "Δεν μπορεί να ξεκινήσει νέα πληρωμή. Ανανέωσε τη σελίδα για να δεις την κατάσταση.", 409)
    }

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
    const transferGroup = caseTransferGroup(target.id)

    // A retry can happen after Stripe has expired the original idempotency key.
    const previous = await stripe.transfers.list({ transfer_group: transferGroup, limit: 2 })
    const existing = previous.data[0]
    if (previous.has_more || previous.data.length > 1 || (existing && (
        existing.reversed || existing.amount_reversed > 0 ||
        existing.source_transaction !== target.stripeChargeId ||
        existing.metadata.labCaseId !== target.id ||
        existing.metadata.designerProfileId !== designerProfileId ||
        existing.amount !== payoutCents || existing.currency !== LAB_CURRENCY
    ))) {
        console.error(`[lab] Transfer reconciliation required for case ${caseId}`)
        return { released: false as const, reason: "reconciliation_required" as const }
    }

    const transfer = existing ?? await stripe.transfers.create(
        {
            amount: payoutCents,
            currency: LAB_CURRENCY,
            destination: accountId,
            transfer_group: transferGroup,
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
                where: { id: target.id, status: "COMPLETED", paymentStatus: "HELD" },
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
        select: { id: true, status: true, paymentStatus: true, stripePaymentIntentId: true },
    })
    if (!target) return { refunded: false as const, reason: "case_not_found" as const }
    if (target.status !== "CANCELLED") {
        return { refunded: false as const, reason: "case_not_cancelled" as const }
    }
    if (target.paymentStatus === "REFUNDED") {
        return { refunded: true as const, reason: "already_refunded" as const }
    }
    if (target.paymentStatus !== "HELD" || !target.stripePaymentIntentId) {
        return { refunded: false as const, reason: "nothing_to_refund" as const }
    }

    const refund = await stripe.refunds.create(
        { payment_intent: target.stripePaymentIntentId },
        { idempotencyKey: `lab:refund:${target.id}` }
    )
    if (refund.status !== "succeeded") {
        return { refunded: false as const, reason: "refund_pending" as const }
    }

    await prisma.labCase.updateMany({
        where: { id: target.id, status: "CANCELLED", paymentStatus: "HELD" },
        data: { paymentStatus: "REFUNDED" },
    })

    return { refunded: true as const }
}

/** The completion marker and all database effects commit or roll back together. */
export async function processLabWebhookEvent(
    eventId: string,
    type: string,
    apply: (tx: Prisma.TransactionClient) => Promise<void>
) {
    return prisma.$transaction(async (tx) => {
        await tx.labWebhookEvent.createMany({ data: { id: eventId, type }, skipDuplicates: true })
        const claimed = await tx.labWebhookEvent.updateMany({
            where: { id: eventId, completedAt: null },
            data: { completedAt: new Date() },
        })
        if (!claimed.count) return false
        await apply(tx)
        return true
    })
}
