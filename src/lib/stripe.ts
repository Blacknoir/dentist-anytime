import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: "2025-12-15.clover",
    typescript: true,
})

export function calculateCommission(amount: number, rate: number = 10) {
    return (amount * rate) / 100
}

export function getDentistAmount(amount: number, rate: number = 10) {
    return amount - calculateCommission(amount, rate)
}

export function getCommissionRate(): number {
    return 10 // Default 10% commission rate
}

export async function createCheckoutSession(params: {
    bookingId: string
    serviceName: string
    price: number
    successUrl: string
    cancelUrl: string
}) {
    const { bookingId, serviceName, price, successUrl, cancelUrl } = params

    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
            {
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: serviceName,
                    },
                    unit_amount: Math.round(price * 100), // Convert to cents
                },
                quantity: 1,
            },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
            bookingId,
        },
    })

    return session
}

export async function verifyWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
) {
    if (!webhookSecret) {
        throw new Error("The signing secret of the webhook is not configured")
    }
    return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}

// ---------------------------------------------------------------- Connect
//
// The two flows of the platform use Stripe Connect in a different way:
//
//   - the dentist is paid directly: the charge goes to the connected account
//     (transfer_data.destination). The account must be able to RECEIVE
//     charges (card_payments + charges_enabled).
//   - the Lab marketplace: the platform collects the money and transfers it
//     to the designer after the delivery is approved. The account must be
//     able to RECEIVE TRANSFERS (transfers capability).
//
// The state of the account is therefore checked against the capability that
// the flow really needs.

export type ConnectFlow = "DESTINATION_CHARGE" | "PLATFORM_TRANSFER"

export type ConnectAccountState = {
    accountId: string
    detailsSubmitted: boolean
    /** The account can receive charges (card payments). */
    chargesEnabled: boolean
    /** The account can receive transfers from the platform. */
    transfersActive: boolean
    /** The account can pay out to its own bank. */
    payoutsEnabled: boolean
    /** The requirements that are still open (empty = nothing is missing). */
    currentlyDue: string[]
    /** The reason why the account is disabled (null = it is not). */
    disabledReason: string | null
    /** The account cannot be used for the flow. */
    usable: boolean
    /** The reason why the account cannot be used (for the interface). */
    reason:
        | "NOT_CONNECTED"
        | "ONBOARDING_INCOMPLETE"
        | "PENDING_VERIFICATION"
        | "CAPABILITY_MISSING"
        | "ACCOUNT_DISABLED"
        | "UNAVAILABLE"
}

/** The capability that a flow needs from the connected account. */
export function requiredCapability(flow: ConnectFlow) {
    return flow === "DESTINATION_CHARGE" ? "card_payments" : "transfers"
}

/**
 * Reads the state of a connected account and checks the capability that the
 * flow needs. `payouts_enabled` alone is NOT enough: it only says that the
 * account can pay out to its own bank.
 */
export function readConnectAccountState(
    account: Stripe.Account,
    flow: ConnectFlow
): ConnectAccountState {
    const detailsSubmitted = !!account.details_submitted
    const chargesEnabled = !!account.charges_enabled
    const transfersActive = account.capabilities?.transfers === "active"
    const payoutsEnabled = !!account.payouts_enabled
    const currentlyDue = account.requirements?.currently_due ?? []
    const disabledReason = account.requirements?.disabled_reason ?? null

    const capabilityMissing =
        flow === "DESTINATION_CHARGE"
            ? account.capabilities?.card_payments !== "active"
            : account.capabilities?.transfers !== "active"

    let usable = true
    let reason: ConnectAccountState["reason"] = "NOT_CONNECTED"

    if (disabledReason) {
        usable = false
        reason = "ACCOUNT_DISABLED"
    } else if (!detailsSubmitted) {
        usable = false
        reason = "ONBOARDING_INCOMPLETE"
    } else if (capabilityMissing) {
        usable = false
        reason = "CAPABILITY_MISSING"
    } else if (currentlyDue.length > 0) {
        usable = false
        reason = "PENDING_VERIFICATION"
    }

    return {
        accountId: account.id,
        detailsSubmitted,
        chargesEnabled,
        transfersActive,
        payoutsEnabled,
        currentlyDue,
        disabledReason,
        usable,
        reason,
    }
}

/**
 * Creates the onboarding link of a connected account. The link is single use
 * and expires, so a new one is created for every attempt.
 */
export async function createConnectOnboardingLink(params: {
    accountId: string
    refreshUrl: string
    returnUrl: string
}) {
    return stripe.accountLinks.create({
        account: params.accountId,
        refresh_url: params.refreshUrl,
        return_url: params.returnUrl,
        type: "account_onboarding",
    })
}

/** The base URL of the platform (without a trailing slash). */
export function platformUrl() {
    return (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "")
}
