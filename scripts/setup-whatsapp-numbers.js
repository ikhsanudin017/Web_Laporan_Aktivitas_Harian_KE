const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

// Mapping nomor WhatsApp berdasarkan role
const whatsappNumbers = {
  'BAPAK_SAYUDI': '6281579099992',
  'USTADZ_YULI': '6282138957274', 
  'BAPAK_TOHA': '6281578585162',
  'BAPAK_PRASETYO': '6281325919175',
  'BAPAK_DIAH': '6285655543883',
  'BAPAK_ARWAN': '6287803894839',
  'BAPAK_GIYARTO': '6285879824874',
  'BPK_WINARNO': '6288137568832',
  'ADMIN': '6289630988257'
}

async function setupWhatsAppNumbers() {
  console.log('🔄 Setting up WhatsApp numbers for users...')
  
  let successCount = 0
  let failCount = 0
  
  for (const [role, whatsapp] of Object.entries(whatsappNumbers)) {
    try {
      const result = await prisma.user.updateMany({
        where: { role: role },
        data: { whatsapp: whatsapp }
      })
      
      console.log(`✅ Updated ${role}: ${whatsapp} (${result.count} users)`)
      successCount++
    } catch (error) {
      console.log(`❌ Error updating ${role}:`)
      console.log(error.message)
      failCount++
    }
  }
  
  console.log('\n📊 Summary:')
  console.log(`Total roles processed: ${Object.keys(whatsappNumbers).length}`)
  console.log(`Successfully updated: ${successCount}`)
  console.log(`Failed: ${failCount}`)
  
  await prisma.$disconnect()
  console.log('\n🎉 WhatsApp numbers setup completed!')
}

setupWhatsAppNumbers().catch(console.error)
