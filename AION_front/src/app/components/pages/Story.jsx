import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// 섹션 메타 정보
const SECTION_META = {
  HISTORY: {
    label: 'HISTORY',
    labelKo: '브랜드 연혁',
    description: '1847년부터 이어온 신들의 향기'
  },
  PROCESS: {
    label: 'PROCESS',
    labelKo: '향수 제조 과정',
    description: '장인의 손끝에서 탄생하는 예술'
  },
  PHILOSOPHY: {
    label: 'PHILOSOPHY',
    labelKo: '브랜드 철학',
    description: 'AION이 추구하는 영원한 가치'
  }
};

const SECTION_ORDER = ['HISTORY', 'PROCESS', 'PHILOSOPHY'];

function Divider() {
  return (
    <div className="flex items-center justify-center my-8">
      <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
      <div className="mx-4 text-[#c9a961] text-xs">✦</div>
      <div className="h-[1px] w-16 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
    </div>
  );
}

function SectionHeader({ sectionKey }) {
  const meta = SECTION_META[sectionKey] || {};
  return (
    <div className="text-center mb-20">
      <Divider />
      <p className="text-xs tracking-[0.4em] text-[#c9a961] mb-2 uppercase">{meta.labelKo}</p>
      <h2 className="font-display text-4xl md:text-5xl tracking-[0.3em] text-[#2a2620] mb-4">
        {meta.label}
      </h2>
      <p className="text-sm italic text-[#8b8278] tracking-wider">{meta.description}</p>
    </div>
  );
}

