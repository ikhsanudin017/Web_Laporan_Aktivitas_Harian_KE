import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Verify cron job authorization (optional: add secret key)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting daily WhatsApp reminder job...')

    // Get all reports for current month
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const currentDay = today.getDate()

    const reports = await prisma.dailyReport.findMany({
      where: {
        date: {
          gte: new Date(currentYear, currentMonth, 1),
          lte: new Date(currentYear, currentMonth + 1, 0)
        }
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            whatsapp: true
          }
        }
      }
    })

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

    // Group reports by user and calculate statistics
    const userStats = reports.reduce((acc, report) => {
      const userId = report.user.id
      const reportDate = report.date.toISOString().split('T')[0]
      
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          name: report.user.name,
          email: report.user.email,
          role: report.user.role,
          whatsapp: report.user.whatsapp,
          reportedDates: new Set(),
          totalReports: 0
        }
      }
      
      if (isWorkingDay(reportDate)) {
        acc[userId].reportedDates.add(reportDate)
      }
      acc[userId].totalReports++
      
      return acc
    }, {} as Record<string, any>)

    // Calculate percentages and filter users who need reminders
    const usersNeedingReminders = Object.values(userStats)
      .map((stat: any) => {
        const reportedWorkingDays = stat.reportedDates.size
        const totalWorkingDays = workingDays.length
        const percentage = totalWorkingDays > 0 ? Math.round((reportedWorkingDays / totalWorkingDays) * 100) : 0
        const missingDays = totalWorkingDays - reportedWorkingDays

        return {
          ...stat,
          percentage,
          reportedDays: reportedWorkingDays,
          totalExpectedDays: totalWorkingDays,
          missingDays
        }
      })
      .filter((stat: any) => stat.percentage < 80 && stat.whatsapp) // Only users with <80% compliance and have WhatsApp

    console.log(`📊 Found ${usersNeedingReminders.length} users needing reminders`)

    if (usersNeedingReminders.length === 0) {
      return NextResponse.json({
        message: 'No users need reminders today',
        processed: 0
      })
    }

    // Send notifications
    const results = []
    
    for (const user of usersNeedingReminders) {
      try {
        const messageType = user.percentage < 60 ? 'urgent' : 'warning'
        const monthName = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
        
        let message = ''
        
        if (messageType === 'warning') {
          message = `🔔 *PENGINGAT LAPORAN AKTIVITAS HARIAN*

Assalamu'alaikum ${user.name},

Kami ingin mengingatkan bahwa laporan aktivitas harian Anda untuk bulan ${monthName} masih perlu dilengkapi:

📊 *Status Laporan Anda:*
• Persentase kepatuhan: ${user.percentage}%
• Hari kerja yang sudah dilaporkan: ${user.reportedDays} dari ${user.totalExpectedDays} hari
• Hari yang belum dilaporkan: ${user.missingDays} hari

⚠️ Status: *PERLU PERHATIAN*

Mohon segera melengkapi laporan yang belum terisi agar mencapai target 100%. Laporan yang lengkap sangat membantu evaluasi kinerja dan perkembangan KSU KE.

🔗 Silakan login ke sistem: ${process.env.NEXT_PUBLIC_APP_URL || 'https://laporan-aktivitas-ksuke.vercel.app'}

Jazakallahu khairan,
*Tim Admin KSU KE*`
        } else {
          message = `🚨 *URGENT - LAPORAN AKTIVITAS HARIAN*

Assalamu'alaikum ${user.name},

Kami perlu segera berbicara dengan Anda mengenai laporan aktivitas harian untuk bulan ${monthName}:

📊 *Status Laporan Anda:*
• Persentase kepatuhan: ${user.percentage}%
• Hari kerja yang sudah dilaporkan: ${user.reportedDays} dari ${user.totalExpectedDays} hari
• Hari yang belum dilaporkan: ${user.missingDays} hari

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

        // Send WhatsApp message
        const whatsappResponse = await sendWhatsAppMessage(user.whatsapp, message)
        
        results.push({
          userId: user.id,
          name: user.name,
          whatsapp: user.whatsapp,
          percentage: user.percentage,
          messageType,
          status: whatsappResponse.success ? 'sent' : 'failed',
          error: whatsappResponse.error || null
        })

        console.log(`📱 ${whatsappResponse.success ? '✅' : '❌'} ${user.name} (${user.percentage}%) - ${messageType}`)

        // Add delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))

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

    const summary = {
      total: results.length,
      sent: results.filter(r => r.status === 'sent').length,
      failed: results.filter(r => r.status === 'failed').length,
      warning: results.filter(r => r.messageType === 'warning').length,
      urgent: results.filter(r => r.messageType === 'urgent').length
    }

    console.log(`✅ Daily reminder job completed:`, summary)

    return NextResponse.json({
      message: 'Daily WhatsApp reminders processed successfully',
      results,
      summary,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Daily reminder cron job error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat menjalankan pengingat harian' },
      { status: 500 }
    )
  }
}

// Function to send WhatsApp message using Fonnte API
async function sendWhatsAppMessage(phoneNumber: string, message: string) {
  try {
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
