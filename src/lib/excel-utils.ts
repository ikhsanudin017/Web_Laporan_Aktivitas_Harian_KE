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

// Professional Islamic Corporate Color Palette
const COLORS = {
  primary: '1a5d1a',       // Deep Islamic Green
  secondary: '2d8a2d',     // Medium Green  
  accent: 'ffd700',        // Gold
  headerBg: '27ae60',      // Header Background Green
  alternateRow: 'f8f9fa',  // Alternate Row Color
  white: 'ffffff',         // White
  text: '2c3e50',          // Professional Dark Blue-Gray
  border: 'bdc3c7'         // Professional Border Gray
}

// Enhanced styling function for cells
const applyCellStyle = (ws: any, cellRef: string, style: any) => {
  if (!ws[cellRef]) ws[cellRef] = {}
  if (!ws[cellRef].s) ws[cellRef].s = {}
  Object.assign(ws[cellRef].s, style)
}

// Professional header styling with attractive colors
const getHeaderStyle = () => ({
  font: { 
    bold: true, 
    color: { rgb: COLORS.white },
    size: 12,
    name: 'Calibri'
  },
  fill: { 
    fgColor: { rgb: COLORS.headerBg },
    patternType: 'solid'
  },
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } }
  },
  alignment: { 
    horizontal: 'center', 
    vertical: 'center',
    wrapText: true
  }
})

// Professional title styling
const getTitleStyle = () => ({
  font: { 
    bold: true, 
    color: { rgb: COLORS.primary },
    size: 16,
    name: 'Calibri'
  },
  alignment: { 
    horizontal: 'center', 
    vertical: 'center'
  }
})

// Data cell styling with alternating rows
const getDataStyle = (isAlternate: boolean = false) => ({
  font: { 
    color: { rgb: COLORS.text },
    size: 10,
    name: 'Calibri'
  },
  fill: isAlternate ? { 
    fgColor: { rgb: COLORS.alternateRow },
    patternType: 'solid'
  } : undefined,
  border: {
    top: { style: 'thin', color: { rgb: COLORS.border } },
    bottom: { style: 'thin', color: { rgb: COLORS.border } },
    left: { style: 'thin', color: { rgb: COLORS.border } },
    right: { style: 'thin', color: { rgb: COLORS.border } }
  },
  alignment: { 
    horizontal: 'left', 
    vertical: 'top',
    wrapText: true
  }
})

// Apply professional styling to worksheet
const applyProfessionalStyling = (ws: any, wsData: any[][], headerCount: number, dataRowCount: number) => {
  const headerRowIndex = 6 // Row where headers start
  
  // Style title rows (0-5)
  for (let i = 0; i < 6; i++) {
    for (let c = 0; c < headerCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: i, c })
      if (i < 3) {
        applyCellStyle(ws, cellRef, getTitleStyle())
      }
    }
  }
  
  // Style table headers
  for (let c = 0; c < headerCount; c++) {
    const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c })
    applyCellStyle(ws, cellRef, getHeaderStyle())
  }
  
  // Style data rows with alternating colors
  for (let r = headerRowIndex + 1; r < headerRowIndex + 1 + dataRowCount; r++) {
    const isAlternate = (r - headerRowIndex - 1) % 2 === 1
    for (let c = 0; c < headerCount; c++) {
      const cellRef = XLSX.utils.encode_cell({ r, c })
      applyCellStyle(ws, cellRef, getDataStyle(isAlternate))
    }
  }
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

