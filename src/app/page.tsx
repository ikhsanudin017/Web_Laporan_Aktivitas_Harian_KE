'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [selectedUser, setSelectedUser] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [loginMode, setLoginMode] = useState<'user' | 'admin'>('user')
  const router = useRouter()

  const users = [
    { id: 1, name: 'Bapak Arwan', email: 'arwan@ksuke.com', role: 'BAPAK_ARWAN' },
    { id: 2, name: 'Bpk Winarno', email: 'winarno@ksuke.com', role: 'BPK_WINARNO' },
    { id: 3, name: 'Bapak Giyarto', email: 'giyarto@ksuke.com', role: 'BAPAK_GIYARTO' },
    { id: 4, name: 'Bapak Toha', email: 'toha@ksuke.com', role: 'BAPAK_TOHA' },
    { id: 5, name: 'Bapak Sayudi', email: 'sayudi@ksuke.com', role: 'BAPAK_SAYUDI' },
    { id: 6, name: 'Ustadz Yuli', email: 'yuli@ksuke.com', role: 'USTADZ_YULI' },
    { id: 7, name: 'Bapak Prasetyo Dani', email: 'prasetyo@ksuke.com', role: 'BAPAK_PRASETYO' },
    { id: 8, name: 'Bapak Diah Supriyanto', email: 'diah@ksuke.com', role: 'BAPAK_DIAH' },
  ]

  const handleUserSelect = async () => {
    if (!selectedUser) {
      setError('Silakan pilih nama Anda')
      return
    }

    setLoading(true)
    setError('')

    try {
      const user = users.find(u => u.id.toString() === selectedUser)
      if (user) {
        // Create mock user data for localStorage
        const userData = {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        }
        
        localStorage.setItem('user', JSON.stringify(userData))
        localStorage.setItem('token', 'mock-token-' + user.id)
        router.push('/dashboard')
      }
    } catch (error) {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Store user data in localStorage
        localStorage.setItem('user', JSON.stringify(data.user))
        localStorage.setItem('token', data.token)
        router.push('/admin')
      } else {
        setError(data.message || 'Login admin gagal')
      }
    } catch (error) {
      setError('Terjadi kesalahan koneksi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-yellow-50 py-4 px-2 sm:py-12 sm:px-4 lg:px-8 relative overflow-hidden">
      {/* Islamic Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full"></div>
      </div>
      
      {/* Geometric Background Elements - Hidden on small screens */}
      <div className="hidden sm:block absolute top-10 left-10 w-32 h-32 border-2 border-yellow-300 rounded-full animate-bounce opacity-20"></div>
      <div className="hidden sm:block absolute bottom-20 right-20 w-24 h-24 bg-green-200 rounded-lg rotate-45 animate-pulse opacity-20"></div>
      <div className="hidden md:block absolute top-1/3 right-10 w-16 h-16 border border-green-300 rounded-full animate-ping opacity-20"></div>
      
      <div className="max-w-md w-full space-y-4 sm:space-y-8 relative z-10">
        <div className="islamic-card animate-slide-up">
          {/* Logo Section */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-yellow-300 rounded-full opacity-20 animate-pulse"></div>
                <Image 
                  src="/logo-ksu-ke.png" 
                  alt="Logo KSU KE" 
                  width={80} 
                  height={80}
                  className="sm:w-[120px] sm:h-[120px] rounded-full shadow-2xl border-4 border-yellow-300 relative z-10"
                />
              </div>
            </div>
            
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-800 mb-2" style={{fontFamily: 'Poppins, sans-serif'}}>
              نظام التقارير اليومية
            </h2>
            <h3 className="text-2xl font-semibold text-green-700 mb-3" style={{fontFamily: 'Poppins, sans-serif'}}>
              Sistem Laporan Aktivitas
            </h3>
            <div className="space-y-1">
              <p className="text-gray-700 font-medium">
                KOPERASI SERBA USAHA
              </p>
              <p className="text-lg font-bold text-yellow-600" style={{fontFamily: 'Poppins, sans-serif'}}>
                KIRAP ENTREPRENEURSHIP
              </p>
              <div className="flex items-center justify-center space-x-2 mt-2">
                <div className="h-0.5 w-8 bg-yellow-400"></div>
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <div className="h-0.5 w-8 bg-yellow-400"></div>
              </div>
            </div>
          </div>

          {/* Toggle Buttons with Islamic styling */}
          <div className="flex rounded-xl bg-green-50 p-1.5 mb-6 border border-green-200">
            <button
              type="button"
              onClick={() => setLoginMode('user')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                loginMode === 'user'
                  ? 'bg-yellow-400 text-gray-800 shadow-lg scale-105 border border-yellow-500'
                  : 'text-gray-500 hover:text-green-700 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
                <span>Staff / User</span>
              </div>
            </button>
            <button
              type="button"
              onClick={() => setLoginMode('admin')}
              className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all duration-300 ${
                loginMode === 'admin'
                  ? 'bg-green-700 text-white shadow-lg scale-105 border border-green-800'
                  : 'text-gray-500 hover:text-green-700 hover:bg-white/50'
              }`}
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
                </svg>
                <span>Admin</span>
              </div>
            </button>
          </div>

          {loginMode === 'user' ? (
            // USER SELECTION with Islamic styling
            <div className="space-y-6">
              <div className="relative z-10">
                <label htmlFor="user-select" className="block text-sm font-medium text-green-800 mb-3 flex items-center space-x-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                  <span>اختر اسمك - Pilih Nama Anda</span>
                </label>
                <div className="relative">
                  <select
                    id="user-select"
                    value={selectedUser}
                    onChange={(e) => setSelectedUser(e.target.value)}
                    className="input-islamic w-full text-gray-800 font-medium shadow-lg hover:shadow-xl focus:shadow-xl appearance-none"
                    style={{ 
                      minHeight: '48px',
                      fontSize: '16px',
                      paddingRight: '40px',
                      backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6,9 12,15 18,9\'%3e%3c/polyline%3e%3c/svg%3e")',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 12px center',
                      backgroundSize: '16px'
                    }}
                  >
                    <option value="" className="text-gray-500 py-3">-- اختر الاسم - Pilih Nama --</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id.toString()} className="text-gray-800 font-medium py-3" style={{ fontSize: '16px', padding: '12px' }}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-red-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleUserSelect}
                disabled={loading}
                className="btn-islamic-secondary w-full text-center relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري المعالجة...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                      <span>دخول إلى لوحة التحكم - Masuk ke Dashboard</span>
                    </>
                  )}
                </div>
              </button>
            </div>
          ) : (
            // ADMIN LOGIN with Islamic styling
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-green-800 mb-2 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span>اسم المستخدم - Username Admin</span>
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="text"
                    required
                    className="input-islamic w-full shadow-lg hover:shadow-xl focus:shadow-xl"
                    placeholder="Username admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-green-800 mb-2 flex items-center space-x-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                    <span>كلمة المرور - Password</span>
                  </label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="input-islamic w-full shadow-lg hover:shadow-xl focus:shadow-xl"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 animate-fadeIn">
                  <div className="flex items-center space-x-2 text-red-700">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">{error}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-islamic-primary w-full text-center relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-center justify-center space-x-3">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>جاري تسجيل الدخول...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 group-hover:rotate-12 transition-transform" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l5-5z" clipRule="evenodd" />
                      </svg>
                      <span>دخول المدير - Login Admin</span>
                    </>
                  )}
                </div>
              </button>
            </form>
          )}
          
          {/* Footer with Islamic touch */}
          <div className="mt-8 text-center">
            <div className="flex items-center justify-center space-x-2 text-xs text-gray-500">
              <span>بسم الله نبدأ</span>
              <div className="w-1 h-1 bg-yellow-500 rounded-full"></div>
              <span>Dengan berkah Allah SWT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
