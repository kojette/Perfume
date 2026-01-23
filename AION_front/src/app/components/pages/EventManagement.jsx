import React, { useState, useEffect } from 'react';
import { Ornament } from '../Ornament';
import { Plus, Edit2, Trash2, Gift, Percent, Users } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const EventManagement = () => {
  const [events, setEvents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: 'COUPON',
    start_date: '',
    end_date: '',
    discount_rate: 0,
    coupon_code: '',
    point_amount: 0,
    max_participants: null,
    priority_buyers: false,
    win_probability: 100
  });

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('Events')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('이벤트 로드 에러:', error);
    } else {
      setEvents(data);
    }
  };

  const handleSave = async () => {
    if (!formData.title || !formData.event_type) {
      alert('제목과 이벤트 유형을 입력해주세요.');
      return;
    }

    // 쿠폰 이벤트인 경우 쿠폰 코드 필수 체크
    if (formData.event_type === 'COUPON' && !formData.coupon_code) {
      alert('쿠폰 코드를 입력해주세요.');
      return;
    }

    try {
      if (editingId) {
        const { error } = await supabase
          .from('Events')
          .update(formData)
          .eq('id', editingId);
        
        if (error) throw error;
        alert('이벤트가 수정되었습니다.');
      } else {
        // 이벤트 생성 (쿠폰은 수동으로 Coupon Management에서 생성 필요)
        const { error } = await supabase
          .from('Events')
          .insert([formData]);
        
        if (error) throw error;
        
        // 쿠폰 이벤트인 경우 안내 메시지
        if (formData.event_type === 'COUPON') {
          alert(`이벤트가 생성되었습니다.\n\n⚠️ 중요: 쿠폰 관리 페이지(/admin/coupons)에서 \n쿠폰 코드 "${formData.coupon_code}"를 생성해주세요!`);
        } else {
          alert('이벤트가 생성되었습니다.');
        }
      }
      
      resetForm();
      fetchEvents();
    } catch (error) {
      console.error('저장 에러:', error);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return;

    const { error } = await supabase
      .from('Events')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('삭제 에러:', error);
    } else {
      alert('삭제되었습니다.');
      fetchEvents();
    }
  };

  const handleEdit = (event) => {
    setEditingId(event.id);
    setFormData({
      title: event.title,
      description: event.description,
      event_type: event.event_type,
      start_date: event.start_date || '',
      end_date: event.end_date || '',
      discount_rate: event.discount_rate || 0,
      coupon_code: event.coupon_code || '',
      point_amount: event.point_amount || 0,
      max_participants: event.max_participants,
      priority_buyers: event.priority_buyers,
      win_probability: event.win_probability || 100
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      event_type: 'COUPON',
      start_date: '',
      end_date: '',
      discount_rate: 0,
      coupon_code: '',
      point_amount: 0,
      max_participants: null,
      priority_buyers: false,
      win_probability: 100
    });
    setEditingId(null);
    setShowForm(false);
  };

  const getEventTypeLabel = (type) => {
    const types = {
      COUPON: '쿠폰 발행',
      DISCOUNT: '상품 할인',
      POINT: '포인트 지급'
    };
    return types[type] || type;
  };

  const getEventTypeColor = (type) => {
    const colors = {
      COUPON: 'bg-blue-500',
      DISCOUNT: 'bg-red-500',
      POINT: 'bg-green-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">
            ADMIN PANEL
          </div>
          <Ornament className="mb-6" />
          <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-4">
            이벤트 관리
          </h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="px-6 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all flex items-center gap-2 mx-auto"
          >
            <Plus size={16} />
            새 이벤트 생성
          </button>
        </div>

        {showForm && (
          <div className="bg-white p-8 rounded-lg border border-[#c9a961]/20 mb-8 shadow-sm">
            <h3 className="text-lg font-semibold text-[#2a2620] mb-6">
              {editingId ? '이벤트 수정' : '새 이벤트 생성'}
            </h3>
            
            <div className="space-y-6">
              <div>
                <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">이벤트 제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                  placeholder="예: 신규 회원 환영 이벤트"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">이벤트 설명</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full border border-[#c9a961]/30 rounded px-4 py-3 text-sm focus:border-[#c9a961] outline-none h-32 resize-none"
                  placeholder="이벤트 상세 설명을 입력하세요"
                />
              </div>

              <div>
                <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">이벤트 유형</label>
                <select
                  value={formData.event_type}
                  onChange={(e) => setFormData({...formData, event_type: e.target.value})}
                  className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none bg-white"
                >
                  <option value="COUPON">쿠폰 발행</option>
                  <option value="DISCOUNT">상품 할인</option>
                  <option value="POINT">포인트 지급</option>
                </select>
              </div>

              {formData.event_type === 'COUPON' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">쿠폰 코드 *</label>
                    <input
                      type="text"
                      value={formData.coupon_code}
                      onChange={(e) => setFormData({...formData, coupon_code: e.target.value.toUpperCase()})}
                      className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                      placeholder="예: WELCOME2026"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">할인율 (%)</label>
                    <input
                      type="number"
                      value={formData.discount_rate}
                      onChange={(e) => setFormData({...formData, discount_rate: Number(e.target.value)})}
                      className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              )}

              {formData.event_type === 'DISCOUNT' && (
                <div>
                  <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">할인율 (%)</label>
                  <input
                    type="number"
                    value={formData.discount_rate}
                    onChange={(e) => setFormData({...formData, discount_rate: Number(e.target.value)})}
                    className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                    min="0"
                    max="100"
                  />
                </div>
              )}

              {formData.event_type === 'POINT' && (
                <div>
                  <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">포인트 지급액</label>
                  <input
                    type="number"
                    value={formData.point_amount}
                    onChange={(e) => setFormData({...formData, point_amount: Number(e.target.value)})}
                    className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                    min="0"
                  />
                </div>
              )}

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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">최대 참여 인원</label>
                  <input
                    type="number"
                    value={formData.max_participants || ''}
                    onChange={(e) => setFormData({...formData, max_participants: e.target.value ? Number(e.target.value) : null})}
                    className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                    placeholder="무제한은 비워두세요"
                    min="1"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#8b8278] mb-2 tracking-wider">당첨 확률 (%)</label>
                  <input
                    type="number"
                    value={formData.win_probability}
                    onChange={(e) => setFormData({...formData, win_probability: Number(e.target.value)})}
                    className="w-full border border-[#c9a961]/30 rounded px-4 py-2 text-sm focus:border-[#c9a961] outline-none"
                    min="0"
                    max="100"
                  />
                </div>
              </div>

              <div>
                <label className="flex items-center gap-2 text-sm text-[#555] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.priority_buyers}
                    onChange={(e) => setFormData({...formData, priority_buyers: e.target.checked})}
                    className="w-4 h-4"
                  />
                  구매 이력 있는 고객 우선
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-[#c9a961] text-white text-xs tracking-[0.3em] hover:bg-[#b89851] transition-all"
                >
                  {editingId ? '수정 완료' : '생성 완료'}
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

        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-white p-6 rounded-lg border border-[#c9a961]/20 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`px-3 py-1 ${getEventTypeColor(event.event_type)} text-white text-[9px] rounded flex items-center gap-1`}>
                      <Gift size={10} />
                      {getEventTypeLabel(event.event_type)}
                    </span>
                    {event.priority_buyers && (
                      <span className="px-2 py-1 bg-purple-500 text-white text-[9px] rounded flex items-center gap-1">
                        <Users size={10} />
                        구매자 우선
                      </span>
                    )}
                    {event.win_probability < 100 && (
                      <span className="px-2 py-1 bg-orange-500 text-white text-[9px] rounded flex items-center gap-1">
                        <Percent size={10} />
                        {event.win_probability}% 확률
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-[#2a2620] mb-2">
                    {event.title}
                  </h3>
                  <p className="text-sm text-[#555] mb-3">
                    {event.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-[#8b8278]">
                    <span>기간: {event.start_date} ~ {event.end_date}</span>
                    {event.max_participants && (
                      <span>최대 {event.max_participants}명</span>
                    )}
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(event)}
                    className="p-2 text-[#c9a961] hover:bg-[#faf8f3] rounded transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(event.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {events.length === 0 && (
            <div className="text-center py-20 text-[#8b8278]">
              <p className="text-sm italic">등록된 이벤트가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventManagement;