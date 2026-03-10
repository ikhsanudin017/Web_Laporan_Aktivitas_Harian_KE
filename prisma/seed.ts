import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hash password untuk semua user
  const hashedPassword = await bcrypt.hash('123456', 12)
  const adminPassword = await bcrypt.hash('12345', 12)

  const currentAnggitUser = await prisma.user.findUnique({
    where: { email: 'anggit@ksuke.com' }
  })

  const legacyMasAnggitUsers = await prisma.user.findMany({
    where: {
      role: 'MAS_ANGGIT',
      email: {
        not: 'anggit@ksuke.com'
      }
    }
  })

  for (const legacyMasAnggitUser of legacyMasAnggitUsers) {
    if (currentAnggitUser) {
      await prisma.dailyReport.updateMany({
        where: { userId: legacyMasAnggitUser.id },
        data: { userId: currentAnggitUser.id }
      })

      await prisma.user.delete({
        where: { id: legacyMasAnggitUser.id }
      })
    } else {
      await prisma.user.update({
        where: { id: legacyMasAnggitUser.id },
        data: {
          email: 'anggit@ksuke.com',
          name: 'Mas Anggit',
          password: hashedPassword
        }
      })
    }
  }

  // Create users
  const users = [
    {
      email: 'ikhsan',
      name: 'Admin Ikhsan',
      password: adminPassword,
      role: 'ADMIN' as const
    },
    {
      email: 'yuli@ksuke.com',
      name: 'Ustadz Yuli',
      password: hashedPassword,
      role: 'USTADZ_YULI' as const
    },
    {
      email: 'toha@ksuke.com',
      name: 'Bapak Toha',
      password: hashedPassword,
      role: 'BAPAK_TOHA' as const
    },
    {
      email: 'sayudi@ksuke.com',
      name: 'Bapak Sayudi',
      password: hashedPassword,
      role: 'BAPAK_SAYUDI' as const
    },
    {
      email: 'anggit@ksuke.com',
      name: 'Mas Anggit',
      password: hashedPassword,
      role: 'MAS_ANGGIT' as const
    },
    {
      email: 'arwan@ksuke.com',
      name: 'Bapak Arwan',
      password: hashedPassword,
      role: 'BAPAK_ARWAN' as const
    },
    {
      email: 'diah@ksuke.com',
      name: 'Bapak Diah Supriyanto',
      password: hashedPassword,
      role: 'BAPAK_DIAH' as const
    },
    {
      email: 'eka@ksuke.com',
      name: 'Mbak Eka',
      password: hashedPassword,
      role: 'MBAK_EKA' as const
    },
    {
      email: 'prasetyo@ksuke.com',
      name: 'Bapak Prasetyo Dani',
      password: hashedPassword,
      role: 'BAPAK_PRASETYO' as const
    },
    {
      email: 'giyarto@ksuke.com',
      name: 'Bapak Giyarto',
      password: hashedPassword,
      role: 'BAPAK_GIYARTO' as const
    }
  ]

  console.log('Creating users...')
  
  for (const userData of users) {
    try {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData
      })
      console.log(`Created user: ${user.name} (${user.email})`)
    } catch (error) {
      console.error(`Error creating user ${userData.email}:`, error)
    }
  }

  console.log('Seed completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
