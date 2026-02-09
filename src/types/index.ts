import { UserRole } from '@prisma/client'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export interface DailyReportData {
  // Simple form fields (Ustadz Yuli, Bapak Toha)
  aktivitasHarian?: string

  // Medium complexity fields (Bapak Sayudi, Mas Anggit)
  angsuran?: number
  kegiatan?: string
  fundingB2B?: number
  fundingPersonal?: number
  survey?: number
  keterangan?: string

  // High complexity fields (Bapak Arwan, Bapak Diah)
  marketingB2B?: number
  marketingPersonal?: number

  // Complex form fields (Bapak Prasetyo, Bapak Giyarto)
  ktp?: number
  adr?: number
  quran?: number
  wakaf?: number
  gota?: number
  b2b?: number
  maintenance?: number
  lainLain?: string
}

export interface DailyReport {
  id: string
  userId: string
  date: Date
  reportData: DailyReportData
  createdAt: Date
  updatedAt: Date
  user?: User
}

export interface FormConfig {
  role: UserRole
  fields: FormField[]
  title: string
}

export interface FormField {
  name: string
  label: string
  type: 'text' | 'number' | 'textarea' | 'date' | 'dropdown-number'
  required?: boolean
  placeholder?: string
  category?: string
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  email: string
  name: string
  password: string
  role: UserRole
}
