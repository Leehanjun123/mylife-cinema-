'use client'

import Link from 'next/link'

export function PaymentSuccessNavbar() {
  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">🎬</span>
            </div>
            <span className="font-bold text-xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              MyLife Cinema
            </span>
          </Link>

          {/* Simple navigation - no auth loading */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className="text-sm font-medium transition-colors text-gray-600 hover:text-gray-900"
            >
              홈
            </Link>
            <Link 
              href="/dashboard" 
              className="text-sm font-medium transition-colors text-gray-600 hover:text-gray-900"
            >
              내 영화
            </Link>
            <Link 
              href="/create-movie" 
              className="text-sm font-medium transition-colors text-gray-600 hover:text-gray-900"
            >
              영화 만들기
            </Link>
            <Link 
              href="/community" 
              className="text-sm font-medium transition-colors text-gray-600 hover:text-gray-900"
            >
              커뮤니티
            </Link>
          </div>

          {/* Success message instead of user auth */}
          <div className="flex items-center space-x-4">
            <div className="text-sm text-green-600 font-medium">
              ✅ 결제 완료
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}