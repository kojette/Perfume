import { useState, useEffect } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, ChevronUp, ChevronDown, X } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const SECTION_TYPES = [
  { value: 'HISTORY', label: '브랜드 연혁 (HISTORY)' },
  { value: 'PROCESS', label: '향수 제조 과정 (PROCESS)' },
  { value: 'PHILOSOPHY', label: '브랜드 철학 (PHILOSOPHY)' },
];

const IMAGE_POSITIONS = [
  { value: 'left', label: '왼쪽' },
  { value: 'right', label: '오른쪽' },
  { value: 'top', label: '위' },
  { value: 'background', label: '배경' },
];

const SECTION_LABELS = {
  HISTORY: '브랜드 연혁',
  PROCESS: '향수 제조 과정',
  PHILOSOPHY: '브랜드 철학',
};

const EMPTY_FORM = {
  sectionType: 'HISTORY',
  sortOrder: 0,
  title: '',
  subtitle: '',
  content: '',
  yearLabel: '',
  imageUrl: '',
  imagePosition: 'right',
  isPublished: true,
};

export default function StoryManagement() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null); // null=create, object=edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [filterSection, setFilterSection] = useState('ALL');

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/stories/admin`);
      const json = await res.json();
      setStories(json.data || []);
    } catch (err) {
      console.error(err);
      alert('스토리 목록을 불러오는 데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (story) => {
    setEditTarget(story);
    setForm({
      sectionType: story.sectionType,
      sortOrder: story.sortOrder,
      title: story.title,
      subtitle: story.subtitle || '',
      content: story.content || '',
      yearLabel: story.yearLabel || '',
      imageUrl: story.imageUrl || '',
      imagePosition: story.imagePosition || 'right',
      isPublished: story.isPublished,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { alert('제목을 입력해주세요.'); return; }
    if (!form.sectionType) { alert('섹션을 선택해주세요.'); return; }

    try {
      setSaving(true);
      const method = editTarget ? 'PUT' : 'POST';
      const url = editTarget
        ? `${API_BASE}/api/stories/${editTarget.storyId}`
        : `${API_BASE}/api/stories`;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sortOrder: Number(form.sortOrder) }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      alert(editTarget ? '수정되었습니다.' : '생성되었습니다.');
      setModalOpen(false);
      fetchStories();
    } catch (err) {
      alert(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (story) => {
    if (!window.confirm(`"${story.title}" 을(를) 삭제하시겠습니까?`)) return;
    try {
      const res = await fetch(`${API_BASE}/api/stories/${story.storyId}`, { method: 'DELETE' });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      alert('삭제되었습니다.');
      fetchStories();
    } catch (err) {
      alert(err.message || '삭제 중 오류가 발생했습니다.');
    }
  };

  const togglePublish = async (story) => {
    try {
      const res = await fetch(`${API_BASE}/api/stories/${story.storyId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isPublished: !story.isPublished }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      fetchStories();
    } catch (err) {
      alert(err.message || '상태 변경 중 오류가 발생했습니다.');
    }
  };

  const filteredStories = filterSection === 'ALL'
    ? stories
    : stories.filter(s => s.sectionType === filterSection);

  const groupedStories = SECTION_TYPES.reduce((acc, s) => {
    acc[s.value] = filteredStories.filter(x => x.sectionType === s.value);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#faf8f3] p-8">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl tracking-[0.3em] text-[#c9a961] mb-1">STORY 관리</h1>
            <p className="text-sm text-[#8b8278] italic">브랜드 스토리 콘텐츠를 관리합니다</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-5 py-3 bg-[#c9a961] text-white hover:bg-[#b89851] transition-colors text-sm tracking-wider"
          >
            <Plus size={16} /> 새 스토리 추가
          </button>
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 mb-8 border-b border-[#c9a961]/20">
          <button
            onClick={() => setFilterSection('ALL')}
            className={`px-5 py-3 text-xs tracking-[0.2em] transition-colors border-b-2 ${
              filterSection === 'ALL' ? 'text-[#c9a961] border-[#c9a961]' : 'text-[#8b8278] border-transparent hover:text-[#c9a961]'
            }`}
          >
            전체 ({stories.length})
          </button>
          {SECTION_TYPES.map(s => (
            <button
              key={s.value}
              onClick={() => setFilterSection(s.value)}
              className={`px-5 py-3 text-xs tracking-[0.2em] transition-colors border-b-2 ${
                filterSection === s.value ? 'text-[#c9a961] border-[#c9a961]' : 'text-[#8b8278] border-transparent hover:text-[#c9a961]'
              }`}
            >
              {SECTION_LABELS[s.value]} ({stories.filter(x => x.sectionType === s.value).length})
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c9a961]" />
          </div>
        ) : (
          <div className="space-y-10">
            {(filterSection === 'ALL' ? SECTION_TYPES : SECTION_TYPES.filter(s => s.value === filterSection)).map(sType => {
              const items = groupedStories[sType.value];
              if (items.length === 0 && filterSection !== 'ALL') {
                return (
                  <div key={sType.value} className="text-center py-16 text-[#8b8278] italic text-sm">
                    등록된 항목이 없습니다
                  </div>
                );
              }
              if (items.length === 0) return null;
              return (
                <div key={sType.value}>
                  <h2 className="text-xs tracking-[0.4em] text-[#c9a961] uppercase mb-4 flex items-center gap-3">
                    <span>{SECTION_LABELS[sType.value]}</span>
                    <div className="flex-1 h-[1px] bg-[#c9a961]/20" />
                  </h2>
                  <div className="space-y-3">
                    {items.map(story => (
                      <div key={story.storyId}
                        className={`flex items-center gap-4 p-4 bg-white border rounded-sm transition-all ${
                          story.isPublished ? 'border-[#c9a961]/20' : 'border-gray-200 opacity-60'
                        }`}>
                        {/* 썸네일 */}
                        <div className="w-14 h-14 flex-shrink-0 bg-[#f0ece4] overflow-hidden">
                          {story.imageUrl ? (
                            <img src={story.imageUrl} alt={story.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#c9a961]/30 text-xl">✦</div>
                          )}
                        </div>

                        {/* 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {story.yearLabel && (
                              <span className="bg-[#c9a961] text-white text-[10px] px-2 py-0.5 tracking-wider">
                                {story.yearLabel}
                              </span>
                            )}
                            <h3 className="text-sm font-medium text-[#2a2620] truncate">{story.title}</h3>
                          </div>
                          {story.subtitle && (
                            <p className="text-xs text-[#c9a961] italic truncate">{story.subtitle}</p>
                          )}
                          {story.content && (
                            <p className="text-xs text-[#8b8278] truncate mt-1">{story.content}</p>
                          )}
                        </div>

                        {/* 정렬 순서 */}
                        <div className="text-xs text-[#8b8278] w-12 text-center flex-shrink-0">
                          순서 {story.sortOrder}
                        </div>

                        {/* 버튼들 */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            onClick={() => togglePublish(story)}
                            className={`p-2 rounded transition-colors ${
                              story.isPublished ? 'text-[#c9a961] hover:text-[#b89851]' : 'text-gray-400 hover:text-gray-600'
                            }`}
                            title={story.isPublished ? '비공개로 변경' : '공개로 변경'}
                          >
                            {story.isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                          </button>
                          <button
                            onClick={() => openEdit(story)}
                            className="p-2 text-[#8b8278] hover:text-[#2a2620] transition-colors"
                            title="수정"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(story)}
                            className="p-2 text-red-300 hover:text-red-500 transition-colors"
                            title="삭제"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {filteredStories.length === 0 && (
              <div className="text-center py-20">
                <p className="text-[#8b8278] italic">등록된 스토리가 없습니다.</p>
                <button onClick={openCreate} className="mt-4 text-sm text-[#c9a961] underline hover:no-underline">
                  첫 스토리 추가하기
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 생성/수정 모달 */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-6 border-b border-[#c9a961]/20">
              <h2 className="font-display text-xl tracking-[0.2em] text-[#c9a961]">
                {editTarget ? 'STORY 수정' : 'STORY 추가'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-[#8b8278] hover:text-[#2a2620]">
                <X size={20} />
              </button>
            </div>

            {/* 모달 폼 */}
            <div className="p-6 space-y-5">
              {/* 섹션 타입 */}
              <div>
                <label className="block text-xs tracking-[0.2em] text-[#8b8278] mb-2 uppercase">섹션 *</label>
                <select
                  value={form.sectionType}
                  onChange={e => setForm({ ...form, sectionType: e.target.value })}
                  className="w-full border border-[#c9a961]/30 px-3 py-2 text-sm text-[#2a2620] bg-[#faf8f3] focus:outline-none focus:border-[#c9a961]"
                >
                  {SECTION_TYPES.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>

              {/* 연도 (히스토리일 때만) */}
              {form.sectionType === 'HISTORY' && (
                <div>
                  <label className="block text-xs tracking-[0.2em] text-[#8b8278] mb-2 uppercase">연도 (예: 1847)</label>
                  <input
                    value={form.yearLabel}
                    onChange={e => setForm({ ...form, yearLabel: e.target.value })}
                    placeholder="연도를 입력하세요"
                    className="w-full border border-[#c9a961]/30 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a961]"
                  />
                </div>
              )}

              {/* 제목 */}
              <div>
                <label className="block text-xs tracking-[0.2em] text-[#8b8278] mb-2 uppercase">제목 *</label>
                <input
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="제목을 입력하세요"
                  className="w-full border border-[#c9a961]/30 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a961]"
                />
              </div>

              {/* 부제목 */}
              <div>
                <label className="block text-xs tracking-[0.2em] text-[#8b8278] mb-2 uppercase">부제목</label>
                <input
                  value={form.subtitle}
                  onChange={e => setForm({ ...form, subtitle: e.target.value })}
                  placeholder="부제목을 입력하세요"
                  className="w-full border border-[#c9a961]/30 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a961]"
                />
              </div>

              {/* 내용 */}
              <div>
                <label className="block text-xs tracking-[0.2em] text-[#8b8278] mb-2 uppercase">내용</label>
                <textarea
                  value={form.content}
                  onChange={e => setForm({ ...form, content: e.target.value })}
                  placeholder="내용을 입력하세요"
                  rows={5}
                  className="w-full border border-[#c9a961]/30 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a961] resize-none"
                />
              </div>

              {/* 이미지 URL */}
              <div>
                <label className="block text-xs tracking-[0.2em] text-[#8b8278] mb-2 uppercase">이미지 URL</label>
                <input
                  value={form.imageUrl}
                  onChange={e => setForm({ ...form, imageUrl: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-[#c9a961]/30 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a961]"
                />
                {form.imageUrl && (
                  <div className="mt-2 w-full h-32 overflow-hidden border border-[#c9a961]/20">
                    <img src={form.imageUrl} alt="미리보기" className="w-full h-full object-cover" onError={e => e.target.style.display='none'} />
                  </div>
                )}
              </div>

              {/* 이미지 위치 */}
              <div>
                <label className="block text-xs tracking-[0.2em] text-[#8b8278] mb-2 uppercase">이미지 위치</label>
                <select
                  value={form.imagePosition}
                  onChange={e => setForm({ ...form, imagePosition: e.target.value })}
                  className="w-full border border-[#c9a961]/30 px-3 py-2 text-sm bg-[#faf8f3] focus:outline-none focus:border-[#c9a961]"
                >
                  {IMAGE_POSITIONS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
              </div>

              {/* 정렬 순서 */}
              <div>
                <label className="block text-xs tracking-[0.2em] text-[#8b8278] mb-2 uppercase">정렬 순서</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm({ ...form, sortOrder: e.target.value })}
                  className="w-full border border-[#c9a961]/30 px-3 py-2 text-sm focus:outline-none focus:border-[#c9a961]"
                />
              </div>

              {/* 공개 여부 */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isPublished"
                  checked={form.isPublished}
                  onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                  className="accent-[#c9a961]"
                />
                <label htmlFor="isPublished" className="text-sm text-[#2a2620]">공개</label>
              </div>
            </div>

            {/* 모달 푸터 */}
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-[#c9a961]/20">
              <button
                onClick={() => setModalOpen(false)}
                className="px-5 py-2 text-sm text-[#8b8278] border border-[#8b8278]/30 hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-6 py-2 text-sm bg-[#c9a961] text-white hover:bg-[#b89851] transition-colors disabled:opacity-50"
              >
                {saving ? '저장 중...' : (editTarget ? '수정 저장' : '추가')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}