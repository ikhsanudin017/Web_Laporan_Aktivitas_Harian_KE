'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createDynamicExcelExport } from '@/lib/excel-utils'
import * as XLSX from 'xlsx'
import Image from 'next/image'

interface User {
  id: string
  email: string
  name: string
  role: string
}

interface Report {
  id: string
  date: string
  reportData: any
  createdAt?: string
  updatedAt?: string
  user: {
    name: string
    role: string
    email: string
  }
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [editingReport, setEditingReport] = useState<Report | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editReportData, setEditReportData] = useState<any>({})
  const [currentTime, setCurrentTime] = useState(new Date())
  const router = useRouter()

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

    const parsedUser = JSON.parse(userData)
    if (parsedUser.role !== 'ADMIN') {
      router.push('/dashboard')
      return
    }

    setUser(parsedUser)
    loadReports()
  }, [router])

  const loadReports = async () => {
    try {
      const token = localStorage.getItem('token')
      let url = '/api/admin/reports'
      
      if (startDate && endDate) {
        url += `?startDate=${startDate}&endDate=${endDate}`
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    loadReports()
  }

  const exportToExcel = async () => {
    if (reports.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    try {
      console.log('Starting admin export with', reports.length, 'reports')
      console.log('Sample report data:', reports[0])
      
      // For admin export, we need to show all fields from all users
      // Group reports by user to show their specific data
      const reportsWithUserContext = reports.map(report => ({
        id: report.id,
        date: report.date,
        reportData: report.reportData || {},
        createdAt: report.createdAt || report.date,
        user: {
          name: report.user.name,
          role: report.user.role // Keep original user role for field mapping
        }
      }))

      console.log('Processed reports data:', reportsWithUserContext[0])

      // Create Excel export for all reports using the dynamic function
      const excelResult = createDynamicExcelExport({
        title: 'LAPORAN AKTIVITAS HARIAN - ADMIN',
        subtitle: `Data Semua Laporan (${reports.length} laporan dari ${new Set(reports.map(r => r.user.name)).size} user)`,
        data: reportsWithUserContext,
        sheetName: 'Laporan Admin',
        filename: 'Laporan_Admin_Semua_Data',
        userInfo: {
          name: 'Administrator',
          role: 'ADMIN'
        },
        dateRange: {
          start: startDate || undefined,
          end: endDate || undefined
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
      
      alert('File Excel berhasil diunduh dengan tema Islamic Corporate! Data lengkap dari semua user.')
    } catch (error) {
      console.error('Export error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert('Gagal mengekspor data: ' + errorMessage)
    }
  }

  const resetAllData = async () => {
    const confirmReset = window.confirm(
      'PERINGATAN: Ini akan menghapus SEMUA data aktivitas harian dari semua user. Tindakan ini tidak dapat dibatalkan. Apakah Anda yakin?'
    )
    
    if (!confirmReset) return

    const confirmAgain = window.confirm(
      'Konfirmasi sekali lagi: Anda akan menghapus SEMUA laporan aktivitas harian. Yakin melanjutkan?'
    )
    
    if (!confirmAgain) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/admin/reset-all', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (response.ok) {
        alert(`Berhasil menghapus ${data.deletedCount} laporan aktivitas`)
        loadReports() // Refresh data
      } else {
        alert(data.error || 'Gagal menghapus data')
      }
    } catch (error) {
      console.error('Error resetting data:', error)
      alert('Terjadi kesalahan saat menghapus data')
    }
  }

  const handleEditReport = (report: Report) => {
    setEditingReport(report)
    setEditReportData(report.reportData || {})
    setShowEditModal(true)
  }

  const handleUpdateReport = async () => {
    if (!editingReport) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/reports/${editingReport.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          reportData: editReportData
        })
      })

      const data = await response.json()

      if (response.ok) {
        alert('Laporan berhasil diperbarui!')
        setShowEditModal(false)
        setEditingReport(null)
        setEditReportData({})
        await loadReports() // Refresh data
      } else {
        alert(data.message || 'Gagal memperbarui laporan')
      }
    } catch (error) {
      alert('Terjadi kesalahan saat memperbarui laporan')
    }
  }

  const handleDeleteReport = async (reportId: string, userName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus laporan dari ${userName}? Tindakan ini tidak dapat dibatalkan.`)) {
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
        alert('Laporan berhasil dihapus!')
        await loadReports() // Refresh data
      } else {
        alert(data.message || 'Gagal menghapus laporan')
      }
    } catch (error) {
      alert('Terjadi kesalahan saat menghapus laporan')
    }
  }

  const closeEditModal = () => {
    setShowEditModal(false)
    setEditingReport(null)
    setEditReportData({})
  }

  const handleLogout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    router.push('/')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center py-4 sm:py-6">
            <div className="flex items-center space-x-3 sm:space-x-4">
              {/* Logo */}
              <Image 
                src="/logo-ksu-ke.png" 
                alt="Logo KSU KE" 
                width={50} 
                height={50}
                className="sm:w-[60px] sm:h-[60px] rounded-lg shadow-md"
              />
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                  Admin Dashboard
                </h1>
                <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-3 space-y-1 sm:space-y-0">
                  <p className="text-xs sm:text-sm text-gray-600">Selamat datang, {user.name}</p>
                  <div className="flex items-center space-x-2 text-xs text-blue-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                      Live Time: {currentTime.toLocaleTimeString('id-ID', { 
                        timeZone: 'Asia/Jakarta',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })} WIB
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm sm:text-base min-h-[44px] flex items-center justify-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-6 lg:px-8">
        <div className="space-y-6">
          {/* Filter Form */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            <h2 className="text-base sm:text-lg font-medium text-gray-900 mb-4">Filter Laporan</h2>
            <form onSubmit={handleFilterSubmit} className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 sm:items-end">
              <div className="flex-1">
                <label htmlFor="startDate" className="block text-xs sm:text-sm font-medium text-gray-700">
                  Tanggal Mulai
                </label>
                <input
                  type="date"
                  id="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="endDate" className="block text-xs sm:text-sm font-medium text-gray-700">
                  Tanggal Akhir
                </label>
                <input
                  type="date"
                  id="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                />
              </div>
              <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-3 sm:px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 text-sm sm:text-base min-h-[44px] flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  <span>{loading ? 'Loading...' : 'Filter'}</span>
                </button>
                <button
                  type="button"
                  onClick={exportToExcel}
                  className="px-3 sm:px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm sm:text-base min-h-[44px] flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  <span>Export Excel</span>
                </button>
                <button
                  type="button"
                  onClick={resetAllData}
                  className="px-3 sm:px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm sm:text-base min-h-[44px] flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                  </svg>
                  <span>Reset Semua Data</span>
                </button>
              </div>
            </form>
          </div>

          {/* Monitoring Dashboard */}
          <div className="bg-white shadow rounded-lg p-4 sm:p-6">
            {/* Header Section */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 space-y-3 lg:space-y-0">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  📊 Monitoring Pengisian Laporan
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  Pantau kepatuhan pengisian laporan aktivitas harian secara real-time
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 text-sm text-gray-600">
                <div className="flex items-center space-x-2">
                  <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">
                    Periode: 1 - {new Date().getDate()} {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1 text-xs bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  <svg className="w-3 h-3 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  <span className="text-amber-700 font-medium">Hari kerja saja (Kecuali Minggu & libur nasional)</span>
                </div>
              </div>
            </div>

            {(() => {
              // Fungsi untuk menghitung statistik monitoring
              const calculateUserStats = () => {
                const today = new Date()
                const currentMonth = today.getMonth()
                const currentYear = today.getFullYear()
                const currentDay = today.getDate()
                
                // Daftar tanggal merah nasional Indonesia 2025 (format: MM-DD)
                const nationalHolidays = [
                  '01-01', // Tahun Baru
                  '01-29', // Tahun Baru Imlek
                  '03-14', // Hari Raya Nyepi
                  '03-29', // Wafat Isa Almasih
                  '04-09', // Isra Miraj
                  '04-30', // Hari Raya Idul Fitri
                  '05-01', // Hari Buruh
                  '05-08', // Hari Raya Idul Fitri
                  '05-29', // Kenaikan Isa Almasih
                  '06-01', // Hari Lahir Pancasila
                  '06-07', // Hari Raya Idul Adha
                  '06-28', // Tahun Baru Islam
                  '08-17', // Hari Kemerdekaan
                  '09-07', // Maulid Nabi Muhammad SAW
                  '12-25', // Hari Raya Natal
                ]
                
                // Fungsi untuk cek apakah tanggal adalah hari kerja
                const isWorkingDay = (dateString: string) => {
                  const date = new Date(dateString)
                  const dayOfWeek = date.getDay() // 0 = Minggu, 6 = Sabtu
                  const monthDay = String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
                  
                  // Cek apakah Minggu (Sabtu adalah hari kerja di KSU KE)
                  if (dayOfWeek === 0) {
                    return false
                  }
                  
                  // Cek apakah tanggal merah nasional
                  if (nationalHolidays.includes(monthDay)) {
                    return false
                  }
                  
                  return true
                }
                
                // Buat array tanggal hari kerja dari tanggal 1 sampai hari ini
                const workingDays = []
                for (let day = 1; day <= currentDay; day++) {
                  const dateString = new Date(currentYear, currentMonth, day).toISOString().split('T')[0]
                  if (isWorkingDay(dateString)) {
                    workingDays.push(dateString)
                  }
                }
                
                // Group reports by user dan hitung statistik
                const userStats = reports.reduce((acc, report) => {
                  const userName = report.user.name
                  const reportDate = report.date
                  
                  if (!acc[userName]) {
                    acc[userName] = {
                      name: userName,
                      email: report.user.email,
                      role: report.user.role,
                      reportedDates: new Set(),
                      totalReports: 0,
                      lastReportDate: null
                    }
                  }
                  
                  // Hanya hitung laporan yang dibuat di hari kerja
                  if (isWorkingDay(reportDate)) {
                    acc[userName].reportedDates.add(reportDate)
                  }
                  acc[userName].totalReports++
                  
                  if (!acc[userName].lastReportDate || reportDate > acc[userName].lastReportDate) {
                    acc[userName].lastReportDate = reportDate
                  }
                  
                  return acc
                }, {} as Record<string, any>)
                
                // Hitung persentase untuk setiap user berdasarkan hari kerja
                return Object.values(userStats).map((stat: any) => {
                  const reportedWorkingDays = stat.reportedDates.size
                  const totalWorkingDays = workingDays.length
                  const percentage = totalWorkingDays > 0 ? Math.round((reportedWorkingDays / totalWorkingDays) * 100) : 0
                  const missingWorkingDays = totalWorkingDays - reportedWorkingDays
                  
                  return {
                    ...stat,
                    reportedDays: reportedWorkingDays,
                    totalExpectedDays: totalWorkingDays,
                    percentage,
                    missingDays: missingWorkingDays,
                    status: percentage === 100 ? 'complete' : percentage >= 80 ? 'good' : percentage >= 60 ? 'warning' : 'poor'
                  }
                }).sort((a, b) => b.percentage - a.percentage)
              }

              const userStats = calculateUserStats()
              
              return (
                <>
                  {/* Statistics Overview Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-8">
                    {/* Total Users */}
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border border-blue-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Total User</p>
                          <p className="text-lg sm:text-xl font-bold text-blue-700">{userStats.length}</p>
                        </div>
                        <div className="p-2 bg-blue-200 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Complete (100%) */}
                    <div className="bg-gradient-to-r from-green-50 to-emerald-100 p-4 rounded-xl border border-green-200 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-green-900 mb-1">Lengkap</p>
                          <div className="flex items-center space-x-1">
                            <p className="text-lg sm:text-xl font-bold text-green-700">
                              {userStats.filter((stat: any) => stat.percentage === 100).length}
                            </p>
                            <span className="text-xs text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">100%</span>
                          </div>
                        </div>
                        <div className="p-2 bg-green-200 rounded-lg">
                          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Good (80%+) */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-100 p-4 rounded-xl border border-blue-300 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-blue-900 mb-1">Baik</p>
                          <div className="flex items-center space-x-1">
                            <p className="text-lg sm:text-xl font-bold text-blue-700">
                              {userStats.filter((stat: any) => stat.percentage >= 80 && stat.percentage < 100).length}
                            </p>
                            <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">80%+</span>
                          </div>
                        </div>
                        <div className="p-2 bg-blue-200 rounded-lg">
                          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Warning (60-79%) */}
                    <div className="bg-gradient-to-r from-yellow-50 to-orange-100 p-4 rounded-xl border border-yellow-300 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-yellow-900 mb-1">Perhatian</p>
                          <div className="flex items-center space-x-1">
                            <p className="text-lg sm:text-xl font-bold text-yellow-700">
                              {userStats.filter((stat: any) => stat.percentage >= 60 && stat.percentage < 80).length}
                            </p>
                            <span className="text-xs text-yellow-700 bg-yellow-100 px-1.5 py-0.5 rounded-full">60-79%</span>
                          </div>
                        </div>
                        <div className="p-2 bg-yellow-200 rounded-lg">
                          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Poor (<60%) */}
                    <div className="bg-gradient-to-r from-red-50 to-pink-100 p-4 rounded-xl border border-red-300 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-red-900 mb-1">Perlu Tindakan</p>
                          <div className="flex items-center space-x-1">
                            <p className="text-lg sm:text-xl font-bold text-red-700">
                              {userStats.filter((stat: any) => stat.percentage < 60).length}
                            </p>
                            <span className="text-xs text-red-700 bg-red-100 px-1.5 py-0.5 rounded-full">&lt;60%</span>
                          </div>
                        </div>
                        <div className="p-2 bg-red-200 rounded-lg">
                          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Average */}
                    <div className="bg-gradient-to-r from-purple-50 to-indigo-100 p-4 rounded-xl border border-purple-300 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs sm:text-sm font-medium text-purple-900 mb-1">Rata-rata</p>
                          <div className="flex items-center space-x-1">
                            <p className="text-lg sm:text-xl font-bold text-purple-700">
                              {userStats.length > 0 ? Math.round(userStats.reduce((acc: number, stat: any) => acc + stat.percentage, 0) / userStats.length) : 0}%
                            </p>
                            <span className="text-xs text-purple-600 bg-purple-100 px-1.5 py-0.5 rounded-full">Kepatuhan</span>
                          </div>
                        </div>
                        <div className="p-2 bg-purple-200 rounded-lg">
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
                            <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Performance Table */}
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                      <h3 className="text-lg font-medium text-gray-900 flex items-center space-x-2">
                        <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Detail Performa User</span>
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Rincian tingkat kepatuhan setiap user dalam mengisi laporan harian
                      </p>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              User & Informasi
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Progress & Presentase
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Statistik Laporan
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Terakhir Input
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {userStats.map((stat: any, index: number) => (
                            <tr key={stat.name} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-25'}`}>
                              {/* User Info */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-3">
                                  <div className="flex-shrink-0">
                                    <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                      stat.percentage === 100 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                      stat.percentage >= 80 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                      stat.percentage >= 60 ? 'bg-gradient-to-r from-yellow-400 to-orange-500' :
                                      'bg-gradient-to-r from-red-400 to-pink-500'
                                    }`}>
                                      <span className="text-sm">
                                        {stat.name.split(' ').map((n: string) => n.charAt(0)).join('').toUpperCase().slice(0, 2)}
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-medium text-gray-900">
                                      {stat.name}
                                    </div>
                                    <div className="text-xs text-gray-500 flex items-center space-x-1">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                      </svg>
                                      <span>{stat.email}</span>
                                    </div>
                                    <div className="text-xs text-gray-400 mt-1">
                                      Role: {stat.role}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              
                              {/* Progress */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between text-sm">
                                    <span className="font-semibold text-gray-900">{stat.percentage}%</span>
                                    <span className="text-gray-500 text-xs">
                                      {stat.reportedDays}/{stat.totalExpectedDays} hari
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                                    <div 
                                      className={`h-2.5 rounded-full transition-all duration-500 ease-out ${
                                        stat.percentage === 100 ? 'bg-gradient-to-r from-green-400 to-green-600' :
                                        stat.percentage >= 80 ? 'bg-gradient-to-r from-blue-400 to-blue-600' :
                                        stat.percentage >= 60 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600' :
                                        'bg-gradient-to-r from-red-400 to-red-600'
                                      }`}
                                      style={{ width: `${stat.percentage}%` }}
                                    ></div>
                                  </div>
                                  {stat.percentage < 100 && (
                                    <div className="text-xs text-gray-500">
                                      Target: 100% • Kurang: {100 - stat.percentage}%
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              {/* Report Stats */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-gray-900">{stat.totalReports}</span>
                                    <span className="text-xs text-gray-500">Total laporan</span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <span className="text-sm font-medium text-green-600">{stat.reportedDays}</span>
                                    <span className="text-xs text-gray-500">Hari dilaporkan</span>
                                  </div>
                                  {stat.missingDays > 0 && (
                                    <div className="flex items-center space-x-2">
                                      <span className="text-sm font-medium text-red-600">{stat.missingDays}</span>
                                      <span className="text-xs text-red-500">Hari terlewat</span>
                                    </div>
                                  )}
                                </div>
                              </td>
                              
                              {/* Status Badge */}
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex flex-col space-y-1">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                    stat.status === 'complete' 
                                      ? 'bg-green-100 text-green-800 border border-green-200'
                                      : stat.status === 'good'
                                      ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                      : stat.status === 'warning'
                                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                                      : 'bg-red-100 text-red-800 border border-red-200'
                                  }`}>
                                    {stat.status === 'complete' && '✅ Sempurna'}
                                    {stat.status === 'good' && '👍 Baik Sekali'}
                                    {stat.status === 'warning' && '⚠️ Perlu Perhatian'}
                                    {stat.status === 'poor' && '🚨 Perlu Tindakan'}
                                  </span>
                                  <div className="text-xs text-gray-500 text-center">
                                    Ranking #{index + 1}
                                  </div>
                                </div>
                              </td>
                              
                              {/* Last Report */}
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                <div className="space-y-1">
                                  {stat.lastReportDate ? (
                                    <>
                                      <div className="font-medium text-gray-900">
                                        {new Date(stat.lastReportDate).toLocaleDateString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          year: 'numeric'
                                        })}
                                      </div>
                                      <div className="text-xs text-gray-500">
                                        {new Date(stat.lastReportDate).toLocaleDateString('id-ID', {
                                          weekday: 'long'
                                        })}
                                      </div>
                                    </>
                                  ) : (
                                    <div className="text-red-500 font-medium">
                                      Belum ada laporan
                                    </div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Empty State */}
                  {userStats.length === 0 && (
                    <div className="text-center py-12">
                      <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 mb-4">
                        <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">Belum ada data laporan</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Belum ada laporan aktivitas yang masuk untuk bulan ini.
                      </p>
                      <div className="mt-4">
                        <button
                          onClick={loadReports}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                        >
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                          Refresh Data
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          {/* Reports Table */}
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
                <h2 className="text-lg font-medium text-gray-900">
                  Laporan Aktivitas Harian ({reports.length} records)
                </h2>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center space-x-2 text-blue-600">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span className="bg-blue-50 px-2 py-1 rounded-full border border-blue-200">
                      Update Real-time: {currentTime.toLocaleTimeString('id-ID', { 
                        timeZone: 'Asia/Jakarta',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1 text-green-600">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-xs">Live</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              {(() => {
                // Group reports by user name
                const reportsByUser = reports.reduce((acc, report) => {
                  const userName = report.user.name
                  if (!acc[userName]) {
                    acc[userName] = []
                  }
                  acc[userName].push(report)
                  return acc
                }, {} as Record<string, Report[]>)

                return Object.entries(reportsByUser).map(([userName, userReports]) => (
                  <div key={userName} className="mb-8">
                    {/* User Header */}
                    <div className="bg-gray-100 px-6 py-3 border-b">
                      <h3 className="text-md font-semibold text-gray-800">
                        {userName} ({userReports.length} laporan)
                      </h3>
                    </div>
                    
                    {/* User Reports Table */}
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            No
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Tanggal
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                              </svg>
                              <span>Waktu Input Realtime</span>
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                            <div className="flex items-center space-x-1">
                              <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                              </svg>
                              <span>Status Update</span>
                            </div>
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Laporan
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {userReports.map((report, index) => (
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
                                title={`Input oleh ${report.user.name} pada: ${new Date(report.createdAt || report.date).toLocaleString('id-ID', { 
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
                                  <span className="text-xs font-medium text-blue-600">
                                    {new Date(report.createdAt || report.date).toLocaleString('id-ID', {
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
                                    {getRelativeTime(report.createdAt || report.date)}
                                  </span>
                                </div>
                                
                                {/* User info dan zona waktu */}
                                <div className="flex items-center space-x-1">
                                  <div className="flex items-center space-x-1">
                                    <svg className="w-3 h-3 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="text-xs text-purple-600 font-medium bg-purple-50 px-1 py-0.5 rounded">
                                      {report.user.name}
                                    </span>
                                  </div>
                                  <span className="text-xs text-indigo-500 font-medium">
                                    WIB
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
                                  onClick={() => handleEditReport(report)}
                                  className="text-indigo-600 hover:text-indigo-900 flex items-center space-x-1"
                                >
                                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                  </svg>
                                  <span>Edit</span>
                                </button>
                                <button
                                  onClick={() => handleDeleteReport(report.id, report.user.name)}
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
                  </div>
                ))
              })()}
              
              {reports.length === 0 && !loading && (
                <div className="text-center py-8 text-gray-500">
                  Tidak ada data laporan ditemukan
                </div>
              )}
              
              {loading && (
                <div className="text-center py-8 text-gray-500">
                  Loading...
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Edit Modal */}
      {showEditModal && editingReport && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Laporan - {editingReport.user.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Tanggal: {new Date(editingReport.date).toLocaleDateString('id-ID')}
              </p>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(editingReport.reportData || {}).map(([key, value]) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {key}
                    </label>
                    {typeof value === 'string' && value.length > 50 ? (
                      <textarea
                        value={editReportData[key] || ''}
                        onChange={(e) => setEditReportData((prev: any) => ({
                          ...prev,
                          [key]: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                        rows={3}
                      />
                    ) : (
                      <input
                        type={typeof value === 'number' ? 'number' : 'text'}
                        value={editReportData[key] || ''}
                        onChange={(e) => setEditReportData((prev: any) => ({
                          ...prev,
                          [key]: typeof value === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                      />
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateReport}
                  className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
