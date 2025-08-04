'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FORM_CONFIGS } from '@/lib/form-configs'
import * as XLSX from 'xlsx'
import Image from 'next/image'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface HistoryReport {
  id: string
  date: string
  reportData: any
  createdAt: string
  updatedAt: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [reportData, setReportData] = useState<any>({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  
  // Set tanggal hari ini dengan zona waktu Indonesia (WIB/WITA/WIT)
  const getTodayDate = () => {
    const today = new Date()
    // Adjust for Indonesian timezone (UTC+7)
    const indonesianDate = new Date(today.getTime() + (7 * 60 * 60 * 1000))
    return indonesianDate.toISOString().split('T')[0]
  }
  
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input')
  const [historyReports, setHistoryReports] = useState<HistoryReport[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem('user')
    const token = localStorage.getItem('token')

    if (!userData || !token) {
      router.push('/')
      return
    }

    setUser(JSON.parse(userData))
    // Don't auto-load data for current date, let user start fresh each day
    // loadReportForDate(selectedDate) // Commented out
  }, [router]) // Removed selectedDate dependency

  // Load history when history tab is selected
  useEffect(() => {
    if (activeTab === 'history' && user) {
      loadHistoryReports()
    }
  }, [activeTab, user])

  const loadReportForDate = async (date: string) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/reports?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReportData(data.reportData || {})
      }
    } catch (error) {
      console.error('Error loading report:', error)
    }
  }

  const loadHistoryReports = async () => {
    setHistoryLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/reports/history', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHistoryReports(data.reports || [])
      }
    } catch (error) {
      console.error('Error loading history:', error)
    } finally {
      setHistoryLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          date: selectedDate,
          reportData
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Laporan berhasil disimpan!')
        
        // Reset form to empty
        const emptyData: Record<string, any> = {}
        formConfig.fields.forEach(field => {
          if (field.type === 'number') {
            emptyData[field.name] = 0
          } else {
            emptyData[field.name] = ''
          }
        })
        setReportData(emptyData)
        
        // Refresh history if on history tab
        if (activeTab === 'history') {
          loadHistoryReports()
        }
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.message || 'Gagal menyimpan laporan')
      }
    } catch (error) {
      setMessage('Terjadi kesalahan. Silakan coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  const exportMyReports = () => {
    if (historyReports.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    // Create header information with logo reference and better formatting
    const headerInfo = [
      ['🏢 LAPORAN AKTIVITAS HARIAN MARKETING FUNDING'],
      ['   KOPERASI SERBA USAHA KIRAP ENTREPRENEURSHIP (KSUKE)'],
      ['   📍 Logo: Lihat file logo-ksu-ke.png'],
      ['=========================================================='],
      [''],
      [`📋 Nama: ${user?.name || ''}`],
      [`👤 Role: ${user?.role || ''}`],
      [`📊 Total Laporan: ${historyReports.length} laporan`],
      [`🗓️ Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
      [''],
      ['=========================================================='],
      ['                    DATA AKTIVITAS                    '],
      ['=========================================================='],
      [''] // Empty row before data
    ]

    // Prepare data for Excel with better formatting
    const excelData = historyReports.map((report, index) => {
      const reportData = report.reportData || {}
      return {
        'No.': index + 1,
        'Tanggal 📅': new Date(report.date).toLocaleDateString('id-ID'),
        'Angsuran (Target) 🎯': reportData.angsuran || 0,
        'Kegiatan 📝': reportData.kegiatan || '',
        'Funding B2B 🏢': reportData.fundingB2B || 0,
        'Funding Personal 👤': reportData.fundingPersonal || 0,
        'Survey 📋': reportData.survey || 0,
        'Keterangan 💬': reportData.keterangan || '',
        'Waktu Input ⏰': new Date(report.createdAt).toLocaleString('id-ID'),
        'Terakhir Update 🔄': new Date(report.updatedAt).toLocaleString('id-ID')
      }
    })

    // Combine header and data
    const worksheetData = [
      ...headerInfo,
      Object.keys(excelData[0] || {}), // Column headers
      ...excelData.map(row => Object.values(row))
    ]

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const columnWidths = [
      { wch: 6 },  // No
      { wch: 15 }, // Tanggal
      { wch: 18 }, // Angsuran
      { wch: 25 }, // Kegiatan
      { wch: 15 }, // Funding B2B
      { wch: 18 }, // Funding Personal
      { wch: 12 }, // Survey
      { wch: 35 }, // Keterangan
      { wch: 22 }, // Waktu Input
      { wch: 22 }  // Terakhir Update
    ]
    ws['!cols'] = columnWidths

    // Style title rows with cell formatting
    if (ws['A1']) {
      ws['A1'].s = {
        font: { bold: true, sz: 16 },
        alignment: { horizontal: "center", vertical: "center" }
      }
    }
    
    if (ws['A2']) {
      ws['A2'].s = {
        font: { bold: true, sz: 12 },
        alignment: { horizontal: "center", vertical: "center" }
      }
    }

    if (ws['A3']) {
      ws['A3'].s = {
        font: { bold: true, sz: 10, color: { rgb: "0066CC" } },
        alignment: { horizontal: "center", vertical: "center" }
      }
    }

    // Style info rows
    for (let row = 6; row <= 9; row++) {
      const cellRef = XLSX.utils.encode_cell({ r: row - 1, c: 0 })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, sz: 11 },
          alignment: { horizontal: "left", vertical: "center" }
        }
      }
    }

    // Style column headers
    const headerRowIndex = 14 // Row 15 (0-based)
    for (let col = 0; col < (excelData[0] ? Object.keys(excelData[0]).length : 0); col++) {
      const cellRef = XLSX.utils.encode_cell({ r: headerRowIndex, c: col })
      if (ws[cellRef]) {
        ws[cellRef].s = {
          font: { bold: true, sz: 12 },
          alignment: { horizontal: "center", vertical: "center" }
        }
      }
    }

    // Add summary at the end
    const lastDataRow = headerRowIndex + excelData.length + 2
    const summaryData = [
      [''],
      ['=========================================================='],
      ['                     📊 RINGKASAN                        '],
      ['=========================================================='],
      [`🎯 Total Angsuran: ${excelData.reduce((sum, row) => sum + (row['Angsuran (Target) 🎯'] || 0), 0)}`],
      [`🏢 Total Funding B2B: ${excelData.reduce((sum, row) => sum + (row['Funding B2B 🏢'] || 0), 0)}`],
      [`👤 Total Funding Personal: ${excelData.reduce((sum, row) => sum + (row['Funding Personal 👤'] || 0), 0)}`],
      [`📋 Total Survey: ${excelData.reduce((sum, row) => sum + (row['Survey 📋'] || 0), 0)}`],
      ['=========================================================='],
      [''],
      ['📝 Catatan: Logo KSU KE dapat dilihat di website atau file logo-ksu-ke.png']
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
      } else if (index >= 4 && index <= 7) { // Summary rows
        ws[cellRef].s = {
          font: { bold: true, sz: 10 },
          alignment: { horizontal: "left", vertical: "center" }
        }
      }
    })

    // Merge title cells for better appearance
    ws['!merges'] = [
      { s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }, // Title row 1
      { s: { r: 1, c: 0 }, e: { r: 1, c: 9 } }, // Title row 2
      { s: { r: 2, c: 0 }, e: { r: 2, c: 9 } }, // Logo reference
      { s: { r: 11, c: 0 }, e: { r: 11, c: 9 } } // Data section title
    ]

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Laporan Saya')

    // Save file with formatted name
    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID').replace(/\//g, '-')
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '-')
    const fileName = `Laporan_${user?.name?.replace(/\s+/g, '_')}_${dateStr}_${timeStr}.xlsx`
    XLSX.writeFile(wb, fileName)
  }  // Reset form to empty state
  const resetForm = () => {
    const emptyData: Record<string, any> = {}
    if (formConfig) {
      formConfig.fields.forEach(field => {
        if (field.type === 'number') {
          emptyData[field.name] = 0
        } else {
          emptyData[field.name] = ''
        }
      })
    }
    setReportData(emptyData)
    setMessage('Form berhasil direset')
    setTimeout(() => setMessage(''), 2000)
  }

  const loadReportFromHistory = (report: HistoryReport) => {
    setSelectedDate(report.date.split('T')[0])
    setReportData(report.reportData)
    setActiveTab('input')
    setMessage(`Data dari tanggal ${new Date(report.date).toLocaleDateString('id-ID')} dimuat untuk diedit`)
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/')
  }

  const handleFieldChange = (fieldName: string, value: any) => {
    setReportData((prev: any) => ({
      ...prev,
      [fieldName]: value
    }))
  }

  if (!user) {
    return <div>Loading...</div>
  }

  const formConfig = FORM_CONFIGS[user.role]

  if (!formConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Role tidak ditemukan</h1>
          <p className="text-gray-600 mt-2">Role: {user.role}</p>
          <button
            onClick={handleLogout}
            className="mt-4 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            Logout
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-yellow-50">
      {/* Header */}
      <header className="header-islamic">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-4 sm:py-6 space-y-4 sm:space-y-0">
            <div className="flex items-start space-x-3 sm:space-x-4 w-full sm:flex-1">
              {/* Logo */}
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
                <Image 
                  src="/logo-ksu-ke.png" 
                  alt="Logo KSU KE" 
                  width={50} 
                  height={50}
                  className="sm:w-[60px] sm:h-[60px] rounded-full shadow-2xl border-2 border-yellow-300 relative z-10"
                />
              </div>
              {/* Text Content */}
              <div className="flex-1 space-y-1">
                <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white leading-tight" style={{fontFamily: 'Poppins, sans-serif'}}>
                  {formConfig.title}
                </h1>
                <div className="text-yellow-100 text-xs sm:text-sm">
                  <div className="font-medium">
                    مرحباً - Selamat datang,
                  </div>
                  <div className="font-bold text-yellow-50 text-sm sm:text-base mt-1">
                    {user.name}
                  </div>
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <svg className="w-4 h-4 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="text-yellow-200 text-xs font-medium">
                    {new Date().toLocaleDateString('id-ID', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </span>
                  <div className="w-1 h-1 bg-yellow-300 rounded-full"></div>
                  <span className="text-yellow-200 text-xs">
                    {new Date().toLocaleTimeString('id-ID', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      timeZoneName: 'short'
                    })}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
              <button
                onClick={exportMyReports}
                className="btn-islamic-secondary flex items-center justify-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
                <span className="hidden sm:inline">تصدير - Export Excel</span>
                <span className="sm:hidden">Export</span>
              </button>
              <button
                onClick={handleLogout}
                className="bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center space-x-2 text-sm"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                </svg>
                <span>خروج - Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 pt-4 sm:pt-6">
        <div className="border-b border-yellow-200 bg-white/50 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 sm:space-x-8 px-2 sm:px-6 min-w-max">
            <button
              onClick={() => setActiveTab('input')}
              className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                activeTab === 'input'
                  ? 'border-yellow-500 text-green-700 bg-yellow-50 rounded-t-lg scale-105'
                  : 'border-transparent text-gray-500 hover:text-green-700 hover:border-yellow-300 hover:bg-white/70'
              }`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">إدخال التقرير - Input Laporan</span>
              <span className="sm:hidden">Input</span>
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-3 sm:py-4 px-2 border-b-2 font-medium text-xs sm:text-sm transition-all duration-200 flex items-center space-x-1 sm:space-x-2 whitespace-nowrap ${
                activeTab === 'history'
                  ? 'border-yellow-500 text-green-700 bg-yellow-50 rounded-t-lg scale-105'
                  : 'border-transparent text-gray-500 hover:text-green-700 hover:border-yellow-300 hover:bg-white/70'
              }`}
            >
              <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
              </svg>
              <span className="hidden sm:inline">تاريخ التقارير - History Laporan ({historyReports.length})</span>
              <span className="sm:hidden">History ({historyReports.length})</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {activeTab === 'input' ? (
            // INPUT TAB
            <div className="islamic-card p-3 sm:p-6 lg:p-8">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 lg:space-y-8">
                {/* Date Selector */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-6 sm:gap-4 sm:items-start">
                  <div className="sm:col-span-4">
                    <label htmlFor="date" className="block text-xs sm:text-sm font-medium text-green-800 mb-2 flex items-center space-x-2">
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs sm:text-sm">تاريخ التقرير - Tanggal Laporan</span>
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="input-islamic w-full shadow-lg hover:shadow-xl focus:shadow-xl min-h-[44px]"
                    />
                    <div className="mt-1 text-xs text-gray-500 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">Hari ini: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                      <span className="sm:hidden">{new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-green-800 mb-2 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">Today</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setSelectedDate(getTodayDate())}
                      className="w-full px-1 sm:px-2 py-2 bg-yellow-500 text-gray-800 rounded-lg hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center min-h-[44px] text-xs"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline ml-1">Hari Ini</span>
                      <span className="sm:hidden">Hari Ini</span>
                    </button>
                  </div>
                  <div className="sm:col-span-1">
                    <label className="block text-xs sm:text-sm font-medium text-green-800 mb-2 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs">Load</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => loadReportForDate(selectedDate)}
                      className="w-full px-1 sm:px-2 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all duration-200 font-medium shadow-lg hover:shadow-xl flex items-center justify-center min-h-[44px] text-xs"
                    >
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span className="ml-1">Load Data</span>
                    </button>
                  </div>
                </div>

                {/* Dynamic Form Fields */}
                <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:gap-6 sm:grid-cols-2">
                  {formConfig.fields.map((field) => (
                    <div key={field.name} className={`space-y-1 ${field.type === 'textarea' ? 'sm:col-span-2' : ''}`}>
                      <label htmlFor={field.name} className="block text-xs sm:text-sm font-medium text-gray-700">
                        <span className="text-xs sm:text-sm">{field.label}</span>
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                        {field.category && (
                          <span className="text-xs text-gray-500 ml-2">({field.category})</span>
                        )}
                      </label>
                      {field.type === 'textarea' ? (
                        <textarea
                          id={field.name}
                          name={field.name}
                          rows={3}
                          placeholder={field.placeholder}
                          value={reportData[field.name] || ''}
                          onChange={(e) => handleFieldChange(field.name, e.target.value)}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                                   focus:outline-none focus:ring-2 focus:ring-ksu-yellow focus:border-ksu-orange 
                                   hover:border-ksu-orange transition-all duration-200 ease-in-out
                                   bg-white text-gray-900 placeholder-gray-500 resize-none
                                   text-sm sm:text-base"
                        />
                      ) : field.type === 'dropdown-number' ? (
                        <div className="relative group">
                          <div className="relative">
                            <input
                              type="number"
                              id={field.name}
                              name={field.name}
                              placeholder="Pilih atau ketik angka..."
                              value={reportData[field.name] || ''}
                              onChange={(e) => handleFieldChange(field.name, parseInt(e.target.value) || '')}
                              list={`${field.name}-datalist`}
                              min="1"
                              max="999"
                              className="mt-1 block w-full px-3 py-2 pr-10 sm:pr-12 border border-gray-300 rounded-lg shadow-sm 
                                       focus:outline-none focus:ring-2 focus:ring-ksu-yellow focus:border-ksu-orange 
                                       hover:border-ksu-orange hover:shadow-md
                                       transition-all duration-200 ease-in-out
                                       bg-white text-gray-900 placeholder-gray-500
                                       group-hover:bg-yellow-50
                                       text-sm sm:text-base font-medium"
                            />
                            <datalist id={`${field.name}-datalist`}>
                              {Array.from({length: 30}, (_, i) => (
                                <option key={i + 1} value={i + 1} label={`${i + 1}`} />
                              ))}
                            </datalist>
                            
                            {/* Enhanced Dropdown Icon */}
                            <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                              <div className="relative group-hover:scale-110 transition-transform duration-200">
                                <svg 
                                  className="w-4 h-4 sm:w-5 sm:h-5 text-ksu-orange group-hover:text-ksu-red transition-colors duration-200" 
                                  fill="none" 
                                  stroke="currentColor" 
                                  viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                                </svg>
                                {/* Animated indicator dot */}
                                <div className="absolute -top-1 -right-1 w-2 h-2 bg-ksu-yellow rounded-full opacity-75 
                                              group-hover:bg-ksu-red group-hover:scale-125 transition-all duration-200"></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Enhanced Helper Text with better animation */}
                          <div className="mt-2 flex items-center justify-between text-xs transition-all duration-200">
                            <div className="flex items-center space-x-1 text-ksu-orange font-medium group-hover:text-ksu-red">
                              <svg className="w-3 h-3 group-hover:animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs">Klik untuk pilihan 1-30</span>
                            </div>
                            {reportData[field.name] && (
                              <div className="text-green-600 font-bold flex items-center space-x-1 animate-fadeIn">
                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                                <span>{reportData[field.name]}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <input
                          type={field.type}
                          id={field.name}
                          name={field.name}
                          placeholder={field.placeholder}
                          value={reportData[field.name] || (field.type === 'number' ? 0 : '')}
                          onChange={(e) => handleFieldChange(
                            field.name, 
                            field.type === 'number' ? parseInt(e.target.value) || 0 : e.target.value
                          )}
                          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm 
                                   focus:outline-none focus:ring-2 focus:ring-ksu-yellow focus:border-ksu-orange 
                                   hover:border-ksu-orange transition-all duration-200 ease-in-out
                                   bg-white text-gray-900 placeholder-gray-500
                                   text-sm sm:text-base"
                        />
                      )}
                    </div>
                  ))}
                </div>

                {message && (
                  <div className={`text-sm text-center ${message.includes('berhasil') || message.includes('dimuat') ? 'text-green-600' : 'text-red-600'}`}>
                    {message}
                  </div>
                )}

                <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-islamic-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin w-3 h-3 sm:w-4 sm:h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-xs sm:text-sm">حفظ... - Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                        </svg>
                        <span className="text-xs sm:text-sm">حفظ التقرير - Simpan Laporan</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-500 text-white font-medium px-4 sm:px-6 py-3 rounded-lg hover:bg-gray-600 hover:shadow-lg hover:scale-105 transition-all duration-200 border border-gray-600 flex items-center justify-center space-x-2 min-h-[44px] text-sm sm:text-base"
                  >
                    <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span className="text-xs sm:text-sm">إعادة تعيين - Reset Form</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            // HISTORY TAB
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="px-3 sm:px-6 py-4 border-b border-gray-200 flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center">
                <h2 className="text-base sm:text-lg font-medium text-gray-900">
                  History Laporan Saya ({historyReports.length} records)
                </h2>
                <button
                  onClick={exportMyReports}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm sm:text-base min-h-[44px] flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Export Excel</span>
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        No
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tanggal Laporan
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Tanggal Input
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data Laporan
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {historyReports.map((report, index) => (
                      <tr key={report.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(report.date).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Date(report.createdAt).toLocaleDateString('id-ID')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          <div className="max-w-xs overflow-hidden">
                            {Object.entries(report.reportData || {}).map(([key, value]) => (
                              <div key={key} className="text-xs">
                                <span className="font-medium">{key}:</span> {String(value)}
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => loadReportFromHistory(report)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {historyReports.length === 0 && !historyLoading && (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada data laporan. Silakan input laporan pertama Anda.
                  </div>
                )}
                
                {historyLoading && (
                  <div className="text-center py-8 text-gray-500">
                    Loading history...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
