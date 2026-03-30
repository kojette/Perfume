import { useState, useEffect, useRef } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';


const MOCK_DATA = {
  HISTORY: [
    {
      storyId: 1,
      yearLabel: '1847',
      title: '신화의 시작',
      subtitle: 'The Birth of Divinity',
      content: '파리 마레 지구의 작은 공방에서 조향사 에드몬 뒤발은 그리스 신화에서 영감을 받아 AION을 창립했습니다. 그는 신들이 숨쉬는 올림포스의 공기를 지상에 담겠다는 꿈을 가졌습니다.',
      imageUrl: null,
    },
    {
      storyId: 2,
      yearLabel: '1923',
      title: '황금 시대',
      subtitle: 'L\'Âge d\'Or',
      content: '두 번의 세계대전을 거치며 AION의 향수는 유럽 귀족 사회의 필수품이 되었습니다. 아르테미스 컬렉션은 파리, 런던, 비엔나의 궁정을 사로잡았습니다.',
      imageUrl: null,
    },
    {
      storyId: 3,
      yearLabel: '1989',
      title: '동양과의 만남',
      subtitle: 'East meets Olympus',
      content: '일본 교토의 고급 백화점에 첫 아시아 매장을 오픈하며 AION은 동서양 향수 예술의 교류를 시작했습니다. 이 시기 탄생한 아프로디테 오드퍼퓸은 지금도 전설로 남아 있습니다.',
      imageUrl: null,
    },
    {
      storyId: 4,
      yearLabel: '2026',
      title: '영원한 현재',
      subtitle: 'Into the Eternal Now',
      content: '177년의 역사를 담아 AION은 새로운 신화를 씁니다. 전통 증류법과 현대 분자 조향 기술을 결합하여 과거와 미래를 잇는 향수를 창조합니다.',
      imageUrl: null,
    },
  ],
  PROCESS: [
    {
      storyId: 5,
      title: '원료 채집',
      subtitle: 'Harvest of the Gods',
      content: '그라스의 새벽, 이슬이 마르기 전에 장미 꽃잎을 손으로 채집합니다. 1킬로그램의 앱솔루트를 얻기 위해 3.5톤의 꽃잎이 필요합니다.',
      imageUrl: null,
    },
    {
      storyId: 6,
      title: '증류와 추출',
      subtitle: 'Alchemy of Essence',
      content: '전통 구리 증류기와 냉압착법으로 꽃과 과실의 정수를 추출합니다. 이 연금술적 과정은 신들의 넥타르를 현실로 옮겨오는 의식입니다.',
      imageUrl: null,
    },
    {
      storyId: 7,
      title: '조화의 작곡',
      subtitle: 'Composing Harmony',
      content: '수석 조향사는 300여 가지 원료를 오케스트라처럼 조율합니다. 탑 노트, 미들 노트, 베이스 노트가 완벽한 삼위일체를 이루기까지 수백 번의 시도가 반복됩니다.',
      imageUrl: null,
    },
    {
      storyId: 8,
      title: '숙성과 완성',
      subtitle: 'The Art of Patience',
      content: '혼합된 향수는 오크통에서 최소 6개월 숙성됩니다. 시간이 녹아든 향은 처음과 전혀 다른 깊이와 복잡성을 가지게 됩니다.',
      imageUrl: null,
    },
    {
      storyId: 9,
      title: '병에 담긴 신화',
      subtitle: 'Myth in a Bottle',
      content: '베네치아 유리 장인이 하나씩 손으로 제작한 플라콩에 향수를 담습니다. 병 하나를 완성하는 데 3시간, 그것은 하나의 조각품입니다.',
      imageUrl: null,
    },
    {
      storyId: 10,
      title: '의식의 완성',
      subtitle: 'The Sacred Ritual',
      content: '포장부터 리본까지 모든 과정이 수작업으로 이루어집니다. AION의 향수를 받는 것은 올림포스로부터 선물을 받는 것과 같은 경험입니다.',
      imageUrl: null,
    },
  ],
  PHILOSOPHY: [
    {
      storyId: 11,
      title: '시간을 초월한 아름다움',
      subtitle: 'KAIROS — 카이로스',
      content: `그리스어로 '완벽한 순간'을 의미하는 카이로스. AION은 향수가 단순한 향기가 아닌, 시간을 정지시키는 마법이라 믿습니다.

뿌리는 순간, 당신은 신화 속으로 걸어 들어갑니다. 이오의 변신처럼, 아프로디테의 탄생처럼 — 향은 당신을 전혀 다른 존재로 만듭니다.`,
      imageUrl: null,
    },
    {
      storyId: 12,
      title: '장인 정신의 신성함',
      subtitle: 'HEPHAESTUS — 헤파이스토스',
      content: `불과 대장장이의 신 헤파이스토스는 완벽함을 추구했습니다. AION의 모든 조향사는 그 정신을 계승합니다.

10년의 수련, 100번의 실패, 그리고 단 하나의 걸작. 우리는 빠른 것보다 옳은 것을 선택합니다. 영원히 기억될 향을 만들기 위해.`,
      imageUrl: null,
    },
    {
      storyId: 13,
      title: '자연과의 신성한 계약',
      subtitle: 'GAIA — 가이아',
      content: `대지의 여신 가이아는 모든 생명의 근원입니다. AION은 자연에서 영감을 얻고, 자연에 다시 돌려줍니다.

그라스의 장미 농장, 에티오피아의 프랑켄센스 나무, 인도의 재스민 밭 — 우리는 원료를 생산하는 모든 토지와 사람들과 지속 가능한 관계를 맺습니다.`,
      imageUrl: null,
    },
  ],
};



