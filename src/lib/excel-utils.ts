import * as XLSX from 'xlsx'

export interface ExcelExportOptions {
  title: string
  subtitle: string
  data: any[]
  sheetName: string
  filename: string
  userInfo?: {
    name: string
    role: string
  }
  dateRange?: {
    start?: string
    end?: string
  }
}

export const createStyledExcelExport = (options: ExcelExportOptions) => {
  const { title, subtitle, data, sheetName, filename, userInfo, dateRange } = options

  // Create header information with logo reference and better formatting
  const headerInfo = [
    ['=========================================================='],
    ['🏢 ' + title],
    ['   ' + subtitle],
    ['=========================================================='],
    [''],
    userInfo?.name ? [`📋 Nama: ${userInfo.name}`] : [''],
    userInfo?.role ? [`👤 Role: ${userInfo.role}`] : [''],
    dateRange ? [`📅 Periode: ${dateRange.start || 'Semua'} - ${dateRange.end || 'Semua'}`] : [''],
    [`📊 Total Laporan: ${data.length} laporan`],
    [`🗓️ Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
    [''],
    ['=========================================================='],
    ['                    DATA AKTIVITAS                    '],
    ['=========================================================='],
    [''] // Empty row before data
  ]

  // Combine header and data
  const worksheetData = [
    ...headerInfo,
    Object.keys(data[0] || {}), // Column headers
    ...data.map(row => Object.values(row))
  ]

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths based on data type
  const columnWidths = Object.keys(data[0] || {}).map((key, index) => {
    if (key.includes('No')) return { wch: 6 }
    if (key.includes('Tanggal')) return { wch: 15 }
    if (key.includes('Angsuran') || key.includes('Target')) return { wch: 18 }
    if (key.includes('Kegiatan')) return { wch: 25 }
    if (key.includes('Funding')) return { wch: 15 }
    if (key.includes('Survey')) return { wch: 12 }
    if (key.includes('Keterangan')) return { wch: 35 }
    if (key.includes('Waktu') || key.includes('Update')) return { wch: 22 }
    return { wch: 15 }
  })
  ws['!cols'] = columnWidths

  // Set row heights for header
  const headerRowHeights = [
    { hpt: 20 }, // Separator
    { hpt: 25 }, // Title row 1  
    { hpt: 20 }, // Title row 2
    { hpt: 20 }, // Separator
    { hpt: 12 }, // Empty
    { hpt: 18 }, // Info rows...
    { hpt: 18 },
    { hpt: 18 },
    { hpt: 18 },
    { hpt: 18 },
    { hpt: 12 }, // Empty
    { hpt: 20 }, // Separator
    { hpt: 18 }, // Data title
    { hpt: 20 }, // Separator
    { hpt: 12 }, // Empty
    { hpt: 22 }  // Column headers
  ]
  ws['!rows'] = headerRowHeights

  // Apply basic styling
  // Style title rows
  if (ws['A2']) {
    ws['A2'].s = {
      font: { bold: true, sz: 14 },
      alignment: { horizontal: "center", vertical: "center" }
    }
  }
  
  if (ws['A3']) {
    ws['A3'].s = {
      font: { bold: true, sz: 12 },
      alignment: { horizontal: "center", vertical: "center" }
    }
  }

  // Style info rows
  for (let row = 6; row <= 10; row++) {
    const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: 0 })
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 11 },
        alignment: { horizontal: "left", vertical: "center" }
      }
    }
  }

  // Style column headers
  const headerRowIndex = 15 // Row 16 (0-based)
  for (let col = 0; col < Object.keys(data[0] || {}).length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col })
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" }
      }
    }
  }

  // Add summary if data has numeric fields
  const lastDataRow = headerRowIndex + data.length + 2
  const numericFields = Object.keys(data[0] || {}).filter(key => 
    key.includes('Angsuran') || key.includes('Funding') || key.includes('Survey')
  )

  if (numericFields.length > 0) {
    const summaryData = [
      [''],
      ['=========================================================='],
      ['                     RINGKASAN                        '],
      ['=========================================================='],
      ...numericFields.map(field => [
        `Total ${field}: ${data.reduce((sum, row) => sum + (row[field] || 0), 0)}`
      ]),
      ['==========================================================']
    ]

    // Add summary to worksheet
    summaryData.forEach((row, index) => {
      const cellRef = XLSX.utils.encode_cell({ r: lastDataRow + index, c: 0 })
      ws[cellRef] = { v: row[0], t: 's' }
      if (index === 2) { // Title row
        ws[cellRef].s = {
          font: { bold: true, sz: 12 },
          alignment: { horizontal: "center", vertical: "center" }
        }
      } else if (index >= 4 && index < summaryData.length - 1) { // Summary rows
        ws[cellRef].s = {
          font: { bold: true, sz: 10 },
          alignment: { horizontal: "left", vertical: "center" }
        }
      }
    })
  }

  // Merge title cells for better appearance
  const colCount = Object.keys(data[0] || {}).length || 5
  ws['!merges'] = [
    { s: { r: 1, c: 0 }, e: { r: 1, c: colCount - 1 } }, // Title row 1
    { s: { r: 2, c: 0 }, e: { r: 2, c: colCount - 1 } }, // Title row 2
    { s: { r: 12, c: 0 }, e: { r: 12, c: colCount - 1 } } // Data section title
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Save file with formatted name
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID').replace(/\//g, '-')
  const timeStr = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '-')
  const finalFilename = filename.replace('{date}', dateStr).replace('{time}', timeStr)
  
  XLSX.writeFile(wb, finalFilename)
}

export const formatDataForExcel = (reports: any[], includeTimestamps = false) => {
  return reports.map((report, index) => {
    const reportData = report.reportData || {}
    const baseData = {
      'No.': index + 1,
      'Tanggal 📅': new Date(report.date).toLocaleDateString('id-ID'),
      'Angsuran (Target) 🎯': reportData.angsuran || 0,
      'Kegiatan 📝': reportData.kegiatan || '',
      'Funding B2B 🏢': reportData.fundingB2B || 0,
      'Funding Personal 👤': reportData.fundingPersonal || 0,
      'Survey 📋': reportData.survey || 0,
      'Keterangan 💬': reportData.keterangan || '',
    }

    if (includeTimestamps) {
      return {
        ...baseData,
        'Waktu Input ⏰': new Date(report.createdAt || report.date).toLocaleString('id-ID'),
        'Terakhir Update 🔄': new Date(report.updatedAt || report.createdAt || report.date).toLocaleString('id-ID')
      }
    }

    return {
      ...baseData,
      'Waktu Input ⏰': new Date(report.createdAt || report.date).toLocaleString('id-ID')
    }
  })
}
