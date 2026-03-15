import 'package:flutter/material.dart';

const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF1A1A1A);
const _bg = Color(0xFFFAF8F3);
const _grey = Color(0xFF8B8278);

class PrivacyScreen extends StatelessWidget {
  const PrivacyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: _dark),
        title: const Text('개인정보처리방침',
            style: TextStyle(color: _dark, fontSize: 14, letterSpacing: 2, fontWeight: FontWeight.w400)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Center(
              child: Column(
                children: [
                  Text('PRIVACY POLICY',
                      style: TextStyle(fontSize: 10, letterSpacing: 4, color: _gold)),
                  const SizedBox(height: 8),
                  Container(width: 40, height: 1, color: _gold.withOpacity(0.4)),
                  const SizedBox(height: 4),
                  Text('최종 수정일: 2024년 1월 1일',
                      style: TextStyle(fontSize: 10, color: _grey)),
                ],
              ),
            ),
            const SizedBox(height: 32),
            _buildSection('1. 수집하는 개인정보',
                'AION 향수(이하 "회사")는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.\n\n• 필수항목: 이메일 주소, 비밀번호, 이름, 전화번호\n• 선택항목: 생년월일, 성별, 향수 선호도\n• 자동수집: 접속 IP, 쿠키, 방문 일시, 서비스 이용 기록'),
            _buildSection('2. 개인정보 수집 목적',
                '• 회원 가입 및 관리: 본인 확인, 서비스 이용\n• 서비스 제공: 향수 추천, 커스터마이징, 주문 처리\n• 마케팅 및 광고: 맞춤형 서비스 제공 (동의한 경우)\n• 통계 분석: 서비스 개선 및 연구'),
            _buildSection('3. 개인정보 보유 및 이용기간',
                '회원 탈퇴 시까지 보유합니다. 단, 관계법령에 의해 보존이 필요한 경우 법령에서 정한 기간 동안 보관합니다.\n\n• 전자상거래 관련 기록: 5년\n• 소비자 불만 및 분쟁 처리 기록: 3년\n• 로그 기록: 3개월'),
            _buildSection('4. 개인정보의 제3자 제공',
                '회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다.\n\n• 이용자가 사전에 동의한 경우\n• 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우'),
            _buildSection('5. 개인정보 처리 위탁',
                '회사는 서비스 향상을 위해 아래와 같이 개인정보 처리 업무를 위탁하고 있습니다.\n\n• 결제 처리: PG사 (카드사 등)\n• 배송 처리: 택배사\n• 이메일 발송: 이메일 서비스 제공업체'),
            _buildSection('6. 이용자의 권리',
                '이용자는 언제든지 다음의 권리를 행사할 수 있습니다.\n\n• 개인정보 열람 요구\n• 오류 등이 있을 경우 정정 요구\n• 삭제 요구\n• 처리 정지 요구\n\n권리 행사는 서면, 전화, 이메일 등을 통해 하실 수 있으며, 회사는 이에 대해 지체 없이 조치합니다.'),
            _buildSection('7. 쿠키(Cookie) 운용',
                '회사는 이용자에게 개인화된 서비스를 제공하기 위해 쿠키를 사용합니다. 쿠키는 웹사이트를 운영하는데 이용되는 서버가 이용자의 브라우저에게 보내는 아주 작은 텍스트 파일로 이용자의 기기에 저장됩니다.\n\n이용자는 쿠키 설치에 대한 선택권을 가지고 있습니다. 브라우저의 설정을 통해 쿠키를 허용하거나 거부할 수 있습니다.'),
            _buildSection('8. 개인정보보호 책임자',
                '회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 이용자의 불만처리 및 피해구제를 위해 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.\n\n• 개인정보 보호책임자: AION 개인정보팀\n• 이메일: privacy@aion-perfume.com'),
            const SizedBox(height: 40),
            Center(
              child: Text(
                '© 2024 AION Perfume. All rights reserved.',
                style: TextStyle(fontSize: 10, color: _grey.withOpacity(0.6), letterSpacing: 1),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title,
              style: const TextStyle(fontSize: 14, color: _dark, fontWeight: FontWeight.w600, letterSpacing: 0.5)),
          const SizedBox(height: 4),
          Container(width: 24, height: 1, color: _gold.withOpacity(0.5)),
          const SizedBox(height: 10),
          Text(content,
              style: TextStyle(fontSize: 13, color: _dark.withOpacity(0.7), height: 1.8, letterSpacing: 0.3)),
        ],
      ),
    );
  }
}
