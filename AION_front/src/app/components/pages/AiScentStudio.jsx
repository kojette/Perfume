/**
 * AiScentStudio.jsx
 *
 * 탭 ① 향 조합하기  — ScentBlend (기존 그대로)
 * 탭 ② AI 소믈리에  — Gemini Vision: 이미지 → 기성 향수 추천
 * 탭 ③ AI 조향사    — 파이프라인: 입력 → Gemini 키워드 → Supabase 재료 → Claude 조향
 *                     + 우측 슬라이더 패널 + Gemini 변경 평가
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload, Send, Sparkles, Camera, MessageSquare,
  X, ChevronDown, RotateCcw, FlaskConical, Sliders
} from 'lucide-react';
import ScentBlend from './ScentBlend';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
const gold = '#c9a961';
const dark = '#1a1a1a';
const muted = '#8b8278';

// ══════════════════════════════════════════════════════════════
// 메인
// ══════════════════════════════════════════════════════════════
export default function AiScentStudio() {
  const [tab, setTab] = useState('blend');

  return (
    <div className="py-2">
      {/* 탭 바 */}
      <div className="flex border border-[#c9a961]/30 mb-8 overflow-hidden max-w-3xl mx-auto">
        {[
          { id: 'blend',  icon: <FlaskConical size={13}/>, label: '향 조합하기',  sub: 'My Scent Lab'   },
          { id: 'gemini', icon: <Camera size={13}/>,       label: 'AI 소믈리에',  sub: 'Gemini Vision'  },
          { id: 'claude', icon: <MessageSquare size={13}/>,label: 'AI 조향사',    sub: 'Claude Chat'    },
        ].map((t, i, arr) => (
          <div key={t.id} className="flex flex-1">
            <button
              onClick={() => setTab(t.id)}
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

      {tab === 'blend'  && <div className="max-w-3xl mx-auto"><ScentBlend /></div>}
      {tab === 'gemini' && <div className="max-w-3xl mx-auto"><GeminiPanel /></div>}
      {tab === 'claude' && <ClaudePanel />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// 탭 2: GEMINI 이미지 → 기성 향수 추천 (이미지 업로드만)
// ══════════════════════════════════════════════════════════════
function GeminiPanel() {
  const navigate = useNavigate();
  const [image, setImage]     = useState(null);
  const [result, setResult]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 가능합니다.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('10MB 이하 파일만 가능합니다.'); return; }
    setImage({ file, preview: URL.createObjectURL(file) });
    setError(''); setResult(null);
  };

  const handleAnalyze = async () => {
    if (!image) return;
    setError(''); setResult(null); setLoading(true);
    try {
      const fd = new FormData();
      fd.append('image', image.file);
      const res = await fetch(`${API_BASE}/api/ai/image-to-scent`, { method: 'POST', body: fd });
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const json = await res.json();
      setResult(json.data || json);
    } catch (e) {
      setError(e.message || '분석 실패. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => { setResult(null); setImage(null); setError(''); };

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#c9a961]/20 px-8 py-5 text-center">
        <p className="text-[9px] tracking-[0.6em] text-[#c9a961] mb-1">AI SOMMELIER</p>
        <p className="font-serif text-lg text-[#1a1a1a] tracking-wider mb-1">이미지로 향수 찾기</p>
        <p className="text-[11px] text-[#8b8278] italic">사진 속 분위기에 어울리는 기성 향수를 추천해드립니다</p>
      </div>

      {/* 이미지 업로드 */}
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
          <img src={image.preview} alt="업로드" className="w-full max-h-72 object-cover border border-[#e8e2d6]" />
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
            : <><Sparkles size={13} />AI 향수 분석 시작</>
          }
        </button>
      )}

      {/* 결과 */}
      {result && (
        <div className="space-y-5" style={{ animation: 'fadeUp .5s ease forwards' }}>
          <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>
          <div className="bg-[#1a1a1a] px-7 py-6 text-center">
            <p className="text-[9px] tracking-[0.6em] text-[#c9a961]/60 mb-2">AI ANALYSIS</p>
            <p className="font-serif text-lg text-white tracking-wider mb-3">{result.mood}</p>
            <p className="text-sm text-[#c0b8a8] italic leading-relaxed">{result.analysisText}</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {[['TOP NOTE','탑노트','topNotes'],['MIDDLE NOTE','미들','middleNotes'],['BASE NOTE','베이스','baseNotes']].map(([lbl,,key]) => (
              <div key={key} className="bg-white border border-[#e8e2d6] p-4">
                <p className="text-[9px] tracking-[0.4em] text-[#c9a961] mb-3">{lbl}</p>
                {(result[key] || []).map((n, i) => (
                  <span key={i} className="block text-xs text-[#2a2620] py-0.5 border-b border-[#f0ece4] last:border-0">{n}</span>
                ))}
              </div>
            ))}
          </div>
          {result.recommendedPerfumes?.length > 0 && (
            <div>
              <p className="text-[10px] tracking-[0.5em] text-[#8b8278] mb-3">RECOMMENDED FOR YOU</p>
              <div className="space-y-2">
                {result.recommendedPerfumes.map(p => (
                  <button key={p.id}
                    onClick={() => navigate('/collections', { state: { targetPerfumeId: p.id } })}
                    className="w-full flex items-center gap-4 p-4 bg-white border border-[#e8e2d6] hover:border-[#c9a961]/60 hover:shadow-sm transition-all text-left group">
                    <div className="w-12 h-12 bg-[#f0ece4] flex-shrink-0 overflow-hidden">
                      {p.imageUrl
                        ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        : <span className="w-full h-full flex items-center justify-center font-serif text-lg text-[#c9a961]/30">{p.name?.charAt(0)}</span>
                      }
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
// 탭 3: AI 조향사 — 좌우 분할
// 좌: 채팅 (파이프라인 진행 상태 + Claude 스트리밍)
// 우: 레시피 슬라이더 패널 (조향 완료 후 표시)
// ══════════════════════════════════════════════════════════════
function ClaudePanel() {
  // ── 채팅 상태 ────────────────────────────────────────────
  const [messages, setMessages]     = useState([{
    role: 'assistant',
    content: '안녕하세요. AI 조향사입니다. ✦\n\n원하시는 향수의 감성이나 상황을 자유롭게 말씀해 주세요.\n예: "비 오는 날 카페에서 책 읽는 따뜻한 느낌"',
  }]);
  const [input, setInput]           = useState('');
  const [pipelineStatus, setStatus] = useState('idle');
  // idle | extracting | searching | streaming | done | error
  const [foundIngredients, setFoundIngredients] = useState([]); // Supabase 검색 결과

  // ── 레시피 / 슬라이더 상태 ────────────────────────────────
  const [recipe, setRecipe]         = useState(null);  // 파싱된 레시피 객체
  const [sliders, setSliders]       = useState([]);    // [{ingredientId, ingredientName, noteType, ratio}]
  const [prevSliders, setPrevSliders] = useState([]);  // Gemini 평가 직전 스냅샷
  const [evaluation, setEvaluation] = useState('');    // Gemini 평가 텍스트
  const [evalLoading, setEvalLoading] = useState(false);
  const evalTimerRef = useRef(null);                   // 슬라이더 변경 디바운스 타이머

  const chatEndRef  = useRef();
  const textareaRef = useRef();
  const token = sessionStorage.getItem('accessToken');

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ── 슬라이더 변경 감지 → Gemini 평가 ─────────────────────
  useEffect(() => {
    if (!recipe || sliders.length === 0) return;

    // 1초 디바운스
    clearTimeout(evalTimerRef.current);
    evalTimerRef.current = setTimeout(() => {
      if (prevSliders.length > 0) {
        requestGeminiEvaluation(prevSliders, sliders);
      }
      setPrevSliders([...sliders]);
    }, 1000);

    return () => clearTimeout(evalTimerRef.current);
  }, [sliders]);

  // ── 레시피 파싱 → 슬라이더 초기화 ───────────────────────
  const initSliders = useCallback((parsedRecipe) => {
    const items = [
      ...(parsedRecipe.topNotes    || []).map(n => ({ ...n, noteType: 'top' })),
      ...(parsedRecipe.middleNotes || []).map(n => ({ ...n, noteType: 'middle' })),
      ...(parsedRecipe.baseNotes   || []).map(n => ({ ...n, noteType: 'base' })),
    ];
    setSliders(items);
    setPrevSliders(items);
  }, []);

  // ── 슬라이더 값 변경 ─────────────────────────────────────
  const handleSliderChange = (index, newRatio) => {
    setSliders(prev => prev.map((s, i) => i === index ? { ...s, ratio: newRatio } : s));
  };

  // ── Gemini 평가 요청 ──────────────────────────────────────
  const requestGeminiEvaluation = async (prev, curr) => {
    setEvalLoading(true);
    try {
      const toSnapshot = (list) => ({
        topNotes:    list.filter(s => s.noteType === 'top').map(s => ({ ingredientName: s.ingredientName, ratio: s.ratio })),
        middleNotes: list.filter(s => s.noteType === 'middle').map(s => ({ ingredientName: s.ingredientName, ratio: s.ratio })),
        baseNotes:   list.filter(s => s.noteType === 'base').map(s => ({ ingredientName: s.ingredientName, ratio: s.ratio })),
      });

      const res = await fetch(`${API_BASE}/api/ai/gemini-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ previousRecipe: toSnapshot(prev), currentRecipe: toSnapshot(curr) }),
      });
      const json = await res.json();
      const evalText = json.data || '';
      setEvaluation(evalText);

      // 평가 결과를 채팅에 추가
      if (evalText) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `🌿 *조향 변화 평가*\n${evalText}`,
          isEval: true,
        }]);
      }
    } catch (e) {
      console.error('Gemini 평가 오류', e);
    } finally {
      setEvalLoading(false);
    }
  };

  // ── 조향 저장 ─────────────────────────────────────────────
  const handleSaveBlend = async () => {
    if (!token) { alert('로그인이 필요합니다.'); return; }
    if (!recipe || sliders.length === 0) return;

    const items = sliders.map(s => ({
      ingredientId: s.ingredientId,
      type: s.noteType.toUpperCase(),
      ratio: s.ratio,
    }));

    try {
      const res = await fetch(`${API_BASE}/api/custom/scent-blends`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: recipe.perfumeName || 'AI 조향 레시피',
          concentration: recipe.concentration || 'EDP',
          volumeMl: 50,
          totalPrice: 0,
          ingredients: items,
        }),
      });
      if (res.ok) alert('조향이 저장되었습니다!');
      else alert('저장에 실패했습니다.');
    } catch { alert('네트워크 오류'); }
  };

  // ── 메시지 전송 → 파이프라인 실행 ───────────────────────
  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || pipelineStatus === 'streaming' || pipelineStatus === 'extracting' || pipelineStatus === 'searching') return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setRecipe(null);
    setSliders([]);
    setEvaluation('');
    setStatus('extracting');

    // 상태 메시지 추가
    const addStatus = (content, isStatus = true) => {
      setMessages(prev => {
        // 기존 status 메시지 제거 후 새거 추가
        const filtered = prev.filter(m => !m.isStatus);
        return [...filtered, { role: 'assistant', content, isStatus }];
      });
    };

    addStatus('✦ 향수 감성 키워드를 분석하고 있습니다...');

    try {
      const res = await fetch(`${API_BASE}/api/ai/claude-blend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userPrompt: text,
          messages: messages.filter(m => !m.isStatus && !m.isEval)
            .concat([userMsg])
            .map(m => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';
      let assistantContent = '';
      let assistantMsgAdded = false;

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

            // ── 파이프라인 상태 이벤트 ──────────────────────
            if (data.status === 'extracting_keywords') {
              setStatus('extracting');
              addStatus('✦ Gemini가 향수 재료 키워드를 추출하고 있습니다...');

            } else if (data.status === 'searching_ingredients') {
              setStatus('searching');
              addStatus('✦ Supabase에서 매칭 재료를 검색하고 있습니다...');

            } else if (data.status === 'ingredients_found') {
              setFoundIngredients(data.ingredients || []);
              const count = data.count || 0;
              addStatus(`✦ ${count}개의 재료를 찾았습니다. Claude가 조향을 시작합니다...`);
              setStatus('streaming');

              // 실제 Claude 스트리밍 메시지 추가
              if (!assistantMsgAdded) {
                setMessages(prev => {
                  const filtered = prev.filter(m => !m.isStatus);
                  return [...filtered, { role: 'assistant', content: '' }];
                });
                assistantMsgAdded = true;
              }

            // ── Claude 토큰 스트리밍 ─────────────────────────
            } else if (data.delta) {
              assistantContent += data.delta;
              // <recipe> 태그 이전 텍스트만 표시
              const displayText = assistantContent.replace(/<recipe>[\s\S]*$/g, '');
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last?.role === 'assistant' && !last.isStatus) {
                  updated[updated.length - 1] = { ...last, content: displayText };
                }
                return updated;
              });

            // ── 완료: 레시피 파싱 ────────────────────────────
            } else if (data.done) {
              setStatus('done');
              if (data.recipeJson && data.recipeJson !== '{}') {
                try {
                  const parsed = JSON.parse(data.recipeJson);
                  setRecipe(parsed);
                  initSliders(parsed);
                } catch (e) {
                  console.error('레시피 파싱 오류', e);
                }
              }

            } else if (data.error) {
              throw new Error(data.error);
            }

          } catch (parseErr) {
            // JSON 파싱 실패는 무시 (불완전한 청크)
          }
        }
      }

    } catch (e) {
      setStatus('error');
      setMessages(prev => {
        const filtered = prev.filter(m => !m.isStatus);
        return [...filtered, { role: 'assistant', content: '오류가 발생했습니다. 다시 시도해 주세요.' }];
      });
    }
  }, [input, messages, pipelineStatus, initSliders]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const resetAll = () => {
    setMessages([{
      role: 'assistant',
      content: '새로운 조향을 시작합니다. ✦\n\n어떤 향수를 원하시나요?',
    }]);
    setRecipe(null); setSliders([]); setEvaluation('');
    setStatus('idle'); setInput(''); setFoundIngredients([]);
  };

  const isBusy = ['extracting','searching','streaming'].includes(pipelineStatus);

  // ── 슬라이더 합계 (비율 표시용) ──────────────────────────
  const totalRatio = sliders.reduce((s, item) => s + item.ratio, 0);

  return (
    <div className="flex gap-6 items-start">

      {/* ── 좌: 채팅 영역 ─────────────────────────────────── */}
      <div className="flex flex-col min-w-0" style={{ flex: recipe ? '0 0 55%' : '1' }}>
        {/* 파이프라인 진행 표시 */}
        {isBusy && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#c9a961]/5 border border-[#c9a961]/20 mb-3 text-[11px] text-[#c9a961]">
            <div className="w-3 h-3 border border-[#c9a961] border-t-transparent rounded-full animate-spin flex-shrink-0" />
            {pipelineStatus === 'extracting' && 'Gemini: 키워드 추출 중...'}
            {pipelineStatus === 'searching'  && 'Supabase: 재료 검색 중...'}
            {pipelineStatus === 'streaming'  && 'Claude: 조향 중...'}
          </div>
        )}

        {/* 채팅 메시지 */}
        <div className="overflow-y-auto space-y-4 pr-1 mb-4"
             style={{ height: recipe ? '520px' : '560px', scrollbarWidth: 'thin', scrollbarColor: `${gold} #f5f1e8` }}>
          {messages.map((msg, i) => (
            <ChatBubble key={i} msg={msg}
              isStreaming={isBusy && i === messages.length - 1 && msg.role === 'assistant' && !msg.isStatus} />
          ))}
          <div ref={chatEndRef} />
        </div>

        {/* 입력창 */}
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

      {/* ── 우: 레시피 슬라이더 패널 (조향 완료 후) ────────── */}
      {recipe && (
        <div className="flex-1 min-w-0 border border-[#c9a961]/30 bg-[#1a1a1a] overflow-hidden"
             style={{ animation: 'slideIn .4s ease forwards' }}>
          <style>{`@keyframes slideIn{from{opacity:0;transform:translateX(20px)}to{opacity:1;transform:translateX(0)}}`}</style>

          {/* 헤더 */}
          <div className="px-5 py-4 border-b border-[#c9a961]/20">
            <p className="text-[9px] tracking-[0.6em] text-[#c9a961]/60 mb-1">AI RECIPE</p>
            <p className="font-serif text-base text-white tracking-wider">{recipe.perfumeName}</p>
            <p className="text-[10px] text-[#c9a961]/70 italic mt-0.5">{recipe.concept}</p>
          </div>

          {/* 비율 합계 표시 */}
          <div className="px-5 pt-4 pb-1 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sliders size={11} className="text-[#c9a961]/50" />
              <span className="text-[10px] text-[#c9a961]/50 tracking-wider">비율 조절</span>
            </div>
            <span className={`text-[10px] tracking-wider ${Math.abs(totalRatio - 1) < 0.01 ? 'text-[#c9a961]' : 'text-red-400'}`}>
              합계 {Math.round(totalRatio * 100)}%
            </span>
          </div>

          {/* 슬라이더 목록 */}
          <div className="px-5 pb-4 space-y-4 overflow-y-auto" style={{ maxHeight: '380px' }}>
            {['top', 'middle', 'base'].map(noteType => {
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
                          <span className="text-[11px] text-[#c9a961] w-10 text-right">
                            {Math.round(item.ratio * 100)}%
                          </span>
                        </div>
                        <div className="relative h-1.5 bg-white/10 rounded-full">
                          <div
                            className="absolute inset-y-0 left-0 bg-[#c9a961] rounded-full transition-all duration-150"
                            style={{ width: `${item.ratio * 100}%` }}
                          />
                          <input
                            type="range" min={0} max={100} step={1}
                            value={Math.round(item.ratio * 100)}
                            onChange={e => handleSliderChange(idx, Number(e.target.value) / 100)}
                            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
                            style={{ zIndex: 2 }}
                          />
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

          {/* Gemini 평가 */}
          {(evaluation || evalLoading) && (
            <div className="mx-5 mb-4 p-3 border border-[#c9a961]/20 bg-white/5">
              <p className="text-[9px] tracking-[0.4em] text-[#c9a961]/60 mb-2">GEMINI EVALUATION</p>
              {evalLoading
                ? <div className="flex items-center gap-2 text-[10px] text-white/40">
                    <div className="w-3 h-3 border border-white/30 border-t-[#c9a961] rounded-full animate-spin" />
                    평가 중...
                  </div>
                : <p className="text-[11px] text-white/70 leading-relaxed italic">{evaluation}</p>
              }
            </div>
          )}

          {/* 메타 정보 */}
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

          {/* 저장 버튼 */}
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
function ChatBubble({ msg, isStreaming }) {
  const isUser = msg.role === 'user';
  const isStatus = msg.isStatus;
  const isEval = msg.isEval;

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
        isUser
          ? 'bg-[#1a1a1a] text-white'
          : isEval
          ? 'bg-[#f0f9f4] border border-[#c9e8d5] text-[#2a6049]'
          : 'bg-white border border-[#e8e2d6] text-[#2a2620]'
      }`}>
        {displayContent}
        {isStreaming && (
          <span className="inline-block w-1 h-4 bg-[#c9a961] ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}
