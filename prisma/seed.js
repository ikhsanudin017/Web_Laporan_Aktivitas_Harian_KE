const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  try {
    console.log('🌱 Starting database seeding...')
    
    // Hash password untuk semua user
    const hashedPassword = await bcrypt.hash('123456', 12)
    const adminPassword = await bcrypt.hash('12345', 12)

    // Create users
    const users = [
      {
        email: 'ikhsan',
        name: 'Admin Ikhsan',
        password: adminPassword,
        role: 'ADMIN'
      },
      {
        email: 'yuli@ksuke.com',
        name: 'Ustadz Yuli',
        password: hashedPassword,
        role: 'USTADZ_YULI'
      },
      {
        email: 'toha@ksuke.com',
        name: 'Bapak Toha',
        password: hashedPassword,
        role: 'BAPAK_TOHA'
      },
      {
        email: 'sayudi@ksuke.com',
        name: 'Bapak Sayudi',
        password: hashedPassword,
        role: 'BAPAK_SAYUDI'
      },
      {
        email: 'winarno@ksuke.com',
        name: 'Bpk Winarno',
        password: hashedPassword,
        role: 'BPK_WINARNO'
      },
      {
        email: 'arwan@ksuke.com',
        name: 'Bapak Arwan',
        password: hashedPassword,
        role: 'BAPAK_ARWAN'
      },
    {
      email: 'diah@ksuke.com',
      name: 'Bapak Diah Supriyanto',
      password: hashedPassword,
      role: 'BAPAK_DIAH'
    },
    {
      email: 'eka@ksuke.com',
      name: 'Mbak Eka',
      password: hashedPassword,
      role: 'MBAK_EKA'
    },
    {
      email: 'prasetyo@ksuke.com',
      name: 'Bapak Prasetyo Dani',
      password: hashedPassword,
      role: 'BAPAK_PRASETYO'
      },
      {
        email: 'giyarto@ksuke.com',
        name: 'Bapak Giyarto',
        password: hashedPassword,
        role: 'BAPAK_GIYARTO'
      }
    ]

    // Upsert each user
    for (const userData of users) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      })
      console.log(`✅ User created/updated: ${user.name} (${user.email})`)
    }

    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error during seeding:', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
