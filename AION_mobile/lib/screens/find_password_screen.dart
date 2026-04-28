import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

class FindPasswordScreen extends StatefulWidget {
  const FindPasswordScreen({super.key});

  @override
  State<FindPasswordScreen> createState() => _FindPasswordScreenState();
}

class _FindPasswordScreenState extends State<FindPasswordScreen> {
  final _emailController = TextEditingController();
  bool _loading = false;
  bool _sent = false;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _grey = Color(0xFF8B8278);

  Future<void> _handleSubmit() async {
    final email = _emailController.text.trim();
    if (email.isEmpty) {
      _showAlert('이메일을 입력해주세요.');
      return;
    }

    setState(() => _loading = true);
    try {
      await Supabase.instance.client.auth.resetPasswordForEmail(
        email,
        redirectTo: 'aion://reset-password',
      );
      if (mounted) setState(() => _sent = true);
    } catch (e) {
      _showAlert('오류가 발생했습니다: ${e.toString()}');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  void _showAlert(String message) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('확인', style: TextStyle(color: _gold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F3),
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _dark),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            const SizedBox(height: 40),
            const Text(
              'AUTHENTICATION',
              style: TextStyle(color: _gold, fontSize: 10, letterSpacing: 5, fontStyle: FontStyle.italic),
            ),
            const SizedBox(height: 20),
            _buildOrnament(),
            const SizedBox(height: 20),
            const Text(
              '비밀번호 찾기',
              style: TextStyle(fontSize: 24, letterSpacing: 2, color: _dark),
            ),
            const SizedBox(height: 40),
            Container(
              padding: const EdgeInsets.all(32),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(color: _gold.withOpacity(0.2)),
              ),
              child: _sent ? _buildSuccessState() : _buildFormState(),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFormState() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('EMAIL ADDRESS',
            style: TextStyle(fontSize: 10, letterSpacing: 2, color: _grey, fontStyle: FontStyle.italic)),
        TextField(
          controller: _emailController,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(
            hintText: '가입하신 이메일을 입력해주세요',
            hintStyle: TextStyle(fontSize: 13, color: Colors.black26),
            enabledBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
            focusedBorder: UnderlineInputBorder(
                borderSide: BorderSide(color: _gold)),
          ),
          style: const TextStyle(fontSize: 14),
          onSubmitted: (_) => _handleSubmit(),
        ),
        const SizedBox(height: 16),
        const Text(
          '• 입력하신 이메일로 비밀번호 재설정 링크가 전송됩니다.\n• 이메일이 도착하지 않으면 스팸함을 확인해주세요.',
          style: TextStyle(fontSize: 11, color: _grey, height: 1.6, fontStyle: FontStyle.italic),
        ),
        const SizedBox(height: 40),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: _loading ? null : _handleSubmit,
            style: ElevatedButton.styleFrom(
              backgroundColor: _dark,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: const RoundedRectangleBorder(),
            ),
            child: _loading
                ? const SizedBox(
                    height: 18, width: 18,
                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : const Text('재설정 링크 전송',
                    style: TextStyle(letterSpacing: 2, fontSize: 12, color: Colors.white)),
          ),
        ),
        const SizedBox(height: 24),
        Container(
          padding: const EdgeInsets.only(top: 20),
          decoration: const BoxDecoration(
              border: Border(top: BorderSide(color: _gold, width: 0.1))),
          child: Center(
            child: TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('로그인으로 돌아가기',
                  style: TextStyle(
                      fontSize: 10, letterSpacing: 2, color: _grey, fontStyle: FontStyle.italic)),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSuccessState() {
    return Column(
      children: [
        const Icon(Icons.mark_email_read_outlined, size: 52, color: _gold),
        const SizedBox(height: 16),
        const Text('이메일을 전송했습니다',
            style: TextStyle(fontSize: 16, letterSpacing: 2, color: _dark)),
        const SizedBox(height: 12),
        Text(
          '${_emailController.text}\n으로 비밀번호 재설정 링크를 보냈습니다.\n이메일을 확인해주세요.',
          textAlign: TextAlign.center,
          style: const TextStyle(fontSize: 13, color: _grey, height: 1.7),
        ),
        const SizedBox(height: 32),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton(
            onPressed: () => Navigator.pop(context),
            style: OutlinedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 14),
              side: const BorderSide(color: _gold),
              shape: const RoundedRectangleBorder(),
            ),
            child: const Text('로그인으로 돌아가기',
                style: TextStyle(color: _gold, letterSpacing: 2, fontSize: 11)),
          ),
        ),
      ],
    );
  }

  Widget _buildOrnament() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Container(width: 40, height: 1, color: _gold),
        const SizedBox(width: 8),
        const Icon(Icons.auto_awesome, size: 12, color: _gold),
        const SizedBox(width: 8),
        Container(width: 40, height: 1, color: _gold),
      ],
    );
  }

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }
}