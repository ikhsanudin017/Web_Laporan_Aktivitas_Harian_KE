import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verifyToken } from '@/lib/auth'

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let userId: string
    let isAdmin = false
    
    // Check if it's a mock token (for dropdown users)
    if (token.startsWith('mock-token-')) {
      const userIndex = parseInt(token.replace('mock-token-', ''))
      
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
      
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      isAdmin = user?.role === 'ADMIN'
    }

    const { reportData } = await request.json()

    if (!reportData) {
      return NextResponse.json(
        { message: 'Report data is required' },
        { status: 400 }
      )
    }

    // Check if report exists and user has permission to edit
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: params.id }
    })

    if (!existingReport) {
      return NextResponse.json(
        { message: 'Report tidak ditemukan' },
        { status: 404 }
      )
    }

    // Users can only edit their own reports, admin can edit any report
    if (!isAdmin && existingReport.userId !== userId) {
      return NextResponse.json(
        { message: 'Tidak memiliki izin untuk mengedit laporan ini' },
        { status: 403 }
      )
    }

    // Update the report
    const updatedReport = await prisma.dailyReport.update({
      where: { id: params.id },
      data: {
        reportData,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true
          }
        }
      }
    })

    return NextResponse.json({
      message: 'Report berhasil diperbarui',
      report: updatedReport
    })

  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const params = await context.params
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    
    if (!token) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    let userId: string
    let isAdmin = false
    
    // Check if it's a mock token (for dropdown users)
    if (token.startsWith('mock-token-')) {
      const userIndex = parseInt(token.replace('mock-token-', ''))
      
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
      
      // Check if user is admin
      const user = await prisma.user.findUnique({
        where: { id: userId }
      })
      isAdmin = user?.role === 'ADMIN'
    }

    // Check if report exists and user has permission to delete
    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: params.id }
    })

    if (!existingReport) {
      return NextResponse.json(
        { message: 'Report tidak ditemukan' },
        { status: 404 }
      )
    }

    // Users can only delete their own reports, admin can delete any report
    if (!isAdmin && existingReport.userId !== userId) {
      return NextResponse.json(
        { message: 'Tidak memiliki izin untuk menghapus laporan ini' },
        { status: 403 }
      )
    }

    // Delete the report
    await prisma.dailyReport.delete({
      where: { id: params.id }
    })

    return NextResponse.json({
      message: 'Report berhasil dihapus'
    })

  } catch (error) {
    console.error('Delete report error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
