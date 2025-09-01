'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'

export function Navbar() {
  const pathname = usePathname()

  const isActive = (path: string) => {
    return pathname === path
  }

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

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            <Link 
              href="/" 
              className={`text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'text-purple-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              홈
            </Link>
            <Link 
              href="/dashboard" 
              className={`text-sm font-medium transition-colors ${
                isActive('/dashboard') 
                  ? 'text-purple-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              내 영화
            </Link>
            <Link 
              href="/create" 
              className={`text-sm font-medium transition-colors ${
                isActive('/create') 
                  ? 'text-purple-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              영화 만들기
            </Link>
            <Link 
              href="/pricing" 
              className={`text-sm font-medium transition-colors ${
                isActive('/pricing') 
                  ? 'text-purple-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              요금제
            </Link>
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center space-x-4">
            <Link href="/auth/signin">
              <Button variant="ghost" className="text-gray-600 hover:text-gray-900">
                로그인
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white">
                시작하기
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}