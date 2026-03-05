/**
 * Collections.jsx — 리뉴얼
 * - 관리자/유저 모두 전체 활성 컬렉션 목록 표시
 * - 상단 히어로: 5초마다 컬렉션 대표이미지+문구 자동 전환
 * - 하단 그리드: 컬렉션별 카드(대표이미지 + 향수 최대3개 + 제목)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Plus, X, Search, Check, ChevronUp, ChevronDown,
  Star, Save, Eye, Filter, Edit2, Trash2,
  Calendar, Upload, Link, ChevronLeft, ChevronRight,
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

const fmtDatetimeLocal = (iso) => {
  if (!iso) return '';
  if (Array.isArray(iso)) {
    const [y, mo, d, h = 0, mi = 0] = iso;
    return `${y}-${String(mo).padStart(2,'0')}-${String(d).padStart(2,'0')}T${String(h).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;
  }
  return iso.slice(0, 16);
};
const localToISO = (local) => (!local ? null : local.length === 16 ? local + ':00' : local);

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
  const path = `collections/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('업로드 실패: ' + error.message);
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
};

// ─────────────────────────────────────────────────────────────
// 미디어 업로더
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
        {[['drop','파일 업로드',<Upload size={11}/>],['url','URL 입력',<Link size={11}/>]].map(([m,label,icon])=>(
          <button key={m} onClick={()=>setMode(m)}
            className={`px-4 py-1.5 text-[10px] tracking-widest border transition-all flex items-center gap-1.5 ${mode===m?'bg-[#c9a961]/20 border-[#c9a961]/60 text-[#c9a961]':'border-[#c9a961]/20 text-[#e8dcc8]/40 hover:border-[#c9a961]/40'}`}>
            {icon} {label}
          </button>
        ))}
      </div>
      {mode === 'drop' && (
        <div onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)}
          onDrop={e=>{e.preventDefault();setDragging(false);handleFiles(e.dataTransfer.files);}}
          onClick={()=>document.getElementById('col-img-upload').click()}
          className={`border-2 border-dashed p-8 text-center cursor-pointer transition-all ${dragging?'border-[#c9a961] bg-[#c9a961]/10':'border-[#c9a961]/30 hover:bg-white/5'}`}>
          {uploading
            ? <p className="text-[#c9a961] text-sm tracking-widest animate-pulse">업로드 중...</p>
            : <><Upload size={24} className="mx-auto mb-2 text-[#c9a961]/40"/>
               <p className="text-sm text-[#c9a961] tracking-widest mb-1">이미지를 드래그하거나 클릭</p>
               <p className="text-[10px] text-[#e8dcc8]/30">JPG · PNG · GIF · 여러 장 가능</p></>
          }
          <input id="col-img-upload" type="file" accept="image/*" multiple hidden onChange={e=>handleFiles(e.target.files)}/>
        </div>
      )}
      {mode === 'url' && (
        <div className="flex gap-2">
          <select value={mediaType} onChange={e=>setMediaType(e.target.value)}
            className="bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] outline-none">
            <option value="IMAGE">이미지</option>
            <option value="GIF">GIF</option>
          </select>
          <input value={urlInput} onChange={e=>setUrlInput(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addByUrl()} placeholder="https://..."
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

// ─────────────────────────────────────────────────────────────
// 컬렉션 에디터 (기존과 동일, type 고정)
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
  }, []);

  const loadMasterData = async () => {
    try {
      const { data: perfumes } = await supabase.from('Perfumes')
        .select('perfume_id, name, name_en, price, sale_price, sale_rate, brand_id')
        .eq('is_active', true).order('name');
      const brandIds = [...new Set(perfumes?.map(p => p.brand_id).filter(Boolean))];
      const { data: brands } = await supabase.from('Brands').select('brand_id, brand_name').in('brand_id', brandIds).order('brand_name');
      const brandMap = Object.fromEntries(brands?.map(b => [b.brand_id, b.brand_name]) || []);
      const perfumeIds = perfumes?.map(p => p.perfume_id) || [];
      const { data: images } = await supabase.from('Perfume_Images').select('perfume_id, image_url').in('perfume_id', perfumeIds).eq('is_thumbnail', true);
      const imgMap = Object.fromEntries(images?.map(i => [i.perfume_id, i.image_url]) || []);
      const { data: ptags } = await supabase.from('Perfume_Tags').select('perfume_id, tag_id').in('perfume_id', perfumeIds);
      const tagMap = {};
      ptags?.forEach(pt => { if (!tagMap[pt.perfume_id]) tagMap[pt.perfume_id] = []; tagMap[pt.perfume_id].push(pt.tag_id); });
      setAllBrands(brands || []);
      setAllPerfumes(perfumes?.map(p => ({ ...p, brand_name: brandMap[p.brand_id]||'브랜드 없음', thumbnail: imgMap[p.perfume_id], tag_ids: tagMap[p.perfume_id]||[] })) || []);
      const { data: tags } = await supabase.from('Preference_Tags').select('tag_id, tag_name').eq('is_active', true).order('tag_name');
      setAllTags(tags || []);
    } catch (err) { console.error('마스터 데이터 로드 실패:', err); }
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
      setForm({ title: c.title, description: c.description||'', textColor: c.textColor||'#c9a961', isPublished: c.isPublished??false, isActive: c.isActive??false, visibleFrom: fmtDatetimeLocal(c.visibleFrom), visibleUntil: fmtDatetimeLocal(c.visibleUntil) });
      setMediaList((c.mediaList||[]).map(m=>({...m,_id:m.mediaId})));
      setTextBlocks((c.textBlocks||[]).map(t=>({...t,_id:t.textBlockId})));
      setSelectedPerfumes((c.perfumes||[]).map(p=>({ perfume_id:p.perfumeId, name:p.name, name_en:p.nameEn, price:p.price, sale_price:p.salePrice, sale_rate:p.saleRate, brand_name:p.brandName, thumbnail:p.thumbnail, display_order:p.displayOrder, is_featured:p.isFeatured })));
    } catch (err) { alert('컬렉션 로드 실패: ' + err.message); }
    finally { setLoadingData(false); }
  };

  const addMedia = ({ mediaUrl, mediaType }) =>
    setMediaList(prev => [...prev, { _id:`tmp_${Date.now()}`, mediaUrl, mediaType:mediaType||'IMAGE', displayOrder:prev.length }]);

  const moveMedia = (idx, dir) => setMediaList(prev => {
    const list = [...prev]; const ni = dir==='up'?idx-1:idx+1;
    if (ni<0||ni>=list.length) return prev;
    [list[idx],list[ni]]=[list[ni],list[idx]];
    return list.map((m,i)=>({...m,displayOrder:i}));
  });

  const addTextBlock = () => {
    if (!textInput.content.trim()) { alert('텍스트를 입력하세요'); return; }
    setTextBlocks(prev=>[...prev,{_id:`tmp_${Date.now()}`,...textInput,displayOrder:prev.length}]);
    setTextInput({ content:'', fontSize:'xlarge', fontWeight:'bold', isItalic:false, positionX:'50%', positionY:'45%' });
  };

  const filteredPerfumes = allPerfumes.filter(p => {
    const q = perfumeSearch.toLowerCase();
    return (!q || p.name?.toLowerCase().includes(q) || p.name_en?.toLowerCase().includes(q) || p.brand_name?.toLowerCase().includes(q))
      && (!brandFilter || String(p.brand_id)===brandFilter)
      && (!tagFilter || p.tag_ids?.includes(Number(tagFilter)));
  });

  const togglePerfume = (p) => setSelectedPerfumes(prev => {
    const exists = prev.some(sp=>sp.perfume_id===p.perfume_id);
    return exists ? prev.filter(sp=>sp.perfume_id!==p.perfume_id) : [...prev,{...p,display_order:prev.length,is_featured:false}];
  });

  const movePerfume = (idx, dir) => setSelectedPerfumes(prev => {
    const list=[...prev]; const ni=dir==='up'?idx-1:idx+1;
    if(ni<0||ni>=list.length) return prev;
    [list[idx],list[ni]]=[list[ni],list[idx]];
    return list.map((p,i)=>({...p,display_order:i}));
  });

  const handleSave = async () => {
    if (!form.title.trim()) { alert('제목을 입력하세요'); return; }
    if (mediaList.length === 0) { alert('배경 이미지를 최소 1개 추가하세요'); return; }
    const authHeader = await getAuthHeader();
    if (!authHeader) { alert('로그인이 필요합니다.'); return; }
    setSaving(true);
    const body = {
      title: form.title, description: form.description||null, type: 'COLLECTION',
      textColor: form.textColor, isPublished: form.isPublished, isActive: form.isActive,
      visibleFrom: localToISO(form.visibleFrom), visibleUntil: localToISO(form.visibleUntil),
      mediaList: mediaList.map((m,i)=>({ mediaUrl:m.mediaUrl, mediaType:m.mediaType||'IMAGE', displayOrder:i })),
      textBlocks: textBlocks.map((t,i)=>({ content:t.content, fontSize:t.fontSize, fontWeight:t.fontWeight, isItalic:t.isItalic??false, positionX:t.positionX, positionY:t.positionY, displayOrder:i })),
      perfumes: selectedPerfumes.map((p,i)=>({ perfumeId:p.perfume_id, displayOrder:i, isFeatured:p.is_featured||false })),
    };
    try {
      const url = isNew ? `${API_BASE}/api/collections` : `${API_BASE}/api/collections/${collectionId}`;
      const res = await fetch(url, { method:isNew?'POST':'PUT', headers:{'Content-Type':'application/json',...authHeader}, body:JSON.stringify(body) });
      if (!res.ok) { const text=await res.text(); throw new Error(`HTTP ${res.status}: ${text.slice(0,200)}`); }
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      if (json.data?.collectionId) {
        await fetch(`${API_BASE}/api/collections/${json.data.collectionId}/active?activate=${form.isActive}`, { method:'PATCH', headers:authHeader });
      }
      alert(isNew ? '컬렉션이 생성되었습니다!' : '수정 사항이 저장되었습니다!');
      onSaved?.(); onClose();
    } catch (err) { alert('저장 실패: ' + err.message); }
    finally { setSaving(false); }
  };

  if (loadingData) return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961]"/>
    </div>
  );

  const TABS = [
    { id:'basic', label:'기본 정보' },
    { id:'media', label:`배경 미디어${mediaList.length?` (${mediaList.length})`:''}` },
    { id:'text',  label:`문구 (선택)${textBlocks.length?` · ${textBlocks.length}개`:''}` },
    { id:'perfumes', label:`향수 선택${selectedPerfumes.length?` (${selectedPerfumes.length})`:''}` },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="w-full max-w-5xl bg-[#1a1714] text-[#e8dcc8] border border-[#c9a961]/30 shadow-2xl my-auto">
        <div className="flex justify-between items-center px-8 py-5 border-b border-[#c9a961]/20">
          <div>
            <p className="text-[#c9a961] text-[9px] tracking-[0.6em] mb-1">ADMIN · COLLECTION EDITOR</p>
            <h2 className="text-base tracking-[0.25em]">{isNew ? '새 컬렉션 만들기' : '컬렉션 수정'}</h2>
          </div>
          <div className="flex gap-3 items-center">
            <button onClick={()=>setShowPreview(true)}
              className="flex items-center gap-2 px-4 py-2 border border-[#c9a961]/30 text-[#c9a961] text-[10px] tracking-widest hover:bg-[#c9a961]/10 transition-all">
              <Eye size={13}/> 미리보기
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#c9a961] text-[#1a1714] text-[10px] tracking-widest hover:bg-[#b89851] transition-all disabled:opacity-50">
              <Save size={13}/> {saving ? '저장중...' : '저장'}
            </button>
            <button onClick={onClose} className="p-2 text-[#e8dcc8]/40 hover:text-white"><X size={18}/></button>
          </div>
        </div>

        <div className="flex border-b border-[#c9a961]/15 overflow-x-auto">
          {TABS.map(tab=>(
            <button key={tab.id} onClick={()=>setActiveTab(tab.id)}
              className={`px-5 py-3.5 text-[10px] tracking-[0.2em] border-b-2 transition-colors whitespace-nowrap ${activeTab===tab.id?'text-[#c9a961] border-[#c9a961]':'text-[#e8dcc8]/40 border-transparent hover:text-[#e8dcc8]/70'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'basic' && (
            <div className="space-y-5">
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">제목 *</label>
                <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="예: 2026 Spring Collection"
                  className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-3 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25"/>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">소개 문구</label>
                <textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} rows={3}
                  className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-3 text-sm focus:border-[#c9a961] outline-none resize-none placeholder:text-[#e8dcc8]/25"/>
              </div>
              <div>
                <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">텍스트 색상</label>
                <div className="flex gap-3 items-center">
                  <input type="color" value={form.textColor} onChange={e=>setForm({...form,textColor:e.target.value})}
                    className="h-11 w-16 bg-transparent border border-[#c9a961]/25 cursor-pointer"/>
                  <input type="text" value={form.textColor} onChange={e=>setForm({...form,textColor:e.target.value})}
                    className="w-32 bg-black/30 border border-[#c9a961]/25 px-3 py-3 text-sm focus:border-[#c9a961] outline-none"/>
                </div>
              </div>
              <div className="border border-[#c9a961]/20 p-5 space-y-4">
                <p className="text-[10px] tracking-[0.4em] text-[#c9a961] flex items-center gap-2"><Calendar size={12}/> 가시 기간</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[['visibleFrom','노출 시작일시'],['visibleUntil','노출 종료일시']].map(([key,label])=>(
                    <div key={key}>
                      <label className="block text-[9px] text-[#e8dcc8]/50 mb-1.5">{label}</label>
                      <input type="datetime-local" value={form[key]} onChange={e=>setForm({...form,[key]:e.target.value})}
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] focus:border-[#c9a961] outline-none"/>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex gap-8">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isPublished} onChange={e=>setForm({...form,isPublished:e.target.checked})} className="w-4 h-4 accent-[#c9a961]"/>
                  <span className="text-sm text-[#e8dcc8]/70">공개</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={e=>setForm({...form,isActive:e.target.checked})} className="w-4 h-4 accent-[#c9a961]"/>
                  <span className="text-sm text-[#e8dcc8]/70">활성화 (메인 표시)</span>
                </label>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="space-y-5">
              <MediaUploader onAdd={addMedia}/>
              <div className="space-y-2">
                {mediaList.map((m,i)=>(
                  <div key={m._id||i} className="flex items-center gap-3 p-3 border border-[#c9a961]/15 bg-black/20">
                    <div className="w-16 h-16 overflow-hidden bg-black/40 flex-shrink-0">
                      <img src={m.mediaUrl} alt="" className="w-full h-full object-cover" onError={e=>{e.target.style.display='none';}}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] text-[#c9a961]">{i+1}번째</span>
                      <p className="text-xs text-[#e8dcc8]/40 truncate">{m.mediaUrl}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={()=>moveMedia(i,'up')} disabled={i===0} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={14}/></button>
                      <button onClick={()=>moveMedia(i,'down')} disabled={i===mediaList.length-1} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={14}/></button>
                      <button onClick={()=>setMediaList(prev=>prev.filter((_,j)=>j!==i))} className="p-1.5 text-red-400/70 hover:text-red-400"><X size={14}/></button>
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
                💡 문구는 선택사항입니다. 여러 개 추가 시 5초마다 슬라이드됩니다.
              </div>
              <div className="border border-[#c9a961]/20 p-5">
                <div className="space-y-3">
                  <input value={textInput.content} onChange={e=>setTextInput({...textInput,content:e.target.value})} placeholder="예: SPRING 2026"
                    className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25"/>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">크기</label>
                      <select value={textInput.fontSize} onChange={e=>setTextInput({...textInput,fontSize:e.target.value})}
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none">
                        {[['small','작게'],['medium','보통'],['large','크게'],['xlarge','매우 크게']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">두께</label>
                      <select value={textInput.fontWeight} onChange={e=>setTextInput({...textInput,fontWeight:e.target.value})}
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none">
                        {[['light','얇게'],['normal','보통'],['medium','중간'],['bold','굵게']].map(([v,l])=><option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">X 위치</label>
                      <input value={textInput.positionX} onChange={e=>setTextInput({...textInput,positionX:e.target.value})} placeholder="50%"
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none"/>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">Y 위치</label>
                      <input value={textInput.positionY} onChange={e=>setTextInput({...textInput,positionY:e.target.value})} placeholder="45%"
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-2 text-xs text-[#e8dcc8] outline-none"/>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={textInput.isItalic} onChange={e=>setTextInput({...textInput,isItalic:e.target.checked})} className="w-3.5 h-3.5 accent-[#c9a961]"/>
                      <span className="text-xs text-[#e8dcc8]/60 italic">이탤릭체</span>
                    </label>
                    <button onClick={addTextBlock} className="px-5 py-2 bg-[#c9a961]/20 border border-[#c9a961]/40 text-[#c9a961] text-[10px] tracking-widest hover:bg-[#c9a961]/30 transition-all">+ 추가</button>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {textBlocks.map((block,i)=>(
                  <div key={block._id||i} className="flex items-center gap-4 p-4 border border-[#c9a961]/15 bg-black/20">
                    <span className="text-[10px] text-[#c9a961]/40 w-4">{i+1}</span>
                    <p className={`flex-1 ${FONT_SIZE_CLASS[block.fontSize]} ${FONT_WEIGHT_CLASS[block.fontWeight]} ${block.isItalic?'italic':''}`} style={{color:form.textColor}}>{block.content}</p>
                    <div className="flex gap-1">
                      <button onClick={()=>setTextBlocks(prev=>{const l=[...prev];if(i>0){[l[i],l[i-1]]=[l[i-1],l[i]];}return l;})} disabled={i===0} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={14}/></button>
                      <button onClick={()=>setTextBlocks(prev=>{const l=[...prev];if(i<l.length-1){[l[i],l[i+1]]=[l[i+1],l[i]];}return l;})} disabled={i===textBlocks.length-1} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={14}/></button>
                      <button onClick={()=>setTextBlocks(prev=>prev.filter((_,j)=>j!==i))} className="p-1.5 text-red-400/70 hover:text-red-400"><X size={14}/></button>
                    </div>
                  </div>
                ))}
                {textBlocks.length === 0 && <p className="text-center text-[#e8dcc8]/25 py-10 italic text-sm">문구를 추가하세요 (없으면 컬렉션 제목 표시)</p>}
              </div>
            </div>
          )}

          {activeTab === 'perfumes' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e8dcc8]/30"/>
                  <input value={perfumeSearch} onChange={e=>setPerfumeSearch(e.target.value)} placeholder="향수명 · 브랜드 검색"
                    className="w-full bg-black/30 border border-[#c9a961]/25 pl-9 pr-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25"/>
                </div>
                <select value={brandFilter} onChange={e=>setBrandFilter(e.target.value)} className="bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] outline-none">
                  <option value="">전체 브랜드</option>
                  {allBrands.map(b=><option key={b.brand_id} value={String(b.brand_id)}>{b.brand_name}</option>)}
                </select>
                <select value={tagFilter} onChange={e=>setTagFilter(e.target.value)} className="bg-black/30 border border-[#c9a961]/25 px-3 py-2.5 text-sm text-[#e8dcc8] outline-none">
                  <option value="">전체 태그</option>
                  {allTags.map(t=><option key={t.tag_id} value={String(t.tag_id)}>{t.tag_name}</option>)}
                </select>
              </div>
              <div className="border border-[#c9a961]/15 bg-black/20 max-h-72 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {filteredPerfumes.map(p => {
                    const selected = selectedPerfumes.some(sp=>sp.perfume_id===p.perfume_id);
                    return (
                      <div key={p.perfume_id} onClick={()=>togglePerfume(p)}
                        className={`flex items-center gap-3 p-3 cursor-pointer border-b border-[#c9a961]/10 transition-colors ${selected?'bg-[#c9a961]/15':'hover:bg-white/5'}`}>
                        <div className="w-10 h-10 flex-shrink-0 overflow-hidden bg-black/40">
                          {p.thumbnail ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[#c9a961]/30 text-lg">{p.name?.charAt(0)}</div>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-[#e8dcc8] truncate">{p.name}</p>
                          <p className="text-[10px] text-[#e8dcc8]/40">{p.brand_name} · {fmtKRW(p.price)}</p>
                        </div>
                        {selected && <Check size={14} className="text-[#c9a961] flex-shrink-0"/>}
                      </div>
                    );
                  })}
                  {filteredPerfumes.length === 0 && <div className="col-span-2 text-center py-10 text-[#e8dcc8]/25 italic text-sm">검색 결과가 없습니다</div>}
                </div>
              </div>
              {selectedPerfumes.length > 0 && (
                <div>
                  <p className="text-[10px] tracking-[0.4em] text-[#c9a961] mb-3">선택된 향수 ({selectedPerfumes.length}개)</p>
                  <div className="space-y-1.5">
                    {selectedPerfumes.map((p,i)=>(
                      <div key={p.perfume_id} className="flex items-center gap-3 px-4 py-2.5 border border-[#c9a961]/15 bg-black/20">
                        <span className="text-[10px] text-[#c9a961]/60 w-5 text-center">{i+1}</span>
                        <div className="w-8 h-8 flex-shrink-0 overflow-hidden bg-black/40">
                          {p.thumbnail ? <img src={p.thumbnail} alt={p.name} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center text-[#c9a961]/30">{p.name?.charAt(0)}</div>}
                        </div>
                        <p className="flex-1 text-xs text-[#e8dcc8] truncate">{p.name}</p>
                        <button onClick={()=>setSelectedPerfumes(prev=>prev.map(sp=>sp.perfume_id===p.perfume_id?{...sp,is_featured:!sp.is_featured}:sp))}
                          className={`flex items-center gap-1 px-2 py-1 text-[9px] border transition-all ${p.is_featured?'border-[#c9a961] text-[#c9a961] bg-[#c9a961]/15':'border-[#e8dcc8]/20 text-[#e8dcc8]/30 hover:border-[#c9a961]/40'}`}>
                          <Star size={9} className={p.is_featured?'fill-[#c9a961]':''}/> {p.is_featured?'FEATURED':'일반'}
                        </button>
                        <button onClick={()=>movePerfume(i,'up')} disabled={i===0} className="p-1 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={13}/></button>
                        <button onClick={()=>movePerfume(i,'down')} disabled={i===selectedPerfumes.length-1} className="p-1 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={13}/></button>
                        <button onClick={()=>togglePerfume(p)} className="p-1 text-red-400/60 hover:text-red-400"><X size={13}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {showPreview && (
        <div className="fixed inset-0 z-[60] bg-black/90 flex items-center justify-center p-6">
          <div className="bg-[#faf8f3] max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-sm font-semibold text-[#2a2620] tracking-widest">PREVIEW</h3>
              <button onClick={()=>setShowPreview(false)} className="p-2 hover:bg-gray-100"><X size={18}/></button>
            </div>
            <div className="p-6">
              <div className="relative h-72 overflow-hidden mb-6 bg-[#2a2620]">
                {mediaList[0] && <img src={mediaList[0].mediaUrl} alt="" className="w-full h-full object-cover"/>}
                <div className="absolute inset-0 bg-black/30"/>
                {textBlocks.length > 0
                  ? textBlocks.map((b,i)=>(
                    <div key={i} className="absolute" style={{left:b.positionX,top:b.positionY,transform:'translate(-50%,-50%)',color:form.textColor}}>
                      <p className={`${FONT_SIZE_CLASS[b.fontSize]} ${FONT_WEIGHT_CLASS[b.fontWeight]} ${b.isItalic?'italic':''} tracking-widest drop-shadow-lg text-center px-4`}>{b.content}</p>
                    </div>))
                  : form.title && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <p className="text-3xl tracking-[0.3em] drop-shadow-lg" style={{color:form.textColor}}>{form.title}</p>
                    </div>)
                }
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 컬렉션 목록 관리 패널 (관리자용)
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
    } catch (err) { console.error('목록 로드 실패:', err); }
    finally { setLoading(false); }
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
    } catch (err) { alert('삭제 실패: ' + err.message); }
  };

  return (
    <div className="w-80 bg-[#1a1714] border border-[#c9a961]/30 shadow-2xl max-h-[80vh] overflow-y-auto">
      <div className="px-5 py-4 border-b border-[#c9a961]/20 flex justify-between items-center sticky top-0 bg-[#1a1714]">
        <span className="text-[10px] tracking-widest text-[#c9a961]">컬렉션 목록 관리</span>
        <button onClick={onClose} className="text-[#e8dcc8]/40 hover:text-white"><X size={16}/></button>
      </div>
      {loading
        ? <div className="flex justify-center py-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#c9a961]"/></div>
        : list.length === 0
          ? <p className="text-center text-[#e8dcc8]/30 py-10 text-xs italic">등록된 컬렉션 없음</p>
          : list.map(col=>(
            <div key={col.collectionId} className={`border-b border-[#c9a961]/10 px-5 py-4 ${col.isActive?'bg-[#c9a961]/5':''}`}>
              <p className="text-xs text-[#e8dcc8] font-medium truncate mb-1">{col.title}</p>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                {col.isActive && <span className="text-[9px] text-[#c9a961] border border-[#c9a961]/40 px-1.5 py-0.5">활성화</span>}
                {col.isPublished
                  ? <span className="text-[9px] text-emerald-400 border border-emerald-400/40 px-1.5 py-0.5">공개중</span>
                  : <span className="text-[9px] text-[#e8dcc8]/30 border border-[#e8dcc8]/15 px-1.5 py-0.5">비공개</span>}
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <button onClick={()=>onEdit(col.collectionId)}
                  className="flex items-center gap-1 px-2 py-1 text-[9px] border border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/20 transition-all">
                  <Edit2 size={9}/> 편집
                </button>
                <button onClick={()=>toggleActive(col.collectionId, col.isActive)}
                  className={`px-2 py-1 text-[9px] border transition-all ${col.isActive?'border-[#e8dcc8]/20 text-[#e8dcc8]/40 hover:bg-white/5':'border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/20'}`}>
                  {col.isActive ? '비활성화' : '활성화'}
                </button>
                <button onClick={()=>deleteCollection(col.collectionId, col.title)}
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

// ─────────────────────────────────────────────────────────────
// 메인 Collections 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function Collections() {
  const isAdmin = checkIsAdmin();

  // 관리자: 전체 목록, 유저: 활성화된 컬렉션 목록
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  // 히어로 슬라이드: 컬렉션 단위로 5초마다 전환
  const [heroIdx, setHeroIdx] = useState(0);
  // 현재 히어로 컬렉션 내 미디어 슬라이드
  const [mediaIdx, setMediaIdx] = useState(0);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [listPanelOpen, setListPanelOpen] = useState(false);

  // ── 데이터 로드 ──
  const fetchCollections = useCallback(async () => {
    setLoading(true);
    try {
      let data = [];
      if (isAdmin) {
        // 관리자: 전체 목록 가져온 후 각 상세 로드
        const authHeader = await getAuthHeader();
        if (!authHeader) { setCollections([]); return; }
        const res = await fetch(`${API_BASE}/api/collections?type=COLLECTION`, { headers: authHeader });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const summaries = json.success ? (json.data || []) : [];

        // 각 컬렉션의 상세(미디어+향수) 병렬 로드
        const details = await Promise.all(
          summaries.map(async (s) => {
            try {
              const r = await fetch(`${API_BASE}/api/collections/${s.collectionId}`, { headers: authHeader });
              if (!r.ok) return s;
              const j = await r.json();
              return j.success ? j.data : s;
            } catch { return s; }
          })
        );
        data = details;
      } else {
        // 유저: 활성화된 단일 컬렉션 → 같은 type의 활성 컬렉션이 여러 개일 경우 대비해 목록 API도 병행
        // 일단 활성화된 컬렉션 단일 조회
        const res = await fetch(`${API_BASE}/api/collections/active?type=COLLECTION`);
        if (!res.ok) { setCollections([]); return; }
        const json = await res.json();
        data = json.data ? [json.data] : [];
      }
      setCollections(data);
      setHeroIdx(0);
      setMediaIdx(0);
    } catch (err) {
      console.error('컬렉션 로드 실패:', err);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => { fetchCollections(); }, [fetchCollections]);

  // ── 히어로 자동 전환: 5초마다 컬렉션 순환 ──
  useEffect(() => {
    if (collections.length <= 1) return;
    const t = setInterval(() => {
      setHeroIdx(prev => (prev + 1) % collections.length);
      setMediaIdx(0);
    }, 5000);
    return () => clearInterval(t);
  }, [collections.length]);

  // ── 현재 히어로 컬렉션 내 미디어 슬라이드 ──
  const heroCollection = collections[heroIdx] || null;
  const heroMedia = heroCollection?.mediaList || [];
  const heroBlocks = heroCollection?.textBlocks || [];

  useEffect(() => {
    if (heroMedia.length <= 1) return;
    const t = setInterval(() => setMediaIdx(p => (p + 1) % heroMedia.length), 5000);
    return () => clearInterval(t);
  }, [heroMedia.length, heroIdx]);

  const handleOpenEditor = (id = null) => {
    setEditingId(id); setEditorOpen(true); setListPanelOpen(false);
  };

  // ── 히어로 수동 이동 ──
  const goHero = (dir) => {
    setHeroIdx(prev => {
      const next = dir === 'prev'
        ? (prev - 1 + collections.length) % collections.length
        : (prev + 1) % collections.length;
      return next;
    });
    setMediaIdx(0);
  };

  return (
    <div className="min-h-screen bg-[#faf8f3]">

      {/* ══════════════════════════════════════════════════
          히어로 섹션: 5초마다 컬렉션 대표이미지+문구 교체
      ══════════════════════════════════════════════════ */}
      <div className="relative h-[72vh] overflow-hidden">

        {/* 빈 상태 */}
        {!loading && collections.length === 0 && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2620] via-[#3d3228] to-[#2a2620] flex items-center justify-center">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="h-[1px] w-12 bg-gradient-to-r from-transparent to-[#c9a961]/40"/>
                <div className="mx-3 text-[#c9a961]/40 text-sm">✦</div>
                <div className="h-[1px] w-12 bg-gradient-to-l from-transparent to-[#c9a961]/40"/>
              </div>
              <h1 className="text-4xl md:text-6xl tracking-[0.4em] mb-4 text-[#c9a961]/60 font-light">COLLECTION</h1>
              <p className="text-sm text-[#e8dcc8]/30 italic tracking-widest">
                {isAdmin ? '컬렉션을 만들어보세요' : '준비 중입니다'}
              </p>
            </div>
          </div>
        )}

        {/* 히어로 배경 이미지들 - 컬렉션별 페이드 */}
        {collections.map((col, ci) => {
          const media = col.mediaList || [];
          const curMedia = media[ci === heroIdx ? mediaIdx : 0];
          return (
            <div key={col.collectionId}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ${ci === heroIdx ? 'opacity-100' : 'opacity-0'}`}>
              {media.map((m, mi) => (
                <div key={m.mediaId || mi}
                  className={`absolute inset-0 transition-opacity duration-[1500ms] ${mi === (ci === heroIdx ? mediaIdx : 0) ? 'opacity-100' : 'opacity-0'}`}>
                  <img src={m.mediaUrl} alt="" className="w-full h-full object-cover"/>
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60"/>
            </div>
          );
        })}

        {/* 히어로 텍스트 */}
        {heroCollection && (
          <div className="relative h-full pointer-events-none">
            {heroBlocks.length > 0 ? (
              heroBlocks.map((b, i) => (
                <div key={b.textBlockId || i} className="absolute"
                  style={{ left: b.positionX, top: b.positionY, transform: 'translate(-50%,-50%)', color: heroCollection.textColor }}>
                  <p className={`${FONT_SIZE_CLASS[b.fontSize]} ${FONT_WEIGHT_CLASS[b.fontWeight]} ${b.isItalic ? 'italic' : ''} tracking-widest drop-shadow-lg text-center px-4`}>
                    {b.content}
                  </p>
                </div>
              ))
            ) : heroCollection && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center px-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#c9a961]/60"/>
                    <div className="mx-3 text-[#c9a961]/60 text-xs">✦</div>
                    <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#c9a961]/60"/>
                  </div>
                  <h1 className="text-4xl md:text-6xl tracking-[0.3em] mb-3 drop-shadow-lg"
                    style={{ color: heroCollection.textColor }}>
                    {heroCollection.title}
                  </h1>
                  {heroCollection.description && (
                    <p className="text-base italic tracking-wider drop-shadow-lg opacity-80"
                      style={{ color: heroCollection.textColor }}>
                      {heroCollection.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 컬렉션 인디케이터 (하단 도트) */}
        {collections.length > 1 && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-3 z-10">
            <button onClick={() => goHero('prev')}
              className="p-1.5 bg-black/30 text-white/60 hover:text-white hover:bg-black/50 transition-all rounded-full">
              <ChevronLeft size={16}/>
            </button>
            <div className="flex gap-2">
              {collections.map((col, i) => (
                <button key={col.collectionId} onClick={() => { setHeroIdx(i); setMediaIdx(0); }}
                  className={`transition-all duration-300 rounded-full ${i === heroIdx ? 'bg-[#c9a961] w-6 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`}/>
              ))}
            </div>
            <button onClick={() => goHero('next')}
              className="p-1.5 bg-black/30 text-white/60 hover:text-white hover:bg-black/50 transition-all rounded-full">
              <ChevronRight size={16}/>
            </button>
          </div>
        )}

        {/* 컬렉션 제목 탭 (하단 타이틀 목록) */}
        {collections.length > 1 && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent pt-12 pb-14">
            <div className="flex items-center justify-center gap-1 px-4 overflow-x-auto">
              {collections.map((col, i) => (
                <button key={col.collectionId} onClick={() => { setHeroIdx(i); setMediaIdx(0); }}
                  className={`px-4 py-1.5 text-[10px] tracking-widest whitespace-nowrap transition-all border-b-2 ${
                    i === heroIdx ? 'text-[#c9a961] border-[#c9a961]' : 'text-white/50 border-transparent hover:text-white/80'
                  }`}>
                  {col.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* 관리자 버튼 */}
        {isAdmin && (
          <div className="absolute top-5 right-5 z-30 flex flex-col gap-2 items-end">
            <button onClick={() => handleOpenEditor(null)}
              className="flex items-center gap-2 px-4 py-2.5 bg-black/75 text-[#c9a961] border border-[#c9a961]/60 text-[10px] tracking-widest hover:bg-[#c9a961] hover:text-black transition-all shadow-lg">
              <Plus size={13}/> 새 컬렉션 만들기
            </button>
            {heroCollection && (
              <button onClick={() => handleOpenEditor(heroCollection.collectionId)}
                className="flex items-center gap-2 px-4 py-2.5 bg-black/75 text-[#c9a961] border border-[#c9a961]/60 text-[10px] tracking-widest hover:bg-[#c9a961] hover:text-black transition-all shadow-lg">
                <Edit2 size={13}/> 현재 컬렉션 편집
              </button>
            )}
            <button onClick={() => setListPanelOpen(p => !p)}
              className={`flex items-center gap-2 px-4 py-2.5 border text-[10px] tracking-widest transition-all shadow-lg ${
                listPanelOpen ? 'bg-[#c9a961] text-black border-[#c9a961]' : 'bg-black/75 text-[#c9a961] border-[#c9a961]/60 hover:bg-[#c9a961] hover:text-black'
              }`}>
              <Filter size={13}/> 컬렉션 목록 관리
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

      {/* ══════════════════════════════════════════════════
          하단: 컬렉션 카드 그리드
          각 카드 = 대표이미지(상단 절반) + 향수 목록(최대 3개) + 제목
      ══════════════════════════════════════════════════ */}
      {!loading && collections.length > 0 && (
        <div className="max-w-7xl mx-auto px-6 py-20">

          {/* 섹션 헤더 */}
          <div className="text-center mb-16">
            <div className="flex items-center justify-center mb-4">
              <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent"/>
              <div className="mx-4 text-[#c9a961] text-xs">✦</div>
              <div className="h-[1px] w-16 bg-gradient-to-l from-transparent via-[#c9a961] to-transparent"/>
            </div>
            <h2 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-2">COLLECTIONS</h2>
            <p className="text-sm italic text-[#8b8278] tracking-wide">{collections.length}개의 컬렉션</p>
          </div>

          {/* 컬렉션 카드 그리드 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {collections.map((col) => {
              const repMedia = col.mediaList?.[0];
              const perfumes = (col.perfumes || []).slice(0, 3);
              const perfCount = perfumes.length;

              return (
                <div key={col.collectionId} className="group">
                  {/* 카드 본체 */}
                  <div className="border border-[#c9a961]/15 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden">

                    {/* 상단: 대표이미지 (카드 높이의 절반) */}
                    <div className="relative overflow-hidden" style={{ aspectRatio: '16/9' }}>
                      {repMedia ? (
                        <img src={repMedia.mediaUrl} alt={col.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"/>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#2a2620] via-[#3d3228] to-[#2a2620] flex items-center justify-center">
                          <span className="text-[#c9a961]/30 text-4xl tracking-widest">COLLECTION</span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"/>
                      {/* 활성화 뱃지 */}
                      {col.isActive && (
                        <div className="absolute top-4 left-4 bg-[#c9a961] text-white text-[9px] tracking-widest px-2.5 py-1">
                          ACTIVE
                        </div>
                      )}
                    </div>

                    {/* 하단: 향수 목록 */}
                    <div className="p-0">
                      {perfCount === 0 ? (
                        <div className="py-8 text-center text-[#8b8278]/50 text-xs italic">등록된 향수가 없습니다</div>
                      ) : (
                        <div className={`grid divide-x divide-[#c9a961]/10`}
                          style={{ gridTemplateColumns: `repeat(${perfCount}, 1fr)` }}>
                          {perfumes.map((p) => (
                            <div key={p.perfumeId} className="group/perf cursor-pointer p-3 hover:bg-[#faf8f3] transition-colors">
                              {/* 향수 이미지 */}
                              <div className="relative overflow-hidden mb-2" style={{ aspectRatio: '1/1' }}>
                                {p.thumbnail ? (
                                  <img src={p.thumbnail} alt={p.name}
                                    className="w-full h-full object-cover group-hover/perf:scale-110 transition-transform duration-500"/>
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] flex items-center justify-center">
                                    <span className="text-2xl text-[#c9a961]/20">{p.name?.charAt(0)}</span>
                                  </div>
                                )}
                                {p.isFeatured && (
                                  <div className="absolute top-1 right-1 bg-[#c9a961] text-white p-0.5">
                                    <Star size={8} className="fill-white"/>
                                  </div>
                                )}
                                {p.saleRate > 0 && (
                                  <div className="absolute bottom-0 left-0 right-0 bg-red-500/80 text-white text-[8px] text-center py-0.5 tracking-wider">
                                    {p.saleRate}% OFF
                                  </div>
                                )}
                              </div>
                              {/* 향수 정보 */}
                              <div className="text-center">
                                <p className="text-[9px] text-[#8b8278] truncate">{p.brandName}</p>
                                <p className="text-[10px] font-medium text-[#2a2620] truncate leading-tight mt-0.5">{p.name}</p>
                                <p className="text-[10px] text-[#c9a961] font-semibold mt-1">
                                  {p.saleRate > 0 ? fmtKRW(p.salePrice) : fmtKRW(p.price)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 카드 하단: 컬렉션 제목 */}
                  <div className="mt-4 text-center">
                    <div className="flex items-center justify-center mb-2">
                      <div className="h-[1px] w-8 bg-gradient-to-r from-transparent to-[#c9a961]/40"/>
                      <div className="mx-2 text-[#c9a961]/40 text-[10px]">✦</div>
                      <div className="h-[1px] w-8 bg-gradient-to-l from-transparent to-[#c9a961]/40"/>
                    </div>
                    <h3 className="text-base tracking-[0.25em] text-[#2a2620] font-medium">{col.title}</h3>
                    {col.description && (
                      <p className="text-xs italic text-[#8b8278] mt-1 tracking-wide line-clamp-1">{col.description}</p>
                    )}
                    <p className="text-[10px] text-[#8b8278]/60 mt-1">{perfCount}개의 향수</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4"/>
            <p className="text-[#8b8278] italic text-sm">컬렉션을 불러오는 중...</p>
          </div>
        </div>
      )}

      {/* 에디터 */}
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