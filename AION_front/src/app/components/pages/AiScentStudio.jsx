/**
 * AiScentStudio.jsx
 *
 * Customization.jsx의 'scent' 탭에 추가되는 AI 조향 스튜디오.
 * 기존 ScentBlend 컴포넌트 위에 올라타는 구조.
 *
 * 탭 구성:
 *  ① AI 소믈리에 (Gemini) - 이미지 업로드 or 키워드 → 향수 추천
 *  ② AI 조향사 (Claude)  - 채팅으로 나만의 조향 레시피 설계
 *
 * 사용법 (Customization.jsx):
 *   import AiScentStudio from './AiScentStudio';
 *   // activeMode === 'scent' 렌더 부분에:
 *   <AiScentStudio />
 *   // 기존 <ScentBlend /> 아래 또는 대체
 */

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload, Send, Sparkles, Camera, MessageSquare, X, ChevronDown, RotateCcw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ── 공통 스타일 토큰 ────────────────────────────────────────
const gold   = '#c9a961';
const dark   = '#1a1a1a';
const bg     = '#faf8f3';
const muted  = '#8b8278';
const border = '#e8e2d6';

// ══════════════════════════════════════════════════════════════
// 메인 컴포넌트
// ══════════════════════════════════════════════════════════════
export default function AiScentStudio() {
  const [activeAiTab, setActiveAiTab] = useState('gemini'); // 'gemini' | 'claude'

  return (
    <div className="max-w-3xl mx-auto py-2">
      {/* AI 탭 선택 */}
      <div className="flex border border-[#c9a961]/30 mb-8 overflow-hidden">
        <AiTabBtn
          active={activeAiTab === 'gemini'}
          onClick={() => setActiveAiTab('gemini')}
          icon={<Camera size={13} />}
          label="AI 소믈리에"
          sub="Gemini Vision"
        />
        <div className="w-px bg-[#c9a961]/20" />
        <AiTabBtn
          active={activeAiTab === 'claude'}
          onClick={() => setActiveAiTab('claude')}
          icon={<MessageSquare size={13} />}
          label="AI 조향사"
          sub="Claude Chat"
        />
      </div>

      {activeAiTab === 'gemini' ? <GeminiPanel /> : <ClaudePanel />}
    </div>
  );
}

