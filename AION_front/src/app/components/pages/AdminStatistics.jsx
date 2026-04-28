import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import {
  TrendingUp, TrendingDown, ShoppingCart, Heart, Package,
  Star, Users, BarChart2, RefreshCw, ArrowLeft,
  DollarSign, Eye, Flame, Award, AlertTriangle, ChevronUp, ChevronDown
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const API_BASE = "";

const GOLD   = '#c9a961';
const DARK   = '#2a2620';
const BG     = '#faf8f3';
const CREAM  = '#f0e8d8';

const CHART_COLORS = [
  '#c9a961','#6366f1','#10b981','#f59e0b',
  '#ef4444','#8b5cf6','#06b6d4','#84cc16',
  '#f97316','#ec4899','#14b8a6','#a855f7'
];

// ─── 유틸 ───────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('ko-KR');
const fmtW = (n) => {
  const v = Number(n || 0);
  if (v >= 100000000) return `${(v / 100000000).toFixed(1)}억`;
  if (v >= 10000)     return `${(v / 10000).toFixed(1)}만`;
  return v.toLocaleString('ko-KR');
};

// ─── KPI 카드 ─────────────────────────────────────────
const KpiCard = ({ icon: Icon, label, value, sub, trend }) => (
  <div className="bg-white rounded-2xl border border-[#e8dcc8] p-5 shadow-sm hover:shadow-md transition-all group">
    <div className="flex items-start justify-between mb-3">
      <div className="p-2.5 rounded-xl" style={{ backgroundColor: "#1b271d" }}>
        <Icon size={20} className="text-white" />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          trend >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'
        }`}>
          {trend >= 0 ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-[#2a2620] tracking-tight">{value}</div>
    <div className="text-xs text-[#8b8278] mt-1">{label}</div>
    {sub && <div className="text-xs text-[#c9a961] mt-0.5 font-medium">{sub}</div>}
  </div>
);

// ─── 섹션 헤더 ───────────────────────────────────────
const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-4">
    <div className="w-1 h-6 bg-[#c9a961] rounded-full" />
    <Icon size={16} className="text-[#c9a961]" />
    <h2 className="text-sm font-bold text-[#2a2620] tracking-widest uppercase">{children}</h2>
  </div>
);

// ─── 커스텀 툴팁 ─────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#e8dcc8] rounded-xl px-4 py-3 shadow-lg text-xs">
      <div className="font-bold text-[#2a2620] mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="flex justify-between gap-4">
          <span>{p.name}</span>
          <span className="font-semibold">{typeof p.value === 'number' && p.value > 1000 ? fmtW(p.value) : fmt(p.value)}</span>
        </div>
      ))}
    </div>
  );
};

// ─── 로딩 스켈레톤 ────────────────────────────────────
const Skeleton = ({ h = 'h-32', w = 'w-full' }) => (
  <div className={`${h} ${w} bg-gradient-to-r from-[#f0e8d8] via-[#faf8f3] to-[#f0e8d8] rounded-xl animate-pulse`} />
);

// ─── 메인 컴포넌트 ────────────────────────────────────
const AdminStatistics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  const [summary,        setSummary]        = useState(null);
  const [dailyRevenue,   setDailyRevenue]   = useState([]);
  const [perfumeStats,   setPerfumeStats]   = useState([]);
  const [ingredientStats,setIngredientStats]= useState([]);
  const [brandStats,     setBrandStats]     = useState([]);
  const [segments,       setSegments]       = useState([]);
  const [lowConversion,  setLowConversion]  = useState([]);
  const [demographics,   setDemographics]   = useState(null);
  const [perfumeSort,    setPerfumeSort]    = useState('cart_count');

  // ── 데이터 로드 ────────────────────────────────────
  const fetchAll = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate('/login'); return; }
      const headers = { Authorization: `Bearer ${session.access_token}` };

      const [sumRes, dayRes, perfRes, ingRes, brandRes, segRes, lcRes, demoRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats/summary`,              { headers }),
        fetch(`${API_BASE}/api/admin/stats/revenue/daily`,        { headers }),
        fetch(`${API_BASE}/api/admin/stats/perfumes?sortBy=${perfumeSort}&limit=20`, { headers }),
        fetch(`${API_BASE}/api/admin/stats/ingredients?limit=30`, { headers }),
        fetch(`${API_BASE}/api/admin/stats/brands`,               { headers }),
        fetch(`${API_BASE}/api/admin/stats/customers/segments`,   { headers }),
        fetch(`${API_BASE}/api/admin/stats/perfumes/low-conversion`, { headers }),
        fetch(`${API_BASE}/api/admin/stats/customers/demographics`,  { headers }),
      ]);

      const parse = async (r) => r.ok ? (await r.json()).data : null;

      const [s, d, p, i, b, seg, lc, demo] = await Promise.all([
        parse(sumRes), parse(dayRes), parse(perfRes),
        parse(ingRes), parse(brandRes), parse(segRes),
        parse(lcRes),  parse(demoRes),
      ]);

      if (s)   setSummary(s);
      if (d)   setDailyRevenue(d.map(row => ({
        date:    row.stat_date?.slice(5),   // MM-DD
        매출:    Number(row.total_revenue  || 0),
        주문수:  Number(row.order_count    || 0),
        신규가입:Number(row.new_users      || 0),
      })));
      if (p)   setPerfumeStats(p);
      if (i)   setIngredientStats(i);
      if (b)   setBrandStats(b.map(row => ({
        name:      row.brand_name,
        매출:      Number(row.total_revenue  || 0),
        주문:      Number(row.total_orders   || 0),
        찜:        Number(row.total_wishlists || 0),
        장바구니:  Number(row.total_carts    || 0),
      })));
      if (seg) setSegments(seg);
      if (lc)  setLowConversion(lc);
      if (demo)setDemographics(demo);
    } catch (e) {
      console.error('통계 로드 실패:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [perfumeSort, navigate]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── 탭 정의 ────────────────────────────────────────
  const TABS = [
    { id: 'overview',     label: '개요' },
    { id: 'products',     label: '상품 분석' },
    { id: 'ingredients',  label: '조향 분석' },
    { id: 'customers',    label: '고객 분석' },
  ];

  // ─── 세그먼트 파이 데이터 ────────────────────────
  const segmentData = segments.map(s => ({
    name:  s.rank_name,
    value: Number(s.user_count || 0),
  }));

  // ─── 인구통계 데이터 ──────────────────────────────
  const genderData = demographics?.gender?.map(g => ({
    name:  g.gender === 'MALE' ? '남성' : g.gender === 'FEMALE' ? '여성' : '미공개',
    value: Number(g.order_count || 0),
    매출:  Number(g.revenue || 0),
  })) ?? [];

  const ageData = demographics?.ageGroups?.map(a => ({
    name:       a.age_group,
    주문수:     Number(a.order_count || 0),
  })) ?? [];

  // ─── 향료 워드클라우드 (크기 반영) ───────────────
  const maxIngUsage = Math.max(...ingredientStats.map(i => Number(i.usage_count || 0)), 1);
  const ingWords = ingredientStats.map(ing => ({
    ...ing,
    fontSize: 12 + (Number(ing.usage_count || 0) / maxIngUsage) * 26,
    opacity:  0.5 + (Number(ing.usage_count || 0) / maxIngUsage) * 0.5,
  }));

  // ─── 정렬 옵션 ───────────────────────────────────
  const SORT_OPTIONS = [
    { value: 'cart_count',    label: '장바구니' },
    { value: 'wishlist_count',label: '찜' },
    { value: 'order_count',   label: '주문수' },
    { value: 'total_revenue', label: '매출' },
    { value: 'review_count',  label: '리뷰수' },
    { value: 'avg_rating',    label: '평점' },
    { value: 'view_count',    label: '조회수' },
  ];

  // ─── 렌더 ────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#faf8f3]" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* ── 헤더 ── */}
      <div className="sticky top-0 z-10 bg-[#faf8f3]/95 backdrop-blur border-b border-[#e8dcc8]">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/admin')} className="p-2 hover:bg-[#f0e8d8] rounded-lg transition-colors">
              <ArrowLeft size={18} className="text-[#8b8278]" />
            </button>
            <div>
              <h1 className="text-lg font-bold text-[#2a2620] tracking-widest">STATISTICS</h1>
              <p className="text-xs text-[#8b8278]">데이터 기반 인사이트 대시보드</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAll(true)}
              disabled={refreshing}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-[#e8dcc8] rounded-lg text-xs font-medium text-[#2a2620] hover:border-[#c9a961] transition-all disabled:opacity-50"
            >
              <RefreshCw size={13} className={refreshing ? 'animate-spin text-[#c9a961]' : ''} />
              새로고침
            </button>
          </div>
        </div>

        {/* 탭 */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 pb-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-xs font-semibold tracking-wider rounded-t-lg transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'text-[#c9a961] border-[#c9a961] bg-white'
                  : 'text-[#8b8278] border-transparent hover:text-[#2a2620]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-10">

        {/* ═══════════════════════════════════════════════════
            TAB: 개요
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'overview' && (
          <>
            {/* KPI */}
            <div>
              <SectionTitle icon={TrendingUp}>오늘의 현황</SectionTitle>
              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => <Skeleton key={i} h="h-28" />)}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <KpiCard icon={DollarSign}    label="오늘 매출"       value={`₩${fmtW(summary?.todayRevenue)}`}  />
                  <KpiCard icon={Package}        label="오늘 주문"       value={`${fmt(summary?.todayOrders)}건`}    />
                  <KpiCard icon={Users}           label="신규 가입"       value={`${fmt(summary?.todayNewUsers)}명`}  />
                  <KpiCard icon={Users}           label="전체 활성 회원"  value={`${fmt(summary?.totalUsers)}명`}    />
                  <KpiCard icon={DollarSign}    label="이번 달 매출"    value={`₩${fmtW(summary?.monthRevenue)}`}  />
                  <KpiCard icon={ShoppingCart}   label="총 장바구니 담기" value={`${fmt(summary?.totalCarts)}건`}    />
                  <KpiCard icon={Heart}          label="총 위시리스트"   value={`${fmt(summary?.totalWishlists)}건`} />
                  <KpiCard icon={AlertTriangle}  label="미답변 문의"     value={`${fmt(summary?.pendingInquiries)}건`} />
                </div>
              )}
            </div>

            {/* 매출 트렌드 */}
            <div>
              <SectionTitle icon={TrendingUp}>최근 30일 매출 트렌드</SectionTitle>
              <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
                {loading ? <Skeleton h="h-72" /> : (
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={dailyRevenue} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#8b8278' }} tickLine={false} />
                      <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#8b8278' }} tickFormatter={v => fmtW(v)} tickLine={false} axisLine={false} />
                      <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#8b8278' }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line yAxisId="left"  type="monotone" dataKey="매출"    stroke={GOLD}      strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                      <Line yAxisId="right" type="monotone" dataKey="주문수"  stroke="#6366f1"   strokeWidth={2}   dot={false} activeDot={{ r: 4 }} />
                      <Line yAxisId="right" type="monotone" dataKey="신규가입" stroke="#10b981"  strokeWidth={2}   dot={false} activeDot={{ r: 4 }} strokeDasharray="4 2" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 브랜드별 매출 + 전환율 낮은 상품 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <SectionTitle icon={Award}>브랜드별 매출 TOP 10</SectionTitle>
                <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
                  {loading ? <Skeleton h="h-64" /> : (
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={brandStats} layout="vertical" margin={{ left: 30 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 10, fill: '#8b8278' }} tickFormatter={v => fmtW(v)} axisLine={false} tickLine={false} />
                        <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fill: '#2a2620' }} width={70} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="매출" fill={GOLD} radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div>
                <SectionTitle icon={AlertTriangle}>찜 대비 구매 전환율 낮은 상품</SectionTitle>
                <div className="bg-white rounded-2xl border border-[#e8dcc8] shadow-sm overflow-hidden">
                  {loading ? <Skeleton h="h-64" /> : (
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-[#faf8f3] border-b border-[#e8dcc8]">
                          <th className="text-left px-4 py-3 text-[#8b8278] font-semibold">향수명</th>
                          <th className="text-right px-3 py-3 text-[#8b8278] font-semibold">찜</th>
                          <th className="text-right px-3 py-3 text-[#8b8278] font-semibold">주문</th>
                          <th className="text-right px-4 py-3 text-[#8b8278] font-semibold">전환율</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lowConversion.map((p, i) => (
                          <tr key={i} className="border-b border-[#f0e8d8] hover:bg-[#faf8f3] transition-colors">
                            <td className="px-4 py-3 font-medium text-[#2a2620] truncate max-w-[120px]">{p.perfume_name}</td>
                            <td className="text-right px-3 py-3 text-rose-500 font-semibold">{fmt(p.wishlist_count)}</td>
                            <td className="text-right px-3 py-3 text-[#2a2620]">{fmt(p.order_count)}</td>
                            <td className="text-right px-4 py-3">
                              <span className={`px-2 py-0.5 rounded-full font-bold ${
                                Number(p.conversion_rate) < 10 ? 'bg-red-50 text-red-500' :
                                Number(p.conversion_rate) < 30 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                              }`}>
                                {p.conversion_rate}%
                              </span>
                            </td>
                          </tr>
                        ))}
                        {lowConversion.length === 0 && (
                          <tr><td colSpan={4} className="text-center py-10 text-[#8b8278]">데이터 없음</td></tr>
                        )}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: 상품 분석
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'products' && (
          <>
            {/* 정렬 선택 */}
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs text-[#8b8278] font-semibold">정렬 기준:</span>
              {SORT_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setPerfumeSort(opt.value)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                    perfumeSort === opt.value
                      ? 'bg-[#c9a961] text-white shadow-sm'
                      : 'bg-white border border-[#e8dcc8] text-[#8b8278] hover:border-[#c9a961]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* 향수별 통계 바 차트 */}
            <div>
              <SectionTitle icon={BarChart2}>향수별 통계 (TOP 20)</SectionTitle>
              <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
                {loading ? <Skeleton h="h-96" /> : (
                  <ResponsiveContainer width="100%" height={380}>
                    <BarChart data={perfumeStats.slice(0, 15)} margin={{ top: 5, right: 10, bottom: 60, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" vertical={false} />
                      <XAxis
                        dataKey="perfume_name"
                        tick={{ fontSize: 10, fill: '#8b8278' }}
                        angle={-40} textAnchor="end" interval={0}
                        tickLine={false}
                      />
                      <YAxis tick={{ fontSize: 11, fill: '#8b8278' }} tickLine={false} axisLine={false}
                        tickFormatter={v => SORT_OPTIONS.find(o => o.value === perfumeSort)?.label === '매출' ? fmtW(v) : fmt(v)}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar
                        dataKey={
                          perfumeSort === 'total_revenue' ? 'total_revenue' :
                          perfumeSort === 'wishlist_count' ? 'wishlist_count' :
                          perfumeSort === 'order_count' ? 'order_count' :
                          perfumeSort === 'review_count' ? 'review_count' :
                          perfumeSort === 'avg_rating' ? 'avg_rating' :
                          perfumeSort === 'view_count' ? 'view_count' : 'cart_count'
                        }
                        name={SORT_OPTIONS.find(o => o.value === perfumeSort)?.label}
                        radius={[4, 4, 0, 0]}
                      >
                        {perfumeStats.slice(0, 15).map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 상세 테이블 */}
            <div>
              <SectionTitle icon={Package}>향수별 전체 지표 테이블</SectionTitle>
              <div className="bg-white rounded-2xl border border-[#e8dcc8] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#faf8f3] border-b border-[#e8dcc8]">
                        {['#','향수명','브랜드','장바구니','찜','주문수','매출','리뷰수','평점','조회수'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[#8b8278] font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {perfumeStats.map((p, i) => (
                        <tr key={i} className={`border-b border-[#f0e8d8] hover:bg-[#faf8f3] transition-colors ${i < 3 ? 'bg-[#fffdf8]' : ''}`}>
                          <td className="px-4 py-3">
                            {i === 0 ? <span className="font-bold text-[#1b271d]">1</span> : i === 1 ? <span className="font-bold text-[#1b271d]">2</span> : i === 2 ? <span className="font-bold text-[#1b271d]">3</span> : <span className="text-[#8b8278]">{i + 1}</span>}
                          </td>
                          <td className="px-4 py-3 font-semibold text-[#2a2620] max-w-[140px] truncate">{p.perfume_name}</td>
                          <td className="px-4 py-3 text-[#8b8278]">{p.brand_name || '-'}</td>
                          <td className="px-4 py-3 text-center font-semibold text-orange-500">{fmt(p.cart_count)}</td>
                          <td className="px-4 py-3 text-center font-semibold text-rose-500">{fmt(p.wishlist_count)}</td>
                          <td className="px-4 py-3 text-center font-semibold text-indigo-500">{fmt(p.order_count)}</td>
                          <td className="px-4 py-3 text-right font-bold text-[#c9a961]">₩{fmtW(p.total_revenue)}</td>
                          <td className="px-4 py-3 text-center text-emerald-600">{fmt(p.review_count)}</td>
                          <td className="px-4 py-3 text-center">
                            <span className="flex items-center justify-center gap-0.5">
                              <Star size={11} className="text-[#c9a961] fill-[#c9a961]" />
                              {Number(p.avg_rating || 0).toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center text-sky-500">{fmt(p.view_count)}</td>
                        </tr>
                      ))}
                      {perfumeStats.length === 0 && (
                        <tr><td colSpan={10} className="text-center py-16 text-[#8b8278]">
                          <BarChart2 size={32} className="mx-auto mb-2 opacity-30" />
                          데이터 없음
                        </td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: 조향 분석
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'ingredients' && (
          <>
            {/* 워드클라우드 스타일 */}
            <div>
              <SectionTitle icon={Flame}>인기 향료 워드클라우드</SectionTitle>
              <div className="bg-white rounded-2xl border border-[#e8dcc8] p-8 shadow-sm min-h-[260px] flex flex-wrap items-center justify-center gap-3">
                {loading ? <Skeleton h="h-52" /> : ingWords.length === 0 ? (
                  <p className="text-[#8b8278] text-sm">조향 데이터가 없습니다.</p>
                ) : ingWords.map((ing, i) => (
                  <span
                    key={i}
                    title={`사용 횟수: ${ing.usage_count}회 | 평균 비율: ${Number(ing.avg_ratio || 0).toFixed(1)}%`}
                    className="cursor-default transition-transform hover:scale-110"
                    style={{
                      fontSize: `${ing.fontSize}px`,
                      color: CHART_COLORS[i % CHART_COLORS.length],
                      opacity: ing.opacity,
                      fontWeight: ing.fontSize > 28 ? 700 : ing.fontSize > 20 ? 600 : 400,
                      letterSpacing: '0.02em',
                    }}
                  >
                    {ing.ingredient_name}
                  </span>
                ))}
              </div>
            </div>

            {/* 향료 TOP 15 바차트 */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <SectionTitle icon={BarChart2}>향료 사용 횟수 TOP 15</SectionTitle>
                <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
                  {loading ? <Skeleton h="h-80" /> : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart data={ingredientStats.slice(0, 15)} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#8b8278' }} tickLine={false} axisLine={false} />
                        <YAxis type="category" dataKey="ingredient_name" tick={{ fontSize: 11, fill: '#2a2620' }} width={80} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="usage_count" name="사용 횟수" radius={[0, 4, 4, 0]}>
                          {ingredientStats.slice(0, 15).map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              <div>
                <SectionTitle icon={BarChart2}>평균 배합 비율 TOP 15</SectionTitle>
                <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
                  {loading ? <Skeleton h="h-80" /> : (
                    <ResponsiveContainer width="100%" height={320}>
                      <BarChart
                        data={[...ingredientStats].sort((a, b) => Number(b.avg_ratio || 0) - Number(a.avg_ratio || 0)).slice(0, 15)}
                        layout="vertical" margin={{ left: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: '#8b8278' }} tickLine={false} axisLine={false} tickFormatter={v => `${v}%`} />
                        <YAxis type="category" dataKey="ingredient_name" tick={{ fontSize: 11, fill: '#2a2620' }} width={80} axisLine={false} tickLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Bar dataKey="avg_ratio" name="평균 비율(%)" radius={[0, 4, 4, 0]} fill={GOLD} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* 향료 상세 테이블 */}
            <div>
              <SectionTitle icon={Package}>향료 전체 통계</SectionTitle>
              <div className="bg-white rounded-2xl border border-[#e8dcc8] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#faf8f3] border-b border-[#e8dcc8]">
                        {['#','향료명','카테고리','사용 횟수','평균 비율(%)'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[#8b8278] font-semibold">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {ingredientStats.map((ing, i) => (
                        <tr key={i} className="border-b border-[#f0e8d8] hover:bg-[#faf8f3] transition-colors">
                          <td className="px-4 py-3 text-[#8b8278]">{i + 1}</td>
                          <td className="px-4 py-3 font-semibold text-[#2a2620]">{ing.ingredient_name}</td>
                          <td className="px-4 py-3">
                            {ing.category_name ? (
                              <span className="px-2 py-0.5 bg-[#f0e8d8] text-[#c9a961] rounded-full font-medium">{ing.category_name}</span>
                            ) : <span className="text-[#8b8278]">-</span>}
                          </td>
                          <td className="px-4 py-3 font-bold text-indigo-500">{fmt(ing.usage_count)}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-[#f0e8d8] rounded-full h-1.5 max-w-[80px]">
                                <div
                                  className="h-1.5 rounded-full bg-[#c9a961]"
                                  style={{ width: `${Math.min(100, Number(ing.avg_ratio || 0))}%` }}
                                />
                              </div>
                              <span className="text-[#2a2620] font-medium">{Number(ing.avg_ratio || 0).toFixed(1)}%</span>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {ingredientStats.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-16 text-[#8b8278]">조향 데이터 없음</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════
            TAB: 고객 분석
        ═══════════════════════════════════════════════════ */}
        {activeTab === 'customers' && (
          <>
            <div className="grid md:grid-cols-2 gap-6">
              {/* 등급별 분포 */}
              <div>
                <SectionTitle icon={Award}>회원 등급 분포</SectionTitle>
                <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
                  {loading ? <Skeleton h="h-72" /> : (
                    <>
                      <ResponsiveContainer width="100%" height={220}>
                        <PieChart>
                          <Pie
                            data={segmentData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={90}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            {segmentData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v) => [`${fmt(v)}명`, '회원수']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-4 space-y-2">
                        {segments.map((s, i) => (
                          <div key={i} className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-[#2a2620] font-medium">{s.rank_name}</span>
                            </div>
                            <span className="font-bold text-[#2a2620]">{fmt(s.user_count)}명</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* 성별 구매 통계 */}
              <div>
                <SectionTitle icon={Users}>이번 달 성별 구매 통계</SectionTitle>
                <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
                  {loading ? <Skeleton h="h-72" /> : genderData.length === 0 ? (
                    <div className="flex items-center justify-center h-60 text-[#8b8278] text-sm">이번 달 데이터 없음</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={genderData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#2a2620' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="left"  tick={{ fontSize: 11, fill: '#8b8278' }} axisLine={false} tickLine={false} />
                        <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11, fill: '#8b8278' }} axisLine={false} tickLine={false} tickFormatter={v => fmtW(v)} />
                        <Tooltip content={<CustomTooltip />} />
                        <Legend wrapperStyle={{ fontSize: 12 }} />
                        <Bar yAxisId="left"  dataKey="value" name="주문수" fill={GOLD}      radius={[4, 4, 0, 0]} />
                        <Bar yAxisId="right" dataKey="매출"  name="매출"   fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            </div>

            {/* 연령대 분포 */}
            <div>
              <SectionTitle icon={Users}>최근 90일 연령대별 주문 분포</SectionTitle>
              <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
                {loading ? <Skeleton h="h-64" /> : ageData.length === 0 ? (
                  <div className="flex items-center justify-center h-52 text-[#8b8278] text-sm">생년월일 데이터 없음</div>
                ) : (
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={ageData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0e8d8" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#2a2620' }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#8b8278' }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="주문수" radius={[6, 6, 0, 0]}>
                        {ageData.map((_, i) => (
                          <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* 전환율 낮은 상품 (고객 인사이트) */}
            <div>
              <SectionTitle icon={TrendingDown}>마케팅 기회: 찜 많은데 구매 적은 상품 (쿠폰 타겟 추천)</SectionTitle>
              <div className="bg-white rounded-2xl border border-[#e8dcc8] shadow-sm overflow-hidden">
                <div className="px-6 py-4 bg-amber-50 border-b border-amber-100">
                  <p className="text-xs text-amber-700 font-medium">
                    아래 상품들은 위시리스트 등록은 많지만 구매 전환율이 낮습니다. 해당 고객에게 할인 쿠폰을 발송하면 효과적입니다.
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="bg-[#faf8f3] border-b border-[#e8dcc8]">
                        {['향수명','브랜드','찜 수','장바구니','주문수','전환율','액션'].map(h => (
                          <th key={h} className="px-4 py-3 text-left text-[#8b8278] font-semibold whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lowConversion.map((p, i) => (
                        <tr key={i} className="border-b border-[#f0e8d8] hover:bg-[#faf8f3] transition-colors">
                          <td className="px-4 py-3 font-semibold text-[#2a2620]">{p.perfume_name}</td>
                          <td className="px-4 py-3 text-[#8b8278]">{p.brand_name || '-'}</td>
                          <td className="px-4 py-3 text-rose-500 font-bold">{fmt(p.wishlist_count)}</td>
                          <td className="px-4 py-3 text-orange-500 font-semibold">{fmt(p.cart_count)}</td>
                          <td className="px-4 py-3 text-indigo-500">{fmt(p.order_count)}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-1 rounded-full font-bold text-[11px] ${
                              Number(p.conversion_rate) < 10 ? 'bg-red-50 text-red-500' :
                              Number(p.conversion_rate) < 30 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'
                            }`}>
                              {p.conversion_rate}%
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => navigate('/admin/coupons')}
                              className="px-3 py-1 bg-[#c9a961] text-white rounded-lg text-[11px] font-semibold hover:bg-[#b8963a] transition-colors"
                            >
                              쿠폰 발송
                            </button>
                          </td>
                        </tr>
                      ))}
                      {lowConversion.length === 0 && (
                        <tr><td colSpan={7} className="text-center py-12 text-[#8b8278]">데이터 없음</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminStatistics;