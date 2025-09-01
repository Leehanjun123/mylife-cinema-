'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [diary, setDiary] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const createMovie = async () => {
    if (!diary.trim()) {
      alert('일기를 입력해주세요!');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch((process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') + '/api/movies/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ diary })
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
      alert('영화 생성 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-900 to-indigo-900">
      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-6xl font-bold text-white mb-4">
            🎬 MyLife Cinema
          </h1>
          <p className="text-xl text-purple-200">
            당신의 일기가 영화가 됩니다
          </p>
        </header>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          {!result ? (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
              <h2 className="text-2xl font-semibold text-white mb-6">
                오늘의 이야기를 들려주세요
              </h2>
              
              <textarea
                value={diary}
                onChange={(e) => setDiary(e.target.value)}
                placeholder="오늘 있었던 일, 느낀 감정, 특별한 순간들을 자유롭게 작성해주세요..."
                className="w-full h-64 p-4 bg-white/5 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-purple-400 resize-none"
              />
              
              <button
                onClick={createMovie}
                disabled={loading}
                className={`w-full mt-6 py-4 rounded-lg font-semibold text-lg transition-all ${
                  loading 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white'
                }`}
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    AI가 영화를 제작 중입니다...
                  </span>
                ) : '🎬 영화 만들기'}
              </button>
            </div>
          ) : (
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
              <h2 className="text-3xl font-bold text-white mb-6">
                🎉 {result.movie.title}
              </h2>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-purple-300 mb-1">장르</p>
                  <p className="text-white font-semibold">{result.movie.genre}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-lg">
                  <p className="text-purple-300 mb-1">무드</p>
                  <p className="text-white font-semibold">{result.movie.mood}</p>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                <h3 className="text-xl font-semibold text-white">🎬 씬 구성</h3>
                {result.movie.scenes.map((scene: any) => (
                  <div key={scene.sceneNumber} className="bg-white/5 p-4 rounded-lg">
                    <p className="text-purple-300 mb-2">씬 {scene.sceneNumber}</p>
                    <p className="text-white">{scene.description}</p>
                    {scene.narration && (
                      <p className="text-purple-200 italic mt-2">"{scene.narration}"</p>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all"
                >
                  새 영화 만들기
                </button>
                <button className="flex-1 py-3 bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white rounded-lg transition-all">
                  영화 보러가기
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Features */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="text-4xl mb-4">🤖</div>
            <h3 className="text-xl font-semibold text-white mb-2">AI 시나리오</h3>
            <p className="text-purple-200">GPT-4가 일기를 분석해 감동적인 시나리오로 변환</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-white mb-2">자동 영상 생성</h3>
            <p className="text-purple-200">Stable Diffusion으로 아름다운 씬 이미지 생성</p>
          </div>
          <div className="text-center">
            <div className="text-4xl mb-4">🎵</div>
            <h3 className="text-xl font-semibold text-white mb-2">감성 나레이션</h3>
            <p className="text-purple-200">Google TTS로 자연스러운 음성 나레이션 추가</p>
          </div>
        </div>
      </div>
    </main>
  );
}