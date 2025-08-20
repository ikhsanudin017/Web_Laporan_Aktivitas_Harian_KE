import { NextRequest, NextResponse } from 'next/server'
import { verifyToken } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Token tidak ditemukan' }, { status: 401 })
    }

    const decoded = verifyToken(token)
    if (!decoded || decoded.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 })
    }

    const body = await request.json()
    const { userIds, messageType } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'User IDs tidak valid' }, { status: 400 })
    }

    // Get users with WhatsApp numbers
    const users = await prisma.user.findMany({
      where: {
        id: { in: userIds },
        whatsapp: { not: null }
      },
      select: {
        id: true,
        name: true,
        whatsapp: true,
        role: true
      }
    })

    if (users.length === 0) {
      return NextResponse.json({ 
        error: 'Tidak ada user dengan nomor WhatsApp yang valid' 
      }, { status: 400 })
    }

    // Calculate user statistics for personalized messages
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const currentDay = today.getDate()

    // National holidays 2025 (format: MM-DD)
    const nationalHolidays = [
      '01-01', '01-29', '03-14', '03-29', '04-09', '04-30', 
      '05-01', '05-08', '05-29', '06-01', '06-07', '06-28', 
      '08-17', '09-07', '12-25'
    ]

    const isWorkingDay = (dateString: string) => {
      const date = new Date(dateString)
      const dayOfWeek = date.getDay()
      const monthDay = String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0')
      
      if (dayOfWeek === 0) return false // Sunday
      if (nationalHolidays.includes(monthDay)) return false
      return true
    }

    // Calculate working days
    const workingDays = []
    for (let day = 1; day <= currentDay; day++) {
      const dateString = new Date(currentYear, currentMonth, day).toISOString().split('T')[0]
      if (isWorkingDay(dateString)) {
        workingDays.push(dateString)
      }
    }

    const results = []

    for (const user of users) {
      try {
        // Get user's reports for this month
        const reports = await prisma.dailyReport.findMany({
          where: {
            userId: user.id,
            date: {
              gte: new Date(currentYear, currentMonth, 1),
              lte: new Date(currentYear, currentMonth + 1, 0)
            }
          }
        })

        // Calculate user statistics
        const reportedDates = new Set()
        reports.forEach(report => {
          const reportDate = report.date.toISOString().split('T')[0]
          if (isWorkingDay(reportDate)) {
            reportedDates.add(reportDate)
          }
        })

        const reportedWorkingDays = reportedDates.size
        const totalWorkingDays = workingDays.length
        const percentage = totalWorkingDays > 0 ? Math.round((reportedWorkingDays / totalWorkingDays) * 100) : 0
        const missingDays = totalWorkingDays - reportedWorkingDays

        // Create personalized message
        let message = ''
        const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        
        if (messageType === 'warning' && percentage >= 60 && percentage < 80) {
          message = `🔔 *PENGINGAT LAPORAN AKTIVITAS HARIAN*

Assalamu'alaikum ${user.name},

Kami ingin mengingatkan bahwa laporan aktivitas harian Anda untuk bulan ${monthName} masih perlu dilengkapi:

📊 *Status Laporan Anda:*
• Persentase kepatuhan: ${percentage}%
• Hari kerja yang sudah dilaporkan: ${reportedWorkingDays} dari ${totalWorkingDays} hari
• Hari yang belum dilaporkan: ${missingDays} hari

⚠️ Status: *PERLU PERHATIAN*

Mohon segera melengkapi laporan yang belum terisi agar mencapai target 100%. Laporan yang lengkap sangat membantu evaluasi kinerja dan perkembangan KSU KE.

🔗 Silakan login ke sistem: ${process.env.NEXT_PUBLIC_APP_URL || 'https://laporan-aktivitas-ksuke.vercel.app'}

Jazakallahu khairan,
*Tim Admin KSU KE*`
        } else if (messageType === 'urgent' && percentage < 60) {
          message = `🚨 *URGENT - LAPORAN AKTIVITAS HARIAN*

Assalamu'alaikum ${user.name},

Kami perlu segera berbicara dengan Anda mengenai laporan aktivitas harian untuk bulan ${monthName}:

📊 *Status Laporan Anda:*
• Persentase kepatuhan: ${percentage}%
• Hari kerja yang sudah dilaporkan: ${reportedWorkingDays} dari ${totalWorkingDays} hari
• Hari yang belum dilaporkan: ${missingDays} hari

🚨 Status: *PERLU TINDAKAN SEGERA*

Tingkat kepatuhan laporan Anda masih di bawah standar minimum. Mohon segera:
1. Lengkapi semua laporan yang tertunda
2. Hubungi admin jika ada kendala teknis
3. Pastikan laporan harian diisi setiap hari kerja

⏰ Batas waktu: Akhir hari ini
🔗 Login sistem: ${process.env.NEXT_PUBLIC_APP_URL || 'https://laporan-aktivitas-ksuke.vercel.app'}

Mohon konfirmasi setelah melengkapi laporan.

Barakallahu fiikum,
*Tim Admin KSU KE*`
        }

        // Send WhatsApp message using Fonnte API (you can change this to your preferred service)
        const whatsappResponse = await sendWhatsAppMessage(user.whatsapp!, message)
        
        results.push({
          userId: user.id,
          name: user.name,
          whatsapp: user.whatsapp,
          percentage,
          missingDays,
          status: whatsappResponse.success ? 'sent' : 'failed',
          error: whatsappResponse.error || null
        })

      } catch (error) {
        console.error(`Error processing user ${user.id}:`, error)
        results.push({
          userId: user.id,
          name: user.name,
          whatsapp: user.whatsapp,
          status: 'failed',
          error: 'Internal processing error'
        })
      }
    }

    return NextResponse.json({
      message: 'Notifikasi WhatsApp berhasil diproses',
      results,
      summary: {
        total: results.length,
        sent: results.filter(r => r.status === 'sent').length,
        failed: results.filter(r => r.status === 'failed').length
      }
    })

  } catch (error) {
    console.error('WhatsApp notification error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat mengirim notifikasi' },
      { status: 500 }
    )
  }
}

// Function to send WhatsApp message
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
    // Using Fonnte API (you can replace with your preferred WhatsApp service)
    const fonnte_token = process.env.FONNTE_TOKEN
    
    if (!fonnte_token) {
      console.warn('FONNTE_TOKEN not configured, simulating message send')
      return { success: true, message: 'Simulated send (no token configured)' }
    }

    // Format phone number (remove +, spaces, and ensure it starts with 62 for Indonesia)
    let formattedPhone = phoneNumber.replace(/\D/g, '')
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.substring(1)
    } else if (!formattedPhone.startsWith('62')) {
      formattedPhone = '62' + formattedPhone
    }

    const response = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: {
        'Authorization': fonnte_token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        target: formattedPhone,
        message: message,
        countryCode: '62'
      })
    })

    const result = await response.json()
    
    if (response.ok && result.status) {
      return { success: true, data: result }
    } else {
      return { success: false, error: result.reason || 'Failed to send message' }
    }

  } catch (error) {
    console.error('WhatsApp send error:', error)
    return { success: false, error: 'Network or API error' }
  }
}
