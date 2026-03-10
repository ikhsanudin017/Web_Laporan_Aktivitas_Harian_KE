import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

export const MOCK_USER_EMAILS = [
  'arwan@ksuke.com',
  'anggit@ksuke.com',
  'giyarto@ksuke.com',
  'toha@ksuke.com',
  'sayudi@ksuke.com',
  'yuli@ksuke.com',
  'prasetyo@ksuke.com',
  'diah@ksuke.com',
  'eka@ksuke.com'
] as const

export const getMockUserEmail = (token: string): string | null => {
  if (!token.startsWith('mock-token-')) {
    return null
  }

  const userIndex = Number.parseInt(token.replace('mock-token-', ''), 10)

  if (!Number.isInteger(userIndex) || userIndex < 1 || userIndex > MOCK_USER_EMAILS.length) {
    return null
  }

  return MOCK_USER_EMAILS[userIndex - 1]
}

export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 12)
}

export const verifyPassword = async (password: string, hashedPassword: string): Promise<boolean> => {
  return await bcrypt.compare(password, hashedPassword)
}

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '7d' })
}

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!)
  } catch (error) {
    return null
  }
}
