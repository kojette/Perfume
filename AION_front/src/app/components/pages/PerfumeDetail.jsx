import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  ChevronDown, ChevronUp, Heart, ShoppingCart,
  ArrowLeft, Star, Share2, Check, X, AlertTriangle,
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

const fmtKRW   = (n) => (n != null ? `₩${Number(n).toLocaleString()}` : '-');
const getToken  = () => sessionStorage.getItem('accessToken');
const isLoggedIn = () => sessionStorage.getItem('isLoggedIn') === 'true';

// ── EWG 색상/레이블 ───────────────────────────────────────────────────────────
const EWG_COLOR = {
  1:'#4caf50',2:'#8bc34a',3:'#cddc39',4:'#ffeb3b',5:'#ffc107',
  6:'#ff9800',7:'#f44336',8:'#e53935',9:'#c62828',10:'#b71c1c',
};
const ewgColor = (g) => g ? EWG_COLOR[Math.min(Math.max(Math.round(g),1),10)] : '#888';
const ewgLabel = (g) => {
  if (!g) return null;
  const n = Math.round(g);
  if (n <= 2) return '안전';
  if (n <= 6) return '보통';
  return '주의';
};

// ── 스피너 ────────────────────────────────────────────────────────────────────
function Spinner({ size = 28, color = '#c9a961' }) {
  return (
    <div style={{
      width:size, height:size, borderRadius:'50%',
      border:`2px solid ${color}33`, borderTopColor:color,
      animation:'spin 0.8s linear infinite', display:'inline-block',
    }} />
  );
}

// ── 골드 구분선 ───────────────────────────────────────────────────────────────
function GoldDivider({ my = 24 }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, margin:`${my}px 0` }}>
      <div style={{ flex:1, height:1, background:'linear-gradient(to right, transparent, rgba(201,169,97,0.4))' }} />
      <span style={{ color:'rgba(201,169,97,0.5)', fontSize:10 }}>✦</span>
      <div style={{ flex:1, height:1, background:'linear-gradient(to left, transparent, rgba(201,169,97,0.4))' }} />
    </div>
  );
}

