import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Download, Loader2 } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

// ── Gemini API 호출 (백엔드 프록시) ──────────────────────────────────────────
async function fetchGeminiCardData(blend) {
  const res = await fetch(`${API_BASE}/api/ai/gemini-scent-card`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ blend }),
  });
  if (!res.ok) throw new Error(`Gemini 호출 실패: ${res.status}`);
  const json = await res.json();
  return json.data;
}

// ── 꽃잎 SVG 경로 생성 ───────────────────────────────────────────────────────
// 중심(cx,cy)에서 뻗어나가는 물방울형 꽃잎, angle 방향으로 회전
function petalPath(cx, cy, length, width, angle) {
  // 꽃잎: 베지어 곡선으로 만든 눈물방울 형태
  const rad = (angle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);

  // 꽃잎 로컬 좌표 (위쪽으로 뻗음)
  const tip = { x: 0, y: -length };
  const cl  = { x: -width / 2, y: -length * 0.45 };
  const cr  = { x:  width / 2, y: -length * 0.45 };

  // 회전 변환
  const rotate = ({ x, y }) => ({
    x: cx + x * cos - y * sin,
    y: cy + x * sin + y * cos,
  });

  const t  = rotate(tip);
  const l  = rotate(cl);
  const r  = rotate(cr);
  const o  = { x: cx, y: cy };

  return `M ${o.x} ${o.y} C ${l.x} ${l.y} ${t.x} ${t.y} ${t.x} ${t.y} C ${t.x} ${t.y} ${r.x} ${r.y} ${o.x} ${o.y} Z`;
}

// ── 헥스 → RGB ────────────────────────────────────────────────────────────────
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

// ── 색상 배열 혼합 (가중 평균) ────────────────────────────────────────────────
function blendColors(colors, weights) {
  const total = weights.reduce((s, w) => s + w, 0);
  let r = 0, g = 0, b = 0;
  colors.forEach((hex, i) => {
    const { r: cr, g: cg, b: cb } = hexToRgb(hex);
    const w = weights[i] / total;
    r += cr * w; g += cg * w; b += cb * w;
  });
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// ── 카드 SVG 꽃잎 그래픽 컴포넌트 ────────────────────────────────────────────
function PetalGraphic({ ingredients, symbolColor, size = 340 }) {
  const cx = size / 2;
  const cy = size / 2;
  const n  = ingredients.length;

  if (n === 0) return null;

  // 꽃잎 크기: 재료 수에 따라 조절
  const petalLength = size * (n <= 3 ? 0.38 : n <= 6 ? 0.35 : n <= 9 ? 0.32 : 0.28);
  const petalWidth  = petalLength * (n <= 4 ? 0.52 : 0.44);

  // 중앙 원: 상징색
  const centerR = size * 0.13;

  // 재료 비율 합산
  const totalRatio = ingredients.reduce((s, i) => s + (i.ratio || 1), 0);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        {/* 방사형 그라디언트: 중앙 상징색 */}
        <radialGradient id="centerGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor={symbolColor} stopOpacity="1" />
          <stop offset="60%"  stopColor={symbolColor} stopOpacity="0.7" />
          <stop offset="100%" stopColor={symbolColor} stopOpacity="0" />
        </radialGradient>
        {/* 미세 노이즈 느낌의 필터 */}
        <filter id="softBlur">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
        {/* 꽃잎 개별 그라디언트 */}
        {ingredients.map((ing, i) => (
          <radialGradient
            key={`grad-${i}`}
            id={`petalGrad-${i}`}
            cx="50%" cy="80%" r="70%"
            gradientUnits="objectBoundingBox"
          >
            <stop offset="0%"   stopColor={ing.color} stopOpacity="0.9" />
            <stop offset="100%" stopColor={ing.color} stopOpacity="0.25" />
          </radialGradient>
        ))}
      </defs>

      {/* 배경: 살짝 빛나는 원형 오라 */}
      <circle
        cx={cx} cy={cy}
        r={petalLength + petalWidth * 0.8}
        fill="none"
        stroke={symbolColor}
        strokeOpacity="0.08"
        strokeWidth={petalWidth * 0.6}
      />

      {/* 꽃잎 레이어 */}
      {ingredients.map((ing, i) => {
        const angle = (360 / n) * i - 90; // 12시 방향부터 시계방향
        const opacity = 0.35 + (ing.ratio / totalRatio) * 0.5; // 비율 → 투명도
        return (
          <path
            key={`petal-${i}`}
            d={petalPath(cx, cy, petalLength, petalWidth, angle)}
            fill={`url(#petalGrad-${i})`}
            opacity={opacity}
            style={{ filter: 'url(#softBlur)' }}
          />
        );
      })}

      {/* 중앙 겹침 영역: 상징색 오라 */}
      <circle
        cx={cx} cy={cy}
        r={centerR * 2.2}
        fill="url(#centerGrad)"
        opacity="0.45"
      />

      {/* 중앙 원: 상징색 solid */}
      <circle
        cx={cx} cy={cy}
        r={centerR}
        fill={symbolColor}
        opacity="0.82"
      />

      {/* 중앙 작은 장식 */}
      <circle
        cx={cx} cy={cy}
        r={centerR * 0.42}
        fill="rgba(255,255,255,0.55)"
      />

      {/* 꽃잎 테두리 선 (섬세한) */}
      {ingredients.map((ing, i) => {
        const angle = (360 / n) * i - 90;
        return (
          <path
            key={`petal-border-${i}`}
            d={petalPath(cx, cy, petalLength, petalWidth, angle)}
            fill="none"
            stroke={ing.color}
            strokeWidth="0.6"
            strokeOpacity="0.3"
          />
        );
      })}
    </svg>
  );
}

