import { Card } from '@/components/ui/card'

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-800 mb-4">개인정보처리방침</h1>
            <p className="text-gray-600">MyLife Cinema 개인정보처리방침</p>
            <p className="text-sm text-gray-500 mt-2">최종 수정일: 2024년 1월 1일</p>
          </div>

          <Card className="p-8 prose max-w-none">
            <h2>1. 개인정보 처리방침의 의의</h2>
            <p>
              MyLife Cinema(이하 "회사")는 정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 
              준수하여, 적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보 보호법」 제30조에 따라 
              정보주체에게 개인정보 처리에 관한 절차 및 기준을 안내하고, 이와 관련한 고충을 신속하고 원활하게 처리할 수 
              있도록 하기 위하여 다음과 같이 개인정보 처리방침을 수립·공개합니다.
            </p>

            <h2>2. 개인정보의 처리목적</h2>
            <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 
               이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 
               필요한 조치를 이행할 예정입니다.</p>

            <h3>가. 서비스 제공</h3>
            <ul>
              <li>회원가입, 회원제 서비스 이용에 따른 본인확인</li>
              <li>AI 영화 제작 서비스 제공</li>
              <li>콘텐츠 제공, 맞춤형 서비스 제공</li>
              <li>서비스 이용기록, 접속빈도 분석, 서비스 이용에 대한 통계</li>
            </ul>

            <h3>나. 마케팅 및 광고 활용</h3>
            <ul>
              <li>신규 서비스(제품) 개발 및 맞춤 서비스 제공</li>
              <li>이벤트 및 광고성 정보 제공 및 참여기회 제공</li>
              <li>접속빈도 파악 또는 회원의 서비스 이용에 대한 통계</li>
            </ul>

            <h2>3. 개인정보의 처리 및 보유기간</h2>
            <p>
              1. 회사는 정보주체로부터 개인정보를 수집할 때 동의받은 개인정보 보유·이용기간 또는 법령에 따른 
                 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.<br/>
              2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:
            </p>

            <h3>가. 회원가입 및 관리</h3>
            <ul>
              <li>보유기간: 회원 탈퇴 시까지</li>
              <li>다만, 다음의 사유에 해당하는 경우에는 해당 사유 종료 시까지</li>
              <li>관계 법령 위반에 따른 수사·조사 등이 진행 중인 경우에는 해당 수사·조사 종료 시까지</li>
              <li>서비스 이용에 따른 채권·채무관계 잔존 시에는 해당 채권·채무관계 정산 시까지</li>
            </ul>

            <h3>나. 결제정보</h3>
            <ul>
              <li>보유기간: 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 5년</li>
            </ul>

            <h2>4. 처리하는 개인정보의 항목</h2>
            <h3>가. 회원가입 시</h3>
            <ul>
              <li>필수항목: 이메일 주소, 비밀번호, 사용자명</li>
              <li>선택항목: 프로필 사진</li>
            </ul>

            <h3>나. 서비스 이용 과정에서 자동 수집되는 정보</h3>
            <ul>
              <li>IP 주소, 쿠키, MAC주소, 서비스 이용 기록, 방문 기록, 불량 이용 기록 등</li>
            </ul>

            <h3>다. 결제 시</h3>
            <ul>
              <li>신용카드 정보, 은행계좌 정보 등 (결제대행업체를 통해 처리)</li>
            </ul>

            <h2>5. 개인정보의 제3자 제공</h2>
            <p>
              1. 회사는 정보주체의 개인정보를 제2조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 
                 정보주체의 동의, 법률의 특별한 규정 등 「개인정보 보호법」 제17조 및 제18조에 해당하는 경우에만 
                 개인정보를 제3자에게 제공합니다.<br/>
              2. 회사는 다음과 같이 개인정보를 제3자에게 제공하고 있습니다:
            </p>

            <h3>가. AI 서비스 제공업체</h3>
            <ul>
              <li>제공받는 자: OpenAI, Replicate</li>
              <li>제공목적: AI 영화 생성 서비스 제공</li>
              <li>제공항목: 일기 내용, 감정 데이터</li>
              <li>보유 및 이용기간: 서비스 제공 목적 달성 시까지</li>
            </ul>

            <h3>나. 결제대행업체</h3>
            <ul>
              <li>제공받는 자: Stripe</li>
              <li>제공목적: 결제 처리</li>
              <li>제공항목: 결제 정보</li>
              <li>보유 및 이용기간: 결제 완료 후 5년</li>
            </ul>

            <h2>6. 개인정보처리의 위탁</h2>
            <p>
              1. 회사는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:
            </p>

            <table className="min-w-full border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 px-4 py-2">위탁업체</th>
                  <th className="border border-gray-300 px-4 py-2">위탁업무</th>
                  <th className="border border-gray-300 px-4 py-2">개인정보의 보유 및 이용기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Supabase</td>
                  <td className="border border-gray-300 px-4 py-2">데이터베이스 관리, 사용자 인증</td>
                  <td className="border border-gray-300 px-4 py-2">위탁계약 종료 시까지</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Vercel</td>
                  <td className="border border-gray-300 px-4 py-2">웹사이트 호스팅</td>
                  <td className="border border-gray-300 px-4 py-2">위탁계약 종료 시까지</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 px-4 py-2">Railway</td>
                  <td className="border border-gray-300 px-4 py-2">API 서버 호스팅</td>
                  <td className="border border-gray-300 px-4 py-2">위탁계약 종료 시까지</td>
                </tr>
              </tbody>
            </table>

            <h2>7. 정보주체의 권리·의무 및 행사방법</h2>
            <p>
              1. 정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:
            </p>
            <ul>
              <li>개인정보 처리현황 통지 요구</li>
              <li>개인정보 처리정지 요구</li>
              <li>개인정보의 정정·삭제 요구</li>
              <li>손해배상 청구</li>
            </ul>

            <h2>8. 개인정보의 파기</h2>
            <p>
              1. 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 
                 해당 개인정보를 파기합니다.<br/>
              2. 개인정보 파기의 절차 및 방법은 다음과 같습니다:
            </p>

            <h3>가. 파기절차</h3>
            <p>
              회사는 파기 사유가 발생한 개인정보를 선정하고, 회사의 개인정보 보호책임자의 승인을 받아 개인정보를 파기합니다.
            </p>

            <h3>나. 파기방법</h3>
            <ul>
              <li>전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용합니다.</li>
              <li>종이에 출력된 개인정보는 분쇄기로 분쇄하거나 소각을 통하여 파기합니다.</li>
            </ul>

            <h2>9. 개인정보의 안전성 확보조치</h2>
            <p>회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다:</p>
            <ul>
              <li>관리적 조치: 내부관리계획 수립·시행, 정기적 직원 교육 등</li>
              <li>기술적 조치: 개인정보처리시스템 등의 접근권한 관리, 접근통제시스템 설치, 고유식별정보 등의 암호화, 
                  보안프로그램 설치</li>
              <li>물리적 조치: 전산실, 자료보관실 등의 접근통제</li>
            </ul>

            <h2>10. 개인정보 보호책임자</h2>
            <p>
              회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 
              피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:
            </p>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3>개인정보 보호책임자</h3>
              <ul>
                <li>성명: MyLife Cinema 개발팀</li>
                <li>직책: 개발팀장</li>
                <li>연락처: privacy@lifecinema.site</li>
              </ul>
            </div>

            <h2>11. 권익침해 구제방법</h2>
            <p>
              정보주체는 아래의 기관에 대해 개인정보 침해신고, 상담 등을 문의하실 수 있습니다:
            </p>

            <div className="grid md:grid-cols-3 gap-4 my-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold">개인정보 침해신고센터</h4>
                <p>소관업무: 개인정보 침해신고 접수 및 처리</p>
                <p>홈페이지: privacy.go.kr</p>
                <p>전화: (국번없이) 182</p>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold">개인정보 분쟁조정위원회</h4>
                <p>소관업무: 개인정보 분쟁조정신청</p>
                <p>홈페이지: www.kopico.go.kr</p>
                <p>전화: (국번없이) 1833-6972</p>
              </div>
              
              <div className="bg-yellow-50 p-4 rounded-lg">
                <h4 className="font-semibold">대검찰청 사이버범죄수사단</h4>
                <p>소관업무: 사이버범죄신고 접수 및 처리</p>
                <p>홈페이지: www.spo.go.kr</p>
                <p>전화: 02-3480-3573</p>
              </div>
            </div>

            <h2>12. 개인정보 처리방침 변경</h2>
            <p>
              이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>

            <div className="mt-12 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">연락처</h3>
              <p><strong>MyLife Cinema</strong></p>
              <p>개인정보보호 문의: privacy@lifecinema.site</p>
              <p>일반 문의: support@lifecinema.site</p>
              <p>웹사이트: https://lifecinema.site</p>
            </div>
          </Card>
        </div>
      </div>
    </main>
  )
}