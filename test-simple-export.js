const { createDynamicExcelExport } = require('./src/lib/excel-utils');
const fs = require('fs');

// Test data yang mirip dengan data real
const testData = [
  {
    id: '1',
    date: '2025-08-04',
    createdAt: '2025-08-04T10:30:45Z',
    reportData: {
      'marketing_funding_jumlah': 5,
      'marketing_tele_call': 10,
      'marketing_prospek_visit': 3,
      'marketing_nasabah_baru': 2
    },
    user: {
      name: 'Bapak Arwan',
      email: 'arwan@ksuke.com',
      role: 'USER'
    }
  },
  {
    id: '2',
    date: '2025-08-03',
    createdAt: '2025-08-03T14:20:15Z',
    reportData: {
      'marketing_funding_jumlah': 3,
      'marketing_tele_call': 8,
      'marketing_prospek_visit': 1,
      'marketing_nasabah_baru': 1
    },
    user: {
      name: 'Bapak Arwan',
      email: 'arwan@ksuke.com',
      role: 'USER'
    }
  }
];

console.log('🧪 Testing simple Excel export...');

try {
  const result = createDynamicExcelExport({
    title: 'LAPORAN AKTIVITAS HARIAN',
    subtitle: 'Data Laporan - BAPAK ARWAN',
    data: testData,
    sheetName: 'Laporan Saya',
    filename: 'Laporan_Bapak_Arwan',
    userInfo: {
      name: 'Bapak Arwan',
      role: 'USER'
    }
  });

  console.log('✅ Excel export successful!');
  console.log('📊 Filename:', result.filename);
  console.log('📦 Buffer size:', result.buffer.length, 'bytes');
  
  // Save to file for testing
  fs.writeFileSync('test-simple-export.xlsx', result.buffer);
  console.log('💾 Test file saved: test-simple-export.xlsx');
  
} catch (error) {
  console.error('❌ Error:', error);
}
