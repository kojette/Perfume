import ScentPerfumeCard from './ScentPerfumeCard';
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  ShoppingBag, Save, ChevronDown, ChevronUp, X,
  Loader2, RefreshCw, AlertCircle, Trash2, ListOrdered, Search, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';


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

// ── 카테고리 SVG 선화 아이콘 ─────────────────────────────────────────────────
// 금빛(#c9a961) / 깊은 초록(#3d6b4f) 번갈아 사용, stroke-only 선화
const CATEGORY_SVG_ICONS = {
  '플로럴': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <circle cx="16" cy="16" r="3.2" stroke="#c9a961" strokeWidth="1.1"/>
      <ellipse cx="16" cy="9.5" rx="2.2" ry="3.8" stroke="#c9a961" strokeWidth="1" strokeLinecap="round"/>
      <ellipse cx="16" cy="22.5" rx="2.2" ry="3.8" stroke="#c9a961" strokeWidth="1" strokeLinecap="round"/>
      <ellipse cx="9.5" cy="16" rx="3.8" ry="2.2" stroke="#c9a961" strokeWidth="1" strokeLinecap="round"/>
      <ellipse cx="22.5" cy="16" rx="3.8" ry="2.2" stroke="#c9a961" strokeWidth="1" strokeLinecap="round"/>
      <ellipse cx="11.2" cy="11.2" rx="2.2" ry="3.6" stroke="#c9a961" strokeWidth="1" strokeLinecap="round" transform="rotate(-45 11.2 11.2)"/>
      <ellipse cx="20.8" cy="11.2" rx="2.2" ry="3.6" stroke="#c9a961" strokeWidth="1" strokeLinecap="round" transform="rotate(45 20.8 11.2)"/>
      <ellipse cx="11.2" cy="20.8" rx="2.2" ry="3.6" stroke="#c9a961" strokeWidth="1" strokeLinecap="round" transform="rotate(45 11.2 20.8)"/>
      <ellipse cx="20.8" cy="20.8" rx="2.2" ry="3.6" stroke="#c9a961" strokeWidth="1" strokeLinecap="round" transform="rotate(-45 20.8 20.8)"/>
    </svg>
  ),
  '시트러스': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <circle cx="16" cy="17" r="8.5" stroke="#c9a961" strokeWidth="1.1"/>
      <path d="M16 8.5 C16 8.5 16 17 16 17" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M7.5 17 C7.5 17 16 17 16 17" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M9.2 11.2 C9.2 11.2 16 17 16 17" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M22.8 11.2 C22.8 11.2 16 17 16 17" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M24.5 17 C24.5 17 16 17 16 17" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M9.2 22.8 C9.2 22.8 16 17 16 17" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M22.8 22.8 C22.8 22.8 16 17 16 17" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M16 25.5 C16 25.5 16 17 16 17" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
      <path d="M14 6 Q16 3 18 6" stroke="#3d6b4f" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M16 6 Q18 2 22 4" stroke="#3d6b4f" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  '우디': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <rect x="13.5" y="10" width="5" height="16" rx="1" stroke="#c9a961" strokeWidth="1.1"/>
      <path d="M16 10 L10 4 L16 7 L22 4 L16 10Z" stroke="#3d6b4f" strokeWidth="1" strokeLinejoin="round" fill="none"/>
      <path d="M13.5 14 L8 11 L13.5 13" stroke="#3d6b4f" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M18.5 16 L24 13 L18.5 15" stroke="#3d6b4f" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M13.5 19 L8 17 L13.5 18.5" stroke="#3d6b4f" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <line x1="12" y1="26" x2="20" y2="26" stroke="#c9a961" strokeWidth="1.1" strokeLinecap="round"/>
    </svg>
  ),
  '머스크': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <path d="M16 6 C16 6 10 10 10 16 C10 20 12.5 24 16 25 C19.5 24 22 20 22 16 C22 10 16 6 16 6Z" stroke="#c9a961" strokeWidth="1.1" strokeLinejoin="round"/>
      <path d="M16 10 C16 10 12 13 12 16.5 C12 19 13.5 21.5 16 22.5" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
      <circle cx="16" cy="16" r="2" stroke="#c9a961" strokeWidth="0.9"/>
      <path d="M13 8 Q10 5 8 8" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M19 8 Q22 5 24 8" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M10 23 Q8 27 12 27" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M22 23 Q24 27 20 27" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>
    </svg>
  ),
  '스파이시': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <path d="M16 26 C16 26 9 20 9 14 C9 10 12 7 15 7 C15 7 14 10 16 12 C18 10 20 8 20 6 C23 7 24 11 23 15 C22 19 16 26 16 26Z" stroke="#c9a961" strokeWidth="1.1" strokeLinejoin="round" fill="none"/>
      <path d="M14 14 C14 14 13 17 14 20" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
      <path d="M18 15 C18 15 18.5 18 17.5 21" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" opacity="0.6"/>
    </svg>
  ),
  '프루티': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <ellipse cx="12" cy="19" rx="5.5" ry="6" stroke="#c9a961" strokeWidth="1.1"/>
      <ellipse cx="20" cy="19" rx="5.5" ry="6" stroke="#c9a961" strokeWidth="1.1"/>
      <path d="M16 14 Q16 8 20 6" stroke="#3d6b4f" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M20 6 Q24 4 23 8" stroke="#3d6b4f" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M10 17 Q10 15 12 15" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <path d="M18 17 Q18 15 20 15" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  '그린': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <path d="M16 26 Q16 26 16 14" stroke="#3d6b4f" strokeWidth="1" strokeLinecap="round"/>
      <path d="M16 20 Q10 18 8 12 Q13 11 16 16" stroke="#3d6b4f" strokeWidth="1.1" strokeLinejoin="round" fill="none"/>
      <path d="M16 16 Q22 14 24 8 Q19 7 16 12" stroke="#3d6b4f" strokeWidth="1.1" strokeLinejoin="round" fill="none"/>
      <path d="M16 24 Q11 22 9 18" stroke="#3d6b4f" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.6"/>
    </svg>
  ),
  '아쿠아틱': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <path d="M16 6 C16 6 10 14 10 19 C10 22.3 12.7 25 16 25 C19.3 25 22 22.3 22 19 C22 14 16 6 16 6Z" stroke="#c9a961" strokeWidth="1.1" fill="none"/>
      <path d="M12 20 Q14 17 16 20 Q18 23 20 20" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M13 17 Q14.5 15 16 17" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  ),
  '구르망': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <path d="M9 20 L10 14 Q16 11 22 14 L23 20 Q16 24 9 20Z" stroke="#c9a961" strokeWidth="1.1" strokeLinejoin="round" fill="none"/>
      <path d="M10 14 Q16 8 22 14" stroke="#c9a961" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <path d="M15 11 Q16 6 17 11" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <ellipse cx="16" cy="20" rx="4" ry="1.5" stroke="#c9a961" strokeWidth="0.8" opacity="0.5"/>
    </svg>
  ),
  '발사믹/레진': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <path d="M10 24 L12 14 Q16 10 20 14 L22 24 Q16 27 10 24Z" stroke="#c9a961" strokeWidth="1.1" strokeLinejoin="round" fill="none"/>
      <path d="M14 16 Q16 13 18 16" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M13 20 Q16 18 19 20" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M15 10 Q16 6 17 10" stroke="#c9a961" strokeWidth="1" strokeLinecap="round" fill="none"/>
      <circle cx="16" cy="5.5" r="1.2" stroke="#c9a961" strokeWidth="0.9"/>
    </svg>
  ),
  '파우더리': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <circle cx="16" cy="17" r="8" stroke="#c9a961" strokeWidth="1.1"/>
      <circle cx="16" cy="17" r="5" stroke="#c9a961" strokeWidth="0.8" opacity="0.5"/>
      <circle cx="16" cy="17" r="2" stroke="#c9a961" strokeWidth="0.7" opacity="0.4"/>
      <circle cx="10" cy="10" r="0.9" stroke="#c9a961" strokeWidth="0.8" opacity="0.5"/>
      <circle cx="22" cy="10" r="0.7" stroke="#c9a961" strokeWidth="0.8" opacity="0.4"/>
      <circle cx="8" cy="18" r="0.7" stroke="#c9a961" strokeWidth="0.7" opacity="0.3"/>
      <circle cx="24" cy="20" r="0.9" stroke="#c9a961" strokeWidth="0.8" opacity="0.4"/>
    </svg>
  ),
  '어시': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <path d="M16 26 C16 26 10 20 11 14 C11.5 11 13 9 14 8 C14 10 15 11 16 11 C17 10 17.5 8 18 7 C20 9 21.5 12 21 16 C20.5 20 16 26 16 26Z" stroke="#c9a961" strokeWidth="1.1" strokeLinejoin="round" fill="none"/>
      <path d="M14 14 C14 14 13.5 17 14.5 20" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <path d="M18 15 C18 15 18 18 17 21" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" opacity="0.5"/>
      <path d="M13 26 Q16 28 19 26" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.4"/>
    </svg>
  ),
  '얼씨': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <ellipse cx="16" cy="22" rx="9" ry="4" stroke="#3d6b4f" strokeWidth="1.1"/>
      <path d="M10 22 Q10 16 16 12 Q22 16 22 22" stroke="#3d6b4f" strokeWidth="1" fill="none"/>
      <path d="M13 22 Q13 18 16 15" stroke="#3d6b4f" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.6"/>
      <path d="M16 12 Q16 8 16 8" stroke="#3d6b4f" strokeWidth="1" strokeLinecap="round"/>
      <path d="M13 10 Q16 7 19 10" stroke="#3d6b4f" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
    </svg>
  ),
  '알데하이딕': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <rect x="12" y="18" width="8" height="7" rx="1" stroke="#c9a961" strokeWidth="1.1"/>
      <path d="M14 18 L14 13 L12 10" stroke="#c9a961" strokeWidth="1" strokeLinecap="round"/>
      <path d="M18 18 L18 13 L20 10" stroke="#c9a961" strokeWidth="1" strokeLinecap="round"/>
      <path d="M12 10 Q16 8 20 10" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      <path d="M11 8 Q13 5 16 6" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>
      <path d="M21 8 Q19 5 16 6" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>
      <line x1="12" y1="21" x2="20" y2="21" stroke="#c9a961" strokeWidth="0.7" opacity="0.4"/>
    </svg>
  ),
  '헤르비셔스': (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <path d="M16 26 Q16 26 16 16" stroke="#3d6b4f" strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M16 22 Q12 20 11 16 Q14 15 16 18" stroke="#3d6b4f" strokeWidth="1" strokeLinejoin="round" fill="none"/>
      <path d="M16 18 Q20 16 21 12 Q18 11 16 14" stroke="#3d6b4f" strokeWidth="1" strokeLinejoin="round" fill="none"/>
      <path d="M16 14 Q13 12 13 8 Q16 9 16 12" stroke="#3d6b4f" strokeWidth="1" strokeLinejoin="round" fill="none"/>
      <path d="M14 26 Q16 27 18 26" stroke="#3d6b4f" strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.5"/>
    </svg>
  ),
};