// ── 노트 배지 ─────────────────────────────────────────────────────────────────
function NoteBadge({ label, items, symbolColor }) {
  if (!items || items.length === 0) return null;
  return (
    <div style={{ textAlign: 'center', flex: 1 }}>
      <div style={{
        fontSize: '8px',
        letterSpacing: '0.35em',
        color: symbolColor,
        marginBottom: '6px',
        opacity: 0.8,
        fontFamily: "'Cormorant Garamond', serif",
        textTransform: 'uppercase',
      }}>
        {label}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'center' }}>
        {items.map((name, i) => (
          <div key={i} style={{
            fontSize: '10px',
            color: '#1a1a1a',
            letterSpacing: '0.08em',
            fontFamily: "'Nanum Myeongjo', serif",
            opacity: 0.75,
            lineHeight: 1.4,
          }}>
            {name}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── 메인 카드 컴포넌트 ────────────────────────────────────────────────────────
function PerfumeCard({ blend, cardData, cardRef }) {
  const { tagline, ingredientColors, symbolColor, topNotes, middleNotes, baseNotes } = cardData;

  // 재료 + 색상 매핑
  const ingredients = (blend.items || []).map((item, i) => ({
    name:  item.ingredientName || `재료${i + 1}`,
    color: ingredientColors[i] || ingredientColors[item.ingredientId] || '#c9a961',
    ratio: item.ratio || 1,
  }));

  const cardW = 360;
  const cardH = 620;

  // 배경 그라디언트: 상징색 기반 매우 연하게
  const { r, g, b } = hexToRgb(symbolColor.startsWith('#') ? symbolColor : '#c9a961');
  const bgLight = `rgba(${r},${g},${b},0.06)`;
  const bgMid   = `rgba(${r},${g},${b},0.03)`;

  return (
    <div
      ref={cardRef}
      style={{
        width:        `${cardW}px`,
        height:       `${cardH}px`,
        borderRadius: '22px',
        background:   `linear-gradient(160deg, ${bgLight} 0%, #faf8f4 40%, ${bgMid} 100%)`,
        boxShadow:    `0 8px 48px rgba(${r},${g},${b},0.18), 0 2px 12px rgba(0,0,0,0.08)`,
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        overflow:     'hidden',
        position:     'relative',
        fontFamily:   "'Nanum Myeongjo', serif",
        userSelect:   'none',
      }}
    >
      {/* 상단 장식선 */}
      <div style={{
        width: '100%',
        height: '3px',
        background: `linear-gradient(90deg, transparent, ${symbolColor}, transparent)`,
        opacity: 0.5,
      }} />

      {/* 브랜드명 */}
      <div style={{
        marginTop: '18px',
        fontSize: '9px',
        letterSpacing: '0.55em',
        color: symbolColor,
        opacity: 0.7,
        fontFamily: "'Cormorant Garamond', serif",
        textTransform: 'uppercase',
      }}>
        My Signature Scent
      </div>

      {/* 향수 이름 */}
      <div style={{
        marginTop: '6px',
        fontSize: '14px',
        letterSpacing: '0.2em',
        color: '#1a1a1a',
        fontFamily: "'Nanum Myeongjo', serif",
        fontWeight: 700,
        opacity: 0.6,
        maxWidth: '80%',
        textAlign: 'center',
        lineHeight: 1.4,
      }}>
        {blend.name}
      </div>

      {/* ── 꽃잎 그래픽 (상단 55%) ── */}
      <div style={{
        marginTop: '10px',
        width: '340px',
        height: '340px',
        flexShrink: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}>
        <PetalGraphic
          ingredients={ingredients}
          symbolColor={symbolColor}
          size={340}
        />
        {/* 농도/용량 오버레이 */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          right: '16px',
          fontSize: '9px',
          letterSpacing: '0.25em',
          color: symbolColor,
          opacity: 0.55,
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          {blend.concentration} · {blend.volumeMl}ml
        </div>
      </div>

      {/* ── 한줄 소개 (55~78%) ── */}
      <div style={{
        width: '78%',
        marginTop: '8px',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* 장식 선 */}
        <div style={{
          width: '32px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${symbolColor})`,
          margin: '0 auto 10px',
          opacity: 0.6,
        }} />
        <div style={{
          fontSize: '18px',
          fontWeight: 700,
          fontFamily: "'Nanum Myeongjo', serif",
          color: symbolColor,
          lineHeight: 1.55,
          letterSpacing: '0.03em',
          wordBreak: 'keep-all',
          textShadow: `0 1px 8px rgba(${r},${g},${b},0.2)`,
        }}>
          {tagline}
        </div>
        <div style={{
          width: '32px',
          height: '1px',
          background: `linear-gradient(90deg, ${symbolColor}, transparent)`,
          margin: '10px auto 0',
          opacity: 0.6,
        }} />
      </div>

      {/* ── 탑 / 미들 / 베이스 노트 (78~95%) ── */}
      <div style={{
        width: '82%',
        marginTop: '18px',
        display: 'flex',
        flexDirection: 'row',
        gap: '0',
        alignItems: 'flex-start',
        position: 'relative',
      }}>
        {/* 세로 구분선 */}
        <div style={{
          position: 'absolute',
          top: '12px', bottom: '0',
          left: '33.33%',
          width: '1px',
          background: `linear-gradient(180deg, transparent, ${symbolColor}40, transparent)`,
        }} />
        <div style={{
          position: 'absolute',
          top: '12px', bottom: '0',
          left: '66.66%',
          width: '1px',
          background: `linear-gradient(180deg, transparent, ${symbolColor}40, transparent)`,
        }} />
        <NoteBadge label="Top"    items={topNotes}    symbolColor={symbolColor} />
        <NoteBadge label="Middle" items={middleNotes} symbolColor={symbolColor} />
        <NoteBadge label="Base"   items={baseNotes}   symbolColor={symbolColor} />
      </div>

      {/* 하단 장식 */}
      <div style={{
        marginTop: 'auto',
        marginBottom: '16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '5px',
      }}>
        {/* 재료 색 점들 */}
        <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
          {ingredients.map((ing, i) => (
            <div key={i} style={{
              width:         '6px',
              height:        '6px',
              borderRadius:  '50%',
              background:    ing.color,
              opacity:       0.55 + (ing.ratio / ingredients.reduce((s, x) => s + x.ratio, 0)) * 0.4,
            }} />
          ))}
        </div>
        <div style={{
          fontSize: '8px',
          letterSpacing: '0.4em',
          color: '#8b8278',
          opacity: 0.5,
          fontFamily: "'Cormorant Garamond', serif",
        }}>
          AION PARFUMS
        </div>
      </div>

      {/* 하단 장식선 */}
      <div style={{
        width: '100%',
        height: '2px',
        background: `linear-gradient(90deg, transparent, ${symbolColor}50, transparent)`,
      }} />
    </div>
  );
}

// ── 모달 래퍼 ─────────────────────────────────────────────────────────────────
export default function ScentPerfumeCard({ blend, onClose }) {
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [cardData, setCardData] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  // Gemini 데이터 로드
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchGeminiCardData(blend);
        if (!cancelled) {
          setCardData(data);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || '향 카드 생성 실패');
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [blend]);

  // PNG 다운로드 (html2canvas)
  const handleDownload = useCallback(async () => {
    if (!cardRef.current || downloading) return;
    setDownloading(true);
    try {
      // html2canvas 동적 로드
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(cardRef.current, {
        scale:           3,
        backgroundColor: null,
        useCORS:         true,
        allowTaint:      true,
        logging:         false,
      });
      const link = document.createElement('a');
      link.download = `${blend.name || 'my-scent'}-card.png`;
      link.href     = canvas.toDataURL('image/png');
      link.click();
    } catch (e) {
      console.error('다운로드 실패:', e);
      alert('다운로드에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setDownloading(false);
    }
  }, [blend.name, downloading]);

  // ESC 키 닫기
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // 구글 폰트 로드 (Nanum Myeongjo, Cormorant Garamond)
  useEffect(() => {
    if (document.getElementById('scent-card-fonts')) return;
    const link = document.createElement('link');
    link.id   = 'scent-card-fonts';
    link.rel  = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap';
    document.head.appendChild(link);
  }, []);

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          9999,
        background:      'rgba(10, 8, 6, 0.78)',
        backdropFilter:  'blur(8px)',
        display:         'flex',
        flexDirection:   'column',
        alignItems:      'center',
        justifyContent:  'center',
        gap:             '20px',
        padding:         '24px',
      }}
    >
      {/* 닫기 버튼 */}
      <button
        onClick={onClose}
        style={{
          position:   'absolute',
          top:        '20px',
          right:      '20px',
          background: 'none',
          border:     'none',
          color:      'rgba(255,255,255,0.5)',
          cursor:     'pointer',
          padding:    '8px',
          display:    'flex',
          alignItems: 'center',
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
        onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
      >
        <X size={22} />
      </button>

      {/* 로딩 */}
      {loading && (
        <div style={{
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
          gap:            '16px',
          color:          '#c9a961',
        }}>
          <Loader2 size={36} style={{ animation: 'spin 1s linear infinite' }} />
          <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          <div style={{ fontSize: '12px', letterSpacing: '0.4em', opacity: 0.7 }}>
            향 카드 생성 중...
          </div>
          <div style={{ fontSize: '10px', letterSpacing: '0.2em', opacity: 0.4, color: '#fff' }}>
            Gemini AI가 당신의 향을 분석합니다
          </div>
        </div>
      )}

      {/* 에러 */}
      {error && !loading && (
        <div style={{
          color:       '#ff6b6b',
          fontSize:    '13px',
          letterSpacing: '0.1em',
          textAlign:   'center',
          maxWidth:    '300px',
          lineHeight:  1.6,
        }}>
          <div style={{ marginBottom: '8px', fontSize: '24px' }}>✦</div>
          {error}
          <br />
          <button
            onClick={onClose}
            style={{
              marginTop:      '16px',
              background:     'none',
              border:         '1px solid rgba(201,169,97,0.4)',
              color:          '#c9a961',
              padding:        '8px 20px',
              cursor:         'pointer',
              fontSize:       '11px',
              letterSpacing:  '0.3em',
            }}
          >
            닫기
          </button>
        </div>
      )}

      {/* 카드 */}
      {cardData && !loading && (
        <>
          <div style={{
            animation: 'cardReveal 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards',
          }}>
            <style>{`
              @keyframes cardReveal {
                from { opacity: 0; transform: translateY(24px) scale(0.96); }
                to   { opacity: 1; transform: translateY(0)   scale(1);    }
              }
            `}</style>
            <PerfumeCard blend={blend} cardData={cardData} cardRef={cardRef} />
          </div>

          {/* 다운로드 버튼 */}
          <button
            onClick={handleDownload}
            disabled={downloading}
            title="PNG로 저장"
            style={{
              background:     'none',
              border:         'none',
              cursor:         downloading ? 'not-allowed' : 'pointer',
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              gap:            '6px',
              color:          downloading ? 'rgba(201,169,97,0.35)' : 'rgba(201,169,97,0.7)',
              transition:     'color 0.2s',
              padding:        '8px 16px',
            }}
            onMouseEnter={e => { if (!downloading) e.currentTarget.style.color = '#c9a961'; }}
            onMouseLeave={e => { if (!downloading) e.currentTarget.style.color = 'rgba(201,169,97,0.7)'; }}
          >
            {downloading
              ? <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
              : <Download size={20} />
            }
            <span style={{ fontSize: '9px', letterSpacing: '0.35em' }}>
              {downloading ? 'SAVING...' : 'SAVE IMAGE'}
            </span>
          </button>
        </>
      )}
    </div>
  );
}