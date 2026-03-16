/**
 * Collections.jsx — 리뉴얼 v2
 *
 * [적용된 패치 전체]
 * 1. API 최적화: notesCache(노트 중복호출 방지), isHandling(중복클릭 방지), scheduleGeminiRef(타이머 중복 방지)
 * 2. Gemini 모델: gemini-2.5-flash-lite (안정적 무료 tier)
 * 3. 한줄평 레이아웃 분리: DEFAULT_LAYOUT에 review* 필드 추가, 레이아웃 에디터 섹션 추가, 독립 position:absolute 블록으로 렌더링
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { Upload, Settings, X, Save, Check } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// ─────────────────────────────────────
// 상수
// ─────────────────────────────────────

const SHELF_SIZE = 16;

const fmtKRW = (n) => (n != null ? `₩${Number(n).toLocaleString()}` : '-');
const checkIsAdmin = () =>
  sessionStorage.getItem('isAdmin') === 'true' &&
  sessionStorage.getItem('isLoggedIn') === 'true';

const SPINE_PALETTE = [
  { bg: '#4a2c10', accent: '#c9a961', grain: '#3a2008' },
  { bg: '#2e1a06', accent: '#d4a853', grain: '#221302' },
  { bg: '#5c3518', accent: '#e0c070', grain: '#482810' },
  { bg: '#3a2410', accent: '#b8954f', grain: '#2c1c0a' },
  { bg: '#6b3f1e', accent: '#f0d080', grain: '#542e14' },
  { bg: '#4f3015', accent: '#c9a961', grain: '#3c2410' },
  { bg: '#382010', accent: '#ddb870', grain: '#2c180c' },
  { bg: '#5a3820', accent: '#cfaa4a', grain: '#452c18' },
  { bg: '#3c2812', accent: '#e0be78', grain: '#2c1e0e' },
  { bg: '#622e14', accent: '#c9a961', grain: '#4c2210' },
];

const SPINE_HEIGHTS = [108, 124, 96, 132, 112, 104, 128, 90, 118, 108, 134, 98, 120, 110, 100, 130];

// ─────────────────────────────────────
// DEFAULT_LAYOUT
// ─────────────────────────────────────
const DEFAULT_LAYOUT = {
  imgLeft:          '30',
  imgTop:           '44',
  imgMaxHeight:     '40%',
  imgMaxWidth:      '20%',
  imgBlendStrength: '18',

  nameLeft:  '30',
  nameTop:   '75',
  nameWidth: '28%',
  nameAlign: 'center',

  nameFontSize:      '1.6rem',
  nameFontWeight:    '600',
  nameColor:         '#3d1f08',
  nameLetterSpacing: '0.06em',

  brandFontSize:      '0.62rem',
  brandColor:         '#7a4a1e',
  brandLetterSpacing: '0.35em',

  dividerLeft:      '50',
  dividerTopPct:    '25',
  dividerBottomPct: '75',
  dividerColor:     'rgba(100,60,20,0.4)',

  noteLeft:  '58',
  noteTop:   '20',
  noteWidth: '29%',

  noteLabelFontSize:      '0.7rem',
  noteLabelColor:         '#7a4a1e',
  noteLabelLetterSpacing: '0.28em',

  noteValueFontSize:   '0.84rem',
  noteValueColor:      '#3d1f08',
  noteValueLineHeight: '1.65',
  noteGap:             '0.9rem',
  noteDividerColor:    'rgba(100,60,20,0.2)',

  // ── 한줄평 (Gemini) ★ 신규
  reviewLeft:       '58',
  reviewTop:        '72',
  reviewWidth:      '29%',
  reviewFontSize:   '1.2rem',
  reviewColor:      '#3d1f08',
  reviewLineHeight: '1.6',
  reviewOpacity:    '0.85',
  reviewFontStyle:  'italic',
};

const uploadToSupabase = async (file) => {
  const ext = file.name.split('.').pop();
  const path = `collections/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
  const { error } = await supabase.storage.from('images').upload(path, file, { cacheControl: '3600', upsert: false });
  if (error) throw new Error('업로드 실패: ' + error.message);
  return supabase.storage.from('images').getPublicUrl(path).data.publicUrl;
};

// ─────────────────────────────────────
// 배경 이미지 패널 (관리자)
// ─────────────────────────────────────
function BgImagePanel({ currentUrl, onUploaded, onClose }) {
  const [mode, setMode] = useState('file');
  const [urlInput, setUrlInput] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleFile = async (files) => {
    if (!files?.[0]) return;
    setUploading(true);
    try { const url = await uploadToSupabase(files[0]); onUploaded(url); onClose(); }
    catch (err) { alert(err.message); }
    finally { setUploading(false); }
  };

  const css = {
    panel: { width: '280px', background: 'rgba(14,8,2,0.97)', border: '1px solid rgba(201,169,97,0.4)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid rgba(201,169,97,0.2)' },
    label: { fontSize: '0.58rem', letterSpacing: '0.45em', color: '#c9a961' },
    tab: (active) => ({
      flex: 1, padding: '6px 0', fontSize: '0.58rem', letterSpacing: '0.2em',
      border: '1px solid', cursor: 'pointer',
      borderColor: active ? 'rgba(201,169,97,0.6)' : 'rgba(201,169,97,0.2)',
      color: active ? '#c9a961' : 'rgba(250,246,239,0.35)',
      background: active ? 'rgba(201,169,97,0.12)' : 'transparent',
    }),
    dropzone: { border: '2px dashed rgba(201,169,97,0.3)', padding: '24px 12px', textAlign: 'center', cursor: 'pointer' },
    input: { flex: 1, background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(201,169,97,0.25)', padding: '7px 10px', fontSize: '0.72rem', color: '#faf6ef', outline: 'none' },
  };

  return (
    <div style={{ ...css.panel, position: 'absolute', top: '112px', right: 0, zIndex: 40 }}>
      <div style={css.header}>
        <span style={css.label}>BACKGROUND IMAGE</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(250,246,239,0.4)', cursor: 'pointer' }}><X size={13} /></button>
      </div>
      <div style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ display: 'flex', gap: '6px' }}>
          {[['file', '파일 업로드'], ['url', 'URL 입력']].map(([m, l]) => (
            <button key={m} onClick={() => setMode(m)} style={css.tab(mode === m)}>{l}</button>
          ))}
        </div>
        {mode === 'file' ? (
          <div style={css.dropzone} onClick={() => document.getElementById('bg-upload-inp').click()}>
            {uploading
              ? <p style={{ color: '#c9a961', fontSize: '0.78rem', letterSpacing: '0.15em' }}>업로드 중...</p>
              : <>
                <Upload size={16} style={{ margin: '0 auto 6px', color: 'rgba(201,169,97,0.5)' }} />
                <p style={{ fontSize: '0.72rem', color: 'rgba(250,246,239,0.55)' }}>클릭하여 이미지 선택</p>
                <p style={{ fontSize: '0.62rem', color: 'rgba(250,246,239,0.25)', marginTop: '3px' }}>JPG · PNG · WEBP</p>
              </>}
            <input id="bg-upload-inp" type="file" accept="image/*" hidden onChange={e => handleFile(e.target.files)} />
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '6px' }}>
            <input value={urlInput} onChange={e => setUrlInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && urlInput.trim()) { onUploaded(urlInput.trim()); onClose(); } }}
              placeholder="https://..." style={css.input} />
            <button onClick={() => { if (urlInput.trim()) { onUploaded(urlInput.trim()); onClose(); } }}
              style={{ padding: '7px 10px', background: 'rgba(201,169,97,0.2)', border: '1px solid rgba(201,169,97,0.4)', color: '#c9a961', cursor: 'pointer' }}>
              <Check size={13} />
            </button>
          </div>
        )}
        {currentUrl && (
          <div style={{ borderTop: '1px solid rgba(201,169,97,0.15)', paddingTop: '10px' }}>
            <p style={{ fontSize: '0.58rem', color: 'rgba(250,246,239,0.28)', letterSpacing: '0.2em', marginBottom: '5px' }}>현재 이미지</p>
            <img src={currentUrl} alt="" style={{ width: '100%', height: '56px', objectFit: 'cover', opacity: 0.55 }} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// 레이아웃 에디터 (관리자) — 실시간 미리보기 포함
// ─────────────────────────────────────
function LayoutEditor({ layout, bgUrl, bgRatio, onSave, onClose }) {
  const [local, setLocal] = useState({ ...layout });
  const set = (k, v) => setLocal(p => ({ ...p, [k]: v }));

  const PREVIEW = {
    name: '향수 이름 예시',
    brand_name: 'BRAND NAME',
    thumbnail: null,
    notes: {
      top:    ['베르가못', '레몬', '네롤리'],
      middle: ['로즈', '재스민', '아이리스'],
      base:   ['머스크', '샌달우드', '앰버'],
    },
  };

  const SECTIONS = [
    {
      title: '향수 이미지 — 위치 (컨테이너 기준 %)',
      fields: [
        ['imgLeft',          '중심 X (0~100)'],
        ['imgTop',           '중심 Y (0~100)'],
        ['imgMaxHeight',     '박스 높이 (예: 58%)'],
        ['imgMaxWidth',      '박스 너비 (예: 20%)'],
        ['imgBlendStrength', '타원 블렌딩 강도 (0~50)'],
      ],
    },
    {
      title: '향수 이름 — 위치 (컨테이너 기준 %)',
      fields: [
        ['nameLeft',  '중심 X (0~100)'],
        ['nameTop',   'Y (0~100)'],
        ['nameWidth', '박스 너비 (예: 30%)'],
        ['nameAlign', '정렬 (left/center/right)'],
      ],
    },
    {
      title: '향수 이름 — 스타일',
      fields: [
        ['nameFontSize',      '크기'],
        ['nameFontWeight',    '굵기'],
        ['nameColor',         '색',   'color'],
        ['nameLetterSpacing', '자간'],
        ['brandFontSize',     '브랜드 크기'],
        ['brandColor',        '브랜드 색', 'color'],
        ['brandLetterSpacing','브랜드 자간'],
      ],
    },
    {
      title: '가운데 구분선 — 위치 (컨테이너 기준 %)',
      fields: [
        ['dividerLeft',       'X 위치 (0~100)'],
        ['dividerTopPct',     '시작 Y (0~100)'],
        ['dividerBottomPct',  '끝 Y (0~100)'],
        ['dividerColor',      '선 색', 'color'],
      ],
    },
    {
      title: '노트 영역 — 위치 (컨테이너 기준 %)',
      fields: [
        ['noteLeft',  '시작 X (0~100)'],
        ['noteTop',   '시작 Y (0~100)'],
        ['noteWidth', '박스 너비 (예: 30%)'],
      ],
    },
    {
      title: '노트 — 라벨 스타일',
      fields: [
        ['noteLabelFontSize',      '라벨 크기'],
        ['noteLabelColor',         '라벨 색',  'color'],
        ['noteLabelLetterSpacing', '라벨 자간'],
      ],
    },
    {
      title: '노트 — 값 스타일',
      fields: [
        ['noteValueFontSize',   '값 크기'],
        ['noteValueColor',      '값 색',    'color'],
        ['noteValueLineHeight', '줄 높이'],
        ['noteGap',             '섹션 간격'],
        ['noteDividerColor',    '구분선 색', 'color'],
      ],
    },
    // ★ 한줄평 섹션 신규
    {
      title: '한줄평 (Gemini) — 위치',
      fields: [
        ['reviewLeft',  '시작 X (0~100)'],
        ['reviewTop',   '시작 Y (0~100)'],
        ['reviewWidth', '박스 너비 (예: 29%)'],
      ],
    },
    {
      title: '한줄평 (Gemini) — 스타일',
      fields: [
        ['reviewFontSize',   '글씨 크기'],
        ['reviewColor',      '글씨 색',   'color'],
        ['reviewLineHeight', '줄 높이'],
        ['reviewOpacity',    '투명도 (0~1)'],
        ['reviewFontStyle',  '스타일 (italic/normal)'],
      ],
    },
  ];

  const inputStyle = {
    background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(201,169,97,0.22)',
    padding: '4px 8px', fontSize: '0.68rem', color: '#faf6ef', outline: 'none', flex: 1,
  };

  const l = local;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(5px)', display: 'flex', gap: 0, overflow: 'hidden' }}>

      {/* 좌측: 컨트롤 패널 */}
      <div style={{ width: '420px', flexShrink: 0, background: '#0e0802', borderRight: '1px solid rgba(201,169,97,0.3)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid rgba(201,169,97,0.2)', flexShrink: 0 }}>
          <div>
            <p style={{ fontSize: '0.52rem', letterSpacing: '0.5em', color: '#c9a961', marginBottom: '3px', margin: '0 0 3px' }}>ADMIN · LAYOUT EDITOR</p>
            <h2 style={{ fontSize: '0.85rem', letterSpacing: '0.2em', color: '#faf6ef', fontWeight: 400, margin: 0 }}>오버레이 레이아웃 수정</h2>
          </div>
          <div style={{ display: 'flex', gap: '7px' }}>
            <button onClick={() => onSave(local)}
              style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '7px 16px', background: '#c9a961', color: '#0e0802', fontSize: '0.58rem', letterSpacing: '0.3em', border: 'none', cursor: 'pointer' }}>
              <Save size={10} /> 저장
            </button>
            <button onClick={() => setLocal({ ...DEFAULT_LAYOUT })}
              style={{ padding: '7px 10px', background: 'transparent', border: '1px solid rgba(201,169,97,0.3)', color: 'rgba(201,169,97,0.6)', fontSize: '0.58rem', letterSpacing: '0.2em', cursor: 'pointer' }}>
              초기화
            </button>
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(250,246,239,0.4)', cursor: 'pointer', padding: '4px' }}><X size={16} /></button>
          </div>
        </div>

        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {SECTIONS.map(sec => (
            <div key={sec.title}>
              <p style={{ fontSize: '0.52rem', letterSpacing: '0.35em', color: '#c9a961', paddingBottom: '7px', borderBottom: '1px solid rgba(201,169,97,0.2)', marginBottom: '10px', margin: '0 0 10px' }}>
                {sec.title.toUpperCase()}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px' }}>
                {sec.fields.map(([k, label, type]) => (
                  <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <label style={{ fontSize: '0.58rem', color: 'rgba(201,169,97,0.65)', minWidth: '64px', flexShrink: 0 }}>{label}</label>
                    {type === 'color' ? (
                      <div style={{ display: 'flex', gap: '4px', flex: 1 }}>
                        <input type="color" value={(() => {
                          const v = local[k];
                          return v?.startsWith('#') ? v : '#c9a961';
                        })()} onChange={e => set(k, e.target.value)}
                          style={{ height: '24px', width: '28px', border: '1px solid rgba(201,169,97,0.3)', background: 'none', cursor: 'pointer', padding: 0 }} />
                        <input type="text" value={local[k]} onChange={e => set(k, e.target.value)} style={{ ...inputStyle, flex: 1 }} />
                      </div>
                    ) : (
                      <input type="text" value={local[k]} onChange={e => set(k, e.target.value)} style={inputStyle} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 우측: 실시간 미리보기 */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px', overflow: 'hidden' }}>
        <p style={{ fontSize: '0.52rem', letterSpacing: '0.45em', color: 'rgba(201,169,97,0.5)', marginBottom: '12px' }}>LIVE PREVIEW</p>

        <div style={{ position: 'relative', width: '100%', maxWidth: '860px', aspectRatio: `${bgRatio}/1`, overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            background: l.bgContainerColor ?? '#2a1508',
            ...(bgUrl ? {
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: '100% 100%',
              backgroundRepeat: 'no-repeat',
            } : {}),
          }} />

          <div style={{ position: 'absolute', inset: 0 }}>
            {/* 이미지 자리 */}
            <div style={{
              position: 'absolute',
              left: `${l.imgLeft}%`, top: `${l.imgTop}%`,
              transform: 'translate(-50%, -50%)',
              width: l.imgMaxWidth, height: l.imgMaxHeight,
              background: 'rgba(100,60,20,0.12)',
              border: '2px dashed rgba(201,169,97,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ color: 'rgba(201,169,97,0.6)', fontSize: '1.2rem' }}>✦</span>
            </div>

            {/* 이름 */}
            <div style={{
              position: 'absolute',
              left: `${l.nameLeft}%`, top: `${l.nameTop}%`,
              transform: 'translate(-50%, -50%)',
              width: l.nameWidth, textAlign: l.nameAlign,
            }}>
              <h2 style={{ fontSize: l.nameFontSize, fontWeight: l.nameFontWeight, color: l.nameColor, letterSpacing: l.nameLetterSpacing, margin: '0 0 3px', lineHeight: 1.2 }}>
                {PREVIEW.name}
              </h2>
              <p style={{ fontSize: l.brandFontSize, color: l.brandColor, letterSpacing: l.brandLetterSpacing, textTransform: 'uppercase', margin: 0 }}>
                {PREVIEW.brand_name}
              </p>
            </div>

            {/* 구분선 */}
            <div style={{
              position: 'absolute',
              left: `${l.dividerLeft}%`,
              top: `${l.dividerTopPct}%`,
              bottom: `${100 - parseFloat(l.dividerBottomPct)}%`,
              width: '1px',
              background: `linear-gradient(to bottom, transparent, ${l.dividerColor} 15%, ${l.dividerColor} 85%, transparent)`,
            }} />

            {/* 노트 */}
            <div style={{ position: 'absolute', left: `${l.noteLeft}%`, top: `${l.noteTop}%`, width: l.noteWidth }}>
              {[
                { key: 'top',    label: 'Top',    items: PREVIEW.notes.top },
                { key: 'middle', label: 'Middle', items: PREVIEW.notes.middle },
                { key: 'base',   label: 'Base',   items: PREVIEW.notes.base },
              ].map(({ key, label, items }, idx) => (
                <div key={key} style={{ marginBottom: idx < 2 ? l.noteGap : 0 }}>
                  {idx > 0 && <div style={{ height: '0.5px', background: l.noteDividerColor, marginBottom: l.noteGap }} />}
                  <p style={{ fontSize: l.noteLabelFontSize, fontWeight: '600', fontStyle: 'italic', color: l.noteLabelColor, letterSpacing: l.noteLabelLetterSpacing, margin: '0 0 3px' }}>{label}</p>
                  <p style={{ fontSize: l.noteValueFontSize, color: l.noteValueColor, lineHeight: l.noteValueLineHeight, margin: 0 }}>{items.join('  ·  ')}</p>
                </div>
              ))}
            </div>

            {/* ★ 한줄평 미리보기 */}
            <div style={{ position: 'absolute', left: `${l.reviewLeft}%`, top: `${l.reviewTop}%`, width: l.reviewWidth }}>
              <div style={{ paddingTop: '10px', borderTop: `0.5px solid ${l.noteDividerColor}` }}>
                <p style={{ fontSize: l.reviewFontSize, color: l.reviewColor, fontStyle: l.reviewFontStyle, lineHeight: l.reviewLineHeight, margin: 0, opacity: parseFloat(l.reviewOpacity) }}>
                  "빛과 어둠 사이 피어난 향기"
                </p>
              </div>
            </div>

            {/* 가이드 오버레이 */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.25 }}>
              <rect x="13%" y="20%" width="74%" height="60%" fill="none" stroke="#c9a961" strokeWidth="0.8" strokeDasharray="4,4" />
              <line x1="50%" y1="0" x2="50%" y2="100%" stroke="#c9a961" strokeWidth="0.5" strokeDasharray="2,6" />
              <line x1="0" y1="50%" x2="100%" y2="50%" stroke="#c9a961" strokeWidth="0.5" strokeDasharray="2,6" />
            </svg>
          </div>

          <div style={{ position: 'absolute', bottom: '6px', left: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '16px', height: '1px', background: '#c9a961', opacity: 0.4, borderTop: '1px dashed #c9a961' }} />
            <span style={{ fontSize: '0.48rem', color: 'rgba(201,169,97,0.4)', letterSpacing: '0.2em' }}>양피지 글쓰기 영역 가이드</span>
          </div>
        </div>

        <p style={{ fontSize: '0.52rem', color: 'rgba(250,246,239,0.2)', letterSpacing: '0.25em', marginTop: '10px' }}>
          좌측 수치 변경 시 실시간 반영됩니다
        </p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────
// 향수 이미지 컴포넌트
// ─────────────────────────────────────
function PerfumeImage({ perfume, layout: l }) {
  const strength = parseFloat(l.imgBlendStrength || 0);
  const ellipseX = Math.max(40, 100 - strength * 0.8);
  const ellipseY = Math.max(35, 100 - strength * 0.6);

  const maskStyle = strength > 0 ? {
    WebkitMaskImage: `radial-gradient(ellipse ${ellipseX}% ${ellipseY}% at 50% 50%, black 45%, transparent 100%)`,
    maskImage:       `radial-gradient(ellipse ${ellipseX}% ${ellipseY}% at 50% 50%, black 45%, transparent 100%)`,
  } : {};

  return (
    <div style={{
      position: 'absolute',
      left: `${l.imgLeft}%`, top: `${l.imgTop}%`,
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'auto',
      width: l.imgMaxWidth, height: l.imgMaxHeight,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      ...maskStyle,
    }}>
      {perfume.thumbnail ? (
        <img src={perfume.thumbnail} alt={perfume.name}
          style={{ maxWidth: '100%', maxHeight: '100%', width: 'auto', height: 'auto', objectFit: 'contain', display: 'block', transition: 'opacity 0.3s' }} />
      ) : (
        <span style={{ color: 'rgba(100,60,20,0.3)', fontSize: '1.5rem' }}>✦</span>
      )}
    </div>
  );
}

// ─────────────────────────────────────
// 책등 컴포넌트
// ─────────────────────────────────────
function SpineBook({ perfume, isSelected, onClick, globalIdx }) {
  const [hovered, setHovered] = useState(false);
  const pal = SPINE_PALETTE[globalIdx % SPINE_PALETTE.length];
  const h = SPINE_HEIGHTS[globalIdx % SPINE_HEIGHTS.length];

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${perfume.brand_name ? perfume.brand_name + ' · ' : ''}${perfume.name}`}
      style={{
        width: '54px', height: `${h + 20}px`,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end',
        cursor: 'pointer', flexShrink: 0, position: 'relative',
        transform: isSelected ? 'translateY(-14px) scale(1.05)' : hovered ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
        transition: 'transform 0.28s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div style={{
        width: '100%', height: `${h}px`,
        background: `linear-gradient(to right, ${pal.grain} 0%, ${pal.bg} 12%, ${pal.bg} 88%, ${pal.grain} 100%)`,
        borderLeft: `2.5px solid ${pal.accent}55`,
        borderRight: `1px solid rgba(0,0,0,0.6)`,
        borderTop: `1px solid ${pal.accent}33`,
        borderRadius: '1px 1px 0 0',
        boxShadow: isSelected ? `0 -10px 28px rgba(201,169,97,0.35), 3px 3px 10px rgba(0,0,0,0.7)` : `2px 3px 8px rgba(0,0,0,0.55)`,
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: `repeating-linear-gradient(90deg, transparent 0px, transparent 3px, rgba(0,0,0,0.35) 3px, rgba(0,0,0,0.35) 4px, transparent 4px, transparent 9px, rgba(0,0,0,0.18) 9px, rgba(0,0,0,0.18) 10px)` }} />
        {perfume.thumbnail && (
          <img src={perfume.thumbnail} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.15, mixBlendMode: 'luminosity' }} />
        )}
        <div style={{ position: 'absolute', top: '9px', left: 0, right: 0, height: '1px', background: pal.accent, opacity: 0.5 }} />
        <div style={{ position: 'absolute', top: '12px', left: '4px', right: '4px', height: '0.5px', background: pal.accent, opacity: 0.2 }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 4px 8px' }}>
          <p style={{
            writingMode: 'vertical-rl', textOrientation: 'mixed',
            fontSize: '8.5px', letterSpacing: '0.1em', color: pal.accent,
            fontWeight: '500', fontFamily: "'Georgia', serif",
            maxHeight: '75%', overflow: 'hidden', textOverflow: 'ellipsis',
            whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.9)', margin: 0,
          }}>{perfume.name}</p>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: pal.accent, opacity: 0.7 }} />
        {isSelected && <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#c9a961' }} />}
      </div>
      <div style={{ width: '100%', height: '5px', background: `linear-gradient(to bottom, ${pal.bg}, ${pal.grain})`, borderBottom: `1.5px solid ${pal.accent}55`, boxShadow: '0 2px 4px rgba(0,0,0,0.5)' }} />
    </div>
  );
}

// ─────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────
export default function Collections() {
  const isAdmin = checkIsAdmin();
  const location = useLocation();
  const autoSelectDone = useRef(false);
  const navigate = useNavigate();
  const shelfRef = useRef(null);

  const [showWishPopup, setShowWishPopup] = useState(false);
  const [isAddingToWish, setIsAddingToWish] = useState(false);

  const [allPerfumes, setAllPerfumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPerfume, setSelectedPerfume] = useState(null);
  const [notes, setNotes] = useState({ top: [], middle: [], base: [] });
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [geminiReview, setGeminiReview] = useState('');
  const [loadingReview, setLoadingReview] = useState(false);
  const [bgUrl, setBgUrl] = useState(null);
  const [bgRatio, setBgRatio] = useState(2.65);
  const [showBgPanel, setShowBgPanel] = useState(false);
  const [layout, setLayout] = useState({ ...DEFAULT_LAYOUT });
  const [showLayoutEditor, setShowLayoutEditor] = useState(false);

  const handleAddToWishlist = async (perfume) => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }

    setIsAddingToWish(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/wishlist/toggle`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          perfumeId: perfume.perfume_id 
        })
      });

      if (response.ok) {
        setShowWishPopup(true);
      } else {
        const errData = await response.json();
        alert(errData.message || '위시리스트 담기에 실패했습니다.');
      }
    } catch (error) {
      console.error('위시리스트 에러:', error);
      alert('서버와 통신 중 오류가 발생했습니다.');
    } finally {
      setIsAddingToWish(false);
    }
  };

  // 바로 구매하기 함수
  const handleBuyNow = async (perfume) => {
    const token = sessionStorage.getItem('accessToken');
    if (!token) {
      alert('로그인이 필요한 서비스입니다.');
      navigate('/login');
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ perfumeId: perfume.perfume_id, quantity: 1 })
      });
      
      if (response.ok) {
        navigate('/cart');
      } else {
        alert('구매 처리 중 문제가 발생했습니다.');
      }
    } catch (error) {
      console.error('구매 에러:', error);
    }
  };

  // 레이아웃 로드 — DEFAULT_LAYOUT 먼저 깔고 Supabase 값 덮어씌움 → 신규 필드 자동 적용
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('Signature_config').select('value').eq('key', 'collections_layout_v6').maybeSingle();
        if (data?.value) {
          const parsed = typeof data.value === 'string' ? JSON.parse(data.value) : data.value;
          setLayout({ ...DEFAULT_LAYOUT, ...parsed });
        }
      } catch (e) { console.error('레이아웃 로드 실패:', e); }
    })();
  }, []);

  // 배경 이미지 로드
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('Signature_config').select('value').eq('key', 'collections_bg_image').maybeSingle();
        if (data?.value) setBgUrl(typeof data.value === 'string' ? data.value : null);
      } catch {}
    })();
  }, []);

  const saveBgUrl = async (url) => {
    setBgUrl(url);
    try {
      const { data: ex } = await supabase.from('Signature_config').select('id').eq('key', 'collections_bg_image').maybeSingle();
      if (ex) await supabase.from('Signature_config').update({ value: url }).eq('key', 'collections_bg_image');
      else await supabase.from('Signature_config').insert({ key: 'collections_bg_image', value: url });
    } catch (e) { console.error('배경 저장 실패:', e); }
  };

  const handleSaveLayout = async (l) => {
    setLayout(l);
    try {
      const { data: ex } = await supabase.from('Signature_config').select('id').eq('key', 'collections_layout_v6').maybeSingle();
      if (ex) await supabase.from('Signature_config').update({ value: JSON.stringify(l) }).eq('key', 'collections_layout_v6');
      else     await supabase.from('Signature_config').insert({ key: 'collections_layout_v6', value: JSON.stringify(l) });
    } catch (e) { console.error('레이아웃 저장 실패:', e); }
    setShowLayoutEditor(false);
  };

  // 향수 전체 로드
  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const { data: perfumes } = await supabase
          .from('Perfumes')
          .select('perfume_id, name, name_en, description, price, sale_price, sale_rate, brand_id')
          .eq('is_active', true).order('name');
        if (!perfumes?.length) { setAllPerfumes([]); setLoading(false); return; }

        const brandIds = [...new Set(perfumes.map(p => p.brand_id).filter(Boolean))];
        const { data: brands } = await supabase.from('Brands').select('brand_id, brand_name').in('brand_id', brandIds);
        const brandMap = Object.fromEntries((brands || []).map(b => [b.brand_id, b.brand_name]));

        const pIds = perfumes.map(p => p.perfume_id);
        const { data: imgs } = await supabase.from('Perfume_Images').select('perfume_id, image_url').in('perfume_id', pIds).eq('is_thumbnail', true);
        const imgMap = Object.fromEntries((imgs || []).map(i => [i.perfume_id, i.image_url]));

        setAllPerfumes(perfumes.map(p => ({ ...p, brand_name: brandMap[p.brand_id] || '', thumbnail: imgMap[p.perfume_id] || null })));
      } catch (e) { console.error('향수 로드 실패:', e); }
      finally { setLoading(false); }
    })();
  }, []);

  // ─────────────────────────────────────
  // API 최적화 — 캐시 & 중복 방지
  // ─────────────────────────────────────
  const geminiCache  = useRef({});
  const notesCache   = useRef({});     // ★ 노트 캐시 (향수당 1회만 API 호출)
  const geminiTimer  = useRef(null);
  const isRequesting = useRef(false);
  const isHandling   = useRef(false);  // ★ handleSelect 중복 클릭 방지 (300ms)

  const fetchGeminiReview = useCallback(async (perfume, notesData) => {
    const cacheKey = perfume.perfume_id;

    if (geminiCache.current[cacheKey]) {
      setGeminiReview(geminiCache.current[cacheKey]);
      return;
    }
    if (isRequesting.current) {
      setTimeout(() => fetchGeminiReview(perfume, notesData), 500);
      return;
    }

    setLoadingReview(true);
    setGeminiReview('');
    isRequesting.current = true;

    try {
      const noteText = [
        notesData.top?.length    ? `Top: ${notesData.top.join(', ')}`       : '',
        notesData.middle?.length ? `Middle: ${notesData.middle.join(', ')}` : '',
        notesData.base?.length   ? `Base: ${notesData.base.join(', ')}`     : '',
      ].filter(Boolean).join(' / ');

      const prompt = `향수 전문가로서 다음 향수에 대해 감성적이고 시적인 한줄평을 한국어로 작성해주세요. 40자 이내로, 마침표 없이.
향수명: ${perfume.name}${perfume.name_en ? ` (${perfume.name_en})` : ''}
브랜드: ${perfume.brand_name || ''}
${noteText ? `노트: ${noteText}` : ''}`;

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key=${import.meta.env.VITE_GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        }
      );

      if (res.status === 429) {
        setGeminiReview('제미나이가 바쁩니다. 잠시 후 다시 클릭해주세요.');
        setTimeout(() => { isRequesting.current = false; }, 2000);
        setLoadingReview(false);
        return;
      }
      if (!res.ok) throw new Error(`Gemini ${res.status}`);

      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
      if (text) {
        geminiCache.current[cacheKey] = text;
        setGeminiReview(text);
      }
    } catch (e) {
      console.error('Gemini 실패:', e);
      setGeminiReview('평론을 불러오지 못했습니다');
    } finally {
      setLoadingReview(false);
      setTimeout(() => { isRequesting.current = false; }, 500);
    }
  }, []);

  // ★ scheduleGemini — useRef stable reference → 타이머 중복 방지
  const scheduleGeminiRef = useRef(null);
  scheduleGeminiRef.current = (perfume, grouped) => {
    if (geminiTimer.current) clearTimeout(geminiTimer.current);
    geminiTimer.current = setTimeout(() => fetchGeminiReview(perfume, grouped), 3000);
  };
  const scheduleGemini = useCallback((perfume, grouped) => {
    scheduleGeminiRef.current(perfume, grouped);
  }, []);

  // ★ loadNotes — notesCache로 중복 API 호출 차단
  const loadNotes = useCallback(async (perfumeId) => {
    if (notesCache.current[perfumeId]) {
      setNotes(notesCache.current[perfumeId]);
      return notesCache.current[perfumeId];
    }
    setLoadingNotes(true);
    setNotes({ top: [], middle: [], base: [] });
    try {
      const res = await fetch(`${API_BASE_URL}/api/collections/perfumes/${perfumeId}/notes`);
      if (!res.ok) throw new Error(`노트 API ${res.status}`);
      const json = await res.json();
      const grouped = {
        top:    json.data?.top    || [],
        middle: json.data?.middle || [],
        base:   json.data?.base   || [],
      };
      notesCache.current[perfumeId] = grouped;
      setNotes(grouped);
      return grouped;
    } catch (e) { console.error('노트 로드 실패:', e); }
    finally { setLoadingNotes(false); }
    return null;
  }, []);

  // ★ handleSelect — 300ms 중복 클릭 잠금
  const handleSelect = useCallback((p) => {
    if (isHandling.current) return;
    isHandling.current = true;
    setTimeout(() => { isHandling.current = false; }, 300);

    if (selectedPerfume?.perfume_id === p.perfume_id) {
      setSelectedPerfume(null);
      setNotes({ top: [], middle: [], base: [] });
      setGeminiReview('');
      if (geminiTimer.current) clearTimeout(geminiTimer.current);
    } else {
      setSelectedPerfume(p);
      setGeminiReview('');
      if (geminiTimer.current) clearTimeout(geminiTimer.current);
      loadNotes(p.perfume_id).then(grouped => {
        if (grouped) scheduleGemini(p, grouped);
      });
    }
  }, [selectedPerfume, loadNotes, scheduleGemini]);

  useEffect(() => {
    const targetId = location.state?.targetPerfumeId;
    if (targetId && allPerfumes.length > 0 && !autoSelectDone.current) {
      const targetPerfume = allPerfumes.find(p => p.perfume_id === targetId);

      if (targetPerfume) {
        handleSelect(targetPerfume);
        autoSelectDone.current = true;
        window.history.replaceState({}, document.title);

        // 책장 영역으로 스크롤
        setTimeout(() => {
          shelfRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 300);
      }
    }
  }, [location.state, allPerfumes, handleSelect]);

  const selectedIdx = selectedPerfume
    ? allPerfumes.findIndex(p => p.perfume_id === selectedPerfume.perfume_id)
    : -1;
  const canPrev = selectedIdx > 0;
  const canNext = selectedIdx >= 0 && selectedIdx < allPerfumes.length - 1;

  const moveTo = (idx) => {
    const p = allPerfumes[idx];
    if (!p) return;
    setSelectedPerfume(p);
    setGeminiReview('');
    if (geminiTimer.current) clearTimeout(geminiTimer.current);
    loadNotes(p.perfume_id).then(grouped => {
      if (grouped) scheduleGemini(p, grouped);
    });
  };

  const shelves = [];
  for (let i = 0; i < allPerfumes.length; i += SHELF_SIZE) shelves.push(allPerfumes.slice(i, i + SHELF_SIZE));

  const l = layout;

  return (
    <div style={{ minHeight: '100vh', background: '#f5ede0', fontFamily: "'Georgia', 'Times New Roman', serif" }}>

      {/* ─────── 상단: 배경 + 오버레이 ─────── */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: `${bgRatio}/1`, overflow: 'hidden' }}>

        {bgUrl ? (
          <div style={{
            position: 'absolute', inset: 0, zIndex: 1,
            backgroundColor: l.bgContainerColor ?? '#2a1508',
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: '100% 100%',
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center',
          }}>
            <img src={bgUrl} alt="" onLoad={e => {
              const { naturalWidth, naturalHeight } = e.currentTarget;
              if (naturalWidth && naturalHeight) setBgRatio(naturalWidth / naturalHeight);
            }} style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: '1px', height: '1px' }} />
          </div>
        ) : (
          <div style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(135deg, #1a0c04 0%, #3d2010 25%, #2a1508 55%, #4a2e14 80%, #1a0c04 100%)' }}>
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.07 }}>
              <defs><pattern id="wp" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse">
                <path d="M0,40 Q20,35 40,40 Q60,45 80,40" stroke="#c9a961" strokeWidth="0.8" fill="none" />
                <path d="M0,20 Q20,15 40,20 Q60,25 80,20" stroke="#c9a961" strokeWidth="0.5" fill="none" />
                <path d="M0,60 Q20,57 40,60 Q60,63 80,60" stroke="#c9a961" strokeWidth="0.5" fill="none" />
              </pattern></defs>
              <rect width="100%" height="100%" fill="url(#wp)" />
            </svg>
          </div>
        )}

        {/* 미선택 안내 */}
        {!selectedPerfume && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
              <div style={{ height: '1px', width: '44px', background: 'rgba(100,60,20,0.3)' }} />
              <span style={{ color: 'rgba(100,60,20,0.45)', fontSize: '11px' }}>✦</span>
              <div style={{ height: '1px', width: '44px', background: 'rgba(100,60,20,0.3)' }} />
            </div>
            <p style={{ color: 'rgba(100,60,20,0.55)', fontSize: '0.72rem', letterSpacing: '0.5em', fontStyle: 'italic', margin: 0 }}>
              아래 향수를 선택하세요
            </p>
          </div>
        )}

        {/* 향수 선택 오버레이 */}
        {selectedPerfume && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none' }}>

            {/* 향수 이미지 */}
            <PerfumeImage perfume={selectedPerfume} layout={l} />

            {/* 향수 이름 + 브랜드 */}
            <div style={{
              position: 'absolute',
              left: `${l.nameLeft}%`, top: `${l.nameTop}%`,
              transform: 'translate(-50%, -50%)',
              width: l.nameWidth, textAlign: l.nameAlign,
              pointerEvents: 'auto',
            }}>
              <h2 style={{ fontSize: l.nameFontSize, fontWeight: l.nameFontWeight, color: l.nameColor, letterSpacing: l.nameLetterSpacing, margin: '0 0 4px', lineHeight: 1.2 }}>
                {selectedPerfume.name}
              </h2>
              {selectedPerfume.brand_name && (
                <p style={{ fontSize: l.brandFontSize, color: l.brandColor, letterSpacing: l.brandLetterSpacing, textTransform: 'uppercase', margin: 0 }}>
                  {selectedPerfume.brand_name}
                </p>
              )}
            </div>

            {/* 가운데 구분선 */}
            <div style={{
              position: 'absolute',
              left: `${l.dividerLeft}%`,
              top: `${l.dividerTopPct}%`,
              bottom: `${100 - parseFloat(l.dividerBottomPct)}%`,
              width: '1px',
              background: `linear-gradient(to bottom, transparent, ${l.dividerColor} 15%, ${l.dividerColor} 85%, transparent)`,
            }} />

            {/* 노트 영역 */}
            <div style={{
              position: 'absolute',
              left: `${l.noteLeft}%`, top: `${l.noteTop}%`,
              width: l.noteWidth,
              pointerEvents: 'auto',
            }}>
              {loadingNotes ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '11px', height: '11px', borderRadius: '50%', border: '2px solid rgba(100,60,20,0.3)', borderTopColor: '#7a4a1e', animation: 'spin 0.8s linear infinite' }} />
                  <span style={{ fontSize: '0.65rem', color: '#7a4a1e' }}>로딩 중…</span>
                </div>
              ) : (
                <div>
                  {[
                    { key: 'top',    label: 'Top',    items: notes.top },
                    { key: 'middle', label: 'Middle', items: notes.middle },
                    { key: 'base',   label: 'Base',   items: notes.base },
                  ].map(({ key, label, items }, idx) => (
                    <div key={key} style={{ marginBottom: idx < 2 ? l.noteGap : 0 }}>
                      {idx > 0 && <div style={{ height: '0.5px', background: l.noteDividerColor, marginBottom: l.noteGap }} />}
                      <p style={{ fontSize: l.noteLabelFontSize, fontWeight: '600', fontStyle: 'italic', color: l.noteLabelColor, letterSpacing: l.noteLabelLetterSpacing, margin: '0 0 4px' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: l.noteValueFontSize, color: items.length ? l.noteValueColor : 'rgba(100,60,20,0.3)', fontStyle: items.length ? 'normal' : 'italic', lineHeight: l.noteValueLineHeight, letterSpacing: '0.02em', margin: 0 }}>
                        {items.length ? items.join('  ·  ') : '—'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ★ 한줄평 — 노트와 완전 분리된 독립 블록 */}
            {(loadingReview || geminiReview) && (
              <div style={{
                position: 'absolute',
                left: `${l.reviewLeft}%`, top: `${l.reviewTop}%`,
                width: l.reviewWidth,
                pointerEvents: 'auto',
                zIndex: 3,
              }}>
                <div style={{ paddingTop: '10px', borderTop: `0.5px solid ${l.noteDividerColor}` }}>
                  {loadingReview ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '1.5px solid rgba(100,60,20,0.3)', borderTopColor: '#7a4a1e', animation: 'spin 0.8s linear infinite' }} />
                      <span style={{ fontSize: '0.6rem', color: 'rgba(100,60,20,0.4)', fontStyle: 'italic' }}>향수 감상 중…</span>
                    </div>
                  ) : (
                    <p style={{ fontSize: l.reviewFontSize, color: l.reviewColor, fontStyle: l.reviewFontStyle, lineHeight: l.reviewLineHeight, margin: 0, opacity: parseFloat(l.reviewOpacity) }}>
                      "{geminiReview}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* 장바구니 / 구매하기 버튼 영역 */}
            <div style={{
              position: 'absolute',
              right: '12%',
              bottom: '15%',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              justifyContent: 'flex-end',
              pointerEvents: 'auto',
              zIndex: 5,
              maxWidth: '240px',
            }}>
              <button 
                onClick={() => handleAddToWishlist(selectedPerfume)}
                disabled={isAddingToWish}
                style={{ 
                  padding: '8px 18px', 
                  background: 'rgba(255, 255, 255, 0.1)', 
                  border: '1px solid rgba(201,169,97,0.6)', 
                  backdropFilter: 'blur(4px)',
                  color: '#c9a961', 
                  fontSize: '0.68rem', 
                  letterSpacing: '0.15em', 
                  whiteSpace: 'nowrap',
                  cursor: isAddingToWish ? 'wait' : 'pointer', 
                  transition: 'all 0.3s' 
                }}
                onMouseOver={e => { e.currentTarget.style.background = 'rgba(201,169,97,0.2)'; e.currentTarget.style.color = '#fff'; }}
                onMouseOut={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#c9a961'; }}
              >
                {isAddingToWish ? '담는 중...' : 'WISH'}
              </button>
              
              <button 
                onClick={() => handleBuyNow(selectedPerfume)}
                style={{ 
                  padding: '8px 18px', 
                  background: '#c9a961', 
                  border: '1px solid #c9a961', 
                  color: '#1a0c04', 
                  fontSize: '0.68rem', 
                  letterSpacing: '0.15em', 
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer', 
                  transition: 'all 0.3s' 
                }}
                onMouseOver={e => { e.currentTarget.style.background = '#e0c070'; }}
                onMouseOut={e => { e.currentTarget.style.background = '#c9a961'; }}
              >
                BUY NOW
              </button>
            </div>

          </div>
        )}

        {/* 관리자 버튼 */}
        {isAdmin && (
          <div style={{ position: 'absolute', top: '16px', right: '16px', zIndex: 30, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
            <button
              onClick={() => setShowBgPanel(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: showBgPanel ? '#c9a961' : 'rgba(0,0,0,0.72)', border: '1px solid rgba(201,169,97,0.5)', color: showBgPanel ? '#0e0802' : '#c9a961', fontSize: '0.58rem', letterSpacing: '0.28em', cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.style.background = '#c9a961'; e.currentTarget.style.color = '#0e0802'; }}
              onMouseOut={e => { if (!showBgPanel) { e.currentTarget.style.background = 'rgba(0,0,0,0.72)'; e.currentTarget.style.color = '#c9a961'; } }}
            >
              <Upload size={10} /> 이미지 교체
            </button>
            <button
              onClick={() => setShowLayoutEditor(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(201,169,97,0.5)', color: '#c9a961', fontSize: '0.58rem', letterSpacing: '0.28em', cursor: 'pointer' }}
              onMouseOver={e => { e.currentTarget.style.background = '#c9a961'; e.currentTarget.style.color = '#0e0802'; }}
              onMouseOut={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.72)'; e.currentTarget.style.color = '#c9a961'; }}
            >
              <Settings size={10} /> 레이아웃 수정
            </button>
            {showBgPanel && (
              <BgImagePanel currentUrl={bgUrl} onUploaded={saveBgUrl} onClose={() => setShowBgPanel(false)} />
            )}
          </div>
        )}

        {/* 하단 페이드 */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '55px', background: 'linear-gradient(to bottom, transparent, rgba(10,5,0,0.72))' }} />

        {/* 좌우 화살표 */}
        {selectedPerfume && (
          <>
            <button
              onClick={() => moveTo(selectedIdx - 1)} disabled={!canPrev}
              style={{
                position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 20,
                width: '40px', height: '40px',
                background: canPrev ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${canPrev ? 'rgba(201,169,97,0.6)' : 'rgba(201,169,97,0.15)'}`,
                color: canPrev ? '#c9a961' : 'rgba(201,169,97,0.2)',
                cursor: canPrev ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s', fontSize: '18px', lineHeight: 1,
              }}
              onMouseOver={e => { if (canPrev) e.currentTarget.style.background = 'rgba(201,169,97,0.25)'; }}
              onMouseOut={e => { if (canPrev) e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
            >‹</button>

            <button
              onClick={() => moveTo(selectedIdx + 1)} disabled={!canNext}
              style={{
                position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', zIndex: 20,
                width: '40px', height: '40px',
                background: canNext ? 'rgba(0,0,0,0.55)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${canNext ? 'rgba(201,169,97,0.6)' : 'rgba(201,169,97,0.15)'}`,
                color: canNext ? '#c9a961' : 'rgba(201,169,97,0.2)',
                cursor: canNext ? 'pointer' : 'not-allowed',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.18s', fontSize: '18px', lineHeight: 1,
              }}
              onMouseOver={e => { if (canNext) e.currentTarget.style.background = 'rgba(201,169,97,0.25)'; }}
              onMouseOut={e => { if (canNext) e.currentTarget.style.background = 'rgba(0,0,0,0.55)'; }}
            >›</button>

            <div style={{ position: 'absolute', bottom: '20px', left: '50%', transform: 'translateX(-50%)', zIndex: 20, fontSize: '0.6rem', letterSpacing: '0.3em', color: 'rgba(201,169,97,0.6)' }}>
              {selectedIdx + 1} / {allPerfumes.length}
            </div>
          </>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>

      {/* ─────── 하단: 책장 ─────── */}
      <div ref={shelfRef} style={{ background: 'linear-gradient(to bottom, #1a0c04 0%, #f5ede0 7%)', paddingBottom: '80px' }}>
        <div style={{ textAlign: 'center', padding: '50px 24px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '14px', marginBottom: '14px' }}>
            <div style={{ height: '1px', width: '54px', background: 'linear-gradient(to right, transparent, #8b6030)' }} />
            <span style={{ color: '#8b6030', fontSize: '12px' }}>✦</span>
            <div style={{ height: '1px', width: '54px', background: 'linear-gradient(to left, transparent, #8b6030)' }} />
          </div>
          <h2 style={{ fontSize: '1.45rem', letterSpacing: '0.42em', color: '#3d2010', fontWeight: '400', margin: '0 0 6px' }}>FRAGRANCE LIBRARY</h2>
          <p style={{ fontSize: '0.75rem', color: '#8b6030', fontStyle: 'italic', letterSpacing: '0.06em', margin: 0 }}>
            {allPerfumes.length}개의 향수
          </p>
        </div>

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '50px 0' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: '34px', height: '34px', borderRadius: '50%', border: '2px solid rgba(139,96,48,0.3)', borderTopColor: '#8b6030', animation: 'spin 0.9s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ color: '#8b6030', fontStyle: 'italic', fontSize: '0.82rem' }}>향수를 불러오는 중…</p>
            </div>
          </div>
        )}

        {!loading && (
          <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 20px' }}>
            {shelves.map((shelf, si) => (
              <div key={si} style={{ marginBottom: '18px' }}>
                <div style={{ height: '11px', background: 'linear-gradient(to bottom, #7a5228, #8b6030)', borderRadius: '2px 2px 0 0', boxShadow: '0 2px 8px rgba(0,0,0,0.35)' }} />
                <div style={{ background: 'linear-gradient(to bottom, #4a2e0f, #5c3a18)', borderLeft: '10px solid #3a2010', borderRight: '10px solid #3a2010', minHeight: '145px', padding: '10px 14px 6px', display: 'flex', alignItems: 'flex-end', gap: '3px', flexWrap: 'wrap', position: 'relative', boxShadow: 'inset 0 -8px 22px rgba(0,0,0,0.4)' }}>
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'linear-gradient(to right, rgba(0,0,0,0.35) 0%, transparent 9%, transparent 91%, rgba(0,0,0,0.35) 100%)' }} />
                  {shelf.map((p, i) => (
                    <SpineBook key={p.perfume_id} perfume={p} isSelected={selectedPerfume?.perfume_id === p.perfume_id} onClick={() => handleSelect(p)} globalIdx={si * SHELF_SIZE + i} />
                  ))}
                </div>
                <div style={{ height: '18px', background: 'linear-gradient(to bottom, #8b6030 0%, #6b4820 65%, #5a3c18 100%)', boxShadow: '0 5px 14px rgba(0,0,0,0.5)', borderRadius: '0 0 2px 2px' }} />
                <div style={{ height: '5px', background: '#3d2410', margin: '0 10px', borderRadius: '0 0 4px 4px', boxShadow: '0 3px 8px rgba(0,0,0,0.4)' }} />
              </div>
            ))}

            {selectedPerfume && (
              <div style={{ marginTop: '28px', padding: '18px 22px', background: 'linear-gradient(135deg, #faf6ef, #f0e6d4)', border: '1px solid rgba(201,169,97,0.3)', boxShadow: '0 4px 20px rgba(139,96,48,0.1)', display: 'flex', alignItems: 'center', gap: '18px', position: 'relative' }}>
                <button onClick={() => { setSelectedPerfume(null); setNotes({ top: [], middle: [], base: [] }); }}
                  style={{ position: 'absolute', top: '10px', right: '10px', background: 'none', border: 'none', color: 'rgba(139,96,48,0.4)', cursor: 'pointer', padding: '3px' }}
                  onMouseOver={e => e.currentTarget.style.color = '#3d2010'}
                  onMouseOut={e => e.currentTarget.style.color = 'rgba(139,96,48,0.4)'}>
                  <X size={14} />
                </button>
                {selectedPerfume.thumbnail && (
                  <img src={selectedPerfume.thumbnail} alt={selectedPerfume.name} style={{ width: '60px', height: '60px', objectFit: 'cover', border: '1px solid rgba(201,169,97,0.3)', flexShrink: 0 }} />
                )}
                <div>
                  {selectedPerfume.brand_name && (
                    <p style={{ fontSize: '0.6rem', letterSpacing: '0.4em', color: '#c9a961', textTransform: 'uppercase', margin: '0 0 4px' }}>{selectedPerfume.brand_name}</p>
                  )}
                  <h3 style={{ fontSize: '1.05rem', color: '#3d2010', fontWeight: '600', margin: '0 0 6px' }}>{selectedPerfume.name}</h3>
                  <p style={{ fontSize: '0.83rem', color: '#c9a961', fontWeight: '600', margin: 0 }}>
                    {selectedPerfume.sale_rate > 0 ? fmtKRW(selectedPerfume.sale_price) : fmtKRW(selectedPerfume.price)}
                    {selectedPerfume.sale_rate > 0 && <span style={{ marginLeft: '8px', textDecoration: 'line-through', opacity: 0.38, fontSize: '0.76em' }}>{fmtKRW(selectedPerfume.price)}</span>}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showLayoutEditor && (
        <LayoutEditor
          layout={layout}
          bgUrl={bgUrl}
          bgRatio={bgRatio}
          onSave={handleSaveLayout}
          onClose={() => setShowLayoutEditor(false)}
        />
      )}

      {/* 위시리스트 성공 팝업 */}
      {showWishPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 100, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#1a0c04', padding: '40px', border: '1px solid rgba(201,169,97,0.4)', textAlign: 'center', maxWidth: '400px', width: '90%', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
            <div style={{ color: '#c9a961', fontSize: '2.5rem', marginBottom: '16px', fontWeight: '300' }}>✧</div>
            <h3 style={{ fontSize: '1.2rem', color: '#faf6ef', marginBottom: '12px', letterSpacing: '0.15em', fontWeight: '400' }}>
              위시리스트에 담겼습니다.
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'rgba(250,246,239,0.5)', marginBottom: '36px', letterSpacing: '0.05em' }}>
              선택하신 신성한 향기가 위시리스트에 추가되었습니다.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button 
                onClick={() => setShowWishPopup(false)}
                style={{ flex: 1, padding: '12px 0', background: 'transparent', border: '1px solid rgba(201,169,97,0.4)', color: 'rgba(201,169,97,0.8)', fontSize: '0.7rem', letterSpacing: '0.15em', cursor: 'pointer', transition: 'all 0.2s' }}
                onMouseOver={e => { e.currentTarget.style.color = '#c9a961'; e.currentTarget.style.borderColor = '#c9a961'; }}
                onMouseOut={e => { e.currentTarget.style.color = 'rgba(201,169,97,0.8)'; e.currentTarget.style.borderColor = 'rgba(201,169,97,0.4)'; }}
              >
                CONTINUE
              </button>
              <button 
                onClick={() => navigate('/wishlist')}
                style={{ flex: 1, padding: '12px 0', background: '#c9a961', border: '1px solid #c9a961', color: '#1a0c04', fontSize: '0.7rem', letterSpacing: '0.15em', cursor: 'pointer', fontWeight: '600', transition: 'all 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#e0c070'}
                onMouseOut={e => e.currentTarget.style.background = '#c9a961'}
              >
                VIEW WISH
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}