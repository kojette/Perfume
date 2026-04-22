import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Pen, Save, RotateCcw, Eraser, Plus } from 'lucide-react';
import { supabase } from '../../supabaseClient';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const DEFAULT_BOTTLES = [
  { id: 'classic-round',  name: '클래식 라운드',  shape: 'round',     basePrice: 15000 },
  { id: 'tall-cylinder',  name: '슬림 실린더',    shape: 'cylinder',  basePrice: 18000 },
  { id: 'square-bold',    name: '스퀘어 볼드',    shape: 'square',    basePrice: 16000 },
  { id: 'vintage-flat',   name: '빈티지 플랫',    shape: 'flat',      basePrice: 20000 },
  { id: 'teardrop',       name: '티어드롭',       shape: 'teardrop',  basePrice: 22000 },
  { id: 'hexagon',        name: '헥사곤',         shape: 'hexagon',   basePrice: 25000 },
  { id: 'art-deco',       name: '아르데코',       shape: 'artdeco',   basePrice: 28000 },
  { id: 'modern-arch',    name: '모던 아치',      shape: 'arch',      basePrice: 19000 },
  { id: 'dome',           name: '돔형',           shape: 'dome',      basePrice: 17000 },
  { id: 'rectangular',    name: '레트앵귤러',     shape: 'rectangle', basePrice: 14000 },
];

const PRICE_CONFIG = {
  printing:    5000,
  stickerPack: 3000,
  engraving:   8000,
};

/* ── 스티커는 Supabase "Stickers" 테이블에서 로드 ── */

/* 병 body 클리핑/윤곽선 전용 path — 몸통 부분만 (목·캡 제외) */
const BOTTLE_BODY_PATHS = {
  round:     { type: 'ellipse', cx: 100, cy: 185, rx: 68, ry: 105 },
  cylinder:  { type: 'rect',   x: 50,  y: 66,  w: 100, h: 190, rx: 20 },
  square:    { type: 'rect',   x: 40,  y: 60,  w: 120, h: 190, rx: 8  },
  flat:      { type: 'rect',   x: 30,  y: 62,  w: 140, h: 170, rx: 6  },
  teardrop:  { type: 'path',   d: 'M100,62 C170,80 180,180 100,260 C20,180 30,80 100,62 Z' },
  hexagon:   { type: 'polygon', points: '100,62 162,95 162,195 100,228 38,195 38,95' },
  artdeco:   { type: 'polygon', points: '70,58 130,58 155,110 155,250 45,250 45,110' },
  arch:      { type: 'path',   d: 'M42,260 L42,130 Q42,58 100,58 Q158,58 158,130 L158,260 Z' },
  dome:      { type: 'path',   d: 'M35,260 L35,175 Q35,60 100,60 Q165,60 165,175 L165,260 Z' },
  rectangle: { type: 'rect',   x: 45,  y: 58,  w: 110, h: 200, rx: 4  },
};

/* SVG clipPath 문자열 반환 (200×280 좌표계) */
const getBottleBodyClipSVG = (shape) => {
  const b = BOTTLE_BODY_PATHS[shape] || BOTTLE_BODY_PATHS.round;
  const id = `clip-${shape}`;
  let pathEl = '';
  if (b.type === 'ellipse') pathEl = `<ellipse cx="${b.cx}" cy="${b.cy}" rx="${b.rx}" ry="${b.ry}"/>`;
  else if (b.type === 'rect') pathEl = `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="${b.rx || 0}"/>`;
  else if (b.type === 'path') pathEl = `<path d="${b.d}"/>`;
  else if (b.type === 'polygon') pathEl = `<polygon points="${b.points}"/>`;
  return { id, pathEl };
};

/* React SVG 윤곽선 오버레이 컴포넌트 */
const BottleOutlineSVG = ({ shape, width = 200, height = 280 }) => {
  const b = BOTTLE_BODY_PATHS[shape] || BOTTLE_BODY_PATHS.round;
  const scaleX = width / 200;
  const scaleY = height / 280;
  const sw = '#c9a961';
  const strokeProps = { fill: 'none', stroke: sw, strokeWidth: 2, strokeDasharray: '6 3', opacity: 0.85 };

  const renderShape = () => {
    if (b.type === 'ellipse') return <ellipse cx={b.cx * scaleX} cy={b.cy * scaleY} rx={b.rx * scaleX} ry={b.ry * scaleY} {...strokeProps} />;
    if (b.type === 'rect')    return <rect x={b.x * scaleX} y={b.y * scaleY} width={b.w * scaleX} height={b.h * scaleY} rx={(b.rx || 0) * scaleX} {...strokeProps} />;
    if (b.type === 'path')    return <path d={b.d} transform={`scale(${scaleX},${scaleY})`} {...strokeProps} />;
    if (b.type === 'polygon') return (
      <polygon
        points={b.points.split(' ').map(p => { const [x, y] = p.split(','); return `${x * scaleX},${y * scaleY}`; }).join(' ')}
        {...strokeProps}
      />
    );
  };

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 25 }}>
      {renderShape()}
    </svg>
  );
};

const BottleSVG = React.forwardRef(function BottleSVG(
  { shape, fillColor = '#e8dcc8', strokeColor = '#c9a961', width = 200, height = 280 },
  ref
) {
  const cx = width / 2;
  const sw = strokeColor;

  const shapes = {
    round: (
      <g>
        <rect x={cx - 18} y={30} width={36} height={40} rx={8} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 22} y={18} width={44} height={20} rx={5} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <ellipse cx={cx} cy={185} rx={68} ry={105} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <ellipse cx={cx - 22} cy={140} rx={12} ry={28} fill="white" opacity={0.2} />
      </g>
    ),
    cylinder: (
      <g>
        <rect x={cx - 12} y={28} width={24} height={38} rx={5} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 16} y={16} width={32} height={18} rx={4} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 50} y={66} width={100} height={190} rx={20} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 35} y={80} width={18} height={160} rx={8} fill="white" opacity={0.15} />
      </g>
    ),
    square: (
      <g>
        <rect x={cx - 14} y={24} width={28} height={36} rx={4} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 20} y={14} width={40} height={16} rx={3} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 60} y={60} width={120} height={190} rx={8} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 48} y={74} width={20} height={160} fill="white" opacity={0.12} />
      </g>
    ),
    flat: (
      <g>
        <rect x={cx - 10} y={30} width={20} height={32} rx={4} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 18} y={20} width={36} height={16} rx={3} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 70} y={62} width={140} height={170} rx={6} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 58} y={75} width={14} height={144} fill="white" opacity={0.15} />
      </g>
    ),
    teardrop: (
      <g>
        <rect x={cx - 12} y={26} width={24} height={36} rx={6} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 18} y={14} width={36} height={18} rx={5} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <path d={`M${cx},62 C${cx + 70},80 ${cx + 80},180 ${cx},260 C${cx - 80},180 ${cx - 70},80 ${cx},62 Z`}
          fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <ellipse cx={cx - 20} cy={150} rx={10} ry={35} fill="white" opacity={0.18} />
      </g>
    ),
    hexagon: (
      <g>
        <rect x={cx - 12} y={26} width={24} height={34} rx={5} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 18} y={14} width={36} height={18} rx={4} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <polygon
          points={`${cx},62 ${cx + 62},95 ${cx + 62},195 ${cx},228 ${cx - 62},195 ${cx - 62},95`}
          fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <polygon points={`${cx - 45},100 ${cx - 30},100 ${cx - 30},190 ${cx - 45},190`} fill="white" opacity={0.12} />
      </g>
    ),
    artdeco: (
      <g>
        <rect x={cx - 10} y={22} width={20} height={36} rx={3} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 22} y={12} width={44} height={16} rx={2} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <polygon points={`${cx - 30},58 ${cx + 30},58 ${cx + 55},110 ${cx + 55},250 ${cx - 55},250 ${cx - 55},110`}
          fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <polygon points={`${cx - 40},115 ${cx - 24},115 ${cx - 24},240 ${cx - 40},240`} fill="white" opacity={0.13} />
      </g>
    ),
    arch: (
      <g>
        <rect x={cx - 11} y={26} width={22} height={32} rx={5} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 18} y={16} width={36} height={16} rx={4} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <path d={`M${cx - 58},260 L${cx - 58},130 Q${cx - 58},58 ${cx},58 Q${cx + 58},58 ${cx + 58},130 L${cx + 58},260 Z`}
          fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 44} y={80} width={14} height={170} rx={5} fill="white" opacity={0.15} />
      </g>
    ),
    dome: (
      <g>
        <rect x={cx - 13} y={28} width={26} height={32} rx={5} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 19} y={18} width={38} height={16} rx={4} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <path d={`M${cx - 65},260 L${cx - 65},175 Q${cx - 65},60 ${cx},60 Q${cx + 65},60 ${cx + 65},175 L${cx + 65},260 Z`}
          fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <ellipse cx={cx - 25} cy={160} rx={11} ry={42} fill="white" opacity={0.17} />
      </g>
    ),
    rectangle: (
      <g>
        <rect x={cx - 11} y={26} width={22} height={32} rx={3} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 20} y={16} width={40} height={16} rx={2} fill="#a08040" stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 55} y={58} width={110} height={200} rx={4} fill={fillColor} stroke={sw} strokeWidth={1.5} />
        <rect x={cx - 44} y={68} width={16} height={180} fill="white" opacity={0.12} />
      </g>
    ),
  };

  return (
    <svg ref={ref} className="bottle-preview-svg" width={width} height={height} viewBox={`0 0 ${width} ${height}`} xmlns="http://www.w3.org/2000/svg">
      {shapes[shape] || shapes['round']}
    </svg>
  );
});

