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

    let userId: string
    
    // Check if it's a mock token (for dropdown users)
    if (token.startsWith('mock-token-')) {
      const userIndex = parseInt(token.replace('mock-token-', ''))
      
      // Get user by email to get real ID
      const userEmails = [
        'arwan@ksuke.com',      // index 1
        'winarno@ksuke.com',    // index 2
        'giyarto@ksuke.com',    // index 3
        'toha@ksuke.com',       // index 4
        'sayudi@ksuke.com',     // index 5
        'yuli@ksuke.com',       // index 6
        'prasetyo@ksuke.com',   // index 7
        'diah@ksuke.com'        // index 8
      ]
      
      const userEmail = userEmails[userIndex - 1]
      if (!userEmail) {
        return NextResponse.json(
          { message: 'User tidak ditemukan' },
          { status: 401 }
        )
      }
      
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      })
      
      if (!user) {
        return NextResponse.json(
          { message: 'User tidak ditemukan' },
          { status: 401 }
        )
      }
      
      userId = user.id
    } else {
      // Verify JWT token (for admin)
      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json(
          { message: 'Invalid token' },
          { status: 401 }
        )
      }
      userId = decoded.userId
    }

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    if (!date) {
      return NextResponse.json(
        { message: 'Date parameter is required' },
        { status: 400 }
      )
    }

    // Find latest report for the specific date and user (since multiple reports per day allowed)
    const report = await prisma.dailyReport.findFirst({
      where: {
        userId: userId,
        date: {
          gte: new Date(date + 'T00:00:00.000Z'),
          lt: new Date(date + 'T23:59:59.999Z')
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

    let userId: string
    
    // Check if it's a mock token (for dropdown users)
    if (token.startsWith('mock-token-')) {
      const userIndex = parseInt(token.replace('mock-token-', ''))
      
      // Get user by email to get real ID
      const userEmails = [
        'arwan@ksuke.com',      // index 1
        'winarno@ksuke.com',    // index 2
        'giyarto@ksuke.com',    // index 3
        'toha@ksuke.com',       // index 4
        'sayudi@ksuke.com',     // index 5
        'yuli@ksuke.com',       // index 6
        'prasetyo@ksuke.com',   // index 7
        'diah@ksuke.com'        // index 8
      ]
      
      const userEmail = userEmails[userIndex - 1]
      if (!userEmail) {
        return NextResponse.json(
          { message: 'User tidak ditemukan' },
          { status: 401 }
        )
      }
      
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      })
      
      if (!user) {
        return NextResponse.json(
          { message: 'User tidak ditemukan' },
          { status: 401 }
        )
      }
      
      userId = user.id
    } else {
      // Verify JWT token (for admin)
      const decoded = verifyToken(token)
      if (!decoded) {
        return NextResponse.json(
          { message: 'Invalid token' },
          { status: 401 }
        )
      }
      userId = decoded.userId
    }

    const { date, reportData } = await request.json()

    if (!date || !reportData) {
      return NextResponse.json(
        { message: 'Date and reportData are required' },
        { status: 400 }
      )
    }

    // Create new daily report (always insert new record)
    const report = await prisma.dailyReport.create({
      data: {
        userId: userId,
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
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
