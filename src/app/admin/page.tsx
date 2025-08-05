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
                              {new Date(report.date).toLocaleDateString('id-ID')}
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