function GreekBorder({ className = '' }) {
  return (
    <div className={`flex items-center ${className}`}>
      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-[#c9a961]/50 to-[#c9a961]" />
      <div className="mx-3 flex items-center gap-1">
        <span className="text-[#c9a961] text-xs">◆</span>
        <span className="text-[#c9a961] text-[8px]">◆</span>
        <span className="text-[#c9a961] text-xs">◆</span>
      </div>
      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-[#c9a961]/50 to-[#c9a961]" />
    </div>
  );
}

function OrnateCircle({ number, size = 'lg' }) {
  const sz = size === 'lg' ? 'w-20 h-20' : 'w-12 h-12';
  const txt = size === 'lg' ? 'text-2xl' : 'text-sm';
  return (
    <div className={`relative ${sz} flex-shrink-0`}>
      <svg viewBox="0 0 80 80" className="absolute inset-0 w-full h-full">
        <circle cx="40" cy="40" r="36" fill="none" stroke="#c9a961" strokeWidth="1" strokeDasharray="4 3" />
        <circle cx="40" cy="40" r="30" fill="none" stroke="#c9a961" strokeWidth="0.5" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
          const rad = (deg * Math.PI) / 180;
          const x = 40 + 33 * Math.cos(rad);
          const y = 40 + 33 * Math.sin(rad);
          return <circle key={deg} cx={x} cy={y} r="1.5" fill="#c9a961" />;
        })}
      </svg>
      <div className={`absolute inset-0 flex items-center justify-center font-serif ${txt} text-[#c9a961]`}>
        {number}
      </div>
    </div>
  );
}


