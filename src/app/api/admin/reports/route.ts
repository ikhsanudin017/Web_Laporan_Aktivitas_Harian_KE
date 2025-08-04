import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const decoded = verifyToken(token)
    if (!decoded) {
      return NextResponse.json(
        { message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    })

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { message: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where condition
    let whereCondition: any = {}
    
    if (startDate && endDate) {
      whereCondition.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }

    // Get all reports with user information
    const reports = await prisma.dailyReport.findMany({
      where: whereCondition,
      include: {
        user: {
          select: {
            name: true,
            role: true,
            email: true
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { user: { name: 'asc' } }
      ]
    })

    return NextResponse.json({
      reports: reports.map(report => ({
        id: report.id,
        date: report.date.toISOString(),
        reportData: report.reportData,
        createdAt: report.createdAt,
        updatedAt: report.updatedAt,
        user: report.user
      }))
    })

  } catch (error) {
    console.error('Get admin reports error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
