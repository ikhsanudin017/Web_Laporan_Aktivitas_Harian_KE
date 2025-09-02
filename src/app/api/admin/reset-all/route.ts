import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function DELETE(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token tidak ditemukan' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    
    // Verify admin token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    } catch (error) {
      return NextResponse.json(
        { error: 'Token tidak valid' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Akses ditolak. Hanya admin yang dapat menghapus semua data.' },
        { status: 403 }
      );
    }

    // Get the first day of the current month
    const now = new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Delete reports from previous months
    const result = await prisma.dailyReport.deleteMany({
      where: {
        date: {
          lt: firstDayOfCurrentMonth
        }
      }
    });

    return NextResponse.json({
      message: `Berhasil menghapus data dari bulan-bulan sebelumnya. Laporan bulan ini tidak tersentuh.`,
      deletedCount: result.count
    });

  } catch (error) {
    console.error('Error deleting all reports:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus data aktivitas' },
      { status: 500 }
    );
  }
}
