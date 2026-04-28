import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb, debugPrint;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../services/api_service.dart' hide debugPrint;
import 'start_screen.dart';

class ProfileEditScreen extends StatefulWidget {
  const ProfileEditScreen({super.key});

  @override
  State<ProfileEditScreen> createState() => _ProfileEditScreenState();
}

class _ProfileEditScreenState extends State<ProfileEditScreen> {
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _nicknameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _zipcodeController = TextEditingController();
  final _addressController = TextEditingController();
  final _addressDetailController = TextEditingController();

  String _gender = '';
  bool _loading = true;
  bool _saving = false;
  File? _profileImageFile;
  String? _profileImageUrl;

  static const _gold = Color(0xFFC9A961);
  static const _dark = Color(0xFF2A2620);
  static const _bg = Color(0xFFFAF8F3);
  static const _grey = Color(0xFF8B8278);

  @override
  void initState() {
    super.initState();
    _loadProfile();
  }

  Future<void> _loadProfile() async {
    setState(() => _loading = true);
    try {
      final profile = await ApiService.getProfile();
      if (profile != null && mounted) {
        setState(() {
          _nameController.text = profile['name'] as String? ?? '';
          _emailController.text = profile['email'] as String? ?? '';
          _nicknameController.text = profile['nickname'] as String? ?? '';
          _phoneController.text = profile['phone'] as String? ?? '';
          _gender = profile['gender'] as String? ?? '';
          _profileImageUrl = profile['profileImage'] as String?;
          // ✅ 주소 필드 로드
          _zipcodeController.text = profile['zipcode'] as String? ?? '';
          _addressController.text = profile['address'] as String? ?? '';
          _addressDetailController.text = profile['addressDetail'] as String? ?? '';
        });
      } else {
        // 백엔드 실패 시 로컬
        final prefs = await SharedPreferences.getInstance();
        setState(() {
          _nameController.text = prefs.getString('userName') ?? '';
          _emailController.text = prefs.getString('userEmail') ?? '';
          _phoneController.text = prefs.getString('userPhone') ?? '';
          _gender = prefs.getString('userGender') ?? '';
          _zipcodeController.text = prefs.getString('userZipcode') ?? '';
          _addressController.text = prefs.getString('userAddress') ?? '';
          _addressDetailController.text = prefs.getString('userAddressDetail') ?? '';
        });
      }
    } catch (e) {
      debugPrint('프로필 로드 오류: $e');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final picked = await picker.pickImage(source: ImageSource.gallery, imageQuality: 80);
    if (picked != null && mounted) {
      setState(() => _profileImageFile = File(picked.path));
    }
  }

  // ✅ 다음 우편번호 검색 - Web/Mobile 분기 처리
  Future<void> _openAddressSearch() async {
    if (kIsWeb) {
      // 웹 환경: web/index.html의 JS 함수로 팝업 열기
      // web/index.html에 _setupKakaoAddressListener() 함수가 있어야 함
      _showWebAddressGuide();
    } else {
      // 모바일 환경: 기존 WebView 방식 유지
      final result = await Navigator.push<Map<String, String>>(
        context,
        MaterialPageRoute(
          builder: (_) => const _DaumPostcodeScreen(),
          fullscreenDialog: true,
        ),
      );

      if (result != null && mounted) {
        setState(() {
          _zipcodeController.text = result['zonecode'] ?? '';
          _addressController.text = result['address'] ?? '';
          _addressDetailController.text = '';
        });
        FocusScope.of(context).requestFocus(FocusNode());
        Future.delayed(const Duration(milliseconds: 100), () {
          _addressDetailController.selection = TextSelection.fromPosition(
            TextPosition(offset: _addressDetailController.text.length),
          );
        });
      }
    }
  }

  // 웹에서 주소검색 안내 (Flutter Web에서 WebView 불가 안내 + 직접 입력 유도)
  void _showWebAddressGuide() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        title: const Text('주소 검색', style: TextStyle(fontSize: 15)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              '웹 브라우저에서는 주소 검색 창을 직접 입력해주세요.\n\n우편번호와 주소를 아래 필드에 직접 입력하시면 됩니다.',
              style: TextStyle(fontSize: 13),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // 우편번호/주소 필드 직접 편집 가능하게 전환
              setState(() {
                _zipcodeController.text = '';
                _addressController.text = '';
              });
            },
            child: const Text('직접 입력', style: TextStyle(color: _gold)),
          ),
        ],
      ),
    );
  }

  Future<void> _handleSave() async {
    if (_nameController.text.trim().isEmpty) {
      _showAlert('이름을 입력해주세요.');
      return;
    }
    if (_phoneController.text.trim().isEmpty) {
      _showAlert('전화번호를 입력해주세요.');
      return;
    }
    if (_gender.isEmpty) {
      _showAlert('성별을 선택해주세요.');
      return;
    }

    setState(() => _saving = true);
    try {
      final success = await ApiService.updateProfile(
        name: _nameController.text.trim(),
        nickname: _nicknameController.text.trim().isEmpty ? null : _nicknameController.text.trim(),
        phone: _phoneController.text.trim(),
        gender: _gender,
        profileImageFile: _profileImageFile,
        // ✅ 주소 필드 추가
        zipcode: _zipcodeController.text.trim().isEmpty ? null : _zipcodeController.text.trim(),
        address: _addressController.text.trim().isEmpty ? null : _addressController.text.trim(),
        addressDetail: _addressDetailController.text.trim().isEmpty ? null : _addressDetailController.text.trim(),
      );

      if (success) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('userName', _nameController.text.trim());
        await prefs.setString('userPhone', _phoneController.text.trim());
        await prefs.setString('userGender', _gender);
        // ✅ 주소 로컬 저장
        await prefs.setString('userZipcode', _zipcodeController.text.trim());
        await prefs.setString('userAddress', _addressController.text.trim());
        await prefs.setString('userAddressDetail', _addressDetailController.text.trim());

        _showAlert('회원 정보가 수정되었습니다.', () {
          Navigator.pop(context);
        });
      } else {
        _showAlert('정보 수정 중 오류가 발생했습니다.');
      }
    } catch (e) {
      _showAlert('오류: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _handleDeleteAccount() async {
    String reason = '';
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => _ReasonDialog(
        onSubmit: (r) { reason = r; },
      ),
    );
    if (confirmed != true || reason.trim().length < 2) {
      if (confirmed == true) _showAlert('탈퇴 사유를 2자 이상 입력해주세요.');
      return;
    }

    final finalConfirm = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('회원 탈퇴', style: TextStyle(fontSize: 15)),
        content: const Text(
          '정말 계정을 삭제하시겠습니까?\n삭제 후 30일 내 재가입이 제한될 수 있습니다.',
          style: TextStyle(fontSize: 13),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('취소', style: TextStyle(color: Colors.grey)),
          ),
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('탈퇴', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );

    if (finalConfirm != true) return;

    try {
      final success = await ApiService.deleteAccount(reason: reason);
      if (success && mounted) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.clear();
        _showAlert('그동안 이용해 주셔서 감사합니다. 회원 탈퇴가 완료되었습니다.', () {
          Navigator.pushAndRemoveUntil(
            context,
            MaterialPageRoute(builder: (_) => const StartScreen()),
            (_) => false,
          );
        });
      } else {
        _showAlert('탈퇴 처리 중 오류가 발생했습니다.');
      }
    } catch (e) {
      _showAlert('오류: $e');
    }
  }

  void _showAlert(String message, [VoidCallback? onConfirm]) {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        content: Text(message, style: const TextStyle(fontSize: 13)),
        actions: [
          TextButton(
            onPressed: () { Navigator.pop(context); onConfirm?.call(); },
            child: const Text('확인', style: TextStyle(color: _gold)),
          ),
        ],
      ),
    );
  }

  // ─── UI ─────────────────────────────────────────────────────

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: _bg,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: _dark),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator(color: _gold))
          : SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  const SizedBox(height: 10),

                  const Text(
                    'Profile Account',
                    style: TextStyle(color: _gold, fontSize: 10, letterSpacing: 4, fontStyle: FontStyle.italic),
                  ),
                  const SizedBox(height: 16),
                  _buildOrnament(),
                  const SizedBox(height: 12),
                  const Text(
                    '회원 정보 수정',
                    style: TextStyle(fontSize: 22, letterSpacing: 2, color: _dark),
                  ),
                  const SizedBox(height: 36),

                  // 프로필 사진
                  GestureDetector(
                    onTap: _pickImage,
                    child: Stack(
                      children: [
                        Container(
                          width: 90, height: 90,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(color: _gold.withOpacity(0.4)),
                            color: _bg,
                          ),
                          clipBehavior: Clip.antiAlias,
                          child: _profileImageFile != null
                              ? Image.file(_profileImageFile!, fit: BoxFit.cover)
                              : (_profileImageUrl != null && _profileImageUrl!.isNotEmpty
                                  ? Image.network(_profileImageUrl!, fit: BoxFit.cover,
                                      errorBuilder: (_, __, ___) => _initialIcon())
                                  : _initialIcon()),
                        ),
                        Positioned(
                          bottom: 0, right: 0,
                          child: Container(
                            width: 28, height: 28,
                            decoration: const BoxDecoration(
                              color: _dark, shape: BoxShape.circle,
                            ),
                            child: const Icon(Icons.add, color: Colors.white, size: 16),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 6),
                  const Text('Change Photo',
                      style: TextStyle(fontSize: 9, color: _gold, letterSpacing: 2, fontWeight: FontWeight.bold)),
                  const SizedBox(height: 36),

                  // 폼 카드
                  Container(
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: _gold.withOpacity(0.2)),
                    ),
                    child: Column(
                      children: [
                        // 이메일 (읽기 전용)
                        _buildField(
                          label: 'EMAIL ADDRESS (UNALTERABLE)',
                          controller: _emailController,
                          enabled: false,
                          hint: '이메일',
                        ),
                        const SizedBox(height: 4),
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '* 이메일은 변경할 수 없습니다.',
                            style: TextStyle(fontSize: 9, color: _gold, fontStyle: FontStyle.italic),
                          ),
                        ),
                        const SizedBox(height: 24),

                        // 이름
                        _buildField(label: 'NAME', controller: _nameController, hint: '이름'),
                        const SizedBox(height: 24),

                        // 닉네임
                        _buildField(label: 'NICKNAME', controller: _nicknameController, hint: '닉네임 (선택)'),
                        const SizedBox(height: 24),

                        // 전화번호
                        _buildField(
                          label: 'PHONE NUMBER',
                          controller: _phoneController,
                          hint: '전화번호 (- 제외)',
                          keyboardType: TextInputType.phone,
                        ),
                        const SizedBox(height: 24),

                        // 성별
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('GENDER',
                                style: TextStyle(fontSize: 10, letterSpacing: 2, color: _grey)),
                            DropdownButtonFormField<String>(
                              value: _gender.isEmpty ? null : _gender,
                              decoration: const InputDecoration(
                                hintText: '성별 선택',
                                hintStyle: TextStyle(fontSize: 13, color: Colors.black26),
                                enabledBorder: UnderlineInputBorder(
                                    borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
                                focusedBorder: UnderlineInputBorder(
                                    borderSide: BorderSide(color: _gold)),
                              ),
                              items: const [
                                DropdownMenuItem(value: 'MALE', child: Text('남성', style: TextStyle(fontSize: 13))),
                                DropdownMenuItem(value: 'FEMALE', child: Text('여성', style: TextStyle(fontSize: 13))),
                              ],
                              onChanged: (v) => setState(() => _gender = v ?? ''),
                            ),
                          ],
                        ),

                        const SizedBox(height: 36),

                        // ✅ 배송지 섹션 구분선
                        Row(
                          children: [
                            const Expanded(child: Divider(color: Color(0xFFC9A961), thickness: 0.3)),
                            Padding(
                              padding: const EdgeInsets.symmetric(horizontal: 12),
                              child: Text(
                                'SHIPPING ADDRESS',
                                style: TextStyle(
                                  fontSize: 9,
                                  letterSpacing: 3,
                                  color: _gold.withOpacity(0.8),
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            const Expanded(child: Divider(color: Color(0xFFC9A961), thickness: 0.3)),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // ✅ 우편번호 + 검색 버튼
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('POSTAL CODE',
                                style: TextStyle(fontSize: 10, letterSpacing: 2, color: _grey)),
                            const SizedBox(height: 4),
                            Row(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Expanded(
                                  child: TextField(
                                    controller: _zipcodeController,
                                    enabled: kIsWeb ? true : false,
                                    decoration: const InputDecoration(
                                      hintText: '우편번호',
                                      hintStyle: TextStyle(fontSize: 13, color: Colors.black26),
                                      disabledBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
                                      enabledBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
                                      focusedBorder: UnderlineInputBorder(
                                          borderSide: BorderSide(color: _gold)),
                                    ),
                                    style: const TextStyle(fontSize: 14, color: _grey),
                                  ),
                                ),
                                const SizedBox(width: 10),
                                SizedBox(
                                  height: 40,
                                  child: ElevatedButton(
                                    onPressed: _openAddressSearch,
                                    style: ElevatedButton.styleFrom(
                                      backgroundColor: _dark,
                                      padding: const EdgeInsets.symmetric(horizontal: 14),
                                      shape: const RoundedRectangleBorder(),
                                      elevation: 0,
                                    ),
                                    child: const Text(
                                      '주소 검색',
                                      style: TextStyle(fontSize: 11, color: Colors.white, letterSpacing: 1),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // ✅ 기본주소 (자동 입력, 읽기 전용)
                        Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('ADDRESS',
                                style: TextStyle(fontSize: 10, letterSpacing: 2, color: _grey)),
                            TextField(
                              controller: _addressController,
                              enabled: kIsWeb ? true : false,
                              decoration: const InputDecoration(
                                hintText: '주소 검색 후 자동 입력됩니다',
                                hintStyle: TextStyle(fontSize: 13, color: Colors.black26),
                                disabledBorder: UnderlineInputBorder(
                                    borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
                                enabledBorder: UnderlineInputBorder(
                                    borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
                                focusedBorder: UnderlineInputBorder(
                                    borderSide: BorderSide(color: _gold)),
                              ),
                              style: TextStyle(fontSize: 14, color: kIsWeb ? _dark : _grey),
                            ),
                          ],
                        ),
                        const SizedBox(height: 20),

                        // ✅ 상세주소 (직접 입력)
                        _buildField(
                          label: 'ADDRESS DETAIL',
                          controller: _addressDetailController,
                          hint: '상세주소를 입력해주세요 (동/호수 등)',
                        ),

                        const SizedBox(height: 8),
                        const Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            '* 저장된 주소는 주문 시 배송지로 자동 사용됩니다.',
                            style: TextStyle(fontSize: 9, color: _grey, fontStyle: FontStyle.italic),
                          ),
                        ),

                        const SizedBox(height: 36),

                        // 저장 버튼
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            onPressed: _saving ? null : _handleSave,
                            style: ElevatedButton.styleFrom(
                              backgroundColor: _dark,
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              shape: const RoundedRectangleBorder(),
                            ),
                            child: _saving
                                ? const SizedBox(
                                    height: 18, width: 18,
                                    child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                                  )
                                : const Text('SAVE',
                                    style: TextStyle(letterSpacing: 3, fontSize: 12, color: Colors.white)),
                          ),
                        ),
                        const SizedBox(height: 12),

                        // 취소 버튼
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton(
                            onPressed: () => Navigator.pop(context),
                            style: OutlinedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(vertical: 16),
                              side: const BorderSide(color: Color(0xFFC9A961), width: 0.5),
                              shape: const RoundedRectangleBorder(),
                            ),
                            child: const Text('CANCEL',
                                style: TextStyle(letterSpacing: 3, fontSize: 12, color: _grey)),
                          ),
                        ),
                      ],
                    ),
                  ),

                  const SizedBox(height: 20),

                  // 회원 탈퇴
                  TextButton(
                    onPressed: _handleDeleteAccount,
                    child: const Text(
                      'DELETE ACCOUNT',
                      style: TextStyle(
                        fontSize: 10, color: Colors.grey, letterSpacing: 2,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                  const SizedBox(height: 40),
                ],
              ),
            ),
    );
  }

  Widget _buildField({
    required String label,
    required TextEditingController controller,
    String? hint,
    bool enabled = true,
    TextInputType keyboardType = TextInputType.text,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(fontSize: 10, letterSpacing: 2, color: _grey)),
        TextField(
          controller: controller,
          enabled: enabled,
          keyboardType: keyboardType,
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: const TextStyle(fontSize: 13, color: Colors.black26),
            enabledBorder: const UnderlineInputBorder(
                borderSide: BorderSide(color: Color(0xFFC9A964), width: 0.5)),
            focusedBorder: const UnderlineInputBorder(
                borderSide: BorderSide(color: _gold)),
            disabledBorder: const UnderlineInputBorder(
                borderSide: BorderSide(color: Colors.grey, width: 0.3)),
          ),
          style: TextStyle(fontSize: 14, color: enabled ? _dark : Colors.grey),
        ),
      ],
    );
  }

  Widget _initialIcon() {
    return Center(
      child: Text(
        _nameController.text.isNotEmpty ? _nameController.text[0] : 'U',
        style: const TextStyle(fontSize: 28, color: _gold),
      ),
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
    _nameController.dispose();
    _emailController.dispose();
    _nicknameController.dispose();
    _phoneController.dispose();
    _zipcodeController.dispose();
    _addressController.dispose();
    _addressDetailController.dispose();
    super.dispose();
  }
}

