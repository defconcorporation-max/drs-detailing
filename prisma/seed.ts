import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
    console.log('Seeding database...')

    // Create Admin User
    const adminEmail = 'admin@drs.com'
    const existingAdmin = await prisma.user.findUnique({ where: { email: adminEmail } })

    if (!existingAdmin) {
        await prisma.user.create({
            data: {
                email: adminEmail,
                name: 'DRS Admin',
                password: 'admin',
                role: 'ADMIN',
            }
        })
        console.log('Admin user created')
    }

    // Initialize Default Services (Optional - User might want completely empty, 
    // but usually a blank software comes with standard services examples or empty. 
    // "dont put fake data in".
    // I will leave services empty, user can add them via the new "Manage Services" UI I will build.

    // Create ONE Employee for Admin to test Team view?
    // User said "first data should be empty". 
    // Safer to create just Admin.

    console.log('Database seeded with Admin only.')
}

main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })
