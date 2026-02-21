import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    // Clear existing data
    await prisma.booking.deleteMany()
    await prisma.service.deleteMany()
    await prisma.availability.deleteMany()
    await prisma.dentistProfile.deleteMany()
    await prisma.user.deleteMany()

    console.log('Seeding dentists...')

    const dentists: any[] = []

    for (const d of dentists) {
        await prisma.user.create({
            data: {
                name: d.name,
                email: d.email,
                image: d.image,
                role: 'DENTIST',
                dentistProfile: {
                    create: {
                        specialty: d.profile.specialty,
                        location: d.profile.location,
                        latitude: d.profile.latitude,
                        longitude: d.profile.longitude,
                        rating: d.profile.rating,
                        reviewCount: d.profile.reviewCount,
                        experienceYears: d.profile.experienceYears,
                        about: d.profile.about,
                        education: d.profile.education,
                        priceFrom: d.profile.priceFrom,
                        services: {
                            create: d.profile.services
                        },
                        availability: {
                            create: d.profile.availability
                        }
                    }
                }
            }
        })
    }

    console.log('Seeding completed.')
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
