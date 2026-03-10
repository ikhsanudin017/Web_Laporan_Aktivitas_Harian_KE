import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedRequestUser } from '@/lib/request-auth'

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    const authenticatedUser = await getAuthenticatedRequestUser(token)

    if (!authenticatedUser) {
      return NextResponse.json(
        { error: 'User tidak ditemukan' },
        { status: 401 }
      )
    }

    const reports = await prisma.dailyReport.findMany({
      where: {
        userId: authenticatedUser.userId
      },
      orderBy: [
        { date: 'desc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        date: true,
        reportData: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json({ reports })
  } catch (error) {
    console.error('Error fetching user reports:', error)
    return NextResponse.json(
      { error: 'Gagal mengambil data laporan' },
      { status: 500 }
    )
  }
}
