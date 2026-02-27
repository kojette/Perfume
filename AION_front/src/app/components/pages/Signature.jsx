/**
 * Signature.jsx
 *
 * ─ 데이터 저장소: Supabase 직통 ─
 *
 * 사용 테이블:
 *  - "Collections"           (type = 'SIGNATURE')
 *  - "Collection_Media"      (히어로 이미지)
 *  - "Collection_Text_Blocks" (히어로 문구)
 *  - "Collection_Perfumes"   (브랜드 필터용 향수 연결, 미사용 — 브랜드 직접 필터)
 *  - "Perfumes" + "Brands" + "Perfume_Images" (향수 목록)
 *  - "signature_config"      (브랜드 목록 설정 저장)
 *
 * ── signature_config 테이블 생성 SQL (Supabase SQL Editor에서 실행) ──
 *
 * CREATE TABLE IF NOT EXISTS public."signature_config" (
 *   id        bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 *   key       text NOT NULL UNIQUE,
 *   value     jsonb NOT NULL DEFAULT '[]',
 *   updated_at timestamp with time zone DEFAULT now()
 * );
 * INSERT INTO public."signature_config" (key, value)
 * VALUES ('brand_ids', '[]')
 * ON CONFLICT (key) DO NOTHING;
 *
 * ─────────────────────────────────────────────────────────────
 *
 * ★ 전역 변수: 브랜드 목록 (signature_config 로드 실패 시 폴백용)
 *   실제 운영은 관리자 편집 패널에서 Supabase signature_config에 저장
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import {
  Edit2, X, Save, Plus, Trash2,
  ChevronUp, ChevronDown, Upload, Link,
  Search,
} from 'lucide-react';

// ══════════════════════════════════════════════════════════════
// ★ 폴백 브랜드 ID 목록 (signature_config 로드 실패 시 사용)
//   Supabase Brands 테이블의 brand_id 값을 넣으세요.
// ══════════════════════════════════════════════════════════════
const FALLBACK_BRAND_IDS = [
  // 예: 1, 2, 3
];

// ─────────────────────────────────────────────────────────────
// 유틸
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

const checkIsAdmin = () =>
  sessionStorage.getItem('isAdmin') === 'true' &&
  sessionStorage.getItem('isLoggedIn') === 'true';

const uploadImage = async (file) => {
  const ext = file.name.split('.').pop();
  const path = `signature/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('업로드 실패: ' + error.message);
  const { data } = supabase.storage.from('images').getPublicUrl(path);
  return data.publicUrl;
};

const fmtKRW = (n) => n != null ? `₩${Number(n).toLocaleString()}` : '-';

// ─────────────────────────────────────────────────────────────
// 이미지 업로더 (드래그드롭 + URL)
// ─────────────────────────────────────────────────────────────
function MediaUploader({ onAdd, inputId = 'sig-img-upload' }) {
  const [mode, setMode] = useState('drop');
  const [urlInput, setUrlInput] = useState('');
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleFiles = async (files) => {
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) continue;
        const url = await uploadImage(file);
        onAdd({ url, type: file.type === 'image/gif' ? 'GIF' : 'IMAGE' });
      }
    } catch (err) { alert(err.message); }
    finally { setUploading(false); }
  };

  const addUrl = () => {
    if (!urlInput.trim()) return;
    onAdd({ url: urlInput.trim(), type: 'IMAGE' });
    setUrlInput('');
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[['drop','파일 업로드'],['url','URL 입력']].map(([m, label]) => (
          <button key={m} onClick={() => setMode(m)}
            className={`px-3 py-1.5 text-[10px] tracking-widest border transition-all ${
              mode === m ? 'bg-[#c9a961]/20 border-[#c9a961]/60 text-[#c9a961]' : 'border-[#c9a961]/20 text-[#e8dcc8]/40 hover:border-[#c9a961]/40'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'drop' && (
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById(inputId).click()}
          className={`border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            dragging ? 'border-[#c9a961] bg-[#c9a961]/10' : 'border-[#c9a961]/30 hover:bg-white/5'
          }`}>
          {uploading
            ? <p className="text-[#c9a961] text-sm animate-pulse">업로드 중...</p>
            : <>
                <Upload size={20} className="mx-auto mb-2 text-[#c9a961]/40" />
                <p className="text-xs text-[#c9a961] tracking-widest">이미지 드래그 또는 클릭</p>
                <p className="text-[10px] text-[#e8dcc8]/30 mt-1">JPG · PNG · GIF</p>
              </>
          }
          <input id={inputId} type="file" accept="image/*" multiple hidden onChange={e => handleFiles(e.target.files)} />
        </div>
      )}

      {mode === 'url' && (
        <div className="flex gap-2">
          <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addUrl()}
            placeholder="https://..."
            className="flex-1 bg-black/30 border border-[#c9a961]/25 px-3 py-2 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25" />
          <button onClick={addUrl}
            className="px-3 py-2 bg-[#c9a961]/20 border border-[#c9a961]/40 text-[#c9a961] hover:bg-[#c9a961]/30">
            <Plus size={15} />
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 관리자 편집 패널
// ─────────────────────────────────────────────────────────────
function SignatureAdminPanel({ onClose, onSaved }) {
  const [tab, setTab] = useState('hero'); // 'hero' | 'brands'
  const [saving, setSaving] = useState(false);

  // 히어로 데이터
  const [collectionId, setCollectionId] = useState(null);
  const [title, setTitle] = useState('AION SIGNATURE');
  const [description, setDescription] = useState('');
  const [textColor, setTextColor] = useState('#c9a961');
  const [mediaList, setMediaList] = useState([]);
  const [textBlocks, setTextBlocks] = useState([]);
  const [textInput, setTextInput] = useState({
    content: '', fontSize: 'xlarge', fontWeight: 'bold', isItalic: false,
    positionX: '50%', positionY: '45%',
  });

  // 브랜드 설정
  const [allBrands, setAllBrands] = useState([]);
  const [selectedBrandIds, setSelectedBrandIds] = useState([]);
  const [brandSearch, setBrandSearch] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // 시그니처 컬렉션 로드
      const { data: col } = await supabase
        .from('Collections')
        .select('*')
        .eq('type', 'SIGNATURE')
        .eq('is_active', true)
        .maybeSingle();

      if (col) {
        setCollectionId(col.collection_id);
        setTitle(col.title || 'AION SIGNATURE');
        setDescription(col.description || '');
        setTextColor(col.text_color || '#c9a961');

        const { data: media } = await supabase
          .from('Collection_Media')
          .select('*')
          .eq('collection_id', col.collection_id)
          .order('display_order');
        setMediaList((media || []).map(m => ({ id: m.media_id, url: m.media_url, type: m.media_type })));

        const { data: blocks } = await supabase
          .from('Collection_Text_Blocks')
          .select('*')
          .eq('collection_id', col.collection_id)
          .order('display_order');
        setTextBlocks((blocks || []).map(b => ({
          id: b.text_block_id, content: b.content,
          fontSize: b.font_size, fontWeight: b.font_weight,
          isItalic: b.is_italic, positionX: b.position_x, positionY: b.position_y,
        })));
      }

      // 브랜드 전체 목록
      const { data: brands } = await supabase
        .from('Brands')
        .select('brand_id, brand_name')
        .eq('is_active', true)
        .order('brand_name');
      setAllBrands(brands || []);

      // 저장된 브랜드 설정 로드
      const { data: config } = await supabase
        .from('signature_config')
        .select('value')
        .eq('key', 'brand_ids')
        .maybeSingle();
      if (config?.value) {
        setSelectedBrandIds(Array.isArray(config.value) ? config.value : []);
      } else {
        setSelectedBrandIds(FALLBACK_BRAND_IDS);
      }
    } catch (err) {
      console.error('시그니처 설정 로드 실패:', err);
    }
  };

  const addMedia = ({ url, type }) => {
    setMediaList(prev => [...prev, { id: `tmp_${Date.now()}`, url, type }]);
  };

  const moveMedia = (idx, dir) => {
    setMediaList(prev => {
      const list = [...prev];
      const ni = dir === 'up' ? idx - 1 : idx + 1;
      if (ni < 0 || ni >= list.length) return prev;
      [list[idx], list[ni]] = [list[ni], list[idx]];
      return list;
    });
  };

  const addTextBlock = () => {
    if (!textInput.content.trim()) { alert('텍스트를 입력하세요'); return; }
    setTextBlocks(prev => [...prev, { id: `tmp_${Date.now()}`, ...textInput }]);
    setTextInput({ content: '', fontSize: 'xlarge', fontWeight: 'bold', isItalic: false, positionX: '50%', positionY: '45%' });
  };

  const toggleBrand = (id) => {
    setSelectedBrandIds(prev =>
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // 1. Collections 테이블 upsert
      let cid = collectionId;
      if (cid) {
        await supabase.from('Collections').update({
          title, description, text_color: textColor, updated_at: new Date().toISOString(),
        }).eq('collection_id', cid);
      } else {
        // 기존 SIGNATURE 비활성화 후 새로 생성
        await supabase.from('Collections').update({ is_active: false }).eq('type', 'SIGNATURE');
        const { data: newCol, error } = await supabase.from('Collections').insert({
          title, description, type: 'SIGNATURE', text_color: textColor,
          is_active: true, is_published: true,
        }).select().single();
        if (error) throw error;
        cid = newCol.collection_id;
        setCollectionId(cid);
      }

      // 2. 미디어 교체
      await supabase.from('Collection_Media').delete().eq('collection_id', cid);
      if (mediaList.length > 0) {
        await supabase.from('Collection_Media').insert(
          mediaList.map((m, i) => ({
            collection_id: cid,
            media_url: m.url,
            media_type: m.type || 'IMAGE',
            display_order: i,
          }))
        );
      }

      // 3. 텍스트블록 교체
      await supabase.from('Collection_Text_Blocks').delete().eq('collection_id', cid);
      if (textBlocks.length > 0) {
        await supabase.from('Collection_Text_Blocks').insert(
          textBlocks.map((b, i) => ({
            collection_id: cid,
            content: b.content,
            font_size: b.fontSize,
            font_weight: b.fontWeight,
            is_italic: b.isItalic,
            position_x: b.positionX,
            position_y: b.positionY,
            display_order: i,
          }))
        );
      }

      // 4. 브랜드 설정 저장
      await supabase.from('signature_config').upsert({
        key: 'brand_ids',
        value: selectedBrandIds,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'key' });

      alert('저장되었습니다!');
      onSaved?.();
      onClose();
    } catch (err) {
      alert('저장 실패: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredBrands = allBrands.filter(b =>
    !brandSearch || b.brand_name.toLowerCase().includes(brandSearch.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-6 px-4">
      <div className="w-full max-w-3xl bg-[#1a1714] text-[#e8dcc8] border border-[#c9a961]/30 shadow-2xl my-auto">

        {/* 헤더 */}
        <div className="flex justify-between items-center px-8 py-5 border-b border-[#c9a961]/20">
          <div>
            <p className="text-[#c9a961] text-[9px] tracking-[0.6em] mb-1">ADMIN · SIGNATURE EDITOR</p>
            <h2 className="text-base tracking-[0.25em]">시그니처 설정</h2>
          </div>
          <div className="flex gap-3">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-[#c9a961] text-[#1a1714] text-[10px] tracking-widest hover:bg-[#b89851] transition-all disabled:opacity-50">
              <Save size={13} /> {saving ? '저장중...' : '저장'}
            </button>
            <button onClick={onClose} className="p-2 text-[#e8dcc8]/40 hover:text-white"><X size={18} /></button>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b border-[#c9a961]/15">
          {[['hero', '히어로 이미지 & 문구'], ['brands', `브랜드 설정 (${selectedBrandIds.length}개 선택)`]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id)}
              className={`px-6 py-3.5 text-[10px] tracking-[0.2em] border-b-2 transition-colors ${
                tab === id ? 'text-[#c9a961] border-[#c9a961]' : 'text-[#e8dcc8]/40 border-transparent hover:text-[#e8dcc8]/70'
              }`}>
              {label}
            </button>
          ))}
        </div>

        <div className="p-8 space-y-6">

          {/* ── 히어로 탭 ── */}
          {tab === 'hero' && (
            <>
              {/* 기본 정보 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">제목</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-3 text-sm focus:border-[#c9a961] outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] tracking-[0.4em] text-[#c9a961] mb-2">소개 문구 (선택)</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2}
                    className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-3 text-sm focus:border-[#c9a961] outline-none resize-none" />
                </div>
                <div className="flex items-center gap-3">
                  <label className="text-[10px] tracking-[0.4em] text-[#c9a961]">텍스트 색상</label>
                  <input type="color" value={textColor} onChange={e => setTextColor(e.target.value)}
                    className="h-9 w-14 bg-transparent border border-[#c9a961]/25 cursor-pointer" />
                  <input type="text" value={textColor} onChange={e => setTextColor(e.target.value)}
                    className="w-28 bg-black/30 border border-[#c9a961]/25 px-3 py-2 text-sm focus:border-[#c9a961] outline-none" />
                </div>
              </div>

              {/* 이미지 */}
              <div>
                <p className="text-[10px] tracking-[0.4em] text-[#c9a961] mb-3">배경 이미지 (5초마다 전환)</p>
                <MediaUploader onAdd={addMedia} inputId="sig-hero-upload" />
                <div className="mt-3 space-y-2">
                  {mediaList.map((m, i) => (
                    <div key={m.id || i} className="flex items-center gap-3 p-3 border border-[#c9a961]/15 bg-black/20">
                      <div className="w-14 h-14 overflow-hidden bg-black/40 flex-shrink-0">
                        <img src={m.url} alt="" className="w-full h-full object-cover" onError={e => { e.target.style.display = 'none'; }} />
                      </div>
                      <p className="flex-1 text-xs text-[#e8dcc8]/40 truncate">{m.url}</p>
                      <div className="flex gap-1">
                        <button onClick={() => moveMedia(i, 'up')} disabled={i === 0} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={13} /></button>
                        <button onClick={() => moveMedia(i, 'down')} disabled={i === mediaList.length - 1} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={13} /></button>
                        <button onClick={() => setMediaList(prev => prev.filter((_, j) => j !== i))} className="p-1.5 text-red-400/70 hover:text-red-400"><X size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {mediaList.length === 0 && <p className="text-center text-[#e8dcc8]/25 py-8 italic text-sm">이미지를 추가하세요</p>}
                </div>
              </div>

              {/* 문구 */}
              <div>
                <p className="text-[10px] tracking-[0.4em] text-[#c9a961] mb-3">히어로 문구 <span className="text-[#e8dcc8]/30 normal-case tracking-normal text-[9px]">(선택 — 없으면 제목 표시)</span></p>
                <div className="border border-[#c9a961]/20 p-4 space-y-3">
                  <input value={textInput.content} onChange={e => setTextInput({ ...textInput, content: e.target.value })}
                    placeholder="예: THE ESSENCE OF DIVINITY"
                    className="w-full bg-black/30 border border-[#c9a961]/25 px-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">크기</label>
                      <select value={textInput.fontSize} onChange={e => setTextInput({ ...textInput, fontSize: e.target.value })}
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-1.5 text-xs text-[#e8dcc8] outline-none">
                        {[['small','작게'],['medium','보통'],['large','크게'],['xlarge','매우 크게']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">두께</label>
                      <select value={textInput.fontWeight} onChange={e => setTextInput({ ...textInput, fontWeight: e.target.value })}
                        className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-1.5 text-xs text-[#e8dcc8] outline-none">
                        {[['light','얇게'],['normal','보통'],['medium','중간'],['bold','굵게']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">X 위치</label>
                      <input value={textInput.positionX} onChange={e => setTextInput({ ...textInput, positionX: e.target.value })}
                        placeholder="50%" className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-1.5 text-xs outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] text-[#c9a961]/60 mb-1">Y 위치</label>
                      <input value={textInput.positionY} onChange={e => setTextInput({ ...textInput, positionY: e.target.value })}
                        placeholder="45%" className="w-full bg-black/30 border border-[#c9a961]/25 px-2 py-1.5 text-xs outline-none" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={textInput.isItalic} onChange={e => setTextInput({ ...textInput, isItalic: e.target.checked })} className="w-3.5 h-3.5 accent-[#c9a961]" />
                      <span className="text-xs text-[#e8dcc8]/60 italic">이탤릭체</span>
                    </label>
                    <button onClick={addTextBlock}
                      className="px-4 py-2 bg-[#c9a961]/20 border border-[#c9a961]/40 text-[#c9a961] text-[10px] tracking-widest hover:bg-[#c9a961]/30 transition-all">
                      + 추가
                    </button>
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  {textBlocks.map((block, i) => (
                    <div key={block.id || i} className="flex items-center gap-4 p-3 border border-[#c9a961]/15 bg-black/20">
                      <span className="text-[10px] text-[#c9a961]/40 w-4">{i + 1}</span>
                      <p className={`flex-1 text-sm ${FONT_WEIGHT_CLASS[block.fontWeight]} ${block.isItalic ? 'italic' : ''}`}
                        style={{ color: textColor }}>{block.content}</p>
                      <div className="flex gap-1">
                        <button onClick={() => setTextBlocks(prev => { const l=[...prev]; if(i>0){[l[i],l[i-1]]=[l[i-1],l[i]];} return l; })} disabled={i===0} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronUp size={13} /></button>
                        <button onClick={() => setTextBlocks(prev => { const l=[...prev]; if(i<l.length-1){[l[i],l[i+1]]=[l[i+1],l[i]];} return l; })} disabled={i===textBlocks.length-1} className="p-1.5 hover:text-[#c9a961] disabled:opacity-20"><ChevronDown size={13} /></button>
                        <button onClick={() => setTextBlocks(prev => prev.filter((_,j) => j!==i))} className="p-1.5 text-red-400/70 hover:text-red-400"><X size={13} /></button>
                      </div>
                    </div>
                  ))}
                  {textBlocks.length === 0 && <p className="text-center text-[#e8dcc8]/25 py-6 italic text-sm">문구 없음 (제목 자동 표시)</p>}
                </div>
              </div>
            </>
          )}

          {/* ── 브랜드 탭 ── */}
          {tab === 'brands' && (
            <div className="space-y-4">
              <p className="text-xs text-[#e8dcc8]/50">선택된 브랜드의 모든 활성 향수가 시그니처 페이지에 표시됩니다.</p>

              {/* 선택된 브랜드 */}
              {selectedBrandIds.length > 0 && (
                <div className="flex flex-wrap gap-2 p-4 border border-[#c9a961]/20 bg-[#c9a961]/5">
                  {selectedBrandIds.map(id => {
                    const brand = allBrands.find(b => b.brand_id === id);
                    return brand ? (
                      <div key={id} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#c9a961]/20 border border-[#c9a961]/40 text-[#c9a961] text-xs">
                        {brand.brand_name}
                        <button onClick={() => toggleBrand(id)} className="hover:text-white ml-1"><X size={11} /></button>
                      </div>
                    ) : null;
                  })}
                </div>
              )}

              {/* 브랜드 검색 & 목록 */}
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#e8dcc8]/30" />
                <input value={brandSearch} onChange={e => setBrandSearch(e.target.value)}
                  placeholder="브랜드명 검색..."
                  className="w-full bg-black/30 border border-[#c9a961]/25 pl-9 pr-4 py-2.5 text-sm focus:border-[#c9a961] outline-none placeholder:text-[#e8dcc8]/25" />
              </div>

              <div className="border border-[#c9a961]/15 bg-black/20 max-h-72 overflow-y-auto">
                {filteredBrands.length === 0
                  ? <p className="text-center py-8 text-[#e8dcc8]/25 italic text-sm">검색 결과 없음</p>
                  : filteredBrands.map(brand => {
                    const selected = selectedBrandIds.includes(brand.brand_id);
                    return (
                      <div key={brand.brand_id} onClick={() => toggleBrand(brand.brand_id)}
                        className={`flex items-center justify-between px-4 py-3 cursor-pointer border-b border-[#c9a961]/10 transition-colors ${selected ? 'bg-[#c9a961]/15' : 'hover:bg-white/5'}`}>
                        <span className="text-sm text-[#e8dcc8]">{brand.brand_name}</span>
                        {selected && <span className="text-[10px] text-[#c9a961] tracking-widest">✓ 선택됨</span>}
                      </div>
                    );
                  })
                }
              </div>

              <p className="text-[10px] text-[#e8dcc8]/30 italic">
                * 브랜드를 선택하지 않으면 상단 FALLBACK_BRAND_IDS 설정값이 사용됩니다.
              </p>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// 메인 Signature 컴포넌트
// ─────────────────────────────────────────────────────────────
export default function Signature() {
  const isAdmin = checkIsAdmin();

  const [heroData, setHeroData] = useState(null);
  const [mediaList, setMediaList] = useState([]);
  const [textBlocks, setTextBlocks] = useState([]);
  const [mediaIdx, setMediaIdx] = useState(0);
  const [textIdx, setTextIdx] = useState(0);

  const [perfumes, setPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editorOpen, setEditorOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. 시그니처 컬렉션 로드
      const { data: col } = await supabase
        .from('Collections')
        .select('*')
        .eq('type', 'SIGNATURE')
        .eq('is_active', true)
        .maybeSingle();

      if (col) {
        setHeroData(col);

        const { data: media } = await supabase
          .from('Collection_Media')
          .select('*')
          .eq('collection_id', col.collection_id)
          .order('display_order');
        setMediaList(media || []);

        const { data: blocks } = await supabase
          .from('Collection_Text_Blocks')
          .select('*')
          .eq('collection_id', col.collection_id)
          .order('display_order');
        setTextBlocks(blocks || []);
      }

      // 2. 브랜드 설정 로드
      const { data: config } = await supabase
        .from('signature_config')
        .select('value')
        .eq('key', 'brand_ids')
        .maybeSingle();

      const brandIds = (config?.value && Array.isArray(config.value) && config.value.length > 0)
        ? config.value
        : FALLBACK_BRAND_IDS;

      // 3. 해당 브랜드 향수 로드
      if (brandIds.length > 0) {
        const { data: perfs } = await supabase
          .from('Perfumes')
          .select(`
            perfume_id, name, name_en, price, sale_price, sale_rate,
            Brands!inner(brand_name),
            Perfume_Images(image_url, is_thumbnail)
          `)
          .in('brand_id', brandIds)
          .eq('is_active', true)
          .order('name');

        const mapped = (perfs || []).map(p => ({
          id: p.perfume_id,
          name: p.name,
          nameEn: p.name_en,
          brandName: p.Brands?.brand_name,
          price: p.price,
          salePrice: p.sale_price,
          saleRate: p.sale_rate,
          thumbnail: p.Perfume_Images?.find(i => i.is_thumbnail)?.image_url
            || p.Perfume_Images?.[0]?.image_url,
        }));
        setPerfumes(mapped);
      } else {
        setPerfumes([]);
      }
    } catch (err) {
      console.error('시그니처 로드 실패:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 미디어 자동 슬라이드
  useEffect(() => {
    if (mediaList.length <= 1) return;
    const t = setInterval(() => setMediaIdx(p => (p + 1) % mediaList.length), 5000);
    return () => clearInterval(t);
  }, [mediaList.length]);

  // 문구 자동 슬라이드
  useEffect(() => {
    if (textBlocks.length <= 1) return;
    const t = setInterval(() => setTextIdx(p => (p + 1) % textBlocks.length), 5000);
    return () => clearInterval(t);
  }, [textBlocks.length]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4" />
          <p className="text-[#8b8278] italic text-sm">시그니처를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3]">

      {/* ══ 히어로 섹션 ══ */}
      <div className="relative h-[70vh] overflow-hidden">

        {/* 배경 이미지들 */}
        {mediaList.length > 0 ? (
          mediaList.map((m, i) => (
            <div key={m.media_id || i}
              className={`absolute inset-0 transition-opacity duration-[2000ms] ${i === mediaIdx ? 'opacity-100' : 'opacity-0'}`}>
              <img src={m.media_url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/60" />
            </div>
          ))
        ) : (
          // 이미지 없을 때 기본 배경
          <div className="absolute inset-0 bg-gradient-to-br from-[#2a2620] via-[#3d3228] to-[#2a2620]">
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/50" />
          </div>
        )}

        {/* 문구 */}
        <div className="relative h-full">
          {textBlocks.length > 0 ? (
            textBlocks.map((block, i) => (
              <div key={block.text_block_id || i}
                className={`absolute transition-opacity duration-[1500ms] ${i === textIdx ? 'opacity-100' : 'opacity-0'}`}
                style={{
                  left: block.position_x,
                  top: block.position_y,
                  transform: 'translate(-50%, -50%)',
                  color: heroData?.text_color || '#c9a961',
                }}>
                <p className={`
                  ${FONT_SIZE_CLASS[block.font_size] || FONT_SIZE_CLASS.xlarge}
                  ${FONT_WEIGHT_CLASS[block.font_weight] || FONT_WEIGHT_CLASS.normal}
                  ${block.is_italic ? 'italic' : ''}
                  tracking-widest drop-shadow-lg text-center px-4
                `}>
                  {block.content}
                </p>
              </div>
            ))
          ) : heroData ? (
            // 문구 없으면 제목 표시
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center px-8">
                <div className="flex items-center justify-center mb-6">
                  <div className="h-[1px] w-10 bg-gradient-to-r from-transparent to-[#c9a961]/60" />
                  <div className="mx-3 text-[#c9a961]/60 text-xs">✦</div>
                  <div className="h-[1px] w-10 bg-gradient-to-l from-transparent to-[#c9a961]/60" />
                </div>
                <h1 className="text-4xl md:text-6xl font-display tracking-[0.3em] mb-4 drop-shadow-lg"
                  style={{ color: heroData.text_color || '#c9a961' }}>
                  {heroData.title}
                </h1>
                {heroData.description && (
                  <p className="text-lg italic tracking-wider drop-shadow-lg opacity-80"
                    style={{ color: heroData.text_color || '#c9a961' }}>
                    {heroData.description}
                  </p>
                )}
              </div>
            </div>
          ) : (
            // 데이터 없음
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <h1 className="text-4xl md:text-6xl tracking-[0.4em] text-[#c9a961]/60 font-light">SIGNATURE</h1>
                <p className="text-sm text-[#e8dcc8]/30 italic mt-4 tracking-widest">
                  {isAdmin ? '편집 버튼으로 설정하세요' : '준비 중입니다'}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 미디어 도트 인디케이터 */}
        {mediaList.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {mediaList.map((_, i) => (
              <button key={i} onClick={() => setMediaIdx(i)}
                className={`rounded-full transition-all ${i === mediaIdx ? 'bg-[#c9a961] w-6 h-2' : 'bg-white/40 w-2 h-2 hover:bg-white/70'}`} />
            ))}
          </div>
        )}

        {/* 관리자 편집 버튼 */}
        {isAdmin && (
          <button onClick={() => setEditorOpen(true)}
            className="absolute top-5 right-5 z-20 flex items-center gap-2 px-4 py-2.5 bg-black/75 text-[#c9a961] border border-[#c9a961]/60 text-[10px] tracking-widest hover:bg-[#c9a961] hover:text-black transition-all shadow-lg">
            <Edit2 size={13} /> 시그니처 편집
          </button>
        )}
      </div>

      {/* ══ 향수 목록 섹션 ══ */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
            <div className="mx-3 text-[#c9a961] text-xs">✦</div>
            <div className="h-[1px] w-12 bg-gradient-to-l from-transparent via-[#c9a961] to-transparent" />
          </div>
          <h2 className="font-display text-3xl tracking-[0.3em] text-[#c9a961] mb-4">SIGNATURE</h2>
          <p className="text-base italic text-[#6f6756]">AION을 대표하는 시그니처 향수 라인</p>
        </div>

        {perfumes.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-[#8b8278] italic">
              {isAdmin ? '편집 패널에서 브랜드를 선택하세요' : '준비 중입니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {perfumes.map((p) => (
              <div key={p.id} className="group cursor-pointer">
                <div className="relative overflow-hidden mb-4 bg-white shadow-sm">
                  <div className="aspect-square">
                    {p.thumbnail ? (
                      <img src={p.thumbnail} alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] flex items-center justify-center">
                        <span className="text-6xl text-[#c9a961]/20">{p.name?.charAt(0)}</span>
                      </div>
                    )}
                  </div>
                  {p.saleRate > 0 && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-bold">
                      {p.saleRate}% OFF
                    </div>
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs text-[#8b8278] mb-1 tracking-wider">{p.brandName}</p>
                  <h3 className="text-lg font-medium text-[#2a2620] mb-1 tracking-wide">{p.name}</h3>
                  {p.nameEn && <p className="text-xs text-[#c9a961] italic mb-2">{p.nameEn}</p>}
                  <div className="flex items-center justify-center gap-2">
                    {p.saleRate > 0 ? (
                      <>
                        <span className="text-sm text-gray-400 line-through">{fmtKRW(p.price)}</span>
                        <span className="text-lg font-semibold text-[#c9a961]">{fmtKRW(p.salePrice)}</span>
                      </>
                    ) : (
                      <span className="text-lg font-semibold text-[#c9a961]">{fmtKRW(p.price)}</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 에디터 */}
      {editorOpen && (
        <SignatureAdminPanel
          onClose={() => setEditorOpen(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}