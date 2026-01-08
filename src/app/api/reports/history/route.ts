import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

export async function GET(request: NextRequest) {
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
    
    let userId: string;
    
    // Check if it's a mock token (for dropdown users)
    if (token.startsWith('mock-token-')) {
      const userIndex = parseInt(token.replace('mock-token-', ''));
      
      // Get user by email to get real ID
      const userEmails = [
        'arwan@ksuke.com',      // index 1
        'winarno@ksuke.com',    // index 2
        'giyarto@ksuke.com',    // index 3
        'toha@ksuke.com',       // index 4
        'sayudi@ksuke.com',     // index 5
        'yuli@ksuke.com',       // index 6
        'prasetyo@ksuke.com',   // index 7
        'diah@ksuke.com',       // index 8
        'eka@ksuke.com'         // index 9
      ];
      
      const userEmail = userEmails[userIndex - 1];
      if (!userEmail) {
        return NextResponse.json(
          { error: 'User tidak ditemukan' },
          { status: 401 }
        );
      }
      
      const user = await prisma.user.findUnique({
        where: { email: userEmail }
      });
      
      if (!user) {
        return NextResponse.json(
          { error: 'User tidak ditemukan' },
          { status: 401 }
        );
      }
      
      userId = user.id;
    } else {
      // Verify JWT token (for admin)
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        userId = decoded.id;
      } catch (error) {
        return NextResponse.json(
          { error: 'Token tidak valid' },
          { status: 401 }
        );
      }
    }

    // Get user reports ordered by date (newest first)
    const reports = await prisma.dailyReport.findMany({
      where: {
        userId: userId,
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
        updatedAt: true,
      }
    });

    return NextResponse.json({ reports });

  } catch (error) {
    console.error('Error fetching user reports:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data laporan' },
      { status: 500 }
    );
  }
}