/* ─────────────────────────────────────────
   병 미리보기 패널 (데스크탑 좌측 / 모바일 상단)
───────────────────────────────────────── */
const BottlePreviewPanel = ({
  selectedBottle, bottleColor, setBottleColor,
  activeTab, drawMode,
  canvasRef, bottleSvgRef,
  startDraw, draw, endDraw,
  objects, selectedObjId, onObjMouseDown,
  deleteObject, resizeObject,
  engravingEnabled, engravingText,
  prices,
  isMobile,
}) => {
  /* 모바일/데스크탑 모두 동일 크기 — 잘림 없도록 */
  const W = 200;
  const H = 280;

  return (
    <div className={`
      bg-[#f0ece4] flex flex-col items-center border-[#c9a961]/20 select-none
      ${isMobile
        ? 'w-full border-b py-6 px-4 gap-3'
        : 'w-72 min-w-[280px] border-r justify-center py-8'
      }
    `}>
      {/* 병 캔버스 영역 */}
      <div className="relative flex-shrink-0" style={{ width: W, height: H }}>
        <div className="absolute inset-0 pointer-events-none">
          <BottleSVG ref={bottleSvgRef} shape={selectedBottle.shape} fillColor={bottleColor} width={W} height={H} />
        </div>

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="absolute inset-0"
          style={{
            cursor: activeTab === 'draw' ? (drawMode === 'eraser' ? 'cell' : 'crosshair') : 'default',
            zIndex: activeTab === 'draw' ? 10 : 2,
            touchAction: 'none',
          }}
          onMouseDown={activeTab === 'draw' ? startDraw : undefined}
          onMouseMove={activeTab === 'draw' ? draw : undefined}
          onMouseUp={activeTab === 'draw' ? endDraw : undefined}
          onMouseLeave={activeTab === 'draw' ? endDraw : undefined}
          onTouchStart={activeTab === 'draw' ? startDraw : undefined}
          onTouchMove={activeTab === 'draw' ? draw : undefined}
          onTouchEnd={activeTab === 'draw' ? endDraw : undefined}
        />

        {/* 객체(이미지·스티커) — 병 윤곽 안으로만 클리핑, 미리보기 전용(인터랙션 없음) */}
        {objects.length > 0 && (() => {
          const b = BOTTLE_BODY_PATHS[selectedBottle.shape] || BOTTLE_BODY_PATHS.round;
          const clipId = `preview-clip-${selectedBottle.shape}`;
          let clipShape = null;
          if (b.type === 'ellipse')  clipShape = <ellipse cx={b.cx} cy={b.cy} rx={b.rx} ry={b.ry}/>;
          else if (b.type === 'rect') clipShape = <rect x={b.x} y={b.y} width={b.w} height={b.h} rx={b.rx||0}/>;
          else if (b.type === 'path') clipShape = <path d={b.d}/>;
          else if (b.type === 'polygon') clipShape = <polygon points={b.points}/>;

          return (
            <>
              <svg width={0} height={0} style={{ position: 'absolute' }}>
                <defs>
                  <clipPath id={clipId}>{clipShape}</clipPath>
                </defs>
              </svg>
              <div style={{
                position: 'absolute', inset: 0, zIndex: 20,
                clipPath: `url(#${clipId})`,
                pointerEvents: 'none',
              }}>
                {objects.map(obj => {
                  const scaleX = W / 200;
                  const scaleY = H / 280;
                  return (
                    <div key={obj.id} style={{
                      position: 'absolute',
                      left: obj.x * scaleX, top: obj.y * scaleY,
                      width: obj.w * scaleX, height: obj.h * scaleY,
                    }}>
                      {obj.type === 'image'
                        ? <img src={obj.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }} draggable={false} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.min(obj.w, obj.h) * 0.75 * Math.min(scaleX, scaleY), lineHeight: 1 }}>
                            {obj.text}
                          </div>
                      }
                    </div>
                  );
                })}
              </div>
            </>
          );
        })()}

        {engravingEnabled && engravingText && (
          <div style={{
            position: 'absolute', bottom: isMobile ? 28 : 40, left: 0, right: 0,
            textAlign: 'center', fontSize: isMobile ? 8 : 11, color: '#a08040',
            fontFamily: 'Georgia, serif', fontStyle: 'italic',
            letterSpacing: 2, pointerEvents: 'none', zIndex: 5,
            textShadow: '0 0 4px rgba(255,255,255,0.5)',
          }}>
            {engravingText}
          </div>
        )}

        {/* 이미지·스티커 탭: 윤곽선 */}
        {(activeTab === 'upload' || activeTab === 'sticker') && (
          <BottleOutlineSVG shape={selectedBottle.shape} width={W} height={H} />
        )}
      </div>

      {/* 병 정보 + 색상 선택 */}
      <div className="flex flex-col items-center mt-1 gap-1">
        <div className="text-xs tracking-widest text-[#8b8278] italic text-center">
          {selectedBottle.name}
        </div>
        <div className="text-[#c9a961] text-xs">₩{selectedBottle.basePrice.toLocaleString()}</div>
        <div className="mt-2 flex items-center gap-2">
          <span className="text-[9px] tracking-widest text-[#8b8278]">병 색상</span>
          <input type="color" value={bottleColor} onChange={e => setBottleColor(e.target.value)}
            className="w-8 h-6 border border-[#c9a961]/30 cursor-pointer bg-transparent" />
        </div>
        {/* 모바일에서만: 예상 금액 인라인 표시 */}
        {isMobile && (
          <div className="mt-1 flex items-center gap-2">
            <span className="text-[9px] tracking-widest text-[#8b8278]">예상 금액</span>
            <span className="text-[#c9a961] text-xs font-bold">₩{prices.total.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   메인 에디터
───────────────────────────────────────── */
const CustomizationEditor = ({ onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState('bottle');

  const [selectedBottle, setSelectedBottle] = useState(DEFAULT_BOTTLES[0]);
  const [adminBottles, setAdminBottles] = useState([]);
  const [bottleColor, setBottleColor] = useState('#e8dcc8');

  const canvasRef = useRef(null);
  const bottleSvgRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('pen');
  const [penColor, setPenColor] = useState('#c9a961');
  const [penSize, setPenSize] = useState(4);
  const [lastPos, setLastPos] = useState(null);

  const [objects, setObjects] = useState([]);
  const [selectedObjId, setSelectedObjId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [engravingText, setEngravingText] = useState('');
  const [engravingEnabled, setEngravingEnabled] = useState(false);

  const [designName, setDesignName] = useState('');

  /* 반응형: 모바일 여부 */
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const token = sessionStorage.getItem('accessToken');

  useEffect(() => {
    const loadAdminBottles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/custom/bottles`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          setAdminBottles(
            (json.data || []).map(b => ({
              id: `admin-${b.bottleId}`,
              name: b.name,
              shape: b.shape,
              basePrice: b.basePrice,
            }))
          );
        }
      } catch (e) {
        console.error('공병 목록 로드 오류:', e);
      }
    };
    loadAdminBottles();
  }, []);

  useEffect(() => {
    if (!initialData) return;
    setDesignName(initialData.name || '');
    setBottleColor(initialData.bottleColor || '#e8dcc8');
    setEngravingText(initialData.engravingText || '');
    setEngravingEnabled(!!initialData.engravingText);

    const allBottles = [...DEFAULT_BOTTLES, ...adminBottles];
    const found = allBottles.find(b => b.id === initialData.bottleKey);
    if (found) setSelectedBottle(found);

    if (initialData.objectsJson) {
      try { setObjects(JSON.parse(initialData.objectsJson)); } catch {}
    }
  }, [initialData]);

  const getCanvasPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e) => {
    const pos = getCanvasPos(e);
    setIsDrawing(true);
    setLastPos(pos);
  };

  const draw = (e) => {
    if (!isDrawing || !lastPos) return;
    const pos = getCanvasPos(e);
    const ctx = canvasRef.current.getContext('2d', { willReadFrequently: true });
    ctx.globalCompositeOperation = drawMode === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    setLastPos(pos);
  };

  const endDraw = () => {
    setIsDrawing(false);
    setLastPos(null);
    updateHasDrawing();
  };

  const clearCanvas = () => {
    canvasRef.current.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, 200, 280);
    hasDrawingRef.current = false;
  };

  const handleImageUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setObjects(prev => [...prev, {
        id: Date.now(), type: 'image',
        src: e.target.result, x: 60, y: 80, w: 120, h: 120,
      }]);
      setActiveTab('bottle');
    };
    reader.readAsDataURL(file);
  };

  const addSticker = (emojiOrObj) => {
    /* 이모지 문자열이면 sticker 타입, {type:'image',src} 객체이면 image 타입 */
    if (typeof emojiOrObj === 'object' && emojiOrObj.type === 'image') {
      setObjects(prev => [...prev, {
        id: Date.now(), type: 'image',
        src: emojiOrObj.src, x: 70, y: 90, w: 80, h: 80,
      }]);
    } else {
      setObjects(prev => [...prev, {
        id: Date.now(), type: 'sticker',
        text: emojiOrObj, x: 80, y: 100, w: 60, h: 60,
      }]);
    }
  };

  const handleStickerFileUpload = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setObjects(prev => [...prev, {
        id: Date.now(), type: 'image',
        src: e.target.result, x: 60, y: 80, w: 80, h: 80,
      }]);
    };
    reader.readAsDataURL(file);
  };

  const onObjMouseDown = (e, objId) => {
    e.stopPropagation();
    setSelectedObjId(objId);
    const obj = objects.find(o => o.id === objId);
    setDragOffset({ x: e.clientX - obj.x, y: e.clientY - obj.y });
    setDragging(true);
  };

  const onMouseMove = useCallback((e) => {
    if (!dragging || !selectedObjId) return;
    setObjects(prev => prev.map(o =>
      o.id === selectedObjId
        ? { ...o, x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y }
        : o
    ));
  }, [dragging, selectedObjId, dragOffset]);

  const onMouseUp = useCallback(() => setDragging(false), []);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const resizeObject = (objId, delta) => {
    setObjects(prev => prev.map(o =>
      o.id === objId ? { ...o, w: Math.max(30, o.w + delta), h: Math.max(30, o.h + delta) } : o
    ));
  };

  const deleteObject = (objId) => {
    setObjects(prev => prev.filter(o => o.id !== objId));
    setSelectedObjId(null);
  };

  const hasDrawingRef = useRef(false);

  const updateHasDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    hasDrawingRef.current = imgData.data.some((v, i) => i % 4 === 3 && v > 0);
  };

  const calcPrices = () => {
    const bottlePrice = selectedBottle.basePrice;
    const hasImage = objects.some(o => o.type === 'image');
    const printingPrice = hasImage ? PRICE_CONFIG.printing : 0;
    const stickerCount = objects.filter(o => o.type === 'sticker').length;
    const stickerPrice = stickerCount * PRICE_CONFIG.stickerPack;
    const engravingPrice = engravingEnabled && engravingText ? PRICE_CONFIG.engraving : 0;
    const drawingPrice = hasDrawingRef.current ? PRICE_CONFIG.printing : 0;
    const total = bottlePrice + Math.max(printingPrice, drawingPrice) + stickerPrice + engravingPrice;
    return { bottlePrice, printingPrice: Math.max(printingPrice, drawingPrice), stickerPrice, engravingPrice, total };
  };

  const generatePreviewImage = () => new Promise((resolve) => {
    const W = 200, H = 280;
    const offscreen = document.createElement('canvas');
    offscreen.width = W;
    offscreen.height = H;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });

    ctx.fillStyle = '#f0ece4';
    ctx.fillRect(0, 0, W, H);

    const svgEl = bottleSvgRef.current;
    const svgData = svgEl ? new XMLSerializer().serializeToString(svgEl) : null;

    const drawRest = () => {
      try {
        if (canvasRef.current) ctx.drawImage(canvasRef.current, 0, 0);
      } catch {}

      const imagePromises = objects.map(obj => new Promise((res) => {
        if (obj.type === 'image') {
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h); res(); };
          img.onerror = () => res();
          img.src = obj.src;
        } else if (obj.type === 'sticker') {
          const fontSize = Math.min(obj.w, obj.h) * 0.75;
          ctx.font = `${fontSize}px serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(obj.text, obj.x + obj.w / 2, obj.y + obj.h / 2);
          res();
        } else {
          res();
        }
      }));

      Promise.all(imagePromises).then(() => {
        if (engravingEnabled && engravingText) {
          ctx.font = 'italic 11px Georgia, serif';
          ctx.fillStyle = '#a08040';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.letterSpacing = '2px';
          ctx.fillText(engravingText, W / 2, H - 40);
        }
        try {
          const raw = offscreen.toDataURL('image/jpeg', 0.5);
          resolve(raw.length < 400_000 ? raw : null);
        } catch {
          resolve(null);
        }
      });
    };

    if (svgData) {
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => { ctx.drawImage(img, 0, 0, W, H); URL.revokeObjectURL(url); drawRest(); };
      img.onerror = () => drawRest();
      img.src = url;
    } else {
      drawRest();
    }
  });

  const handleSave = async () => {
    if (!designName.trim()) { alert('디자인 이름을 입력해주세요.'); return; }
    const prices = calcPrices();
    let previewUrl = null;
    try { previewUrl = await generatePreviewImage(); } catch {}

    const body = {
      name: designName.trim(),
      bottleKey: selectedBottle.id,
      bottleColor,
      engravingText: engravingEnabled && engravingText ? engravingText : null,
      objectsJson: JSON.stringify(objects),
      previewImageUrl: previewUrl,
      bottlePrice: prices.bottlePrice,
      printingPrice: prices.printingPrice,
      stickerPrice: prices.stickerPrice,
      engravingPrice: prices.engravingPrice,
      totalPrice: prices.total,
    };

    const isEdit = !!initialData?.designId;
    const url = isEdit
      ? `${API_BASE_URL}/api/custom/designs/${initialData.designId}`
      : `${API_BASE_URL}/api/custom/designs`;

    try {
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        alert('디자인이 저장되었습니다!');
        onSave();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('저장에 실패했습니다: ' + (err.message || res.status));
      }
    } catch (e) {
      console.error('저장 오류:', e);
      alert('저장 중 오류가 발생했습니다.');
    }
  };

  const allBottles = [...DEFAULT_BOTTLES, ...adminBottles];
  const prices = calcPrices();

  const tabs = [
    { id: 'bottle',    label: '공병 선택' },
    { id: 'draw',      label: '그림판' },
    { id: 'upload',    label: '이미지' },
    { id: 'sticker',   label: '스티커' },
    { id: 'engraving', label: '각인' },
    { id: 'save',      label: '저장' },
  ];

  /* 공통 병 미리보기 props */
  const previewProps = {
    selectedBottle, bottleColor, setBottleColor,
    activeTab, drawMode,
    canvasRef, bottleSvgRef,
    startDraw, draw, endDraw,
    objects, selectedObjId, onObjMouseDown,
    deleteObject, resizeObject,
    engravingEnabled, engravingText,
    prices,
    isMobile,
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-start md:items-center justify-center p-2 md:p-4 backdrop-blur-sm overflow-y-auto">
      <div className={`bg-[#faf8f3] w-full max-w-6xl shadow-2xl border border-[#c9a961]/30 flex flex-col ${isMobile ? 'min-h-screen' : 'max-h-[95vh] overflow-hidden'}`}>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-4 md:px-8 py-3 md:py-4 border-b border-[#c9a961]/20 bg-white flex-shrink-0">
          <div>
            <div className="text-[9px] tracking-[0.4em] text-[#c9a961] italic mb-0.5">DESIGN STUDIO</div>
            <h2 className="font-serif text-base md:text-xl text-[#1a1a1a] tracking-widest">CUSTOMIZING</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:text-[#c9a961] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 탭 바 */}
        <div className="flex border-b border-[#c9a961]/20 bg-white overflow-x-auto flex-shrink-0">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 md:px-5 py-3 text-[10px] md:text-[11px] tracking-widest whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#c9a961] text-[#c9a961]'
                  : 'border-transparent text-[#8b8278] hover:text-[#2a2620]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 본문 영역 */}
        {isMobile ? (
          /* ── 모바일: 세로 스택 (스크롤은 바깥 오버레이가 담당) ── */
          <div className="flex flex-col">
            {/* 상단: 병 미리보기 — 잘리지 않고 온전히 표시 */}
            <BottlePreviewPanel {...previewProps} />

            {/* 하단: 탭 컨텐츠 */}
            <div className="p-4">
              <MobileTabContent
                activeTab={activeTab}
                allBottles={allBottles}
                bottleColor={bottleColor}
                selectedBottle={selectedBottle}
                setSelectedBottle={setSelectedBottle}
                drawMode={drawMode}
                setDrawMode={setDrawMode}
                penColor={penColor}
                setPenColor={setPenColor}
                penSize={penSize}
                setPenSize={setPenSize}
                clearCanvas={clearCanvas}
                canvasRef={canvasRef}
                handleImageUpload={handleImageUpload}
                objects={objects}
                deleteObject={deleteObject}
                addSticker={addSticker}
                handleStickerFileUpload={handleStickerFileUpload}
                engravingEnabled={engravingEnabled}
                setEngravingEnabled={setEngravingEnabled}
                engravingText={engravingText}
                setEngravingText={setEngravingText}
                designName={designName}
                setDesignName={setDesignName}
                prices={prices}
                selectedBottle={selectedBottle}
                handleSave={handleSave}
              />
            </div>
          </div>
        ) : (
          /* ── 데스크탑: 가로 분할 ── */
          <div className="flex flex-1 overflow-hidden">
            <BottlePreviewPanel {...previewProps} />
            <div className="flex-1 overflow-y-auto p-6">
              <DesktopTabContent
                activeTab={activeTab}
                allBottles={allBottles}
                bottleColor={bottleColor}
                selectedBottle={selectedBottle}
                setSelectedBottle={setSelectedBottle}
                drawMode={drawMode}
                setDrawMode={setDrawMode}
                penColor={penColor}
                setPenColor={setPenColor}
                penSize={penSize}
                setPenSize={setPenSize}
                clearCanvas={clearCanvas}
                canvasRef={canvasRef}
                handleImageUpload={handleImageUpload}
                objects={objects}
                deleteObject={deleteObject}
                resizeObject={resizeObject}
                selectedObjId={selectedObjId}
                onObjMouseDown={onObjMouseDown}
                addSticker={addSticker}
                handleStickerFileUpload={handleStickerFileUpload}
                engravingEnabled={engravingEnabled}
                setEngravingEnabled={setEngravingEnabled}
                engravingText={engravingText}
                setEngravingText={setEngravingText}
                designName={designName}
                setDesignName={setDesignName}
                prices={prices}
                handleSave={handleSave}
              />
            </div>
          </div>
        )}

        {/* 하단 가격 바 (데스크탑만) */}
        {!isMobile && (
          <div className="flex items-center justify-between px-8 py-3 bg-white border-t border-[#c9a961]/20 text-[11px] tracking-widest flex-shrink-0">
            <span className="text-[#8b8278]">현재 예상 금액</span>
            <span className="text-[#c9a961] font-bold">₩{prices.total.toLocaleString()}</span>
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   데스크탑 탭 컨텐츠 (기존과 동일)
───────────────────────────────────────── */
const DesktopTabContent = ({
  activeTab, allBottles, bottleColor, selectedBottle, setSelectedBottle,
  drawMode, setDrawMode, penColor, setPenColor, penSize, setPenSize, clearCanvas, canvasRef,
  handleImageUpload, objects, deleteObject, resizeObject, selectedObjId, onObjMouseDown,
  addSticker, handleStickerFileUpload,
  engravingEnabled, setEngravingEnabled, engravingText, setEngravingText,
  designName, setDesignName, prices, handleSave,
}) => (
  <>
    {activeTab === 'bottle' && (
      <div>
        <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-5 uppercase">공병 디자인 선택</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {allBottles.map(bottle => (
            <button key={bottle.id} onClick={() => setSelectedBottle(bottle)}
              className={`flex flex-col items-center p-4 border transition-all ${
                selectedBottle.id === bottle.id
                  ? 'border-[#c9a961] bg-[#c9a961]/5'
                  : 'border-[#c9a961]/20 hover:border-[#c9a961]/60 bg-white'
              }`}>
              <BottleSVG shape={bottle.shape} fillColor={bottleColor} width={70} height={100} />
              <span className="text-[10px] tracking-wider text-[#2a2620] mt-2">{bottle.name}</span>
              <span className="text-[9px] text-[#c9a961] mt-1">₩{bottle.basePrice.toLocaleString()}</span>
            </button>
          ))}
        </div>
      </div>
    )}

    {activeTab === 'draw' && (
      <DrawPanel drawMode={drawMode} setDrawMode={setDrawMode} penColor={penColor} setPenColor={setPenColor} penSize={penSize} setPenSize={setPenSize} clearCanvas={clearCanvas} canvasRef={canvasRef} selectedBottle={selectedBottle} bottleColor={bottleColor} />
    )}

    {activeTab === 'upload' && (
      <UploadPanel handleImageUpload={handleImageUpload} objects={objects} deleteObject={deleteObject} selectedBottle={selectedBottle} bottleColor={bottleColor} />
    )}

    {activeTab === 'sticker' && (
      <StickerPanel addSticker={addSticker} handleStickerFileUpload={handleStickerFileUpload} objects={objects} selectedBottle={selectedBottle} bottleColor={bottleColor} onObjMouseDown={onObjMouseDown} selectedObjId={selectedObjId} deleteObject={deleteObject} resizeObject={resizeObject} />
    )}

    {activeTab === 'engraving' && (
      <EngravingPanel engravingEnabled={engravingEnabled} setEngravingEnabled={setEngravingEnabled} engravingText={engravingText} setEngravingText={setEngravingText} />
    )}

    {activeTab === 'save' && (
      <SavePanel designName={designName} setDesignName={setDesignName} prices={prices} selectedBottle={selectedBottle} objects={objects} handleSave={handleSave} />
    )}
  </>
);

/* ─────────────────────────────────────────
   모바일 탭 컨텐츠 (그리드 축소 버전)
───────────────────────────────────────── */
const MobileTabContent = (props) => {
  const { activeTab, allBottles, bottleColor, selectedBottle, setSelectedBottle } = props;

  return (
    <>
      {activeTab === 'bottle' && (
        <div>
          <h3 className="text-[10px] tracking-[0.3em] text-[#8b8278] mb-3 uppercase">공병 선택</h3>
          {/* 모바일: 가로 스크롤 가능한 행 */}
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
            {allBottles.map(bottle => (
              <button key={bottle.id} onClick={() => setSelectedBottle(bottle)}
                className={`flex flex-col items-center p-3 border transition-all flex-shrink-0 ${
                  selectedBottle.id === bottle.id
                    ? 'border-[#c9a961] bg-[#c9a961]/5'
                    : 'border-[#c9a961]/20 hover:border-[#c9a961]/60 bg-white'
                }`}>
                <BottleSVG shape={bottle.shape} fillColor={bottleColor} width={50} height={72} />
                <span className="text-[9px] tracking-wide text-[#2a2620] mt-1.5 whitespace-nowrap">{bottle.name}</span>
                <span className="text-[8px] text-[#c9a961] mt-0.5">₩{bottle.basePrice.toLocaleString()}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'draw' && (
        <DrawPanel {...props} compact />
      )}

      {activeTab === 'upload' && (
        <UploadPanel {...props} compact />
      )}

      {activeTab === 'sticker' && (
        <StickerPanel {...props} compact />
      )}

      {activeTab === 'engraving' && (
        <EngravingPanel {...props} />
      )}

      {activeTab === 'save' && (
        <SavePanel {...props} compact />
      )}
    </>
  );
};

/* ─────────────────────────────────────────
   전개도(Unwrap) 정의
   각 shape별로 전개 캔버스 크기(UW×UH)와
   면(panels) 배열을 정의.
   panel = { x, y, w, h, label?, topW?, botW? }
   앞면(front)은 반드시 첫 번째 panel.
───────────────────────────────────────── */
const UNWRAP = {
  /* 원통: 앞-좌-뒤-우 4면, 각 면 너비=반지름×π/2 근사 → 68px, 높이=210 */
  cylinder: {
    UW: 68 * 4, UH: 210, faceW: 68, faceH: 210,
    panels: [
      { x: 0,   y: 0, w: 68, h: 210, label: '앞' },
      { x: 68,  y: 0, w: 68, h: 210, label: '좌' },
      { x: 136, y: 0, w: 68, h: 210, label: '뒤' },
      { x: 204, y: 0, w: 68, h: 210, label: '우' },
    ],
  },
  /* 스퀘어: 앞120-좌120-뒤120-우120, 높이190 */
  square: {
    UW: 120 * 4, UH: 190, faceW: 120, faceH: 190,
    panels: [
      { x: 0,   y: 0, w: 120, h: 190, label: '앞' },
      { x: 120, y: 0, w: 120, h: 190, label: '좌' },
      { x: 240, y: 0, w: 120, h: 190, label: '뒤' },
      { x: 360, y: 0, w: 120, h: 190, label: '우' },
    ],
  },
  /* 플랫: 앞140-좌50-뒤140-우50 (납작하니 옆면 좁음), 높이170 */
  flat: {
    UW: 380, UH: 170, faceW: 140, faceH: 170,
    panels: [
      { x: 0,   y: 0, w: 140, h: 170, label: '앞' },
      { x: 140, y: 0, w: 50,  h: 170, label: '좌' },
      { x: 190, y: 0, w: 140, h: 170, label: '뒤' },
      { x: 330, y: 0, w: 50,  h: 170, label: '우' },
    ],
  },
  /* 레탱귤러: 앞110-좌55-뒤110-우55, 높이200 */
  rectangle: {
    UW: 330, UH: 200, faceW: 110, faceH: 200,
    panels: [
      { x: 0,   y: 0, w: 110, h: 200, label: '앞' },
      { x: 110, y: 0, w: 55,  h: 200, label: '좌' },
      { x: 165, y: 0, w: 110, h: 200, label: '뒤' },
      { x: 275, y: 0, w: 55,  h: 200, label: '우' },
    ],
  },
  /* 헥사곤: 6면 각 너비62, 높이133 */
  hexagon: {
    UW: 62 * 6, UH: 133, faceW: 62, faceH: 133,
    panels: [
      { x: 0,   y: 0, w: 62, h: 133, label: '앞' },
      { x: 62,  y: 0, w: 62, h: 133, label: '우앞' },
      { x: 124, y: 0, w: 62, h: 133, label: '우뒤' },
      { x: 186, y: 0, w: 62, h: 133, label: '뒤' },
      { x: 248, y: 0, w: 62, h: 133, label: '좌뒤' },
      { x: 310, y: 0, w: 62, h: 133, label: '좌앞' },
    ],
  },
  /* 라운드: 곡면 전개 — 위(rx68)~아래(rx68) 거의 동일, 둘레≈427, 앞면=1/4둘레×높이 */
  round: {
    UW: 427, UH: 210, faceW: 107, faceH: 210,
    panels: [
      { x: 0,   y: 0, w: 107, h: 210, label: '앞' },
      { x: 107, y: 0, w: 107, h: 210, label: '우' },
      { x: 214, y: 0, w: 107, h: 210, label: '뒤' },
      { x: 321, y: 0, w: 107, h: 210, label: '좌' },
    ],
  },
  /* 티어드롭: 위 폭60 아래 폭160, 각 사다리꼴 4면 */
  teardrop: {
    UW: 480, UH: 198, faceW: 120, faceH: 198,
    panels: [
      { x: 0,   y: 0, w: 120, h: 198, topW: 30,  botW: 80, label: '앞' },
      { x: 120, y: 0, w: 120, h: 198, topW: 30,  botW: 80, label: '우' },
      { x: 240, y: 0, w: 120, h: 198, topW: 30,  botW: 80, label: '뒤' },
      { x: 360, y: 0, w: 120, h: 198, topW: 30,  botW: 80, label: '좌' },
    ],
  },
  /* 돔: 위 폭130 아래 폭130 (반원+직사각), 4면 */
  dome: {
    UW: 408, UH: 200, faceW: 102, faceH: 200,
    panels: [
      { x: 0,   y: 0, w: 102, h: 200, label: '앞' },
      { x: 102, y: 0, w: 102, h: 200, label: '우' },
      { x: 204, y: 0, w: 102, h: 200, label: '뒤' },
      { x: 306, y: 0, w: 102, h: 200, label: '좌' },
    ],
  },
  /* 아르데코: 위30 아래55 사다리꼴, 4면 */
  artdeco: {
    UW: 340, UH: 192, faceW: 85, faceH: 192,
    panels: [
      { x: 0,   y: 0, w: 85, h: 192, topW: 30, botW: 55, label: '앞' },
      { x: 85,  y: 0, w: 85, h: 192, topW: 30, botW: 55, label: '우' },
      { x: 170, y: 0, w: 85, h: 192, topW: 30, botW: 55, label: '뒤' },
      { x: 255, y: 0, w: 85, h: 192, topW: 30, botW: 55, label: '좌' },
    ],
  },
  /* 아치: 위 아치형, 4면 */
  arch: {
    UW: 464, UH: 202, faceW: 116, faceH: 202,
    panels: [
      { x: 0,   y: 0, w: 116, h: 202, label: '앞' },
      { x: 116, y: 0, w: 116, h: 202, label: '우' },
      { x: 232, y: 0, w: 116, h: 202, label: '뒤' },
      { x: 348, y: 0, w: 116, h: 202, label: '좌' },
    ],
  },
};

/* 전개도 SVG 그리기 헬퍼 — 각 panel을 사다리꼴 or 직사각형으로 렌더 */
const UnwrapSVG = ({ shape, fillColor, width, height }) => {
  const u = UNWRAP[shape] || UNWRAP.round;
  const scaleX = width  / u.UW;
  const scaleY = height / u.UH;
  const stroke = '#c9a961';

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 1 }}>
      {u.panels.map((p, i) => {
        const x = p.x * scaleX, y = p.y * scaleY;
        const w = p.w * scaleX, h = p.h * scaleY;
        /* 사다리꼴 여부 */
        const hasTrap = p.topW !== undefined && p.botW !== undefined;
        if (hasTrap) {
          const tw = p.topW * scaleX, bw = p.botW * scaleX;
          const cx = x + w / 2;
          const pts = [
            `${cx - tw / 2},${y}`,
            `${cx + tw / 2},${y}`,
            `${cx + bw / 2},${y + h}`,
            `${cx - bw / 2},${y + h}`,
          ].join(' ');
          return (
            <g key={i}>
              <polygon points={pts} fill={fillColor} opacity="0.7"
                stroke={stroke} strokeWidth="1.2" strokeDasharray={i === 0 ? 'none' : '4 2'} />
              {p.label && (
                <text x={cx} y={y + h / 2} textAnchor="middle" dominantBaseline="middle"
                  fontSize={9 * Math.min(scaleX, scaleY)} fill="#8b8278" opacity="0.7"
                  fontFamily="sans-serif">{p.label}</text>
              )}
            </g>
          );
        }
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={h} fill={fillColor} opacity="0.7"
              stroke={stroke} strokeWidth="1.2" strokeDasharray={i === 0 ? 'none' : '4 2'} />
            {p.label && (
              <text x={x + w / 2} y={y + h / 2} textAnchor="middle" dominantBaseline="middle"
                fontSize={9 * Math.min(scaleX, scaleY)} fill="#8b8278" opacity="0.7"
                fontFamily="sans-serif">{p.label}</text>
            )}
          </g>
        );
      })}
      {/* 앞면 강조 테두리 */}
      {(() => {
        const p = u.panels[0];
        const x = p.x * scaleX, y = p.y * scaleY;
        const w = p.w * scaleX, h = p.h * scaleY;
        if (p.topW !== undefined) {
          const tw = p.topW * scaleX, bw = p.botW * scaleX;
          const cx = x + w / 2;
          const pts = [`${cx-tw/2},${y}`,`${cx+tw/2},${y}`,`${cx+bw/2},${y+h}`,`${cx-bw/2},${y+h}`].join(' ');
          return <polygon points={pts} fill="none" stroke={stroke} strokeWidth="2.5" opacity="0.9"/>;
        }
        return <rect x={x} y={y} width={w} height={h} fill="none" stroke={stroke} strokeWidth="2.5" opacity="0.9"/>;
      })()}
      {/* 앞면 라벨 */}
      <text x={(u.panels[0].x + u.panels[0].w / 2) * scaleX}
        y={6 * scaleY + 8} textAnchor="middle"
        fontSize={8 * Math.min(scaleX, scaleY)} fill={stroke} fontFamily="sans-serif" opacity="0.9">
        ✦ 앞면
      </text>
    </svg>
  );
};

/* ─────────────────────────────────────────
   공통 패널 컴포넌트들
───────────────────────────────────────── */
/* ── 그림판 패널: 병 전개도 위에서 그리고, 앞면만 메인 미리보기에 반영 ── */
const DrawPanel = ({
  drawMode, setDrawMode, penColor, setPenColor, penSize, setPenSize,
  clearCanvas, canvasRef, compact, selectedBottle, bottleColor,
}) => {
  const unwrapCanvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [lastPos,   setLastPos]   = useState(null);

  const u = UNWRAP[selectedBottle.shape] || UNWRAP.round;

  /* 전개도 display 크기: 패널에 맞게 스케일 (최대 가로 600px) */
  const maxDisplayW = 600;
  const displayScale = Math.min(1, maxDisplayW / u.UW);
  const dispW = Math.round(u.UW * displayScale);
  const dispH = Math.round(u.UH * displayScale);

  /* 이벤트 → 캔버스 내부 좌표 */
  const getPos = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const cx = e.touches ? e.touches[0].clientX : e.clientX;
    const cy = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (cx - rect.left) * (canvas.width  / rect.width),
      y: (cy - rect.top)  * (canvas.height / rect.height),
    };
  };

  /* 전개도의 앞면 영역(내부 좌표계)을 메인 canvasRef(200×280)에 복사 */
  const syncFrontToMain = useCallback(() => {
    const uCanvas = unwrapCanvasRef.current;
    const mCanvas = canvasRef?.current;
    if (!uCanvas || !mCanvas) return;

    const fp = u.panels[0]; /* 앞면 panel */
    const mCtx = mCanvas.getContext('2d', { willReadFrequently: true });

    /* 메인 캔버스 클리어 후 앞면만 그려 넣기 */
    mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);

    /* 앞면 영역: 전개도 내부 좌표 (fp.x, fp.y, fp.w, fp.h) */
    const b = BOTTLE_BODY_PATHS[selectedBottle.shape] || BOTTLE_BODY_PATHS.round;
    /* 메인 미리보기에서 앞면이 차지하는 영역 계산 */
    let destX, destY, destW, destH;
    if (b.type === 'ellipse') {
      destX = b.cx - b.rx; destY = b.cy - b.ry; destW = b.rx * 2; destH = b.ry * 2;
    } else if (b.type === 'rect') {
      destX = b.x; destY = b.y; destW = b.w; destH = b.h;
    } else if (b.type === 'path' || b.type === 'polygon') {
      /* 간단히 bounding box 근사 */
      destX = 35; destY = 58; destW = 130; destH = 202;
    } else {
      destX = 30; destY = 60; destW = 140; destH = 200;
    }

    mCtx.save();
    mCtx.drawImage(
      uCanvas,
      fp.x, fp.y, fp.w, fp.h,       /* 소스: 전개도 앞면 */
      destX, destY, destW, destH,    /* 대상: 메인 미리보기 앞면 영역 */
    );
    mCtx.restore();
  }, [canvasRef, selectedBottle.shape, u]);

  const onStart = (e) => {
    e.preventDefault();
    const canvas = unwrapCanvasRef.current;
    if (!canvas) return;
    setIsDrawing(true);
    setLastPos(getPos(e, canvas));
  };

  const onMove = (e) => {
    e.preventDefault();
    if (!isDrawing || !lastPos) return;
    const canvas = unwrapCanvasRef.current;
    const ctx    = canvas.getContext('2d', { willReadFrequently: true });
    const pos    = getPos(e, canvas);

    ctx.globalCompositeOperation = drawMode === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = penColor;
    ctx.lineWidth   = penSize;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.beginPath();
    ctx.moveTo(lastPos.x, lastPos.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
    setLastPos(pos);
  };

  const onEnd = (e) => {
    e && e.preventDefault();
    setIsDrawing(false);
    setLastPos(null);
    syncFrontToMain(); /* 그리기 끝날 때마다 앞면 반영 */
  };

  const handleClear = () => {
    const canvas = unwrapCanvasRef.current;
    if (canvas) canvas.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, canvas.width, canvas.height);
    if (canvasRef?.current) canvasRef.current.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, 200, 280);
  };

  return (
    <div>
      {!compact && <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-2 uppercase">그림판</h3>}

      {/* 전개도 캔버스 영역 — 가로 스크롤 */}
      <div className="mb-3 overflow-x-auto">
        <div className="relative bg-[#f7f4ee] border border-[#c9a961]/20 mx-auto"
          style={{ width: dispW, height: dispH, minWidth: dispW }}>

          {/* 경고문 — 전개도 컨테이너 안 맨 위 */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0,
            textAlign: 'center', zIndex: 30, pointerEvents: 'none', padding: '3px 0' }}>
            <span style={{ fontSize: 9, color: '#ef4444', letterSpacing: '0.05em' }}>
              실선(앞면) 영역만 병 미리보기에 반영됩니다
            </span>
          </div>

          {/* 전개도 SVG 배경 */}
          <UnwrapSVG shape={selectedBottle.shape} fillColor={bottleColor}
            width={dispW} height={dispH} />

          {/* 격자 힌트 */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 19px,rgba(201,169,97,0.05) 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,rgba(201,169,97,0.05) 20px)' }} />

          {/* 그리기 캔버스 — 전개도 실제 크기로 */}
          <canvas
            ref={unwrapCanvasRef}
            width={u.UW} height={u.UH}
            style={{
              position: 'absolute', inset: 0, zIndex: 3,
              width: dispW, height: dispH,
              cursor: drawMode === 'eraser' ? 'cell' : 'crosshair',
              touchAction: 'none',
            }}
            onMouseDown={onStart} onMouseMove={onMove}
            onMouseUp={onEnd}     onMouseLeave={onEnd}
            onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          />
        </div>
      </div>

      <p className="text-[9px] text-[#8b8278] italic mb-4 tracking-widest text-center">
        ✦ 실선 테두리(앞면) 영역이 병 미리보기에 반영됩니다 &nbsp;·&nbsp; 나머지 면도 실제 제작 시 사용됩니다
      </p>

      {/* 도구 컨트롤 */}
      <div className={`bg-white border border-[#c9a961]/20 ${compact ? 'p-3' : 'p-5'} space-y-4`}>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setDrawMode('pen')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] tracking-wider border transition-all ${drawMode === 'pen' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#c9a961]/30 text-[#8b8278]'}`}>
            <Pen size={12} /> 펜
          </button>
          <button onClick={() => setDrawMode('eraser')}
            className={`flex items-center gap-1.5 px-3 py-2 text-[11px] tracking-wider border transition-all ${drawMode === 'eraser' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#c9a961]/30 text-[#8b8278]'}`}>
            <Eraser size={12} /> 지우개
          </button>
          <button onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-2 text-[11px] tracking-wider border border-red-200 text-red-300 hover:bg-red-50 transition-all">
            <RotateCcw size={12} /> 전체 지우기
          </button>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-wider text-[#8b8278]">색상</span>
            <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)}
              className="w-8 h-8 cursor-pointer border border-[#c9a961]/30" disabled={drawMode === 'eraser'} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] tracking-wider text-[#8b8278]">굵기</span>
            <input type="range" min={1} max={20} value={penSize}
              onChange={e => setPenSize(Number(e.target.value))}
              className="w-24 accent-[#c9a961]" />
            <span className="text-[10px] text-[#c9a961] w-4">{penSize}px</span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] tracking-wider text-[#8b8278] mr-1">빠른 색상</span>
          {['#c9a961', '#1a1a1a', '#ffffff', '#8b8278', '#2a2620', '#e8dcc8', '#ff6b6b', '#74b9ff', '#55efc4', '#fd79a8', '#a29bfe'].map(c => (
            <button key={c}
              onClick={() => { setPenColor(c); setDrawMode('pen'); }}
              style={{ background: c, border: penColor === c ? '2px solid #c9a961' : '1.5px solid #ddd' }}
              className="w-6 h-6 rounded-full transition-transform hover:scale-110" />
          ))}
        </div>
      </div>
    </div>
  );
};

