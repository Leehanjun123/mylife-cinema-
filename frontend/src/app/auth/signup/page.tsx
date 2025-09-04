'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/contexts/AuthContext'
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle } from 'lucide-react'

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const { signUp } = useAuth()
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return false
    }
    if (formData.password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return false
    }
    if (formData.username.length < 2) {
      setError('사용자명은 2자 이상이어야 합니다.')
      return false
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const { error } = await signUp(formData.email, formData.password, formData.username)
      if (error) {
        setError(error.message)
      } else {
        setSuccess('회원가입이 완료되었습니다! 이메일을 확인해주세요.')
        setTimeout(() => {
          router.push('/auth/signin')
        }, 2000)
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }


  const passwordStrength = () => {
    const password = formData.password
    let strength = 0
    if (password.length >= 6) strength++
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) strength++
    if (password.match(/\d/)) strength++
    if (password.match(/[^a-zA-Z\d]/)) strength++
    return strength
  }

  const getPasswordStrengthText = () => {
    const strength = passwordStrength()
    if (strength === 0) return { text: '', color: '' }
    if (strength === 1) return { text: '약함', color: 'text-red-500' }
    if (strength === 2) return { text: '보통', color: 'text-yellow-500' }
    if (strength === 3) return { text: '강함', color: 'text-green-500' }
    return { text: '매우 강함', color: 'text-green-600' }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">🎬</span>
            </div>
            <span className="font-bold text-2xl text-white">
              MyLife Cinema
            </span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">회원가입</h1>
          <p className="text-white/70">무료로 3편의 영화를 만들어보세요</p>
        </div>

        <Card className="p-8 bg-white/95 backdrop-blur">

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-2">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                사용자명
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="사용자명을 입력하세요"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="비밀번호를 입력하세요"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.password && (
                <div className="mt-1 flex items-center space-x-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                    <div 
                      className={`h-1.5 rounded-full transition-all ${
                        passwordStrength() === 1 ? 'bg-red-500 w-1/4' :
                        passwordStrength() === 2 ? 'bg-yellow-500 w-2/4' :
                        passwordStrength() === 3 ? 'bg-green-500 w-3/4' :
                        passwordStrength() === 4 ? 'bg-green-600 w-full' : 'w-0'
                      }`}
                    />
                  </div>
                  <span className={`text-xs ${getPasswordStrengthText().color}`}>
                    {getPasswordStrengthText().text}
                  </span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                비밀번호 확인
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="pl-10 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="mt-1 text-xs text-red-500">비밀번호가 일치하지 않습니다</p>
              )}
            </div>

            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 mt-1"
                required
              />
              <label className="text-sm text-gray-600">
                <Link href="/terms" className="text-purple-600 hover:text-purple-700">
                  이용약관
                </Link>
                과{' '}
                <Link href="/privacy" className="text-purple-600 hover:text-purple-700">
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading || formData.password !== formData.confirmPassword}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-12"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '무료로 시작하기'
              )}
            </Button>
          </form>
        </Card>

        {/* Sign In Link */}
        <div className="text-center mt-6">
          <p className="text-white/70">
            이미 계정이 있으신가요?{' '}
            <Link 
              href="/auth/signin" 
              className="text-white font-semibold hover:text-purple-300 transition-colors"
            >
              로그인
            </Link>
          </p>
        </div>

        {/* Benefits */}
        <div className="mt-8 bg-white/10 backdrop-blur rounded-lg p-4">
          <h3 className="text-white font-semibold mb-3 text-center">가입하면 받는 혜택</h3>
          <ul className="space-y-2 text-sm text-white/80">
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>매월 3편의 무료 영화 제작</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>720p 고품질 영상</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>6가지 다양한 비주얼 스타일</span>
            </li>
            <li className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <span>커뮤니티 영화 공유</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  )
}