function ParticleField() {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    delay: Math.random() * 5,
    duration: Math.random() * 4 + 3,
  }));

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute rounded-full bg-[#c9a961]"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: 0,
            animation: `float ${p.duration}s ${p.delay}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes float {
          0%, 100% { opacity: 0; transform: translateY(0px) scale(1); }
          50% { opacity: 0.6; transform: translateY(-20px) scale(1.2); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes revealWidth {
          from { width: 0; }
          to { width: 100%; }
        }
        @keyframes rotateSlow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        .animate-fadeSlideUp { animation: fadeSlideUp 1s ease forwards; }
        .animate-rotateSlow { animation: rotateSlow 20s linear infinite; }
        .animate-shimmer { animation: shimmer 3s ease-in-out infinite; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-800 { animation-delay: 0.8s; }

        .section-reveal {
          opacity: 0;
          transform: translateY(50px);
          transition: opacity 0.8s ease, transform 0.8s ease;
        }
        .section-reveal.visible {
          opacity: 1;
          transform: translateY(0);
        }
        .history-line::before {
          content: '';
          position: absolute;
          left: 50%;
          top: 0;
          bottom: 0;
          width: 1px;
          background: linear-gradient(to bottom, transparent, #c9a961 20%, #c9a961 80%, transparent);
        }
        .greek-pattern {
          background-image: repeating-linear-gradient(
            90deg,
            transparent,
            transparent 8px,
            rgba(201, 169, 97, 0.15) 8px,
            rgba(201, 169, 97, 0.15) 9px
          ),
          repeating-linear-gradient(
            0deg,
            transparent,
            transparent 8px,
            rgba(201, 169, 97, 0.15) 8px,
            rgba(201, 169, 97, 0.15) 9px
          );
        }
      `}</style>
    </div>
  );
}


const NAV_SECTIONS = [
  { key: 'HISTORY', label: 'HISTORY', ko: '브랜드 연혁', symbol: 'Ι' },
  { key: 'PROCESS', label: 'PROCESS', ko: '제조 과정', symbol: 'ΙΙ' },
  { key: 'PHILOSOPHY', label: 'PHILOSOPHY', ko: '브랜드 철학', symbol: 'ΙΙΙ' },
];


