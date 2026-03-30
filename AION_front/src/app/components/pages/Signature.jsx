import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  Edit2, X, Save, Plus, Trash2,
  ChevronUp, ChevronDown, Upload, Link,
  Search, Star, Filter, Check,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';


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

const checkIsAdmin = () =>
  sessionStorage.getItem('isAdmin') === 'true' &&
  sessionStorage.getItem('isLoggedIn') === 'true';

const getAuthHeader = async () => {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) return null;
  return { Authorization: `Bearer ${token}` };
};

const uploadImageToSupabase = async (file) => {
  const ext = file.name.split('.').pop();
  const path = `signature/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('업로드 실패: ' + error.message);
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
};


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
        onAdd({ mediaUrl: url, mediaType: file.type === 'image/gif' ? 'GIF' : 'IMAGE' });
      }
    } catch (err) { alert(err.message); }
    finally { setUploading(false); }
  };

  const addByUrl = () => {
    if (!urlInput.trim()) return;
    onAdd({ mediaUrl: urlInput.trim(), mediaType });
    setUrlInput('');
  };

  return (
    <div className="border border-[#c9a961]/20 p-5 space-y-3">
      <div className="flex gap-2 mb-3">
        {[['drop', '파일 업로드', <Upload size={11}/>], ['url', 'URL 입력', <Link size={11}/>]].map(([m, label, icon]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-4 py-1.5 text-[10px] tracking-widest border transition-all flex items-center gap-1.5 ${
              mode === m ? 'bg-[#c9a961]/20 border-[#c9a961]/60 text-[#c9a961]' : 'border-[#c9a961]/20 text-[#e8dcc8]/40 hover:border-[#c9a961]/40'
            }`}>
            {icon} {label}
          </button>
        ))}
      </div>
      {mode === 'drop' && (
        <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById('sig-img-upload').click()}
          className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all ${dragging ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-[#c9a961]/30 hover:bg-white/5'}`}>
          {uploading
            ? <p className="text-[#c9a961] text-sm tracking-widest animate-pulse">업로드 중...</p>
            : <>
                <Upload size={24} className="mx-auto mb-2 text-[#c9a961]/40"/>
                <p className="text-sm text-[#c9a961] tracking-widest mb-1">이미지를 드래그하거나 클릭</p>
                <p className="text-[10px] text-[#e8dcc8]/30">JPG · PNG · GIF · 여러 장 가능</p>
              </>
          }
          <input id="sig-img-upload" type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)}/>
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
            onKeyDown={e => e.key === 'Enter' && addByUrl()} placeholder="https://..."
            className="flex-1 bg-black/30 border border-[#c9a961]/25 px-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25"/>
          <button onClick={addByUrl}
            className="px-4 py-2.5 bg-[#c9a961]/20 border border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/30 transition-all">
            <Plus size={16}/>
          </button>
        </div>
      )}
    </div>
  );
}


