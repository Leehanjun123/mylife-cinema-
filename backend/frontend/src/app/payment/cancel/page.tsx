'use client'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export default function PaymentCancelPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 bg-white/10 backdrop-blur border-white/20">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500 rounded-full mb-6">
            <XCircle className="w-12 h-12 text-white" />
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-4">
            결제가 취소되었습니다
          </h1>
          
          <p className="text-white/80 mb-8">
            결제를 취소하셨습니다. 언제든지 다시 시도하실 수 있습니다.
            무료 플랜으로 계속 이용 가능합니다.
          </p>

          <div className="bg-white/5 rounded-lg p-6 mb-8">
            <h3 className="text-white font-semibold mb-3">무료 플랜 혜택:</h3>
            <ul className="text-left text-white/80 space-y-2">
              <li>• 월 3편 영화 제작</li>
              <li>• 720p HD 화질</li>
              <li>• 기본 스타일 6종</li>
              <li>• 커뮤니티 공유 기능</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link href="/pricing" className="block">
              <Button className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700">
                <ArrowLeft className="mr-2 w-4 h-4" />
                요금제 다시 보기
              </Button>
            </Link>
            
            <Link href="/create-movie" className="block">
              <Button variant="outline" className="w-full text-white border-white/30 hover:bg-white/10">
                무료로 영화 만들기
              </Button>
            </Link>
            
            <Link href="/help" className="block">
              <Button variant="ghost" className="w-full text-white/70 hover:text-white hover:bg-white/10">
                <HelpCircle className="mr-2 w-4 h-4" />
                도움이 필요하신가요?
              </Button>
            </Link>
          </div>
        </div>
      </Card>
    </div>
  )
}