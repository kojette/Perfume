import 'package:flutter/material.dart';
import 'package:aion_perfume_app/widgets/ornament.dart';

class NewsletterSection extends StatefulWidget {
  const NewsletterSection({super.key});

  @override
  State<NewsletterSection> createState() => _NewsletterSectionState();
}

class _NewsletterSectionState extends State<NewsletterSection> {
  final _emailController = TextEditingController();

  void _handleSubscribe() {
    if (_emailController.text.isEmpty) {
      _showAlert('이메일 주소를 입력해주세요.');
      return;
    }

    _showAlert('구독해주셔서 감사합니다!');
    _emailController.clear();
  }

  void _showAlert(String message) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인', style: TextStyle(color: Color(0xFFC9A961))),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            Color(0xFF2A2620),
            Color(0xFF3A3530),
            Color(0xFF2A2620),
          ],
        ),
      ),
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 24),
      child: Column(
        children: [
          // 배경 장식
          Stack(
            children: [
              // 실제 콘텐츠
              Column(
                children: [
                  const Text(
                    'NEWSLETTER',
                    style: TextStyle(
                      color: Color(0xFFC9A961),
                      fontSize: 10,
                      letterSpacing: 4,
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  const SizedBox(height: 16),
                  const Ornament(),
                  const SizedBox(height: 24),

                  const Text(
                    '신성한 소식을\n전해드립니다',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 32,
                      letterSpacing: 3,
                      color: Color(0xFFC9A961),
                      height: 1.3,
                    ),
                  ),

                  const SizedBox(height: 20),

                  const Text(
                    '올림포스의 새로운 향기와 독점 혜택을\n가장 먼저 경험하실 수 있습니다',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 13,
                      color: Color(0xFFE8DCC8),
                      fontStyle: FontStyle.italic,
                      height: 1.8,
                    ),
                  ),

                  const SizedBox(height: 30),

                  // 구분선
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Container(
                        width: 80,
                        height: 1,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Colors.transparent, Color(0xFFC9A961)],
                          ),
                        ),
                      ),
                      const Padding(
                        padding: EdgeInsets.symmetric(horizontal: 16),
                        child: Text('✦', style: TextStyle(color: Color(0xFFC9A961))),
                      ),
                      Container(
                        width: 80,
                        height: 1,
                        decoration: const BoxDecoration(
                          gradient: LinearGradient(
                            colors: [Color(0xFFC9A961), Colors.transparent],
                          ),
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 30),

                  // 이메일 입력
                  TextField(
                    controller: _emailController,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                    textAlign: TextAlign.center,
                    decoration: InputDecoration(
                      hintText: '이메일 주소를 입력해주세요',
                      hintStyle: const TextStyle(
                        color: Color(0xFF8B8278),
                        fontStyle: FontStyle.italic,
                        fontSize: 13,
                      ),
                      enabledBorder: OutlineInputBorder(
                        borderSide: BorderSide(
                          color: const Color(0xFFC9A961).withOpacity(0.4),
                          width: 2,
                        ),
                        borderRadius: BorderRadius.zero,
                      ),
                      focusedBorder: const OutlineInputBorder(
                        borderSide: BorderSide(color: Color(0xFFC9A961), width: 2),
                        borderRadius: BorderRadius.zero,
                      ),
                      filled: true,
                      fillColor: Colors.transparent,
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 16,
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  // 구독 버튼
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: _handleSubscribe,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFC9A961),
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: const RoundedRectangleBorder(),
                      ),
                      child: const Text(
                        '구독하기',
                        style: TextStyle(
                          color: Color(0xFF2A2620),
                          fontSize: 12,
                          letterSpacing: 3,
                        ),
                      ),
                    ),
                  ),

                  const SizedBox(height: 16),

                  const Text(
                    '신성한 개인정보는 안전하게 보호됩니다',
                    style: TextStyle(
                      fontSize: 10,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),

              // 배경 장식 아이콘들
              Positioned(
                top: -20,
                left: 20,
                child: Text('✦',
                    style: TextStyle(
                        fontSize: 40,
                        color: const Color(0xFFC9A961).withOpacity(0.05))),
              ),
              Positioned(
                top: 60,
                right: 30,
                child: Text('❖',
                    style: TextStyle(
                        fontSize: 30,
                        color: const Color(0xFFC9A961).withOpacity(0.05))),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }
}