import 'package:flutter/material.dart';

class FAQScreen extends StatefulWidget {
  const FAQScreen({super.key});

  @override
  State<FAQScreen> createState() => _FAQScreenState();
}

class _FAQScreenState extends State<FAQScreen> {
  int? openId;
  String selectedCategory = 'all';

  final List<Map<String, dynamic>> faqData = [
    {
      'id': 1,
      'category': '주문/배송',
      'question': '배송은 얼마나 걸리나요?',
      'answer': '주문 확인 후 영업일 기준 2-3일 내에 배송됩니다. 제주도 및 도서산간 지역은 추가 1-2일이 소요될 수 있습니다. 배송 시작 시 문자 또는 이메일로 송장번호를 안내해드립니다.',
    },
    {
      'id': 2,
      'category': '주문/배송',
      'question': '배송비는 얼마인가요?',
      'answer': '50,000원 이상 구매 시 무료배송입니다. 50,000원 미만 주문 시 배송비 3,000원이 부과됩니다. 제주도 및 도서산간 지역은 추가 배송비가 발생할 수 있습니다.',
    },
    {
      'id': 3,
      'category': '주문/배송',
      'question': '주문 후 배송지 변경이 가능한가요?',
      'answer': '배송 준비 중 단계까지는 고객센터로 연락주시면 배송지 변경이 가능합니다. 이미 배송이 시작된 경우에는 택배사에 직접 연락하여 변경을 요청하셔야 합니다.',
    },
    {
      'id': 4,
      'category': '교환/환불',
      'question': '교환 및 환불은 어떻게 하나요?',
      'answer': '제품 수령 후 7일 이내에 고객센터로 연락주시면 됩니다. 단, 제품 개봉 후 사용한 향수는 교환 및 환불이 불가능합니다. 미개봉 상태의 제품만 교환 및 환불이 가능합니다.',
    },
    {
      'id': 5,
      'category': '교환/환불',
      'question': '환불은 언제 처리되나요?',
      'answer': '반품 상품 확인 후 영업일 기준 3-5일 내에 환불이 처리됩니다. 카드 결제의 경우 카드사 정책에 따라 추가 시일이 소요될 수 있습니다.',
    },
    {
      'id': 6,
      'category': '제품',
      'question': '향수 샘플을 받을 수 있나요?',
      'answer': '온라인 구매 고객님께는 주문 시 샘플 2종을 무료로 제공해드립니다. 또한 매장 방문 시 테스트가 가능하며, 원하시는 향의 샘플을 받아가실 수 있습니다.',
    },
    {
      'id': 7,
      'category': '제품',
      'question': '향수 보관은 어떻게 해야 하나요?',
      'answer': '직사광선을 피하고 서늘한 곳에 보관하시는 것이 좋습니다. 욕실처럼 온도와 습도 변화가 큰 곳은 피해주세요. 개봉 후에는 1-2년 내에 사용하시는 것을 권장합니다.',
    },
    {
      'id': 8,
      'category': '제품',
      'question': '제품 성분을 알 수 있나요?',
      'answer': '모든 제품의 상세 페이지에서 전성분을 확인하실 수 있습니다. 알레르기가 있으신 경우 구매 전 반드시 성분을 확인해주시기 바랍니다.',
    },
    {
      'id': 9,
      'category': '회원/혜택',
      'question': '회원 등급 혜택이 있나요?',
      'answer': '구매 금액에 따라 실버, 골드, 플래티넘 등급으로 나뉘며, 등급별로 할인율과 적립률이 달라집니다. 또한 생일 쿠폰 등 다양한 혜택을 제공해드립니다.',
    },
    {
      'id': 10,
      'category': '회원/혜택',
      'question': '적립금은 어떻게 사용하나요?',
      'answer': '적립금은 1,000원 이상부터 사용 가능하며, 상품 금액의 최대 30%까지 사용하실 수 있습니다. 적립금은 제품 구매 시에만 사용 가능하며, 배송비 결제에는 사용할 수 없습니다.',
    },
  ];

  final Map<String, String> categoryLabels = {
    'all': '전체',
    '주문/배송': '주문/배송',
    '교환/환불': '교환/환불',
    '제품': '제품',
    '회원/혜택': '회원/혜택',
  };

