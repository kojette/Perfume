import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show debugPrint;
import 'package:image_picker/image_picker.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
        });
      } else {
        // 백엔드 실패 시 로컬
        final prefs = await SharedPreferences.getInstance();
        setState(() {
          _nameController.text = prefs.getString('userName') ?? '';
          _emailController.text = prefs.getString('userEmail') ?? '';
          _phoneController.text = prefs.getString('userPhone') ?? '';
          _gender = prefs.getString('userGender') ?? '';
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
      );

      if (success) {
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString('userName', _nameController.text.trim());
        await prefs.setString('userPhone', _phoneController.text.trim());
        await prefs.setString('userGender', _gender);

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
    // 탈퇴 사유 입력 다이얼로그
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

    // 최종 확인
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

                  // 타이틀
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
    super.dispose();
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