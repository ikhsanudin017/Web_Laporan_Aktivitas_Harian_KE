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

// Islamic Corporate Color Palette
const COLORS = {
  primary: '005A2F',      // Dark Green (Islamic Corporate)
  secondary: '00A651',    // Medium Green
  accent: 'FFD700',       // Gold
  light: 'E8F5E8',        // Light Green
  white: 'FFFFFF',        // White
  text: '2D3748',         // Dark Gray
  border: 'CBD5E0'        // Light Gray
}

export const createStyledExcelExport = (options: ExcelExportOptions) => {
  const { title, subtitle, data, sheetName, filename, userInfo, dateRange } = options

  // Create enhanced header with logo placeholder and Islamic Corporate styling
  const logoRow = ['🕌', 'KOPERASI SERBA USAHA KRAP ENTREPRENEURSHIP', '', '', '', '', '', '', '🕌']
  const brandingRow = ['', '📈 SISTEM LAPORAN AKTIVITAS HARIAN 📈', '', '', '', '', '', '', '']
  
  const headerInfo = [
    logoRow,
    brandingRow,
    [''],
    ['🌟', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '🌟'],
    ['�', title.toUpperCase(), '', '', '', '', '', '', '📊'],
    ['🏢', subtitle, '', '', '', '', '', '', '🏢'],
    ['🌟', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '🌟'],
    [''],
    ['📋', userInfo?.name ? `Nama: ${userInfo.name}` : 'Nama: -', '', '', '', '', '', '', ''],
    ['👤', userInfo?.role ? `Role: ${userInfo.role.toUpperCase()}` : 'Role: -', '', '', '', '', '', '', ''],
    ['📅', dateRange ? `Periode: ${dateRange.start || 'Semua'} - ${dateRange.end || 'Semua'}` : 'Periode: Semua Data', '', '', '', '', '', '', ''],
    ['📊', `Total Laporan: ${data.length} laporan`, '', '', '', '', '', '', ''],
    ['🗓️', `Tanggal Export: ${new Date().toLocaleDateString('id-ID', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, '', '', '', '', '', '', ''],
    ['⏰', `Waktu Export: ${new Date().toLocaleTimeString('id-ID')}`, '', '', '', '', '', '', ''],
    [''],
    ['💰', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💰'],
    ['📈', '                    DATA AKTIVITAS HARIAN                    ', '', '', '', '', '', '', '📈'],
    ['💰', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💰'],
    [''] // Empty row before data
  ]

  // Calculate comprehensive totals for numeric fields
  const totals = {
    angsuran: data.reduce((sum, row) => sum + (row['Angsuran (Target) 🎯'] || 0), 0),
    fundingB2B: data.reduce((sum, row) => sum + (row['Funding B2B 🏢'] || 0), 0),
    fundingPersonal: data.reduce((sum, row) => sum + (row['Funding Personal 👤'] || 0), 0),
    survey: data.reduce((sum, row) => sum + (row['Survey 📋'] || 0), 0)
  }

  // Enhanced totals calculation
  const grandTotalFunding = totals.fundingB2B + totals.fundingPersonal
  const avgAngsuran = Math.round(totals.angsuran / (data.length || 1))
  const avgFunding = Math.round(grandTotalFunding / (data.length || 1))
  const avgSurvey = Math.round(totals.survey / (data.length || 1))

  // Combine header and data
  const worksheetData = [
    ...headerInfo,
    Object.keys(data[0] || {}), // Column headers
    ...data.map(row => Object.values(row))
  ]

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  // Enhanced column widths for better layout
  const columnWidths = Object.keys(data[0] || {}).map((key, index) => {
    if (key.includes('No')) return { wch: 8 }
    if (key.includes('Tanggal')) return { wch: 20 }
    if (key.includes('Angsuran') || key.includes('Target')) return { wch: 22 }
    if (key.includes('Kegiatan')) return { wch: 35 }
    if (key.includes('Funding B2B')) return { wch: 20 }
    if (key.includes('Funding Personal')) return { wch: 22 }
    if (key.includes('Survey')) return { wch: 18 }
    if (key.includes('Keterangan')) return { wch: 45 }
    if (key.includes('Waktu') || key.includes('Update')) return { wch: 28 }
    return { wch: 20 }
  })
  ws['!cols'] = columnWidths

  // Enhanced row heights for premium look
  const headerRowHeights = [
    { hpt: 40 }, // Logo row - extra large
    { hpt: 30 }, // Branding row - large
    { hpt: 15 }, // Empty
    { hpt: 25 }, // Separator with icons
    { hpt: 35 }, // Main Title - extra large
    { hpt: 28 }, // Subtitle - large
    { hpt: 25 }, // Separator with icons
    { hpt: 15 }, // Empty
    { hpt: 24 }, // Name
    { hpt: 24 }, // Role
    { hpt: 24 }, // Period
    { hpt: 24 }, // Total reports
    { hpt: 24 }, // Export date
    { hpt: 24 }, // Export time
    { hpt: 15 }, // Empty
    { hpt: 28 }, // Separator
    { hpt: 32 }, // Data section title - extra large
    { hpt: 28 }, // Separator
    { hpt: 15 }, // Empty
    { hpt: 35 }  // Column headers - extra large for visibility
  ]
  ws['!rows'] = headerRowHeights

  // Apply enhanced Islamic Corporate styled formatting with full column colors
  
  // Style logo and company row (Row 1) - FULL GREEN BACKGROUND
  const totalColCount = Math.max(Object.keys(data[0] || {}).length, 9)
  for (let col = 0; col < totalColCount; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 0, c: col })
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 14, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.primary } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: 'thick', color: { rgb: COLORS.accent } },
          bottom: { style: 'thick', color: { rgb: COLORS.accent } },
          left: { style: 'thick', color: { rgb: COLORS.accent } },
          right: { style: 'thick', color: { rgb: COLORS.accent } }
        }
      }
    }
  }
  
  // Style branding row (Row 2) - FULL SECONDARY GREEN
  for (let col = 0; col < totalColCount; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 1, c: col })
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 12, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.secondary } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: 'medium', color: { rgb: COLORS.primary } },
          bottom: { style: 'medium', color: { rgb: COLORS.primary } },
          left: { style: 'medium', color: { rgb: COLORS.primary } },
          right: { style: 'medium', color: { rgb: COLORS.primary } }
        }
      }
    }
  }

  // Style decorative star rows (Row 4 and 7) - FULL GOLD BACKGROUND
  [3, 6].forEach(rowIndex => {
    for (let col = 0; col < totalColCount; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: col })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, sz: 16, color: { rgb: COLORS.primary } },
          fill: { fgColor: { rgb: COLORS.accent } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: 'thick', color: { rgb: COLORS.primary } },
            bottom: { style: 'thick', color: { rgb: COLORS.primary } },
            left: { style: 'thick', color: { rgb: COLORS.primary } },
            right: { style: 'thick', color: { rgb: COLORS.primary } }
          }
        }
      }
    }
  })

  // Style main title (Row 5) - FULL PRIMARY GREEN
  for (let col = 0; col < totalColCount; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 4, c: col })
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 18, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.primary } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: 'thick', color: { rgb: COLORS.accent } },
          bottom: { style: 'thick', color: { rgb: COLORS.accent } },
          left: { style: 'thick', color: { rgb: COLORS.accent } },
          right: { style: 'thick', color: { rgb: COLORS.accent } }
        }
      }
    }
  }
  
  // Style subtitle (Row 6) - FULL SECONDARY GREEN
  for (let col = 0; col < totalColCount; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 5, c: col })
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 14, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.secondary } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: 'medium', color: { rgb: COLORS.accent } },
          bottom: { style: 'medium', color: { rgb: COLORS.accent } },
          left: { style: 'medium', color: { rgb: COLORS.accent } },
          right: { style: 'medium', color: { rgb: COLORS.accent } }
        }
      }
    }
  }

  // Style info rows (Rows 9-14) with enhanced Islamic Corporate design
  const infoRowColors = [COLORS.light, COLORS.white]
  for (let row = 8; row <= 13; row++) {
    for (let col = 0; col < 9; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, sz: 13, color: { rgb: COLORS.text } },
          fill: { fgColor: { rgb: infoRowColors[row % 2] } },
          alignment: { horizontal: col === 0 ? "center" : "left", vertical: "center" },
          border: {
            top: { style: 'thin', color: { rgb: COLORS.border } },
            bottom: { style: 'thin', color: { rgb: COLORS.border } },
            left: { style: 'thin', color: { rgb: COLORS.border } },
            right: { style: 'thin', color: { rgb: COLORS.border } }
          }
        }
      }
    }
  }

  // Style data section title (Row 17)
  for (let col = 0; col < 9; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: 16, c: col })
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 18, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.primary } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: 'thick', color: { rgb: COLORS.accent } },
          bottom: { style: 'thick', color: { rgb: COLORS.accent } },
          left: { style: 'thick', color: { rgb: COLORS.accent } },
          right: { style: 'thick', color: { rgb: COLORS.accent } }
        }
      }
    }
  }

  // Style column headers (Row 19) with premium Islamic Corporate theme
  const headerRowIndex = 19 // Row 20 (0-based)
  for (let col = 0; col < Object.keys(data[0] || {}).length; col++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col })
    if (ws[cellRef]) {
      ws[cellRef].s = {
        font: { bold: true, sz: 14, color: { rgb: COLORS.white } },
        fill: { fgColor: { rgb: COLORS.secondary } },
        alignment: { horizontal: "center", vertical: "center" },
        border: {
          top: { style: 'medium', color: { rgb: COLORS.primary } },
          bottom: { style: 'medium', color: { rgb: COLORS.primary } },
          left: { style: 'thin', color: { rgb: COLORS.border } },
          right: { style: 'thin', color: { rgb: COLORS.border } }
        }
      }
    }
  }

  // Style data rows with alternating colors for better readability
  for (let row = headerRowIndex + 1; row < headerRowIndex + 1 + data.length; row++) {
    const isEvenRow = (row - headerRowIndex) % 2 === 0
    const bgColor = isEvenRow ? COLORS.white : COLORS.light
    
    for (let col = 0; col < Object.keys(data[0] || {}).length; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { sz: 11, color: { rgb: COLORS.text } },
          fill: { fgColor: { rgb: bgColor } },
          alignment: { 
            horizontal: col === 0 ? "center" : "left", // Center align No. column
            vertical: "center" 
          },
          border: {
            top: { style: 'thin', color: { rgb: COLORS.border } },
            bottom: { style: 'thin', color: { rgb: COLORS.border } },
            left: { style: 'thin', color: { rgb: COLORS.border } },
            right: { style: 'thin', color: { rgb: COLORS.border } }
          }
        }
        
        // Special formatting for numeric columns
        const columnKey = Object.keys(data[0] || {})[col]
        if (columnKey && (columnKey.includes('Angsuran') || columnKey.includes('Funding') || columnKey.includes('Survey'))) {
          ws[cellRef].s.alignment.horizontal = "right"
          ws[cellRef].s.font.bold = true
          if (ws[cellRef].v > 0) {
            ws[cellRef].s.font.color = { rgb: COLORS.primary }
          }
        }
      }
    }
  }

  // Add comprehensive enhanced summary with premium Islamic Corporate styling
  const lastDataRow = headerRowIndex + data.length + 3
  
  const summaryData = [
    [''],
    ['💰', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💰'],
    ['📊', '                    RINGKASAN TOTAL AKTIVITAS                    ', '', '', '', '', '', '', '📊'],
    ['💰', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💰'],
    [''],
    ['🎯', `Total Angsuran (Target): ${totals.angsuran.toLocaleString('id-ID')} target`, '', '', '', '', '', '', ''],
    ['🏢', `Total Funding B2B: ${totals.fundingB2B.toLocaleString('id-ID')} nasabah`, '', '', '', '', '', '', ''],
    ['👤', `Total Funding Personal: ${totals.fundingPersonal.toLocaleString('id-ID')} nasabah`, '', '', '', '', '', '', ''],
    ['📋', `Total Survey: ${totals.survey.toLocaleString('id-ID')} survey`, '', '', '', '', '', '', ''],
    [''],
    ['💎', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💎'],
    ['💰', `GRAND TOTAL FUNDING: ${grandTotalFunding.toLocaleString('id-ID')} NASABAH`, '', '', '', '', '', '', '💰'],
    ['💎', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💎'],
    [''],
    ['📈', `Rata-rata Harian Angsuran: ${avgAngsuran.toLocaleString('id-ID')} target/hari`, '', '', '', '', '', '', ''],
    ['📊', `Rata-rata Harian Funding: ${avgFunding.toLocaleString('id-ID')} nasabah/hari`, '', '', '', '', '', '', ''],
    ['🔍', `Rata-rata Harian Survey: ${avgSurvey.toLocaleString('id-ID')} survey/hari`, '', '', '', '', '', '', ''],
    [''],
    ['🌟', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '🌟'],
    ['📋', `Periode Laporan: ${data.length} hari kerja`, '', '', '', '', '', '', ''],
    ['⏱️', `Rata-rata Produktivitas: ${Math.round((grandTotalFunding + totals.survey) / (data.length || 1))} aktivitas/hari`, '', '', '', '', '', '', ''],
    ['✅', `Laporan digenerate pada: ${new Date().toLocaleString('id-ID')}`, '', '', '', '', '', '', ''],
    ['🏢', `KOPERASI SERBA USAHA KRAP ENTREPRENEURSHIP (KSUKE)`, '', '', '', '', '', '', ''],
    ['🌟', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '🌟']
  ]

  // Add enhanced summary to worksheet with premium styling
  summaryData.forEach((row, index) => {
    for (let col = 0; col < 9; col++) {
      const cellRef = XLSX.utils.encode_cell({ r: lastDataRow + index, c: col })
      ws[cellRef] = { v: row[col] || '', t: 's' }
      
      // Style summary title (index 2)
      if (index === 2) {
        ws[cellRef].s = {
          font: { bold: true, sz: 18, color: { rgb: COLORS.white } },
          fill: { fgColor: { rgb: COLORS.primary } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: 'thick', color: { rgb: COLORS.accent } },
            bottom: { style: 'thick', color: { rgb: COLORS.accent } },
            left: { style: 'thick', color: { rgb: COLORS.accent } },
            right: { style: 'thick', color: { rgb: COLORS.accent } }
          }
        }
      }
      // Style individual totals (index 5-8)
      else if (index >= 5 && index <= 8) {
        ws[cellRef].s = {
          font: { bold: true, sz: 13, color: { rgb: COLORS.primary } },
          fill: { fgColor: { rgb: COLORS.light } },
          alignment: { horizontal: col === 0 ? "center" : "left", vertical: "center" },
          border: {
            top: { style: 'thin', color: { rgb: COLORS.border } },
            bottom: { style: 'thin', color: { rgb: COLORS.border } },
            left: { style: col === 0 ? 'medium' : 'thin', color: { rgb: col === 0 ? COLORS.secondary : COLORS.border } },
            right: { style: 'thin', color: { rgb: COLORS.border } }
          }
        }
      }
      // Style grand total (index 11)
      else if (index === 11) {
        ws[cellRef].s = {
          font: { bold: true, sz: 16, color: { rgb: COLORS.white } },
          fill: { fgColor: { rgb: COLORS.accent.replace('#', '') } },
          alignment: { horizontal: "center", vertical: "center" },
          border: {
            top: { style: 'thick', color: { rgb: COLORS.primary } },
            bottom: { style: 'thick', color: { rgb: COLORS.primary } },
            left: { style: 'thick', color: { rgb: COLORS.primary } },
            right: { style: 'thick', color: { rgb: COLORS.primary } }
          }
        }
      }
      // Style averages (index 14-16)
      else if (index >= 14 && index <= 16) {
        ws[cellRef].s = {
          font: { bold: true, sz: 12, color: { rgb: COLORS.text } },
          fill: { fgColor: { rgb: COLORS.white } },
          alignment: { horizontal: col === 0 ? "center" : "left", vertical: "center" },
          border: {
            top: { style: 'thin', color: { rgb: COLORS.border } },
            bottom: { style: 'thin', color: { rgb: COLORS.border } },
            left: { style: 'thin', color: { rgb: COLORS.border } },
            right: { style: 'thin', color: { rgb: COLORS.border } }
          }
        }
      }
      // Style footer info (index 19-22)
      else if (index >= 19 && index <= 22) {
        ws[cellRef].s = {
          font: { bold: true, sz: 11, color: { rgb: index === 22 ? COLORS.white : COLORS.secondary } },
          fill: { fgColor: { rgb: index === 22 ? COLORS.primary : COLORS.white } },
          alignment: { horizontal: "center", vertical: "center" },
          border: index === 22 ? {
            top: { style: 'thick', color: { rgb: COLORS.accent } },
            bottom: { style: 'thick', color: { rgb: COLORS.accent } },
            left: { style: 'thick', color: { rgb: COLORS.accent } },
            right: { style: 'thick', color: { rgb: COLORS.accent } }
          } : undefined
        }
      }
    }
  })

  // Enhanced merge cells for premium visual hierarchy and logo placement
  ws['!merges'] = [
    // Logo and branding section merges
    { s: { r: 0, c: 1 }, e: { r: 0, c: totalColCount - 2 } }, // Logo row (skip first and last icon columns)
    { s: { r: 1, c: 1 }, e: { r: 1, c: totalColCount - 2 } }, // Branding row
    
    // Header section merges
    { s: { r: 4, c: 1 }, e: { r: 4, c: totalColCount - 2 } }, // Main title
    { s: { r: 5, c: 1 }, e: { r: 5, c: totalColCount - 2 } }, // Subtitle
    
    // Info section merges
    { s: { r: 8, c: 1 }, e: { r: 8, c: totalColCount - 1 } }, // Name info
    { s: { r: 9, c: 1 }, e: { r: 9, c: totalColCount - 1 } }, // Role info
    { s: { r: 10, c: 1 }, e: { r: 10, c: totalColCount - 1 } }, // Period info
    { s: { r: 11, c: 1 }, e: { r: 11, c: totalColCount - 1 } }, // Total reports
    { s: { r: 12, c: 1 }, e: { r: 12, c: totalColCount - 1 } }, // Export date
    { s: { r: 13, c: 1 }, e: { r: 13, c: totalColCount - 1 } }, // Export time
    
    // Data section title merge
    { s: { r: 16, c: 1 }, e: { r: 16, c: totalColCount - 2 } }, // Data section title
    
    // Summary section merges
    { s: { r: lastDataRow + 2, c: 1 }, e: { r: lastDataRow + 2, c: totalColCount - 2 } }, // Summary title
    { s: { r: lastDataRow + 11, c: 1 }, e: { r: lastDataRow + 11, c: totalColCount - 2 } }, // Grand total
    { s: { r: lastDataRow + 21, c: 1 }, e: { r: lastDataRow + 21, c: totalColCount - 2 } }, // Generate info
    { s: { r: lastDataRow + 22, c: 1 }, e: { r: lastDataRow + 22, c: totalColCount - 2 } }, // Company name
  ]

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Enhanced file naming with better formatting
  const now = new Date()
  const dateStr = now.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: '2-digit', 
    day: '2-digit'
  }).replace(/\//g, '-')
  const timeStr = now.toLocaleTimeString('id-ID', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit'
  }).replace(/:/g, '-')
  
  let finalFilename = filename
    .replace('{date}', dateStr)
    .replace('{time}', timeStr)
  
  // Ensure filename has .xlsx extension
  if (!finalFilename.toLowerCase().endsWith('.xlsx')) {
    finalFilename += '.xlsx'
  }
  
  XLSX.writeFile(wb, finalFilename)
  return finalFilename
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