// Enhanced dynamic export function with Professional Islamic Corporate styling
export const createDynamicExcelExport = (options: ExcelExportOptions) => {
  const { title, data, sheetName, filename, userInfo, dateRange } = options

  if (!data || data.length === 0) {
    throw new Error('Tidak ada data untuk diekspor')
  }

  // Get user role
  const userRole = userInfo?.role || 'UNKNOWN'
  const userName = userInfo?.name || 'Unknown User'
  
  // Create workbook
  const wb = XLSX.utils.book_new()

  // Special handling for ADMIN role - create separate sheet for each user
  if (userRole === 'ADMIN') {
    // Group reports by user name
    const reportsByUser = data.reduce((acc: Record<string, any[]>, report: any) => {
      const userName = report.user?.name || 'Unknown User'
      if (!acc[userName]) {
        acc[userName] = []
      }
      acc[userName].push(report)
      return acc
    }, {})

    // Create sheet for each user
    Object.entries(reportsByUser).forEach(([userName, userReports]: [string, any[]]) => {
      const userRole = userReports[0]?.user?.role || 'UNKNOWN'
      const formConfig = FORM_CONFIGS[userRole]
      
      // Get available fields for this user
      let availableFields: string[] = []
      if (formConfig) {
        availableFields = formConfig.fields.map(field => field.name)
      } else {
        // Fallback: collect all fields from this user's reports
        const allFields = new Set<string>()
        userReports.forEach((report: any) => {
          const reportData = report.reportData || {}
          Object.keys(reportData).forEach(field => allFields.add(field))
        })
        availableFields = Array.from(allFields)
      }

      // Create professional header
      const currentDate = new Date().toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })

      const wsData: any[][] = [
        ['🕌 KOPERASI SERBA USAHA KIRAP ENTREPRENEURSHIP (KSUKE) 🕌'],
        ['📊 SISTEM LAPORAN AKTIVITAS HARIAN MARKETING FUNDING 📊'],
        [''],
        [`🏢 LAPORAN ${title.toUpperCase()}`],
        [`👤 ${userName} | 🎯 ${userRole} | 📋 ${userReports.length} Laporan`],
        [`📅 Digenerate: ${currentDate}`],
        ['No.', 'Tanggal', ...availableFields.map(field => getFieldLabel(field, userRole))]
      ]

      // Add data rows
      userReports.forEach((report: any, index: number) => {
        const reportData = report.reportData || {}
        const formattedDate = new Date(report.date).toLocaleDateString('id-ID', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        })
        
        const row = [
          index + 1,
          formattedDate,
          ...availableFields.map(field => formatFieldValue(field, reportData[field]))
        ]
        wsData.push(row)
      })

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(wsData)

      // Apply professional styling
      const headers = ['No.', 'Tanggal', ...availableFields.map(field => getFieldLabel(field, userRole))]
      applyProfessionalStyling(ws, wsData, headers.length, userReports.length)

      // Set professional column widths
      const colWidths = headers.map((header, index) => {
        if (index === 0) return { width: 5 }   // No. column
        if (index === 1) return { width: 12 }  // Date column
        if (header.length > 20) return { width: 25 }
        if (header.length > 15) return { width: 20 }
        return { width: 15 }
      })
      ws['!cols'] = colWidths

      // Merge cells for title
      ws['!merges'] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Title
        { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Subtitle
        { s: { r: 3, c: 0 }, e: { r: 3, c: headers.length - 1 } }, // Report title
        { s: { r: 4, c: 0 }, e: { r: 4, c: headers.length - 1 } }, // User info
        { s: { r: 5, c: 0 }, e: { r: 5, c: headers.length - 1 } }  // Date
      ]

      // Add worksheet to workbook with clean sheet name
      const cleanSheetName = userName.replace(/[^a-zA-Z0-9\s]/g, '').substring(0, 25)
      XLSX.utils.book_append_sheet(wb, ws, cleanSheetName)
    })

  } else {
    // For non-admin users, create single sheet
    const formConfig = FORM_CONFIGS[userRole]
    
    // Get available fields for this user
    let availableFields: string[] = []
    if (formConfig) {
      availableFields = formConfig.fields.map(field => field.name)
    } else {
      // Fallback: collect all fields from reports
      const allFields = new Set<string>()
      data.forEach((report: any) => {
        const reportData = report.reportData || {}
        Object.keys(reportData).forEach(field => allFields.add(field))
      })
      availableFields = Array.from(allFields)
    }

    // Create professional header
    const currentDate = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const wsData: any[][] = [
      ['🕌 KOPERASI SERBA USAHA KIRAP ENTREPRENEURSHIP (KSUKE) 🕌'],
      ['📊 SISTEM LAPORAN AKTIVITAS HARIAN MARKETING FUNDING 📊'],
      [''],
      [`🏢 LAPORAN ${title.toUpperCase()}`],
      [`👤 ${userName} | 🎯 ${userRole} | 📋 ${data.length} Laporan`],
      [`📅 Digenerate: ${currentDate}`],
      ['No.', 'Tanggal', ...availableFields.map(field => getFieldLabel(field, userRole))]
    ]

    // Add data rows
    data.forEach((report: any, index: number) => {
      const reportData = report.reportData || {}
      const formattedDate = new Date(report.date).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      })
      
      const row = [
        index + 1,
        formattedDate,
        ...availableFields.map(field => formatFieldValue(field, reportData[field]))
      ]
      wsData.push(row)
    })

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Apply professional styling
    const headers = ['No.', 'Tanggal', ...availableFields.map(field => getFieldLabel(field, userRole))]
    applyProfessionalStyling(ws, wsData, headers.length, data.length)

    // Set professional column widths
    const colWidths = headers.map((header, index) => {
      if (index === 0) return { width: 5 }   // No. column
      if (index === 1) return { width: 12 }  // Date column
      if (header.length > 20) return { width: 25 }
      if (header.length > 15) return { width: 20 }
      return { width: 15 }
    })
    ws['!cols'] = colWidths

    // Merge cells for title
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }, // Title
      { s: { r: 1, c: 0 }, e: { r: 1, c: headers.length - 1 } }, // Subtitle
      { s: { r: 3, c: 0 }, e: { r: 3, c: headers.length - 1 } }, // Report title
      { s: { r: 4, c: 0 }, e: { r: 4, c: headers.length - 1 } }, // User info
      { s: { r: 5, c: 0 }, e: { r: 5, c: headers.length - 1 } }  // Date
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  // Generate and return the file
  const excelBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })
  
  return {
    buffer: excelBuffer,
    filename: filename,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  }
}