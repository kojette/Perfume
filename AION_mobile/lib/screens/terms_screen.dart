import 'package:flutter/material.dart';

const _gold = Color(0xFFC9A961);
const _dark = Color(0xFF1A1A1A);
const _bg = Color(0xFFFAF8F3);
const _grey = Color(0xFF8B8278);

class TermsScreen extends StatelessWidget {
  const TermsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        iconTheme: const IconThemeData(color: _dark),
        title: const Text('이용약관',
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
                  Text('TERMS OF SERVICE',
                      style: TextStyle(fontSize: 10, letterSpacing: 4, color: _gold)),
                  const SizedBox(height: 8),
                  Container(width: 40, height: 1, color: _gold.withOpacity(0.4)),
                  const SizedBox(height: 4),
                  Text('최종 수정일: 2026년 1월 1일',
                      style: TextStyle(fontSize: 10, color: _grey)),
                ],
              ),
            ),
            const SizedBox(height: 32),
            _buildSection('제1조 (목적)',
                'AION 향수(이하 "회사")가 제공하는 서비스의 이용과 관련하여 회사와 이용자의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.'),
            _buildSection('제2조 (정의)',
                '1. "서비스"란 회사가 제공하는 모든 온라인 및 오프라인 서비스를 의미합니다.\n\n2. "이용자"란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.\n\n3. "회원"이란 회사에 개인정보를 제공하여 회원가입을 한 자로서, 회사의 정보를 지속적으로 제공받으며 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 말합니다.'),
            _buildSection('제3조 (약관의 효력 및 변경)',
                '이 약관은 회원가입 시 또는 서비스 이용 시 동의함으로써 효력이 발생합니다. 회사는 관련 법령에 위배되지 않는 범위에서 약관을 개정할 수 있으며, 변경 시 7일 이전에 공지합니다.'),
            _buildSection('제4조 (서비스의 제공 및 변경)',
                '회사는 다음과 같은 서비스를 제공합니다:\n- 향수 관련 정보 제공 서비스\n- 향수 커스터마이징 서비스\n- 온라인 쇼핑 서비스\n- 기타 회사가 정하는 서비스'),
            _buildSection('제5조 (회원가입)',
                '이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로서 회원가입을 신청합니다. 회사는 회원가입을 완료한 이용자에게 서비스를 제공합니다.'),
            _buildSection('제6조 (회원 탈퇴 및 자격 상실)',
                '회원은 회사에 언제든지 탈퇴를 요청할 수 있으며 회사는 즉시 처리합니다. 회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다:\n- 가입 신청 시에 허위 내용을 등록한 경우\n- 다른 사람의 회사 서비스 이용을 방해한 경우\n- 기타 관련 법령에 위반되는 행위를 한 경우'),
            _buildSection('제7조 (개인정보보호)',
                '회사는 관련법령이 정하는 바에 따라 회원 등록정보를 포함한 회원의 개인정보를 보호하기 위해 노력합니다. 회원의 개인정보보호에 관해서는 관련법령 및 회사가 정하는 개인정보처리방침에 정한 바에 의합니다.'),
            _buildSection('제8조 (분쟁해결)',
                '회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.'),
            const SizedBox(height: 40),
            Center(
              child: Text(
                '© 2026 AION Perfume. All rights reserved.',
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