function AiTabBtn({ active, onClick, icon, label, sub }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex items-center justify-center gap-2.5 py-4 transition-all duration-300 ${
        active ? 'bg-[#1a1a1a] text-[#c9a961]' : 'bg-white text-[#8b8278] hover:text-[#c9a961]'
      }`}
    >
      {icon}
      <span className="text-[11px] tracking-[0.2em]">{label}</span>
      <span className={`text-[9px] px-1.5 py-0.5 ${active ? 'bg-[#c9a961]/20' : 'bg-[#f0ece4]'}`}>
        {sub}
      </span>
    </button>
  );
}

// ══════════════════════════════════════════════════════════════
// GEMINI PANEL - 이미지 / 키워드 → 향수 분석
// ══════════════════════════════════════════════════════════════
function GeminiPanel() {
  const navigate   = useNavigate();
  const [mode, setMode]           = useState('keyword'); // 'keyword' | 'image'
  const [query, setQuery]         = useState('');
  const [image, setImage]         = useState(null);      // { file, preview }
  const [result, setResult]       = useState(null);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');
  const fileRef = useRef();

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('이미지 파일만 업로드 가능합니다.'); return; }
    if (file.size > 10 * 1024 * 1024) { setError('파일 크기는 10MB 이하여야 합니다.'); return; }
    setImage({ file, preview: URL.createObjectURL(file) });
    setError('');
    setResult(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleImageChange({ target: { files: [file] } });
  };

  const handleAnalyze = async () => {
    setError('');
    setResult(null);
    setLoading(true);
    try {
      let res;
      if (mode === 'image' && image) {
        // 이미지 → multipart 전송
        const fd = new FormData();
        fd.append('image', image.file);
        res = await fetch(`${API_BASE}/api/ai/image-to-scent`, { method: 'POST', body: fd });
      } else {
        if (!query.trim()) { setError('키워드를 입력해주세요.'); setLoading(false); return; }
        res = await fetch(`${API_BASE}/api/ai/keyword-search`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: query.trim() }),
        });
      }
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const json = await res.json();
      setResult(json.data || json);
    } catch (e) {
      setError(e.message || '분석에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null); setImage(null); setQuery(''); setError('');
  };

  return (
    <div className="space-y-6">
      {/* 모드 토글 */}
      <div className="flex items-center gap-1 bg-white border border-[#e8e2d6] p-1 w-fit">
        {[['keyword', '✦ 키워드로 찾기'], ['image', '◎ 이미지로 찾기']].map(([m, lbl]) => (
          <button
            key={m}
            onClick={() => { setMode(m); reset(); }}
            className={`px-5 py-2 text-[10px] tracking-widest transition-all duration-200 ${
              mode === m ? 'bg-[#1a1a1a] text-[#c9a961]' : 'text-[#8b8278] hover:text-[#c9a961]'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* 입력 영역 */}
      {mode === 'keyword' ? (
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.4em] text-[#8b8278]">DESCRIBE YOUR MOOD</p>
          <div className="relative">
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !loading) { e.preventDefault(); handleAnalyze(); }}}
              placeholder={`감성이나 상황을 자유롭게 적어보세요\n예: "비 오는 날 카페에서 책 읽는 느낌"\n예: "깊은 숲속 새벽 안개 같은 향"`}
              rows={4}
              className="w-full px-5 py-4 border border-[#e8e2d6] bg-white text-sm text-[#2a2620] placeholder:text-[#c0b8a8] outline-none focus:border-[#c9a961] resize-none tracking-wide leading-relaxed transition-colors"
            />
          </div>
          {/* 예시 태그 */}
          <div className="flex flex-wrap gap-2">
            {['봄 소풍 햇살', '도서관 오래된 책', '겨울 따뜻한 홍차', '재즈바 깊은 밤'].map(ex => (
              <button
                key={ex}
                onClick={() => setQuery(ex)}
                className="text-[10px] px-3 py-1.5 border border-[#e8e2d6] text-[#8b8278] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[10px] tracking-[0.4em] text-[#8b8278]">UPLOAD YOUR IMAGE</p>
          {!image ? (
            <div
              onDrop={handleDrop}
              onDragOver={e => e.preventDefault()}
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-[#c9a961]/30 bg-white hover:border-[#c9a961]/60 transition-colors cursor-pointer py-16 flex flex-col items-center gap-3 group"
            >
              <Upload size={28} className="text-[#c9a961]/40 group-hover:text-[#c9a961]/70 transition-colors" />
              <p className="text-sm text-[#8b8278] tracking-wider">이미지를 드래그하거나 클릭하여 업로드</p>
              <p className="text-[10px] text-[#c0b8a8]">JPG, PNG, WEBP · 최대 10MB</p>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </div>
          ) : (
            <div className="relative">
              <img src={image.preview} alt="업로드" className="w-full max-h-64 object-cover border border-[#e8e2d6]" />
              <button
                onClick={() => setImage(null)}
                className="absolute top-2 right-2 w-7 h-7 bg-white/90 border border-[#e8e2d6] flex items-center justify-center hover:border-[#c9a961] transition-colors"
              >
                <X size={13} className="text-[#8b8278]" />
              </button>
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-400 tracking-wide">{error}</p>}

      {/* 분석 버튼 */}
      {!result && (
        <button
          onClick={handleAnalyze}
          disabled={loading || (mode === 'image' && !image)}
          className="w-full py-4 flex items-center justify-center gap-2.5 tracking-[0.4em] text-[11px] transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: loading ? '#e8e2d6' : dark,
            color: loading ? muted : gold,
          }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-[#c9a961]/40 border-t-[#c9a961] rounded-full animate-spin" />
              ANALYZING...
            </>
          ) : (
            <>
              <Sparkles size={13} />
              AI 향수 분석 시작
            </>
          )}
        </button>
      )}

      {/* 결과 */}
      {result && <GeminiResult result={result} onReset={reset} onNavigate={id => navigate('/collections', { state: { targetPerfumeId: id } })} />}
    </div>
  );
}

function GeminiResult({ result, onReset, onNavigate }) {
  return (
    <div className="space-y-5 animate-[fadeUp_0.5s_ease_forwards]">
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* 무드 헤더 */}
      <div className="bg-[#1a1a1a] px-7 py-6 text-center">
        <p className="text-[9px] tracking-[0.6em] text-[#c9a961]/60 mb-2">AI ANALYSIS</p>
        <p className="font-serif text-lg text-white tracking-wider mb-3">{result.mood}</p>
        <p className="text-sm text-[#c0b8a8] leading-relaxed italic">{result.analysisText}</p>
      </div>

      {/* 노트 구성 */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'TOP NOTE',    items: result.topNotes,    desc: '처음 15분' },
          { label: 'MIDDLE NOTE', items: result.middleNotes, desc: '2-4시간' },
          { label: 'BASE NOTE',   items: result.baseNotes,   desc: '4시간+' },
        ].map(({ label, items, desc }) => (
          <div key={label} className="bg-white border border-[#e8e2d6] p-4">
            <p className="text-[9px] tracking-[0.4em] text-[#c9a961] mb-1">{label}</p>
            <p className="text-[9px] text-[#c0b8a8] mb-3">{desc}</p>
            {(items || []).map((n, i) => (
              <span key={i} className="block text-xs text-[#2a2620] py-0.5 border-b border-[#f0ece4] last:border-0">{n}</span>
            ))}
          </div>
        ))}
      </div>

      {/* 키워드 태그 */}
      {result.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {result.keywords.map((kw, i) => (
            <span key={i} className="text-[10px] px-3 py-1.5 border border-[#c9a961]/40 text-[#c9a961] tracking-wider">
              #{kw}
            </span>
          ))}
        </div>
      )}

      {/* 추천 향수 */}
      {result.recommendedPerfumes?.length > 0 && (
        <div>
          <p className="text-[10px] tracking-[0.5em] text-[#8b8278] mb-3">RECOMMENDED FOR YOU</p>
          <div className="space-y-2">
            {result.recommendedPerfumes.map((p) => (
              <button
                key={p.id}
                onClick={() => onNavigate(p.id)}
                className="w-full flex items-center gap-4 p-4 bg-white border border-[#e8e2d6] hover:border-[#c9a961]/60 hover:shadow-sm transition-all text-left group"
              >
                <div className="w-12 h-12 bg-[#f0ece4] flex-shrink-0 overflow-hidden">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    : <span className="w-full h-full flex items-center justify-center font-serif text-lg text-[#c9a961]/30">{p.name?.charAt(0)}</span>
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-[#2a2620] truncate">{p.name}</p>
                  <p className="text-[10px] text-[#c9a961] italic">{p.brand}</p>
                  <p className="text-[9px] text-[#a39d8f] mt-1 truncate">{p.matchReason}</p>
                </div>
                <p className="text-sm text-[#c9a961] flex-shrink-0">₩{p.price?.toLocaleString()}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={onReset}
        className="w-full py-3 flex items-center justify-center gap-2 border border-[#e8e2d6] text-[#8b8278] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors text-[11px] tracking-widest"
      >
        <RotateCcw size={12} /> 다시 분석하기
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
// CLAUDE PANEL - 채팅 기반 AI 조향
// ══════════════════════════════════════════════════════════════
function ClaudePanel() {
  const [messages, setMessages]   = useState([]);           // { role, content }[]
  const [input, setInput]         = useState('');
  const [streaming, setStreaming] = useState(false);
  const [recipe, setRecipe]       = useState(null);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [ingredients, setIngredients] = useState([]);       // Supabase 재료 목록 (top20)
  const chatEndRef = useRef();
  const textareaRef = useRef();

  // 컴포넌트 마운트 시 재료 목록 로드 (keyword 필터링용)
  useEffect(() => {
    fetch(`${API_BASE}/api/custom/scents`)
      .then(r => r.json())
      .then(json => {
        // 카테고리별 재료 flatten → 이름만 top 20
        const cats = json.data || json || [];
        const all = cats.flatMap(c => (c.ingredients || []).map(i => i.name)).filter(Boolean);
        setIngredients(all.slice(0, 20));
      })
      .catch(() => {});
  }, []);

  // 스크롤 하단 유지
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 첫 메시지 (어시스턴트 인사)
  useEffect(() => {
    setMessages([{
      role: 'assistant',
      content: '안녕하세요. 저는 AI 조향사입니다. ✦\n\n어떤 향수를 만들고 싶으신가요? 평소 좋아하는 향, 특별한 기억, 혹은 오늘의 기분을 말씀해 주시면 세상에 하나뿐인 향수를 설계해 드리겠습니다.',
    }]);
  }, []);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setStreaming(true);
    setRecipe(null);

    // 스트리밍 시작 - 빈 assistant 메시지 추가
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const res = await fetch(`${API_BASE}/api/ai/claude-blend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          availableIngredients: ingredients,
        }),
      });

      if (!res.ok) throw new Error(`오류: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE 라인 파싱
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 마지막 불완전 라인 버퍼에 유지

        for (const line of lines) {
          if (!line.startsWith('data:')) continue;
          try {
            const data = JSON.parse(line.slice(5).trim());
            if (data.delta) {
              // 토큰 단위로 마지막 assistant 메시지에 append
              setMessages(prev => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                if (last.role === 'assistant') {
                  updated[updated.length - 1] = { ...last, content: last.content + data.delta };
                }
                return updated;
              });
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: '죄송합니다, 오류가 발생했습니다. 다시 시도해 주세요.' };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  }, [input, messages, streaming, ingredients]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Claude 조향 레시피 최종 생성
  const generateRecipe = async () => {
    if (messages.length < 3) {
      alert('조향사와 충분히 대화한 후 레시피를 생성해주세요.');
      return;
    }
    setRecipeLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/ai/claude-recipe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages, availableIngredients: ingredients }),
      });
      const json = await res.json();
      setRecipe(json.data || json);
    } catch {
      alert('레시피 생성에 실패했습니다.');
    } finally {
      setRecipeLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([{
      role: 'assistant',
      content: '새로운 조향을 시작합니다. ✦\n\n어떤 향수를 원하시나요?',
    }]);
    setRecipe(null);
    setInput('');
  };

  return (
    <div className="flex flex-col h-[700px]">
      {/* 채팅 영역 */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4 scrollbar-thin"
           style={{ scrollbarWidth: 'thin', scrollbarColor: `${gold} #f5f1e8` }}>
        {messages.map((msg, i) => (
          <ChatBubble key={i} msg={msg} isStreaming={streaming && i === messages.length - 1 && msg.role === 'assistant'} />
        ))}
        <div ref={chatEndRef} />
      </div>

      {/* 레시피 미리보기 - 채팅 내 <recipe> 태그 감지 시 표시 */}
      {messages.some(m => m.content?.includes('<recipe>')) && !recipe && (
        <div className="mb-3 p-3 border border-[#c9a961]/30 bg-[#c9a961]/5 flex items-center justify-between">
          <p className="text-[11px] text-[#c9a961] tracking-wider">조향 레시피가 준비되었습니다</p>
          <button
            onClick={generateRecipe}
            disabled={recipeLoading}
            className="text-[10px] px-4 py-2 bg-[#1a1a1a] text-[#c9a961] tracking-wider hover:bg-[#c9a961] hover:text-[#1a1a1a] transition-all disabled:opacity-50"
          >
            {recipeLoading ? '생성 중...' : '조향지 만들기 →'}
          </button>
        </div>
      )}

      {/* 조향지 */}
      {recipe && <RecipeCard recipe={recipe} onClose={() => setRecipe(null)} />}

      {/* 입력 바 */}
      <div className="border border-[#e8e2d6] bg-white flex items-end gap-2 p-3">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => { setInput(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'; }}
          onKeyDown={handleKeyDown}
          placeholder="조향사와 대화해보세요... (Enter로 전송)"
          disabled={streaming}
          rows={1}
          className="flex-1 outline-none text-sm text-[#2a2620] placeholder:text-[#c0b8a8] resize-none bg-transparent leading-relaxed"
          style={{ maxHeight: '120px' }}
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={generateRecipe}
            disabled={recipeLoading || messages.length < 3}
            title="조향지 생성"
            className="w-9 h-9 border border-[#c9a961]/40 flex items-center justify-center text-[#c9a961]/60 hover:border-[#c9a961] hover:text-[#c9a961] transition-colors disabled:opacity-30"
          >
            <Sparkles size={14} />
          </button>
          <button
            onClick={resetChat}
            title="대화 초기화"
            className="w-9 h-9 border border-[#e8e2d6] flex items-center justify-center text-[#8b8278] hover:border-[#c9a961] hover:text-[#c9a961] transition-colors"
          >
            <RotateCcw size={14} />
          </button>
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="w-9 h-9 flex items-center justify-center transition-all duration-200 disabled:opacity-30"
            style={{ background: dark }}
          >
            <Send size={14} color={gold} />
          </button>
        </div>
      </div>
      <p className="text-[9px] text-[#c0b8a8] text-center mt-2 tracking-wider">
        ✦ 가 표시될 때 조향지를 생성할 수 있습니다
      </p>
    </div>
  );
}

// 채팅 버블
function ChatBubble({ msg, isStreaming }) {
  const isUser = msg.role === 'user';
  // <recipe>...</recipe> 태그 제거하고 표시
  const displayContent = (msg.content || '').replace(/<recipe>[\s\S]*?<\/recipe>/g, '\n✦ [조향 레시피 포함됨]');

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 flex-shrink-0 bg-[#1a1a1a] flex items-center justify-center mr-2 mt-0.5">
          <span className="text-[#c9a961] text-[10px]">✦</span>
        </div>
      )}
      <div
        className={`max-w-[80%] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap tracking-wide ${
          isUser
            ? 'bg-[#1a1a1a] text-white'
            : 'bg-white border border-[#e8e2d6] text-[#2a2620]'
        }`}
      >
        {displayContent}
        {isStreaming && (
          <span className="inline-block w-1 h-4 bg-[#c9a961] ml-0.5 animate-pulse align-middle" />
        )}
      </div>
    </div>
  );
}

// 조향 레시피 카드
function RecipeCard({ recipe, onClose }) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-[#c9a961]/40 bg-[#1a1a1a] mb-3 overflow-hidden">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#c9a961]/20">
        <div>
          <p className="text-[9px] tracking-[0.6em] text-[#c9a961]/60">AI RECIPE</p>
          <p className="font-serif text-base text-white tracking-wider">{recipe.perfumeName}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setOpen(!open)} className="text-[#c9a961]/60 hover:text-[#c9a961] transition-colors">
            <ChevronDown size={16} className={`transition-transform duration-200 ${open ? '' : '-rotate-90'}`} />
          </button>
          <button onClick={onClose} className="text-[#c9a961]/60 hover:text-[#c9a961] transition-colors">
            <X size={14} />
          </button>
        </div>
      </div>

      {open && (
        <div className="px-5 py-4 space-y-4">
          {/* 콘셉트 */}
          <div>
            <p className="text-[10px] text-[#c9a961]/70 italic mb-1">{recipe.concept}</p>
            <p className="text-xs text-white/60 leading-relaxed">{recipe.story}</p>
          </div>

          {/* 노트 구성 */}
          <div className="space-y-3">
            {[
              { label: 'TOP', notes: recipe.topNotes },
              { label: 'MIDDLE', notes: recipe.middleNotes },
              { label: 'BASE', notes: recipe.baseNotes },
            ].map(({ label, notes }) => notes?.length > 0 && (
              <div key={label} className="flex gap-4">
                <span className="text-[10px] tracking-[0.4em] text-[#c9a961]/50 w-14 flex-shrink-0 pt-0.5">{label}</span>
                <div className="flex-1 space-y-1">
                  {notes.map((n, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {/* 비율 바 */}
                      <div className="flex-1 h-1 bg-white/10 relative overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 bg-[#c9a961]"
                          style={{ width: `${Math.round(n.ratio * 100)}%`, transition: 'width 0.6s ease' }}
                        />
                      </div>
                      <span className="text-xs text-white/80 w-24 flex-shrink-0">{n.ingredientName}</span>
                      <span className="text-[10px] text-[#c9a961]/60 w-10 text-right">{Math.round(n.ratio * 100)}%</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 메타 정보 */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
            {[
              ['농도', recipe.concentration],
              ['계절', recipe.recommendedSeason],
              ['TPO', recipe.recommendedOccasion],
            ].map(([k, v]) => v && (
              <div key={k}>
                <span className="text-[9px] tracking-widest text-[#c9a961]/50">{k}</span>
                <span className="text-xs text-white/70 ml-2">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
