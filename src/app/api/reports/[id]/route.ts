import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedRequestUser } from '@/lib/request-auth'

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

    const authenticatedUser = await getAuthenticatedRequestUser(token)

    if (!authenticatedUser) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 401 }
      )
    }

    const { reportData, date } = await request.json()

    if (!reportData) {
      return NextResponse.json(
        { message: 'Report data is required' },
        { status: 400 }
      )
    }

    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: params.id }
    })

    if (!existingReport) {
      return NextResponse.json(
        { message: 'Report tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!authenticatedUser.isAdmin && existingReport.userId !== authenticatedUser.userId) {
      return NextResponse.json(
        { message: 'Tidak memiliki izin untuk mengedit laporan ini' },
        { status: 403 }
      )
    }

    const updateData: {
      reportData: any
      updatedAt: Date
      date?: Date
    } = {
      reportData,
      updatedAt: new Date()
    }

    if (date) {
      const newDate = new Date(date)
      const existingDate = new Date(existingReport.date)

      if (newDate.toISOString().split('T')[0] !== existingDate.toISOString().split('T')[0]) {
        updateData.date = newDate
      }
    }

    const updatedReport = await prisma.dailyReport.update({
      where: { id: params.id },
      data: updateData,
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
      report: {
        ...updatedReport,
        date: updatedReport.date.toISOString(),
        createdAt: updatedReport.createdAt.toISOString(),
        updatedAt: updatedReport.updatedAt.toISOString()
      }
    })
  } catch (error) {
    console.error('Update report error:', error)
    return NextResponse.json(
      {
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
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

    const authenticatedUser = await getAuthenticatedRequestUser(token)

    if (!authenticatedUser) {
      return NextResponse.json(
        { message: 'User tidak ditemukan' },
        { status: 401 }
      )
    }

    const existingReport = await prisma.dailyReport.findUnique({
      where: { id: params.id }
    })

    if (!existingReport) {
      return NextResponse.json(
        { message: 'Report tidak ditemukan' },
        { status: 404 }
      )
    }

    if (!authenticatedUser.isAdmin && existingReport.userId !== authenticatedUser.userId) {
      return NextResponse.json(
        { message: 'Tidak memiliki izin untuk menghapus laporan ini' },
        { status: 403 }
      )
    }

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
