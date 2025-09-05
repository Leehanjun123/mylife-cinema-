'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { User, LogOut, Film, Zap } from 'lucide-react'
import { useState } from 'react'

export function Navbar() {
  const pathname = usePathname()
  const { user, profile, signOut, loading } = useAuth()
  const [showUserMenu, setShowUserMenu] = useState(false)

  const isActive = (path: string) => {
    return pathname === path
  }

  const handleSignOut = async () => {
    await signOut()
    setShowUserMenu(false)
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
            
            {user && (
              <>
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
                  href="/create-movie" 
                  className={`text-sm font-medium transition-colors ${
                    isActive('/create-movie') 
                      ? 'text-purple-600' 
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  영화 만들기
                </Link>
              </>
            )}
            
            <Link 
              href="/community" 
              className={`text-sm font-medium transition-colors ${
                isActive('/community') 
                  ? 'text-purple-600' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              커뮤니티
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

          {/* User Authentication Area */}
          <div className="flex items-center space-x-4">
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : user ? (
              <>
                {/* User Menu */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center space-x-2 text-sm font-medium text-gray-600 hover:text-gray-900 focus:outline-none"
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      {profile?.avatar_url ? (
                        <img 
                          src={profile.avatar_url} 
                          alt={profile.username} 
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className="hidden md:block">{profile?.username || 'User'}</span>
                    
                    {/* Subscription Badge */}
                    {profile?.subscription_tier !== 'free' && (
                      <span className="hidden md:block px-2 py-1 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full">
                        {profile?.subscription_tier === 'creator' ? '크리에이터' : '프로'}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Menu */}
                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                      <div className="py-1">
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900">{profile?.username}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                          <div className="flex items-center mt-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              profile?.subscription_tier === 'free' 
                                ? 'bg-gray-100 text-gray-600' 
                                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                            }`}>
                              {profile?.subscription_tier === 'free' ? '무료' : 
                               profile?.subscription_tier === 'creator' ? '크리에이터' : '프로'}
                            </span>
                          </div>
                        </div>
                        
                        <Link 
                          href="/dashboard"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <Film className="w-4 h-4 mr-3" />
                          내 영화
                        </Link>
                        
                        <Link 
                          href="/profile"
                          className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          onClick={() => setShowUserMenu(false)}
                        >
                          <User className="w-4 h-4 mr-3" />
                          프로필 설정
                        </Link>
                        
                        {profile?.subscription_tier === 'free' && (
                          <Link 
                            href="/pricing"
                            className="flex items-center px-4 py-2 text-sm text-purple-600 hover:bg-purple-50"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <Zap className="w-4 h-4 mr-3" />
                            프리미엄 업그레이드
                          </Link>
                        )}
                        
                        <div className="border-t border-gray-100">
                          <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
                            <LogOut className="w-4 h-4 mr-3" />
                            로그아웃
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Create Button */}
                <Link href="/create-movie">
                  <Button className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white">
                    <Film className="w-4 h-4 mr-2" />
                    영화 만들기
                  </Button>
                </Link>
              </>
            ) : (
              <>
                {/* Guest Buttons */}
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
              </>
            )}
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
      
      {/* Close user menu when clicking outside */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </nav>
  )
}