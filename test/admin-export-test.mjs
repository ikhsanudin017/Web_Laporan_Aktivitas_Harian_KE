import { createDynamicExcelExport } from '../src/lib/excel-utils.js'

// Mock test data
const testData = [
  {
    id: '1',
    date: '2025-08-04',
    reportData: {
      angsuran: 5,
      fundingB2B: 2,
      fundingPersonal: 3,
      survey: 1,
      kegiatan: 'Marketing ke nasabah',
      keterangan: 'Berhasil dapat 3 nasabah'
    },
    user: { name: 'Bapak Sayudi', role: 'BAPAK_SAYUDI' },
    createdAt: '2025-08-04T10:00:00Z'
  },
  {
    id: '2', 
    date: '2025-08-04',
    reportData: {
      aktivitasHarian: 'Ceramah dan mengajar jamaah'
    },
    user: { name: 'Ustadz Yuli', role: 'USTADZ_YULI' },
    createdAt: '2025-08-04T14:00:00Z'
  }
]

console.log('Testing admin export...')

try {
  createDynamicExcelExport({
    title: 'Test Admin Export',
    subtitle: 'Data testing',
    data: testData,
    sheetName: 'Test',
    filename: 'test_admin_export',
    userInfo: { name: 'Admin', role: 'ADMIN' }
  })
  console.log('Export test successful!')
} catch (error) {
  console.error('Export test failed:', error)
}
