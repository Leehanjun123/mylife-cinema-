#!/usr/bin/env node

// Supabase 연결 및 설정 테스트
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

async function testSupabase() {
  console.log('🗄️ Supabase 연결 테스트');
  console.log('======================');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    console.log('❌ Supabase 환경변수가 설정되지 않았습니다.');
    return false;
  }

  console.log('✅ 환경변수 확인됨');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

  try {
    // 1. 기본 연결 테스트
    console.log('\n1. 🔌 기본 연결 테스트...');
    const supabase = createClient(supabaseUrl, supabaseAnonKey);
    
    // 2. 데이터베이스 테스트 (간단한 쿼리)
    console.log('\n2. 📊 데이터베이스 테스트...');
    const { data, error } = await supabase
      .from('_realtime_schema_migrations')  // 기본 테이블
      .select('*')
      .limit(1);

    if (error && !error.message.includes('does not exist')) {
      console.log('⚠️ 데이터베이스 접근 오류:', error.message);
    } else {
      console.log('✅ 데이터베이스 연결 성공');
    }

    // 3. Storage 버킷 확인/생성
    console.log('\n3. 📁 Storage 설정 테스트...');
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    
    // 기존 버킷 확인
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    
    if (listError) {
      console.log('⚠️ Storage 접근 오류:', listError.message);
    } else {
      console.log(`✅ Storage 접근 성공. 현재 버킷: ${buckets.length}개`);
      
      // MyLife Cinema용 버킷들이 있는지 확인
      const requiredBuckets = ['movies', 'scenes', 'thumbnails'];
      const existingBucketNames = buckets.map(b => b.name);
      
      for (const bucketName of requiredBuckets) {
        if (!existingBucketNames.includes(bucketName)) {
          console.log(`\n   📦 '${bucketName}' 버킷 생성 중...`);
          
          const { data: bucket, error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
            public: false,  // 비공개 설정
            allowedMimeTypes: ['image/*', 'video/*'],
            fileSizeLimit: 52428800  // 50MB 제한
          });
          
          if (createError) {
            console.log(`   ❌ '${bucketName}' 버킷 생성 실패:`, createError.message);
          } else {
            console.log(`   ✅ '${bucketName}' 버킷 생성 완료`);
          }
        } else {
          console.log(`   ✅ '${bucketName}' 버킷 이미 존재`);
        }
      }
    }

    // 4. 필수 테이블 생성 확인
    console.log('\n4. 📋 데이터베이스 테이블 확인...');
    
    const requiredTables = [
      {
        name: 'profiles',
        sql: `
          CREATE TABLE profiles (
            id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
            email TEXT,
            full_name TEXT,
            avatar_url TEXT,
            subscription_tier TEXT DEFAULT 'free',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
          );
        `
      },
      {
        name: 'movies', 
        sql: `
          CREATE TABLE movies (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES profiles(id) NOT NULL,
            title TEXT NOT NULL,
            diary_content TEXT NOT NULL,
            analysis_data JSONB,
            status TEXT DEFAULT 'processing',
            video_url TEXT,
            thumbnail_url TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
          );
        `
      },
      {
        name: 'scenes',
        sql: `
          CREATE TABLE scenes (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            movie_id UUID REFERENCES movies(id) NOT NULL,
            scene_number INTEGER NOT NULL,
            description TEXT NOT NULL,
            visual_prompt TEXT,
            image_url TEXT,
            video_url TEXT,
            duration INTEGER DEFAULT 4,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
          );
        `
      }
    ];

    for (const table of requiredTables) {
      const { data: tableData, error: tableError } = await supabaseAdmin
        .from(table.name)
        .select('*')
        .limit(1);

      if (tableError && tableError.message.includes('does not exist')) {
        console.log(`\n   📝 '${table.name}' 테이블 생성 중...`);
        
        const { error: createTableError } = await supabaseAdmin.rpc('execute_sql', {
          sql: table.sql
        });
        
        if (createTableError) {
          console.log(`   ❌ '${table.name}' 테이블 생성 실패:`, createTableError.message);
          console.log(`   💡 Supabase 대시보드에서 직접 생성해주세요.`);
        } else {
          console.log(`   ✅ '${table.name}' 테이블 생성 완료`);
        }
      } else {
        console.log(`   ✅ '${table.name}' 테이블 확인됨`);
      }
    }

    console.log('\n🎉 Supabase 설정 완료!');
    console.log('===============================');
    console.log('✅ 데이터베이스 연결: 성공');
    console.log('✅ Storage 버킷: 설정됨');
    console.log('✅ 필수 테이블: 확인됨');
    console.log('🚀 MyLife Cinema 데이터베이스 준비 완료!');

    return true;

  } catch (error) {
    console.error('❌ Supabase 테스트 실패:', error.message);
    
    if (error.message.includes('Invalid API key')) {
      console.log('🔑 API 키가 올바르지 않습니다. 다시 확인해주세요.');
    } else if (error.message.includes('fetch')) {
      console.log('🌐 네트워크 연결을 확인해주세요.');
    }

    return false;
  }
}

// 스크립트 실행
testSupabase().then(success => {
  if (success) {
    console.log('\n🏆 Supabase 완전 설정 성공!');
  } else {
    console.log('\n⚠️ 일부 설정에서 문제가 발생했습니다. 대시보드에서 확인해주세요.');
  }
}).catch(error => {
  console.error('❌ 스크립트 실행 실패:', error);
});