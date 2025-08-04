import * as XLSX from 'xlsx'
import { FORM_CONFIGS } from './form-configs'

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

// KSU KE Modern Web Theme Colors - Professional & Keren
const KSU_COLORS = {
  // Modern Header Colors
  primaryBlue: '2563EB',       // Modern Blue untuk header utama
  gradientStart: '3B82F6',     // Gradient start blue
  gradientEnd: '1D4ED8',       // Gradient end blue
  
  // KSU KE Brand Colors (Enhanced)
  brightOrange: 'F97316',      // Modern Orange KSU KE
  emeraldGreen: '10B981',      // Modern Green KSU KE
  forestGreen: '059669',       // Dark Green accent
  
  // Analytics Colors (Modern Palette)
  indigoAnalytics: '6366F1',   // Indigo untuk analytics
  violetTotal: '8B5CF6',       // Violet untuk total
  cyanAverage: '06B6D4',       // Cyan untuk rata-rata
  
  // Supporting Modern Colors
  white: 'FFFFFF',
  slate900: '0F172A',          // Dark text
  slate100: 'F1F5F9',         // Light background
  slate200: 'E2E8F0',         // Border
  slate300: 'CBD5E1',         // Medium border
  emerald50: 'ECFDF5',        // Light green background
  blue50: 'EFF6FF',           // Light blue background
  amber100: 'FEF3C7'          // Light amber for alternating
}

// Style untuk logo area (baris 1-2) - Modern Blue Gradient
const getLogoAreaStyle = () => ({
  fill: {
    fgColor: { rgb: KSU_COLORS.emeraldGreen }
  },
  font: {
    color: { rgb: KSU_COLORS.white },
    bold: true,
    sz: 14
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center'
  },
  border: {
    top: { style: 'thick', color: { rgb: KSU_COLORS.forestGreen } },
    bottom: { style: 'thick', color: { rgb: KSU_COLORS.forestGreen } },
    left: { style: 'thick', color: { rgb: KSU_COLORS.forestGreen } },
    right: { style: 'thick', color: { rgb: KSU_COLORS.forestGreen } }
  }
})

// Style untuk header kolom modern (ganti merah dengan blue modern)
const getColumnHeaderStyle = () => ({
  fill: {
    fgColor: { rgb: KSU_COLORS.primaryBlue }
  },
  font: {
    color: { rgb: KSU_COLORS.white },
    bold: true,
    sz: 11
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center'
  },
  border: {
    top: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    bottom: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    left: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    right: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } }
  }
})

// Style untuk analytics summary (indigo modern)
const getAnalyticsHeaderStyle = () => ({
  fill: {
    fgColor: { rgb: KSU_COLORS.indigoAnalytics }
  },
  font: {
    color: { rgb: KSU_COLORS.white },
    bold: true,
    sz: 12
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center'
  },
  border: {
    top: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    bottom: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    left: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    right: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } }
  }
})

// Style untuk total (violet modern)
const getTotalStyle = () => ({
  fill: {
    fgColor: { rgb: KSU_COLORS.violetTotal }
  },
  font: {
    color: { rgb: KSU_COLORS.white },
    bold: true,
    sz: 11
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center'
  },
  border: {
    top: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    bottom: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    left: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    right: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } }
  }
})

// Style untuk rata-rata (cyan modern)
const getAverageStyle = () => ({
  fill: {
    fgColor: { rgb: KSU_COLORS.cyanAverage }
  },
  font: {
    color: { rgb: KSU_COLORS.white },
    bold: true,
    sz: 11
  },
  alignment: {
    horizontal: 'center',
    vertical: 'center'
  },
  border: {
    top: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    bottom: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    left: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } },
    right: { style: 'thin', color: { rgb: KSU_COLORS.slate300 } }
  }
})

// Style untuk data cells (modern alternating)
const getDataCellStyle = (isAlternate: boolean = false) => ({
  fill: {
    fgColor: { rgb: isAlternate ? KSU_COLORS.amber100 : KSU_COLORS.white }
  },
  font: {
    color: { rgb: KSU_COLORS.slate900 },
    sz: 10
  },
  alignment: {
    horizontal: 'left',
    vertical: 'center',
    wrapText: true
  },
  border: {
    top: { style: 'thin', color: { rgb: KSU_COLORS.slate200 } },
    bottom: { style: 'thin', color: { rgb: KSU_COLORS.slate200 } },
    left: { style: 'thin', color: { rgb: KSU_COLORS.slate200 } },
    right: { style: 'thin', color: { rgb: KSU_COLORS.slate200 } }
  }
})

