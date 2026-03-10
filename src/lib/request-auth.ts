import { prisma } from '@/lib/prisma'
import { getMockUserEmail, verifyToken } from '@/lib/auth'

export type AuthenticatedRequestUser = {
  userId: string
  role: string
  isAdmin: boolean
}

export const getAuthenticatedRequestUser = async (
  token: string
): Promise<AuthenticatedRequestUser | null> => {
  if (token.startsWith('mock-token-')) {
    const userEmail = getMockUserEmail(token)

    if (!userEmail) {
      return null
    }

    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: {
        id: true,
        role: true
      }
    })

    if (!user) {
      return null
    }

    return {
      userId: user.id,
      role: user.role,
      isAdmin: user.role === 'ADMIN'
    }
  }

  const decoded = verifyToken(token)

  if (!decoded?.userId) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
    select: {
      id: true,
      role: true
    }
  })

  if (!user) {
    return null
  }

  return {
    userId: user.id,
    role: user.role,
    isAdmin: user.role === 'ADMIN'
  }
}