  List<Map<String, dynamic>> get filteredFAQ {
    if (selectedCategory == 'all') {
      return faqData;
    }
    return faqData.where((faq) => faq['category'] == selectedCategory).toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text('FAQ', style: TextStyle(letterSpacing: 4)),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 24),
            // Header
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: Column(
                children: [
                  Text(
                    'FREQUENTLY ASKED QUESTIONS',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 4,
                      color: Color(0xFFC9A961),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  SizedBox(height: 16),
                  Text(
                    '자주 묻는 질문',
                    style: TextStyle(
                      fontSize: 24,
                      letterSpacing: 8,
                      color: Color(0xFF2A2620),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    '고객님들이 자주 궁금해하시는 내용을 모았습니다',
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF8B8278),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 32),
            // Category Filter
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 24),
                children: categoryLabels.keys.map((category) {
                  final isSelected = selectedCategory == category;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(
                        categoryLabels[category]!,
                        style: TextStyle(
                          fontSize: 12,
                          letterSpacing: 1.5,
                          color: isSelected ? Colors.white : const Color(0xFF8B8278),
                        ),
                      ),
                      selected: isSelected,
                      selectedColor: const Color(0xFFC9A961),
                      backgroundColor: Colors.white,
                      side: BorderSide(
                        color: const Color(0xFFC9A961).withOpacity(0.2),
                      ),
                      onSelected: (selected) {
                        setState(() {
                          selectedCategory = category;
                        });
                      },
                    ),
                  );
                }).toList(),
              ),
            ),
            const SizedBox(height: 24),
            // FAQ List
            ListView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24),
              itemCount: filteredFAQ.length,
              itemBuilder: (context, index) {
                final faq = filteredFAQ[index];
                final isOpen = openId == faq['id'];
                
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border.all(
                      color: const Color(0xFFC9A961).withOpacity(0.2),
                    ),
                    borderRadius: BorderRadius.circular(8),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 4,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      InkWell(
                        onTap: () {
                          setState(() {
                            openId = isOpen ? null : faq['id'];
                          });
                        },
                        child: Padding(
                          padding: const EdgeInsets.all(20),
                          child: Row(
                            children: [
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Row(
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(
                                            horizontal: 8,
                                            vertical: 4,
                                          ),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFFC9A961).withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            faq['category'],
                                            style: const TextStyle(
                                              fontSize: 9,
                                              letterSpacing: 1,
                                              color: Color(0xFFC9A961),
                                              fontWeight: FontWeight.w600,
                                            ),
                                          ),
                                        ),
                                        const SizedBox(width: 8),
                                        const Text(
                                          'Q',
                                          style: TextStyle(
                                            fontSize: 12,
                                            color: Color(0xFFC9A961),
                                            fontWeight: FontWeight.bold,
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 8),
                                    Text(
                                      faq['question'],
                                      style: const TextStyle(
                                        fontSize: 15,
                                        color: Color(0xFF2A2620),
                                        fontWeight: FontWeight.w500,
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              Icon(
                                isOpen ? Icons.keyboard_arrow_up : Icons.keyboard_arrow_down,
                                color: isOpen ? const Color(0xFFC9A961) : const Color(0xFF8B8278),
                              ),
                            ],
                          ),
                        ),
                      ),
                      if (isOpen)
                        Container(
                          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
                          decoration: BoxDecoration(
                            color: const Color(0xFFFAF8F3),
                            border: Border(
                              top: BorderSide(
                                color: const Color(0xFFC9A961).withOpacity(0.1),
                              ),
                            ),
                          ),
                          child: Row(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Padding(
                                padding: EdgeInsets.only(top: 12, right: 12),
                                child: Text(
                                  'A',
                                  style: TextStyle(
                                    fontSize: 12,
                                    color: Color(0xFFC9A961),
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                              Expanded(
                                child: Padding(
                                  padding: const EdgeInsets.only(top: 12),
                                  child: Text(
                                    faq['answer'],
                                    style: const TextStyle(
                                      fontSize: 14,
                                      color: Color(0xFF555555),
                                      height: 1.6,
                                    ),
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                    ],
                  ),
                );
              },
            ),
            const SizedBox(height: 24),
            // CTA
            Container(
              margin: const EdgeInsets.symmetric(horizontal: 24),
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(
                  color: const Color(0xFFC9A961).withOpacity(0.2),
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                children: [
                  const Icon(
                    Icons.chat_bubble_outline,
                    size: 40,
                    color: Color(0xFFC9A961),
                  ),
                  const SizedBox(height: 16),
                  const Text(
                    '찾으시는 답변이 없으신가요?',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF2A2620),
                    ),
                  ),
                  const SizedBox(height: 8),
                  const Text(
                    '고객센터를 통해 문의해주시면\n빠르게 답변해드리겠습니다.',
                    textAlign: TextAlign.center,
                    style: TextStyle(
                      fontSize: 14,
                      color: Color(0xFF8B8278),
                    ),
                  ),
                  const SizedBox(height: 24),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
                        Navigator.of(context).pushNamed('/customer-inquiry');
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFFC9A961),
                        padding: const EdgeInsets.symmetric(vertical: 12),
                      ),
                      child: const Text(
                        '문의하기',
                        style: TextStyle(
                          letterSpacing: 4,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }
}