function HistoryItem({ item, idx }) {
  const isLeft = idx % 2 === 0;
  return (
    <div className="relative flex flex-col md:flex-row items-center gap-0 mb-20">
      
      <div className={`w-full md:w-[45%] ${isLeft ? 'md:pr-16 md:text-right' : 'md:order-3 md:pl-16'}`}>
        {isLeft ? (
          <div className="space-y-3 py-8">
            <p className="text-[10px] tracking-[0.5em] text-[#c9a961]/60 uppercase">{item.subtitle}</p>
            <h3 className="font-serif text-3xl text-[#1a1510] tracking-wide leading-tight">{item.title}</h3>
            <div className={`h-[1px] w-16 bg-[#c9a961] ${isLeft ? 'ml-auto' : ''}`} />
            <p className="text-[#6f6756] text-sm leading-loose">{item.content}</p>
          </div>
        ) : (
          <div className="w-full aspect-[4/3] overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <HistoryPlaceholder idx={idx} />
            )}
          </div>
        )}
      </div>

      
      <div className="md:absolute md:left-1/2 md:-translate-x-1/2 z-10 flex-shrink-0 flex flex-col items-center">
        <div className="hidden md:block w-[1px] h-8 bg-gradient-to-b from-transparent to-[#c9a961]" />
        <div className="border border-[#c9a961] bg-[#0e0c09] px-5 py-2 text-center">
          <span className="text-[#c9a961] font-serif text-lg tracking-[0.3em]">{item.yearLabel}</span>
        </div>
        <div className="hidden md:block w-[1px] h-8 bg-gradient-to-t from-transparent to-[#c9a961]" />
      </div>

      
      <div className={`w-full md:w-[45%] ${isLeft ? 'md:order-3 md:pl-16' : 'md:pr-16 md:text-right'}`}>
        {isLeft ? (
          <div className="w-full aspect-[4/3] overflow-hidden">
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <HistoryPlaceholder idx={idx} />
            )}
          </div>
        ) : (
          <div className="space-y-3 py-8">
            <p className="text-[10px] tracking-[0.5em] text-[#c9a961]/60 uppercase">{item.subtitle}</p>
            <h3 className="font-serif text-3xl text-[#1a1510] tracking-wide leading-tight">{item.title}</h3>
            <div className={`h-[1px] w-16 bg-[#c9a961] ml-auto`} />
            <p className="text-[#6f6756] text-sm leading-loose">{item.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

function HistoryPlaceholder({ idx }) {
  const myths = [
    { symbol: 'Α', name: 'ALPHA', desc: '시작의 신화' },
    { symbol: 'Ω', name: 'OMEGA', desc: '영원의 순환' },
    { symbol: 'Φ', name: 'PHI', desc: '황금비의 조화' },
    { symbol: 'Σ', name: 'SIGMA', desc: '우주의 합' },
  ];
  const m = myths[idx % myths.length];
  return (
    <div className="w-full h-full bg-gradient-to-br from-[#1a1510] via-[#2a2015] to-[#0e0c09] flex flex-col items-center justify-center relative overflow-hidden" style={{ minHeight: 220 }}>
      <div className="absolute inset-0 greek-pattern opacity-30" />
      <div className="absolute inset-0 flex items-center justify-center opacity-5">
        <span className="font-serif text-[200px] text-[#c9a961]">{m.symbol}</span>
      </div>
      <div className="relative text-center">
        <div className="font-serif text-7xl text-[#c9a961]/40 mb-2">{m.symbol}</div>
        <div className="text-[10px] tracking-[0.4em] text-[#c9a961]/50 uppercase">{m.name}</div>
        <div className="text-[9px] tracking-[0.2em] text-[#c9a961]/30 mt-1">{m.desc}</div>
      </div>
    </div>
  );
}


function ProcessCard({ item, idx }) {
  return (
    <div className="group relative">
      
      <div className="absolute -top-4 -left-2 font-serif text-[100px] leading-none text-[#c9a961]/5 select-none pointer-events-none">
        {String(idx + 1).padStart(2, '0')}
      </div>

      <div className="relative border border-[#c9a961]/20 bg-[#faf8f3] group-hover:border-[#c9a961]/60 transition-all duration-500 overflow-hidden">
        
        <div className="aspect-video overflow-hidden">
          {item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
          ) : (
            <ProcessPlaceholder idx={idx} />
          )}
        </div>

        
        <div className="p-6">
          <div className="flex items-start gap-4 mb-4">
            <OrnateCircle number={idx + 1} size="sm" />
            <div className="flex-1 pt-1">
              <p className="text-[9px] tracking-[0.4em] text-[#c9a961] uppercase mb-1">{item.subtitle}</p>
              <h3 className="text-base font-medium tracking-[0.1em] text-[#1a1510]">{item.title}</h3>
            </div>
          </div>
          <div className="h-[1px] bg-gradient-to-r from-[#c9a961]/40 to-transparent mb-4" />
          <p className="text-xs text-[#6f6756] leading-loose">{item.content}</p>
        </div>

        
        <div className="absolute inset-0 bg-gradient-to-t from-[#c9a961]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    </div>
  );
}

function ProcessPlaceholder({ idx }) {
  const colors = [
    ['#1a1510', '#2d2010'],
    ['#0f1a15', '#102a1a'],
    ['#150f1a', '#20102d'],
    ['#1a1010', '#2d1515'],
    ['#101518', '#152028'],
    ['#181510', '#2d2510'],
  ];
  const symbols = ['⚗', '🌹', '♪', '⏳', '✦', '🎀'];
  const greekLetters = ['Δ', 'Θ', 'Λ', 'Ξ', 'Π', 'Ψ'];
  const [from, to] = colors[idx % colors.length];
  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden"
      style={{ background: `linear-gradient(135deg, ${from}, ${to})`, minHeight: 160 }}>
      <div className="absolute inset-0 greek-pattern opacity-20" />
      <div className="text-center relative z-10">
        <div className="text-5xl opacity-20 mb-2">{greekLetters[idx % greekLetters.length]}</div>
        <div className="text-2xl opacity-10">{symbols[idx % symbols.length]}</div>
      </div>
    </div>
  );
}


