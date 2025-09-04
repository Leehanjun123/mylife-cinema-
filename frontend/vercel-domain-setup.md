# Vercel 도메인 설정 가이드

## 1. Vercel Dashboard에서 도메인 추가

1. https://vercel.com/leehanjun123s-projects/frontend 접속
2. **Settings** 탭 클릭
3. 왼쪽 메뉴에서 **Domains** 선택
4. **Add** 버튼 클릭
5. `lifecinema.site` 입력 후 **Add** 클릭

## 2. 도메인 소유권 인증

Vercel이 두 가지 옵션을 제공합니다:

### 옵션 A: DNS TXT 레코드 (권장)
도메인 제공업체 DNS 관리에서:
- Type: TXT
- Name: _vercel
- Value: (Vercel이 제공하는 값)

### 옵션 B: Nameservers 변경
- ns1.vercel-dns.com
- ns2.vercel-dns.com

## 3. DNS 설정 (도메인 제공업체에서)

### A 레코드 (필수)
```
Type: A
Name: @ (또는 비워두기)
Value: 76.76.21.21
```

### CNAME 레코드 (www 서브도메인)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

## 4. SSL 인증서
- Vercel이 자동으로 Let's Encrypt SSL 인증서 발급
- 도메인 연결 후 자동 활성화

## 5. 확인사항
- DNS 전파: 5분~48시간 소요 가능
- https://lifecinema.site 접속 테스트
- https://www.lifecinema.site 접속 테스트

## 도메인 제공업체별 설정 위치

### Namecheap
1. Domain List → Manage → Advanced DNS
2. Add New Record

### GoDaddy
1. My Products → DNS → Manage Zones
2. Add Record

### Cloudflare
1. DNS → Records
2. Add Record
3. **주의**: Proxy 상태를 "DNS only"로 설정

## 문제 해결

### "Not authorized to use domain" 오류
1. 도메인 소유권 인증 필요
2. TXT 레코드 추가 후 Verify 클릭

### SSL 인증서 오류
1. DNS 설정 확인
2. 24시간 대기 (인증서 발급 시간)

### 404 오류
1. Vercel 프로젝트 배포 상태 확인
2. 도메인이 올바른 프로젝트에 연결되었는지 확인