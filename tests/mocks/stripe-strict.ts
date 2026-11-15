// A strict double of the Stripe API for the tests.
//
// Unlike a loose mock, this double behaves like the real API: it rejects the
// wrong currency, a missing amount, a transfer without a source charge and a
// source transaction that is not a charge (ch_...). It also remembers the
// idempotency keys: the same key returns the same object, like Stripe does.

export type FakePaymentIntent = {
    id: string
    object: "payment_intent"
    amount: number
    currency: string
    status: "requires_payment_method" | "succeeded"
    metadata: Record<string, string>
    client_secret: string
    latest_charge: string | null
}

export type FakeCharge = {
    id: string
    object: "charge"
    amount: number
    currency: string
    payment_intent: string
    paid: boolean
    metadata: Record<string, string>
}

export type FakeTransfer = {
    id: string
    object: "transfer"
    amount: number
    currency: string
    destination: string
    source_transaction: string | null
    transfer_group: string | null
    metadata: Record<string, string>
}

export type FakeRefund = {
    id: string
    object: "refund"
    payment_intent: string
}

export type FakeAccount = {
    id: string
    object: "account"
    details_submitted: boolean
    charges_enabled: boolean
    payouts_enabled: boolean
    capabilities: Record<string, string>
    requirements: { currently_due: string[]; disabled_reason: string | null }
    email?: string
}

export type StripeParams = {
    amount?: number
    currency?: string
    destination?: string
    source_transaction?: string
    transfer_group?: string
    metadata?: Record<string, string>
    capabilities?: Record<string, { requested?: boolean }>
    transfer_data?: { destination?: string }
    email?: string
    type?: string
    country?: string
    payment_intent?: string
    limit?: number
    [key: string]: unknown
}

export class StripeTestError extends Error {
    code: string
    constructor(code: string, message: string) {
        super(message)
        this.code = code
        this.name = "StripeTestError"
    }
}

