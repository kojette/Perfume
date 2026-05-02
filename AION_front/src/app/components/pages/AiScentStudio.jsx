/**
 * AiScentStudio.jsx
 *
 * 탭 ① 향 조합하기  — ScentBlend (기존 그대로)
 * 탭 ② AI 소믈리에  — Gemini Vision: 이미지 → 기성 향수 추천
 *                     + 이미지 분석 결과로 AI 조향 패널 자동 표시
 * 탭 ③ AI 조향사    — 파이프라인: 입력 → Gemini 키워드 → Supabase 재료 → Claude 조향
 *
 * [성능/캐시 개선]
 * - 탭 전환 시 display:none 방식 → 언마운트 없이 상태 보존
 * - sessionStorage에 Gemini 결과, Claude 채팅/레시피/슬라이더 영속
 * - 같은 이미지 재분석 방지 (파일명+크기 키로 결과 캐싱)
 * - AbortController로 탭 이탈/초기화 시 진행 중 fetch 중단
 * - useCallback / useMemo 최적화
 */

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Send, Sparkles, Camera, MessageSquare,
  X, RotateCcw, FlaskConical, Sliders,
  Plus, Check, Edit2
} from 'lucide-react';
import ScentBlend from './ScentBlend';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const gold  = '#c9a961';
const dark  = '#1a1a1a';
const muted = '#8b8278';

// ── sessionStorage 헬퍼 ──────────────────────────────────────
const SS = {
  get: (key) => {
    try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set: (key, value) => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); }
    catch { /* 용량 초과 시 무시 */ }
  },
  del: (key) => { try { sessionStorage.removeItem(key); } catch {} },
};

// 이미지 파일 → 캐시 키 (파일명 + 크기 + 마지막수정일)
const imageKey = (file) => `gemini_img_${file.name}_${file.size}_${file.lastModified}`;

