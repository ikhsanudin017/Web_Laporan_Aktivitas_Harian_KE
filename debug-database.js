const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function debugDatabase() {
  console.log('🔍 Database Debug Information')
  console.log('================================')
  
  try {
    // Check users
    const users = await prisma.user.findMany()
    console.log('\n👥 Users in database:')
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Role: ${user.role}`)
    })
    
    // Check admin user specifically
    const admin = await prisma.user.findFirst({
      where: { role: 'ADMIN' }
    })
    
    if (admin) {
      console.log('\n🔑 Admin User Found:')
      console.log(`  Name: ${admin.name}`)
      console.log(`  Email: ${admin.email}`)
      console.log(`  Role: ${admin.role}`)
      console.log(`  Password Hash: ${admin.password.substring(0, 20)}...`)
      
      // Test password verification
      const testPassword = 'admin123'
      const isValid = await bcrypt.compare(testPassword, admin.password)
      console.log(`  Password '${testPassword}' valid: ${isValid}`)
    } else {
      console.log('\n❌ No admin user found!')
    }
    
    // Check reports
    const reportCount = await prisma.dailyReport.count()
    console.log(`\n📊 Total reports in database: ${reportCount}`)
    
    // Check environment
    console.log('\n🌍 Environment Variables:')
    console.log(`  DATABASE_URL: ${process.env.DATABASE_URL}`)
    console.log(`  JWT_SECRET: ${process.env.JWT_SECRET ? 'Set' : 'Not set'}`)
    console.log(`  NODE_ENV: ${process.env.NODE_ENV}`)
    
  } catch (error) {
    console.error('❌ Database connection error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

debugDatabase()
