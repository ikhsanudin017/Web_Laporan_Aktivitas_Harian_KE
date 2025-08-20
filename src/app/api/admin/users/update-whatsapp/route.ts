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

    // Data nomor WhatsApp berdasarkan role
    const whatsappNumbers = {
      'BAPAK_SAYUDI': '6281579099992',
      'USTADZ_YULI': '6282138957274',
      'BAPAK_TOHA': '6281578585162',
      'BAPAK_PRASETYO': '6281325919175',
      'BAPAK_DIAH': '6285655543883',
      'BAPAK_ARWAN': '6287803894839',
      'BAPAK_GIYARTO': '6285879824874',
      'BPK_WINARNO': '6288137568832',
      'ADMIN': '6289630988257'
    }

    const updatePromises = Object.entries(whatsappNumbers).map(async ([role, whatsapp]) => {
      try {
        const result = await prisma.user.updateMany({
          where: { role: role as any },
          data: { whatsapp }
        })
        return { role, whatsapp, updated: result.count }
      } catch (error) {
        console.error(`Error updating ${role}:`, error)
        return { role, whatsapp, updated: 0, error: error instanceof Error ? error.message : 'Unknown error' }
      }
    })

    const results = await Promise.all(updatePromises)

    return NextResponse.json({
      message: 'Nomor WhatsApp berhasil diperbarui',
      results,
      summary: {
        total: results.length,
        updated: results.reduce((sum, r) => sum + r.updated, 0),
        failed: results.filter(r => r.updated === 0).length
      }
    })

  } catch (error) {
    console.error('Update WhatsApp numbers error:', error)
    return NextResponse.json(
      { error: 'Terjadi kesalahan saat memperbarui nomor WhatsApp' },
      { status: 500 }
    )
  }
}