// ── 병 선택 SVG 아이콘 ────────────────────────────────────────────────────────
const BOTTLE_SVG_DEFAULT = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
    <rect x="11" y="16" width="10" height="11" rx="2" stroke="#c9a961" strokeWidth="1.1"/>
    <path d="M13 16 L13 12 Q16 10 19 12 L19 16" stroke="#c9a961" strokeWidth="1" fill="none"/>
    <rect x="13" y="9" width="6" height="3" rx="1" stroke="#c9a961" strokeWidth="0.9"/>
    <line x1="11" y1="20" x2="21" y2="20" stroke="#c9a961" strokeWidth="0.7" opacity="0.4"/>
    <line x1="11" y1="23" x2="21" y2="23" stroke="#c9a961" strokeWidth="0.7" opacity="0.3"/>
    <circle cx="16" cy="18" r="1" stroke="#c9a961" strokeWidth="0.7" opacity="0.4"/>
  </svg>
);

const BOTTLE_SVG_CUSTOM = (
  <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
    <path d="M10 26 L10 17 Q10 15 13 14 L13 11 Q13 10 14 10 L18 10 Q19 10 19 11 L19 14 Q22 15 22 17 L22 26 Q22 27 21 27 L11 27 Q10 27 10 26Z" stroke="#c9a961" strokeWidth="1.1" fill="none"/>
    <path d="M14 10 L14 8 L18 8 L18 10" stroke="#c9a961" strokeWidth="0.9" fill="none"/>
    <polygon points="16,5 17.2,7.5 14.8,7.5" stroke="#c9a961" strokeWidth="0.9" fill="none"/>
    <path d="M13 19 Q16 17 19 19" stroke="#c9a961" strokeWidth="0.8" strokeLinecap="round" fill="none" opacity="0.5"/>
    <path d="M12 22 Q16 20.5 20 22" stroke="#c9a961" strokeWidth="0.7" strokeLinecap="round" fill="none" opacity="0.4"/>
  </svg>
);

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
// ── sessionStorage 헬퍼 (AiScentStudio와 동일 패턴) ─────────────────────────
const SS = {
  get: (key) => {
    try { const v = sessionStorage.getItem(key); return v ? JSON.parse(v) : null; }
    catch { return null; }
  },
  set: (key, value) => {
    try { sessionStorage.setItem(key, JSON.stringify(value)); }
    catch { /* 용량 초과 시 무시 */ }
  },
};