// Style untuk nama dan bulan (header info)
const getInfoHeaderStyle = () => ({
  font: {
    color: { rgb: KSU_COLORS.slate900 },
    bold: true,
    sz: 12
  },
  alignment: {
    horizontal: 'left',
    vertical: 'center'
  }
})

// Fungsi untuk apply style ke cell
const applyCellStyle = (ws: any, cellRef: string, style: any) => {
  if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' }
  if (!ws[cellRef].s) ws[cellRef].s = {}
  Object.assign(ws[cellRef].s, style)
}

// Fungsi untuk merge cells
const mergeCells = (ws: any, range: string) => {
  if (!ws['!merges']) ws['!merges'] = []
  ws['!merges'].push(XLSX.utils.decode_range(range))
}

// Helper function to get field label in Indonesian
const getFieldLabel = (fieldName: string, userRole: string): string => {
  const config = FORM_CONFIGS[userRole]
  const field = config?.fields.find(f => f.name === fieldName)
  return field?.label || fieldName
}

// Helper function to format field value for display
const formatFieldValue = (fieldName: string, value: any): string => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'number') return value.toString()
  if (typeof value === 'string') return value
  return String(value)
}

// Function to calculate analytics for numeric fields
const calculateAnalytics = (reports: any[], fieldName: string) => {
  const values = reports
    .map(report => {
      const value = report.reportData?.[fieldName]
      return parseFloat(value) || 0
    })
    .filter(val => val > 0)

  const total = values.reduce((sum, val) => sum + val, 0)
  const average = values.length > 0 ? total / values.length : 0
  const max = values.length > 0 ? Math.max(...values) : 0
  const min = values.length > 0 ? Math.min(...values) : 0

  return { total, average, max, min, count: values.length }
}

// Function to detect numeric fields
const getNumericFields = (reports: any[], availableFields: string[]) => {
  const numericFields: string[] = []
  
  availableFields.forEach(fieldName => {
    let hasNumericData = false
    for (const report of reports) {
      const value = report.reportData?.[fieldName]
      if (value && !isNaN(parseFloat(value))) {
        hasNumericData = true
        break
      }
    }
    if (hasNumericData) {
      numericFields.push(fieldName)
    }
  })
  
  return numericFields
}

// Fungsi utama untuk membuat Excel dengan format baru
export const createDynamicExcelExport = (options: ExcelExportOptions) => {
  const { title, subtitle, data, sheetName, filename, userInfo } = options
  
  // Debug log to check if new function is being called
  console.log('🎯 Creating Excel with NEW MODERN FORMAT - Colors updated!')
  console.log('🎨 Using modern colors:', KSU_COLORS)
  
  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk diekspor')
  }
  
  // Buat workbook baru
  const wb = XLSX.utils.book_new()
  
  if (userInfo?.role === 'ADMIN') {
    // Untuk ADMIN: Buat sheet terpisah per user
    const userGroups = data.reduce((groups: any, report: any) => {
      const userName = report.user?.name || 'Unknown User'
      if (!groups[userName]) groups[userName] = []
      groups[userName].push(report)
      return groups
    }, {})

    Object.entries(userGroups).forEach(([userName, reports]: [string, any]) => {
      const userRole = reports[0]?.user?.role || 'UNKNOWN'
      const ws = createAdvancedUserSheet(userName, reports as any[], title, userRole)
      XLSX.utils.book_append_sheet(wb, ws, userName.substring(0, 31)) // Excel limit 31 chars
    })
  } else {
    // Untuk USER: Satu sheet dengan data sendiri
    const ws = createAdvancedUserSheet(userInfo?.name || 'User', data, title, userInfo?.role || 'UNKNOWN')
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  // Generate Excel buffer
  const excelBuffer = XLSX.write(wb, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: true,
    sheetStubs: false
  })

  return {
    buffer: excelBuffer,
    filename: filename,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
}