// ─── ✅ 다음 우편번호 WebView 화면 ──────────────────────────────────

class _DaumPostcodeScreen extends StatefulWidget {
  const _DaumPostcodeScreen();

  @override
  State<_DaumPostcodeScreen> createState() => _DaumPostcodeScreenState();
}

class _DaumPostcodeScreenState extends State<_DaumPostcodeScreen> {
  late final WebViewController _controller;
  bool _isLoading = true;

  // 다음 우편번호 팝업 HTML
  static const String _postcodeHtml = '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #faf8f3; }
    #wrap { width: 100%; height: 100vh; }
  </style>
</head>
<body>
  <div id="wrap"></div>
  <script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
  <script>
    new daum.Postcode({
      oncomplete: function(data) {
        var address = data.roadAddress || data.jibunAddress;
        var result = JSON.stringify({
          zonecode: data.zonecode,
          address: address
        });
        // Flutter로 결과 전달
        if (window.FlutterChannel) {
          window.FlutterChannel.postMessage(result);
        }
      },
      width: '100%',
      height: '100%',
    }).embed(document.getElementById('wrap'));
  </script>
</body>
</html>
''';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'FlutterChannel',
        onMessageReceived: (JavaScriptMessage message) {
          // JSON 파싱 후 결과 반환
          try {
            final data = _parseJson(message.message);
            if (mounted) Navigator.pop(context, data);
          } catch (e) {
            debugPrint('우편번호 파싱 오류: $e');
          }
        },
      )
      ..setNavigationDelegate(NavigationDelegate(
        onPageFinished: (_) {
          if (mounted) setState(() => _isLoading = false);
        },
      ))
      ..loadHtmlString(_postcodeHtml);
  }

  Map<String, String> _parseJson(String json) {
    // 간단한 JSON 파싱 (jsonDecode 대신 직접 파싱)
    final zonecodeMatch = RegExp(r'"zonecode"\s*:\s*"([^"]*)"').firstMatch(json);
    final addressMatch = RegExp(r'"address"\s*:\s*"([^"]*)"').firstMatch(json);
    return {
      'zonecode': zonecodeMatch?.group(1) ?? '',
      'address': addressMatch?.group(1) ?? '',
    };
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFFAF8F3),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0.5,
        leading: IconButton(
          icon: const Icon(Icons.close, color: Color(0xFF2A2620)),
          onPressed: () => Navigator.pop(context),
        ),
        title: const Text(
          '주소 검색',
          style: TextStyle(
            fontSize: 14,
            color: Color(0xFF2A2620),
            letterSpacing: 2,
          ),
        ),
        centerTitle: true,
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: _controller),
          if (_isLoading)
            const Center(
              child: CircularProgressIndicator(color: Color(0xFFC9A961)),
            ),
        ],
      ),
    );
  }
}

// ─── 탈퇴 사유 입력 다이얼로그 ──────────────────────────────────

class _ReasonDialog extends StatefulWidget {
  final ValueChanged<String> onSubmit;
  const _ReasonDialog({required this.onSubmit});

  @override
  State<_ReasonDialog> createState() => _ReasonDialogState();
}

class _ReasonDialogState extends State<_ReasonDialog> {
  final _controller = TextEditingController();

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('탈퇴 사유', style: TextStyle(fontSize: 15)),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text(
            '탈퇴 사유를 입력해 주세요.\n(예: 서비스 불만족, 개인정보 보호, 장기간 미사용)',
            style: TextStyle(fontSize: 12, color: Color(0xFF8B8278)),
          ),
          const SizedBox(height: 12),
          TextField(
            controller: _controller,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: '2자 이상 입력해 주세요.',
              hintStyle: TextStyle(fontSize: 12),
              border: OutlineInputBorder(),
              contentPadding: EdgeInsets.all(12),
            ),
            style: const TextStyle(fontSize: 13),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('취소', style: TextStyle(color: Colors.grey)),
        ),
        TextButton(
          onPressed: () {
            widget.onSubmit(_controller.text);
            Navigator.pop(context, true);
          },
          child: const Text('확인', style: TextStyle(color: Color(0xFFC9A961))),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
}