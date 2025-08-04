'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  user: {
    name: string
    role: string
  }
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null)
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const router = useRouter()

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

  const exportToExcel = () => {
    if (reports.length === 0) {
      alert('Tidak ada data untuk diekspor')
      return
    }

    // Group reports by user name
    const reportsByUser = reports.reduce((acc, report) => {
      const userName = report.user.name
      if (!acc[userName]) {
        acc[userName] = []
      }
      acc[userName].push(report)
      return acc
    }, {} as Record<string, Report[]>)

    // Create workbook
    const wb = XLSX.utils.book_new()

    // Create sheet for each user
    Object.entries(reportsByUser).forEach(([userName, userReports]) => {
      // Create header information with logo reference and better formatting
      const headerInfo = [
        ['🏢 LAPORAN AKTIVITAS HARIAN MARKETING FUNDING'],
        ['   KOPERASI SERBA USAHA KIRAP ENTREPRENEURSHIP (KSUKE)'],
        ['   📍 Logo: Lihat file logo-ksu-ke.png'],
        ['=========================================================='],
        [''],
        [`📋 Nama: ${userName}`],
        [`👤 Role: ${userReports[0]?.user.role || ''}`],
        [`📅 Periode: ${startDate ? new Date(startDate).toLocaleDateString('id-ID') : 'Semua'} - ${endDate ? new Date(endDate).toLocaleDateString('id-ID') : 'Semua'}`],
        [`📊 Total Laporan: ${userReports.length} laporan`],
        [`🗓️ Tanggal Export: ${new Date().toLocaleDateString('id-ID')}`],
        [''],
        ['=========================================================='],
        ['                    DATA AKTIVITAS                    '],
        ['=========================================================='],
        [''] // Empty row before data
      ]

      // Create data rows with better formatting
      const excelData = userReports.map((report, index) => {
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
          'Waktu Input ⏰': new Date(report.createdAt || report.date).toLocaleString('id-ID')
        }
      })

      // Combine header and data
      const worksheetData = [
        ...headerInfo,
        Object.keys(excelData[0] || {}), // Column headers
        ...excelData.map(row => Object.values(row))
      ]

      // Create worksheet
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
        { wch: 22 }  // Waktu Input
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
        { s: { r: 0, c: 0 }, e: { r: 0, c: 8 } }, // Title row 1
        { s: { r: 1, c: 0 }, e: { r: 1, c: 8 } }, // Title row 2
        { s: { r: 2, c: 0 }, e: { r: 2, c: 8 } }, // Logo reference
        { s: { r: 12, c: 0 }, e: { r: 12, c: 8 } } // Data section title
      ]

      // Clean sheet name (remove invalid characters and limit length)
      const sheetName = userName.replace(/[\\\/\?\*\[\]]/g, '').substring(0, 31)
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, sheetName)
    })

    // Save file with formatted name
    const now = new Date()
    const dateStr = now.toLocaleDateString('id-ID').replace(/\//g, '-')
    const timeStr = now.toLocaleTimeString('id-ID', { hour12: false }).replace(/:/g, '-')
    const fileName = `Laporan_Aktivitas_KSUKE_${dateStr}_${timeStr}.xlsx`
    XLSX.writeFile(wb, fileName)
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
                <p className="text-xs sm:text-sm text-gray-600">Selamat datang, {user.name}</p>
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
              <h2 className="text-lg font-medium text-gray-900">
                Laporan Aktivitas Harian ({reports.length} records)
              </h2>
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
                            Waktu Input
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Data Laporan
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
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {new Date(report.date).toLocaleTimeString('id-ID')}
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
    </div>
  )
}