/* ── 이미지 업로드 패널: 도안 위에 이미지 배치, 윤곽선 위로 오버레이, 경고문 ── */
const UploadPanel = ({ handleImageUpload, objects, deleteObject, compact, selectedBottle, bottleColor }) => {
  const W = 200, H = 280;
  const hasImages = objects?.filter(o => o.type === 'image').length > 0;

  return (
    <div>
      {!compact && <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase">이미지 업로드</h3>}

      {/* 도안 미리보기 — 전개도 */}
      <div className="mb-2">
        <div className="overflow-x-auto">
          {(() => {
            const u = UNWRAP[selectedBottle.shape] || UNWRAP.round;
            const maxW = 560;
            const scale = Math.min(1, maxW / u.UW);
            const dW = Math.round(u.UW * scale);
            const dH = Math.round(u.UH * scale);
            return (
              <div className="relative bg-[#f7f4ee] border border-[#c9a961]/20 mx-auto"
                style={{ width: dW, height: dH, minWidth: dW }}>
                {/* 전개도 SVG */}
                <UnwrapSVG shape={selectedBottle.shape} fillColor={bottleColor} width={dW} height={dH} />
                {/* 앞면 위에만 이미지 오버레이 표시 */}
                {objects?.filter(o => o.type === 'image').map(obj => {
                  const fp = u.panels[0];
                  const sx = dW / u.UW, sy = dH / u.UH;
                  return (
                    <div key={obj.id} style={{
                      position: 'absolute',
                      left: fp.x * sx, top: fp.y * sy,
                      width: fp.w * sx, height: fp.h * sy,
                      zIndex: 10, overflow: 'hidden',
                    }}>
                      <img src={obj.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} draggable={false} />
                    </div>
                  );
                })}
                {/* 앞면 윤곽선 재강조 — 항상 맨 위 */}
                <svg width={dW} height={dH} viewBox={`0 0 ${dW} ${dH}`}
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
                  {(() => {
                    const u2 = UNWRAP[selectedBottle.shape] || UNWRAP.round;
                    const fp = u2.panels[0];
                    const sx = dW / u2.UW, sy = dH / u2.UH;
                    const x = fp.x * sx, y = fp.y * sy, w = fp.w * sx, h = fp.h * sy;
                    if (fp.topW !== undefined) {
                      const tw = fp.topW * sx, bw = fp.botW * sx, cx2 = x + w / 2;
                      const pts = [`${cx2-tw/2},${y}`,`${cx2+tw/2},${y}`,`${cx2+bw/2},${y+h}`,`${cx2-bw/2},${y+h}`].join(' ');
                      return <polygon points={pts} fill="none" stroke="#c9a961" strokeWidth="2" strokeDasharray="5 3" opacity="0.9"/>;
                    }
                    return <rect x={x} y={y} width={w} height={h} fill="none" stroke="#c9a961" strokeWidth="2" strokeDasharray="5 3" opacity="0.9"/>;
                  })()}
                </svg>
                {/* 경고 문구 — 전개도 컨테이너 안 맨 위, 항상 표시 */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0,
                  textAlign: 'center', zIndex: 30, pointerEvents: 'none', padding: '3px 0' }}>
                  <span style={{ fontSize: 9, color: '#ef4444', letterSpacing: '0.05em' }}>
                    윤곽선 외 부분은 잘립니다
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* 업로드 영역 */}
      <div
        className={`border-2 border-dashed border-[#c9a961]/40 bg-white text-center cursor-pointer hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all ${compact ? 'p-6' : 'p-10'}`}
        onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files[0]); }}
        onDragOver={e => e.preventDefault()}
        onClick={() => document.getElementById('img-upload-input').click()}
      >
        <Upload size={compact ? 22 : 30} className="mx-auto mb-3 text-[#c9a961]/60" />
        <p className="text-[11px] tracking-widest text-[#8b8278] mb-1">이미지를 드래그하거나 클릭하여 업로드</p>
        <p className="text-[9px] text-[#c9a961]/60 italic">PNG, JPG, SVG, WEBP 지원</p>
        <input id="img-upload-input" type="file" accept="image/*" className="hidden"
          onChange={e => handleImageUpload(e.target.files[0])} />
      </div>

      {hasImages && (
        <div className="mt-4">
          <div className="text-[10px] tracking-widest text-[#8b8278] mb-2">업로드된 이미지</div>
          <div className="flex flex-wrap gap-2">
            {objects.filter(o => o.type === 'image').map(obj => (
              <div key={obj.id} className="relative w-14 h-14 border border-[#c9a961]/20 overflow-hidden">
                <img src={obj.src} alt="" className="w-full h-full object-cover" />
                <button onClick={() => deleteObject(obj.id)}
                  className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[10px] flex items-center justify-center">×</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   SVG 내장 스티커 — 금박 / 은박
───────────────────────────────────────── */
const makeSvgUrl = (svgStr) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svgStr)}`;

const _G  = '#C9A961';
const _GD = '#7A5A10';
const _GL = '#EDD98A';
const _S  = '#C8C8C8';
const _SD = '#888888';
const _SL = '#EFEFEF';

const _alphaInner = (letter, fill, strokeC) =>
  `<text x="24" y="37" text-anchor="middle" font-family="Georgia,'Times New Roman',serif" font-size="34" font-weight="bold" font-style="italic" fill="${fill}" stroke="${strokeC}" stroke-width="1" paint-order="stroke">${letter}</text>`;

const _buildSvg = (inner, gradId, c1, c2, c3) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><defs>` +
  `<linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">` +
  `<stop offset="0%" stop-color="${c1}"/>` +
  `<stop offset="50%" stop-color="${c2}"/>` +
  `<stop offset="100%" stop-color="${c3}"/>` +
  `</linearGradient></defs>${inner}</svg>`;

const _gSvg = (inner) => _buildSvg(inner.replace(/__GRAD__/g,'url(#gg)'), 'gg', _GL, _G, _GD);
const _sSvg = (inner) => _buildSvg(inner.replace(/__GRAD__/g,'url(#sg)'), 'sg', _SL, _S, _SD);

const GOLD_ALPHA   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => ({
  id:`ga-${l}`, label:`금 ${l}`, url: makeSvgUrl(_gSvg(_alphaInner(l,'__GRAD__',_GD))),
}));
const SILVER_ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(l => ({
  id:`sa-${l}`, label:`은 ${l}`, url: makeSvgUrl(_sSvg(_alphaInner(l,'__GRAD__',_SD))),
}));

const SvgStickerBtn = ({ item, onAdd }) => (
  <button onClick={() => onAdd(item.url, item.label)} title={item.label}
    className="w-12 h-12 flex items-center justify-center border border-[#c9a961]/20 hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all hover:scale-110 overflow-hidden p-0.5 bg-white">
    <img src={item.url} alt={item.label} className="w-full h-full object-contain" draggable={false}/>
  </button>
);

/* ── 스티커 전역 캐시 (컴포넌트 마운트 간 재사용) ── */
let _stickerCache = null;
let _stickerFetchPromise = null;

const fetchStickersOnce = () => {
  if (_stickerCache) return Promise.resolve(_stickerCache);
  if (_stickerFetchPromise) return _stickerFetchPromise;

  _stickerFetchPromise = supabase
    .from('Stickers')
    .select('id, name, image_url, category, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .then(({ data, error }) => {
      if (error) throw error;
      _stickerCache = data || [];
      _stickerFetchPromise = null;
      return _stickerCache;
    });

  return _stickerFetchPromise;
};

/* ── 스티커 패널: Supabase DB에서 로드, 카테고리별 그룹, 도안+윤곽선+경고 ── */
const StickerPanel = ({ addSticker, handleStickerFileUpload, compact, objects, selectedBottle, bottleColor, onObjMouseDown, selectedObjId, deleteObject, resizeObject }) => {
  const [stickers, setStickers]   = useState(_stickerCache || []);
  const [loadState, setLoadState] = useState(_stickerCache ? 'done' : 'loading');
  const W = 200, H = 280;
  const hasStickers = objects?.filter(o => o.type === 'sticker' || o.type === 'image').length > 0;

  useEffect(() => {
    if (_stickerCache) return; /* 이미 캐시 있으면 패스 */
    fetchStickersOnce()
      .then(data => { setStickers(data); setLoadState('done'); })
      .catch(() => setLoadState('error'));
  }, []);

  /* 카테고리별 그룹핑 */
  const grouped = stickers.reduce((acc, s) => {
    const cat = s.category || '기타';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {});

  const addSvgSticker = (url, label) => {
    addSticker({ type: 'image', src: url, label });
  };

  return (
    <div className="space-y-4">
      {!compact && <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-1 uppercase">스티커</h3>}

      {/* 도안 미리보기 — 전개도 */}
      <div>
        <div className="overflow-x-auto">
          {(() => {
            const u = UNWRAP[selectedBottle.shape] || UNWRAP.round;
            const maxW = 560;
            const scale = Math.min(1, maxW / u.UW);
            const dW = Math.round(u.UW * scale);
            const dH = Math.round(u.UH * scale);
            const fp = u.panels[0];
            const sx = dW / u.UW, sy = dH / u.UH;

            /* 전개도 좌표 → obj 좌표 (200×280 기준) 변환 */
            const toObjCoord = (dispX, dispY) => ({
              x: ((dispX - fp.x * sx) / (fp.w * sx)) * 200,
              y: ((dispY - fp.y * sy) / (fp.h * sy)) * 280,
            });

            /* 전개도 위에서 드래그 시작 */
            const onUnwrapMouseDown = (e, objId) => {
              e.stopPropagation();
              onObjMouseDown(e, objId);
            };

            return (
              <div className="relative bg-[#f7f4ee] border border-[#c9a961]/20 mx-auto"
                style={{ width: dW, height: dH, minWidth: dW }}>
                <UnwrapSVG shape={selectedBottle.shape} fillColor={bottleColor} width={dW} height={dH} />

                {/* 경고문 — 전개도 컨테이너 안 맨 위, 항상 표시 */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0,
                  textAlign: 'center', zIndex: 30, pointerEvents: 'none', padding: '3px 0' }}>
                  <span style={{ fontSize: 9, color: '#ef4444', letterSpacing: '0.05em' }}>
                    윤곽선 외 부분은 잘립니다
                  </span>
                </div>

                {/* 인터랙티브 스티커 */}
                {objects?.filter(o => o.type === 'sticker' || o.type === 'image').map(obj => {
                  const dispX = fp.x * sx + (obj.x / 200) * fp.w * sx;
                  const dispY = fp.y * sy + (obj.y / 280) * fp.h * sy;
                  const dispW2 = obj.w * sx * (fp.w / 200);
                  const dispH2 = obj.h * sy * (fp.h / 280);
                  const isSelected = selectedObjId === obj.id;
                  return (
                    <div key={obj.id} style={{
                      position: 'absolute',
                      left: dispX, top: dispY,
                      width: dispW2, height: dispH2,
                      zIndex: 10, cursor: 'move',
                      border: isSelected ? '1.5px dashed #c9a961' : 'none',
                      boxSizing: 'border-box', userSelect: 'none',
                    }}
                      onMouseDown={(e) => onUnwrapMouseDown(e, obj.id)}
                    >
                      {obj.type === 'image'
                        ? <img src={obj.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} draggable={false}/>
                        : <span style={{ fontSize: Math.min(dispW2, dispH2) * 0.75, pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>{obj.text}</span>
                      }
                      {isSelected && (
                        <>
                          <button onClick={() => deleteObject(obj.id)}
                            style={{ position: 'absolute', top: -10, right: -10, background: '#ff4444', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', zIndex: 30 }}>×</button>
                          <button onClick={() => resizeObject(obj.id, 10)}
                            style={{ position: 'absolute', bottom: -10, right: -10, background: '#c9a961', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'se-resize', border: 'none', zIndex: 30 }}>+</button>
                          <button onClick={() => resizeObject(obj.id, -10)}
                            style={{ position: 'absolute', bottom: -10, left: -10, background: '#8b8278', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', zIndex: 30 }}>-</button>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* 앞면 윤곽선 강조 */}
                <svg width={dW} height={dH} viewBox={`0 0 ${dW} ${dH}`}
                  style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
                  {(() => {
                    const x = fp.x * sx, y = fp.y * sy, w = fp.w * sx, h = fp.h * sy;
                    if (fp.topW !== undefined) {
                      const tw = fp.topW * sx, bw = fp.botW * sx, cx2 = x + w / 2;
                      const pts = [`${cx2-tw/2},${y}`,`${cx2+tw/2},${y}`,`${cx2+bw/2},${y+h}`,`${cx2-bw/2},${y+h}`].join(' ');
                      return <polygon points={pts} fill="none" stroke="#c9a961" strokeWidth="2" strokeDasharray="5 3" opacity="0.9"/>;
                    }
                    return <rect x={x} y={y} width={w} height={h} fill="none" stroke="#c9a961" strokeWidth="2" strokeDasharray="5 3" opacity="0.9"/>;
                  })()}
                </svg>
              </div>
            );
          })()}
        </div>
      </div>

      {/* ── 내장 SVG 스티커: 금박 이니셜 ── */}
      <div className="bg-white border border-[#c9a961]/20 p-4">
        <div className="text-[10px] tracking-widest mb-1" style={{ color: _G }}>✦ 금박 이니셜</div>
        <div className="flex flex-wrap gap-1.5">
          {GOLD_ALPHA.map(item => <SvgStickerBtn key={item.id} item={item} onAdd={addSvgSticker} />)}
        </div>
      </div>

      {/* ── 내장 SVG 스티커: 은박 이니셜 ── */}
      <div className="bg-white border border-[#c9a961]/20 p-4">
        <div className="text-[10px] tracking-widest mb-1" style={{ color: _S }}>✦ 은박 이니셜</div>
        <div className="flex flex-wrap gap-1.5">
          {SILVER_ALPHA.map(item => <SvgStickerBtn key={item.id} item={item} onAdd={addSvgSticker} />)}
        </div>
      </div>

      {/* ── DB 스티커 목록 ── */}
      {loadState === 'loading' && (
        <div className="text-center py-8 text-[9px] tracking-widest text-[#8b8278] italic">
          스티커 로딩 중...
        </div>
      )}

      {loadState === 'error' && (
        <div className="text-center py-6 text-[9px] text-red-400 italic">
          스티커를 불러오지 못했습니다.
        </div>
      )}

      {loadState === 'done' && stickers.length === 0 && (
        <div className="text-center py-6 text-[9px] tracking-widest text-[#8b8278] italic">
          등록된 스티커가 없습니다.
        </div>
      )}

      {loadState === 'done' && Object.entries(grouped).map(([category, items]) => (
        <div key={category} className="bg-white border border-[#c9a961]/20 p-4">
          <div className="text-[10px] tracking-widest text-[#8b8278] mb-3">{category}</div>
          <div className="flex flex-wrap gap-2">
            {items.map(s => (
              <button key={s.id} onClick={() => addSvgSticker(s.image_url, s.name)}
                title={s.name}
                className="w-14 h-14 flex items-center justify-center border border-[#c9a961]/20 hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all hover:scale-110 overflow-hidden p-1.5 bg-white">
                <img src={s.image_url} alt={s.name} className="w-full h-full object-contain" />
              </button>
            ))}
          </div>
        </div>
      ))}

      {/* 커스텀 파일 업로드 */}
      <div className="bg-white border border-[#c9a961]/20 p-4">
        <div className="text-[10px] tracking-widest text-[#8b8278] mb-2">직접 업로드</div>
        <label className="flex items-center gap-2 px-4 py-2 border border-dashed border-[#c9a961]/40 cursor-pointer hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all w-fit">
          <Upload size={13} className="text-[#c9a961]/60" />
          <span className="text-[11px] tracking-wider text-[#8b8278]">이미지 파일 선택</span>
          <input type="file" accept="image/*" className="hidden" onChange={e => handleStickerFileUpload(e.target.files[0])} />
        </label>
        <p className="text-[9px] text-[#8b8278]/60 italic mt-1">PNG (투명배경) 권장</p>
      </div>
    </div>
  );
};

const EngravingPanel = ({ engravingEnabled, setEngravingEnabled, engravingText, setEngravingText }) => (
  <div>
    <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase">각인 (Engraving)</h3>
    <div className="bg-white border border-[#c9a961]/20 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <input type="checkbox" id="engraving-toggle" checked={engravingEnabled}
          onChange={e => setEngravingEnabled(e.target.checked)}
          className="accent-[#c9a961] w-4 h-4" />
        <label htmlFor="engraving-toggle" className="text-[11px] tracking-widest text-[#2a2620] cursor-pointer">
          각인 추가하기 (+₩{PRICE_CONFIG.engraving.toLocaleString()})
        </label>
      </div>
      {engravingEnabled && (
        <div className="space-y-2 pl-7">
          <label className="text-[10px] tracking-wider text-[#8b8278] block">각인 문구 (최대 20자)</label>
          <input type="text" value={engravingText} maxLength={20}
            onChange={e => setEngravingText(e.target.value)}
            placeholder="예: My Signature..."
            className="w-full max-w-sm border-b border-[#c9a961]/40 bg-transparent text-sm text-[#2a2620] pb-2 outline-none placeholder-[#8b8278]/50 focus:border-[#c9a961]" />
          <p className="text-[9px] text-[#8b8278] italic">{engravingText.length}/20자</p>
        </div>
      )}
    </div>
  </div>
);

const SavePanel = ({ designName, setDesignName, prices, selectedBottle, objects, handleSave }) => (
  <div>
    <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-4 uppercase">저장 및 가격</h3>
    <div className="bg-white border border-[#c9a961]/20 p-5 space-y-5">
      <div>
        <label className="text-[10px] tracking-wider text-[#8b8278] block mb-2">디자인 이름 *</label>
        <input type="text" value={designName}
          onChange={e => setDesignName(e.target.value)}
          placeholder="나만의 디자인 이름"
          className="w-full max-w-sm border-b border-[#c9a961]/40 bg-transparent text-sm text-[#2a2620] pb-2 outline-none placeholder-[#8b8278]/50 focus:border-[#c9a961]" />
      </div>

      <div className="space-y-2 border-t border-[#c9a961]/10 pt-4">
        <div className="text-[10px] tracking-widest text-[#8b8278] mb-2">가격 내역</div>
        <div className="flex justify-between text-[11px] tracking-wider text-[#2a2620]">
          <span>공병 ({selectedBottle.name})</span>
          <span>₩{prices.bottlePrice.toLocaleString()}</span>
        </div>
        {prices.printingPrice > 0 && (
          <div className="flex justify-between text-[11px] text-[#2a2620]">
            <span>이미지/프린팅</span><span>₩{prices.printingPrice.toLocaleString()}</span>
          </div>
        )}
        {prices.stickerPrice > 0 && (
          <div className="flex justify-between text-[11px] text-[#2a2620]">
            <span>스티커 ({objects?.filter(o => o.type === 'sticker').length || 0}개)</span>
            <span>₩{prices.stickerPrice.toLocaleString()}</span>
          </div>
        )}
        {prices.engravingPrice > 0 && (
          <div className="flex justify-between text-[11px] text-[#2a2620]">
            <span>각인</span><span>₩{prices.engravingPrice.toLocaleString()}</span>
          </div>
        )}
        <div className="h-px bg-[#c9a961]/20 my-2" />
        <div className="flex justify-between items-center">
          <span className="font-serif italic text-[#c9a961] text-sm">Total</span>
          <span className="text-xl font-bold text-[#1a1a1a]">₩{prices.total.toLocaleString()}</span>
        </div>
      </div>

      <button onClick={handleSave}
        className="w-full py-4 bg-[#1a1a1a] text-white text-[10px] tracking-[0.3em] hover:bg-[#c9a961] transition-all flex items-center justify-center gap-2">
        <Save size={14} />
        SAVE DESIGN
      </button>
    </div>
  </div>
);

export default CustomizationEditor;