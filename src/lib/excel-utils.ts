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
  
  console.log('📊 EXCEL UTILS DEBUG: Config received:', {
    title,
    subtitle,
    dataLength: data?.length,
    sheetName,
    filename,
    userInfo
  });
  
  console.log('📊 EXCEL UTILS DEBUG: First data item:', data?.[0]);
  console.log('📊 EXCEL UTILS DEBUG: First data reportData:', data?.[0]?.reportData);
  
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

  // Generate Excel buffer - SIMPLE APPROACH WITHOUT COMPLEX STYLING
  const excelBuffer = XLSX.write(wb, { 
    bookType: 'xlsx', 
    type: 'array',
    cellStyles: false  // Disable complex styling
  })

  return {
    buffer: excelBuffer,
    filename: filename,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
}

// Fungsi untuk membuat sheet per user dengan analytics dan logo
const createAdvancedUserSheet = (userName: string, reports: any[], title: string, userRole: string) => {
  console.log(`🔧 Creating sheet for ${userName} with ${reports.length} reports`)
  console.log(`🔧 User role: ${userRole}`)
  console.log(`🔧 First report sample:`, reports[0])
  console.log(`🔧 First report reportData:`, reports[0]?.reportData)
  
  // Get available fields for this user from form config
  let availableFields: string[] = []
  const formConfig = FORM_CONFIGS[userRole]
  
  if (formConfig) {
    availableFields = formConfig.fields.map(field => field.name)
    console.log(`📋 Using form config for ${userRole}:`, availableFields)
  } else {
    // Fallback: collect all fields from reports
    const allFields = new Set<string>()
    reports.forEach((report: any) => {
      const reportData = report.reportData || {}
      Object.keys(reportData).forEach(field => allFields.add(field))
    })
    availableFields = Array.from(allFields)
    console.log(`📋 Using fallback fields:`, availableFields)
  }

  // Prepare data for XLSX using simple approach
  const data: any[][] = []
  
  // Header row 1: Title
  data.push([`� LAPORAN AKTIVITAS HARIAN - ${userName.toUpperCase()}`])
  data.push([`📅 Bulan: ${new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`])
  data.push([]) // Empty row
  
  // Header row 2: Column headers
  const headers = ['No', 'Tanggal', 'Waktu Input']
  availableFields.forEach(fieldName => {
    const fieldLabel = getFieldLabel(fieldName, userRole)
    headers.push(fieldLabel)
  })
  data.push(headers)
  
  // Data rows
  reports.forEach((report, index) => {
    const reportData = report.reportData || {}
    
    const row: any[] = []
    
    // No urut
    row.push(index + 1)
    
    // Tanggal laporan
    const tanggal = report.date ? new Date(report.date).toLocaleDateString('id-ID') : ''
    row.push(tanggal)
    
    // Waktu input (real-time dari createdAt)
    let waktuInput = ''
    if (report.createdAt) {
      const inputDate = new Date(report.createdAt)
      waktuInput = inputDate.toLocaleString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'Asia/Jakarta'
      })
    }
    row.push(waktuInput)
    
    // Data fields sesuai urutan form config
    availableFields.forEach(fieldName => {
      const value = formatFieldValue(fieldName, reportData[fieldName])
      row.push(value)
    })
    
    data.push(row)
  })
  
  // Add summary if there are numeric fields
  const numericFields = availableFields.filter(fieldName => {
    return reports.some(report => {
      const value = report.reportData?.[fieldName]
      return value && !isNaN(parseFloat(value))
    })
  })
  
  if (numericFields.length > 0) {
    data.push([]) // Empty row
    
    // Total row
    const totalRow = ['', 'TOTAL', '']
    availableFields.forEach(fieldName => {
      if (numericFields.includes(fieldName)) {
        const total = reports.reduce((sum, report) => {
          const value = parseFloat(report.reportData?.[fieldName]) || 0
          return sum + value
        }, 0)
        totalRow.push(total)
      } else {
        totalRow.push('')
      }
    })
    data.push(totalRow)
    
    // Average row
    const avgRow = ['', 'RATA-RATA', '']
    availableFields.forEach(fieldName => {
      if (numericFields.includes(fieldName)) {
        const total = reports.reduce((sum, report) => {
          const value = parseFloat(report.reportData?.[fieldName]) || 0
          return sum + value
        }, 0)
        const average = reports.length > 0 ? total / reports.length : 0
        avgRow.push((Math.round(average * 100) / 100).toString()) // Round to 2 decimal places
      } else {
        avgRow.push('')
      }
    })
    data.push(avgRow)
  }
  
  console.log(`📊 Sheet data prepared with ${data.length} rows`)
  console.log(`🔍 Sample data:`, data[0], data[3]) // Title and headers
  
  // Create worksheet from array - SIMPLE APPROACH
  const ws = XLSX.utils.aoa_to_sheet(data)
  
  // Set column widths
  const colWidths = [
    { wch: 5 },   // No
    { wch: 12 },  // Tanggal
    { wch: 20 },  // Waktu Input
  ]
  
  // Add width for each field
  availableFields.forEach(fieldName => {
    const fieldLabel = getFieldLabel(fieldName, userRole)
    const contentWidth = Math.max(fieldLabel.length, 15)
    colWidths.push({ wch: contentWidth })
  })
  
  ws['!cols'] = colWidths
  
  console.log(`✅ Excel sheet created for ${userName} with ${reports.length} reports and ${availableFields.length} fields`)
  console.log(`📊 Fields included:`, availableFields.map(field => getFieldLabel(field, userRole)))
  
  return ws
}

// Export default untuk backward compatibility
export default createDynamicExcelExport
