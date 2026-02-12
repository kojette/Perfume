import 'package:flutter/material.dart';

class StoreScreen extends StatelessWidget {
  const StoreScreen({super.key});

  final List<Map<String, String>> stores = const [
    {
      'city': '서울',
      'name': '서울 올림포스점',
      'address': '서울특별시 강남구 테헤란로 123',
      'phone': '02-123-4567',
    },
    {
      'city': '부산',
      'name': '부산 아테네점',
      'address': '부산광역시 해운대구 달맞이길 88',
      'phone': '051-987-6543',
    },
    {
      'city': '대구',
      'name': '대구 헤라점',
      'address': '대구광역시 중구 동성로 5',
      'phone': '053-111-2222',
    },
    {
      'city': '인천',
      'name': '인천 포세이돈점',
      'address': '인천광역시 연수구 송도과학로 32',
      'phone': '032-333-4444',
    },
    {
      'city': '광주',
      'name': '광주 아레스점',
      'address': '광주광역시 서구 상무중앙로 10',
      'phone': '062-555-6666',
    },
    {
      'city': '대전',
      'name': '대전 헤르메스점',
      'address': '대전광역시 서구 둔산로 100',
      'phone': '042-777-8888',
    },
    {
      'city': '울산',
      'name': '울산 아르테미스점',
      'address': '울산광역시 남구 삼산로 20',
      'phone': '052-999-0000',
    },
    {
      'city': '제주',
      'name': '제주 델포이점',
      'address': '제주특별자치도 제주시 노형로 7',
      'phone': '064-000-1111',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        centerTitle: true,
        title: const Text('매장 안내', style: TextStyle(letterSpacing: 4)),
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
                    'OUR BOUTIQUE',
                    style: TextStyle(
                      fontSize: 10,
                      letterSpacing: 4,
                      color: Color(0xFFC9A961),
                      fontStyle: FontStyle.italic,
                    ),
                  ),
                  SizedBox(height: 16),
                  Text(
                    '매장 안내',
                    style: TextStyle(
                      fontSize: 28,
                      letterSpacing: 6,
                      color: Color(0xFF2A2620),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  SizedBox(height: 8),
                  Divider(
                    color: Color(0xFFC9A961),
                    thickness: 1,
                    indent: 120,
                    endIndent: 120,
                  ),
                ],
              ),
            ),
            const SizedBox(height: 40),
            // Store Grid
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 24),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.75,
                crossAxisSpacing: 24,
                mainAxisSpacing: 32,
              ),
              itemCount: stores.length,
              itemBuilder: (context, index) {
                final store = stores[index];
                return _buildStoreCard(store);
              },
            ),
            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildStoreCard(Map<String, String> store) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // City Label
        Text(
          store['city']!,
          style: const TextStyle(
            fontSize: 11,
            letterSpacing: 2,
            color: Color(0xFF8B8278),
            fontStyle: FontStyle.italic,
          ),
        ),
        const SizedBox(height: 8),
        // Store Name
        Container(
          padding: const EdgeInsets.only(bottom: 8),
          decoration: const BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color: Color(0xFFC9A961),
                width: 1,
              ),
            ),
          ),
          child: Text(
            store['name']!,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
              letterSpacing: 1.5,
              color: Color(0xFF2A2620),
            ),
          ),
        ),
        const SizedBox(height: 12),
        // Address
        Text(
          store['address']!,
          style: const TextStyle(
            fontSize: 12,
            color: Color(0xFF555555),
            height: 1.5,
          ),
        ),
        const SizedBox(height: 8),
        // Phone
        Text(
          'T. ${store['phone']!}',
          style: const TextStyle(
            fontSize: 11,
            letterSpacing: 1,
            color: Color(0xFFC9A961),
            fontStyle: FontStyle.italic,
          ),
        ),
      ],
    );
  }
}
