/**
 * ScentBlend.jsx
 * 위치: src/components/pages/ScentBlend.jsx
 *
 * 나만의 향 조합하기
 * - 카테고리 + 재료: GET /api/custom/scents (DB에서 동적 로드)
 * - 조합 저장:       POST /api/custom/scent-blends
 * - 내 조합 목록:    GET  /api/custom/scent-blends
 * - 조합 삭제:       DELETE /api/custom/scent-blends/{id}
 * - 장바구니:        POST /api/cart/scent-blend
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  ShoppingBag, Save, ChevronDown, ChevronUp, X,
  Loader2, RefreshCw, AlertCircle, Trash2, ListOrdered
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = 'http://localhost:8080';

// ── 카테고리별 고정 색상 팔레트 (displayOrder 순 인덱스 순환) ────────────────
const CATEGORY_COLORS = [
  '#e8a0bf', // 플로럴
  '#f5c542', // 시트러스
  '#8b6f47', // 우디
  '#a0b4c8', // 머스크
  '#e17055', // 스파이시
  '#fd79a8', // 프루티
  '#55efc4', // 그린
  '#74b9ff', // 아쿠아틱
  '#ffeaa7', // 구르망
  '#b2835f', // 발사믹/레진
  '#dfe6e9', // 파우더리
  '#636e72', // 어시
  '#6d4c41', // 얼씨
  '#b0c4de', // 알데하이딕
  '#a8e6cf', // 헤르비셔스
];

const CATEGORY_ICONS = {
  '플로럴':     '🌸',
  '시트러스':   '🍋',
  '우디':       '🌲',
  '머스크':     '🔮',
  '스파이시':   '🌶',
  '프루티':     '🍑',
  '그린':       '🌿',
  '아쿠아틱':   '💧',
  '구르망':     '🍯',
  '발사믹/레진':'🪨',
  '파우더리':   '🌫',
  '어시':       '🔥',
  '얼씨':       '🌍',
  '알데하이딕': '🧪',
  '헤르비셔스': '🌾',
};

// ── 향수 농도 (고정) ─────────────────────────────────────────────────────────
const CONCENTRATION_TYPES = [
  { id: 'EDP',     name: '오 드 퍼퓸',   nameEn: 'EDP',     basePrice: 250000, desc: '15~20% 향료, 6~8시간 지속' },
  { id: 'EDT',     name: '오 드 뚜왈렛', nameEn: 'EDT',     basePrice: 235000, desc: '5~15% 향료, 3~5시간 지속' },
  { id: 'EDC',     name: '오 드 코롱',   nameEn: 'EDC',     basePrice: 220000, desc: '2~5% 향료, 2~3시간 지속' },
  { id: 'COLOGNE', name: '코롱',         nameEn: 'COLOGNE', basePrice: 205000, desc: '2~4% 향료, 1~2시간 지속' },
];

const BASE_VOLUME          = 50;
const EXTRA_PRICE_PER_10ML = 30000;
const VOLUME_OPTIONS       = [50, 60, 70, 80, 90, 100];

// ── 슬라이더 ─────────────────────────────────────────────────────────────────
const RatioSlider = ({ value, onChange, color }) => (
  <div className="relative flex items-center gap-3">
    <div className="flex-1 relative h-2 rounded-full" style={{ background: '#e8e0d0' }}>
      <div
        className="absolute left-0 top-0 h-full rounded-full transition-all"
        style={{ width: `${value}%`, background: color || '#c9a961' }}
      />
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
      />
      <div
        className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none transition-all"
        style={{ left: `calc(${value}% - 8px)`, background: color || '#c9a961' }}
      />
    </div>
    <span className="text-[11px] font-mono text-[#2a2620] w-8 text-right">{value}</span>
  </div>
);

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
const ScentBlend = () => {
  const navigate   = useNavigate();
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const token      = sessionStorage.getItem('accessToken');

  // DB에서 로드한 카테고리+재료
  const [categories,    setCategories]    = useState([]);
  const [loadingScents, setLoadingScents] = useState(true);
  const [scentsError,   setScentsError]   = useState(null);

  // 선택된 재료 { "ingredientId": ratio(0-100) }
  const [selectedIngredients, setSelectedIngredients] = useState({});
  // 열린 카테고리 아코디언
  const [openCategories, setOpenCategories] = useState({});

  // 향수 설정
  const [concentration, setConcentration] = useState(CONCENTRATION_TYPES[0]);
  const [volume,        setVolume]         = useState(50);
  const [blendName,     setBlendName]      = useState('');
  const [saving,        setSaving]         = useState(false);

  // 내 조합 목록 패널
  const [showMyBlends,  setShowMyBlends]  = useState(false);
  const [myBlends,      setMyBlends]      = useState([]);
  const [loadingBlends, setLoadingBlends] = useState(false);

  // 병 선택
  const [myBottles,      setMyBottles]      = useState([]);   // 내가 만든 병 목록
  const [loadingBottles, setLoadingBottles] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState(null); // null = 기본병

  // ────────────────────────────────────────────────────────────────
  // 마운트 시 카테고리+재료 로드
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      setLoadingScents(true);
      setScentsError(null);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/custom/scents`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json.data ?? json;
        setCategories(data);
        if (data.length > 0) {
          setOpenCategories({ [data[0].categoryId]: true });
        }
      } catch (e) {
        console.error('향 카테고리 로드 실패:', e);
        setScentsError('향 재료 목록을 불러오지 못했습니다.');
      } finally {
        setLoadingScents(false);
      }
    })();
  }, []);

  // ────────────────────────────────────────────────────────────────
  // 마운트 시 내 병 목록 로드 (로그인 상태일 때만)
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoggedIn) return;
    (async () => {
      setLoadingBottles(true);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/custom/designs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        setMyBottles(json.data ?? json);
      } catch (e) {
        console.error('내 병 목록 로드 실패:', e);
      } finally {
        setLoadingBottles(false);
      }
    })();
  }, [isLoggedIn, token]);
  const loadMyBlends = useCallback(async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    setLoadingBlends(true);
    try {
      const res  = await fetch(`${API_BASE_URL}/api/custom/scent-blends`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setMyBlends(json.data ?? json);
    } catch (e) {
      console.error('내 조합 로드 실패:', e);
    } finally {
      setLoadingBlends(false);
    }
  }, [isLoggedIn, token, navigate]);

  const toggleMyBlends = () => {
    if (!showMyBlends) loadMyBlends();
    setShowMyBlends(v => !v);
  };

  // ── 유틸 ────────────────────────────────────────────────────────
  const getCategoryColor = (idx) => CATEGORY_COLORS[idx % CATEGORY_COLORS.length];
  const getCategoryIcon  = (name) => CATEGORY_ICONS[name] || '✦';

  const toggleIngredient = (ingredientId) => {
    setSelectedIngredients(prev => {
      const key = String(ingredientId);
      if (key in prev) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: 50 };
    });
  };

  const handleRatioChange = (ingredientId, value) => {
    setSelectedIngredients(prev => ({ ...prev, [String(ingredientId)]: value }));
  };

  // ── 계산 ────────────────────────────────────────────────────────
  const selectedList = Object.entries(selectedIngredients);
  const ratioSum     = selectedList.reduce((s, [, v]) => s + v, 0);

  const normalizedRatios = useCallback(() => {
    if (ratioSum === 0) return {};
    const r = {};
    selectedList.forEach(([id, v]) => {
      r[id] = parseFloat(((v / ratioSum) * 100).toFixed(3));
    });
    return r;
  }, [selectedList, ratioSum]);

  const totalPrice = concentration.basePrice
    + Math.max(0, Math.floor((volume - BASE_VOLUME) / 10)) * EXTRA_PRICE_PER_10ML
    + (selectedBottle?.totalPrice ?? 0);

  const getIngredientInfo = (ingredientId) => {
    const key = String(ingredientId);
    for (let i = 0; i < categories.length; i++) {
      const cat = categories[i];
      const ing = cat.ingredients.find(g => String(g.ingredientId) === key);
      if (ing) return { ingredient: ing, category: cat, color: getCategoryColor(i) };
    }
    return null;
  };

  // ── API 페이로드 빌더 ────────────────────────────────────────────
  const buildPayload = () => {
    const norms = normalizedRatios();
    return {
      name:          blendName.trim(),
      concentration: concentration.id,
      volumeMl:      volume,
      totalPrice,
      bottleDesignId: selectedBottle ? selectedBottle.designId : null,
      items: Object.entries(norms).map(([ingredientId, ratio]) => ({
        ingredientId: Number(ingredientId),
        ratio,
      })),
    };
  };

  const validate = () => {
    if (selectedList.length === 0) { alert('향 재료를 하나 이상 선택해주세요.'); return false; }
    if (!blendName.trim())         { alert('블렌드 이름을 입력해주세요.'); return false; }
    return true;
  };

  // ── 저장 ────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!validate()) return;
    setSaving(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/custom/scent-blends`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (res.ok) {
        alert('블렌드가 저장되었습니다!');
        setBlendName('');
        setSelectedIngredients({});
      } else {
        const err = await res.json().catch(() => ({}));
        alert(err.message || '저장에 실패했습니다.');
      }
    } catch (e) {
      alert('저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ── 장바구니 ─────────────────────────────────────────────────────
  // 흐름: ① 향 조합 저장 → blendId 발급 → ② /api/cart/custom 에 담기
  const handleAddToCart = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!validate()) return;
    setSaving(true);
    try {
      // ① 향 조합 저장
      const saveRes = await fetch(`${API_BASE_URL}/api/custom/scent-blends`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload()),
      });
      if (!saveRes.ok) {
        const err = await saveRes.json().catch(() => ({}));
        alert(err.message || '향 조합 저장에 실패했습니다.');
        return;
      }
      const saveJson = await saveRes.json();
      const blendId  = saveJson.data?.blendId ?? saveJson.blendId ?? null;

      // ② 장바구니에 담기 (/api/cart/scent-blend)
      const cartRes = await fetch(`${API_BASE_URL}/api/cart/scent-blend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blendId:  blendId,
          name:     `[향조합] ${blendName.trim()}`,
          price:    totalPrice,
          quantity: 1,
          imageUrl: null,
        }),
      });
      if (cartRes.ok) {
        alert('장바구니에 담겼습니다!');
        setBlendName('');
        setSelectedIngredients({});
      } else {
        const err = await cartRes.json().catch(() => ({}));
        alert(err.message || '장바구니 추가에 실패했습니다.');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  // ── 삭제 ────────────────────────────────────────────────────────
  const handleDeleteBlend = async (blendId) => {
    if (!window.confirm('이 조합을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/custom/scent-blends/${blendId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setMyBlends(prev => prev.filter(b => b.blendId !== blendId));
      } else {
        alert('삭제에 실패했습니다.');
      }
    } catch (e) {
      alert('오류가 발생했습니다.');
    }
  };

  // ────────────────────────────────────────────────────────────────
  // 렌더
  // ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full bg-[#faf8f3] pt-10 pb-24 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">

        {/* 타이틀 */}
        <div className="text-center mb-10">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-3 italic">COMPOSE YOUR SIGNATURE</div>
          <h3 className="text-2xl font-serif text-[#1a1a1a] tracking-[0.3em] mb-2">나만의 향 조합하기</h3>
          <p className="text-[#8b8278] text-xs tracking-widest italic">원하는 향 재료를 선택하고 비율을 조절하세요</p>
          {isLoggedIn && (
            <button
              onClick={toggleMyBlends}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 border border-[#c9a961]/40 text-[#8b8278] text-[10px] tracking-[0.2em] hover:border-[#c9a961] hover:text-[#c9a961] transition-all"
            >
              <ListOrdered size={12} />
              {showMyBlends ? '목록 닫기' : '내 저장된 조합 보기'}
            </button>
          )}
        </div>

        {/* 내 조합 목록 */}
        {showMyBlends && (
          <div className="mb-8 bg-white border border-[#c9a961]/20 p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] tracking-[0.3em] text-[#8b8278] uppercase">저장된 향 조합</span>
              <button onClick={loadMyBlends} className="text-[#8b8278] hover:text-[#c9a961] transition-colors">
                <RefreshCw size={12} />
              </button>
            </div>
            {loadingBlends ? (
              <div className="flex justify-center py-6">
                <Loader2 size={20} className="animate-spin text-[#c9a961]" />
              </div>
            ) : myBlends.length === 0 ? (
              <p className="text-center text-[11px] text-[#8b8278]/60 italic py-6">저장된 조합이 없습니다.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {myBlends.map(blend => (
                  <div key={blend.blendId} className="border border-[#c9a961]/15 p-4 relative">
                    <button
                      onClick={() => handleDeleteBlend(blend.blendId)}
                      className="absolute top-2 right-2 text-[#8b8278] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="pr-5">
                      <div className="text-[12px] tracking-wider text-[#2a2620] font-medium mb-1 truncate">
                        {blend.name}
                      </div>
                      <div className="text-[10px] text-[#8b8278] space-y-0.5">
                        <div>{blend.concentration} · {blend.volumeMl}ml</div>
                        <div className="text-[#c9a961]">₩{blend.totalPrice?.toLocaleString()}</div>
                        <div className="text-[#8b8278]/60">재료 {blend.items?.length ?? 0}종</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 로딩 */}
        {loadingScents ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 size={32} className="animate-spin text-[#c9a961]" />
            <p className="text-[11px] tracking-widest text-[#8b8278] italic">향 재료 목록 불러오는 중...</p>
          </div>

        /* 에러 */
        ) : scentsError ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <AlertCircle size={32} className="text-red-400" />
            <p className="text-[11px] text-[#8b8278]">{scentsError}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-[10px] tracking-wider text-[#c9a961] border border-[#c9a961]/40 px-4 py-2 hover:bg-[#c9a961]/5 transition-all"
            >
              다시 시도
            </button>
          </div>

        /* 메인 UI */
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* ── 왼쪽: 향 재료 선택 ── */}
            <div className="lg:col-span-2 space-y-3">
              <div className="text-[10px] tracking-[0.3em] text-[#8b8278] uppercase mb-4">① 향 재료 선택</div>

              {categories.map((cat, catIdx) => {
                const color        = getCategoryColor(catIdx);
                const icon         = getCategoryIcon(cat.categoryName);
                const isOpen       = !!openCategories[cat.categoryId];
                const selectedCount = cat.ingredients.filter(
                  g => String(g.ingredientId) in selectedIngredients
                ).length;

                return (
                  <div key={cat.categoryId} className="bg-white border border-[#c9a961]/20 overflow-hidden">

                    {/* 헤더 */}
                    <button
                      onClick={() => setOpenCategories(prev => ({
                        ...prev, [cat.categoryId]: !prev[cat.categoryId],
                      }))}
                      className="w-full flex items-center justify-between px-5 py-3 hover:bg-[#faf8f3] transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{icon}</span>
                        <div className="text-left">
                          <span className="text-[12px] tracking-[0.2em] text-[#2a2620] font-medium">
                            {cat.categoryName}
                          </span>
                          <span className="ml-2 text-[9px] tracking-widest text-[#8b8278]">
                            {cat.ingredients.length}종
                          </span>
                        </div>
                        {selectedCount > 0 && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full text-white tracking-wider"
                            style={{ background: color }}
                          >
                            {selectedCount}
                          </span>
                        )}
                      </div>
                      {isOpen
                        ? <ChevronUp size={14} className="text-[#8b8278]" />
                        : <ChevronDown size={14} className="text-[#8b8278]" />
                      }
                    </button>

                    {/* 재료 그리드 */}
                    {isOpen && (
                      <div className="border-t border-[#c9a961]/10 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {cat.ingredients.length === 0 ? (
                          <p className="col-span-3 text-center text-[10px] text-[#8b8278]/50 py-4 italic">
                            등록된 재료가 없습니다.
                          </p>
                        ) : cat.ingredients.map(ingredient => {
                          const selected = String(ingredient.ingredientId) in selectedIngredients;
                          return (
                            <button
                              key={ingredient.ingredientId}
                              onClick={() => toggleIngredient(ingredient.ingredientId)}
                              className={`text-left px-3 py-2.5 border text-[11px] tracking-wider transition-all ${
                                selected
                                  ? 'border-[#c9a961] bg-[#c9a961]/8 text-[#2a2620]'
                                  : 'border-[#c9a961]/15 bg-[#faf8f3] text-[#8b8278] hover:border-[#c9a961]/40 hover:text-[#2a2620]'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-medium text-[12px] leading-tight line-clamp-1">
                                  {ingredient.name}
                                </span>
                                {selected && (
                                  <div className="w-2 h-2 rounded-full shrink-0 ml-1" style={{ background: color }} />
                                )}
                              </div>
                              {ingredient.description && (
                                <div className="text-[9px] text-[#8b8278] truncate leading-tight">
                                  {ingredient.description}
                                </div>
                              )}
                              {ingredient.isNatural != null && (
                                <div
                                  className="text-[8px] mt-0.5"
                                  style={{ color: ingredient.isNatural ? '#55a66a' : '#a0a0a0' }}
                                >
                                  {ingredient.isNatural ? '천연' : '합성'}
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ── 오른쪽 패널 ── */}
            <div className="space-y-4">

              {/* ② 비율 조절 */}
              <div className="bg-white border border-[#c9a961]/20 p-5">
                <div className="text-[10px] tracking-[0.3em] text-[#8b8278] uppercase mb-4">② 비율 조절</div>

                {selectedList.length === 0 ? (
                  <div className="text-center py-8 text-[#8b8278]/50">
                    <div className="text-2xl mb-2">✦</div>
                    <p className="text-[10px] tracking-widest italic">왼쪽에서 향 재료를 선택하세요</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedList.map(([ingredientId, ratio]) => {
                      const info = getIngredientInfo(ingredientId);
                      if (!info) return null;
                      const { ingredient, category, color } = info;
                      const normalized = ratioSum > 0
                        ? Math.round((ratio / ratioSum) * 100) : 0;
                      return (
                        <div key={ingredientId} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-sm shrink-0">{getCategoryIcon(category.categoryName)}</span>
                              <span className="text-[11px] tracking-wider text-[#2a2620] truncate">
                                {ingredient.name}
                              </span>
                              <span className="text-[9px] text-[#8b8278] shrink-0">→ {normalized}%</span>
                            </div>
                            <button
                              onClick={() => toggleIngredient(ingredientId)}
                              className="text-[#8b8278] hover:text-red-400 transition-colors shrink-0 ml-1"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          <RatioSlider
                            value={ratio}
                            onChange={v => handleRatioChange(ingredientId, v)}
                            color={color}
                          />
                        </div>
                      );
                    })}

                    {/* 시각화 바 */}
                    <div className="pt-3 border-t border-[#c9a961]/10">
                      <div className="flex justify-between text-[9px] tracking-wider text-[#8b8278] mb-2">
                        <span>비율 미리보기</span>
                        <span className="text-[#c9a961] italic">합산 100% 자동 환산</span>
                      </div>
                      {ratioSum > 0 && (
                        <div className="h-2 rounded-full overflow-hidden flex">
                          {selectedList.map(([ingredientId, ratio]) => {
                            const info = getIngredientInfo(ingredientId);
                            const pct  = (ratio / ratioSum) * 100;
                            return (
                              <div
                                key={ingredientId}
                                style={{ width: `${pct}%`, background: info?.color || '#c9a961' }}
                                title={`${info?.ingredient.name}: ${Math.round(pct)}%`}
                              />
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* ③ 향수 종류 */}
              <div className="bg-white border border-[#c9a961]/20 p-5">
                <div className="text-[10px] tracking-[0.3em] text-[#8b8278] uppercase mb-4">③ 향수 종류</div>
                <div className="space-y-2">
                  {CONCENTRATION_TYPES.map(type => (
                    <button
                      key={type.id}
                      onClick={() => setConcentration(type)}
                      className={`w-full text-left px-4 py-3 border transition-all ${
                        concentration.id === type.id
                          ? 'border-[#c9a961] bg-[#c9a961]/5'
                          : 'border-[#c9a961]/15 hover:border-[#c9a961]/40'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[12px] tracking-wider text-[#2a2620]">{type.name}</span>
                          <span className="ml-2 text-[9px] text-[#8b8278]">{type.nameEn}</span>
                          <div className="text-[9px] text-[#8b8278] mt-0.5">{type.desc}</div>
                        </div>
                        <span className="text-[11px] text-[#c9a961] ml-2 shrink-0">
                          ₩{type.basePrice.toLocaleString()}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ④ 용량 */}
              <div className="bg-white border border-[#c9a961]/20 p-5">
                <div className="text-[10px] tracking-[0.3em] text-[#8b8278] uppercase mb-4">④ 용량 선택</div>
                <div className="grid grid-cols-3 gap-2">
                  {VOLUME_OPTIONS.map(v => {
                    const extra = Math.floor((v - BASE_VOLUME) / 10) * EXTRA_PRICE_PER_10ML;
                    return (
                      <button
                        key={v}
                        onClick={() => setVolume(v)}
                        className={`py-2.5 border text-center transition-all ${
                          volume === v
                            ? 'border-[#c9a961] bg-[#c9a961]/5'
                            : 'border-[#c9a961]/15 hover:border-[#c9a961]/40'
                        }`}
                      >
                        <div className="text-[12px] tracking-wider text-[#2a2620]">{v}ml</div>
                        <div className="text-[9px] text-[#c9a961]">
                          {extra > 0 ? `+₩${extra.toLocaleString()}` : '기본'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ⑤ 병 선택 */}
              <div className="bg-white border border-[#c9a961]/20 p-5">
                <div className="text-[10px] tracking-[0.3em] text-[#8b8278] uppercase mb-4">⑤ 병 선택</div>

                {loadingBottles ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-[#c9a961]" />
                  </div>
                ) : myBottles.length === 0 ? (
                  /* 내 병이 없으면 기본병 고정 안내 */
                  <div className="border border-[#c9a961]/30 bg-[#faf8f3] px-4 py-3 flex items-center gap-3">
                    <span className="text-xl">🧴</span>
                    <div>
                      <div className="text-[12px] tracking-wider text-[#2a2620]">기본 병</div>
                      <div className="text-[9px] text-[#8b8278] mt-0.5">
                        커스텀 병이 없어 기본 병이 사용됩니다
                      </div>
                      <button
                        onClick={() => navigate('/custom')}
                        className="text-[9px] text-[#c9a961] underline mt-1 hover:text-[#a8882a] transition-colors"
                      >
                        + 나만의 병 디자인하기
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 내 병이 있으면 선택 가능 */
                  <div className="space-y-2">
                    {/* 기본병 옵션 */}
                    <button
                      onClick={() => setSelectedBottle(null)}
                      className={`w-full text-left px-4 py-3 border transition-all flex items-center gap-3 ${
                        selectedBottle === null
                          ? 'border-[#c9a961] bg-[#c9a961]/5'
                          : 'border-[#c9a961]/15 hover:border-[#c9a961]/40'
                      }`}
                    >
                      <span className="text-lg">🧴</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] tracking-wider text-[#2a2620]">기본 병</div>
                        <div className="text-[9px] text-[#8b8278]">AION 기본 제공 병</div>
                      </div>
                      {selectedBottle === null && (
                        <div className="w-2 h-2 rounded-full bg-[#c9a961] shrink-0" />
                      )}
                    </button>

                    {/* 내가 만든 병 목록 */}
                    {myBottles.map(bottle => (
                      <button
                        key={bottle.designId}
                        onClick={() => setSelectedBottle(bottle)}
                        className={`w-full text-left px-4 py-3 border transition-all flex items-center gap-3 ${
                          selectedBottle?.designId === bottle.designId
                            ? 'border-[#c9a961] bg-[#c9a961]/5'
                            : 'border-[#c9a961]/15 hover:border-[#c9a961]/40'
                        }`}
                      >
                        <span className="text-lg">✨</span>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] tracking-wider text-[#2a2620] truncate">
                            {bottle.name || '나만의 병'}
                          </div>
                          <div className="text-[9px] text-[#8b8278]">
                            커스텀 디자인
                            {bottle.totalPrice > 0 && ` · ₩${bottle.totalPrice.toLocaleString()}`}
                          </div>
                        </div>
                        {selectedBottle?.designId === bottle.designId && (
                          <div className="w-2 h-2 rounded-full bg-[#c9a961] shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ⑥ 이름 + 저장 */}
              <div className="bg-white border border-[#c9a961]/20 p-5 space-y-4">
                <div className="text-[10px] tracking-[0.3em] text-[#8b8278] uppercase">⑥ 저장</div>

                <div>
                  <label className="text-[10px] tracking-wider text-[#8b8278] block mb-1.5">블렌드 이름 *</label>
                  <input
                    type="text"
                    value={blendName}
                    onChange={e => setBlendName(e.target.value)}
                    placeholder="나만의 블렌드 이름"
                    maxLength={100}
                    className="w-full border-b border-[#c9a961]/40 bg-transparent text-sm text-[#2a2620] pb-1.5 outline-none placeholder-[#8b8278]/50 focus:border-[#c9a961] transition-colors"
                  />
                </div>

                {/* 가격 요약 */}
                <div className="space-y-1 border-t border-[#c9a961]/10 pt-4">
                  <div className="flex justify-between text-[11px] tracking-wider text-[#2a2620]">
                    <span>{concentration.name} ({volume}ml)</span>
                    <span>₩{concentration.basePrice.toLocaleString()}</span>
                  </div>
                  {volume > BASE_VOLUME && (
                    <div className="flex justify-between text-[11px] tracking-wider text-[#2a2620]">
                      <span>추가 용량 +{volume - BASE_VOLUME}ml</span>
                      <span>+₩{(Math.floor((volume - BASE_VOLUME) / 10) * EXTRA_PRICE_PER_10ML).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedBottle && (
                    <div className="flex justify-between text-[11px] tracking-wider text-[#2a2620]">
                      <span>커스텀 병 ({selectedBottle.name})</span>
                      <span>+₩{(selectedBottle.totalPrice ?? 0).toLocaleString()}</span>
                    </div>
                  )}
                  <div className="h-[1px] bg-[#c9a961]/20 my-2" />
                  <div className="flex justify-between items-center">
                    <span className="font-serif italic text-[#c9a961] text-sm">Total</span>
                    <span className="text-lg font-bold text-[#1a1a1a]">₩{totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="text-[9px] text-[#8b8278] text-right">
                    선택된 재료: {selectedList.length}종
                  </div>
                </div>

                {/* 버튼 */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 border border-[#c9a961] text-[#c9a961] text-[10px] tracking-[0.2em] hover:bg-[#c9a961] hover:text-white transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    저장
                  </button>
                  <button
                    onClick={handleAddToCart}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-[#1a1a1a] text-white text-[10px] tracking-[0.2em] hover:bg-[#c9a961] transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={12} className="animate-spin" /> : <ShoppingBag size={12} />}
                    장바구니
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScentBlend;