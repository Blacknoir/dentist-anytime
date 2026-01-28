import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession, calculateCommission, getDentistAmount } from '@/lib/stripe'
import { auth } from '@/auth'

export async function POST(request: NextRequest) {
    try {
        const session = await auth()

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { dentistProfileId, serviceName, date, price } = body

        if (!dentistProfileId || !serviceName || !date || !price) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        // Create booking first
        const booking = await prisma.booking.create({
            data: {
                patientId: session.user.id,
                dentistProfileId,
                serviceName,
                price,
                date: new Date(date),
                status: 'PENDING',
                paymentStatus: 'PENDING',
            },
        })

        // Calculate commission
        const commission = calculateCommission(price)
        const dentistAmount = getDentistAmount(price)

        // Create Stripe Checkout Session
        const checkoutSession = await createCheckoutSession({
            bookingId: booking.id,
            serviceName,
            price,
            successUrl: `${process.env.NEXTAUTH_URL}/booking/success?bookingId=${booking.id}`,
            cancelUrl: `${process.env.NEXTAUTH_URL}/booking?cancelled=true`,
        })

        // Update booking with stripe payment ID
        await prisma.booking.update({
            where: { id: booking.id },
            data: {
                stripePaymentId: checkoutSession.id,
                commissionAmount: commission,
            },
        })

        return NextResponse.json({
            checkoutUrl: checkoutSession.url,
            bookingId: booking.id,
            dentistAmount,
            commission,
        })
    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 })
    }
}