function PhilosophyCard({ item, idx }) {
  const isReverse = idx % 2 !== 0;
  const gods = ['아프로디테', '아테나', '디오니소스'];
  const godSymbols = ['Α', 'Θ', 'Δ'];

  return (
    <div className={`flex flex-col ${isReverse ? 'md:flex-row-reverse' : 'md:flex-row'} gap-0 items-stretch min-h-[500px]`}>
      
      <div className="w-full md:w-1/2 relative overflow-hidden">
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <PhilosophyVisual idx={idx} godName={gods[idx % gods.length]} symbol={godSymbols[idx % godSymbols.length]} />
        )}
      </div>

      
      <div className={`w-full md:w-1/2 bg-[#faf8f3] flex flex-col justify-center px-12 py-16 relative`}>
        
        <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-[#c9a961]/30" />
        <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-[#c9a961]/30" />

        <div className="space-y-6">
          <div>
            <p className="text-[10px] tracking-[0.6em] text-[#c9a961]/70 uppercase mb-3">{item.subtitle}</p>
            <h3 className="font-serif text-4xl text-[#1a1510] leading-snug tracking-wide">{item.title}</h3>
          </div>

          <GreekBorder />

          <div className="space-y-4">
            {item.content?.split('\n\n').map((para, i) => (
              <p key={i} className="text-[#6f6756] leading-loose text-sm">{para}</p>
            ))}
          </div>

          
          <div className="flex items-center gap-4 pt-4">
            <div className="font-serif text-5xl text-[#c9a961]/20">{['I', 'II', 'III'][idx]}</div>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-[#c9a961]/30 to-transparent" />
          </div>
        </div>
      </div>
    </div>
  );
}

function PhilosophyVisual({ idx, godName, symbol }) {
  const palettes = [
    { from: '#0e0b06', via: '#1e1508', to: '#2d2010' },
    { from: '#060b0e', via: '#081520', to: '#102030' },
    { from: '#0b060e', via: '#180820', to: '#25102d' },
  ];
  const p = palettes[idx % palettes.length];
  return (
    <div className="w-full h-full relative flex items-center justify-center"
      style={{ background: `linear-gradient(160deg, ${p.from}, ${p.via}, ${p.to})`, minHeight: 400 }}>
      <div className="absolute inset-0 greek-pattern opacity-15" />

      
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-64 h-64 border border-[#c9a961]/10 rounded-full animate-rotateSlow" />
        <div className="absolute w-48 h-48 border border-[#c9a961]/15 rounded-full" style={{ animation: 'rotateSlow 15s linear infinite reverse' }} />
      </div>

      
      <div className="relative text-center z-10">
        <div className="font-serif text-[120px] leading-none text-[#c9a961]/15 select-none">{symbol}</div>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="font-serif text-6xl text-[#c9a961]/40 mb-4">{symbol}</div>
          <div className="text-[10px] tracking-[0.6em] text-[#c9a961]/50 uppercase">{godName}</div>
          <div className="mt-3 flex gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="w-1 h-1 rounded-full bg-[#c9a961]/30 animate-shimmer"
                style={{ animationDelay: `${i * 0.3}s` }} />
            ))}
          </div>
        </div>
      </div>

      
      <svg className="absolute inset-0 w-full h-full opacity-5" viewBox="0 0 400 400">
        {[...Array(12)].map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          return (
            <line key={i} x1="200" y1="200"
              x2={200 + 180 * Math.cos(angle)} y2={200 + 180 * Math.sin(angle)}
              stroke="#c9a961" strokeWidth="0.5" />
          );
        })}
        <circle cx="200" cy="200" r="100" fill="none" stroke="#c9a961" strokeWidth="0.5" />
        <circle cx="200" cy="200" r="50" fill="none" stroke="#c9a961" strokeWidth="0.5" />
      </svg>
    </div>
  );
}


