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

// Enhanced dynamic export function with Islamic Corporate styling - ADMIN creates separate sheet per user
export const createDynamicExcelExport = (options: ExcelExportOptions) => {
  const { title, subtitle, data, sheetName, filename, userInfo, dateRange } = options

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
    console.log('Admin export: Processing', data.length, 'reports for multiple users')
    
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

      // Create enhanced header with Islamic Corporate styling and logo
      const headerInfo = [
        ['🕌', 'KOPERASI SERBA USAHA KIRAP ENTREPRENEURSHIP (KSUKE)', '', '', '', '', '', '', '🕌'],
        ['', '📈 SISTEM LAPORAN AKTIVITAS HARIAN MARKETING FUNDING 📈', '', '', '', '', '', '', ''],
        ['', '🏢 Logo KSU KE: Lihat file logo-ksu-ke.png di folder project', '', '', '', '', '', '', ''],
        ['🌟', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '🌟'],
        [''],
        ['📋', `Nama: ${userName}`, '', '', '', '', '', '', ''],
        ['👤', `Role: ${userRole}`, '', '', '', '', '', '', ''],
        ['📅', `Periode: ${dateRange?.start ? new Date(dateRange.start).toLocaleDateString('id-ID') : 'Semua'} - ${dateRange?.end ? new Date(dateRange.end).toLocaleDateString('id-ID') : 'Semua'}`, '', '', '', '', '', '', ''],
        ['📊', `Total Laporan: ${userReports.length} laporan`, '', '', '', '', '', '', ''],
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

      // Create data rows with proper field labels
      const excelData = userReports.map((report: any, index: number) => {
        const reportData = report.reportData || {}
        const rowData: any = {
          'No.': index + 1,
          'Tanggal 📅': new Date(report.date).toLocaleDateString('id-ID')
        }
        
        // Add fields based on user's form configuration
        availableFields.forEach(fieldName => {
          const fieldLabel = getFieldLabel(fieldName, userRole)
          const fieldValue = formatFieldValue(fieldName, reportData[fieldName])
          
          // Add emoji icons for better visualization
          if (fieldName.includes('angsuran')) {
            rowData[`${fieldLabel} 🎯`] = fieldValue
          } else if (fieldName.includes('funding') && fieldName.toLowerCase().includes('b2b')) {
            rowData[`${fieldLabel} 🏢`] = fieldValue
          } else if (fieldName.includes('funding') && fieldName.toLowerCase().includes('personal')) {
            rowData[`${fieldLabel} 👤`] = fieldValue
          } else if (fieldName.includes('survey')) {
            rowData[`${fieldLabel} 📋`] = fieldValue
          } else if (fieldName.includes('kegiatan')) {
            rowData[`${fieldLabel} 📝`] = fieldValue
          } else if (fieldName.includes('keterangan')) {
            rowData[`${fieldLabel} 💬`] = fieldValue
          } else {
            rowData[`${fieldLabel} ✨`] = fieldValue
          }
        })
        
        rowData['Waktu Input ⏰'] = new Date(report.createdAt || report.date).toLocaleString('id-ID')
        
        return rowData
      })

      // Calculate totals for numeric fields
      const totals: any = {}
      availableFields.forEach(fieldName => {
        const fieldConfig = formConfig?.fields.find(f => f.name === fieldName)
        if (fieldConfig && (fieldConfig.type === 'number' || fieldConfig.type === 'dropdown-number')) {
          totals[fieldName] = excelData.reduce((sum: number, row: any) => {
            const fieldLabel = getFieldLabel(fieldName, userRole)
            const keys = Object.keys(row).find(key => key.includes(fieldLabel))
            const value = keys ? parseFloat(row[keys]) || 0 : 0
            return sum + value
          }, 0)
        }
      })

      // Combine header and data
      const worksheetData = [
        ...headerInfo,
        Object.keys(excelData[0] || {}), // Column headers
        ...excelData.map((row: any) => Object.values(row))
      ]

      // Add comprehensive summary
      const grandTotalFunding = (totals.fundingB2B || 0) + (totals.fundingPersonal || 0)
      const summaryData = [
        [''],
        ['💰', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💰'],
        ['📊', '                     RINGKASAN TOTAL AKTIVITAS                    ', '', '', '', '', '', '', '📊'],
        ['💰', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💰'],
        [''],
        ['🎯', `Total Angsuran (Target): ${(totals.angsuran || 0).toLocaleString('id-ID')} target`, '', '', '', '', '', '', ''],
        ['🏢', `Total Funding B2B: ${(totals.fundingB2B || 0).toLocaleString('id-ID')} nasabah`, '', '', '', '', '', '', ''],
        ['👤', `Total Funding Personal: ${(totals.fundingPersonal || 0).toLocaleString('id-ID')} nasabah`, '', '', '', '', '', '', ''],
        ['📋', `Total Survey: ${(totals.survey || 0).toLocaleString('id-ID')} survey`, '', '', '', '', '', '', ''],
        [''],
        ['💎', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💎'],
        ['💰', `GRAND TOTAL FUNDING: ${grandTotalFunding.toLocaleString('id-ID')} NASABAH`, '', '', '', '', '', '', '💰'],
        ['💎', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '💎'],
        [''],
        ['📈', `Rata-rata Harian Angsuran: ${Math.round((totals.angsuran || 0) / (userReports.length || 1)).toLocaleString('id-ID')} target/hari`, '', '', '', '', '', '', ''],
        ['📊', `Rata-rata Harian Funding: ${Math.round(grandTotalFunding / (userReports.length || 1)).toLocaleString('id-ID')} nasabah/hari`, '', '', '', '', '', '', ''],
        ['🔍', `Rata-rata Harian Survey: ${Math.round((totals.survey || 0) / (userReports.length || 1)).toLocaleString('id-ID')} survey/hari`, '', '', '', '', '', '', ''],
        [''],
        ['🌟', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '🌟'],
        ['📋', `Periode Laporan: ${userReports.length} hari kerja`, '', '', '', '', '', '', ''],
        ['⏱️', `Rata-rata Produktivitas: ${Math.round((grandTotalFunding + (totals.survey || 0)) / (userReports.length || 1))} aktivitas/hari`, '', '', '', '', '', '', ''],
        ['✅', `Laporan digenerate pada: ${new Date().toLocaleString('id-ID')}`, '', '', '', '', '', '', ''],
        ['🏢', `KOPERASI SERBA USAHA KIRAP ENTREPRENEURSHIP (KSUKE)`, '', '', '', '', '', '', ''],
        ['🌟', '═══════════════════════════════════════════════════════════════════════', '', '', '', '', '', '', '🌟']
      ]

      // Add summary to worksheet data
      worksheetData.push(...summaryData)

      // Create worksheet
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)

      // Set enhanced column widths
      const columnWidths = Object.keys(excelData[0] || {}).map((key: string) => {
        if (key.includes('No')) return { wch: 8 }
        if (key.includes('Tanggal')) return { wch: 20 }
        if (key.includes('Angsuran') || key.includes('Target')) return { wch: 22 }
        if (key.includes('Kegiatan') || key.includes('Aktivitas')) return { wch: 40 }
        if (key.includes('Funding B2B')) return { wch: 20 }
        if (key.includes('Funding Personal')) return { wch: 22 }
        if (key.includes('Survey')) return { wch: 18 }
        if (key.includes('Keterangan')) return { wch: 45 }
        if (key.includes('Waktu') || key.includes('Update')) return { wch: 28 }
        return { wch: 25 }
      })
      ws['!cols'] = columnWidths

      // Apply enhanced Islamic Corporate styling
      const totalColCount = Math.max(Object.keys(excelData[0] || {}).length, 9)
      
      // Style header rows with full Islamic Corporate theme
      for (let row = 0; row < 16; row++) {
        for (let col = 0; col < totalColCount; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
          if (!ws[cellRef]) ws[cellRef] = { v: '', t: 's' }
          
          if (row === 0) { // Logo and company row
            ws[cellRef].s = {
              font: { bold: true, sz: 14, color: { rgb: COLORS.white } },
              fill: { fgColor: { rgb: COLORS.primary }, patternType: 'solid' },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: 'thick', color: { rgb: COLORS.accent } },
                bottom: { style: 'thick', color: { rgb: COLORS.accent } },
                left: { style: 'thick', color: { rgb: COLORS.accent } },
                right: { style: 'thick', color: { rgb: COLORS.accent } }
              }
            }
          } else if (row === 1) { // Branding row
            ws[cellRef].s = {
              font: { bold: true, sz: 12, color: { rgb: COLORS.white } },
              fill: { fgColor: { rgb: COLORS.secondary }, patternType: 'solid' },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: 'medium', color: { rgb: COLORS.primary } },
                bottom: { style: 'medium', color: { rgb: COLORS.primary } },
                left: { style: 'medium', color: { rgb: COLORS.primary } },
                right: { style: 'medium', color: { rgb: COLORS.primary } }
              }
            }
          } else if (row === 3 || row === 12 || row === 14) { // Decorative borders
            ws[cellRef].s = {
              font: { bold: true, sz: 16, color: { rgb: COLORS.primary } },
              fill: { fgColor: { rgb: COLORS.accent }, patternType: 'solid' },
              alignment: { horizontal: "center", vertical: "center" },
              border: {
                top: { style: 'thick', color: { rgb: COLORS.primary } },
                bottom: { style: 'thick', color: { rgb: COLORS.primary } },
                left: { style: 'thick', color: { rgb: COLORS.primary } },
                right: { style: 'thick', color: { rgb: COLORS.primary } }
              }
            }
          } else if (row >= 5 && row <= 11) { // Info rows
            const bgColor = row % 2 === 0 ? COLORS.light : COLORS.white
            ws[cellRef].s = {
              font: { bold: true, sz: 11, color: { rgb: COLORS.text } },
              fill: { fgColor: { rgb: bgColor }, patternType: 'solid' },
              alignment: { horizontal: col === 0 ? "center" : "left", vertical: "center" },
              border: {
                top: { style: 'thin', color: { rgb: COLORS.border } },
                bottom: { style: 'thin', color: { rgb: COLORS.border } },
                left: { style: 'thin', color: { rgb: COLORS.border } },
                right: { style: 'thin', color: { rgb: COLORS.border } }
              }
            }
          } else if (row === 13) { // Data section title
            ws[cellRef].s = {
              font: { bold: true, sz: 16, color: { rgb: COLORS.white } },
              fill: { fgColor: { rgb: COLORS.primary }, patternType: 'solid' },
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
      }

      // Style column headers (Row 17)
      const headerRowIndex = 16
      for (let col = 0; col < Object.keys(excelData[0] || {}).length; col++) {
        const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col })
        if (ws[cellRef]) {
          ws[cellRef].s = {
            font: { bold: true, sz: 12, color: { rgb: COLORS.white } },
            fill: { fgColor: { rgb: COLORS.secondary }, patternType: 'solid' },
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

      // Style data rows with alternating colors
      for (let row = headerRowIndex + 1; row < headerRowIndex + 1 + excelData.length; row++) {
        const isEvenRow = (row - headerRowIndex) % 2 === 0
        const bgColor = isEvenRow ? COLORS.white : COLORS.light
        
        for (let col = 0; col < Object.keys(excelData[0] || {}).length; col++) {
          const cellRef = XLSX.utils.encode_cell({ r: row, c: col })
          if (ws[cellRef]) {
            ws[cellRef].s = {
              font: { sz: 11, color: { rgb: COLORS.text } },
              fill: { fgColor: { rgb: bgColor }, patternType: 'solid' },
              alignment: { 
                horizontal: col === 0 ? "center" : "left",
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
            const columnKey = Object.keys(excelData[0] || {})[col]
            if (columnKey && (columnKey.includes('🎯') || columnKey.includes('🏢') || columnKey.includes('👤') || columnKey.includes('📋'))) {
              ws[cellRef].s.alignment!.horizontal = "right"
              ws[cellRef].s.font!.bold = true
              if (ws[cellRef].v > 0) {
                ws[cellRef].s.font!.color = { rgb: COLORS.primary }
              }
            }
          }
        }
      }

      // Enhanced merge cells for premium visual hierarchy
      ws['!merges'] = [
        { s: { r: 0, c: 1 }, e: { r: 0, c: totalColCount - 2 } }, // Company name
        { s: { r: 1, c: 1 }, e: { r: 1, c: totalColCount - 2 } }, // Branding
        { s: { r: 2, c: 1 }, e: { r: 2, c: totalColCount - 2 } }, // Logo info
        { s: { r: 5, c: 1 }, e: { r: 5, c: totalColCount - 1 } }, // Name
        { s: { r: 6, c: 1 }, e: { r: 6, c: totalColCount - 1 } }, // Role
        { s: { r: 7, c: 1 }, e: { r: 7, c: totalColCount - 1 } }, // Period
        { s: { r: 8, c: 1 }, e: { r: 8, c: totalColCount - 1 } }, // Total reports
        { s: { r: 9, c: 1 }, e: { r: 9, c: totalColCount - 1 } }, // Export date
        { s: { r: 10, c: 1 }, e: { r: 10, c: totalColCount - 1 } }, // Export time
        { s: { r: 13, c: 1 }, e: { r: 13, c: totalColCount - 2 } } // Data section title
      ]

      // Clean sheet name
      const cleanSheetName = userName.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 31)
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, cleanSheetName)
    })

  } else {
    // Regular user export - single sheet with their data only
    const formConfig = FORM_CONFIGS[userRole]
    
    if (!formConfig) {
      throw new Error(`Konfigurasi form tidak ditemukan untuk role: ${userRole}`)
    }

    const availableFields = formConfig.fields.map(field => field.name)
    
    // Process data with only available fields for this user
    const processedData = data.map((report: any, index: number) => {
      const reportData = report.reportData || {}
      const rowData: any = {
        'No.': index + 1,
        'Tanggal': new Date(report.date).toLocaleDateString('id-ID')
      }
      
      availableFields.forEach(fieldName => {
        const fieldLabel = getFieldLabel(fieldName, userRole)
        const fieldValue = formatFieldValue(fieldName, reportData[fieldName])
        rowData[fieldLabel] = fieldValue
      })
      
      rowData['Waktu Input'] = new Date(report.createdAt || report.date).toLocaleString('id-ID')
      
      return rowData
    })

    // Create Excel file using simple format for users
    const ws = XLSX.utils.json_to_sheet(processedData)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
  }

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-')
  const finalFilename = `${filename}_${timestamp}.xlsx`

  // Write file
  XLSX.writeFile(wb, finalFilename)
  console.log('Enhanced Excel file created:', finalFilename)
  return finalFilename
}

// Export helper function for formatting data
export const formatDataForExcel = (reports: any[], includeTimestamps = false) => {
  return reports.map((report: any, index: number) => {
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