// ── 노트 뱃지 ─────────────────────────────────────────────────────────────────
function NoteBadge({ label, items }) {
  if (!items?.length) return null;
  return (
    <div style={{ marginBottom:16 }}>
      <p style={{ fontSize:'0.62rem', letterSpacing:'0.38em', color:'#c9a961', fontWeight:600, fontStyle:'italic', marginBottom:8, textTransform:'uppercase' }}>
        {label}
      </p>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {items.map((item,i) => (
          <span key={i} style={{ fontSize:'0.72rem', padding:'4px 12px', border:'1px solid rgba(201,169,97,0.28)', color:'#2a1508', background:'rgba(201,169,97,0.06)', letterSpacing:'0.06em' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── 전성분 아코디언 ───────────────────────────────────────────────────────────
// Perfume_Ingredients JOIN Ingredients 결과를 받아 화장품법 표기
function IngredientsAccordion({ items, loading }) {
  const [open, setOpen] = useState(false);

  // 화장품법: ratio_percent 내림차순 (함량 높은 순)
  const sorted = [...(items || [])].sort((a,b) => (b.ratio_percent ?? 0) - (a.ratio_percent ?? 0));
  const hasAllergen = sorted.some(i => i.is_allergen);

  return (
    <div style={{ border:'1px solid rgba(201,169,97,0.22)', marginTop:8 }}>
      {/* 헤더 */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width:'100%', display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 20px',
          background: open ? 'rgba(201,169,97,0.07)' : 'transparent',
          border:'none', cursor:'pointer', transition:'background 0.2s',
        }}
      >
        <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
          <span style={{ fontSize:'0.58rem', letterSpacing:'0.45em', color:'#c9a961', textTransform:'uppercase' }}>
            전성분 표기
          </span>
          <span style={{ fontSize:'0.5rem', padding:'2px 7px', border:'1px solid rgba(201,169,97,0.35)', color:'rgba(201,169,97,0.7)', letterSpacing:'0.2em' }}>
            화장품법 의무
          </span>
          {hasAllergen && (
            <span style={{ fontSize:'0.5rem', padding:'2px 7px', border:'1px solid rgba(239,68,68,0.5)', color:'rgba(239,68,68,0.8)', letterSpacing:'0.15em', display:'flex', alignItems:'center', gap:3 }}>
              <AlertTriangle size={8} /> 알레르겐 포함
            </span>
          )}
          {sorted.length > 0 && (
            <span style={{ fontSize:'0.5rem', color:'rgba(201,169,97,0.45)', letterSpacing:'0.1em' }}>
              {sorted.length}종
            </span>
          )}
        </div>
        {open ? <ChevronUp size={14} color="rgba(201,169,97,0.7)" /> : <ChevronDown size={14} color="rgba(201,169,97,0.7)" />}
      </button>

      {/* 바디 */}
      <div style={{ maxHeight: open ? 9999 : 0, overflow:'hidden', transition:'max-height 0.42s cubic-bezier(0.4,0,0.2,1)' }}>
        <div style={{ padding:'16px 20px 20px', borderTop:'1px solid rgba(201,169,97,0.12)' }}>

          {loading ? (
            <div style={{ display:'flex', justifyContent:'center', padding:'20px 0' }}>
              <Spinner size={20} />
            </div>
          ) : sorted.length === 0 ? (
            <>
              <p style={{ fontSize:'0.72rem', color:'rgba(60,40,20,0.55)', fontStyle:'italic', lineHeight:1.8 }}>
                전성분 정보는 제품 용기 또는 포장재에 표기되어 있습니다.
              </p>
              <p style={{ marginTop:12, fontSize:'0.58rem', color:'rgba(139,96,48,0.5)', letterSpacing:'0.15em', fontStyle:'italic' }}>
                * 성분은 함량이 높은 순서로 기재됩니다. (화장품법 제10조 및 시행규칙 제19조)
              </p>
            </>
          ) : (
            <>
              {/* 화장품법 표기 형식 (쉼표 구분 한 줄) */}
              <p style={{ fontSize:'0.75rem', color:'rgba(60,40,20,0.75)', lineHeight:2, letterSpacing:'0.04em', marginBottom:20, fontFamily:'Georgia, serif' }}>
                {sorted.map((ing, i) => (
                  <span key={ing.ingredient_id}>
                    <span style={{ color: ing.is_allergen ? '#c94a4a' : 'inherit' }}>
                      {ing.name}
                    </span>
                    {ing.name_en && (
                      <span style={{ fontSize:'0.65rem', color:'rgba(139,96,48,0.55)', marginLeft:3 }}>
                        ({ing.name_en})
                      </span>
                    )}
                    {i < sorted.length - 1 && <span style={{ color:'rgba(139,96,48,0.35)' }}>, </span>}
                  </span>
                ))}
              </p>

              {/* 상세 테이블 */}
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.68rem' }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid rgba(201,169,97,0.2)' }}>
                      {['성분명','CAS No.','EWG','함량','특성'].map(h => (
                        <th key={h} style={{ padding:'6px 10px', textAlign:'left', fontSize:'0.55rem', letterSpacing:'0.3em', color:'rgba(139,96,48,0.7)', fontWeight:400 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sorted.map((ing, i) => (
                      <tr key={ing.ingredient_id} style={{ borderBottom:'1px solid rgba(201,169,97,0.08)', background: i%2===0 ? 'rgba(201,169,97,0.02)' : 'transparent' }}>
                        {/* 성분명 */}
                        <td style={{ padding:'7px 10px' }}>
                          <span style={{ color: ing.is_allergen ? '#c94a4a' : 'rgba(42,21,8,0.85)' }}>
                            {ing.name}
                          </span>
                          {ing.is_allergen && (
                            <span style={{ marginLeft:4, fontSize:'0.5rem', color:'rgba(201,68,68,0.7)' }}>*알레르겐</span>
                          )}
                          {ing.is_natural === true  && <span style={{ marginLeft:4, fontSize:'0.5rem', color:'#4a9e60' }}>천연</span>}
                          {ing.is_natural === false && <span style={{ marginLeft:4, fontSize:'0.5rem', color:'#888' }}>합성</span>}
                        </td>
                        {/* CAS */}
                        <td style={{ padding:'7px 10px', color:'rgba(139,96,48,0.5)', fontFamily:'monospace', fontSize:'0.6rem' }}>
                          {ing.cas_number || '—'}
                        </td>
                        {/* EWG */}
                        <td style={{ padding:'7px 10px' }}>
                          {ing.ewg_grade ? (
                            <span style={{
                              display:'inline-flex', alignItems:'center', gap:4,
                              fontSize:'0.6rem', padding:'2px 6px',
                              background:`${ewgColor(ing.ewg_grade)}22`,
                              border:`1px solid ${ewgColor(ing.ewg_grade)}55`,
                              color: ewgColor(ing.ewg_grade),
                            }}>
                              {ing.ewg_grade} · {ewgLabel(ing.ewg_grade)}
                            </span>
                          ) : '—'}
                        </td>
                        {/* 함량 */}
                        <td style={{ padding:'7px 10px', color:'rgba(60,40,20,0.55)', fontFamily:'monospace', fontSize:'0.62rem' }}>
                          {ing.ratio_percent != null ? `${parseFloat(ing.ratio_percent).toFixed(2)}%` : '—'}
                        </td>
                        {/* 특성 */}
                        <td style={{ padding:'7px 10px', color:'rgba(60,40,20,0.5)', fontSize:'0.62rem', maxWidth:160 }}>
                          {ing.feature || ing.description || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* 법정 고지 */}
              <div style={{ marginTop:16, paddingTop:12, borderTop:'1px solid rgba(201,169,97,0.1)' }}>
                {hasAllergen && (
                  <p style={{ fontSize:'0.58rem', color:'rgba(201,68,68,0.7)', letterSpacing:'0.12em', marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
                    <AlertTriangle size={9} /> 빨간색 성분은 알레르겐으로 민감한 피부 주의가 필요합니다.
                  </p>
                )}
                <p style={{ fontSize:'0.58rem', color:'rgba(139,96,48,0.5)', letterSpacing:'0.15em', fontStyle:'italic' }}>
                  * 성분은 함량이 높은 순서로 기재됩니다. (화장품법 제10조 및 시행규칙 제19조)
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── 이미지 갤러리 ─────────────────────────────────────────────────────────────
function Gallery({ images, name }) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const active = images[activeIdx];

  return (
    <div>
      <div onClick={() => images.length && setZoomed(true)} style={{
        position:'relative', width:'100%', aspectRatio:'1/1',
        background:'linear-gradient(135deg, #f5f0e8, #e8ddc8)',
        overflow:'hidden', cursor: images.length ? 'zoom-in' : 'default',
        border:'1px solid rgba(201,169,97,0.15)',
      }}>
        {active ? (
          <img src={active.image_url || active} alt={name}
            style={{ width:'100%', height:'100%', objectFit:'contain' }} />
        ) : (
          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100%' }}>
            <span style={{ fontSize:'5rem', color:'rgba(201,169,97,0.15)' }}>✦</span>
          </div>
        )}
      </div>

      {images.length > 1 && (
        <div style={{ display:'flex', gap:8, marginTop:10 }}>
          {images.map((img,i) => (
            <button key={i} onClick={() => setActiveIdx(i)} style={{
              width:64, height:64, flexShrink:0, overflow:'hidden',
              border: i===activeIdx ? '2px solid #c9a961' : '2px solid transparent',
              background:'#f5f0e8', cursor:'pointer', padding:0, transition:'border-color 0.18s',
            }}>
              <img src={img.image_url || img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            </button>
          ))}
        </div>
      )}

      {zoomed && (
        <div onClick={() => setZoomed(false)} style={{
          position:'fixed', inset:0, zIndex:200, background:'rgba(0,0,0,0.9)',
          display:'flex', alignItems:'center', justifyContent:'center', cursor:'zoom-out',
        }}>
          <button onClick={() => setZoomed(false)} style={{ position:'absolute', top:20, right:20, background:'none', border:'none', color:'rgba(250,246,239,0.5)', cursor:'pointer' }}>
            <X size={28} />
          </button>
          <img src={active?.image_url || active} alt={name}
            style={{ maxWidth:'90vw', maxHeight:'90vh', objectFit:'contain' }}
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}

// ── 별점 ─────────────────────────────────────────────────────────────────────
function StarRating({ rating, count }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      {[1,2,3,4,5].map(n => (
        <Star key={n} size={13}
          fill={n<=Math.round(rating) ? '#c9a961' : 'transparent'}
          color={n<=Math.round(rating) ? '#c9a961' : 'rgba(201,169,97,0.3)'} />
      ))}
      <span style={{ fontSize:'0.72rem', color:'rgba(201,169,97,0.7)', marginLeft:4 }}>
        {rating?.toFixed(1)} ({count}개 리뷰)
      </span>
    </div>
  );
}

// ── 토스트 ────────────────────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 2400); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{
      position:'fixed', bottom:36, left:'50%', transform:'translateX(-50%)',
      zIndex:300, background:'#1a0c04', border:'1px solid rgba(201,169,97,0.5)',
      padding:'12px 28px', display:'flex', alignItems:'center', gap:10,
      boxShadow:'0 8px 32px rgba(0,0,0,0.5)', animation:'fadeInUp 0.28s ease',
    }}>
      <Check size={14} color="#c9a961" />
      <span style={{ fontSize:'0.78rem', color:'#faf6ef', letterSpacing:'0.1em' }}>{message}</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────────────────────────
export default function PerfumeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [perfume,      setPerfume]      = useState(null);
  const [images,       setImages]       = useState([]);
  const [notes,        setNotes]        = useState({ top:[], middle:[], base:[] });
  const [loading,      setLoading]      = useState(true);
  const [notesLoading, setNotesLoading] = useState(true);

  // ★ 전성분: Perfume_Ingredients JOIN Ingredients
  const [ingredientItems,    setIngredientItems]    = useState([]);
  const [ingredientsLoading, setIngredientsLoading] = useState(true);

  const [qty,            setQty]            = useState(1);
  const [isWished,       setIsWished]       = useState(false);
  const [wishLoading,    setWishLoading]    = useState(false);
  const [cartLoading,    setCartLoading]    = useState(false);
  const [toast,          setToast]          = useState(null);
  const [restockLoading, setRestockLoading] = useState(false);
  const [restockDone,    setRestockDone]    = useState(false);

  // ── 향수 기본 정보 ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      try {
        // ※ ingredients 컬럼 제외 — DB에 없음
        const { data: pData } = await supabase
          .from('Perfumes')
          .select('perfume_id,name,name_en,description,price,sale_price,sale_rate,brand_id,gender,volume_ml,avg_rating,review_count,total_stock')
          .eq('perfume_id', id)
          .eq('is_active', true)
          .single();

        if (!pData) { navigate('/collections', { replace:true }); return; }

        let brandName = '';
        if (pData.brand_id) {
          const { data: bData } = await supabase.from('Brands').select('brand_name').eq('brand_id', pData.brand_id).single();
          brandName = bData?.brand_name || '';
        }

        const { data: imgData } = await supabase
          .from('Perfume_Images')
          .select('image_id,image_url,is_thumbnail,display_order')
          .eq('perfume_id', id)
          .order('display_order', { ascending:true });

        const sortedImgs = (imgData || []).sort((a,b) => {
          if (a.is_thumbnail && !b.is_thumbnail) return -1;
          if (!a.is_thumbnail && b.is_thumbnail) return 1;
          return (a.display_order??99) - (b.display_order??99);
        });

        setPerfume({ ...pData, brand_name: brandName });
        setImages(sortedImgs);
      } catch (e) { console.error('향수 상세 로드 실패:', e); }
      finally { setLoading(false); }
    })();
  }, [id, navigate]);

  // ── 전성분: Perfume_Ingredients JOIN Ingredients ──────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setIngredientsLoading(true);
      try {
        const { data, error } = await supabase
          .from('Perfume_Ingredients')
          .select(`
            ratio_percent,
            risk_level,
            Ingredients (
              ingredient_id, name, name_en,
              cas_number, ewg_grade,
              feature, description,
              is_allergen, is_natural, origin
            )
          `)
          .eq('perfume_id', id);

        if (error) throw error;

        // 평탄화
        const flat = (data || []).map(row => ({
          ratio_percent: row.ratio_percent,
          risk_level:    row.risk_level,
          ...(row.Ingredients || {}),
        }));

        setIngredientItems(flat);
      } catch (e) {
        console.error('전성분 로드 실패:', e);
        setIngredientItems([]);
      } finally {
        setIngredientsLoading(false);
      }
    })();
  }, [id]);

  // ── 노트 ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!id) return;
    (async () => {
      setNotesLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/collections/perfumes/${id}/notes`);
        if (res.ok) {
          const json = await res.json();
          setNotes({ top: json.data?.top||[], middle: json.data?.middle||[], base: json.data?.base||[] });
        }
      } catch (e) { console.error('노트 로드 실패:', e); }
      finally { setNotesLoading(false); }
    })();
  }, [id]);

  // ── 위시리스트 ────────────────────────────────────────────────────────────
  const handleWish = useCallback(async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setWishLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/wishlist/toggle`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ perfumeId: Number(id) }),
      });
      if (res.ok) { setIsWished(w => !w); setToast(isWished ? '위시리스트에서 제거되었습니다' : '위시리스트에 담겼습니다'); }
    } finally { setWishLoading(false); }
  }, [id, isWished, navigate]);

  // ── 장바구니 ─────────────────────────────────────────────────────────────
  const handleCart = useCallback(async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setCartLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/cart/add`, {
        method:'POST',
        headers:{ Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
        body: JSON.stringify({ perfumeId: Number(id), quantity: qty }),
      });
      if (res.ok) setToast(`장바구니에 ${qty}개 담겼습니다`);
    } finally { setCartLoading(false); }
  }, [id, qty, navigate]);

  // ── 바로구매 ─────────────────────────────────────────────────────────────
  const handleBuy = useCallback(async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    await fetch(`${API_BASE}/api/cart/add`, {
      method:'POST',
      headers:{ Authorization:`Bearer ${getToken()}`, 'Content-Type':'application/json' },
      body: JSON.stringify({ perfumeId: Number(id), quantity: qty }),
    });
    navigate('/cart');
  }, [id, qty, navigate]);

  // ── 공유 ─────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    if (navigator.share) { navigator.share({ title: perfume?.name, url: window.location.href }); }
    else { navigator.clipboard?.writeText(window.location.href); setToast('링크가 복사되었습니다'); }
  }, [perfume]);

  // ── 재입고 알림 신청 ─────────────────────────────────────────────────────
  const handleRestock = useCallback(async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    setRestockLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/restock/notify`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ perfumeId: Number(id) }),
      });
      if (res.ok) {
        setRestockDone(true);
        setToast('재입고 알림이 신청되었습니다');
      } else {
        const err = await res.json();
        setToast(err.message || '이미 신청하셨거나 오류가 발생했습니다');
      }
    } catch {
      setToast('오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setRestockLoading(false);
    }
  }, [id, navigate]);

  // ─────────────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight:'70vh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:16, background:'#f5ede0', fontFamily:'Georgia, serif' }}>
        <Spinner size={36} />
        <p style={{ fontSize:'0.82rem', color:'#8b6030', fontStyle:'italic', letterSpacing:'0.1em' }}>향수 정보를 불러오는 중…</p>
      </div>
    );
  }
  if (!perfume) return null;

  const displayPrice = perfume.sale_rate > 0 ? perfume.sale_price : perfume.price;
  const hasNotes = notes.top.length || notes.middle.length || notes.base.length;
  const inStock  = (perfume.total_stock ?? 1) > 0;

  return (
    <div style={{ minHeight:'100vh', background:'#f5ede0', fontFamily:'Georgia, "Times New Roman", serif' }}>
      <style>{`
        @keyframes spin     { to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity:0; transform:translate(-50%,12px); } to { opacity:1; transform:translate(-50%,0); } }
        @keyframes fadeIn   { from { opacity:0; transform:translateY(14px); } to { opacity:1; transform:translateY(0); } }
        .detail-fade { animation: fadeIn 0.55s ease both; }
      `}</style>

      {/* ── 상단 네비 ── */}
      <div style={{ background:'linear-gradient(135deg,#1a0c04 0%,#2a1508 100%)', borderBottom:'1px solid rgba(201,169,97,0.2)', padding:'14px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <button onClick={() => navigate(-1)}
          style={{ display:'flex', alignItems:'center', gap:8, background:'none', border:'none', cursor:'pointer', color:'rgba(201,169,97,0.7)', fontSize:'0.68rem', letterSpacing:'0.25em' }}
          onMouseOver={e => e.currentTarget.style.color='#c9a961'}
          onMouseOut={e => e.currentTarget.style.color='rgba(201,169,97,0.7)'}
        >
          <ArrowLeft size={14} /> BACK
        </button>
        <p style={{ fontSize:'0.58rem', letterSpacing:'0.35em', color:'rgba(201,169,97,0.45)' }}>
          COLLECTIONS&nbsp;&nbsp;/&nbsp;&nbsp;{perfume.name?.toUpperCase()}
        </p>
        <button onClick={handleShare}
          style={{ display:'flex', alignItems:'center', gap:6, background:'none', border:'none', cursor:'pointer', color:'rgba(201,169,97,0.6)', fontSize:'0.65rem', letterSpacing:'0.2em' }}
          onMouseOver={e => e.currentTarget.style.color='#c9a961'}
          onMouseOut={e => e.currentTarget.style.color='rgba(201,169,97,0.6)'}
        >
          <Share2 size={13} /> SHARE
        </button>
      </div>

      {/* ── 본문 ── */}
      <div style={{ maxWidth:1080, margin:'0 auto', padding:'48px 24px 80px' }} className="detail-fade">
        <div
          style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'start' }}
          ref={el => {
            if (!el) return;
            const mq = window.matchMedia('(max-width:720px)');
            const apply = () => { el.style.gridTemplateColumns = mq.matches ? '1fr' : '1fr 1fr'; };
            apply(); mq.addEventListener('change', apply);
          }}
        >
          {/* 갤러리 */}
          <Gallery images={images} name={perfume.name} />

          {/* 정보 패널 */}
          <div style={{ display:'flex', flexDirection:'column' }}>

            {perfume.brand_name && (
              <p style={{ fontSize:'0.6rem', letterSpacing:'0.5em', color:'#c9a961', textTransform:'uppercase', marginBottom:8 }}>
                {perfume.brand_name}
              </p>
            )}

            <h1 style={{ fontSize:'clamp(1.4rem,3vw,2.1rem)', fontWeight:400, letterSpacing:'0.12em', color:'#2a1508', lineHeight:1.25, marginBottom:4 }}>
              {perfume.name}
            </h1>
            {perfume.name_en && (
              <p style={{ fontSize:'0.8rem', color:'#8b6030', fontStyle:'italic', letterSpacing:'0.08em', marginBottom:14 }}>
                {perfume.name_en}
              </p>
            )}
            {perfume.avg_rating > 0 && (
              <div style={{ marginBottom:16 }}>
                <StarRating rating={perfume.avg_rating} count={perfume.review_count ?? 0} />
              </div>
            )}

            <GoldDivider my={16} />

            {/* 가격 */}
            <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
              <span style={{ fontSize:'1.55rem', fontWeight:600, color:'#c9a961', letterSpacing:'0.04em' }}>
                {fmtKRW(displayPrice)}
              </span>
              {perfume.sale_rate > 0 && (
                <>
                  <span style={{ fontSize:'1rem', color:'#a39d8f', textDecoration:'line-through' }}>{fmtKRW(perfume.price)}</span>
                  <span style={{ fontSize:'0.72rem', padding:'3px 9px', background:'#c94a4a', color:'#fff', letterSpacing:'0.1em', fontFamily:'sans-serif' }}>
                    {perfume.sale_rate}% OFF
                  </span>
                </>
              )}
            </div>

            {/* 메타 태그 */}
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:24 }}>
              {perfume.gender && (
                <span style={metaTag}>
                  {perfume.gender==='MALE'?'남성':perfume.gender==='FEMALE'?'여성':'유니섹스'}
                </span>
              )}
              {perfume.volume_ml && <span style={metaTag}>{perfume.volume_ml}ml</span>}
              {!inStock && <span style={{ ...metaTag, borderColor:'#c94a4a', color:'#c94a4a' }}>품절</span>}
            </div>

            {/* 수량 + 위시 */}
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
              <div style={{ display:'flex', alignItems:'center', border:'1px solid rgba(201,169,97,0.35)' }}>
                <button onClick={() => setQty(q => Math.max(1,q-1))} style={qtyBtn}>−</button>
                <span style={{ width:40, textAlign:'center', fontSize:'0.85rem', color:'#2a1508' }}>{qty}</span>
                <button onClick={() => setQty(q => q+1)} style={qtyBtn}>+</button>
              </div>
              <button onClick={handleWish} disabled={wishLoading} style={{
                width:44, height:44, display:'flex', alignItems:'center', justifyContent:'center',
                border:'1px solid rgba(201,169,97,0.4)',
                background: isWished ? 'rgba(201,169,97,0.15)' : 'transparent',
                cursor:'pointer', transition:'background 0.18s',
              }}>
                <Heart size={16} fill={isWished?'#c9a961':'transparent'} color="#c9a961" />
              </button>
            </div>

            {/* 장바구니 / BUY NOW */}
            <div style={{ display:'flex', gap:10, marginBottom: inStock ? 28 : 12 }}>
              <button onClick={handleCart} disabled={cartLoading||!inStock} style={{
                flex:1, padding:'13px 0',
                border:'1px solid rgba(201,169,97,0.55)', background:'transparent', color:'#c9a961',
                fontSize:'0.68rem', letterSpacing:'0.25em',
                cursor:(!inStock||cartLoading)?'not-allowed':'pointer', opacity:!inStock?0.4:1,
                display:'flex', alignItems:'center', justifyContent:'center', gap:7,
              }}
                onMouseOver={e => { if(inStock) e.currentTarget.style.background='rgba(201,169,97,0.1)'; }}
                onMouseOut={e => { e.currentTarget.style.background='transparent'; }}
              >
                <ShoppingCart size={13} />
                {cartLoading ? '담는 중…' : '장바구니'}
              </button>
              <button onClick={handleBuy} disabled={!inStock} style={{
                flex:1, padding:'13px 0',
                background: inStock?'#c9a961':'#a39d8f', border:'none', color:'#1a0c04',
                fontSize:'0.68rem', letterSpacing:'0.28em', fontWeight:600,
                cursor: inStock?'pointer':'not-allowed',
              }}
                onMouseOver={e => { if(inStock) e.currentTarget.style.background='#e0c070'; }}
                onMouseOut={e => { if(inStock) e.currentTarget.style.background='#c9a961'; }}
              >
                {inStock ? 'BUY NOW' : '품절'}
              </button>
            </div>

            {/* 재입고 알림 신청 (품절 시만 표시) */}
            {!inStock && (
              <div style={{ marginBottom:28 }}>
                <button
                  onClick={handleRestock}
                  disabled={restockLoading || restockDone}
                  style={{
                    width:'100%', padding:'12px 0',
                    border:'1px solid rgba(201,169,97,0.4)',
                    background: restockDone ? 'rgba(201,169,97,0.08)' : 'transparent',
                    color: restockDone ? '#c9a961' : 'rgba(201,169,97,0.7)',
                    fontSize:'0.65rem', letterSpacing:'0.3em',
                    cursor: restockDone ? 'default' : 'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    transition:'all 0.2s',
                  }}
                  onMouseOver={e => { if(!restockDone) e.currentTarget.style.background='rgba(201,169,97,0.08)'; }}
                  onMouseOut={e => { if(!restockDone) e.currentTarget.style.background='transparent'; }}
                >
                  <span style={{ fontSize:'0.75rem' }}>{restockDone ? '✓' : '🔔'}</span>
                  {restockLoading ? '신청 중…' : restockDone ? '재입고 알림 신청 완료' : '재입고 알림 신청'}
                </button>
                <p style={{ fontSize:'0.58rem', color:'rgba(139,96,48,0.45)', letterSpacing:'0.1em', textAlign:'center', marginTop:6 }}>
                  재입고 시 이메일로 알려드립니다
                </p>
              </div>
            )}

            <GoldDivider my={0} />

            {/* 향수 노트 */}
            <div style={{ padding:'24px 0' }}>
              <p style={{ fontSize:'0.58rem', letterSpacing:'0.5em', color:'#8b6030', textTransform:'uppercase', marginBottom:18 }}>
                FRAGRANCE NOTES
              </p>
              {notesLoading ? (
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 0' }}>
                  <Spinner size={16} />
                  <span style={{ fontSize:'0.75rem', color:'#8b6030', fontStyle:'italic' }}>노트 로딩 중…</span>
                </div>
              ) : hasNotes ? (
                <>
                  <NoteBadge label="Top"    items={notes.top} />
                  <NoteBadge label="Middle" items={notes.middle} />
                  <NoteBadge label="Base"   items={notes.base} />
                </>
              ) : (
                <p style={{ fontSize:'0.75rem', color:'rgba(139,96,48,0.45)', fontStyle:'italic' }}>노트 정보가 없습니다</p>
              )}
            </div>

            <GoldDivider my={0} />

            {/* 설명 */}
            {perfume.description && (
              <div style={{ padding:'24px 0' }}>
                <p style={{ fontSize:'0.58rem', letterSpacing:'0.5em', color:'#8b6030', textTransform:'uppercase', marginBottom:14 }}>
                  DESCRIPTION
                </p>
                <p style={{ fontSize:'0.82rem', color:'#4a2c10', lineHeight:1.9, letterSpacing:'0.03em', fontStyle:'italic' }}>
                  {perfume.description}
                </p>
              </div>
            )}

            {/* ★ 전성분 아코디언 (Perfume_Ingredients + Ingredients) ★ */}
            <div style={{ paddingTop:8, paddingBottom:24 }}>
              <p style={{ fontSize:'0.58rem', letterSpacing:'0.5em', color:'#8b6030', textTransform:'uppercase', marginBottom:10 }}>
                INGREDIENTS
              </p>
              <IngredientsAccordion items={ingredientItems} loading={ingredientsLoading} />
            </div>

          </div>
        </div>

        <GoldDivider my={48} />
        <div style={{ textAlign:'center' }}>
          <button onClick={() => navigate('/collections')} style={{
            fontSize:'0.65rem', letterSpacing:'0.4em', color:'#8b6030',
            background:'none', border:'none', cursor:'pointer',
            textDecoration:'underline', textUnderlineOffset:4, textDecorationColor:'rgba(139,96,48,0.4)',
          }}
            onMouseOver={e => e.currentTarget.style.color='#c9a961'}
            onMouseOut={e => e.currentTarget.style.color='#8b6030'}
          >
            ← FRAGRANCE LIBRARY 로 돌아가기
          </button>
        </div>
      </div>

      {toast && <Toast message={toast} onClose={() => setToast(null)} />}
    </div>
  );
}

// ── 공통 스타일 ────────────────────────────────────────────────────────────────
const metaTag = {
  fontSize:'0.62rem', padding:'4px 12px',
  border:'1px solid rgba(139,96,48,0.35)',
  color:'#8b6030', letterSpacing:'0.15em',
  background:'rgba(139,96,48,0.05)',
};
const qtyBtn = {
  width:36, height:44, background:'none', border:'none', cursor:'pointer',
  color:'#8b6030', fontSize:'1.1rem',
  display:'flex', alignItems:'center', justifyContent:'center',
};