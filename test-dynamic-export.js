const { FORM_CONFIGS } = require('./src/lib/form-configs.ts')

// Test function untuk menampilkan field yang tersedia untuk setiap user
function testDynamicExport() {
  console.log('🧪 Testing Dynamic Excel Export Configuration')
  console.log('============================================')
  
  Object.entries(FORM_CONFIGS).forEach(([roleName, config]) => {
    console.log(`\n👤 Role: ${roleName}`)
    console.log(`📋 Title: ${config.title}`)
    console.log(`🏷️  Fields:`)
    
    config.fields.forEach((field, index) => {
      console.log(`   ${index + 1}. ${field.label} (${field.name}) - Type: ${field.type}`)
    })
    
    console.log(`📊 Total Fields: ${config.fields.length}`)
    console.log('----------------------------------------')
  })
  
  // Test contoh data export untuk Bapak Toha
  console.log('\n🎯 Example for BAPAK_TOHA:')
  const tohaConfig = FORM_CONFIGS.BAPAK_TOHA
  console.log('Expected Excel columns:')
  console.log('1. No.')
  console.log('2. Tanggal')
  tohaConfig.fields.forEach((field, index) => {
    console.log(`${index + 3}. ${field.label}`)
  })
  console.log(`${tohaConfig.fields.length + 3}. Waktu Input`)
  
  console.log('\n🎯 Example for BAPAK_ARWAN:')
  const arwanConfig = FORM_CONFIGS.BAPAK_ARWAN
  console.log('Expected Excel columns:')
  console.log('1. No.')
  console.log('2. Tanggal')
  arwanConfig.fields.forEach((field, index) => {
    console.log(`${index + 3}. ${field.label}`)
  })
  console.log(`${arwanConfig.fields.length + 3}. Waktu Input`)
}

testDynamicExport()
