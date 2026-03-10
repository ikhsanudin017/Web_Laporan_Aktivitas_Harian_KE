import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedRequestUser } from '@/lib/request-auth'

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authenticatedUser = await getAuthenticatedRequestUser(token)

    if (!authenticatedUser) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { message: 'Date parameter is required' },
        { status: 400 }
      )
    }

    const report = await prisma.dailyReport.findFirst({
      where: {
        userId: authenticatedUser.userId,
        date: {
          gte: new Date(`${date}T00:00:00.000Z`),
          lt: new Date(`${date}T23:59:59.999Z`)
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      reportData: report?.reportData || {},
      exists: !!report
    })
  } catch (error) {
    console.error('Get report error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const authenticatedUser = await getAuthenticatedRequestUser(token)

    if (!authenticatedUser) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 401 }
      )
    }

    const { date, reportData } = await request.json()

    if (!date || !reportData) {
      return NextResponse.json(
        { message: 'Date and reportData are required' },
        { status: 400 }
      )
    }

    const report = await prisma.dailyReport.create({
      data: {
        userId: authenticatedUser.userId,
        date: new Date(date),
        reportData
      }
    })

    return NextResponse.json({
      message: 'Report saved successfully',
      report
    })
  } catch (error) {
    console.error('Save report error:', error)
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
