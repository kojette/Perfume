import React, { useState, useEffect } from 'react';
import { Ornament } from '../Ornament';
import { Plus, Edit2, Trash2, Pin, AlertCircle, Calendar } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const AnnouncementManagement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    start_date: '',
    end_date: '',
    is_pinned: false,
    is_important: false,
    linked_event_id: null
  });

  // 공지사항 목록 불러오기
  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    const { data, error } = await supabase
      .from('Announcements')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('공지사항 로드 에러:', error);
    } else {
      setAnnouncements(data);
    }
  };

  // 공지사항 저장
  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      alert('제목과 내용을 입력해주세요.');
      return;
    }

    try {
      if (editingId) {
        // 수정
        const { error } = await supabase
          .from('Announcements')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        alert('공지사항이 수정되었습니다.');
      } else {
        // 신규 작성
        const { error } = await supabase
          .from('Announcements')
          .insert([formData]);
        
        if (error) throw error;
        alert('공지사항이 작성되었습니다.');
      }
      
      resetForm();
      fetchAnnouncements();
    } catch (error) {
      console.error('저장 에러:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  // 공지사항 삭제
  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('Announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('삭제 에러:', error);
      alert('삭제 중 오류가 발생했습니다.');
    } else {
      alert('삭제되었습니다.');
      fetchAnnouncements();
    }
  };

  // 수정 시작
  const handleEdit = (announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      start_date: announcement.start_date || '',
      end_date: announcement.end_date || '',
      is_pinned: announcement.is_pinned,
      is_important: announcement.is_important,
      linked_event_id: announcement.linked_event_id
    });
    setShowForm(true);
  };

  // 폼 리셋
  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      start_date: '',
      end_date: '',
      is_pinned: false,
      is_important: false,
      linked_event_id: null
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            ADMIN PANEL
          </div>
          <Ornament className="mb-6" />
          <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-4">
            공지사항 관리
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all flex items-center gap-2 mx-auto"
          >
            <Plus size={16} />
            새 공지사항 작성
          </button>
        </div>

        {/* 작성 폼 */}
        {showForm && (
          <div className="bg-white p-8 rounded-lg border border-[#c9a961]/20 mb-8 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2620] mb-6">
              {editingId ? '공지사항 수정' : '새 공지사항 작성'}
            </h3>
            
            <div className="space-y-6">
              {/* 제목 */}
              <div>
                <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                  placeholder="공지사항 제목을 입력하세요"
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  className="w-full border border-[#c9a961]/30 rounded px-4 py-3 text-sm focus:border-[#c9a961] outline-none h-40 resize-none"
                  placeholder="공지사항 내용을 입력하세요"
                />
              </div>

              {/* 노출 기간 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">시작일</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                    className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">종료일</label>
                  <input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                    className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                  />
                </div>
              </div>

              {/* 옵션 */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm text-[#555] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e) => setFormData({...formData, is_pinned: e.target.checked})}
                    className="w-4 h-4"
                  />
                  상단 고정
                </label>
                <label className="flex items-center gap-2 text-sm text-[#555] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_important}
                    onChange={(e) => setFormData({...formData, is_important: e.target.checked})}
                    className="w-4 h-4"
                  />
                  중요 공지
                </label>
              </div>

              {/* 버튼 */}
              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all"
                >
                  {editingId ? '수정 완료' : '작성 완료'}
                </button>
                <button
                  onClick={resetForm}
                  className="flex-1 py-3 border border-[#c9a961] text-[#c9a961] text-xs tracking-[0.3em] hover:bg-[#faf8f3] transition-all"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 공지사항 목록 */}
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <div
              key={announcement.id}
              className="bg-white p-6 rounded-lg border border-[#c9a961]/20 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.is_pinned && (
                      <span className="px-2 py-1 bg-[#c9a961] text-white text-[9px] rounded flex items-center gap-1">
                        <Pin size={10} />
                        고정
                      </span>
                    )}
                    {announcement.is_important && (
                      <span className="px-2 py-1 bg-red-500 text-white text-[9px] rounded flex items-center gap-1">
                        <AlertCircle size={10} />
                        중요
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#2a2620] mb-2">
                    {announcement.title}
                  </h3>
                  <p className="text-sm text-[#555] mb-3 line-clamp-2">
                    {announcement.content}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[#8b8278]">
                    <span className="flex items-center gap-1">
                      <Calendar size={12} />
                      {announcement.start_date || '상시'} ~ {announcement.end_date || '상시'}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="p-2 text-[#c9a961] hover:bg-[#faf8f3] rounded transition-all"
                    title="수정"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                    title="삭제"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {announcements.length === 0 && (
            <div className="text-center py-20 text-[#8b8278]">
              <p className="text-sm italic">등록된 공지사항이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnnouncementManagement;
