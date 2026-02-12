import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/perfume.dart';

class PerfumeListScreen extends StatelessWidget {
  const PerfumeListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('향수 목록')),
      body: FutureBuilder<List<Perfume>>(
        future: ApiService.fetchPerfumes(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }

          if (snapshot.hasError) {
            return Center(
              child: Text(
                snapshot.error.toString(),
                style: const TextStyle(color: Colors.red),
              ),
            );
          }

          final perfumes = snapshot.data!;
          if (perfumes.isEmpty) {
            return const Center(child: Text('향수가 없습니다'));
          }

          return ListView.builder(
            itemCount: perfumes.length,
            itemBuilder: (context, index) {
              final p = perfumes[index];
              return ListTile(
                title: Text(p.name),
                subtitle: Text(p.brandName ?? ''),
                trailing: Text('${p.displayPrice}원'),
              );
            },
          );
        },
      ),
    );
  }
}
