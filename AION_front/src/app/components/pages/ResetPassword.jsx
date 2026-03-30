import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getRecommendations } from '../../../services/recommendationApi';


import imgFemale       from '../../../assets/female.png';
import imgMale         from '../../../assets/male.png';
import imgDate         from '../../../assets/date.png';
import imgSpringSummer from '../../../assets/springsummer.png';
import imgCool         from '../../../assets/cool.png';
import imgFallWinter   from '../../../assets/fallwinter.png';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';


const AGE_GROUPS = [
  {
    id: '10s',
    label: '10대',
    en: 'TEENS',
    range: '15–19',
    symbol: '✦',
    desc: '청초하고 밝은 향',
    keywords: ['플로럴', '프루티', '청량한'],
    palette: { from: '#fce4ec', to: '#f8bbd0', accent: '#e91e8c', text: '#880e4f' },
    tags: ['플로럴', '프루티', '청량한', '달콤한'],
    poem: '꽃이 피어나는 계절처럼,\n처음 맡는 향기가 세상을 물들인다',
  },
  {
    id: '20s',
    label: '20대',
    en: 'TWENTIES',
    range: '20–29',
    symbol: 'Ι',
    desc: '자유롭고 생동감 넘치는',
    keywords: ['시트러스', '아쿠아틱', '머스크'],
    palette: { from: '#e3f2fd', to: '#bbdefb', accent: '#1976d2', text: '#0d47a1' },
    tags: ['시트러스', '아쿠아틱', '머스크', '청량한'],
    poem: '새벽 도시의 공기처럼,\n가능성으로 가득 찬 향기가 번져간다',
  },
  {
    id: '30s',
    label: '30대',
    en: 'THIRTIES',
    range: '30–39',
    symbol: 'ΙΙ',
    desc: '세련되고 깊이 있는',
    keywords: ['우디', '앰버', '스파이시'],
    palette: { from: '#fff3e0', to: '#ffe0b2', accent: '#f57c00', text: '#e65100' },
    tags: ['우디', '앰버', '스파이시', '관능적인'],
    poem: '익어가는 포도주처럼,\n시간이 빚어낸 향기가 공간을 채운다',
  },
  {
    id: '40s',
    label: '40대',
    en: 'FORTIES',
    range: '40–49',
    symbol: 'ΙΙΙ',
    desc: '클래식하고 우아한',
    keywords: ['오리엔탈', '파우더리', '가죽'],
    palette: { from: '#f3e5f5', to: '#e1bee7', accent: '#7b1fa2', text: '#4a148c' },
    tags: ['오리엔탈', '파우더리', '가죽', '클래식'],
    poem: '고전 음악의 선율처럼,\n세월이 담긴 향기가 품격을 말한다',
  },
  {
    id: '50s',
    label: '50대+',
    en: 'FIFTIES+',
    range: '50+',
    symbol: 'IV',
    desc: '기품 있고 고혹적인',
    keywords: ['바닐라', '샌달우드', '로즈'],
    palette: { from: '#efebe9', to: '#d7ccc8', accent: '#5d4037', text: '#3e2723' },
    tags: ['바닐라', '샌달우드', '로즈', '우아한'],
    poem: '깊은 밤 향나무 연기처럼,\n오래된 것들의 아름다움이 깃들다',
  },
];


const FILTER_IMAGES = {
  '여성':      imgFemale,
  '남성':      imgMale,
  '데이트':    imgDate,
  '봄/여름':   imgSpringSummer,
  '청량한':    imgCool,
  '가을/겨울': imgFallWinter,
};


const QUICK_FILTERS = [
  { label: '남성', en: 'Man',    type: 'gender', value: 'MALE'    },
  { label: '여성', en: 'Woman',  type: 'gender', value: 'FEMALE'  },
  { label: '데이트', en: 'Date', type: 'tags',   value: ['데이트'] },
  { label: '청량한', en: 'Fresh',type: 'tags',   value: ['청량한'] },
  { label: '봄/여름', en: 'Spring', type: 'tags', value: ['플로럴'] },
  { label: '가을/겨울', en: 'Autumn', type: 'tags', value: ['우디'] },
];



