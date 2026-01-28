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

    const dentists = [
        {
            name: 'Dr. Sarah Wilson',
            email: 'sarah.wilson@example.com',
            image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=400&h=400',
            profile: {
                specialty: 'Cosmetic Dentist',
                location: 'Downtown Dental, NY',
                rating: 4.9,
                reviewCount: 128,
                experienceYears: 12,
                about: 'Dr. Sarah Wilson is a board-certified cosmetic dentist with over 12 years of experience in creating beautiful, healthy smiles. She specializes in advanced aesthetic procedures and is committed to providing personalized, high-quality care to each of her patients.',
                education: 'DDS from NYU College of Dentistry, Residency at Mount Sinai Hospital',
                priceFrom: 80,
                services: [
                    { name: 'Dental Checkup', price: 80, duration: 30 },
                    { name: 'Teeth Whitening', price: 250, duration: 60 },
                    { name: 'Porcelain Veneers', price: 1200, duration: 90 },
                ],
                availability: [
                    { dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
                    { dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
                    { dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
                    { dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
                    { dayOfWeek: 5, startTime: '09:00', endTime: '15:00' },
                ]
            }
        },
        {
            name: 'Dr. Michael Chen',
            email: 'michael.chen@example.com',
            image: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=400&h=400',
            profile: {
                specialty: 'Orthodontist',
                location: 'Smile Studio, Brooklyn',
                rating: 4.8,
                reviewCount: 95,
                experienceYears: 8,
                about: 'Dr. Michael Chen is dedicated to helping patients achieve perfectly aligned smiles using the latest orthodontic technologies. He is an Invisalign Diamond Provider and has successfully treated hundreds of complex cases.',
                education: 'DMD from University of Pennsylvania, Orthodontics Specialty at Columbia University',
                priceFrom: 100,
                services: [
                    { name: 'Orthodontic Consultation', price: 100, duration: 45 },
                    { name: 'Invisalign Treatment', price: 3500, duration: 60 },
                    { name: 'Braces Adjustment', price: 150, duration: 30 },
                ],
                availability: [
                    { dayOfWeek: 1, startTime: '10:00', endTime: '19:00' },
                    { dayOfWeek: 2, startTime: '10:00', endTime: '19:00' },
                    { dayOfWeek: 4, startTime: '10:00', endTime: '19:00' },
                    { dayOfWeek: 6, startTime: '09:00', endTime: '14:00' },
                ]
            }
        },
        {
            name: 'Dr. Emily Rodriguez',
            email: 'emily.rodriguez@example.com',
            image: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=400&h=400',
            profile: {
                specialty: 'Pediatric Dentist',
                location: 'Kids Care, Queens',
                rating: 5.0,
                reviewCount: 210,
                experienceYears: 15,
                about: 'Dr. Emily Rodriguez loves working with children and making their dental visits fun and stress-free. She focuses on preventive care and education to ensure a lifetime of healthy smiles for her young patients.',
                education: 'DDS from UCLA School of Dentistry, Pediatric Residency at Children\'s Hospital of Philadelphia',
                priceFrom: 70,
                services: [
                    { name: 'Child Dental Cleaning', price: 70, duration: 30 },
                    { name: 'Fluoride Treatment', price: 40, duration: 15 },
                    { name: 'Dental Sealants', price: 50, duration: 20 },
                ],
                availability: [
                    { dayOfWeek: 1, startTime: '08:00', endTime: '16:00' },
                    { dayOfWeek: 2, startTime: '08:00', endTime: '16:00' },
                    { dayOfWeek: 3, startTime: '08:00', endTime: '16:00' },
                    { dayOfWeek: 4, startTime: '08:00', endTime: '16:00' },
                    { dayOfWeek: 5, startTime: '08:00', endTime: '16:00' },
                ]
            }
        }
    ]

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