export function createStripeTestDouble() {
    const paymentIntents = new Map<string, FakePaymentIntent>()
    const charges = new Map<string, FakeCharge>()
    const transfers = new Map<string, FakeTransfer>()
    const refunds = new Map<string, FakeRefund>()
    const accounts = new Map<string, FakeAccount>()
    const idempotency = new Map<string, { kind: string; id: string }>()

    let counter = 0
    const nextId = (prefix: string) => `${prefix}_${(++counter).toString().padStart(6, "0")}`

    const findByKey = (kind: string, key?: string) => {
        if (!key) return undefined
        const found = idempotency.get(`${kind}:${key}`)
        if (!found) return undefined
        return found.id
    }

    const remember = (kind: string, key: string | undefined, id: string) => {
        if (key) idempotency.set(`${kind}:${key}`, { kind, id })
    }

    const api = {
        paymentIntents: {
            async create(params: StripeParams, options?: { idempotencyKey?: string }) {
                const existing = findByKey("pi", options?.idempotencyKey)
                if (existing) return paymentIntents.get(existing)

                if (!params || typeof params.amount !== "number" || params.amount <= 0) {
                    throw new StripeTestError(
                        "parameter_invalid_integer",
                        "Invalid integer: amount must be a positive integer"
                    )
                }
                if (params.currency !== "eur") {
                    throw new StripeTestError(
                        "parameter_invalid_string_empty",
                        "Invalid currency: only eur is supported"
                    )
                }
                if (params.transfer_data?.destination && !accounts.has(params.transfer_data.destination)) {
                    throw new StripeTestError(
                        "resource_missing",
                        `No such destination: '${params.transfer_data.destination}'`
                    )
                }

                const id = nextId("pi")
                const paymentIntent: FakePaymentIntent = {
                    id,
                    object: "payment_intent",
                    amount: params.amount,
                    currency: params.currency,
                    status: "requires_payment_method",
                    metadata: { ...(params.metadata || {}) },
                    client_secret: `${id}_secret`,
                    latest_charge: null,
                }
                paymentIntents.set(id, paymentIntent)

                // The platform collects the money: a charge is created with the
                // payment intent (this is what the webhook reports).
                const charge: FakeCharge = {
                    id: nextId("ch"),
                    object: "charge",
                    amount: params.amount,
                    currency: params.currency,
                    payment_intent: id,
                    paid: true,
                    metadata: { ...(params.metadata || {}) },
                }
                charges.set(charge.id, charge)
                paymentIntent.latest_charge = charge.id

                remember("pi", options?.idempotencyKey, id)
                return paymentIntent
            },
            async retrieve(id: string) {
                const paymentIntent = paymentIntents.get(id)
                if (!paymentIntent) {
                    throw new StripeTestError("resource_missing", `No such payment_intent: '${id}'`)
                }
                return paymentIntent
            },
        },

        charges: {
            async list(params: { payment_intent?: string; limit?: number }) {
                const data = [...charges.values()].filter(
                    (charge) => !params.payment_intent || charge.payment_intent === params.payment_intent
                )
                return { object: "list", data: data.slice(0, params.limit ?? data.length) }
            },
            async retrieve(id: string) {
                const charge = charges.get(id)
                if (!charge) {
                    throw new StripeTestError("resource_missing", `No such charge: '${id}'`)
                }
                return charge
            },
        },

        transfers: {
            async create(params: StripeParams, options?: { idempotencyKey?: string }) {
                const existing = findByKey("tr", options?.idempotencyKey)
                if (existing) return transfers.get(existing)

                if (!params || typeof params.amount !== "number" || params.amount <= 0) {
                    throw new StripeTestError(
                        "parameter_invalid_integer",
                        "Invalid integer: amount must be a positive integer"
                    )
                }
                if (params.currency !== "eur") {
                    throw new StripeTestError(
                        "parameter_invalid_string_empty",
                        "Invalid currency: only eur is supported"
                    )
                }
                if (!params.destination || !accounts.has(params.destination)) {
                    throw new StripeTestError(
                        "resource_missing",
                        `No such destination: '${params.destination}'`
                    )
                }

                // The source of a transfer must be a CHARGE. A payment intent
                // is rejected by Stripe ("source_transaction must be a charge").
                if (params.source_transaction) {
                    if (typeof params.source_transaction !== "string") {
                        throw new StripeTestError(
                            "parameter_invalid_string_empty",
                            "Invalid source_transaction"
                        )
                    }
                    if (params.source_transaction.startsWith("pi_")) {
                        throw new StripeTestError(
                            "parameter_invalid_string_empty",
                            `Invalid source_transaction: '${params.source_transaction}' is a PaymentIntent, not a Charge`
                        )
                    }
                    const charge = charges.get(params.source_transaction)
                    if (!charge) {
                        throw new StripeTestError(
                            "resource_missing",
                            `No such charge: '${params.source_transaction}'`
                        )
                    }
                    if (charge.amount < params.amount) {
                        throw new StripeTestError(
                            "amount_too_small",
                            "The transfer amount is larger than the charge it comes from"
                        )
                    }
                }

                const id = nextId("tr")
                const transfer: FakeTransfer = {
                    id,
                    object: "transfer",
                    amount: params.amount,
                    currency: params.currency,
                    destination: params.destination,
                    source_transaction: params.source_transaction ?? null,
                    transfer_group: params.transfer_group ?? null,
                    metadata: { ...(params.metadata || {}) },
                }
                transfers.set(id, transfer)
                remember("tr", options?.idempotencyKey, id)
                return transfer
            },
            async retrieve(id: string) {
                const transfer = transfers.get(id)
                if (!transfer) {
                    throw new StripeTestError("resource_missing", `No such transfer: '${id}'`)
                }
                return transfer
            },
        },

        refunds: {
            async create(params: StripeParams, options?: { idempotencyKey?: string }) {
                const existing = findByKey("refund", options?.idempotencyKey)
                if (existing) return refunds.get(existing)

                const paymentIntent = paymentIntents.get(String(params?.payment_intent || ""))
                if (!paymentIntent) {
                    throw new StripeTestError(
                        "resource_missing",
                        `No such payment_intent: '${params?.payment_intent}'`
                    )
                }
                if (paymentIntent.status !== "succeeded") {
                    throw new StripeTestError(
                        "payment_intent_unexpected_state",
                        "The payment intent is not succeeded"
                    )
                }

                const id = nextId("re")
                const refund: FakeRefund = {
                    id,
                    object: "refund",
                    payment_intent: paymentIntent.id,
                }
                refunds.set(id, refund)
                remember("refund", options?.idempotencyKey, id)
                return refund
            },
        },

        accounts: {
            async create(params: StripeParams, options?: { idempotencyKey?: string }) {
                const existing = findByKey("acct", options?.idempotencyKey)
                if (existing) return accounts.get(existing)

                const id = nextId("acct")
                const capabilities: Record<string, string> = {}
                for (const [name, value] of Object.entries(
                    (params?.capabilities || {}) as Record<string, { requested?: boolean }>
                )) {
                    capabilities[name] = value?.requested ? "active" : "inactive"
                }
                const account: FakeAccount = {
                    id,
                    object: "account",
                    details_submitted: true,
                    charges_enabled: capabilities.card_payments === "active",
                    payouts_enabled: true,
                    capabilities,
                    requirements: { currently_due: [], disabled_reason: null },
                    email: params?.email,
                }
                accounts.set(id, account)
                remember("acct", options?.idempotencyKey, id)
                return account
            },
            async retrieve(id: string) {
                const account = accounts.get(id)
                if (!account) {
                    throw new StripeTestError("resource_missing", `No such account: '${id}'`)
                }
                return account
            },
            async update(id: string, params: StripeParams) {
                const account = accounts.get(id)
                if (!account) {
                    throw new StripeTestError("resource_missing", `No such account: '${id}'`)
                }
                Object.assign(account, params)
                return account
            },
        },

        accountLinks: {
            async create(params: StripeParams) {
                const accountId = String(params?.account || "")
                if (!accountId || !accounts.has(accountId)) {
                    throw new StripeTestError(
                        "resource_missing",
                        `No such account: '${accountId}'`
                    )
                }
                return {
                    id: nextId("al"),
                    object: "account_link",
                    url: `https://connect.stripe.test/setup/${accountId}`,
                    expires_at: Math.floor(Date.now() / 1000) + 3600,
                }
            },
        },
    }

    return {
        api,
        paymentIntents,
        charges,
        transfers,
        refunds,
        accounts,
        idempotency,
    }
}
