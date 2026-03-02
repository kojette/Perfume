/**
 * CustomizationEditor.jsx
 * 위치: src/components/pages/CustomizationEditor.jsx
 *
 * 향수 공병 디자인 에디터 모달.
 * 공병 목록: GET /api/custom/bottles  (백엔드)
 * 저장:      POST /api/custom/designs (백엔드)
 * 수정:      PUT  /api/custom/designs/{id} (백엔드)
 * Supabase 직접 접근 없음.
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { X, Upload, Pen, Save, RotateCcw, Eraser, Plus } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080';

// ─── 기본 내장 공병 10종 (백엔드 없이도 표시되는 기본값) ──────────────────────
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

// 가격 체계
const PRICE_CONFIG = {
  printing:    5000,
  stickerPack: 3000,
  engraving:   8000,
};

// 기본 내장 스티커 (이모지)
const BUILT_IN_STICKERS = ['🌸', '✨', '🌙', '⭐', '🌿', '💎', '🦋', '🌹', '🔮', '☽', '❀', '✦', '❖', '◈', '⊕'];

// ─── 공병 SVG 렌더러 (forwardRef로 미리보기 합성 시 ref 접근 가능) ────────────
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

// ─── 메인 에디터 컴포넌트 ─────────────────────────────────────────────────────
const CustomizationEditor = ({ onClose, onSave, initialData }) => {
  const [activeTab, setActiveTab] = useState('bottle');

  // 공병
  const [selectedBottle, setSelectedBottle] = useState(DEFAULT_BOTTLES[0]);
  const [adminBottles, setAdminBottles] = useState([]);  // 백엔드에서 로드
  const [bottleColor, setBottleColor] = useState('#e8dcc8');

  // 그림판
  const canvasRef = useRef(null);
  const bottleSvgRef = useRef(null); // 미리보기 공병 SVG ref (합성 이미지 생성용)
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawMode, setDrawMode] = useState('pen');
  const [penColor, setPenColor] = useState('#c9a961');
  const [penSize, setPenSize] = useState(4);
  const [lastPos, setLastPos] = useState(null);

  // 오브젝트 레이어 (이미지 + 스티커)
  const [objects, setObjects] = useState([]);
  const [selectedObjId, setSelectedObjId] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // 각인
  const [engravingText, setEngravingText] = useState('');
  const [engravingEnabled, setEngravingEnabled] = useState(false);

  // 저장 정보
  const [designName, setDesignName] = useState('');

  const token = sessionStorage.getItem('accessToken');

  // ── 관리자 추가 공병 목록 로드 (백엔드 API) ─────────────────────────
  // GET /api/custom/bottles
  useEffect(() => {
    const loadAdminBottles = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/custom/bottles`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) {
          const json = await res.json();
          // 백엔드 응답: { success: true, data: [...] }
          // shape이 BottleSVG에 정의된 키와 일치해야 표시됨
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

  // ── initialData 복원 (수정 모드) ─────────────────────────────────────
  useEffect(() => {
    if (!initialData) return;
    setDesignName(initialData.name || '');
    setBottleColor(initialData.bottleColor || '#e8dcc8');
    setEngravingText(initialData.engravingText || '');
    setEngravingEnabled(!!initialData.engravingText);

    // 공병 선택 복원
    const allBottles = [...DEFAULT_BOTTLES, ...adminBottles];
    const found = allBottles.find(b => b.id === initialData.bottleKey);
    if (found) setSelectedBottle(found);

    // 오브젝트 레이어 복원
    if (initialData.objectsJson) {
      try { setObjects(JSON.parse(initialData.objectsJson)); } catch {}
    }
  }, [initialData]);

  // ── 그림판 ───────────────────────────────────────────────────────────
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
    // willReadFrequently: true → getImageData 반복 호출 시 경고 제거 및 성능 최적화
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
    updateHasDrawing(); // 드로잉 종료 시 ref 갱신
  };
  const clearCanvas = () => {
    canvasRef.current.getContext('2d', { willReadFrequently: true }).clearRect(0, 0, 200, 280);
    hasDrawingRef.current = false; // 전체 지우기 시 ref 초기화
  };

  // ── 이미지 업로드 ─────────────────────────────────────────────────────
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

  // ── 스티커 추가 ──────────────────────────────────────────────────────
  const addSticker = (emoji) => {
    setObjects(prev => [...prev, {
      id: Date.now(), type: 'sticker',
      text: emoji, x: 80, y: 100, w: 60, h: 60,
    }]);
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

  // ── 오브젝트 드래그 이동 ─────────────────────────────────────────────
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

  // 오브젝트 크기 조절
  const resizeObject = (objId, delta) => {
    setObjects(prev => prev.map(o =>
      o.id === objId ? { ...o, w: Math.max(30, o.w + delta), h: Math.max(30, o.h + delta) } : o
    ));
  };

  const deleteObject = (objId) => {
    setObjects(prev => prev.filter(o => o.id !== objId));
    setSelectedObjId(null);
  };

  // 그림판에 드로잉이 있는지 여부를 ref로 추적 (getImageData를 렌더마다 호출하지 않도록)
  const hasDrawingRef = useRef(false);

  // draw 이벤트 끝날 때마다 드로잉 여부 갱신
  const updateHasDrawing = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    hasDrawingRef.current = imgData.data.some((v, i) => i % 4 === 3 && v > 0);
  };

  // ── 가격 계산 ─────────────────────────────────────────────────────────
  const calcPrices = () => {
    const bottlePrice = selectedBottle.basePrice;
    const hasImage = objects.some(o => o.type === 'image');
    const printingPrice = hasImage ? PRICE_CONFIG.printing : 0;
    const stickerCount = objects.filter(o => o.type === 'sticker').length;
    const stickerPrice = stickerCount * PRICE_CONFIG.stickerPack;
    const engravingPrice = engravingEnabled && engravingText ? PRICE_CONFIG.engraving : 0;

    // getImageData 대신 ref 값 사용 → 매 렌더마다 readback 없음
    const drawingPrice = hasDrawingRef.current ? PRICE_CONFIG.printing : 0;

    const total = bottlePrice + Math.max(printingPrice, drawingPrice) + stickerPrice + engravingPrice;
    return {
      bottlePrice,
      printingPrice: Math.max(printingPrice, drawingPrice),
      stickerPrice,
      engravingPrice,
      total,
    };
  };

  // ── 모든 레이어를 합성한 미리보기 이미지 생성 ────────────────────────
  // SVG공병 → 배경 → 그림판드로잉 → 이미지/스티커오브젝트 → 각인텍스트 순으로
  // 오프스크린 캔버스에 직접 그려서 진짜 보이는 그대로의 이미지를 만든다.
  const generatePreviewImage = () => new Promise((resolve) => {
    const W = 200, H = 280;
    const offscreen = document.createElement('canvas');
    offscreen.width = W;
    offscreen.height = H;
    const ctx = offscreen.getContext('2d', { willReadFrequently: true });

    // 1단계: 배경색 (공병 배경)
    ctx.fillStyle = '#f0ece4';
    ctx.fillRect(0, 0, W, H);

    // 2단계: SVG 공병을 이미지로 변환해서 그리기
    const svgEl = bottleSvgRef.current;
    const svgData = svgEl
      ? new XMLSerializer().serializeToString(svgEl)
      : null;

    const drawRest = () => {
      // 3단계: 그림판 캔버스 드로잉 합성
      try {
        if (canvasRef.current) {
          ctx.drawImage(canvasRef.current, 0, 0);
        }
      } catch {}

      // 4단계: 이미지/스티커 오브젝트 합성
      const imagePromises = objects.map(obj => new Promise((res) => {
        if (obj.type === 'image') {
          const img = new Image();
          img.onload = () => {
            ctx.drawImage(img, obj.x, obj.y, obj.w, obj.h);
            res();
          };
          img.onerror = () => res();
          img.src = obj.src;
        } else if (obj.type === 'sticker') {
          // 이모지 스티커는 텍스트로 직접 그리기
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
        // 5단계: 각인 텍스트 합성
        if (engravingEnabled && engravingText) {
          ctx.font = 'italic 11px Georgia, serif';
          ctx.fillStyle = '#a08040';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.letterSpacing = '2px';
          ctx.fillText(engravingText, W / 2, H - 40);
        }

        // 최종 JPEG 0.5 품질로 추출 (300KB 초과 시 null)
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
      img.onload = () => {
        ctx.drawImage(img, 0, 0, W, H);
        URL.revokeObjectURL(url);
        drawRest();
      };
      img.onerror = () => drawRest();
      img.src = url;
    } else {
      drawRest();
    }
  });

  // ── 저장 (백엔드 API 호출) ─────────────────────────────────────────────
  // POST /api/custom/designs      (신규)
  // PUT  /api/custom/designs/{id} (수정)
  const handleSave = async () => {
    if (!designName.trim()) { alert('디자인 이름을 입력해주세요.'); return; }

    const prices = calcPrices();

    // 모든 레이어(공병SVG + 드로잉 + 오브젝트 + 각인)를 합성한 진짜 미리보기
    let previewUrl = null;
    try {
      previewUrl = await generatePreviewImage();
    } catch {}

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
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
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

  // ── 렌더링 ────────────────────────────────────────────────────────────
  const allBottles = [...DEFAULT_BOTTLES, ...adminBottles];
  const prices = calcPrices();

  const tabs = [
    { id: 'bottle',    label: '공병 선택' },
    { id: 'draw',      label: '그림판' },
    { id: 'upload',    label: '이미지 업로드' },
    { id: 'sticker',   label: '스티커' },
    { id: 'engraving', label: '각인' },
    { id: 'save',      label: '저장' },
  ];

  return (
    <div className="fixed inset-0 z-[200] bg-black/70 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-[#faf8f3] w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl border border-[#c9a961]/30 overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-[#c9a961]/20 bg-white">
          <div>
            <div className="text-[9px] tracking-[0.4em] text-[#c9a961] italic mb-1">DESIGN STUDIO</div>
            <h2 className="font-serif text-xl text-[#1a1a1a] tracking-widest">CUSTOMIZING</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:text-[#c9a961] transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* 탭 바 */}
        <div className="flex border-b border-[#c9a961]/20 bg-white overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-3 text-[11px] tracking-widest whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-[#c9a961] text-[#c9a961]'
                  : 'border-transparent text-[#8b8278] hover:text-[#2a2620]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 메인 영역 */}
        <div className="flex flex-1 overflow-hidden">

          {/* ── 왼쪽: 공병 미리보기 (항상 표시) ── */}
          <div className="relative w-72 min-w-[280px] bg-[#f0ece4] flex flex-col items-center justify-center border-r border-[#c9a961]/20 select-none">
            <div className="relative" style={{ width: 200, height: 280 }}>

              {/* 공병 SVG - ref 연결로 저장 시 합성 이미지에 포함 */}
              <div className="absolute inset-0 pointer-events-none">
                <BottleSVG ref={bottleSvgRef} shape={selectedBottle.shape} fillColor={bottleColor} width={200} height={280} />
              </div>

              {/* 그림 캔버스 */}
              <canvas
                ref={canvasRef}
                width={200}
                height={280}
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

              {/* 오브젝트 레이어 */}
              {objects.map(obj => (
                <div
                  key={obj.id}
                  style={{
                    position: 'absolute', left: obj.x, top: obj.y,
                    width: obj.w, height: obj.h, zIndex: 20,
                    cursor: 'move',
                    border: selectedObjId === obj.id ? '1.5px dashed #c9a961' : 'none',
                    boxSizing: 'border-box', userSelect: 'none',
                  }}
                  onMouseDown={(e) => onObjMouseDown(e, obj.id)}
                >
                  {obj.type === 'image' ? (
                    <img src={obj.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }} draggable={false} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.min(obj.w, obj.h) * 0.75, lineHeight: 1, pointerEvents: 'none' }}>
                      {obj.text}
                    </div>
                  )}

                  {/* 선택 시 컨트롤 */}
                  {selectedObjId === obj.id && (
                    <>
                      <button onClick={() => deleteObject(obj.id)}
                        style={{ position: 'absolute', top: -10, right: -10, background: '#ff4444', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', zIndex: 30 }}>
                        ×
                      </button>
                      <button onClick={() => resizeObject(obj.id, 10)}
                        style={{ position: 'absolute', bottom: -10, right: -10, background: '#c9a961', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'se-resize', border: 'none', zIndex: 30 }}
                        title="크게">
                        +
                      </button>
                      <button onClick={() => resizeObject(obj.id, -10)}
                        style={{ position: 'absolute', bottom: -10, left: -10, background: '#8b8278', color: 'white', borderRadius: '50%', width: 20, height: 20, fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', zIndex: 30 }}
                        title="작게">
                        -
                      </button>
                    </>
                  )}
                </div>
              ))}

              {/* 각인 텍스트 미리보기 */}
              {engravingEnabled && engravingText && (
                <div style={{
                  position: 'absolute', bottom: 40, left: 0, right: 0,
                  textAlign: 'center', fontSize: 11, color: '#a08040',
                  fontFamily: 'Georgia, serif', fontStyle: 'italic',
                  letterSpacing: 2, pointerEvents: 'none', zIndex: 5,
                  textShadow: '0 0 4px rgba(255,255,255,0.5)',
                }}>
                  {engravingText}
                </div>
              )}
            </div>

            {/* 공병 이름 & 색상 */}
            <div className="mt-4 text-center">
              <div className="text-xs tracking-widest text-[#8b8278] italic">{selectedBottle.name}</div>
              <div className="text-[#c9a961] text-xs mt-1">₩{selectedBottle.basePrice.toLocaleString()}</div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-[9px] tracking-widest text-[#8b8278]">병 색상</span>
              <input type="color" value={bottleColor} onChange={e => setBottleColor(e.target.value)}
                className="w-8 h-6 border border-[#c9a961]/30 cursor-pointer bg-transparent" />
            </div>
          </div>

          {/* ── 오른쪽: 탭별 컨텐츠 ── */}
          <div className="flex-1 overflow-y-auto p-6">

            {/* 공병 선택 탭 */}
            {activeTab === 'bottle' && (
              <div>
                <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-5 uppercase">공병 디자인 선택</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allBottles.map(bottle => (
                    <button
                      key={bottle.id}
                      onClick={() => setSelectedBottle(bottle)}
                      className={`flex flex-col items-center p-4 border transition-all ${
                        selectedBottle.id === bottle.id
                          ? 'border-[#c9a961] bg-[#c9a961]/5'
                          : 'border-[#c9a961]/20 hover:border-[#c9a961]/60 bg-white'
                      }`}
                    >
                      <BottleSVG shape={bottle.shape} fillColor={bottleColor} width={70} height={100} />
                      <span className="text-[10px] tracking-wider text-[#2a2620] mt-2">{bottle.name}</span>
                      <span className="text-[9px] text-[#c9a961] mt-1">₩{bottle.basePrice.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 그림판 탭 */}
            {activeTab === 'draw' && (
              <div>
                <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-5 uppercase">그림판</h3>
                <div className="bg-white border border-[#c9a961]/20 p-5 space-y-5">
                  <div className="flex items-center gap-3 flex-wrap">
                    <button onClick={() => setDrawMode('pen')}
                      className={`flex items-center gap-2 px-4 py-2 text-[11px] tracking-wider border transition-all ${drawMode === 'pen' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#c9a961]/30 text-[#8b8278]'}`}>
                      <Pen size={13} /> 펜
                    </button>
                    <button onClick={() => setDrawMode('eraser')}
                      className={`flex items-center gap-2 px-4 py-2 text-[11px] tracking-wider border transition-all ${drawMode === 'eraser' ? 'bg-[#1a1a1a] text-white border-[#1a1a1a]' : 'border-[#c9a961]/30 text-[#8b8278]'}`}>
                      <Eraser size={13} /> 지우개
                    </button>
                    <button onClick={clearCanvas}
                      className="flex items-center gap-2 px-4 py-2 text-[11px] tracking-wider border border-red-200 text-red-300 hover:bg-red-50 transition-all">
                      <RotateCcw size={13} /> 전체 지우기
                    </button>
                  </div>

                  <div className="flex items-center gap-6 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] tracking-wider text-[#8b8278]">색상</span>
                      <input type="color" value={penColor} onChange={e => setPenColor(e.target.value)}
                        className="w-8 h-8 cursor-pointer border border-[#c9a961]/30" disabled={drawMode === 'eraser'} />
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] tracking-wider text-[#8b8278]">굵기</span>
                      <input type="range" min={1} max={20} value={penSize}
                        onChange={e => setPenSize(Number(e.target.value))}
                        className="w-28 accent-[#c9a961]" />
                      <span className="text-[10px] text-[#c9a961] w-4">{penSize}px</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] tracking-wider text-[#8b8278] mr-2">빠른 색상</span>
                    {['#c9a961', '#1a1a1a', '#ffffff', '#8b8278', '#2a2620', '#e8dcc8', '#ff6b6b', '#74b9ff', '#55efc4', '#fd79a8', '#a29bfe'].map(c => (
                      <button key={c}
                        onClick={() => { setPenColor(c); setDrawMode('pen'); }}
                        style={{ background: c, border: penColor === c ? '2px solid #c9a961' : '1.5px solid #ddd' }}
                        className="w-7 h-7 rounded-full transition-transform hover:scale-110" />
                    ))}
                  </div>

                  <p className="text-[9px] text-[#8b8278] italic tracking-widest">
                    ✦ 왼쪽 공병 위에서 직접 그리세요.
                  </p>
                </div>
              </div>
            )}

            {/* 이미지 업로드 탭 */}
            {activeTab === 'upload' && (
              <div>
                <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-5 uppercase">이미지 업로드</h3>
                <div
                  className="border-2 border-dashed border-[#c9a961]/40 bg-white p-12 text-center cursor-pointer hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all"
                  onDrop={(e) => { e.preventDefault(); handleImageUpload(e.dataTransfer.files[0]); }}
                  onDragOver={e => e.preventDefault()}
                  onClick={() => document.getElementById('img-upload-input').click()}
                >
                  <Upload size={32} className="mx-auto mb-4 text-[#c9a961]/60" />
                  <p className="text-[12px] tracking-widest text-[#8b8278] mb-2">이미지를 드래그하거나 클릭하여 업로드</p>
                  <p className="text-[9px] text-[#c9a961]/60 italic">PNG, JPG, SVG, WEBP 지원</p>
                  <input id="img-upload-input" type="file" accept="image/*" className="hidden"
                    onChange={e => handleImageUpload(e.target.files[0])} />
                </div>

                {objects.filter(o => o.type === 'image').length > 0 && (
                  <div className="mt-6">
                    <div className="text-[10px] tracking-widest text-[#8b8278] mb-3">업로드된 이미지</div>
                    <div className="flex flex-wrap gap-3">
                      {objects.filter(o => o.type === 'image').map(obj => (
                        <div key={obj.id} className="relative w-16 h-16 border border-[#c9a961]/20 overflow-hidden">
                          <img src={obj.src} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => deleteObject(obj.id)}
                            className="absolute top-0 right-0 bg-red-500 text-white w-4 h-4 text-[10px] flex items-center justify-center">×</button>
                        </div>
                      ))}
                    </div>
                    <p className="mt-3 text-[9px] text-[#8b8278] italic">왼쪽 미리보기에서 드래그로 위치를 조절하세요.</p>
                  </div>
                )}
              </div>
            )}

            {/* 스티커 탭 */}
            {activeTab === 'sticker' && (
              <div>
                <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-5 uppercase">스티커</h3>

                <div className="bg-white border border-[#c9a961]/20 p-5 mb-5">
                  <div className="text-[10px] tracking-widest text-[#8b8278] mb-3">기본 스티커 팩</div>
                  <div className="flex flex-wrap gap-3">
                    {BUILT_IN_STICKERS.map(s => (
                      <button key={s} onClick={() => addSticker(s)}
                        className="w-12 h-12 text-2xl flex items-center justify-center border border-[#c9a961]/20 hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all hover:scale-110">
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white border border-[#c9a961]/20 p-5">
                  <div className="text-[10px] tracking-widest text-[#8b8278] mb-3">커스텀 스티커 파일 업로드</div>
                  <label className="flex items-center gap-3 px-5 py-3 border border-dashed border-[#c9a961]/40 cursor-pointer hover:border-[#c9a961] hover:bg-[#c9a961]/5 transition-all w-fit">
                    <Upload size={14} className="text-[#c9a961]/60" />
                    <span className="text-[11px] tracking-wider text-[#8b8278]">이미지 파일 선택</span>
                    <input type="file" accept="image/*" className="hidden"
                      onChange={e => handleStickerFileUpload(e.target.files[0])} />
                  </label>
                  <p className="text-[9px] text-[#8b8278]/60 italic mt-2">PNG (투명배경) 권장</p>
                </div>

                <p className="mt-3 text-[9px] text-[#8b8278] italic">
                  ✦ 스티커 클릭 시 공병 위에 추가됩니다. 미리보기에서 드래그로 위치 조절.
                </p>
              </div>
            )}

            {/* 각인 탭 */}
            {activeTab === 'engraving' && (
              <div>
                <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-5 uppercase">각인 (Engraving)</h3>
                <div className="bg-white border border-[#c9a961]/20 p-6 space-y-5">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="engraving-toggle" checked={engravingEnabled}
                      onChange={e => setEngravingEnabled(e.target.checked)}
                      className="accent-[#c9a961] w-4 h-4" />
                    <label htmlFor="engraving-toggle" className="text-[11px] tracking-widest text-[#2a2620] cursor-pointer">
                      각인 추가하기 (+₩{PRICE_CONFIG.engraving.toLocaleString()})
                    </label>
                  </div>
                  {engravingEnabled && (
                    <div className="space-y-3 pl-7">
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
            )}

            {/* 저장 탭 */}
            {activeTab === 'save' && (
              <div>
                <h3 className="text-[11px] tracking-[0.3em] text-[#8b8278] mb-5 uppercase">저장 및 가격</h3>
                <div className="bg-white border border-[#c9a961]/20 p-6 space-y-6">
                  <div>
                    <label className="text-[10px] tracking-wider text-[#8b8278] block mb-2">디자인 이름 *</label>
                    <input type="text" value={designName}
                      onChange={e => setDesignName(e.target.value)}
                      placeholder="나만의 디자인 이름"
                      className="w-full max-w-sm border-b border-[#c9a961]/40 bg-transparent text-sm text-[#2a2620] pb-2 outline-none placeholder-[#8b8278]/50 focus:border-[#c9a961]" />
                  </div>

                  {/* 가격 내역 */}
                  <div className="space-y-2 border-t border-[#c9a961]/10 pt-5">
                    <div className="text-[10px] tracking-widest text-[#8b8278] mb-3">가격 내역</div>
                    <div className="flex justify-between text-[11px] tracking-wider text-[#2a2620]">
                      <span>공병 ({selectedBottle.name})</span>
                      <span>₩{prices.bottlePrice.toLocaleString()}</span>
                    </div>
                    {prices.printingPrice > 0 && (
                      <div className="flex justify-between text-[11px] tracking-wider text-[#2a2620]">
                        <span>이미지/프린팅</span>
                        <span>₩{prices.printingPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {prices.stickerPrice > 0 && (
                      <div className="flex justify-between text-[11px] tracking-wider text-[#2a2620]">
                        <span>스티커 ({objects.filter(o => o.type === 'sticker').length}개)</span>
                        <span>₩{prices.stickerPrice.toLocaleString()}</span>
                      </div>
                    )}
                    {prices.engravingPrice > 0 && (
                      <div className="flex justify-between text-[11px] tracking-wider text-[#2a2620]">
                        <span>각인</span>
                        <span>₩{prices.engravingPrice.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="h-[1px] bg-[#c9a961]/20 my-3" />
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
            )}

          </div>
        </div>

        {/* 하단 가격 바 */}
        <div className="flex items-center justify-between px-8 py-3 bg-white border-t border-[#c9a961]/20 text-[11px] tracking-widest">
          <span className="text-[#8b8278]">현재 예상 금액</span>
          <span className="text-[#c9a961] font-bold">₩{prices.total.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

export default CustomizationEditor;