const ScentBlend = () => {
  const navigate   = useNavigate();
  const isLoggedIn = sessionStorage.getItem('isLoggedIn') === 'true';
  const token      = sessionStorage.getItem('accessToken');

  // DB에서 로드한 카테고리+재료
  // 캐시 있으면 즉시 표시 → 백그라운드에서 최신 데이터로 교체 (stale-while-revalidate)
  const [categories,    setCategories]    = useState(() => SS.get('sb_categories') || []);
  const [loadingScents, setLoadingScents] = useState(true);
  const [scentsError,   setScentsError]   = useState(null);

  // ── 검색 ────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState(() => SS.get('sb_searchQuery') || '');

  // 선택된 재료 { "ingredientId": ratio(0-100) }
  const [selectedIngredients, setSelectedIngredients] = useState(() => SS.get('sb_selectedIngredients') || {});
  // 열린 카테고리 아코디언
  const [openCategories, setOpenCategories] = useState(() => SS.get('sb_openCategories') || {});

  // 향수 설정
  const [concentration, setConcentration] = useState(() => SS.get('sb_concentration') || CONCENTRATION_TYPES[0]);
  const [volume,        setVolume]         = useState(() => SS.get('sb_volume')        || 50);
  const [blendName,     setBlendName]      = useState(() => SS.get('sb_blendName')     || '');
  const [saving,        setSaving]         = useState(false);

  const [cardTargetBlend, setCardTargetBlend] = useState(null); // 향카드 (UI 순간 상태라 캐시 불필요)

  // 내 조합 목록 패널 (서버 데이터 → 캐시 X, 항상 재요청)
  const [showMyBlends,  setShowMyBlends]  = useState(false);
  const [myBlends,      setMyBlends]      = useState([]);
  const [loadingBlends, setLoadingBlends] = useState(false);

  // 병 선택 (서버 데이터 → 캐시 X)
  const [myBottles,      setMyBottles]      = useState([]);
  const [loadingBottles, setLoadingBottles] = useState(false);
  const [selectedBottle, setSelectedBottle] = useState(() => SS.get('sb_selectedBottle') || null);

  // ── sessionStorage 동기화 ────────────────────────────────────────
  useEffect(() => { SS.set('sb_searchQuery',          searchQuery);          }, [searchQuery]);
  useEffect(() => { SS.set('sb_selectedIngredients',  selectedIngredients);  }, [selectedIngredients]);
  useEffect(() => { SS.set('sb_openCategories',       openCategories);       }, [openCategories]);
  useEffect(() => { SS.set('sb_concentration',        concentration);        }, [concentration]);
  useEffect(() => { SS.set('sb_volume',               volume);               }, [volume]);
  useEffect(() => { SS.set('sb_blendName',            blendName);            }, [blendName]);
  useEffect(() => { SS.set('sb_selectedBottle',       selectedBottle);       }, [selectedBottle]);

  // ────────────────────────────────────────────────────────────────
  // 검색 필터링: 검색어가 있으면 재료명/설명 매칭 카테고리+재료만 추출
  // ────────────────────────────────────────────────────────────────
  const trimmedQuery = searchQuery.trim().toLowerCase();

  const filteredCategories = useMemo(() => {
    if (!trimmedQuery) return categories;
    return categories
      .map(cat => {
        const matchedIngredients = cat.ingredients.filter(ing =>
          ing.name?.toLowerCase().includes(trimmedQuery) ||
          ing.description?.toLowerCase().includes(trimmedQuery)
        );
        // 카테고리명 자체가 검색어와 맞으면 전체 재료 표시
        const catNameMatches = cat.categoryName?.toLowerCase().includes(trimmedQuery);
        if (catNameMatches) return cat;
        if (matchedIngredients.length === 0) return null;
        return { ...cat, ingredients: matchedIngredients };
      })
      .filter(Boolean);
  }, [categories, trimmedQuery]);

  // 검색 중일 때 결과 카테고리 모두 열기
  useEffect(() => {
    if (trimmedQuery) {
      const openAll = {};
      filteredCategories.forEach(cat => { openAll[cat.categoryId] = true; });
      setOpenCategories(openAll);
    }
  }, [trimmedQuery, filteredCategories]);

  // ────────────────────────────────────────────────────────────────
  // 마운트 시 카테고리+재료 로드
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // 캐시 있으면 로딩 스피너 없이 바로 표시
      const hasCached = (SS.get('sb_categories') || []).length > 0;
      if (!hasCached) setLoadingScents(true);
      setScentsError(null);
      try {
        const res  = await fetch(`${API_BASE_URL}/api/custom/scents`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const data = json.data ?? json;
        SS.set('sb_categories', data);
        setCategories(data);
        // 아코디언 초기값: 캐시된 열림 상태 없으면 첫 카테고리만 열기
        if (data.length > 0 && !SS.get('sb_openCategories')) {
          setOpenCategories({ [data[0].categoryId]: true });
        }
      } catch (e) {
        console.error('향 카테고리 로드 실패:', e);
        if (!hasCached) setScentsError('향 재료 목록을 불러오지 못했습니다.');
      } finally {
        setLoadingScents(false);
      }
    })();
  }, []);

  // ────────────────────────────────────────────────────────────────
  // 마운트 시 내 병 목록 로드 (로그인 상태일 때만)
  // ────────────────────────────────────────────────────────────────
  useEffect(() => {
     if (!isLoggedIn || !token) return;
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
  const getCategoryIcon  = (name) => CATEGORY_SVG_ICONS[name] || (
    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" width="22" height="22">
      <circle cx="16" cy="16" r="7" stroke="#c9a961" strokeWidth="1.1"/>
      <path d="M16 10 L16 22 M10 16 L22 16" stroke="#c9a961" strokeWidth="0.9" strokeLinecap="round"/>
    </svg>
  );

  // 카테고리 원본 인덱스 (색상 고정)
  const getCategoryOriginalIndex = (categoryId) =>
    categories.findIndex(c => c.categoryId === categoryId);

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
        setConcentration(CONCENTRATION_TYPES[0]);
        setVolume(50);
        setSelectedBottle(null);
        setSearchQuery('');
        const firstOpen = categories.length > 0 ? { [categories[0].categoryId]: true } : {};
        setOpenCategories(firstOpen);
        // 작업 완료 후 캐시 초기화 (재료 목록은 유지)
        ['sb_selectedIngredients','sb_concentration','sb_volume',
         'sb_blendName','sb_selectedBottle','sb_searchQuery','sb_openCategories']
          .forEach(k => sessionStorage.removeItem(k));
        window.scrollTo({ top: 0, behavior: 'smooth' });
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
  const handleAddToCart = async () => {
    if (!isLoggedIn) { navigate('/login'); return; }
    if (!validate()) return;
    setSaving(true);
    try {
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

      const norms = normalizedRatios();
      const ingredientDetails = Object.entries(norms).map(([id, ratio]) => {
        const info = getIngredientInfo(id);
        return info ? `${info.ingredient.name}(${Math.round(ratio)}%)` : null;
      }).filter(Boolean);

      const blendMeta = JSON.stringify({
        blendName:   blendName.trim(),
        concentration: concentration.name,
        volume:      `${volume}ml`,
        bottle:      selectedBottle ? selectedBottle.name : '기본 병',
        ingredients: ingredientDetails,
        prices: {
          base:   concentration.basePrice,
          volume: Math.max(0, Math.floor((volume - BASE_VOLUME) / 10)) * EXTRA_PRICE_PER_10ML,
          bottle: selectedBottle?.totalPrice ?? 0,
        },
      });

      const cartRes = await fetch(`${API_BASE_URL}/api/cart/scent-blend`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name:     `[향조합] ${blendName.trim()}`,
          price:    totalPrice,
          quantity: 1,
          imageUrl: `__blend__${blendMeta}`,
        }),
      });
      if (cartRes.ok) {
        alert('장바구니에 담겼습니다!');
        setBlendName('');
        setSelectedIngredients({});
        setConcentration(CONCENTRATION_TYPES[0]);
        setVolume(50);
        setSelectedBottle(null);
        setSearchQuery('');
        const firstOpen = categories.length > 0 ? { [categories[0].categoryId]: true } : {};
        setOpenCategories(firstOpen);
        // 작업 완료 후 캐시 초기화 (재료 목록은 유지)
        ['sb_selectedIngredients','sb_concentration','sb_volume',
         'sb_blendName','sb_selectedBottle','sb_searchQuery','sb_openCategories']
          .forEach(k => sessionStorage.removeItem(k));
        window.scrollTo({ top: 0, behavior: 'smooth' });
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

  // ── 저장된 조합 불러오기 ─────────────────────────────────────────
  const handleLoadBlend = (blend) => {
    setBlendName(blend.name || '');
    const conc = CONCENTRATION_TYPES.find(c => c.id === blend.concentration);
    if (conc) setConcentration(conc);
    if (blend.volumeMl && VOLUME_OPTIONS.includes(blend.volumeMl)) {
      setVolume(blend.volumeMl);
    }
    if (blend.items && blend.items.length > 0) {
      const restored = {};
      blend.items.forEach(item => {
        const ratio = item.ratio > 1 ? Math.round(item.ratio) : Math.round(item.ratio * 100);
        restored[String(item.ingredientId)] = Math.max(1, Math.min(100, ratio));
      });
      setSelectedIngredients(restored);
    }
    setShowMyBlends(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    alert(`"${blend.name}" 조합을 불러왔습니다.`);
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
                  <div
                    key={blend.blendId}
                    onClick={() => handleLoadBlend(blend)}
                    className="border border-[#c9a961]/15 p-4 relative cursor-pointer hover:border-[#c9a961] hover:bg-[#faf8f3] transition-all group"
                  >
                    <button
                      onClick={e => { e.stopPropagation(); handleDeleteBlend(blend.blendId); }}
                      className="absolute top-2 right-2 text-[#8b8278] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={12} />
                    </button>
                    <div className="pr-5">
                      <div className="text-[12px] tracking-wider text-[#2a2620] font-medium mb-1 truncate group-hover:text-[#c9a961] transition-colors">
                        {blend.name}
                      </div>
                      <div className="text-[10px] text-[#8b8278] space-y-0.5">
                        <div>{blend.concentration} · {blend.volumeMl}ml</div>
                        <div className="text-[#c9a961]">₩{blend.totalPrice?.toLocaleString()}</div>
                        <div className="text-[#8b8278]/60">재료 {blend.items?.length ?? 0}종</div>
                      </div>
                      <div className="mt-2 text-[9px] text-[#c9a961]/60 tracking-wider group-hover:text-[#c9a961] transition-colors">
                        클릭하여 불러오기 →
                      </div>
                      <button  //향카드
                        onClick={e => {
                          e.stopPropagation();
                          // blend.items에 ingredientName이 없으면 categories에서 조회하여 주입
                          const enrichedItems = (blend.items || []).map(item => {
                            if (item.ingredientName) return item;
                            // categories에서 이름 찾기
                            let foundName = `재료 ${item.ingredientId}`;
                            for (const cat of categories) {
                              const ing = cat.ingredients.find(
                                g => String(g.ingredientId) === String(item.ingredientId)
                              );
                              if (ing) { foundName = ing.name; break; }
                            }
                            return { ...item, ingredientName: foundName };
                          });
                          setCardTargetBlend({ ...blend, items: enrichedItems });
                        }}
                        className="mt-1 mb-1 flex items-center gap-1.5 text-[9px] tracking-[0.2em] text-[#c9a961]/60 hover:text-[#c9a961] transition-colors group/card"
                      >
                        <Sparkles size={9} className="group-hover/card:animate-pulse" />
                        향 카드 추출하기
                      </button>
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

              {/* ── 검색창 ── */}
              <div className="relative mb-4">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search size={13} className="text-[#8b8278]" />
                </div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="향 재료 검색 (예: 로즈, 바닐라, 시트러스...)"
                  className="w-full bg-white border border-[#c9a961]/25 pl-9 pr-9 py-2.5 text-[12px] tracking-wider text-[#2a2620] placeholder-[#8b8278]/50 outline-none focus:border-[#c9a961] transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute inset-y-0 right-3 flex items-center text-[#8b8278] hover:text-[#c9a961] transition-colors"
                  >
                    <X size={13} />
                  </button>
                )}
              </div>

              {/* 검색 결과 카운트 */}
              {trimmedQuery && (
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-[10px] tracking-wider text-[#8b8278]">
                    {filteredCategories.length === 0
                      ? '검색 결과 없음'
                      : `"${trimmedQuery}" — ${filteredCategories.reduce((s, c) => s + c.ingredients.length, 0)}종 재료 발견`
                    }
                  </span>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[9px] tracking-wider text-[#c9a961]/70 hover:text-[#c9a961] transition-colors underline"
                  >
                    전체 보기
                  </button>
                </div>
              )}

              {/* 검색 결과 없음 */}
              {trimmedQuery && filteredCategories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-3 bg-white border border-[#c9a961]/20">
                  <Search size={24} className="text-[#c9a961]/30" />
                  <p className="text-[11px] text-[#8b8278]/60 italic">
                    "{trimmedQuery}"에 해당하는 재료가 없습니다.
                  </p>
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-[10px] tracking-wider text-[#c9a961] border border-[#c9a961]/40 px-4 py-1.5 hover:bg-[#c9a961]/5 transition-all"
                  >
                    전체 재료 보기
                  </button>
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const catOriginalIdx = getCategoryOriginalIndex(cat.categoryId);
                  const color          = getCategoryColor(catOriginalIdx);
                  const icon           = getCategoryIcon(cat.categoryName);
                  const isOpen         = !!openCategories[cat.categoryId];
                  const selectedCount  = cat.ingredients.filter(
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
                          <span className="flex items-center justify-center w-6 h-6 shrink-0">{icon}</span>
                          <div className="text-left">
                            <span className="text-[12px] tracking-[0.2em] text-[#2a2620] font-medium">
                              {/* 검색 시 카테고리명 하이라이트 */}
                              {trimmedQuery && cat.categoryName?.toLowerCase().includes(trimmedQuery) ? (
                                <HighlightText text={cat.categoryName} query={trimmedQuery} color={color} />
                              ) : cat.categoryName}
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
                                    {trimmedQuery ? (
                                      <HighlightText text={ingredient.name} query={trimmedQuery} color={color} />
                                    ) : ingredient.name}
                                  </span>
                                  {selected && (
                                    <div className="w-2 h-2 rounded-full shrink-0 ml-1" style={{ background: color }} />
                                  )}
                                </div>
                                {ingredient.description && (
                                  <div className="text-[9px] text-[#8b8278] truncate leading-tight">
                                    {trimmedQuery ? (
                                      <HighlightText text={ingredient.description} query={trimmedQuery} color={color} />
                                    ) : ingredient.description}
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
                })
              )}
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
                              <span className="flex items-center justify-center w-5 h-5 shrink-0">{getCategoryIcon(category.categoryName)}</span>
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
                  <div className="border border-[#c9a961]/30 bg-[#faf8f3] px-4 py-3 flex items-center gap-3">
                    <span className="flex items-center justify-center w-6 h-6 shrink-0">{BOTTLE_SVG_DEFAULT}</span>
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
                  <div className="space-y-2">
                    <button
                      onClick={() => setSelectedBottle(null)}
                      className={`w-full text-left px-4 py-3 border transition-all flex items-center gap-3 ${
                        selectedBottle === null
                          ? 'border-[#c9a961] bg-[#c9a961]/5'
                          : 'border-[#c9a961]/15 hover:border-[#c9a961]/40'
                      }`}
                    >
                      <span className="flex items-center justify-center w-6 h-6 shrink-0">{BOTTLE_SVG_DEFAULT}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] tracking-wider text-[#2a2620]">기본 병</div>
                        <div className="text-[9px] text-[#8b8278]">AION 기본 제공 병</div>
                      </div>
                      {selectedBottle === null && (
                        <div className="w-2 h-2 rounded-full bg-[#c9a961] shrink-0" />
                      )}
                    </button>

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
                        <span className="flex items-center justify-center w-6 h-6 shrink-0">{BOTTLE_SVG_CUSTOM}</span>
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
      {cardTargetBlend && (
        <ScentPerfumeCard
          blend={cardTargetBlend}
          onClose={() => setCardTargetBlend(null)}
        />
      )}
    </div>
  );
};

// ── 검색어 하이라이트 컴포넌트 ───────────────────────────────────────────────
const HighlightText = ({ text, query, color }) => {
  if (!text || !query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span
        style={{
          background: `${color}33`,
          color: color,
          borderRadius: '2px',
          padding: '0 1px',
        }}
      >
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
};

export default ScentBlend;