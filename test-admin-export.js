// Test admin Excel export functionality
const { createDynamicExcelExport } = require('./src/lib/excel-utils')
const { FORM_CONFIGS } = require('./src/lib/form-configs')

// Mock data for testing
const testReports = [
  {
    id: '1',
    date: '2025-08-04',
    reportData: {
      angsuran: 5,
      kegiatan: 'Marketing ke nasabah baru',
      fundingB2B: 2,
      fundingPersonal: 3,
      survey: 1,
      keterangan: 'Berhasil mendapat 3 nasabah baru'
    },
    createdAt: '2025-08-04T10:00:00Z',
    user: {
      name: 'Bapak Sayudi',
      role: 'BAPAK_SAYUDI'
    }
  },
  {
    id: '2',
    date: '2025-08-04',
    reportData: {
      aktivitasHarian: 'Mengajar dan memberikan ceramah kepada jamaah tentang pentingnya menabung dan berinvestasi yang halal'
    },
    createdAt: '2025-08-04T14:00:00Z',
    user: {
      name: 'Ustadz Yuli',
      role: 'USTADZ_YULI'
    }
  },
  {
    id: '3',
    date: '2025-08-04',
    reportData: {
      aktivitasHarian: 'Supervisi lapangan dan koordinasi dengan tim cabang untuk evaluasi target bulanan'
    },
    createdAt: '2025-08-04T16:00:00Z',
    user: {
      name: 'Bapak Toha',
      role: 'BAPAK_TOHA'
    }
  }
]

console.log('Testing admin export with sample data...')
console.log('Available FORM_CONFIGS:', Object.keys(FORM_CONFIGS))

try {
  createDynamicExcelExport({
    title: 'LAPORAN AKTIVITAS HARIAN - ADMIN TEST',
    subtitle: `Test Export - ${testReports.length} laporan`,
    data: testReports,
    sheetName: 'Test Admin Export',
    filename: 'Test_Admin_Export',
    userInfo: {
      name: 'Administrator',
      role: 'ADMIN'
    }
  })
  
  console.log('✅ Admin export test completed successfully!')
} catch (error) {
  console.error('❌ Admin export test failed:', error.message)
}