// Fungsi untuk membuat sheet per user dengan analytics dan logo
const createAdvancedUserSheet = (userName: string, reports: any[], title: string, userRole: string) => {
  const ws: any = {}
  
  // Get available fields for this user
  let availableFields: string[] = []
  const formConfig = FORM_CONFIGS[userRole]
  
  if (formConfig) {
    availableFields = formConfig.fields.map(field => field.name)
  } else {
    // Fallback: collect all fields from reports
    const allFields = new Set<string>()
    reports.forEach((report: any) => {
      const reportData = report.reportData || {}
      Object.keys(reportData).forEach(field => allFields.add(field))
    })
    availableFields = Array.from(allFields)
  }

  // Detect numeric fields for analytics
  const numericFields = getNumericFields(reports, availableFields)
  
  // === SECTION 1: LOGO & HEADER (Baris 1-2) ===
  ws['A1'] = { v: '🕌 KOPERASI SERBA USAHA KIRAP ENTREPRENEURSHIP (KSU KE)', t: 's' }
  applyCellStyle(ws, 'A1', getLogoAreaStyle())
  
  ws['A2'] = { v: '📊 LAPORAN AKTIVITAS HARIAN MARKETING FUNDING 📊', t: 's' }
  applyCellStyle(ws, 'A2', getLogoAreaStyle())
  
  // Merge logo area across all columns (A1 to last column)
  const lastColIndex = Math.max(availableFields.length + 2, 8) // Minimum 8 columns
  const lastColLetter = String.fromCharCode(65 + lastColIndex - 1)
  mergeCells(ws, `A1:${lastColLetter}1`)
  mergeCells(ws, `A2:${lastColLetter}2`)
  
  // === SECTION 2: USER INFO (Baris 4-5) ===
  ws['B4'] = { v: `Nama : ${userName}`, t: 's' }
  applyCellStyle(ws, 'B4', getInfoHeaderStyle())
  
  const currentDate = new Date()
  const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
                     'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
  const currentMonth = monthNames[currentDate.getMonth()]
  const currentYear = currentDate.getFullYear()
  
  ws['B5'] = { v: `Bulan : ${currentMonth} ${currentYear}`, t: 's' }
  applyCellStyle(ws, 'B5', getInfoHeaderStyle())
  
  // === SECTION 3: ANALYTICS SUMMARY (Baris 4-7, kolom kanan) ===
  if (numericFields.length > 0) {
    const analyticsStartCol = lastColIndex - 3 // 3 columns for analytics
    const analyticsCol1 = String.fromCharCode(65 + analyticsStartCol)
    const analyticsCol2 = String.fromCharCode(65 + analyticsStartCol + 1)
    const analyticsCol3 = String.fromCharCode(65 + analyticsStartCol + 2)
    
    // Analytics header
    ws[`${analyticsCol1}4`] = { v: '📈 RINGKASAN ANALITIK', t: 's' }
    applyCellStyle(ws, `${analyticsCol1}4`, getAnalyticsHeaderStyle())
    mergeCells(ws, `${analyticsCol1}4:${analyticsCol3}4`)
    
    ws[`${analyticsCol1}5`] = { v: `Total Laporan: ${reports.length}`, t: 's' }
    applyCellStyle(ws, `${analyticsCol1}5`, getDataCellStyle())
    mergeCells(ws, `${analyticsCol1}5:${analyticsCol3}5`)
    
    ws[`${analyticsCol1}6`] = { v: `Rentang Tanggal: ${reports.length > 0 ? 
      new Date(Math.min(...reports.map(r => new Date(r.date).getTime()))).toLocaleDateString('id-ID') : ''} - ${
      new Date(Math.max(...reports.map(r => new Date(r.date).getTime()))).toLocaleDateString('id-ID')}`, t: 's' }
    applyCellStyle(ws, `${analyticsCol1}6`, getDataCellStyle())
    mergeCells(ws, `${analyticsCol1}6:${analyticsCol3}6`)
  }
  
  // === SECTION 4: TABLE HEADERS (Baris 7) ===
  const headers = ['No', 'Tanggal', ...availableFields.map(field => getFieldLabel(field, userRole))]
  const headerCols = ['B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T']
  
  headers.forEach((header, index) => {
    if (index < headerCols.length) {
      const cellRef = `${headerCols[index]}7`
      ws[cellRef] = { v: header, t: 's' }
      applyCellStyle(ws, cellRef, getColumnHeaderStyle())
    }
  })
  
  // === SECTION 5: DATA ROWS (Mulai baris 8) ===
  reports.forEach((report, index) => {
    const rowNum = 8 + index
    const isAlternate = index % 2 === 1
    const reportData = report.reportData || {}
    
    // Nomor urut
    ws[`B${rowNum}`] = { v: index + 1, t: 'n' }
    applyCellStyle(ws, `B${rowNum}`, getDataCellStyle(isAlternate))
    
    // Tanggal
    const tanggal = report.date ? new Date(report.date).toLocaleDateString('id-ID') : ''
    ws[`C${rowNum}`] = { v: tanggal, t: 's' }
    applyCellStyle(ws, `C${rowNum}`, getDataCellStyle(isAlternate))
    
    // Data fields
    availableFields.forEach((fieldName, fieldIndex) => {
      const colIndex = fieldIndex + 2 // Start from column D
      if (colIndex < headerCols.length) {
        const cellRef = `${headerCols[colIndex + 1]}${rowNum}` // +1 because D is index 3
        const value = formatFieldValue(fieldName, reportData[fieldName])
        ws[cellRef] = { v: value, t: 's' }
        applyCellStyle(ws, cellRef, getDataCellStyle(isAlternate))
      }
    })
  })
  
  // === SECTION 6: ANALYTICS ROWS (Setelah data) ===
  if (numericFields.length > 0) {
    const analyticsStartRow = 8 + reports.length + 2
    
    // Total row
    ws[`B${analyticsStartRow}`] = { v: 'TOTAL', t: 's' }
    applyCellStyle(ws, `B${analyticsStartRow}`, getTotalStyle())
    ws[`C${analyticsStartRow}`] = { v: '', t: 's' }
    applyCellStyle(ws, `C${analyticsStartRow}`, getTotalStyle())
    
    // Average row
    ws[`B${analyticsStartRow + 1}`] = { v: 'RATA-RATA', t: 's' }
    applyCellStyle(ws, `B${analyticsStartRow + 1}`, getAverageStyle())
    ws[`C${analyticsStartRow + 1}`] = { v: '', t: 's' }
    applyCellStyle(ws, `C${analyticsStartRow + 1}`, getAverageStyle())
    
    // Calculate analytics for each numeric field
    availableFields.forEach((fieldName, fieldIndex) => {
      const colIndex = fieldIndex + 2
      if (colIndex < headerCols.length && numericFields.includes(fieldName)) {
        const cellRef = `${headerCols[colIndex + 1]}`
        const analytics = calculateAnalytics(reports, fieldName)
        
        // Total
        ws[`${cellRef}${analyticsStartRow}`] = { v: analytics.total, t: 'n' }
        applyCellStyle(ws, `${cellRef}${analyticsStartRow}`, getTotalStyle())
        
        // Average
        ws[`${cellRef}${analyticsStartRow + 1}`] = { v: analytics.average.toFixed(2), t: 'n' }
        applyCellStyle(ws, `${cellRef}${analyticsStartRow + 1}`, getAverageStyle())
      } else if (colIndex < headerCols.length) {
        // Non-numeric fields
        const cellRef = `${headerCols[colIndex + 1]}`
        ws[`${cellRef}${analyticsStartRow}`] = { v: '-', t: 's' }
        applyCellStyle(ws, `${cellRef}${analyticsStartRow}`, getTotalStyle())
        ws[`${cellRef}${analyticsStartRow + 1}`] = { v: '-', t: 's' }
        applyCellStyle(ws, `${cellRef}${analyticsStartRow + 1}`, getAverageStyle())
      }
    })
  }
  
  // === SECTION 8: COLUMN SETTINGS ===
  const colCount = Math.min(headers.length + 2, headerCols.length)
  ws['!cols'] = Array.from({ length: colCount }, (_, i) => {
    if (i === 0) return { wch: 5 }   // A (kosong)
    if (i === 1) return { wch: 8 }   // B (No)
    if (i === 2) return { wch: 15 }  // C (Tanggal)
    return { wch: 20 }  // Field columns
  })
  
  // === SECTION 9: ROW SETTINGS ===
  const totalRows = reports.length + 18
  ws['!rows'] = Array.from({ length: totalRows }, (_, i) => {
    if (i < 3) return { hpt: 25 }  // Logo area
    if (i < 8) return { hpt: 20 }  // Header area
    return { hpt: 18 }             // Data area
  })
  
  // === SECTION 10: RANGE SETTING ===
  const lastRow = Math.max(8 + reports.length + 5, 18)
  ws['!ref'] = `A1:${lastColLetter}${lastRow}`
  
  return ws
}

// Export default untuk backward compatibility
export default createDynamicExcelExport