function SignatureListPanel({ onClose, onEdit, onRefresh }) {
  const [list, setList] = useState([]);
  const [loadingList, setLoadingList] = useState(true);

  const fetchList = useCallback(async () => {
    setLoadingList(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) return;

      const res = await fetch(`${API_BASE}/api/signature`, { headers: authHeader });
      const json = await res.json();
      setList(json.success ? (json.data || []) : []);
    } catch (err) { console.error('목록 로드 실패:', err); }
    finally { setLoadingList(false); }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const toggleActive = async (id, current) => {
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {

      await fetch(`${API_BASE}/api/signature/${id}/active?activate=${!current}`, {
        method: 'PATCH', headers: authHeader,
      });
      fetchList();
      onRefresh();
    } catch (err) { alert('활성화 변경 실패'); }
  };

  const deleteItem = async (id, title) => {
    if (!confirm(`"${title}" 시그니처를 삭제하시겠습니까?`)) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {

      const res = await fetch(`${API_BASE}/api/signature/${id}`, { method: 'DELETE', headers: authHeader });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      fetchList();
      onRefresh();
    } catch (err) { alert('삭제 실패: ' + err.message); }
  };

  return (
    <div className="absolute top-full right-0 mt-1 w-72 bg-[#1a1714] border border-[#c9a961]/30 shadow-2xl z-40 max-h-[70vh] overflow-y-auto">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#c9a961]/20">
        <p className="text-[10px] tracking-[0.4em] text-[#c9a961]">시그니처 목록 관리</p>
        <button onClick={onClose} className="text-[#e8dcc8]/40 hover:text-white"><X size={14}/></button>
      </div>
      {loadingList
        ? <p className="text-center py-8 text-[#e8dcc8]/40 text-xs italic">불러오는 중...</p>
        : list.length === 0
          ? <p className="text-center py-8 text-[#e8dcc8]/25 text-xs italic">등록된 시그니처가 없습니다</p>
          : list.map(col => (
              <div key={col.collectionId} className={`border-b border-[#c9a961]/10 px-5 py-4 ${col.isActive ? 'bg-[#c9a961]/5' : ''}`}>
                <p className="text-xs text-[#e8dcc8] font-medium truncate mb-1">{col.title}</p>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {col.isActive && <span className="text-[9px] text-[#c9a961] border border-[#c9a961]/40 px-1.5 py-0.5">활성화</span>}
                  {col.isPublished
                    ? <span className="text-[9px] text-emerald-400 border border-emerald-400/40 px-1.5 py-0.5">공개중</span>
                    : <span className="text-[9px] text-[#e8dcc8]/30 border border-[#e8dcc8]/15 px-1.5 py-0.5">비공개</span>}
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <button onClick={() => { onEdit(col.collectionId); onClose(); }}
                    className="flex items-center gap-1 px-2 py-1 text-[9px] border border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/20 transition-all">
                    <Edit2 size={9}/> 편집
                  </button>
                  <button onClick={() => toggleActive(col.collectionId, col.isActive)}
                    className={`px-2 py-1 text-[9px] border transition-all ${
                      col.isActive
                        ? 'border-[#e8dcc8]/20 text-[#e8dcc8]/40 hover:bg-white/5'
                        : 'border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/20'
                    }`}>
                    {col.isActive ? '비활성화' : '활성화'}
                  </button>
                  <button onClick={() => deleteItem(col.collectionId, col.title)}
                    className="px-2 py-1 text-[9px] border border-red-400/30 text-red-400/60 hover:bg-red-400/10 transition-all">
                    <Trash2 size={9}/>
                  </button>
                </div>
              </div>
            ))
      }
    </div>
  );
}


function SignatureEditor({ collectionId, onClose, onSaved }) {
  const isNew = !collectionId;
  const [activeTab, setActiveTab] = useState('basic');
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(!isNew);

  const [form, setForm] = useState({
    title: 'AION SIGNATURE',
    description: 'AION을 대표하는 시그니처 향수 라인',
    textColor: '#c9a961',
    isPublished: true,
    isActive: true,
  });
  const [mediaList, setMediaList] = useState([]);
  const [textBlocks, setTextBlocks] = useState([]);
  const [textInput, setTextInput] = useState({
    content: '', fontSize: 'xlarge', fontWeight: 'bold',
    isItalic: true, positionX: '50%', positionY: '50%',
  });

  const [allPerfumes, setAllPerfumes] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [selectedPerfumes, setSelectedPerfumes] = useState([]);
  const [perfumeSearch, setPerfumeSearch] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    loadMasterData();
    if (!isNew) loadSignature();
    else setLoadingData(false);
  }, []);

  const loadMasterData = async () => {
    try {
      const { data: perfumes } = await supabase.from('Perfumes')
        .select('perfume_id, name, name_en, price, sale_price, sale_rate, brand_id')
        .eq('is_active', true).order('name');
      const brandIds = [...new Set(perfumes?.map(p => p.brand_id).filter(Boolean))];
      const { data: brands } = await supabase.from('Brands')
        .select('brand_id, brand_name').in('brand_id', brandIds).order('brand_name');
      const brandMap = Object.fromEntries(brands?.map(b => [b.brand_id, b.brand_name]) || []);
      const perfumeIds = perfumes?.map(p => p.perfume_id) || [];
      const { data: images } = await supabase.from('Perfume_Images')
        .select('perfume_id, image_url').in('perfume_id', perfumeIds).eq('is_thumbnail', true);
      const imgMap = Object.fromEntries(images?.map(i => [i.perfume_id, i.image_url]) || []);
      const { data: ptags } = await supabase.from('Perfume_Tags')
        .select('perfume_id, tag_id').in('perfume_id', perfumeIds);
      const tagMap = {};
      ptags?.forEach(pt => { if (!tagMap[pt.perfume_id]) tagMap[pt.perfume_id] = []; tagMap[pt.perfume_id].push(pt.tag_id); });
      setAllBrands(brands || []);
      setAllPerfumes(perfumes?.map(p => ({
        ...p,
        brand_name: brandMap[p.brand_id] || '브랜드 없음',
        thumbnail: imgMap[p.perfume_id],
        tag_ids: tagMap[p.perfume_id] || [],
      })) || []);
      const { data: tags } = await supabase.from('Preference_Tags')
        .select('tag_id, tag_name').eq('is_active', true).order('tag_name');
      setAllTags(tags || []);
    } catch (err) { console.error('마스터 데이터 로드 실패:', err); }
  };


  const loadSignature = async () => {
    setLoadingData(true);
    try {
      const authHeader = await getAuthHeader();
      if (!authHeader) throw new Error('로그인이 필요합니다');
      const res = await fetch(`${API_BASE}/api/signature/${collectionId}`, { headers: authHeader });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      const c = json.data;
      setForm({
        title: c.title || 'AION SIGNATURE',
        description: c.description || '',
        textColor: c.textColor || '#c9a961',
        isPublished: c.isPublished ?? true,
        isActive: c.isActive ?? true,
      });
      setMediaList((c.mediaList || []).map(m => ({ ...m, _id: m.mediaId })));
      setTextBlocks((c.textBlocks || []).map(t => ({ ...t, _id: t.textBlockId })));
      setSelectedPerfumes((c.perfumes || []).map(p => ({
        perfume_id: p.perfumeId, name: p.name, name_en: p.nameEn,
        price: p.price, sale_price: p.salePrice, sale_rate: p.saleRate,
        brand_name: p.brandName, thumbnail: p.thumbnail,
        display_order: p.displayOrder, is_featured: p.isFeatured,
      })));
    } catch (err) { alert('시그니처 로드 실패: ' + err.message); }
    finally { setLoadingData(false); }
  };

  const addMedia = ({ mediaUrl, mediaType }) =>
    setMediaList(prev => [...prev, { _id: `tmp_${Date.now()}`, mediaUrl, mediaType: mediaType || 'IMAGE', displayOrder: prev.length }]);

  const moveMedia = (idx, dir) => setMediaList(prev => {
    const list = [...prev]; const ni = dir === 'up' ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= list.length) return prev;
    [list[idx], list[ni]] = [list[ni], list[idx]];
    return list.map((m, i) => ({ ...m, displayOrder: i }));
  });

  const addTextBlock = () => {
    if (!textInput.content.trim()) { alert('텍스트를 입력하세요'); return; }
    setTextBlocks(prev => [...prev, { _id: `tmp_${Date.now()}`, ...textInput, displayOrder: prev.length }]);
    setTextInput({ content: '', fontSize: 'xlarge', fontWeight: 'bold', isItalic: true, positionX: '50%', positionY: '50%' });
  };

  const filteredPerfumes = allPerfumes.filter(p => {
    const q = perfumeSearch.toLowerCase();
    return (!q || p.name?.toLowerCase().includes(q) || p.name_en?.toLowerCase().includes(q) || p.brand_name?.toLowerCase().includes(q))
      && (!brandFilter || String(p.brand_id) === brandFilter)
      && (!tagFilter || p.tag_ids?.includes(Number(tagFilter)));
  });

  const togglePerfume = (p) => setSelectedPerfumes(prev => {
    const exists = prev.some(sp => sp.perfume_id === p.perfume_id);
    return exists
      ? prev.filter(sp => sp.perfume_id !== p.perfume_id)
      : [...prev, { ...p, display_order: prev.length, is_featured: false }];
  });

  const movePerfume = (idx, dir) => setSelectedPerfumes(prev => {
    const list = [...prev]; const ni = dir === 'up' ? idx - 1 : idx + 1;
    if (ni < 0 || ni >= list.length) return prev;
    [list[idx], list[ni]] = [list[ni], list[idx]];
    return list.map((p, i) => ({ ...p, display_order: i }));
  });


  const handleSave = async () => {
    if (!form.title.trim()) { alert('제목을 입력하세요'); return; }
    if (mediaList.length === 0) { alert('배경 이미지를 최소 1개 추가하세요'); return; }
    const authHeader = await getAuthHeader();
    if (!authHeader) { alert('로그인이 필요합니다.'); return; }
    setSaving(true);
    const body = {
      title: form.title,
      description: form.description || null,
      type: 'SIGNATURE',
      textColor: form.textColor,
      isPublished: form.isPublished,
      isActive: form.isActive,
      mediaList: mediaList.map((m, i) => ({
        mediaUrl: m.mediaUrl, mediaType: m.mediaType || 'IMAGE', displayOrder: i,
      })),
      textBlocks: textBlocks.map((t, i) => ({
        content: t.content, fontSize: t.fontSize, fontWeight: t.fontWeight,
        isItalic: t.isItalic ?? false, positionX: t.positionX, positionY: t.positionY, displayOrder: i,
      })),
      perfumes: selectedPerfumes.map((p, i) => ({
        perfumeId: p.perfume_id, displayOrder: i, isFeatured: p.is_featured || false,
      })),
    };
    try {
      const url = isNew
        ? `${API_BASE}/api/signature`
        : `${API_BASE}/api/signature/${collectionId}`;
      const res = await fetch(url, {
        method: isNew ? 'POST' : 'PUT',
        headers: { 'Content-Type': 'application/json', ...authHeader },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      alert('저장되었습니다!');
      onSaved?.();
      onClose();
    } catch (err) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#c9a961] mx-auto mb-3"/>
          <p className="text-[#e8dcc8]/60 text-sm italic">데이터 불러오는 중...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'basic',    label: '기본 정보' },
    { id: 'media',    label: `이미지 (${mediaList.length})` },
    { id: 'text',     label: `문구 (${textBlocks.length})` },
    { id: 'perfumes', label: `향수 (${selectedPerfumes.length})` },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="w-full max-w-3xl bg-[#1a1714] text-[#e8dcc8] border border-[#c9a961]/30 shadow-2xl my-auto">

        <div className="flex justify-between items-center px-8 py-5 border-b border-[#c9a961]/20">
          <div>
            <p className="text-[#c9a961] text-[9px] tracking-[0.6em] mb-1">ADMIN · SIGNATURE EDITOR</p>
            <h2 className="text-base tracking-[0.25em]">
              {isNew ? '새 시그니처 만들기' : '시그니처 편집'}
            </h2>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#c9a961] text-[#1a1714] text-[10px] tracking-widest hover:bg-[#b89851] transition-all disabled:opacity-50">
              <Save size={13}/> {saving ? '저장중...' : '저장'}
            </button>
            <button onClick={onClose} className="p-2 text-[#e8dcc8]/40 hover:text-white">
              <X size={18}/>
            </button>
          </div>
        </div>

        <div className="flex border-b border-[#c9a961]/15 overflow-x-auto">
          {tabs.map(({ id, label }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`px-5 py-3.5 text-[10px] tracking-[0.2em] border-b-2 transition-colors whitespace-nowrap ${
                activeTab === id
                  ? 'text-[#c9a961] border-[#c9a961]'
                  : 'text-[#e8dcc8]/40 border-transparent hover:text-[#e8dcc8]/70'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-8 space-y-6">

          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">제목</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-3 text-sm focus:border-[#c9a961] outline-none"/>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">설명</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-3 text-sm focus:border-[#c9a961] outline-none resize-none"/>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">텍스트 색상</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })}
                    className="w-10 h-10 border-none bg-transparent cursor-pointer"/>
                  <input value={form.textColor} onChange={e => setForm({ ...form, textColor: e.target.value })}
                    placeholder="#c9a961" className="flex-1 bg-black/30 border border-[#c9a961]/25 px-4 py-2.5 text-sm focus:border-[#c9a961] outline-none"/>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={e => setForm({ ...form, isPublished: e.target.checked })}
                    className="w-4 h-4 accent-[#c9a961]"/>
                  <span className="text-sm text-[#e8dcc8]">공개</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 accent-[#c9a961]"/>
                  <span className="text-sm text-[#e8dcc8]">활성화 (히어로에 표시)</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-5">
              <div className="bg-[#c9a961]/5 border border-[#c9a961]/20 px-4 py-3 text-[10px] text-[#c9a961]/70 tracking-wider">
                💡 여러 장 추가 시 히어로 섹션에서 5초마다 슬라이드됩니다.
              </div>
              <MediaUploader onAdd={addMedia}/>
              <div className="space-y-2">
                {mediaList.map((m, i) => (
                  <div key={m._id || i} className="flex items-center gap-3 p-3 border border-[#c9a961]/15 bg-black/20">
                    <span className="text-[10px] text-[#c9a961]/40 w-4">{i + 1}</span>
                    <img src={m.mediaUrl} alt="" className="w-16 h-10 object-cover flex-shrink-0"/>
                    <span className="flex-1 text-xs text-[#e8dcc8]/50 truncate">{m.mediaUrl}</span>
                    <span className="text-[9px] text-[#c9a961]/40 px-2 py-0.5 border border-[#c9a961]/20">{m.mediaType}</span>
                    <div className="flex gap-1">
                      <button onClick={() => moveMedia(i, 'up')} disabled={i === 0} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={13}/></button>
                      <button onClick={() => moveMedia(i, 'down')} disabled={i === mediaList.length - 1} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={13}/></button>
                      <button onClick={() => setMediaList(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400/70 hover:text-red-400"><X size={13}/></button>
                    </div>
                  </div>
                ))}
                {mediaList.length === 0 && <p className="text-center text-[#e8dcc8]/25 py-10 italic text-sm">배경 이미지를 추가하세요</p>}
              </div>
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-5">
              <div className="bg-[#c9a961]/5 border border-[#c9a961]/20 px-4 py-3 text-[10px] text-[#c9a961]/70 tracking-wider">
                💡 문구는 선택사항입니다. 없으면 제목이 자동 표시됩니다. 여러 개 추가 시 5초마다 슬라이드됩니다.
              </div>
              <div className="border border-[#c9a961]/20 p-5">
                <div className="space-y-3">
                  <input value={textInput.content} onChange={e => setTextInput({ ...textInput, content: e.target.value })}
                    placeholder="예: SIGNATURE"
                    className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25"/>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">크기</label>
                      <select value={textInput.fontSize} onChange={e => setTextInput({ ...textInput, fontSize: e.target.value })}
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none">
                        {[['small','작게'],['medium','보통'],['large','크게'],['xlarge','매우 크게']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">두께</label>
                      <select value={textInput.fontWeight} onChange={e => setTextInput({ ...textInput, fontWeight: e.target.value })}
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none">
                        {[['light','얇게'],['normal','보통'],['medium','중간'],['bold','굵게']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">X 위치</label>
                      <input value={textInput.positionX} onChange={e => setTextInput({ ...textInput, positionX: e.target.value })}
                        placeholder="50%" className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none"/>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">Y 위치</label>
                      <input value={textInput.positionY} onChange={e => setTextInput({ ...textInput, positionY: e.target.value })}
                        placeholder="45%" className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none"/>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={textInput.isItalic} onChange={e => setTextInput({ ...textInput, isItalic: e.target.checked })}
                        className="w-3.5 h-3.5 accent-[#c9a961]"/>
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
                    <span className="text-[10px] text-[#c9a961]/40 w-4">{i + 1}</span>
                    <p className={`flex-1 ${FONT_SIZE_CLASS[block.fontSize]} ${FONT_WEIGHT_CLASS[block.fontWeight]} ${block.isItalic ? 'italic' : ''}`}
                      style={{ color: form.textColor }}>{block.content}</p>
                    <div className="flex gap-1">
                      <button onClick={() => setTextBlocks(prev => { const l=[...prev]; if(i>0){[l[i],l[i-1]]=[l[i-1],l[i]];} return l; })} disabled={i === 0} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={14}/></button>
                      <button onClick={() => setTextBlocks(prev => { const l=[...prev]; if(i<l.length-1){[l[i],l[i+1]]=[l[i+1],l[i]];} return l; })} disabled={i === textBlocks.length - 1} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={14}/></button>
                      <button onClick={() => setTextBlocks(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400/70 hover:text-red-400"><X size={14}/></button>
                    </div>
                  </div>
                ))}
                {textBlocks.length === 0 && <p className="text-center text-[#e8dcc8]/25 py-10 italic text-sm">문구를 추가하세요 (없으면 제목 표시)</p>}
              </div>
            </div>
          )}

          {activeTab === 'perfumes' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e8dcc8]/30"/>
                  <input value={perfumeSearch} onChange={e => setPerfumeSearch(e.target.value)}
                    placeholder="향수명 · 브랜드 검색"
                    className="w-full bg-black/30 border border-[#c9a961]/25 pl-9 pr-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25"/>
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
                            ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-center justify-center text-[#c9a961]/30 text-lg">{p.name?.charAt(0)}</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#e8dcc8] truncate">{p.name}</p>
                          <p className="text-[10px] text-[#e8dcc8]/40">{p.brand_name} · {fmtKRW(p.price)}</p>
                        </div>
                        {selected && <Check size={14} className="text-[#c9a961] flex-shrink-0"/>}
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
                  <p className="text-[10px] tracking-[0.4em] text-[#c9a961] mb-3">선택된 향수 ({selectedPerfumes.length}개)</p>
                  <div className="space-y-1.5">
                    {selectedPerfumes.map((p, i) => (
                      <div key={p.perfume_id} className="flex items-center gap-3 px-4 py-2.5 border border-[#c9a961]/15 bg-black/20">
                        <span className="text-[10px] text-[#c9a961]/60 w-5 text-center">{i + 1}</span>
                        <div className="w-8 h-8 flex-shrink-0 overflow-hidden bg-black/40">
                          {p.thumbnail
                            ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover"/>
                            : <div className="w-full h-full flex items-center justify-center text-[#c9a961]/30">{p.name?.charAt(0)}</div>
                          }
                        </div>
                        <p className="flex-1 text-xs text-[#e8dcc8] truncate">{p.name}</p>
                        <p className="text-[10px] text-[#e8dcc8]/40 hidden md:block">{p.brand_name}</p>
                        <button
                          onClick={() => setSelectedPerfumes(prev => prev.map(sp => sp.perfume_id === p.perfume_id ? { ...sp, is_featured: !sp.is_featured } : sp))}
                          className={`p-1.5 transition-colors ${p.is_featured ? 'text-[#c9a961]' : 'text-[#e8dcc8]/20 hover:text-[#c9a961]/60'}`}
                          title="대표 향수 설정">
                          <Star size={13} className={p.is_featured ? 'fill-[#c9a961]' : ''}/>
                        </button>
                        <div className="flex gap-1">
                          <button onClick={() => movePerfume(i, 'up')} disabled={i === 0} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={13}/></button>
                          <button onClick={() => movePerfume(i, 'down')} disabled={i === selectedPerfumes.length - 1} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={13}/></button>
                          <button onClick={() => setSelectedPerfumes(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400/70 hover:text-red-400"><X size={13}/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}


export default function Signature() {
  const isAdmin = checkIsAdmin();
  const navigate = useNavigate();

  const [signature, setSignature] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mediaIdx, setMediaIdx] = useState(0);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [listPanelOpen, setListPanelOpen] = useState(false);


  const fetchSignature = useCallback(async () => {
    setLoading(true);
    try {
      let data = null;

      if (isAdmin) {
        const authHeader = await getAuthHeader();
        if (!authHeader) { setSignature(null); return; }


        const resActive = await fetch(`${API_BASE}/api/signature/active`, { headers: authHeader });
        if (resActive.ok) {
          const jsonActive = await resActive.json();
          if (jsonActive.success && jsonActive.data) data = jsonActive.data;
        }


        if (!data) {
          const resList = await fetch(`${API_BASE}/api/signature`, { headers: authHeader });
          if (resList.ok) {
            const jsonList = await resList.json();
            const summaries = jsonList.success ? (jsonList.data || []) : [];
            if (summaries.length > 0) {
              const target = summaries.find(s => s.isActive) || summaries[0];
              try {
                const r = await fetch(`${API_BASE}/api/signature/${target.collectionId}`, { headers: authHeader });
                if (r.ok) { const j = await r.json(); if (j.success) data = j.data; }
              } catch (_) {}
              if (!data) {
                data = {
                  collectionId: target.collectionId,
                  title: target.title,
                  description: target.description,
                  type: target.type,
                  textColor: '#c9a961',
                  isPublished: target.isPublished,
                  isActive: target.isActive,
                  mediaList: [],
                  textBlocks: [],
                  perfumes: [],
                };
              }
            }
          }
        }
      } else {

        const res = await fetch(`${API_BASE}/api/signature/active`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) data = json.data;
        }
      }

      setSignature(data);
      setMediaIdx(0);
    } catch (err) {
      console.error('시그니처 로드 실패:', err);
      setSignature(null);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchSignature(); }, [fetchSignature]);

  const mediaList = signature?.mediaList || [];
  useEffect(() => {
    if (mediaList.length <= 1) return;
    const t = setInterval(() => setMediaIdx(p => (p + 1) % mediaList.length), 5000);
    return () => clearInterval(t);
  }, [mediaList.length]);

  const handleOpenEditor = (id = null) => {
    setEditingId(id);
    setEditorOpen(true);
    setListPanelOpen(false);
  };

  const textBlocks = signature?.textBlocks || [];
  const perfumes = signature?.perfumes || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4"/>
          <p className="text-[#8b8278] italic text-sm">시그니처를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3]" style={{ marginTop: '-2px' }}>

      <div className="relative h-[72vh] overflow-hidden">

        {!signature && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2620] via-[#3d3228] to-[#2a2620] flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c9a961]/40"/>
                <div className="mx-3 text-[#c9a961]/40 text-sm">✦</div>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c9a961]/40"/>
              </div>
              <h1 className="text-4xl md:text-6xl tracking-[0.4em] mb-4 text-[#c9a961]/60 font-light">SIGNATURE</h1>
              <p className="text-sm text-[#e8dcc8]/30 italic tracking-widest">
                {isAdmin ? '시그니처를 만들어보세요' : '준비 중입니다'}
              </p>
            </div>
          </div>
        )}

        {mediaList.map((m, i) => (
          <div key={m.mediaId || i}
            className={`absolute inset-0 transition-opacity duration-[2000ms] ${i === mediaIdx ? 'opacity-100' : 'opacity-0'}`}>
            <img src={m.mediaUrl} alt="" className="w-full h-full object-cover"/>
          </div>
        ))}
        {mediaList.length > 0 && (
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"/>
        )}

        {signature && (
          <div className="relative h-full pointer-events-none">
            {textBlocks.length > 0 ? (
              textBlocks.map((b, i) => (
                <div key={b.textBlockId || i} className="absolute"
                  style={{ left: b.positionX, top: b.positionY, transform: 'translate(-50%,-50%)', color: signature.textColor }}>
                  <p className={`${FONT_SIZE_CLASS[b.fontSize]} ${FONT_WEIGHT_CLASS[b.fontWeight]} ${b.isItalic ? 'italic' : ''} tracking-widest drop-shadow-lg text-center px-4`}>
                    {b.content}
                  </p>
                </div>
              ))
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#c9a961]/60"/>
                    <div className="mx-3 text-[#c9a961]/60 text-xs">✦</div>
                    <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#c9a961]/60"/>
                  </div>
                  <h1 className="text-4xl md:text-6xl tracking-[0.3em] mb-3 drop-shadow-lg"
                    style={{ color: signature.textColor }}>
                    {signature.title}
                  </h1>
                  {signature.description && (
                    <p className="text-base italic tracking-wider drop-shadow-lg opacity-80"
                      style={{ color: signature.textColor }}>
                      {signature.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {mediaList.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {mediaList.map((_, i) => (
              <button key={i} onClick={() => setMediaIdx(i)}
                className={`rounded-full transition-all ${i === mediaIdx ? 'bg-[#c9a961] w-6 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`}/>
            ))}
          </div>
        )}

        {isAdmin && (
          <div className="absolute top-5 right-5 z-30 flex flex-col gap-2 items-end">
            <button onClick={() => handleOpenEditor(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-black/75 text-[#c9a961] border border-[#c9a961]/60 text-[10px] tracking-widest hover:bg-[#c9a961] hover:text-black transition-all shadow-lg">
              <Plus size={13}/> 새 시그니처 만들기
            </button>
            {signature && (
              <button onClick={() => handleOpenEditor(signature.collectionId)}
                className="flex items-center gap-2 px-4 py-2.5 bg-black/75 text-[#c9a961] border border-[#c9a961]/60 text-[10px] tracking-widest hover:bg-[#c9a961] hover:text-black transition-all shadow-lg">
                <Edit2 size={13}/> 현재 시그니처 편집
              </button>
            )}
            <div className="relative">
              <button onClick={() => setListPanelOpen(p => !p)}
                className={`flex items-center gap-2 px-4 py-2.5 border text-[10px] tracking-widest transition-all shadow-lg ${
                  listPanelOpen
                    ? 'bg-[#c9a961] text-black border-[#c9a961]'
                    : 'bg-black/75 text-[#c9a961] border-[#c9a961]/60 hover:bg-[#c9a961] hover:text-black'
                }`}>
                <Filter size={13}/> 시그니처 목록 관리
              </button>
              {listPanelOpen && (
                <SignatureListPanel
                  onClose={() => setListPanelOpen(false)}
                  onEdit={handleOpenEditor}
                  onRefresh={fetchSignature}
                />
              )}
            </div>
          </div>
        )}
      </div>

      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent"/>
            <div className="mx-4 text-[#c9a961] text-xs">✦</div>
            <div className="h-[1px] w-16 bg-gradient-to-l from-transparent via-[#c9a961] to-transparent"/>
          </div>
          <h2 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-2">
            {signature?.title || 'SIGNATURE'}
          </h2>
          {signature?.description && (
            <p className="text-sm italic text-[#8b8278] tracking-wide">{signature.description}</p>
          )}
        </div>

        {perfumes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-[#8b8278] italic">
              {isAdmin ? '편집 패널에서 향수를 추가하세요' : '준비 중입니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {perfumes.map((p) => (
              <div key={p.perfumeId} className="group cursor-pointer"
                onClick={() => navigate('/collections', { state: { targetPerfumeId: p.perfumeId } })}>
                <div className="relative overflow-hidden mb-4 bg-white shadow-sm border border-[#c9a961]/10">
                  <div className="aspect-square">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] flex items-center justify-center">
                        <span className="text-6xl text-[#c9a961]/20">{p.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  {p.isFeatured && (
                    <div className="absolute top-4 left-4 bg-[#c9a961] text-white p-1">
                      <Star size={10} className="fill-white"/>
                    </div>
                  )}
                  {p.saleRate > 0 && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-2.5 py-1 text-[10px] font-bold tracking-wider">
                      {p.saleRate}% OFF
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300"/>
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8b8278] mb-1 tracking-wider">{p.brandName}</p>
                  <h3 className="text-base font-medium text-[#2a2620] mb-1 tracking-wide">{p.name}</h3>
                  {p.nameEn && <p className="text-xs text-[#c9a961] italic mb-2">{p.nameEn}</p>}
                  <div className="flex items-center justify-center gap-2">
                    {p.saleRate > 0 ? (
                      <>
                        <span className="text-sm text-gray-400 line-through">{fmtKRW(p.price)}</span>
                        <span className="text-base font-semibold text-[#c9a961]">{fmtKRW(p.salePrice)}</span>
                      </>
                    ) : (
                      <span className="text-base font-semibold text-[#c9a961]">{fmtKRW(p.price)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center pb-16">
        <div className="h-[1px] w-24 bg-gradient-to-r from-transparent via-[#c9a961]/40 to-transparent"/>
        <div className="mx-4 text-[#c9a961]/30 text-xs">✦</div>
        <div className="h-[1px] w-24 bg-gradient-to-l from-transparent via-[#c9a961]/40 to-transparent"/>
      </div>

      {editorOpen && (
        <SignatureEditor
          collectionId={editingId}
          onClose={() => setEditorOpen(false)}
          onSaved={fetchSignature}
        />
      )}
    </div>
  );
}