function GoldDivider() {
  return (
    <div className="flex items-center gap-3 my-2">
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent to-[#c9a961]/40" />
      <span className="text-[#c9a961]/50 text-xs">◆</span>
      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent to-[#c9a961]/40" />
    </div>
  );
}

function PerfumeCard({ perfume, onClick }) {
  return (
    <div
      onClick={() => onClick?.(perfume)}
      className="group flex items-center gap-5 p-5 bg-white border border-[#e8e2d6] hover:border-[#c9a961]/60 hover:shadow-lg transition-all duration-300 cursor-pointer"
    >
      <div className="w-16 h-16 flex-shrink-0 bg-gradient-to-br from-[#f5f0e8] to-[#e8ddc8] flex items-center justify-center group-hover:scale-105 transition-transform duration-300 overflow-hidden">
        {perfume.imageUrl ? (
          <img src={perfume.imageUrl} alt={perfume.name} className="w-full h-full object-cover" />
        ) : (
          <span className="font-serif text-xl text-[#c9a961]/40">{perfume.name?.charAt(0)}</span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium tracking-[0.1em] text-[#2a2620] truncate">{perfume.name}</p>
            <p className="text-[10px] tracking-[0.2em] text-[#c9a961] italic mt-0.5">{perfume.nameEn || perfume.brand}</p>
          </div>
          <div className="text-right flex-shrink-0">
            {perfume.discountRate > 0 && (
              <p className="text-[10px] text-[#a39d8f] line-through">₩{perfume.originalPrice?.toLocaleString()}</p>
            )}
            <p className="text-sm font-semibold text-[#c9a961]">₩{perfume.price?.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <div className="flex flex-wrap gap-1">
            {(perfume.tags || []).slice(0, 2).map((tag, i) => (
              <span key={i} className="text-[9px] px-2 py-0.5 bg-[#faf8f3] border border-[#e8e2d6] text-[#8b8278]">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}


function AgeGroupSection({ group, perfumes, loading, onPerfumeClick }) {
  const [expanded, setExpanded] = useState(false);
  const { palette } = group;
  const displayPerfumes = expanded ? perfumes : perfumes.slice(0, 3);

  return (
    <div className="relative overflow-hidden border border-[#e8e2d6] bg-white">
      <div
        className="relative cursor-pointer select-none"
        style={{ background: `linear-gradient(135deg, ${palette.from}, ${palette.to})` }}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="absolute right-4 top-1/2 -translate-y-1/2 font-serif text-[80px] leading-none pointer-events-none select-none"
          style={{ color: palette.accent, opacity: 0.07 }}>
          {group.symbol}
        </div>

        <div className="relative px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-center justify-center w-16 h-16 border-2 rounded-full flex-shrink-0"
              style={{ borderColor: palette.accent, background: 'white' }}>
              <span className="font-serif text-lg leading-none" style={{ color: palette.accent }}>{group.label}</span>
              <span className="text-[8px] tracking-widest mt-0.5" style={{ color: palette.text }}>{group.range}</span>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] tracking-[0.5em] font-medium uppercase" style={{ color: palette.accent }}>{group.en}</span>
                <span className="text-[10px] text-[#8b8278]">— {group.desc}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {group.keywords.map((kw, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-white/60 border"
                    style={{ color: palette.text, borderColor: `${palette.accent}40` }}>
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-[#8b8278]">{perfumes.length}개</span>
            <div className={`w-6 h-6 border flex items-center justify-center transition-transform duration-300 ${expanded ? 'rotate-180' : ''}`}
              style={{ borderColor: `${palette.accent}50` }}>
              <span className="text-[10px]" style={{ color: palette.accent }}>▼</span>
            </div>
          </div>
        </div>
      </div>

      <div className={`overflow-hidden transition-all duration-500`}
        style={{ maxHeight: expanded ? '2000px' : perfumes.length > 0 ? '280px' : '0' }}>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-[#c9a961] border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : perfumes.length > 0 ? (
          <div>
            <div className="px-8 py-5 border-b border-[#e8e2d6]/50"
              style={{ background: `linear-gradient(to right, ${palette.from}30, transparent)` }}>
              <p className="text-xs italic text-[#8b8278] leading-loose whitespace-pre-line tracking-wider">
                {group.poem}
              </p>
            </div>

            <div className="divide-y divide-[#f0ebe0]">
              {displayPerfumes.map(p => (
                <PerfumeCard key={p.id} perfume={p} onClick={onPerfumeClick} />
              ))}
            </div>

            {perfumes.length > 3 && (
              <button
                onClick={(e) => { e.stopPropagation(); setExpanded(!expanded); }}
                className="w-full py-3 text-[11px] tracking-[0.3em] text-[#8b8278] hover:text-[#c9a961] transition-colors border-t border-[#e8e2d6]"
              >
                {expanded ? '접기 ▲' : `${perfumes.length - 3}개 더 보기 ▼`}
              </button>
            )}
          </div>
        ) : (
          <div className="px-8 py-10 text-center">
            <p className="text-sm text-[#a39d8f] italic">해당 연령대 추천 향수가 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}


function QuickFilterButton({ filter, isActive, onClick }) {
  const imgSrc = FILTER_IMAGES[filter.label];

  return (
    <button
      onClick={onClick}
      className="relative overflow-hidden flex flex-col items-center justify-end gap-1 border transition-all duration-300 min-h-[110px]"
      style={{
        borderColor: isActive ? '#c9a961' : '#e8e2d6',
        padding: 0,
      }}
    >
      
      {imgSrc && (
        <img
          src={imgSrc}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          style={{ opacity: isActive ? 0.55 : 0.35, transition: 'opacity 0.25s' }}
        />
      )}

      
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isActive
            ? 'linear-gradient(to top, rgba(26,21,16,0.72) 0%, rgba(26,21,16,0.18) 55%, transparent 100%)'
            : 'linear-gradient(to top, rgba(26,21,16,0.55) 0%, rgba(26,21,16,0.08) 55%, transparent 100%)',
          transition: 'background 0.25s',
        }}
      />

      
      {isActive && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ boxShadow: 'inset 0 0 0 2px #c9a961' }}
        />
      )}

      
      <div className="relative z-10 flex flex-col items-center gap-0.5 pb-3 pt-2">
        <span
          className="text-[12px] font-medium tracking-wider"
          style={{ color: isActive ? '#c9a961' : 'rgba(255,255,255,0.92)' }}
        >
          {filter.label}
        </span>
        <span
          className="text-[9px] tracking-widest"
          style={{ color: isActive ? 'rgba(201,169,97,0.8)' : 'rgba(255,255,255,0.55)' }}
        >
          {filter.en}
        </span>
      </div>
    </button>
  );
}


export default function Recommend() {
  const navigate = useNavigate();


  const isAdmin = sessionStorage.getItem('role') === 'ADMIN';


  const [heroEditing, setHeroEditing]   = useState(false);
  const [heroSubtitle, setHeroSubtitle] = useState('AION Parfums');
  const [heroTitle,    setHeroTitle]    = useState('RECOMMEND');
  const [heroDesc,     setHeroDesc]     = useState('당신을 위한 신화의 향');

  const [perfumeData, setPerfumeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [selectedGender, setSelectedGender] = useState('');
  const [sortBy, setSortBy] = useState('latest');

  const [ageData, setAgeData] = useState({});
  const [ageLoading, setAgeLoading] = useState(false);

  const handlePerfumeClick = (perfume) => {
    navigate('/collections', { state: { targetPerfumeId: perfume.id } });
  };

  useEffect(() => { fetchPerfumes(); }, [sortBy]);

  useEffect(() => {
    const t = setTimeout(() => { fetchPerfumes(); }, 500);
    return () => clearTimeout(t);
  }, [searchTerm, selectedTags, selectedGender]);

  useEffect(() => {
    if (activeTab === 'age' && Object.keys(ageData).length === 0) {
      fetchAgeGroupData();
    }
  }, [activeTab]);

  const fetchPerfumes = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        search: searchTerm || undefined,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        gender: selectedGender || undefined,
        sortBy,
        page: 0,
        size: 100,
      };
      const response = await getRecommendations(params);
      const transformed = (response.content || []).map(p => ({
        id: p.id,
        name: p.name,
        nameEn: p.nameEn || p.name,
        category: p.category || p.scentCategories?.join(' & ') || '기타',
        price: p.salePrice || p.price,
        originalPrice: p.originalPrice,
        discountRate: p.discountRate || 0,
        tags: p.tags || [],
        rating: p.rating || 0,
        brand: p.brandName || '',
        imageUrl: p.imageUrl,
        seasons: p.seasons || [],
        occasions: p.occasions || [],
      }));
      setPerfumeData(transformed);
    } catch (err) {
      setError(err.message || '데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAgeGroupData = async () => {
    setAgeLoading(true);
    const result = {};
    await Promise.all(
      AGE_GROUPS.map(async (group) => {
        try {
          const res = await fetch(`${API_BASE}/api/recommendations/age/${group.id}?limit=8`);
          if (!res.ok) throw new Error();
          const data = await res.json();
          result[group.id] = (data || []).map(p => ({
            id: p.id, name: p.name, nameEn: p.nameEn || '',
            price: p.salePrice || p.price, originalPrice: p.originalPrice,
            discountRate: p.discountRate || 0, tags: p.tags || [],
            rating: p.rating || 0, brand: p.brandName || '', imageUrl: p.imageUrl,
          }));
        } catch {
          try {
            const params = { tags: group.tags, sortBy: 'rating', page: 0, size: 8 };
            const fallbackRes = await getRecommendations(params);
            result[group.id] = (fallbackRes.content || []).map(p => ({
              id: p.id, name: p.name, nameEn: p.nameEn || '',
              price: p.salePrice || p.price, originalPrice: p.originalPrice,
              discountRate: p.discountRate || 0, tags: p.tags || [],
              rating: p.rating || 0, brand: p.brandName || '', imageUrl: p.imageUrl,
            }));
          } catch {
            result[group.id] = [];
          }
        }
      })
    );
    setAgeData(result);
    setAgeLoading(false);
  };

  const handleQuickFilter = (filter) => {
    if (filter.type === 'gender') {
      setSelectedGender(prev => prev === filter.value ? '' : filter.value);
      return;
    }
    if (filter.type === 'tags') {
      const tag = filter.value[0];
      setSelectedTags(prev =>
        prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
      );
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!selectedTags.includes(tagInput.trim())) {
        setSelectedTags([...selectedTags, tagInput.trim()]);
      }
      setTagInput('');
    }
  };

  const isFilterActive = (filter) => {
    if (filter.type === 'gender') return selectedGender === filter.value;
    if (filter.type === 'tags') return selectedTags.includes(filter.value[0]);
    return false;
  };

  const filteredPerfumes = useMemo(() => perfumeData, [perfumeData]);

  return (
    <main className="min-h-screen bg-[#faf8f3]">
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.6s ease forwards; }
        .delay-1 { animation-delay: 0.1s; opacity: 0; }
        .delay-2 { animation-delay: 0.2s; opacity: 0; }
        .delay-3 { animation-delay: 0.3s; opacity: 0; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: #f5f1e8; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: #c9a961; border-radius: 4px; }
      `}</style>

      
      <div className="relative bg-[#1a1510] py-20 overflow-hidden mt-[-2px]">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #c9a961 1px, transparent 0)', backgroundSize: '32px 32px' }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1510]" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
          <span className="font-serif text-[20vw] text-[#c9a961]/3 leading-none">RECOMMEND</span>
        </div>

        
        {isAdmin && (
          <div className="absolute top-4 right-4 z-20 flex gap-2">
            {heroEditing ? (
              <>
                <button
                  onClick={() => setHeroEditing(false)}
                  className="px-3 py-1.5 text-[10px] tracking-widest bg-[#c9a961] text-[#1a1510] hover:bg-[#e0c070] transition-colors"
                >
                  저장
                </button>
                <button
                  onClick={() => setHeroEditing(false)}
                  className="px-3 py-1.5 text-[10px] tracking-widest border border-white/20 text-white/50 hover:text-white transition-colors"
                >
                  취소
                </button>
              </>
            ) : (
              <button
                onClick={() => setHeroEditing(true)}
                className="px-3 py-1.5 text-[10px] tracking-widest border border-[#c9a961]/40 text-[#c9a961]/70 hover:border-[#c9a961] hover:text-[#c9a961] transition-colors flex items-center gap-1.5"
              >
                <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
                  <path d="M11 2L14 5L5 14H2V11L11 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
                </svg>
                히어로 편집
              </button>
            )}
          </div>
        )}

        <div className="relative text-center px-6 fade-up">
          {heroEditing ? (
            
            <div className="flex flex-col items-center gap-3 max-w-md mx-auto">
              <input
                value={heroSubtitle}
                onChange={e => setHeroSubtitle(e.target.value)}
                className="w-full text-center bg-white/10 border border-[#c9a961]/40 text-[#c9a961]/80 text-[10px] tracking-[0.8em] uppercase px-3 py-2 outline-none focus:border-[#c9a961] transition-colors placeholder-[#c9a961]/30"
                placeholder="서브타이틀 (예: AION Parfums)"
              />
              <input
                value={heroTitle}
                onChange={e => setHeroTitle(e.target.value)}
                className="w-full text-center bg-white/10 border border-[#c9a961]/40 text-white font-serif text-3xl tracking-[0.4em] px-3 py-2 outline-none focus:border-[#c9a961] transition-colors placeholder-white/30"
                placeholder="메인 타이틀"
              />
              <div className="w-full flex items-center gap-3">
                <div className="flex-1 h-[1px] bg-[#c9a961]/20" />
                <span className="text-[#c9a961]/30 text-xs">◆</span>
                <div className="flex-1 h-[1px] bg-[#c9a961]/20" />
              </div>
              <input
                value={heroDesc}
                onChange={e => setHeroDesc(e.target.value)}
                className="w-full text-center bg-white/10 border border-[#c9a961]/40 text-[#c9a961]/60 italic text-sm tracking-widest px-3 py-2 outline-none focus:border-[#c9a961] transition-colors placeholder-[#c9a961]/20"
                placeholder="설명 문구"
              />
              <p className="text-[9px] tracking-widest text-white/20 mt-1">* 저장 시 이 세션에만 반영됩니다. DB 연동은 별도 API 호출이 필요합니다.</p>
            </div>
          ) : (
            
            <>
              <p className="text-[10px] tracking-[0.8em] text-[#c9a961]/60 uppercase mb-4">{heroSubtitle}</p>
              <h1 className="font-serif text-5xl md:text-6xl tracking-[0.4em] text-white mb-4">{heroTitle}</h1>
              <GoldDivider />
              <p className="text-[#c9a961]/50 italic text-sm tracking-widest mt-4">{heroDesc}</p>
            </>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">

        
        <div className="flex border border-[#e8e2d6] mb-10 fade-up delay-1">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-4 text-xs tracking-[0.4em] uppercase transition-all duration-300 ${
              activeTab === 'all' ? 'bg-[#1a1510] text-[#c9a961]' : 'bg-white text-[#8b8278] hover:text-[#c9a961]'
            }`}
          >
            전체 추천
          </button>
          <div className="w-[1px] bg-[#e8e2d6]" />
          <button
            onClick={() => setActiveTab('age')}
            className={`flex-1 py-4 text-xs tracking-[0.4em] uppercase transition-all duration-300 flex items-center justify-center gap-2 ${
              activeTab === 'age' ? 'bg-[#1a1510] text-[#c9a961]' : 'bg-white text-[#8b8278] hover:text-[#c9a961]'
            }`}
          >
            <span>연령별 추천</span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded ${activeTab === 'age' ? 'bg-[#c9a961]/20 text-[#c9a961]' : 'bg-[#f0ebe0] text-[#a39d8f]'}`}>NEW</span>
          </button>
        </div>

        
        {activeTab === 'all' && (
          <div className="space-y-8">

            
            <div className="fade-up delay-1">
              <p className="text-[10px] tracking-[0.5em] text-[#8b8278] uppercase mb-4">QUICK FILTER</p>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {QUICK_FILTERS.map((f, i) => (
                  <QuickFilterButton
                    key={i}
                    filter={f}
                    isActive={isFilterActive(f)}
                    onClick={() => handleQuickFilter(f)}
                  />
                ))}
              </div>
            </div>

            
            <div className="flex flex-col md:flex-row gap-3 fade-up delay-2">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#c9a961]/50 text-sm">✦</span>
                <input
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="상품명, 브랜드, 카테고리 검색"
                  className="w-full pl-10 pr-4 py-3 border border-[#e8e2d6] bg-white text-sm text-[#2a2620] placeholder:text-[#a39d8f] outline-none focus:border-[#c9a961] transition-colors"
                />
              </div>
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value)}
                className="w-full md:w-44 px-4 py-3 border border-[#e8e2d6] bg-white text-sm text-[#2a2620] outline-none focus:border-[#c9a961] cursor-pointer"
              >
                <option value="latest">최신순</option>
                <option value="price-low">가격 낮은순</option>
                <option value="price-high">가격 높은순</option>
                <option value="popular">인기순</option>
              </select>
            </div>

            
            <div className="fade-up delay-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] tracking-[0.5em] text-[#8b8278] uppercase">PREFERENCE TAGS</p>
                {selectedTags.length > 0 && (
                  <button onClick={() => setSelectedTags([])} className="text-[10px] text-[#a39d8f] hover:text-[#c9a961]">전체 삭제</button>
                )}
              </div>
              <div className="border border-[#e8e2d6] bg-white p-3 flex flex-wrap gap-2 min-h-[48px]">
                {selectedTags.map((tag, i) => (
                  <span key={i}
                    onClick={() => setSelectedTags(selectedTags.filter(t => t !== tag))}
                    className="text-xs px-3 py-1 border border-[#c9a961] text-[#c9a961] bg-[#c9a961]/5 cursor-pointer hover:bg-[#c9a961] hover:text-white transition-colors flex items-center gap-1.5">
                    #{tag} <span className="text-[10px]">✕</span>
                  </span>
                ))}
                <input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="태그 입력 후 Enter (예: 플로럴, 우디)"
                  className="flex-1 min-w-[180px] outline-none text-sm text-[#2a2620] placeholder:text-[#c0b8a8] bg-transparent"
                />
              </div>
            </div>

            
            {(selectedGender || selectedTags.length > 0) && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] tracking-widest text-[#a39d8f]">필터:</span>
                {selectedGender && (
                  <span className="text-xs px-3 py-1 bg-[#1a1510] text-[#c9a961] flex items-center gap-1.5">
                    {selectedGender === 'MALE' ? '남성' : '여성'}
                    <button onClick={() => setSelectedGender('')} className="hover:text-white">✕</button>
                  </span>
                )}
                {selectedTags.map((t, i) => (
                  <span key={i} className="text-xs px-3 py-1 bg-[#1a1510] text-[#c9a961] flex items-center gap-1.5">
                    #{t}
                    <button onClick={() => setSelectedTags(selectedTags.filter(x => x !== t))} className="hover:text-white">✕</button>
                  </span>
                ))}
                <button
                  onClick={() => { setSelectedGender(''); setSelectedTags([]); setSearchTerm(''); }}
                  className="text-[10px] text-[#a39d8f] hover:text-[#c9a961] underline ml-2"
                >
                  초기화
                </button>
              </div>
            )}

            
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-[10px] tracking-[0.5em] text-[#8b8278] uppercase">SCENTS FOR YOU</p>
                <p className="text-xs text-[#a39d8f] italic">{filteredPerfumes.length}개의 향수</p>
              </div>

              {loading ? (
                <div className="py-20 flex flex-col items-center gap-4">
                  <div className="font-serif text-4xl text-[#c9a961]/20 animate-pulse">✦</div>
                  <p className="text-sm text-[#a39d8f] italic">향수를 불러오는 중...</p>
                </div>
              ) : error ? (
                <div className="py-16 text-center border border-[#e8e2d6] bg-white">
                  <p className="text-sm text-[#a39d8f] mb-4">{error}</p>
                  <button onClick={fetchPerfumes}
                    className="text-xs px-6 py-2 border border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961] hover:text-white transition-colors">
                    다시 시도
                  </button>
                </div>
              ) : filteredPerfumes.length > 0 ? (
                <div className="max-h-[600px] overflow-y-auto scrollbar-thin divide-y divide-[#f0ebe0]">
                  {filteredPerfumes.map(p => (
                    <PerfumeCard key={p.id} perfume={p} onClick={handlePerfumeClick} />
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center border border-[#e8e2d6] bg-white">
                  <div className="font-serif text-5xl text-[#c9a961]/10 mb-4">?</div>
                  <p className="text-sm text-[#a39d8f] italic">검색 결과가 없습니다</p>
                  <p className="text-xs text-[#c0b8a8] mt-2">다른 키워드나 태그로 검색해보세요</p>
                </div>
              )}
            </div>
          </div>
        )}

        
        {activeTab === 'age' && (
          <div className="space-y-4 fade-up">
            <div className="border border-[#e8e2d6] bg-white p-8 text-center mb-8">
              <p className="text-[10px] tracking-[0.6em] text-[#c9a961] uppercase mb-3">AGE-BASED CURATION</p>
              <h2 className="font-serif text-2xl text-[#1a1510] tracking-wider mb-3">연령별 맞춤 향수</h2>
              <GoldDivider />
              <p className="text-sm text-[#8b8278] italic mt-4 leading-relaxed">
                삶의 단계마다 어울리는 향기가 있습니다.<br />
                나이가 담긴 향기로 당신의 이야기를 완성하세요.
              </p>
            </div>

            {AGE_GROUPS.map((group, idx) => (
              <div key={group.id} className="fade-up" style={{ animationDelay: `${idx * 0.08}s`, opacity: 0 }}>
                <AgeGroupSection
                  group={group}
                  perfumes={ageData[group.id] || []}
                  loading={ageLoading}
                  onPerfumeClick={handlePerfumeClick}
                />
              </div>
            ))}

            <div className="pt-6 text-center">
              <GoldDivider />
              <p className="text-[10px] tracking-[0.3em] text-[#a39d8f] italic mt-4">
                추천은 향수의 주요 특성과 연령대 선호도 데이터를 기반으로 제공됩니다
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}