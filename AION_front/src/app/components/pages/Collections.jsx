/**
 * Collections.jsx
 * - 관리자 판별: sessionStorage 기반 (AdminRoute와 동일)
 * - 컬렉션 CRUD: Java 백엔드 API
 * - 향수·브랜드·태그 마스터: Supabase 읽기 전용
 * - 이미지: URL 입력 + 드래그드롭 업로드 (Supabase Storage)
 * - 문구: 선택사항, 이미지와 동일한 5초 슬라이드
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Plus, X, Search, Check, ChevronUp, ChevronDown,
  Star, Save, Eye, Filter, Edit2, Trash2,
  Calendar, Clock, Upload, Link,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ─────────────────────────────────────────────────────────────
// 유틸리티
// ─────────────────────────────────────────────────────────────
const FONT_SIZE_CLASS = {
  small:  'text-sm md:text-base',
  medium: 'text-lg md:text-xl',
  large:  'text-2xl md:text-3xl',
  xlarge: 'text-3xl md:text-5xl',
};
const FONT_WEIGHT_CLASS = {
  light:  'font-light',
  normal: 'font-normal',
  medium: 'font-medium',
  bold:   'font-bold',
};

const fmtKRW = (n) => n != null ? `₩${Number(n).toLocaleString()}` : '-';

// ★ 수정: Jackson이 LocalDateTime을 배열로 직렬화하는 경우 대비
const fmtDatetimeLocal = (iso) => {
  if (!iso) return '';
  // Jackson write-dates-as-timestamps: true 일 때 배열로 올 수 있음
  // ex) [2026, 3, 15, 14, 30, 0] → "2026-03-15T14:30"
  if (Array.isArray(iso)) {
    const [y, mo, d, h = 0, mi = 0] = iso;
    return `${y}-${String(mo).padStart(2, '0')}-${String(d).padStart(2, '0')}T${String(h).padStart(2, '0')}:${String(mi).padStart(2, '0')}`;
  }
  // ISO 문자열로 올 때: "2026-03-15T14:30:00" → "2026-03-15T14:30"
  return iso.slice(0, 16);
};

// datetime-local 값 → ISO 8601 문자열 (백엔드 LocalDateTime 파싱용)
// ex) "2026-03-15T14:30" → "2026-03-15T14:30:00"
const localToISO = (local) => {
  if (!local) return null;
  // datetime-local은 초가 없으므로 :00 추가
  return local.length === 16 ? local + ':00' : local;
};

// ─────────────────────────────────────────────────────────────
// 관리자 판별: AdminRoute와 동일
// ─────────────────────────────────────────────────────────────
const checkIsAdmin = () =>
  sessionStorage.getItem('isAdmin') === 'true' &&
  sessionStorage.getItem('isLoggedIn') === 'true';

// ─────────────────────────────────────────────────────────────
// Authorization 헤더 (Supabase JWT)
// ─────────────────────────────────────────────────────────────
const getAuthHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
};

// ─────────────────────────────────────────────────────────────
// Supabase Storage 이미지 업로드
// ─────────────────────────────────────────────────────────────
const uploadImageToSupabase = async (file) => {
  const ext = file.name.split('.').pop();
  const path = `collections/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage
    .from('images')
    .upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('업로드 실패: ' + error.message);
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
};

// ─────────────────────────────────────────────────────────────
// 이미지 드래그드롭 + URL 입력 컴포넌트
// ─────────────────────────────────────────────────────────────
function MediaUploader({ onAdd }) {
  const [mode, setMode] = useState('drop');
  const [urlInput, setUrlInput] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const url = await uploadImageToSupabase(file);
        const type = file.type === 'image/gif' ? 'GIF' : 'IMAGE';
        onAdd({ mediaUrl: url, mediaType: type });
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setUploading(false);
    }
  };

  const addByUrl = () => {
    if (!urlInput.trim()) return;
    onAdd({ mediaUrl: urlInput.trim(), mediaType });
    setUrlInput('');
  };

  return (
    <div className="border border-[#c9a961]/20 p-5 space-y-3">
      <div className="flex gap-2 mb-3">
        <button onClick={() => setMode('drop')}
          className={`px-4 py-1.5 text-[10px] tracking-widest border transition-all flex items-center gap-1.5 ${
            mode === 'drop' ? 'bg-[#c9a961]/20 border-[#c9a961]/60 text-[#c9a961]' : 'border-[#c9a961]/20 text-[#e8dcc8]/40 hover:border-[#c9a961]/40'
          }`}>
          <Upload size={11} /> 파일 업로드
        </button>
        <button onClick={() => setMode('url')}
          className={`px-4 py-1.5 text-[10px] tracking-widest border transition-all flex items-center gap-1.5 ${
            mode === 'url' ? 'bg-[#c9a961]/20 border-[#c9a961]/60 text-[#c9a961]' : 'border-[#c9a961]/20 text-[#e8dcc8]/40 hover:border-[#c9a961]/40'
          }`}>
          <Link size={11} /> URL 입력
        </button>
      </div>

      {mode === 'drop' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById('col-img-upload').click()}
          className={`border-2 border-dashed rounded-none p-8 text-center cursor-pointer transition-all ${
            dragging ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-[#c9a961]/30 hover:bg-white/5'
          }`}>
          {uploading
            ? <p className="text-[#c9a961] text-sm tracking-widest animate-pulse">업로드 중...</p>
            : <>
                <Upload size={24} className="mx-auto mb-2 text-[#c9a961]/40" />
                <p className="text-sm text-[#c9a961] tracking-widest mb-1">이미지를 드래그하거나 클릭</p>
                <p className="text-[10px] text-[#e8dcc8]/30">JPG · PNG · GIF · 여러 장 가능</p>
              </>
          }
          <input id="col-img-upload" type="file" accept="image/*" multiple hidden
            onChange={e => handleFiles(e.target.files)} />
        </div>
      )}

      {mode === 'url' && (
        <div className="flex gap-2">
          <select value={mediaType} onChange={e => setMediaType(e.target.value)}
            className="bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] outline-none">
            <option value="IMAGE">이미지</option>
            <option value="GIF">GIF</option>
          </select>
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addByUrl()}
            placeholder="https://..."
            className="flex-1 bg-black/30 border border-[#c9a961]/25 px-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25" />
          <button onClick={addByUrl}
            className="px-4 py-2.5 bg-[#c9a961]/20 border border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/30 transition-all">
            <Plus size={16} />
          </button>
        </div>
      )}
      <p className="text-[10px] text-[#e8dcc8]/30">이미지는 5초마다 자동 전환됩니다</p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 컬렉션 에디터 오버레이
// ─────────────────────────────────────────────────────────────
function CollectionEditor({ collectionId, onClose, onSaved }) {
  const isNew = !collectionId;
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!isNew);

  const [form, setForm] = useState({
    title: '', description: '', textColor: '#c9a961',
    isPublished: false, isActive: false,
    visibleFrom: '', visibleUntil: '',
  });

  const [mediaList, setMediaList] = useState([]);
  const [textBlocks, setTextBlocks] = useState([]);
  const [textInput, setTextInput] = useState({
    content: '', fontSize: 'xlarge', fontWeight: 'bold',
    isItalic: false, positionX: '50%', positionY: '45%',
  });

  const [allPerfumes, setAllPerfumes] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedPerfumes, setSelectedPerfumes] = useState([]);
  const [perfumeSearch, setPerfumeSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    loadMasterData();
    if (!isNew) loadCollection();
    else setLoadingData(false);
    // eslint-disable-next-line
  }, []);

  const loadMasterData = async () => {
    try {
      const { data: perfumes } = await supabase
        .from('Perfumes')
        .select('perfume_id, name, name_en, price, sale_price, sale_rate, brand_id')
        .eq('is_active', true).order('name');

      const brandIds = [...new Set(perfumes?.map(p => p.brand_id).filter(Boolean))];
      const { data: brands } = await supabase
        .from('Brands').select('brand_id, brand_name').in('brand_id', brandIds).order('brand_name');
      const brandMap = Object.fromEntries(brands?.map(b => [b.brand_id, b.brand_name]) || []);

      const perfumeIds = perfumes?.map(p => p.perfume_id) || [];
      const { data: images } = await supabase
        .from('Perfume_Images').select('perfume_id, image_url')
        .in('perfume_id', perfumeIds).eq('is_thumbnail', true);
      const imgMap = Object.fromEntries(images?.map(i => [i.perfume_id, i.image_url]) || []);

      const { data: ptags } = await supabase
        .from('Perfume_Tags').select('perfume_id, tag_id').in('perfume_id', perfumeIds);
      const tagMap = {};
      ptags?.forEach(pt => {
        if (!tagMap[pt.perfume_id]) tagMap[pt.perfume_id] = [];
        tagMap[pt.perfume_id].push(pt.tag_id);
      });

      setAllBrands(brands || []);
      setAllPerfumes(perfumes?.map(p => ({
        ...p,
        brand_name: brandMap[p.brand_id] || '브랜드 없음',
        thumbnail: imgMap[p.perfume_id],
        tag_ids: tagMap[p.perfume_id] || [],
      })) || []);

      const { data: tags } = await supabase
        .from('Preference_Tags').select('tag_id, tag_name')
        .eq('is_active', true).order('tag_name');
      setAllTags(tags || []);
    } catch (err) {
      console.error('마스터 데이터 로드 실패:', err);
    }
  };

  const loadCollection = async () => {
    setLoadingData(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) throw new Error('로그인이 필요합니다');
      const res = await fetch(`${API_BASE}/api/collections/${collectionId}`, { headers: authHeader });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      const c = json.data;
      setForm({
        title: c.title,
        description: c.description || '',
        textColor: c.textColor || '#c9a961',
        isPublished: c.isPublished ?? false,
        isActive: c.isActive ?? false,
        // ★ 수정: 배열/문자열 모두 처리
        visibleFrom: fmtDatetimeLocal(c.visibleFrom),
        visibleUntil: fmtDatetimeLocal(c.visibleUntil),
      });
      setMediaList((c.mediaList || []).map(m => ({ ...m, _id: m.mediaId })));
      setTextBlocks((c.textBlocks || []).map(t => ({ ...t, _id: t.textBlockId })));
      setSelectedPerfumes((c.perfumes || []).map(p => ({
        perfume_id: p.perfumeId,
        name: p.name,
        name_en: p.nameEn,
        price: p.price,
        sale_price: p.salePrice,
        sale_rate: p.saleRate,
        brand_name: p.brandName,
        thumbnail: p.thumbnail,
        display_order: p.displayOrder,
        is_featured: p.isFeatured,
      })));
    } catch (err) {
      alert('컬렉션 로드 실패: ' + err.message);
    } finally {
      setLoadingData(false);
    }
  };

  // ── 미디어 ──
  const addMedia = ({ mediaUrl, mediaType }) => {
    setMediaList(prev => [...prev, {
      _id: `tmp_${Date.now()}`, mediaUrl, mediaType: mediaType || 'IMAGE',
      displayOrder: prev.length,
    }]);
  };

  const moveMedia = (idx, dir) => {
    setMediaList(prev => {
      const list = [...prev];
      const ni = dir === 'up' ? idx - 1 : idx + 1;
      if (ni < 0 || ni >= list.length) return prev;
      [list[idx], list[ni]] = [list[ni], list[idx]];
      return list.map((m, i) => ({ ...m, displayOrder: i }));
    });
  };

  // ── 텍스트 블록 ──
  const addTextBlock = () => {
    if (!textInput.content.trim()) { alert('텍스트를 입력하세요'); return; }
    setTextBlocks(prev => [...prev, { _id: `tmp_${Date.now()}`, ...textInput, displayOrder: prev.length }]);
    setTextInput({ content: '', fontSize: 'xlarge', fontWeight: 'bold', isItalic: false, positionX: '50%', positionY: '45%' });
  };

  // ── 향수 ──
  const filteredPerfumes = allPerfumes.filter(p => {
    const q = perfumeSearch.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.name_en?.toLowerCase().includes(q) || p.brand_name?.toLowerCase().includes(q);
    const matchBrand = !brandFilter || String(p.brand_id) === brandFilter;
    const matchTag = !tagFilter || p.tag_ids?.includes(Number(tagFilter));
    return matchSearch && matchBrand && matchTag;
  });

  const togglePerfume = (p) => {
    setSelectedPerfumes(prev => {
      const exists = prev.some(sp => sp.perfume_id === p.perfume_id);
      if (exists) return prev.filter(sp => sp.perfume_id !== p.perfume_id);
      return [...prev, { ...p, display_order: prev.length, is_featured: false }];
    });
  };

  const movePerfume = (idx, dir) => {
    setSelectedPerfumes(prev => {
      const list = [...prev];
      const ni = dir === 'up' ? idx - 1 : idx + 1;
      if (ni < 0 || ni >= list.length) return prev;
      [list[idx], list[ni]] = [list[ni], list[idx]];
      return list.map((p, i) => ({ ...p, display_order: i }));
    });
  };

  // ── 저장 ──
  const handleSave = async () => {
    if (!form.title.trim()) { alert('제목을 입력하세요'); return; }
    if (mediaList.length === 0) { alert('배경 이미지를 최소 1개 추가하세요'); return; }

    const authHeader = await getAuthHeader();
    if (!authHeader) { alert('로그인이 필요합니다. 다시 로그인 후 시도해주세요.'); return; }

    setSaving(true);

    const body = {
      title: form.title,
      description: form.description || null,
      type: 'COLLECTION',
      textColor: form.textColor,
      isPublished: form.isPublished,
      isActive: form.isActive,
      // ★ 수정: "2026-03-15T14:30" → "2026-03-15T14:30:00" (백엔드 LocalDateTime 파싱)
      visibleFrom: localToISO(form.visibleFrom),
      visibleUntil: localToISO(form.visibleUntil),
      mediaList: mediaList.map((m, i) => ({
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType || 'IMAGE',
        displayOrder: i,
      })),
      textBlocks: textBlocks.map((t, i) => ({
        content: t.content,
        fontSize: t.fontSize,
        fontWeight: t.fontWeight,
        isItalic: t.isItalic ?? false,
        positionX: t.positionX,
        positionY: t.positionY,
        displayOrder: i,
      })),
      perfumes: selectedPerfumes.map((p, i) => ({
        perfumeId: p.perfume_id,
        displayOrder: i,
        isFeatured: p.is_featured || false,
      })),
    };

    try {
      const url = isNew
        ? `${API_BASE}/api/collections`
        : `${API_BASE}/api/collections/${collectionId}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
      }
      const json = await res.json();
      if (!json.success) throw new Error(json.message);

      alert(isNew ? '컬렉션이 생성되었습니다!' : '수정 사항이 저장되었습니다!');

      // isActive 별도 PATCH
      if (json.data?.collectionId) {
        await fetch(`${API_BASE}/api/collections/${json.data.collectionId}/active?activate=${form.isActive}`, {
          method: 'PATCH', headers: authHeader,
        });
      }

      onSaved?.();
      onClose();
    } catch (err) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961]" />
    </div>
  );

  const TABS = [
    { id: 'basic',    label: '기본 정보' },
    { id: 'media',    label: `배경 미디어${mediaList.length ? ` (${mediaList.length})` : ''}` },
    { id: 'text',     label: `문구 (선택)${textBlocks.length ? ` · ${textBlocks.length}개` : ''}` },
    { id: 'perfumes', label: `향수 선택${selectedPerfumes.length ? ` (${selectedPerfumes.length})` : ''}` },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="w-full max-w-5xl bg-[#1a1714] text-[#e8dcc8] border border-[#c9a961]/30 shadow-2xl my-auto">

        {/* 헤더 */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-[#c9a961]/20">
          <div>
            <p className="text-[#c9a961] text-[9px] tracking-[0.6em] mb-1">ADMIN · COLLECTION EDITOR</p>
            <h2 className="text-base tracking-[0.25em]">{isNew ? '새 컬렉션 만들기' : '컬렉션 수정'}</h2>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={() => setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#c9a961]/30 text-[#c9a961] text-[10px] tracking-widest hover:bg-[#c9a961]/10 transition-all">
              <Eye size={13} /> 미리보기
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#c9a961] text-[#1a1714] text-[10px] tracking-widest hover:bg-[#b89851] transition-all disabled:opacity-50">
              <Save size={13} /> {saving ? '저장중...' : '저장'}
            </button>
            <button onClick={onClose} className="p-2 text-[#e8dcc8]/40 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-[#c9a961]/15 overflow-x-auto">
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-[10px] tracking-[0.2em] border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#c9a961] border-[#c9a961]'
                  : 'text-[#e8dcc8]/40 border-transparent hover:text-[#e8dcc8]/70'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">

          {/* ── 기본 정보 ── */}
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">제목 *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="예: 2026 Spring Collection"
                  className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-3 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25" />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">소개 문구</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="컬렉션을 소개하는 문구 (선택사항)"
                  className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-3 text-sm focus:border-[#c9a961] outline-none resize-none placeholder:text-[#e8dcc8]/25" />
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">텍스트 색상</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })}
                    className="h-11 w-16 bg-transparent border border-[#c9a961]/25 cursor-pointer" />
                  <input type="text" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })}
                    className="w-32 bg-black/30 border border-[#c9a961]/25 px-3 py-3 text-sm focus:border-[#c9a961] outline-none" />
                  <span className="text-xs text-[#e8dcc8]/30">배너 위 문구에 적용됩니다</span>
                </div>
              </div>

              <div className="border border-[#c9a961]/20 p-5 space-y-4">
                <p className="text-[10px] tracking-[0.4em] text-[#c9a961] flex items-center gap-2">
                  <Calendar size={12} /> 가시 기간 (사용자 노출 기간)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] text-[#e8dcc8]/50 mb-1.5">
                      노출 시작일시 <span className="text-[#e8dcc8]/30">(비워두면 즉시 노출)</span>
                    </label>
                    <input type="datetime-local" value={form.visibleFrom}
                      onChange={e => setForm({ ...form, visibleFrom: e.target.value })}
                      className="w-full bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] focus:border-[#c9a961] outline-none" />
                    {/* ★ 추가: 입력된 값 확인용 표시 */}
                    {form.visibleFrom && (
                      <p className="text-[9px] text-[#c9a961]/50 mt-1">
                        설정: {new Date(form.visibleFrom).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-[9px] text-[#e8dcc8]/50 mb-1.5">
                      노출 종료일시 <span className="text-[#e8dcc8]/30">(비워두면 무기한 노출)</span>
                    </label>
                    <input type="datetime-local" value={form.visibleUntil}
                      onChange={e => setForm({ ...form, visibleUntil: e.target.value })}
                      className="w-full bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] focus:border-[#c9a961] outline-none" />
                    {form.visibleUntil && (
                      <p className="text-[9px] text-[#c9a961]/50 mt-1">
                        설정: {new Date(form.visibleUntil).toLocaleString('ko-KR')}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished}
                    onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                    className="w-4 h-4 accent-[#c9a961]" />
                  <span className="text-sm text-[#e8dcc8]/70">공개 (사용자에게 보임)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-[#c9a961]" />
                  <span className="text-sm text-[#e8dcc8]/70">활성화 (메인 표시)</span>
                </label>
              </div>
            </div>
          )}

          {/* ── 배경 미디어 ── */}
          {activeTab === 'media' && (
            <div className="space-y-5">
              <MediaUploader onAdd={addMedia} />
              <div className="space-y-2">
                {mediaList.map((m, i) => (
                  <div key={m._id || i} className="flex items-center gap-3 p-3 border border-[#c9a961]/15 bg-black/20">
                    <div className="w-16 h-16 overflow-hidden bg-black/40 flex-shrink-0">
                      <img src={m.mediaUrl} alt=""
                        className="w-full h-full object-cover"
                        onError={e => { e.target.style.display = 'none'; }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] text-[#c9a961]">{i + 1}번째</span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-[#c9a961]/15 text-[#c9a961]">{m.mediaType || 'IMAGE'}</span>
                      </div>
                      <p className="text-xs text-[#e8dcc8]/40 truncate">{m.mediaUrl}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveMedia(i, 'up')} disabled={i === 0}
                        className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={14} /></button>
                      <button onClick={() => moveMedia(i, 'down')} disabled={i === mediaList.length - 1}
                        className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={14} /></button>
                      <button onClick={() => setMediaList(prev => prev.filter((_, j) => j !== i))}
                        className="p-1.5 text-red-400/70 hover:text-red-400"><X size={14} /></button>
                    </div>
                  </div>
                ))}
                {mediaList.length === 0 && (
                  <p className="text-center text-[#e8dcc8]/25 py-10 italic text-sm">배경 이미지를 추가하세요 (최소 1개)</p>
                )}
              </div>
            </div>
          )}

          {/* ── 문구 (선택사항) ── */}
          {activeTab === 'text' && (
            <div className="space-y-5">
              <div className="bg-[#c9a961]/5 border border-[#c9a961]/20 px-4 py-3 text-[10px] text-[#c9a961]/70 tracking-wider">
                💡 문구는 선택사항입니다. 여러 개 추가 시 배경 이미지처럼 5초마다 슬라이드됩니다.
              </div>
              <div className="border border-[#c9a961]/20 p-5">
                <p className="text-[10px] tracking-[0.4em] text-[#c9a961] mb-4">문구 추가</p>
                <div className="space-y-3">
                  <input value={textInput.content}
                    onChange={e => setTextInput({ ...textInput, content: e.target.value })}
                    placeholder="예: SPRING 2026"
                    className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { key: 'fontSize', label: '크기', opts: [['small','작게'],['medium','보통'],['large','크게'],['xlarge','매우 크게']] },
                      { key: 'fontWeight', label: '두께', opts: [['light','얇게'],['normal','보통'],['medium','중간'],['bold','굵게']] },
                    ].map(({ key, label, opts }) => (
                      <div key={key}>
                        <label className="block text-[9px] text-[#c9a961]/60 mb-1">{label}</label>
                        <select value={textInput[key]} onChange={e => setTextInput({ ...textInput, [key]: e.target.value })}
                          className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none">
                          {opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                        </select>
                      </div>
                    ))}
                    {[
                      { key: 'positionX', label: 'X 위치', ph: '50%' },
                      { key: 'positionY', label: 'Y 위치', ph: '45%' },
                    ].map(({ key, label, ph }) => (
                      <div key={key}>
                        <label className="block text-[9px] text-[#c9a961]/60 mb-1">{label}</label>
                        <input value={textInput[key]} onChange={e => setTextInput({ ...textInput, [key]: e.target.value })}
                          placeholder={ph}
                          className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none" />
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={textInput.isItalic}
                        onChange={e => setTextInput({ ...textInput, isItalic: e.target.checked })}
                        className="w-3.5 h-3.5 accent-[#c9a961]" />
                      <span className="text-xs text-[#e8dcc8]/60 italic">이탤릭체</span>
                    </label>
                    <button onClick={addTextBlock}
                      className="px-5 py-2 bg-[#c9a961]/20 border border-[#c9a961]/40 text-[#c9a961] text-[10px] tracking-widest hover:bg-[#c9a961]/30 transition-all">
                      + 추가
                    </button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {textBlocks.map((block, i) => (
                  <div key={block._id || i} className="flex items-center gap-4 p-4 border border-[#c9a961]/15 bg-black/20">
                    <span className="text-[10px] text-[#c9a961]/40 w-4 flex-shrink-0">{i + 1}</span>
                    <div className="flex-1">
                      <p className={`mb-1 ${FONT_SIZE_CLASS[block.fontSize]} ${FONT_WEIGHT_CLASS[block.fontWeight]} ${block.isItalic ? 'italic' : ''}`}
                        style={{ color: form.textColor }}>{block.content}</p>
                      <p className="text-[10px] text-[#e8dcc8]/30">
                        {block.fontSize} · {block.fontWeight} · ({block.positionX}, {block.positionY})
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setTextBlocks(prev => { const l=[...prev]; if(i>0){[l[i],l[i-1]]=[l[i-1],l[i]];} return l; })}
                        disabled={i===0} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={14} /></button>
                      <button onClick={() => setTextBlocks(prev => { const l=[...prev]; if(i<l.length-1){[l[i],l[i+1]]=[l[i+1],l[i]];} return l; })}
                        disabled={i===textBlocks.length-1} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={14} /></button>
                      <button onClick={() => setTextBlocks(prev => prev.filter((_,j)=>j!==i))}
                        className="p-1.5 text-red-400/70 hover:text-red-400"><X size={14} /></button>
                    </div>
                  </div>
                ))}
                {textBlocks.length === 0 && (
                  <p className="text-center text-[#e8dcc8]/25 py-10 italic text-sm">문구를 추가하세요 (없으면 컬렉션 제목이 표시됩니다)</p>
                )}
              </div>
            </div>
          )}

          {/* ── 향수 선택 ── */}
          {activeTab === 'perfumes' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e8dcc8]/30" />
                  <input value={perfumeSearch} onChange={e => setPerfumeSearch(e.target.value)}
                    placeholder="향수명 · 브랜드 검색"
                    className="w-full bg-black/30 border border-[#c9a961]/25 pl-9 pr-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25" />
                </div>
                <select value={brandFilter} onChange={e => setBrandFilter(e.target.value)}
                  className="bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] outline-none">
                  <option value="">전체 브랜드</option>
                  {allBrands.map(b => <option key={b.brand_id} value={String(b.brand_id)}>{b.brand_name}</option>)}
                </select>
                <select value={tagFilter} onChange={e => setTagFilter(e.target.value)}
                  className="bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] outline-none">
                  <option value="">전체 태그</option>
                  {allTags.map(t => <option key={t.tag_id} value={String(t.tag_id)}>{t.tag_name}</option>)}
                </select>
              </div>

              <div className="border border-[#c9a961]/15 bg-black/20 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {filteredPerfumes.map(p => {
                    const selected = selectedPerfumes.some(sp => sp.perfume_id === p.perfume_id);
                    return (
                      <div key={p.perfume_id} onClick={() => togglePerfume(p)}
                        className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#c9a961]/10 transition-colors ${selected ? 'bg-[#c9a961]/15' : 'hover:bg-white/5'}`}>
                        <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-black/40">
                          {p.thumbnail
                            ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-[#c9a961]/30 text-lg">{p.name?.charAt(0)}</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#e8dcc8] truncate">{p.name}</p>
                          <p className="text-[10px] text-[#e8dcc8]/40">{p.brand_name} · {fmtKRW(p.price)}</p>
                        </div>
                        {selected && <Check size={14} className="text-[#c9a961] flex-shrink-0" />}
                      </div>
                    );
                  })}
                  {filteredPerfumes.length === 0 && (
                    <div className="col-span-2 text-center py-10 text-[#e8dcc8]/25 italic text-sm">검색 결과가 없습니다</div>
                  )}
                </div>
              </div>

              {selectedPerfumes.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-[0.4em] text-[#c9a961] mb-3">
                    선택된 향수 ({selectedPerfumes.length}개) — 순서 편집
                  </p>
                  <div className="space-y-1.5">
                    {selectedPerfumes.map((p, i) => (
                      <div key={p.perfume_id} className="flex items-center gap-3 px-4 py-2.5 border border-[#c9a961]/15 bg-black/20">
                        <span className="text-[10px] text-[#c9a961]/60 w-5 text-center">{i + 1}</span>
                        <div className="w-8 h-8 flex-shrink-0 overflow-hidden bg-black/40">
                          {p.thumbnail
                            ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-[#c9a961]/30 text-sm">{p.name?.charAt(0)}</div>
                          }
                        </div>
                        <p className="flex-1 text-xs text-[#e8dcc8] truncate">{p.name}</p>
                        <button
                          onClick={() => setSelectedPerfumes(prev =>
                            prev.map(sp => sp.perfume_id === p.perfume_id ? { ...sp, is_featured: !sp.is_featured } : sp)
                          )}
                          className={`flex items-center gap-1 px-2 py-1 text-[9px] border transition-all ${
                            p.is_featured
                              ? 'border-[#c9a961] text-[#c9a961] bg-[#c9a961]/15'
                              : 'border-[#e8dcc8]/20 text-[#e8dcc8]/30 hover:border-[#c9a961]/40'
                          }`}>
                          <Star size={9} className={p.is_featured ? 'fill-[#c9a961]' : ''} />
                          {p.is_featured ? 'FEATURED' : '일반'}
                        </button>
                        <button onClick={() => movePerfume(i, 'up')} disabled={i === 0}
                          className="p-1 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={13} /></button>
                        <button onClick={() => movePerfume(i, 'down')} disabled={i === selectedPerfumes.length - 1}
                          className="p-1 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={13} /></button>
                        <button onClick={() => togglePerfume(p)}
                          className="p-1 text-red-400/60 hover:text-red-400"><X size={13} /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 미리보기 */}
      {showPreview && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6">
          <div className="bg-[#faf8f3] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#2a2620] tracking-widest">PREVIEW</h3>
              <button onClick={() => setShowPreview(false)} className="p-2 hover:bg-gray-100"><X size={18} /></button>
            </div>
            <div className="p-6">
              <div className="relative h-72 overflow-hidden mb-6 bg-[#2a2620]">
                {mediaList[0] && <img src={mediaList[0].mediaUrl} alt="" className="w-full h-full object-cover" />}
                <div className="absolute inset-0 bg-black/30" />
                {textBlocks.length > 0
                  ? textBlocks.map((b, i) => (
                    <div key={i} className="absolute"
                      style={{ left: b.positionX, top: b.positionY, transform: 'translate(-50%,-50%)', color: form.textColor }}>
                      <p className={`${FONT_SIZE_CLASS[b.fontSize]} ${FONT_WEIGHT_CLASS[b.fontWeight]} ${b.isItalic ? 'italic' : ''} tracking-widest drop-shadow-lg text-center px-4`}>
                        {b.content}
                      </p>
                    </div>
                  ))
                  : form.title && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-3xl tracking-[0.3em] drop-shadow-lg" style={{ color: form.textColor }}>{form.title}</p>
                    </div>
                  )
                }
              </div>
              <div className="grid grid-cols-3 gap-4">
                {selectedPerfumes.slice(0, 6).map(p => (
                  <div key={p.perfume_id} className="text-center">
                    <div className="aspect-square overflow-hidden mb-2 bg-gray-100">
                      {p.thumbnail
                        ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><span className="text-3xl text-[#c9a961]/20">{p.name?.charAt(0)}</span></div>
                      }
                    </div>
                    <p className="text-sm font-medium text-[#2a2620] truncate">{p.name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 컬렉션 목록 관리 패널
// ─────────────────────────────────────────────────────────────
function CollectionListPanel({ onClose, onEdit, onRefresh }) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchList(); }, []);

  const fetchList = async () => {
    setLoading(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;
      const res = await fetch(`${API_BASE}/api/collections?type=COLLECTION`, { headers: authHeader });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.success) setList(json.data || []);
    } catch (err) {
      console.error('목록 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id, current) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    await fetch(`${API_BASE}/api/collections/${id}/active?activate=${!current}`, { method: 'PATCH', headers: authHeader });
    fetchList(); onRefresh?.();
  };

  const deleteCollection = async (id, title) => {
    if (!confirm(`"${title}" 컬렉션을 삭제하시겠습니까?`)) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch(`${API_BASE}/api/collections/${id}`, { method: 'DELETE', headers: authHeader });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      fetchList(); onRefresh?.();
    } catch (err) {
      alert('삭제 실패: ' + err.message);
    }
  };

  return (
    <div className="w-80 bg-[#1a1714] border border-[#c9a961]/30 shadow-2xl max-h-[80vh] overflow-y-auto">
      <div className="px-5 py-4 border-b border-[#c9a961]/20 flex justify-between items-center sticky top-0 bg-[#1a1714]">
        <span className="text-[10px] tracking-widest text-[#c9a961]">컬렉션 목록 관리</span>
        <button onClick={onClose} className="text-[#e8dcc8]/40 hover:text-white"><X size={16} /></button>
      </div>

      {loading
        ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a961]" /></div>
        : list.length === 0
          ? <p className="text-center text-[#e8dcc8]/30 py-10 text-xs italic">등록된 컬렉션 없음</p>
          : list.map(col => (
            <div key={col.collectionId} className={`border-b border-[#c9a961]/10 px-5 py-4 ${col.isActive ? 'bg-[#c9a961]/5' : ''}`}>
              <p className="text-xs text-[#e8dcc8] font-medium truncate mb-1">{col.title}</p>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {col.isActive && <span className="text-[9px] text-[#c9a961] border border-[#c9a961]/40 px-1.5 py-0.5">활성화</span>}
                {col.isPublished
                  ? <span className="text-[9px] text-emerald-400 border border-emerald-400/40 px-1.5 py-0.5">공개중</span>
                  : <span className="text-[9px] text-[#e8dcc8]/30 border border-[#e8dcc8]/15 px-1.5 py-0.5">비공개</span>
                }
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={() => onEdit(col.collectionId)}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] border border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/20 transition-all">
                  <Edit2 size={9} /> 편집
                </button>
                <button onClick={() => toggleActive(col.collectionId, col.isActive)}
                  className={`px-2 py-1 text-[9px] border transition-all ${col.isActive ? 'border-[#e8dcc8]/20 text-[#e8dcc8]/40 hover:bg-white/5' : 'border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/20'}`}>
                  {col.isActive ? '비활성화' : '활성화'}
                </button>
                <button onClick={() => deleteCollection(col.collectionId, col.title)}
                  className="px-2 py-1 text-[9px] border border-red-400/30 text-red-400/60 hover:bg-red-400/10 transition-all">
                  <Trash2 size={9} />
                </button>
              </div>
            </div>
          ))
      }
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 Collections 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function Collections() {
  const isAdmin = checkIsAdmin();

  const [collections, setCollections] = useState([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [slideIdx, setSlideIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [listPanelOpen, setListPanelOpen] = useState(false);

  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      let res;
      if (isAdmin) {
        const authHeader = await getAuthHeader();
        if (!authHeader) { setCollections([]); return; }
        res = await fetch(`${API_BASE}/api/collections?type=COLLECTION`, { headers: authHeader });
      } else {
        res = await fetch(`${API_BASE}/api/collections/active?type=COLLECTION`);
      }

      if (!res.ok) { setCollections([]); return; }
      const json = await res.json();
      if (!json.success && !json.data) { setCollections([]); return; }

      const raw = json.data;
      const data = Array.isArray(raw) ? raw : (raw ? [raw] : []);
      setCollections(data);
      setActiveIdx(0);
      setSlideIdx(0);
    } catch (err) {
      console.error('컬렉션 로드 실패:', err);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  useEffect(() => {
    const cur = collections[activeIdx];
    if (!cur) return;
    const mediaLen = cur.mediaList?.length || 0;
    const textLen  = cur.textBlocks?.length || 0;
    const maxLen   = Math.max(mediaLen, textLen);
    if (maxLen <= 1) return;
    const t = setInterval(() => setSlideIdx(p => (p + 1) % maxLen), 5000);
    return () => clearInterval(t);
  }, [collections, activeIdx]);

  useEffect(() => { setSlideIdx(0); }, [activeIdx]);

  const handleOpenEditor = (id = null) => {
    setEditingId(id); setEditorOpen(true); setListPanelOpen(false);
  };

  const current         = collections[activeIdx] || null;
  const currentMedia    = current?.mediaList   || [];
  const currentBlocks   = current?.textBlocks  || [];
  const currentPerfumes = current?.perfumes    || [];

  const mediaSlideIdx = currentMedia.length > 0 ? slideIdx % currentMedia.length : 0;
  const textSlideIdx  = currentBlocks.length > 0 ? slideIdx % currentBlocks.length : 0;
  const totalSlides   = Math.max(currentMedia.length, currentBlocks.length);

  return (
    <div className="min-h-screen bg-[#faf8f3]">

      {/* ── 배너 ── */}
      <div className="relative h-[70vh] overflow-hidden">

        {!current || currentMedia.length === 0 ? (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2620] via-[#3d3228] to-[#2a2620] flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c9a961]/40" />
                <div className="mx-3 text-[#c9a961]/40 text-sm">✦</div>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c9a961]/40" />
              </div>
              <h1 className="text-4xl md:text-6xl tracking-[0.4em] mb-4 text-[#c9a961]/60 font-light">COLLECTION</h1>
              <p className="text-sm text-[#e8dcc8]/30 italic tracking-widest">
                {isAdmin ? '활성화된 컬렉션이 없습니다. 새로 만들어보세요.' : '준비 중입니다'}
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="absolute inset-0">
              {currentMedia.map((m, i) => (
                <div key={m.mediaId || i}
                  className={`absolute inset-0 transition-opacity duration-1000 ${i === mediaSlideIdx ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={m.mediaUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30" />
                </div>
              ))}
            </div>

            <div className="relative h-full pointer-events-none">
              {currentBlocks.length > 0 ? (
                currentBlocks.map((b, i) => (
                  <div key={b.textBlockId} className="absolute"
                    style={{
                      left: b.positionX, top: b.positionY,
                      transform: 'translate(-50%,-50%)',
                      color: current.textColor,
                    }}>
                    <p className={`${FONT_SIZE_CLASS[b.fontSize]} ${FONT_WEIGHT_CLASS[b.fontWeight]} ${b.isItalic ? 'italic' : ''} tracking-widest drop-shadow-lg text-center px-4`}
                      style={{ opacity: i === textSlideIdx ? 1 : 0, transition: 'opacity 1s' }}>
                      {b.content}
                    </p>
                  </div>
                ))
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl md:text-6xl font-display tracking-[0.3em] mb-4 drop-shadow-lg"
                      style={{ color: current.textColor }}>{current.title}</h1>
                    {current.description && (
                      <p className="text-lg italic tracking-wider drop-shadow-lg"
                        style={{ color: current.textColor }}>{current.description}</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {totalSlides > 1 && (
              <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {Array.from({ length: totalSlides }).map((_, i) => (
                  <button key={i} onClick={() => setSlideIdx(i)}
                    className={`h-1.5 rounded-full transition-all ${i === slideIdx ? 'bg-[#c9a961] w-8' : 'bg-white/40 w-1.5 hover:bg-white/70'}`} />
                ))}
              </div>
            )}

            {collections.length > 1 && (
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center bg-gradient-to-t from-black/60 to-transparent pt-8 pb-4">
                {collections.map((col, i) => (
                  <button key={col.collectionId} onClick={() => setActiveIdx(i)}
                    className={`px-5 py-2 text-[10px] tracking-widest transition-all border-b-2 ${
                      i === activeIdx ? 'text-[#c9a961] border-[#c9a961]' : 'text-white/50 border-transparent hover:text-white/80'
                    }`}>
                    {col.title}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 관리자 버튼 ── */}
        {isAdmin && (
          <div className="absolute top-5 right-5 z-30 flex flex-col gap-2 items-end">
            <button onClick={() => handleOpenEditor(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-black/75 text-[#c9a961] border border-[#c9a961]/60 text-[10px] tracking-widest hover:bg-[#c9a961] hover:text-black transition-all shadow-lg">
              <Plus size={13} /> 새 컬렉션 만들기
            </button>
            {current && (
              <button onClick={() => handleOpenEditor(current.collectionId)}
                className="flex items-center gap-2 px-4 py-2.5 bg-black/75 text-[#c9a961] border border-[#c9a961]/60 text-[10px] tracking-widest hover:bg-[#c9a961] hover:text-black transition-all shadow-lg">
                <Edit2 size={13} /> 현재 컬렉션 편집
              </button>
            )}
            <button onClick={() => setListPanelOpen(p => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 border text-[10px] tracking-widest transition-all shadow-lg ${
                listPanelOpen ? 'bg-[#c9a961] text-black border-[#c9a961]' : 'bg-black/75 text-[#c9a961] border-[#c9a961]/60 hover:bg-[#c9a961] hover:text-black'
              }`}>
              <Filter size={13} /> 컬렉션 목록 관리
            </button>
            {listPanelOpen && (
              <CollectionListPanel
                onClose={() => setListPanelOpen(false)}
                onEdit={handleOpenEditor}
                onRefresh={fetchCollections}
              />
            )}
          </div>
        )}
      </div>

      {/* ── 향수 목록 ── */}
      {!loading && (
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
              <div className="mx-3 text-[#c9a961] text-xs">✦</div>
              <div className="h-[1px] w-12 bg-gradient-to-l from-transparent via-[#c9a961] to-transparent" />
            </div>
            <h2 className="font-display text-3xl tracking-[0.3em] text-[#c9a961] mb-2">
              {current?.title || 'COLLECTION'}
            </h2>
            {current?.description && (
              <p className="text-sm italic text-[#8b8278] tracking-wide mb-2">{current.description}</p>
            )}
            <p className="text-sm text-[#8b8278] italic">{currentPerfumes.length}개의 향수</p>
          </div>

          {collections.length > 1 && (
            <div className="flex items-center justify-center border-b border-[#c9a961]/20 mb-12">
              {collections.map((col, i) => (
                <button key={col.collectionId} onClick={() => setActiveIdx(i)}
                  className={`px-6 py-3 text-[10px] tracking-[0.3em] border-b-2 transition-all ${
                    i === activeIdx ? 'text-[#c9a961] border-[#c9a961]' : 'text-[#8b8278] border-transparent hover:text-[#c9a961]/70'
                  }`}>
                  {col.title}
                  <span className="ml-1.5 text-[9px] opacity-60">({(col.perfumes || []).length})</span>
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {currentPerfumes.map(p => (
              <div key={p.perfumeId} className="group cursor-pointer">
                <div className="relative overflow-hidden mb-4 bg-white shadow-sm">
                  <div className="aspect-square">
                    {p.thumbnail
                      ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      : <div className="w-full h-full bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] flex items-center justify-center">
                          <span className="text-6xl text-[#c9a961]/20">{p.name?.charAt(0)}</span>
                        </div>
                    }
                  </div>
                  {p.isFeatured && <div className="absolute top-4 right-4 bg-[#c9a961] text-white px-3 py-1 text-xs tracking-wider">FEATURED</div>}
                  {p.saleRate > 0 && <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-bold">{p.saleRate}% OFF</div>}
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8b8278] mb-1 tracking-wider">{p.brandName}</p>
                  <h3 className="text-lg font-medium text-[#2a2620] mb-1 tracking-wide">{p.name}</h3>
                  {p.nameEn && <p className="text-xs text-[#c9a961] italic mb-2">{p.nameEn}</p>}
                  <div className="flex items-center justify-center gap-2">
                    {p.saleRate > 0 ? (
                      <><span className="text-sm text-gray-400 line-through">{fmtKRW(p.price)}</span><span className="text-lg font-semibold text-[#c9a961]">{fmtKRW(p.salePrice)}</span></>
                    ) : (
                      <span className="text-lg font-semibold text-[#c9a961]">{fmtKRW(p.price)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {currentPerfumes.length === 0 && (
            <p className="text-center py-20 text-lg text-[#8b8278] italic">아직 등록된 향수가 없습니다</p>
          )}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4" />
            <p className="text-[#8b8278] italic text-sm">컬렉션을 불러오는 중...</p>
          </div>
        </div>
      )}

      {editorOpen && (
        <CollectionEditor
          collectionId={editingId}
          onClose={() => setEditorOpen(false)}
          onSaved={fetchCollections}
        />
      )}
    </div>
  );
}