function SectionHeader({ sectionKey, label, ko, description, romanNum }) {
  return (
    <div className="text-center mb-20 section-reveal">
      <div className="inline-flex items-center gap-6 mb-8">
        <div className="h-[1px] w-20 bg-gradient-to-r from-transparent to-[#c9a961]" />
        <span className="font-serif text-[#c9a961]/40 text-xl">{romanNum}</span>
        <div className="h-[1px] w-20 bg-gradient-to-l from-transparent to-[#c9a961]" />
      </div>
      <p className="text-[10px] tracking-[0.6em] text-[#c9a961] mb-3 uppercase">{ko}</p>
      <h2 className="font-serif text-5xl md:text-6xl tracking-[0.4em] text-[#1a1510] mb-5">{label}</h2>
      <p className="text-sm italic text-[#8b8278] tracking-widest">{description}</p>
      <div className="flex items-center justify-center gap-3 mt-8">
        <div className="h-[1px] w-8 bg-[#c9a961]/30" />
        <div className="flex gap-1">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="w-1 h-1 rounded-full bg-[#c9a961]/50" />
          ))}
        </div>
        <div className="h-[1px] w-8 bg-[#c9a961]/30" />
      </div>
    </div>
  );
}


function HeroSection() {
  return (
    <div className="relative h-[100vh] bg-[#0e0c09] flex items-center justify-center overflow-hidden">
      
      <div className="absolute inset-0 greek-pattern opacity-20" />

      
      <div className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(201,169,97,0.08) 0%, transparent 70%)' }} />

      
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-[#0e0c09] to-transparent" />

      
      <ParticleField />

      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none overflow-hidden">
        <div className="font-serif text-[25vw] text-[#c9a961]/3 tracking-widest leading-none">ΑΙΩΝ</div>
      </div>

      
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[600px] h-[600px] border border-[#c9a961]/5 rounded-full" />
        <div className="absolute w-[400px] h-[400px] border border-[#c9a961]/8 rounded-full" />
        <div className="absolute w-[250px] h-[250px] border border-[#c9a961]/10 rounded-full" />
      </div>

      
      <div className="relative text-center px-6 z-10">
        
        <div className="flex items-center justify-center gap-4 mb-10 opacity-0 animate-fadeSlideUp">
          <div className="h-[1px] w-16 bg-gradient-to-r from-transparent to-[#c9a961]/60" />
          <div className="flex gap-2 items-center">
            <span className="text-[#c9a961]/60 text-xs">◆</span>
            <span className="text-[#c9a961] text-xs tracking-[0.8em] uppercase font-light">Since 1847</span>
            <span className="text-[#c9a961]/60 text-xs">◆</span>
          </div>
          <div className="h-[1px] w-16 bg-gradient-to-l from-transparent to-[#c9a961]/60" />
        </div>

        
        <div className="opacity-0 animate-fadeSlideUp delay-200">
          <p className="text-[#c9a961] text-xs tracking-[1em] mb-5 uppercase font-light">AION의 이야기</p>
          <h1 className="font-serif text-7xl md:text-9xl tracking-[0.5em] text-white leading-none mb-2">
            STORY
          </h1>
          <div className="font-serif text-xl md:text-2xl tracking-[0.6em] text-[#c9a961]/50 mt-2">
            Α Ι Ω Ν
          </div>
        </div>

        
        <div className="mt-10 opacity-0 animate-fadeSlideUp delay-400">
          <p className="text-[#c9a961]/50 italic text-base md:text-lg tracking-[0.3em]">
            신화에서 탄생한 영원한 향기
          </p>
          <p className="text-[#c9a961]/25 text-xs tracking-[0.5em] mt-2 italic font-light">
            Ἀεὶ ὁ θεὸς γεωμετρεῖ — 신은 언제나 기하학을 한다
          </p>
        </div>

        
        <div className="absolute bottom-[-100px] left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 opacity-0 animate-fadeSlideUp delay-800">
          <span className="text-[#c9a961]/40 text-[9px] tracking-[0.5em] uppercase">SCROLL</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-[#c9a961]/40 to-transparent" />
        </div>
      </div>
    </div>
  );
}


function QuoteBanner({ quote, source }) {
  return (
    <div className="relative py-24 bg-[#0e0c09] overflow-hidden my-0">
      <div className="absolute inset-0 greek-pattern opacity-10" />
      <div className="relative max-w-3xl mx-auto px-6 text-center">
        <div className="font-serif text-6xl text-[#c9a961]/20 leading-none mb-6">"</div>
        <p className="font-serif text-xl md:text-2xl text-white/80 leading-loose italic tracking-wide">{quote}</p>
        <div className="mt-8 flex items-center justify-center gap-4">
          <div className="h-[1px] w-12 bg-[#c9a961]/40" />
          <p className="text-[#c9a961]/60 text-xs tracking-[0.4em] uppercase">{source}</p>
          <div className="h-[1px] w-12 bg-[#c9a961]/40" />
        </div>
      </div>
    </div>
  );
}


const SECTION_META = {
  HISTORY: { label: 'HISTORY', ko: '브랜드 연혁', description: '1847년부터 이어온 신들의 향기', roman: 'I' },
  PROCESS: { label: 'PROCESS', ko: '향수 제조 과정', description: '장인의 손끝에서 탄생하는 연금술', roman: 'II' },
  PHILOSOPHY: { label: 'PHILOSOPHY', ko: '브랜드 철학', description: 'AION이 추구하는 영원한 가치', roman: 'III' },
};

export default function Story() {
  const [storyData, setStoryData] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('HISTORY');
  const sectionRefs = useRef({});
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    fetchStories();
  }, []);


  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(el => {
          if (el.isIntersecting) el.target.classList.add('visible');
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll('.section-reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, [loading]);


  useEffect(() => {
    const handleScroll = () => {
      for (const key of ['HISTORY', 'PROCESS', 'PHILOSOPHY']) {
        const el = sectionRefs.current[key];
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 200 && rect.bottom >= 200) setActiveSection(key);
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const fetchStories = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stories/public`);
      if (!res.ok) throw new Error();
      const json = await res.json();
      const data = json.data || {};

      const merged = {};
      ['HISTORY', 'PROCESS', 'PHILOSOPHY'].forEach(k => {
        merged[k] = data[k]?.length > 0 ? data[k] : MOCK_DATA[k];
      });
      setStoryData(merged);
    } catch {
      setStoryData(MOCK_DATA);
    } finally {
      setLoading(false);
    }
  };

  const scrollToSection = (key) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0e0c09] flex items-center justify-center" style={{ marginTop: '-2px' }}>
        <div className="text-center">
          <div className="font-serif text-6xl text-[#c9a961]/30 mb-8 animate-shimmer">ΑΙΩΝ</div>
          <div className="w-1 h-16 bg-gradient-to-b from-[#c9a961] to-transparent mx-auto animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3] font-sans" style={{ marginTop: '-2px' }}>
      
      <HeroSection />

      
      <div className="sticky top-0 z-40 bg-[#0e0c09]/98 backdrop-blur-sm border-b border-[#c9a961]/15">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-center justify-center gap-0 overflow-x-auto">
            {NAV_SECTIONS.map(s => (
              <button
                key={s.key}
                onClick={() => scrollToSection(s.key)}
                className={`relative px-8 py-5 text-[10px] tracking-[0.4em] uppercase transition-all duration-300 flex flex-col items-center gap-1 whitespace-nowrap ${
                  activeSection === s.key ? 'text-[#c9a961]' : 'text-[#c9a961]/40 hover:text-[#c9a961]/70'
                }`}
              >
                <span className="font-serif text-base opacity-50">{s.symbol}</span>
                <span>{s.label}</span>
                {activeSection === s.key && (
                  <div className="absolute bottom-0 left-4 right-4 h-[1px] bg-[#c9a961]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      
      <div ref={el => (sectionRefs.current['HISTORY'] = el)} className="pt-28 pb-0 bg-[#faf8f3]">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            sectionKey="HISTORY"
            label="HISTORY"
            ko="브랜드 연혁"
            description="1847년부터 이어온 신들의 향기"
            romanNum="Ι"
          />
          
          <div className="relative">
            <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-[#c9a961]/30 to-transparent" />
            {(storyData.HISTORY || []).map((item, idx) => (
              <div key={item.storyId} className="section-reveal" style={{ transitionDelay: `${idx * 0.1}s` }}>
                <HistoryItem item={item} idx={idx} />
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <QuoteBanner
        quote="향기는 가장 강렬한 형태의 기억이다. 그것은 수천 년을 거슬러 올라가 신들의 세계에 닿는다."
        source="EDMOND DUVAL — AION 창립자, 1847"
      />

      
      <div ref={el => (sectionRefs.current['PROCESS'] = el)} className="py-28 bg-[#f5f0e8]">
        <div className="max-w-7xl mx-auto px-6">
          <SectionHeader
            sectionKey="PROCESS"
            label="PROCESS"
            ko="향수 제조 과정"
            description="장인의 손끝에서 탄생하는 연금술"
            romanNum="ΙΙ"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(storyData.PROCESS || []).map((item, idx) => (
              <div key={item.storyId} className="section-reveal" style={{ transitionDelay: `${idx * 0.1}s` }}>
                <ProcessCard item={item} idx={idx} />
              </div>
            ))}
          </div>
        </div>
      </div>

      
      <QuoteBanner
        quote="헤파이스토스가 신들의 무기를 빚었듯, 우리는 영혼의 무기인 향수를 빚는다. 완벽함에는 지름길이 없다."
        source="AION MAISON — 제조 철학"
      />

      
      <div ref={el => (sectionRefs.current['PHILOSOPHY'] = el)} className="py-28 bg-[#faf8f3]">
        <div className="max-w-6xl mx-auto px-6">
          <SectionHeader
            sectionKey="PHILOSOPHY"
            label="PHILOSOPHY"
            ko="브랜드 철학"
            description="AION이 추구하는 영원한 가치"
            romanNum="ΙΙΙ"
          />
        </div>
        <div className="space-y-0">
          {(storyData.PHILOSOPHY || []).map((item, idx) => (
            <div key={item.storyId} className="section-reveal">
              <PhilosophyCard item={item} idx={idx} />
            </div>
          ))}
        </div>
      </div>

      
      <div className="relative bg-[#0e0c09] py-32 overflow-hidden">
        <div className="absolute inset-0 greek-pattern opacity-10" />
        <div className="absolute inset-0"
          style={{ background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(201,169,97,0.06) 0%, transparent 70%)' }} />

        <div className="relative max-w-2xl mx-auto px-6 text-center">
          <GreekBorder className="mb-12 opacity-40" />
          <div className="font-serif text-[#c9a961]/20 text-[100px] leading-none mb-6">Ω</div>
          <p className="text-[10px] tracking-[0.8em] text-[#c9a961]/50 uppercase mb-6">AION — 신들의 시간</p>
          <h2 className="font-serif text-4xl text-white/80 tracking-[0.3em] mb-8">
            당신의 이야기를<br />향으로 새기다
          </h2>
          <p className="text-[#c9a961]/40 text-sm italic tracking-wider mb-12">
            Αἰὼν παῖς ἐστι παίζων — 영원은 놀이하는 아이
          </p>
          <GreekBorder className="opacity-20" />
        </div>
      </div>

      
      {isAdmin && (
        <button
          onClick={() => window.location.href = '/admin/story'}
          className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-[#0e0c09]/90 text-[#c9a961] border border-[#c9a961] hover:bg-[#c9a961] hover:text-[#0e0c09] transition-all text-xs tracking-[0.3em] uppercase"
        >
          STORY 편집
        </button>
      )}
    </div>
  );
}