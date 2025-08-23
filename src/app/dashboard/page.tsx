'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FORM_CONFIGS } from '@/lib/form-configs'
import { createDynamicExcelExport } from '@/lib/excel-utils'
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

  // Fungsi untuk menampilkan waktu relatif (menggunakan currentTime untuk real-time update)
  const getRelativeTime = (dateString: string) => {
    const inputTime = new Date(dateString)
    const diffInSeconds = Math.floor((currentTime.getTime() - inputTime.getTime()) / 1000)

    if (diffInSeconds < 0) {
      return 'Baru saja'
    } else if (diffInSeconds < 60) {
      return `${diffInSeconds} detik yang lalu`
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} menit yang lalu`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} jam yang lalu`
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} hari yang lalu`
    } else {
      const months = Math.floor(diffInSeconds / 2592000)
      return `${months} bulan yang lalu`
    }
  }
  
  const [selectedDate, setSelectedDate] = useState(getTodayDate())
  const [activeTab, setActiveTab] = useState<'input' | 'history'>('input')
  const [historyReports, setHistoryReports] = useState<HistoryReport[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [editingReport, setEditingReport] = useState<HistoryReport | null>(null)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()

  // Update waktu relatif setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 30000) // Update setiap 30 detik

    return () => clearInterval(interval)
  }, [])

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
      
      // Check if we're editing an existing report
      if (editingReport) {
        await handleEditReport(editingReport.id, reportData, selectedDate) // 🔧 PERBAIKAN: Tambah selectedDate parameter
        return
      }

      // Create new report
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

  const exportMyReports = async () => {
    if (historyReports.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    try {
      console.log('🔍 DEBUG: User object in exportMyReports:', user);
      console.log('🔍 DEBUG: User name:', user?.name);
      
      // Prepare reports data for export
      const reportsData = historyReports.map(report => ({
        id: report.id,
        date: report.date,
        reportData: report.reportData || {},
        createdAt: report.createdAt || report.date,
        user: {
          name: user?.name || 'Unknown User',
          email: user?.email || '',
          role: user?.role || 'UNKNOWN'
        }
      }))

      console.log('🔍 DEBUG: Reports data prepared:', reportsData);
      console.log('🔍 DEBUG: First report sample:', JSON.stringify(reportsData[0], null, 2));
      console.log('🔍 DEBUG: History reports raw:', historyReports.slice(0, 2));

      // Use the new dynamic export function with Islamic Corporate theme
      const excelResult = createDynamicExcelExport({
        title: 'LAPORAN AKTIVITAS HARIAN',
        subtitle: `Data Laporan - ${user?.name?.toUpperCase() || 'USER'}`,
        data: reportsData,
        sheetName: 'Laporan Saya',
        filename: `Laporan_${user?.name?.replace(/\s+/g, '_') || 'User'}`,
        userInfo: {
          name: user?.name || 'Unknown User',
          role: user?.role || 'UNKNOWN'
        }
      })

      // Create download link and trigger download
      const blob = new Blob([excelResult.buffer], { type: excelResult.mimeType })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${excelResult.filename}_${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}.xlsx`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      alert('File Excel berhasil diunduh dengan tema Islamic Corporate! Kolom sesuai dengan form input Anda.')
    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('Gagal mengekspor data: ' + errorMessage)
    }
  }  

  // Reset form to empty state
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

  // 🔧 PERBAIKAN: Load report from history dengan sinkronisasi tanggal yang benar
  const loadReportFromHistory = (report: HistoryReport) => {
    // Extract date from report.date (could be ISO string or date string)
    const reportDate = report.date.includes('T') ? report.date.split('T')[0] : report.date
    
    console.log('📅 Loading report from history:', {
      reportId: report.id,
      originalReportDate: report.date,
      extractedDate: reportDate,
      reportData: report.reportData
    })
    
    // Set the selectedDate to match the report date
    setSelectedDate(reportDate)
    setReportData(report.reportData)
    setEditingReport(report)
    setActiveTab('input')
    setMessage(`Data dari tanggal ${new Date(reportDate).toLocaleDateString('id-ID')} dimuat untuk diedit`)
  }

  // 🔧 PERBAIKAN: Update handleEditReport untuk support update tanggal
  const handleEditReport = async (reportId: string, updatedData: any, updatedDate?: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      
      // Prepare request body - include date if it's being updated
      const requestBody: any = {
        reportData: updatedData
      }
      
      // 🔧 PERBAIKAN: Include date update if provided
      if (updatedDate && editingReport) {
        const originalDate = editingReport.date.includes('T') ? editingReport.date.split('T')[0] : editingReport.date
        if (updatedDate !== originalDate) {
          requestBody.date = updatedDate
          console.log('📅 Updating report date from', originalDate, 'to', updatedDate)
        }
      }
      
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestBody)
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Laporan berhasil diperbarui!')
        setEditingReport(null)
        setReportData({})
        await loadHistoryReports() // Refresh history
        
        // Clear message after 3 seconds
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(data.message || 'Gagal memperbarui laporan')
      }
    } catch (error) {
      setMessage('Terjadi kesalahan saat memperbarui laporan')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteReport = async (reportId: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus laporan ini? Tindakan ini tidak dapat dibatalkan.')) {
      return
    }

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()

      if (response.ok) {
        setMessage('Laporan berhasil dihapus!')
        await loadHistoryReports() // Refresh history
        setShowDeleteModal(null)
      } else {
        setMessage(data.message || 'Gagal menghapus laporan')
      }
    } catch (error) {
      setMessage('Terjadi kesalahan saat menghapus laporan')
    }
  }

  const cancelEdit = () => {
    setEditingReport(null)
    setReportData({})
    setMessage('')
    // Reset date to today when canceling edit
    setSelectedDate(getTodayDate())
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
                <div className="flex items-center space-x-2">
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white leading-tight" style={{fontFamily: 'Poppins, sans-serif'}}>
                    {formConfig.title}
                  </h1>
                  {editingReport && (
                    <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-medium animate-pulse">
                      MODE EDIT
                    </span>
                  )}
                </div>
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
                      {/* 🔧 PERBAIKAN: Show indicator when editing */}
                      {editingReport && (
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          📝 Editing Report
                        </span>
                      )}
                    </label>
                    <input
                      type="date"
                      id="date"
                      value={selectedDate}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="input-islamic w-full shadow-lg hover:shadow-xl focus:shadow-xl min-h-[44px]"
                      style={{
                        color: '#1f2937',
                        WebkitTextFillColor: '#1f2937'
                      }}
                    />
                    <div className="mt-1 text-xs text-gray-500 flex items-center space-x-1">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                      <span className="hidden sm:inline">
                        {editingReport ? 
                          `Edit laporan tanggal: ${new Date(editingReport.date).toLocaleDateString('id-ID')}` :
                          `Hari ini: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`
                        }
                      </span>
                      <span className="sm:hidden">
                        {editingReport ? 
                          `Edit: ${new Date(editingReport.date).toLocaleDateString('id-ID')}` :
                          new Date().toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' })
                        }
                      </span>
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
                              value={reportData[field.name] !== undefined && reportData[field.name] !== null ? reportData[field.name] : ''}
                              onChange={(e) => {
                                const value = e.target.value
                                if (value === '') {
                                  handleFieldChange(field.name, '')
                                } else {
                                  const numValue = parseInt(value)
                                  handleFieldChange(field.name, isNaN(numValue) ? '' : numValue)
                                }
                              }}
                              list={`${field.name}-datalist`}
                              min="0"
                              max="30"
                              className="mt-1 block w-full px-3 py-2 pr-10 sm:pr-12 border border-gray-300 rounded-lg shadow-sm 
                                       focus:outline-none focus:ring-2 focus:ring-ksu-yellow focus:border-ksu-orange 
                                       hover:border-ksu-orange hover:shadow-md
                                       transition-all duration-200 ease-in-out
                                       bg-white text-gray-900 placeholder-gray-500
                                       group-hover:bg-yellow-50
                                       text-sm sm:text-base font-medium"
                            />
                            <datalist id={`${field.name}-datalist`}>
                              {Array.from({length: 31}, (_, i) => (
                                <option key={i} value={i} label={`${i}`} />
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
                              <span className="text-xs">Klik untuk pilihan 0-30</span>
                            </div>
                            {(reportData[field.name] !== undefined && reportData[field.name] !== null && reportData[field.name] !== '') && (
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
                        <span className="text-xs sm:text-sm">{editingReport ? 'تحديث التقرير - Update Laporan' : 'حفظ التقرير - Simpan Laporan'}</span>
                      </>
                    )}
                  </button>
                  {editingReport && (
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="bg-red-500 text-white font-medium px-4 sm:px-6 py-3 rounded-lg hover:bg-red-600 hover:shadow-lg hover:scale-105 transition-all duration-200 border border-red-600 flex items-center justify-center space-x-2 min-h-[44px] text-sm sm:text-base"
                    >
                      <svg className="w-3 h-3 sm:w-4 sm:h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <span className="text-xs sm:text-sm">إلغاء - Batal Edit</span>
                    </button>
                  )}
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
            // HISTORY TAB - Sama seperti kode asli, tidak ada perubahan di sini
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
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                          <span>Waktu Input Realtime</span>
                        </div>
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                          <span>Status Update</span>
                        </div>
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
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {(() => {
                                try {
                                  // Parse tanggal dengan berbagai format yang mungkin
                                  let dateObj;
                                  if (report.date.includes('T')) {
                                    dateObj = new Date(report.date);
                                  } else {
                                    dateObj = new Date(report.date + 'T00:00:00');
                                  }
                                  
                                  // Validasi apakah tanggal valid
                                  if (isNaN(dateObj.getTime())) {
                                    return report.date; // Fallback ke string asli
                                  }
                                  
                                  return dateObj.toLocaleDateString('id-ID', {
                                    weekday: 'long',
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    timeZone: 'Asia/Jakarta'
                                  });
                                } catch (error) {
                                  return report.date; // Fallback jika error
                                }
                              })()}
                            </span>
                            <span className="text-xs text-gray-500">
                              {(() => {
                                try {
                                  let dateObj;
                                  if (report.date.includes('T')) {
                                    dateObj = new Date(report.date);
                                  } else {
                                    dateObj = new Date(report.date + 'T00:00:00');
                                  }
                                  
                                  if (isNaN(dateObj.getTime())) {
                                    return report.date;
                                  }
                                  
                                  return dateObj.toLocaleDateString('id-ID', {
                                    timeZone: 'Asia/Jakarta'
                                  });
                                } catch (error) {
                                  return report.date;
                                }
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div 
                            className="flex flex-col space-y-2 cursor-help" 
                            title={`Input pada: ${new Date(report.createdAt).toLocaleString('id-ID', { 
                              timeZone: 'Asia/Jakarta',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })} WIB`}
                          >
                            {/* Waktu lengkap */}
                            <div className="flex items-center space-x-2">
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <span className="font-medium text-blue-600">
                                {new Date(report.createdAt).toLocaleString('id-ID', {
                                  weekday: 'short',
                                  day: '2-digit',
                                  month: '2-digit', 
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  second: '2-digit',
                                  timeZone: 'Asia/Jakarta'
                                })}
                              </span>
                            </div>
                            
                            {/* Waktu relatif */}
                            <div className="flex items-center space-x-2">
                              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                              <span className="text-xs text-gray-600 bg-green-50 px-2 py-1 rounded-full border border-green-200 hover:bg-green-100 transition-colors duration-200">
                                {getRelativeTime(report.createdAt)}
                              </span>
                            </div>
                            
                            {/* Zona waktu */}
                            <div className="flex items-center space-x-1">
                              <svg className="w-3 h-3 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.559-.499-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.559.499.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.497-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.029 11H4.083a6.004 6.004 0 002.783 4.118z" clipRule="evenodd" />
                              </svg>
                              <span className="text-xs text-indigo-500 font-medium">
                                WIB (UTC+7)
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden lg:table-cell">
                          <div className="flex flex-col">
                            {report.updatedAt && report.updatedAt !== report.createdAt ? (
                              <>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                  Diupdate
                                </span>
                                <span className="text-xs text-gray-400 mt-1">
                                  {new Date(report.updatedAt).toLocaleString('id-ID', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    timeZone: 'Asia/Jakarta'
                                  })}
                                </span>
                              </>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Original
                              </span>
                            )}
                          </div>
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
                          <div className="flex space-x-2">
                            <button
                              onClick={() => loadReportFromHistory(report)}
                              className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                              </svg>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleDeleteReport(report.id)}
                              className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                            >
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3l1.146-1.146a1 1 0 011.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 111.414-1.414L9 9V6a1 1 0 011-1z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h6a2 2 0 002-2V5a1 1 0 100-2H3z" clipRule="evenodd" />
                              </svg>
                              <span>Hapus</span>
                            </button>
                          </div>
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