// HISTORY: 타임라인 형태
function HistorySection({ items }) {
  return (
    <div className="relative max-w-5xl mx-auto">
      {/* 중앙 세로선 */}
      <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#c9a961]/40 to-transparent hidden md:block" />

      <div className="space-y-16">
        {items.map((item, idx) => {
          const isLeft = idx % 2 === 0;
          return (
            <div key={item.storyId} className="relative flex flex-col md:flex-row items-center gap-8">
              {/* 왼쪽 영역 */}
              <div className={`w-full md:w-1/2 ${isLeft ? 'md:text-right md:pr-16' : 'md:order-3 md:pl-16'}`}>
                {isLeft ? (
                  <StoryCard item={item} />
                ) : (
                  item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title}
                      className="w-full aspect-[4/3] object-cover rounded-sm shadow-lg" />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] rounded-sm flex items-center justify-center">
                      <span className="text-5xl text-[#c9a961]/20">✦</span>
                    </div>
                  )
                )}
              </div>

              {/* 중앙 연도 뱃지 */}
              <div className="md:absolute md:left-1/2 md:-translate-x-1/2 z-10 flex-shrink-0">
                <div className="bg-[#c9a961] text-white text-xs tracking-[0.2em] px-4 py-2 font-medium">
                  {item.yearLabel || '─'}
                </div>
              </div>

              {/* 오른쪽 영역 */}
              <div className={`w-full md:w-1/2 ${isLeft ? 'md:order-3 md:pl-16' : 'md:text-right md:pr-16'}`}>
                {isLeft ? (
                  item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title}
                      className="w-full aspect-[4/3] object-cover rounded-sm shadow-lg" />
                  ) : (
                    <div className="w-full aspect-[4/3] bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] rounded-sm flex items-center justify-center">
                      <span className="text-5xl text-[#c9a961]/20">✦</span>
                    </div>
                  )
                ) : (
                  <StoryCard item={item} align={isLeft ? 'left' : 'right'} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// PROCESS: 스텝 형태
function ProcessSection({ items }) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {items.map((item, idx) => (
          <div key={item.storyId} className="group relative">
            {/* 스텝 번호 */}
            <div className="text-[80px] font-display text-[#c9a961]/10 leading-none mb-2 select-none">
              {String(idx + 1).padStart(2, '0')}
            </div>
            {item.imageUrl && (
              <div className="overflow-hidden mb-6">
                <img src={item.imageUrl} alt={item.title}
                  className="w-full aspect-video object-cover group-hover:scale-105 transition-transform duration-700" />
              </div>
            )}
            <div className="border-l-2 border-[#c9a961] pl-5">
              <h3 className="text-lg tracking-[0.15em] text-[#2a2620] font-medium mb-2">{item.title}</h3>
              {item.subtitle && (
                <p className="text-xs text-[#c9a961] italic tracking-wider mb-3">{item.subtitle}</p>
              )}
              {item.content && (
                <p className="text-sm text-[#6f6756] leading-relaxed">{item.content}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// PHILOSOPHY: 전체 화면 카드 형태
function PhilosophySection({ items }) {
  return (
    <div className="max-w-5xl mx-auto space-y-24">
      {items.map((item, idx) => {
        const isReverse = idx % 2 !== 0;
        return (
          <div key={item.storyId}
            className={`flex flex-col ${isReverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-12 items-center`}>
            {item.imageUrl ? (
              <div className="w-full md:w-1/2 overflow-hidden">
                <img src={item.imageUrl} alt={item.title}
                  className="w-full aspect-square object-cover shadow-2xl" />
              </div>
            ) : (
              <div className="w-full md:w-1/2 aspect-square bg-gradient-to-br from-[#2a2620] to-[#4a3f30] flex items-center justify-center shadow-2xl">
                <span className="text-[120px] text-[#c9a961]/20 font-display">{idx + 1}</span>
              </div>
            )}
            <div className="w-full md:w-1/2 space-y-6">
              {item.subtitle && (
                <p className="text-xs tracking-[0.4em] text-[#c9a961] uppercase">{item.subtitle}</p>
              )}
              <h3 className="font-display text-3xl md:text-4xl tracking-[0.2em] text-[#2a2620] leading-snug">
                {item.title}
              </h3>
              <div className="w-12 h-[1px] bg-[#c9a961]" />
              {item.content && (
                <p className="text-[#6f6756] leading-loose text-sm md:text-base whitespace-pre-line">
                  {item.content}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StoryCard({ item }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xl tracking-[0.15em] text-[#2a2620] font-medium">{item.title}</h3>
      {item.subtitle && (
        <p className="text-xs text-[#c9a961] italic tracking-wider">{item.subtitle}</p>
      )}
      {item.content && (
        <p className="text-sm text-[#6f6756] leading-relaxed">{item.content}</p>
      )}
    </div>
  );
}

export default function Story() {
  const [storyData, setStoryData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSection, setActiveSection] = useState('HISTORY');
  const sectionRefs = useRef({});

  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    fetchStories();
  }, []);

  // 스크롤 위치에 따라 activeSection 업데이트
  useEffect(() => {
    const handleScroll = () => {
      for (const key of SECTION_ORDER) {
        const el = sectionRefs.current[key];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) {
            setActiveSection(key);
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchStories = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/stories/public`);
      if (!res.ok) throw new Error('서버 오류');
      const json = await res.json();
      if (!json.success) throw new Error(json.message || '데이터를 불러올 수 없습니다.');
      setStoryData(json.data || {});
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (key) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4" />
          <p className="text-[#8b8278] italic">스토리를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#8b8278] mb-4">{error}</p>
          <button onClick={fetchStories}
            className="px-6 py-2 bg-[#c9a961] text-white hover:bg-[#b89851] transition-colors">
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  const availableSections = SECTION_ORDER.filter(k => storyData[k]?.length > 0);

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {/* 히어로 */}
      <div className="relative h-[55vh] bg-[#2a2620] flex items-center justify-center overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #c9a961 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2a2620]/50 to-[#2a2620]" />

        <div className="relative text-center px-6">
          <div className="flex items-center justify-center mb-6">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
            <div className="mx-4 text-[#c9a961] text-sm">✦</div>
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent" />
          </div>
          <p className="text-[#c9a961] text-xs tracking-[0.5em] mb-4 uppercase">Since 1847</p>
          <h1 className="font-display text-5xl md:text-7xl tracking-[0.4em] text-white mb-6">STORY</h1>
          <p className="text-[#b8a990] italic text-lg tracking-wider">영원한 그들의 향을 담은 이야기</p>
        </div>
      </div>

      {/* 섹션 네비게이션 (sticky) */}
      {availableSections.length > 0 && (
        <div className="sticky top-[var(--nav-height,0px)] z-40 bg-[#faf8f3]/95 backdrop-blur-sm border-b border-[#c9a961]/20">
          <div className="max-w-4xl mx-auto px-6">
            <div className="flex items-center justify-center gap-12">
              {availableSections.map(key => (
                <button
                  key={key}
                  onClick={() => scrollToSection(key)}
                  className={`py-4 text-xs tracking-[0.3em] uppercase transition-colors border-b-2 ${
                    activeSection === key
                      ? 'text-[#c9a961] border-[#c9a961]'
                      : 'text-[#8b8278] border-transparent hover:text-[#c9a961]'
                  }`}
                >
                  {SECTION_META[key]?.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 각 섹션 렌더링 */}
      <div className="px-6 py-24 space-y-32">
        {availableSections.map(key => (
          <div key={key} ref={el => (sectionRefs.current[key] = el)}>
            <SectionHeader sectionKey={key} />
            {key === 'HISTORY' && <HistorySection items={storyData[key] || []} />}
            {key === 'PROCESS' && <ProcessSection items={storyData[key] || []} />}
            {key === 'PHILOSOPHY' && <PhilosophySection items={storyData[key] || []} />}
          </div>
        ))}

        {availableSections.length === 0 && (
          <div className="text-center py-32">
            <p className="text-[#8b8278] italic text-lg">아직 등록된 스토리가 없습니다</p>
          </div>
        )}
      </div>

      {/* 관리자 편집 버튼 */}
      {isAdmin && (
        <button
          onClick={() => window.location.href = '/admin/story'}
          className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-black/80 text-[#c9a961] border border-[#c9a961] hover:bg-[#c9a961] hover:text-black transition-all"
        >
          STORY 편집하기
        </button>
      )}
    </div>
  );
}