// Claude 첫 프롬프트 → 응답 캐시 키 (동일 입력 시 API 재호출 방지)
// 메시지 히스토리가 있는 후속 대화는 캐시 안 함 (대화 흐름 보존)
const claudePromptKey = (prompt) => {
  // 공백 정규화 후 첫 100자 + 길이로 키 생성 (충돌 방지 + 너무 긴 키 회피)
  const norm = prompt.trim().replace(/\s+/g, ' ');
  return `claude_blend_${norm.length}_${norm.slice(0, 100)}`;
};

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function AiScentStudio() {
  const [tab, setTab] = useState(() => SS.get('studio_tab') || 'blend');

  const handleTabChange = useCallback((id) => {
    setTab(id);
    SS.set('studio_tab', id);
  }, []);

  return (
    <div className="py-2">
      {/* 탭 바 */}
      <div className="flex border border-[#c9a961]/30 mb-8 overflow-hidden max-w-3xl mx-auto">
        {[
          { id: 'blend',  icon: <FlaskConical size={13}/>, label: '향 조합하기', sub: 'My Scent Lab'  },
          { id: 'gemini', icon: <Camera size={13}/>,       label: 'AI 소믈리에', sub: 'Gemini Vision' },
          { id: 'claude', icon: <MessageSquare size={13}/>,label: 'AI 조향사',   sub: 'Claude Chat'   },
        ].map((t, i, arr) => (
          <div key={t.id} className="flex flex-1">
            <button
              onClick={() => handleTabChange(t.id)}
              className={`flex-1 flex items-center justify-center gap-2.5 py-4 transition-all duration-300 ${
                tab === t.id ? 'bg-[#1a1a1a] text-[#c9a961]' : 'bg-white text-[#8b8278] hover:text-[#c9a961]'
              }`}
            >
              {t.icon}
              <span className="text-[11px] tracking-[0.2em]">{t.label}</span>
              <span className={`text-[9px] px-1.5 py-0.5 ${tab === t.id ? 'bg-[#c9a961]/20' : 'bg-[#f0ece4]'}`}>
                {t.sub}
              </span>
            </button>
            {i < arr.length - 1 && <div className="w-px bg-[#c9a961]/20" />}
          </div>
        ))}
      </div>

      {/*
        display:none 방식 — 탭 전환 시 컴포넌트 언마운트 없이 숨김
        각 패널 내부 상태(스크롤, 입력값 등) 그대로 보존
      */}
      <div style={{ display: tab === 'blend'  ? 'block' : 'none' }}>
        <div className="max-w-3xl mx-auto"><ScentBlend /></div>
      </div>
      <div style={{ display: tab === 'gemini' ? 'block' : 'none' }}>
        <div className="max-w-3xl mx-auto">
          <GeminiPanel onSaved={() => handleTabChange('blend')} />
        </div>
      </div>
      <div style={{ display: tab === 'claude' ? 'block' : 'none' }}>
        <ClaudePanel />
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 2: GEMINI 이미지 → 기성 향수 추천 + AI 조향 패널
// ══════════════════════════════════════════════════════════════
function GeminiPanel({ onSaved }) {
  const navigate = useNavigate();

  const [image, setImage] = useState(() => {  const cached = SS.get('gemini_image_preview');
    return cached ? { file: null, preview: cached } : null;
  });
  const [result,         setResult]         = useState(() => SS.get('gemini_result'));
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState('');
  const [showBlendPanel, setShowBlendPanel] = useState(() => SS.get('gemini_showBlend') || false);
  const [blendSliders,   setBlendSliders]   = useState(() => SS.get('gemini_sliders')   || []);
  const [blendName,      setBlendName]      = useState(() => SS.get('gemini_blendName') || '');
  const [saving,         setSaving]         = useState(false);
  const [savedOk,        setSavedOk]        = useState(false);
  const [evalLoading,    setEvalLoading]    = useState(false);
  const [evaluation,     setEvaluation]     = useState(() => SS.get('gemini_eval')      || '');

  const fileRef      = useRef();
  const evalTimerRef = useRef(null);
  const abortRef     = useRef(null);
  const token        = sessionStorage.getItem('accessToken');

  // sessionStorage 동기화
  useEffect(() => { SS.set('gemini_result',    result);        }, [result]);
  useEffect(() => { SS.set('gemini_showBlend', showBlendPanel);}, [showBlendPanel]);
  useEffect(() => { SS.set('gemini_sliders',   blendSliders);  }, [blendSliders]);
  useEffect(() => { SS.set('gemini_blendName', blendName);     }, [blendName]);
  useEffect(() => { SS.set('gemini_eval',      evaluation);    }, [evaluation]);

  // 언마운트 시 fetch 중단
  useEffect(() => () => { abortRef.current?.abort(); }, []);

  const initBlendSliders = useCallback((data) => {
    const toSliders = (notes, noteType) =>
      (notes || []).map(n => ({
        name: n.name, noteType,
        ratio: Math.round((n.ratio ?? 0) * 100),
      }));
    const all = [
      ...toSliders(data.topNotes,    'top'),
      ...toSliders(data.middleNotes, 'middle'),
      ...toSliders(data.baseNotes,   'base'),
    ];
    if (!all.length) return;
    setBlendSliders(all);
    if (data.mood) setBlendName(`${data.mood} 향수`);
  }, []);

  const handleImageChange = useCallback((e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 가능합니다.'); return; }
    if (file.size > 10 * 1024 * 1024)   { setError('10MB 이하 파일만 가능합니다.'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;
      SS.set('gemini_image_preview', base64);
      setImage({ file, preview: base64 });
    };
    reader.readAsDataURL(file);
    setError('');
    // 이미 분석된 이미지면 캐시에서 바로 복원
    const cached = SS.get(imageKey(file));
    if (cached) {
      setResult(cached); initBlendSliders(cached);
    } else {
      setResult(null); setShowBlendPanel(false);
      setBlendSliders([]); setBlendName(''); setSavedOk(false);
    }
  }, [initBlendSliders]);

  const handleAnalyze = useCallback(async () => {
    if (!image) return;
    const cacheKey = imageKey(image.file);
    const cached   = SS.get(cacheKey);
    if (cached) { setResult(cached); initBlendSliders(cached); return; }

    setError(''); setResult(null); setLoading(true);
    setShowBlendPanel(false); setBlendSliders([]); setBlendName(''); setSavedOk(false);
    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const fd = new FormData();
      fd.append('image', image.file);
      const res = await fetch(`${API_BASE}/api/ai/image-to-scent`, {
        method: 'POST', body: fd, signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const json = await res.json();
      const data = json.data || json;
      SS.set(cacheKey, data);
      setResult(data);
      initBlendSliders(data);
    } catch (e) {
      if (e.name === 'AbortError') return;
      setError(e.message || '분석 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  }, [image, initBlendSliders]);

  // 슬라이더 변경 → Gemini 평가 (1.2s 디바운스)
  useEffect(() => {
    if (!blendSliders.length || !showBlendPanel) return;
    clearTimeout(evalTimerRef.current);
    evalTimerRef.current = setTimeout(() => requestGeminiEval(blendSliders), 1200);
    return () => clearTimeout(evalTimerRef.current);
  }, [blendSliders, showBlendPanel]);

  const requestGeminiEval = useCallback(async (sliders) => {
    if (!sliders.length) return;
    setEvalLoading(true);
    try {
      const snap = (type) => sliders
        .filter(s => s.noteType === type)
        .map(s => ({ ingredientName: s.name, ratio: s.ratio / 100 }));
      const res = await fetch(`${API_BASE}/api/ai/gemini-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          previousRecipe: null,
          currentRecipe: { topNotes: snap('top'), middleNotes: snap('middle'), baseNotes: snap('base') },
        }),
      });
      const json = await res.json();
      setEvaluation(json.data || '');
    } catch (e) { console.error('Gemini 평가 오류', e); }
    finally     { setEvalLoading(false); }
  }, []);

  const handleSliderChange = useCallback((index, value) => {
    setBlendSliders(prev => prev.map((s, i) => i === index ? { ...s, ratio: value } : s));
  }, []);

  const totalRatio = useMemo(
    () => blendSliders.reduce((s, item) => s + item.ratio, 0),
    [blendSliders]
  );

  const handleSaveBlend = useCallback(async () => {
    if (!token)            { alert('로그인이 필요합니다.'); return; }
    if (!blendName.trim()) { alert('향 이름을 입력해주세요.'); return; }
    if (!blendSliders.length) return;
    setSaving(true);
    try {
      const sum   = blendSliders.reduce((s, item) => s + item.ratio, 0) || 1;
      const items = blendSliders.map(s => ({
        ingredientId: s.ingredientId || null,
        type:         s.noteType.toUpperCase(),
        ratio:        parseFloat(((s.ratio / sum) * 100).toFixed(3)),
        ingredientName: s.name,
      }));
      const res = await fetch(`${API_BASE}/api/custom/scent-blends`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: blendName.trim(), concentration: 'EDP', volumeMl: 50, totalPrice: 0, ingredients: items }),
      });
      if (res.ok) {
        setSavedOk(true);
        SS.del('gemini_result'); SS.del('gemini_sliders');
        SS.del('gemini_blendName'); SS.del('gemini_eval'); SS.del('gemini_showBlend');
        setTimeout(() => onSaved?.(), 800);
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || '저장에 실패했습니다.');
      }
    } catch { alert('네트워크 오류'); }
    finally  { setSaving(false); }
  }, [token, blendName, blendSliders, onSaved]);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    setResult(null); setImage(null); setError('');
    setShowBlendPanel(false); setBlendSliders([]); setBlendName('');
    setSavedOk(false); setEvaluation('');
    ['gemini_result','gemini_sliders','gemini_blendName','gemini_eval','gemini_showBlend','gemini_image_preview']
      .forEach(k => SS.del(k));
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#c9a961]/20 px-8 py-5 text-center">
        <p className="text-[9px] tracking-[0.6em] text-[#c9a961] mb-1">AI SOMMELIER</p>
        <p className="font-serif text-lg text-[#1a1a1a] tracking-wider mb-1">이미지로 향수 찾기</p>
        <p className="text-[11px] text-[#8b8278] italic">사진 속 분위기에 어울리는 기성 향수를 추천하고, 직접 조향도 할 수 있습니다</p>
      </div>

      {!image ? (
        <div
          onDrop={e => { e.preventDefault(); handleImageChange({ target: { files: e.dataTransfer.files } }); }}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-[#c9a961]/30 bg-white hover:border-[#c9a961]/60 transition-colors cursor-pointer py-20 flex flex-col items-center gap-3 group"
        >
          <Upload size={32} className="text-[#c9a961]/40 group-hover:text-[#c9a961]/70 transition-colors" />
          <p className="text-sm text-[#8b8278] tracking-wider">이미지를 드래그하거나 클릭하여 업로드</p>
          <p className="text-[10px] text-[#c0b8a8]">JPG, PNG, WEBP · 최대 10MB</p>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
        </div>
      ) : (
        <div className="relative">
          <img src={image.preview} alt="업로드" className="w-full object-contain border border-[#e8e2d6]" />
          <button onClick={() => setImage(null)}
            className="absolute top-2 right-2 w-7 h-7 bg-white/90 border border-[#e8e2d6] flex items-center justify-center hover:border-[#c9a961]">
            <X size={13} className="text-[#8b8278]" />
          </button>
        </div>
      )}

      {error && <p className="text-xs text-red-400">{error}</p>}

      {!result && image && (
        <button onClick={handleAnalyze} disabled={loading}
          className="w-full py-4 flex items-center justify-center gap-2.5 tracking-[0.4em] text-[11px] transition-all disabled:opacity-40"
          style={{ background: loading ? '#e8e2d6' : dark, color: loading ? muted : gold }}>
          {loading
            ? <><div className="w-4 h-4 border-2 border-[#c9a961]/40 border-t-[#c9a961] rounded-full animate-spin" />ANALYZING...</>
            : <><Sparkles size={13} />AI 향수 분석 시작</>}
        </button>
      )}

      {result && (
        <div className="space-y-5" style={{ animation: 'fadeUp .5s ease forwards' }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

          <div className="bg-[#1a1a1a] px-7 py-6 text-center">
            <p className="text-[9px] tracking-[0.6em] text-[#c9a961]/60 mb-2">AI ANALYSIS</p>
            <p className="font-serif text-lg text-white tracking-wider mb-3">{result.mood}</p>
            <p className="text-sm text-[#c0b8a8] italic leading-relaxed">{result.analysisText}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[['TOP NOTE','topNotes'],['MIDDLE NOTE','middleNotes'],['BASE NOTE','baseNotes']].map(([lbl, key]) => (
              <div key={key} className="bg-white border border-[#e8e2d6] p-4">
                <p className="text-[9px] tracking-[0.4em] text-[#c9a961] mb-3">{lbl}</p>
                {(result[key] || []).map((n, i) => (
                  <span key={i} className="block text-xs text-[#2a2620] py-0.5 border-b border-[#f0ece4] last:border-0">{n.name}</span>
                ))}
              </div>
            ))}
          </div>

          {!showBlendPanel && (
            <button
              onClick={() => { setShowBlendPanel(true); setEvaluation(''); requestGeminiEval(blendSliders); }}
              className="w-full py-3.5 flex items-center justify-center gap-2.5 border border-[#c9a961] text-[#c9a961] text-[11px] tracking-[0.4em] hover:bg-[#c9a961] hover:text-white transition-all"
            >
              <Sliders size={13} />이 향수로 직접 조향하기
            </button>
          )}

          {showBlendPanel && blendSliders.length > 0 && (
            <div className="border border-[#c9a961]/30 bg-[#1a1a1a] overflow-hidden"
                 style={{ animation: 'fadeUp .4s ease forwards' }}>

              <div className="px-5 py-4 border-b border-[#c9a961]/20 flex items-center justify-between">
                <div>
                  <p className="text-[9px] tracking-[0.6em] text-[#c9a961]/60 mb-1">MY BLEND RECIPE</p>
                  <p className="font-serif text-base text-white tracking-wider">비율 미세 조율</p>
                </div>
                <button onClick={() => setShowBlendPanel(false)}
                  className="w-7 h-7 border border-white/10 flex items-center justify-center hover:border-[#c9a961]/50 transition-colors">
                  <X size={12} className="text-white/50" />
                </button>
              </div>

              <div className="px-5 pt-4 pb-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sliders size={11} className="text-[#c9a961]/50" />
                  <span className="text-[10px] text-[#c9a961]/50 tracking-wider">비율 조절</span>
                </div>
                <span className={`text-[10px] tracking-wider ${Math.abs(totalRatio - 100) < 2 ? 'text-[#c9a961]' : 'text-red-400'}`}>
                  합계 {totalRatio}%
                </span>
              </div>

              <div className="px-5 pb-4 space-y-4 overflow-y-auto" style={{ maxHeight: '320px' }}>
                {['top','middle','base'].map(noteType => {
                  const noteItems = blendSliders.map((s, i) => ({ ...s, _idx: i })).filter(s => s.noteType === noteType);
                  if (!noteItems.length) return null;
                  const label = { top: 'TOP', middle: 'MIDDLE', base: 'BASE' }[noteType];
                  return (
                    <div key={noteType}>
                      <p className="text-[9px] tracking-[0.4em] text-[#c9a961]/50 mb-2">{label} NOTE</p>
                      {noteItems.map(item => (
                        <div key={item._idx} className="mb-3">
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-xs text-white/80">{item.name}</span>
                            <span className="text-[11px] text-[#c9a961] w-10 text-right">{item.ratio}%</span>
                          </div>
                          <div className="relative h-1.5 bg-white/10 rounded-full">
                            <div className="absolute inset-y-0 left-0 bg-[#c9a961] rounded-full transition-all duration-150"
                                 style={{ width: `${item.ratio}%` }} />
                            <input type="range" min={0} max={100} step={1} value={item.ratio}
                              onChange={e => handleSliderChange(item._idx, Number(e.target.value))}
                              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                              style={{ zIndex: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>

              {(evaluation || evalLoading) && (
                <div className="mx-5 mb-4 p-3 border border-[#c9a961]/20 bg-white/5">
                  <p className="text-[9px] tracking-[0.4em] text-[#c9a961]/60 mb-2">GEMINI EVALUATION</p>
                  {evalLoading
                    ? <div className="flex items-center gap-2 text-[10px] text-white/40">
                        <div className="w-3 h-3 border border-white/30 border-t-[#c9a961] rounded-full animate-spin" />평가 중...
                      </div>
                    : <p className="text-[11px] text-white/70 leading-relaxed italic">{evaluation}</p>
                  }
                </div>
              )}

              <div className="px-5 pb-5 space-y-3 border-t border-white/10 pt-4">
                <div className="flex items-center gap-2">
                  <Edit2 size={11} className="text-[#c9a961]/60 flex-shrink-0" />
                  <input type="text" value={blendName} onChange={e => setBlendName(e.target.value)}
                    placeholder="나만의 향 이름을 입력하세요" maxLength={100}
                    className="flex-1 bg-transparent border-b border-white/20 text-sm text-white placeholder-white/30 pb-1 outline-none focus:border-[#c9a961]/60 transition-colors" />
                </div>
                <button onClick={handleSaveBlend}
                  disabled={saving || savedOk || !blendName.trim()}
                  className="w-full py-3 flex items-center justify-center gap-2.5 text-[11px] tracking-[0.4em] font-semibold transition-all disabled:opacity-40"
                  style={{ background: savedOk ? '#2a6049' : gold, color: savedOk ? '#c9e8d5' : dark }}>
                  {savedOk
                    ? <><Check size={13} />저장됨 — 향 조합하기 탭으로 이동 중</>
                    : saving
                    ? <><div className="w-4 h-4 border-2 border-black/20 border-t-black/60 rounded-full animate-spin" />저장 중...</>
                    : <><Plus size={13} />향 조합에 추가하기</>}
                </button>
                <p className="text-[9px] text-white/30 text-center tracking-wider">
                  저장 후 자동으로 향 조합하기 탭에서 확인할 수 있습니다
                </p>
              </div>
            </div>
          )}

          {result.recommendedPerfumes?.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.5em] text-[#8b8278] mb-3">RECOMMENDED FOR YOU</p>
              <div className="space-y-2">
                {result.recommendedPerfumes.map(p => (
                  <button key={p.id}
                    onClick={() => navigate(`/perfumes/${p.id}`)}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-[#e8e2d6] hover:border-[#c9a961]/60 hover:shadow-sm transition-all text-left group">
                    <div className="w-12 h-12 bg-[#f0ece4] flex-shrink-0 overflow-hidden">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <span className="w-full h-full flex items-center justify-center font-serif text-lg text-[#c9a961]/30">{p.name?.charAt(0)}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[#2a2620] truncate">{p.name}</p>
                      <p className="text-[10px] text-[#c9a961] italic">{p.brand}</p>
                    </div>
                    <p className="text-sm text-[#c9a961] flex-shrink-0">₩{p.price?.toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={reset}
            className="w-full py-3 flex items-center justify-center gap-2 border border-[#e8e2d6] text-[#8b8278] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors text-[11px] tracking-widest">
            <RotateCcw size={12} /> 다시 분석하기
          </button>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 3: AI 조향사
// ══════════════════════════════════════════════════════════════
const INITIAL_MSG = [{
  role: 'assistant',
  content: '안녕하세요. AI 조향사입니다. ✦\n\n원하시는 향수의 감성이나 상황을 자유롭게 말씀해 주세요.\n예: "비 오는 날 카페에서 책 읽는 따뜻한 느낌"',
}];

function ClaudePanel() {
  const [messages,       setMessages]   = useState(() => SS.get('claude_messages') || INITIAL_MSG);
  const [input,          setInput]      = useState('');
  const [pipelineStatus, setStatus]     = useState(() => {
    const s = SS.get('claude_status') || 'idle';
    // 새로고침 시 스트리밍 중이었으면 idle 복원
    return ['extracting','searching','streaming'].includes(s) ? 'idle' : s;
  });
  const [recipe,         setRecipe]     = useState(() => SS.get('claude_recipe')  || null);
  const [sliders,        setSliders]    = useState(() => SS.get('claude_sliders') || []);
  const [prevSliders,    setPrevSliders]= useState([]);
  const [evaluation,     setEvaluation] = useState(() => SS.get('claude_eval')    || '');
  const [evalLoading,    setEvalLoading]= useState(false);
  const [foundIngredients, setFoundIngredients] = useState([]);

  const chatBoxRef   = useRef();   // 채팅 스크롤 컨테이너 (페이지 전체가 아닌 내부만 스크롤)
  const chatEndRef   = useRef();
  const textareaRef  = useRef();
  const evalTimerRef = useRef(null);
  const abortRef     = useRef(null);
  const token = sessionStorage.getItem('accessToken');

  // sessionStorage 동기화
  useEffect(() => { SS.set('claude_messages', messages);       }, [messages]);
  useEffect(() => { SS.set('claude_status',   pipelineStatus); }, [pipelineStatus]);
  useEffect(() => { SS.set('claude_recipe',   recipe);         }, [recipe]);
  useEffect(() => { SS.set('claude_sliders',  sliders);        }, [sliders]);
  useEffect(() => { SS.set('claude_eval',     evaluation);     }, [evaluation]);

  useEffect(() => () => { abortRef.current?.abort(); }, []);

  // 채팅 메시지 추가 시: 채팅 컨테이너 '내부'만 스크롤 (페이지 전체 스크롤 X)
  // 기존 scrollIntoView()는 부모를 타고 올라가 페이지 자체를 움직여서
  // 채팅입력창이 화면 밖으로 밀려나 footer가 보이는 문제가 있었음
  useEffect(() => {
    const box = chatBoxRef.current;
    if (!box) return;
    // 컨테이너 자체의 scrollTop만 조정 → 페이지 위치는 유지
    box.scrollTo({ top: box.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // 슬라이더 변경 → Gemini 평가 (1s 디바운스)
  useEffect(() => {
    if (!recipe || !sliders.length) return;
    clearTimeout(evalTimerRef.current);
    evalTimerRef.current = setTimeout(() => {
      if (prevSliders.length) requestGeminiEvaluation(prevSliders, sliders);
      setPrevSliders([...sliders]);
    }, 1000);
    return () => clearTimeout(evalTimerRef.current);
  }, [sliders]);

  const initSliders = useCallback((parsedRecipe) => {
    const rawItems = [
      ...(parsedRecipe.topNotes    || []).map(n => ({ ...n, noteType: 'top'    })),
      ...(parsedRecipe.middleNotes || []).map(n => ({ ...n, noteType: 'middle' })),
      ...(parsedRecipe.baseNotes   || []).map(n => ({ ...n, noteType: 'base'   })),
    ];

    // ratio 자동 정규화 (Claude/Haiku가 합 ≠ 1.0 줘도 안전하게 보정)
    // 예: 합이 1.05 → 모두 ÷1.05 해서 합 1.0으로
    //     합이 0.95 → 모두 ÷0.95 해서 합 1.0으로
    const total = rawItems.reduce((s, it) => s + (Number(it.ratio) || 0), 0);
    const items = total > 0 && Math.abs(total - 1) > 0.005
      ? rawItems.map(it => ({ ...it, ratio: (Number(it.ratio) || 0) / total }))
      : rawItems;

    if (Math.abs(total - 1) > 0.005) {
      console.warn(`[Recipe] ratio 합 ${total.toFixed(3)} → 1.000으로 자동 정규화`);
    }

    setSliders(items); setPrevSliders(items);
  }, []);

  const handleSliderChange = useCallback((index, newRatio) => {
    setSliders(prev => prev.map((s, i) => i === index ? { ...s, ratio: newRatio } : s));
  }, []);

  const requestGeminiEvaluation = useCallback(async (prev, curr) => {
    setEvalLoading(true);
    try {
      const snap = (list, type) => list
        .filter(s => s.noteType === type)
        .map(s => ({ ingredientName: s.ingredientName, ratio: s.ratio }));
      const toSnapshot = (list) => ({
        topNotes:    snap(list, 'top'),
        middleNotes: snap(list, 'middle'),
        baseNotes:   snap(list, 'base'),
      });
      const res = await fetch(`${API_BASE}/api/ai/gemini-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousRecipe: toSnapshot(prev), currentRecipe: toSnapshot(curr) }),
      });
      const json = await res.json();
      const evalText = json.data || '';
      setEvaluation(evalText);
      if (evalText) {
        setMessages(prev => [...prev, {
          role: 'assistant', content: `🌿 *조향 변화 평가*\n${evalText}`, isEval: true,
        }]);
      }
    } catch (e) { console.error('Gemini 평가 오류', e); }
    finally     { setEvalLoading(false); }
  }, []);

  const handleSaveBlend = useCallback(async () => {
    if (!token) { alert('로그인이 필요합니다.'); return; }

    // 저장 가능한 상태인지 명확히 검증 (조용한 실패 방지)
    if (!recipe) {
      alert('저장할 레시피가 없습니다.\nAI 조향을 먼저 진행해주세요.');
      return;
    }
    if (!sliders.length) {
      alert('재료 정보가 비어있습니다.\n페이지를 새로고침하거나 새로 조향해주세요.');
      return;
    }
    // 모든 재료에 ingredientId가 있는지 확인 (DB 저장 필수 필드)
    const invalidItem = sliders.find(s => !s.ingredientId);
    if (invalidItem) {
      alert(`재료 정보가 불완전합니다 (${invalidItem.ingredientName || '이름 없음'}).\n새로 조향해주세요.`);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/custom/scent-blends`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:          recipe.perfumeName || 'AI 조향 레시피',
          concentration: recipe.concentration || 'EDP',
          volumeMl:      50,
          totalPrice:    0,
          // 백엔드 CustomScentBlendRequest는 'items' 필드를 받음 (탭 1과 동일 형식)
          // BlendItemRequest는 ingredientId + ratio만 받음 (note type 컬럼 없음)
          items:         sliders.map(s => ({
            ingredientId: s.ingredientId,
            ratio:        s.ratio,
          })),
        }),
      });
      if (res.ok) {
        alert('조향이 저장되었습니다!');
      } else {
        const errText = await res.text().catch(() => '');
        console.error('저장 실패:', res.status, errText);
        alert(`저장에 실패했습니다 (${res.status}).`);
      }
    } catch (e) {
      console.error('저장 네트워크 오류:', e);
      alert('네트워크 오류로 저장에 실패했습니다.');
    }
  }, [token, recipe, sliders]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || ['streaming','extracting','searching'].includes(pipelineStatus)) return;
    setInput('');

    const userMsg = { role: 'user', content: text };

    // ── 캐시 체크: 첫 요청이고 동일 프롬프트면 API 재호출 없이 즉시 복원 ──
    // 후속 대화 (이미 assistant 응답이 있는 경우)는 캐시 사용 안 함 (대화 흐름 보존)
    const isFirstUserMessage = messages.filter(m => m.role === 'user' && !m.isStatus).length === 0;
    if (isFirstUserMessage) {
      const cached = SS.get(claudePromptKey(text));
      // 캐시 무결성 검증: recipe가 있고 노트가 1개 이상 있어야 유효
      const cachedValid = cached?.recipe
        && ((cached.recipe.topNotes?.length || 0)
          + (cached.recipe.middleNotes?.length || 0)
          + (cached.recipe.baseNotes?.length || 0)) > 0;
      if (cachedValid) {
        console.log('[Claude] 캐시 히트 - API 호출 생략');
        setMessages([
          ...messages,
          userMsg,
          { role: 'assistant', content: cached.assistantContent },
        ]);
        setRecipe(cached.recipe);
        initSliders(cached.recipe);
        if (cached.foundIngredients) setFoundIngredients(cached.foundIngredients);
        setStatus('done');
        return;
      } else if (cached) {
        // 깨진 캐시 발견 → 삭제 후 정상 호출 진행
        console.warn('[Claude] 손상된 캐시 발견 - 삭제 후 재요청');
        SS.del(claudePromptKey(text));
      }
    }

    setMessages(prev => [...prev, userMsg]);
    setRecipe(null); setSliders([]); setEvaluation('');
    setStatus('extracting');

    const addStatus = (content) => {
      setMessages(prev => [
        ...prev.filter(m => !m.isStatus),
        { role: 'assistant', content, isStatus: true },
      ]);
    };
    addStatus('✦ 향수 감성 키워드를 분석하고 있습니다...');

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/api/ai/claude-blend`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          userPrompt: text,
          messages:   messages
            .filter(m => !m.isStatus && !m.isEval)
            .concat([userMsg])
            .map(m => ({ role: m.role, content: m.content })),
        }),
        signal: abortRef.current.signal,
      });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let assistantContent  = '';
      let assistantMsgAdded = false;
      let localFoundIngredients = [];   // 캐시 저장용 (state 비동기 문제 회피)

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());

            if (data.status === 'extracting_keywords') {
              setStatus('extracting');
              addStatus('✦ Gemini가 향수 재료 키워드를 추출하고 있습니다...');

            } else if (data.status === 'searching_ingredients') {
              setStatus('searching');
              addStatus('✦ Supabase에서 매칭 재료를 검색하고 있습니다...');

            } else if (data.status === 'ingredients_found') {
              localFoundIngredients = data.ingredients || [];
              setFoundIngredients(localFoundIngredients);
              addStatus(`✦ ${data.count || 0}개의 재료를 찾았습니다. Claude가 조향을 시작합니다...`);
              setStatus('streaming');
              if (!assistantMsgAdded) {
                setMessages(prev => [
                  ...prev.filter(m => !m.isStatus),
                  { role: 'assistant', content: '' },
                ]);
                assistantMsgAdded = true;
              }

            } else if (data.delta) {
              assistantContent += data.delta;
              const displayText = assistantContent.replace(/<recipe>[\s\S]*$/g, '');
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant' && !last.isStatus) {
                  updated[updated.length - 1] = { ...last, content: displayText };
                }
                return updated;
              });

            } else if (data.done) {
              setStatus('done');
              let parsedRecipe = null;
              if (data.recipeJson && data.recipeJson !== '{}') {
                try {
                  parsedRecipe = JSON.parse(data.recipeJson);
                  setRecipe(parsedRecipe); initSliders(parsedRecipe);
                } catch (e) { console.error('레시피 파싱 오류', e); }
              }
              // 첫 요청이었다면 캐시에 저장 (동일 프롬프트 재사용 시 비용 절감)
              // 단, 파싱된 레시피에 노트가 모두 들어있을 때만 캐시 (깨진 캐시 방지)
              const recipeValid = parsedRecipe
                && (parsedRecipe.topNotes?.length || 0)
                 + (parsedRecipe.middleNotes?.length || 0)
                 + (parsedRecipe.baseNotes?.length || 0) > 0;
              if (isFirstUserMessage && recipeValid) {
                const displayContent = assistantContent.replace(/<recipe>[\s\S]*?<\/recipe>/g, '').trim();
                SS.set(claudePromptKey(text), {
                  assistantContent: displayContent,
                  recipe: parsedRecipe,
                  foundIngredients: localFoundIngredients,
                  cachedAt: Date.now(),
                });
              }

            } else if (data.error) {
              throw new Error(data.error);
            }
          } catch { /* 불완전한 청크 무시 */ }
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') return;
      setStatus('error');
      // 백엔드가 보낸 사용자 친화 메시지가 있으면 그걸 우선 표시
      const userMessage = e.message && e.message.length < 200
        ? e.message
        : '조향 중 오류가 발생했습니다. 다시 시도해 주세요.';
      setMessages(prev => [
        ...prev.filter(m => !m.isStatus),
        { role: 'assistant', content: userMessage },
      ]);
    }
  }, [input, messages, pipelineStatus, initSliders]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  }, [sendMessage]);

  const resetAll = useCallback(() => {
    abortRef.current?.abort();
    setMessages(INITIAL_MSG); setRecipe(null); setSliders([]);
    setEvaluation(''); setStatus('idle'); setInput(''); setFoundIngredients([]);
    ['claude_messages','claude_recipe','claude_sliders','claude_eval','claude_status']
      .forEach(k => SS.del(k));
  }, []);

  const isBusy     = useMemo(() => ['extracting','searching','streaming'].includes(pipelineStatus), [pipelineStatus]);
  const totalRatio = useMemo(() => sliders.reduce((s, item) => s + item.ratio, 0), [sliders]);

  return (
    <div className="flex gap-6 items-start">

      {/* ── 좌: 채팅 ──────────────────────────────────────────── */}
      <div className="flex flex-col min-w-0" style={{ flex: recipe ? '0 0 55%' : '1' }}>
        {isBusy && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#c9a961]/5 border border-[#c9a961]/20 mb-3 text-[11px] text-[#c9a961]">
            <div className="w-3 h-3 border border-[#c9a961] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            {pipelineStatus === 'extracting' && 'Gemini: 키워드 추출 중...'}
            {pipelineStatus === 'searching'  && 'Supabase: 재료 검색 중...'}
            {pipelineStatus === 'streaming'  && 'Claude: 조향 중...'}
          </div>
        )}

        {/*
          채팅 영역 높이:
          - 첫 화면 (안내문 1줄만 있을 때): 280px (기존 절반)
          - 대화 시작 후: 560px / 레시피 있을 때: 520px
          isInitial 판정: assistant 안내문 한 줄만 있고 다른 메시지 없는 상태
        */}
        <div ref={chatBoxRef}
             className="overflow-y-auto space-y-4 pr-1 mb-4"
             style={{
               height: messages.length <= 1 ? '280px' : (recipe ? '520px' : '560px'),
               transition: 'height 0.3s ease',
               scrollbarWidth: 'thin',
               scrollbarColor: `${gold} #f5f1e8`,
             }}>
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg}
              isStreaming={isBusy && i === messages.length - 1 && msg.role === 'assistant' && !msg.isStatus} />
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="border border-[#e8e2d6] bg-white flex items-end gap-2 p-3">
          <textarea ref={textareaRef} value={input}
            onChange={e => {
              setInput(e.target.value);
              e.target.style.height = 'auto';
              e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
            }}
            onKeyDown={handleKeyDown}
            placeholder={isBusy ? '조향 중입니다...' : '향수 감성을 자유롭게 입력하세요... (Enter 전송)'}
            disabled={isBusy}
            rows={1}
            className="flex-1 outline-none text-sm text-[#2a2620] placeholder:text-[#c0b8a8] resize-none bg-transparent leading-relaxed"
            style={{ maxHeight: '120px' }}
          />
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={resetAll} title="초기화"
              className="w-9 h-9 border border-[#e8e2d6] flex items-center justify-center text-[#8b8278] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors">
              <RotateCcw size={14} />
            </button>
            <button onClick={sendMessage} disabled={!input.trim() || isBusy}
              className="w-9 h-9 flex items-center justify-center transition-all disabled:opacity-30"
              style={{ background: dark }}>
              <Send size={14} color={gold} />
            </button>
          </div>
        </div>

        <p className="text-[9px] text-[#c0b8a8] text-center mt-2 tracking-wider">
          Gemini → Supabase → Claude 3단계 파이프라인
        </p>
      </div>

      {/* ── 우: 레시피 슬라이더 패널 ──────────────────────────── */}
      {recipe && (
        <div className="flex-1 min-w-0 border border-[#c9a961]/30 bg-[#1a1a1a] overflow-hidden"
             style={{ animation: 'slideIn .4s ease forwards' }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>

          <div className="px-5 py-4 border-b border-[#c9a961]/20">
            <p className="text-[9px] tracking-[0.6em] text-[#c9a961]/60 mb-1">AI RECIPE</p>
            <p className="font-serif text-base text-white tracking-wider">{recipe.perfumeName}</p>
            <p className="text-[10px] text-[#c9a961]/70 italic mt-0.5">{recipe.concept}</p>
          </div>

          <div className="px-5 pt-4 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={11} className="text-[#c9a961]/50" />
              <span className="text-[10px] text-[#c9a961]/50 tracking-wider">비율 조절</span>
            </div>
            <span className={`text-[10px] tracking-wider ${Math.abs(totalRatio - 1) < 0.01 ? 'text-[#c9a961]' : 'text-red-400'}`}>
              합계 {Math.round(totalRatio * 100)}%
            </span>
          </div>

          <div className="px-5 pb-4 space-y-4 overflow-y-auto" style={{ maxHeight: '380px' }}>
            {['top','middle','base'].map(noteType => {
              const noteItems = sliders.filter(s => s.noteType === noteType);
              if (!noteItems.length) return null;
              const label = { top: 'TOP', middle: 'MIDDLE', base: 'BASE' }[noteType];
              return (
                <div key={noteType}>
                  <p className="text-[9px] tracking-[0.4em] text-[#c9a961]/50 mb-2">{label} NOTE</p>
                  {noteItems.map((item, globalIdx) => {
                    const idx = sliders.findIndex(s => s === item);
                    return (
                      <div key={item.ingredientId ?? globalIdx} className="mb-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs text-white/80">{item.ingredientName}</span>
                          <span className="text-[11px] text-[#c9a961] w-10 text-right">{Math.round(item.ratio * 100)}%</span>
                        </div>
                        <div className="relative h-1.5 bg-white/10 rounded-full">
                          <div className="absolute inset-y-0 left-0 bg-[#c9a961] rounded-full transition-all duration-150"
                               style={{ width: `${item.ratio * 100}%` }} />
                          <input type="range" min={0} max={100} step={1}
                            value={Math.round(item.ratio * 100)}
                            onChange={e => handleSliderChange(idx, Number(e.target.value) / 100)}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                            style={{ zIndex: 2 }} />
                        </div>
                        {item.reason && (
                          <p className="text-[9px] text-white/30 mt-1 italic">{item.reason}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {(evaluation || evalLoading) && (
            <div className="mx-5 mb-4 p-3 border border-[#c9a961]/20 bg-white/5">
              <p className="text-[9px] tracking-[0.4em] text-[#c9a961]/60 mb-2">GEMINI EVALUATION</p>
              {evalLoading
                ? <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <div className="w-3 h-3 border border-white/30 border-t-[#c9a961] rounded-full animate-spin" />평가 중...
                  </div>
                : <p className="text-[11px] text-white/70 leading-relaxed italic">{evaluation}</p>
              }
            </div>
          )}

          <div className="px-5 pb-3 flex flex-wrap gap-3 border-t border-white/10 pt-3">
            {[['농도', recipe.concentration], ['계절', recipe.recommendedSeason], ['TPO', recipe.recommendedOccasion]]
              .filter(([, v]) => v)
              .map(([k, v]) => (
                <div key={k}>
                  <span className="text-[9px] text-[#c9a961]/50">{k} </span>
                  <span className="text-[10px] text-white/60">{v}</span>
                </div>
              ))}
          </div>

          <div className="px-5 pb-5">
            <button onClick={handleSaveBlend}
              className="w-full py-3 bg-[#c9a961] text-[#1a1a1a] text-[11px] tracking-[0.4em] font-semibold hover:bg-[#e0c070] transition-colors">
              조향 저장하기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 채팅 말풍선 ──────────────────────────────────────────────
const ChatBubble = ({ msg, isStreaming }) => {
  const isUser   = msg.role === 'user';
  const isStatus = msg.isStatus;
  const isEval   = msg.isEval;

  if (isStatus) {
    return (
      <div className="flex items-center gap-2 text-[11px] text-[#8b8278] italic pl-2">
        <div className="w-1 h-1 rounded-full bg-[#c9a961]/50" />
        {msg.content}
      </div>
    );
  }

  const displayContent = (msg.content || '').replace(/<recipe>[\s\S]*?<\/recipe>/g, '');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className={`w-7 h-7 flex-shrink-0 flex items-center justify-center mr-2 mt-0.5 ${isEval ? 'bg-[#2a6049]' : 'bg-[#1a1a1a]'}`}>
          <span className="text-[#c9a961] text-[10px]">{isEval ? '🌿' : '✦'}</span>
        </div>
      )}
      <div className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser   ? 'bg-[#1a1a1a] text-white'
        : isEval ? 'bg-[#f0f9f4] border border-[#c9e8d5] text-[#2a6049]'
                 : 'bg-white border border-[#e8e2d6] text-[#2a2620]'
      }`}>
        {displayContent}
        {isStreaming && <span className="inline-block w-1 h-4 bg-[#c9a961] ml-0.5 animate-pulse align-middle" />}
      </div>
    </div>
  );
};