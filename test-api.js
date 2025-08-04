// Test login and save functionality
async function testAPI() {
  console.log('🧪 Testing API Endpoints')
  console.log('========================')
  
  try {
    // Test 1: Admin Login
    console.log('\n1️⃣ Testing admin login...')
    const loginResponse = await fetch('http://localhost:3002/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@ksuke.com',
        password: 'admin123'
      })
    })
    
    const loginData = await loginResponse.json()
    console.log(`   Status: ${loginResponse.status}`)
    console.log(`   Response: ${JSON.stringify(loginData, null, 2)}`)
    
    if (loginResponse.ok) {
      const token = loginData.token
      console.log('   ✅ Login successful!')
      
      // Test 2: Save Report
      console.log('\n2️⃣ Testing save report...')
      const saveResponse = await fetch('http://localhost:3002/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: '2025-08-04',
          reportData: {
            waktu_mulai: '08:00',
            waktu_selesai: '17:00',
            aktivitas: 'Test aktivitas dari API',
            lokasi: 'Test lokasi',
            keterangan: 'Test keterangan'
          }
        })
      })
      
      const saveData = await saveResponse.json()
      console.log(`   Status: ${saveResponse.status}`)
      console.log(`   Response: ${JSON.stringify(saveData, null, 2)}`)
      
      if (saveResponse.ok) {
        console.log('   ✅ Save successful!')
      } else {
        console.log('   ❌ Save failed!')
      }
    } else {
      console.log('   ❌ Login failed!')
    }
    
    // Test 3: Mock Token (User dropdown)
    console.log('\n3️⃣ Testing mock token save...')
    const mockSaveResponse = await fetch('http://localhost:3002/api/reports', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer mock-token-1'
      },
      body: JSON.stringify({
        date: '2025-08-04',
        reportData: {
          waktu_mulai: '08:00',
          waktu_selesai: '17:00',
          aktivitas: 'Test aktivitas dari mock user',
          lokasi: 'Test lokasi',
          keterangan: 'Test keterangan'
        }
      })
    })
    
    const mockSaveData = await mockSaveResponse.json()
    console.log(`   Status: ${mockSaveResponse.status}`)
    console.log(`   Response: ${JSON.stringify(mockSaveData, null, 2)}`)
    
    if (mockSaveResponse.ok) {
      console.log('   ✅ Mock save successful!')
    } else {
      console.log('   ❌ Mock save failed!')
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error)
  }
}

testAPI()
