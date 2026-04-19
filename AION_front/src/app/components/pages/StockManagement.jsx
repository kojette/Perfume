import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Ornament } from '../Ornament';
import { ArrowLeft, Package, AlertTriangle, Plus, RefreshCw, Search, ChevronDown, ChevronUp } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const getAdminToken = async () => {
  const { data } = await supabase.auth.getSession();
  return data?.session?.access_token ? `Bearer ${data.session.access_token}` : null;
};

const StockManagement = () => {
  const navigate = useNavigate();

  const [perfumes, setPerfumes]     = useState([]);
  const [stockLogs, setStockLogs]   = useState([]);
  const [lowStock, setLowStock]     = useState([]);
  const [loading, setLoading]       = useState(true);
  const [logLoading, setLogLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [search, setSearch]           = useState('');
  const [activeTab, setActiveTab]     = useState('receive'); // 'receive' | 'logs' | 'alerts'

  // 입고 폼
  const [selectedPerfume, setSelectedPerfume] = useState(null);
  const [receiveQty, setReceiveQty]   = useState('');
  const [reason, setReason]           = useState('');
  const [lotNumber, setLotNumber]     = useState('');

  // ── 데이터 로드 ──────────────────────────────────────────
  const fetchPerfumes = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('Perfumes')
        .select('perfume_id, name, name_en, total_stock, stock_threshold, is_active, brand_id, Brands(brand_name)')
        .eq('is_active', true)
        .order('name');
      setPerfumes(data || []);
      setLowStock((data || []).filter(p => (p.total_stock ?? 0) <= (p.stock_threshold ?? 10)));
    } catch (e) {
      console.error('향수 로드 실패:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStockLogs = useCallback(async () => {
    setLogLoading(true);
    try {
      const { data } = await supabase
        .from('Stock_Logs')
        .select(`
          stock_log_id, change_type, change_amount, quantity_before, quantity_after,
          lot_number, reason, created_at,
          Perfumes(name)
        `)
        .order('created_at', { ascending: false })
        .limit(50);
      setStockLogs(data || []);
    } catch (e) {
      console.error('재고 로그 로드 실패:', e);
    } finally {
      setLogLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPerfumes();
    fetchStockLogs();
  }, [fetchPerfumes, fetchStockLogs]);

  // ── 입고 처리 ────────────────────────────────────────────
  const handleReceive = async () => {
    if (!selectedPerfume) { alert('향수를 선택해주세요.'); return; }
    const qty = parseInt(receiveQty);
    if (!qty || qty <= 0) { alert('수량을 올바르게 입력해주세요.'); return; }

    setSubmitting(true);
    try {
      const token = await getAdminToken();

      // 백엔드 API 호출 (없으면 직접 Supabase 업데이트)
      const res = await fetch(`${API_BASE}/api/admin/stock/receive`, {
        method: 'POST',
        headers: { Authorization: token, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          perfumeId: selectedPerfume.perfume_id,
          quantity: qty,
          reason: reason || '관리자 입고',
          lotNumber: lotNumber || null,
          warehouseId: 1, // 기본 창고 (추후 선택 가능)
        }),
      });

      if (res.ok) {
        alert(`✓ ${selectedPerfume.name} ${qty}개 입고 완료`);
        setSelectedPerfume(null);
        setReceiveQty('');
        setReason('');
        setLotNumber('');
        fetchPerfumes();
        fetchStockLogs();
      } else {
        // 백엔드 API 없을 경우 Supabase 직접 처리 fallback
        const before = selectedPerfume.total_stock ?? 0;
        const after = before + qty;

        const { error: updateErr } = await supabase
          .from('Perfumes')
          .update({ total_stock: after, updated_at: new Date().toISOString() })
          .eq('perfume_id', selectedPerfume.perfume_id);

        if (updateErr) throw updateErr;

        // Stock_Logs 직접 삽입
        await supabase.from('Stock_Logs').insert({
          perfume_id: selectedPerfume.perfume_id,
          warehouse_id: 1,
          change_type: 'STOCK_IN',
          change_amount: qty,
          quantity_before: before,
          quantity_after: after,
          lot_number: lotNumber || null,
          reason: reason || '관리자 입고',
        });

        alert(`✓ ${selectedPerfume.name} ${qty}개 입고 완료 (직접 처리)`);
        setSelectedPerfume(null);
        setReceiveQty('');
        setReason('');
        setLotNumber('');
        fetchPerfumes();
        fetchStockLogs();
      }
    } catch (e) {
      console.error('입고 처리 실패:', e);
      alert('입고 처리 중 오류가 발생했습니다: ' + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  // ── 필터 ────────────────────────────────────────────────
  const filteredPerfumes = perfumes.filter(p =>
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.Brands?.brand_name?.toLowerCase().includes(search.toLowerCase())
  );

  const fmtDate = (d) => d ? new Date(d).toLocaleString('ko-KR', { month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-';

  return (
    <div className="min-h-screen bg-[#faf8f3] pb-20">

      {/* 헤더 */}
      <div className="sticky top-0 z-10 bg-[#faf8f3]/95 backdrop-blur border-b border-[#e8dcc8] px-6 py-4 flex items-center gap-4">
        <button onClick={() => navigate('/admin')} className="p-2 hover:bg-[#f0e8d8] rounded-lg transition-colors">
          <ArrowLeft size={18} className="text-[#8b8278]" />
        </button>
        <div>
          <h1 className="text-lg font-bold text-[#2a2620] tracking-widest">재고 입고 관리</h1>
          <p className="text-xs text-[#8b8278]">향수 입고 처리 및 재고 이력 조회</p>
        </div>
        <button onClick={() => { fetchPerfumes(); fetchStockLogs(); }} className="ml-auto flex items-center gap-2 px-3 py-2 bg-white border border-[#e8dcc8] rounded-lg text-xs text-[#2a2620] hover:border-[#c9a961] transition-all">
          <RefreshCw size={12} />새로고침
        </button>
      </div>

      {/* 재고 부족 알림 배너 */}
      {lowStock.length > 0 && (
        <div className="mx-6 mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-700">재고 부족 상품 {lowStock.length}개</p>
            <p className="text-xs text-amber-600 mt-1">
              {lowStock.slice(0, 3).map(p => p.name).join(', ')}{lowStock.length > 3 ? ` 외 ${lowStock.length - 3}개` : ''}
            </p>
          </div>
          <button onClick={() => setActiveTab('alerts')} className="ml-auto text-xs text-amber-600 underline whitespace-nowrap">
            전체 보기
          </button>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 pt-6">

        {/* 탭 */}
        <div className="flex gap-1 mb-6 border-b border-[#e8dcc8]">
          {[
            { id: 'receive', label: '입고 처리' },
            { id: 'logs',    label: '재고 이력' },
            { id: 'alerts',  label: `재고 부족 ${lowStock.length > 0 ? `(${lowStock.length})` : ''}` },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 text-xs font-semibold tracking-wider rounded-t-lg border-b-2 transition-all ${
                activeTab === tab.id ? 'text-[#c9a961] border-[#c9a961] bg-white' : 'text-[#8b8278] border-transparent hover:text-[#2a2620]'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 입고 처리 탭 ── */}
        {activeTab === 'receive' && (
          <div className="grid md:grid-cols-2 gap-6">

            {/* 향수 선택 */}
            <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#2a2620] mb-4 tracking-wider">① 향수 선택</h3>
              <div className="relative mb-4">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b8278]" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="향수명 또는 브랜드 검색"
                  className="w-full pl-9 pr-4 py-2.5 border border-[#e8dcc8] rounded-lg text-sm focus:outline-none focus:border-[#c9a961] bg-[#faf8f3]"
                />
              </div>
              <div className="max-h-80 overflow-y-auto space-y-1">
                {loading ? (
                  <p className="text-center py-8 text-[#8b8278] text-sm">로딩 중...</p>
                ) : filteredPerfumes.map(p => {
                  const isLow = (p.total_stock ?? 0) <= (p.stock_threshold ?? 10);
                  const isSelected = selectedPerfume?.perfume_id === p.perfume_id;
                  return (
                    <button key={p.perfume_id} onClick={() => setSelectedPerfume(p)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-left transition-all border ${
                        isSelected ? 'border-[#c9a961] bg-[#c9a961]/5' : 'border-transparent hover:border-[#e8dcc8] hover:bg-[#faf8f3]'
                      }`}>
                      <div>
                        <p className="text-sm font-medium text-[#2a2620]">{p.name}</p>
                        <p className="text-xs text-[#8b8278]">{p.Brands?.brand_name || '-'}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${isLow ? 'text-red-500' : 'text-[#2a2620]'}`}>
                          {p.total_stock ?? 0}개
                        </p>
                        {isLow && <p className="text-[10px] text-red-400">부족</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 입고 폼 */}
            <div className="bg-white rounded-2xl border border-[#e8dcc8] p-6 shadow-sm">
              <h3 className="text-sm font-bold text-[#2a2620] mb-4 tracking-wider">② 입고 정보 입력</h3>

              {!selectedPerfume ? (
                <div className="flex flex-col items-center justify-center h-48 text-[#8b8278]">
                  <Package size={36} className="mb-3 opacity-20" />
                  <p className="text-sm">왼쪽에서 향수를 선택해주세요</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* 선택된 향수 */}
                  <div className="p-4 bg-[#faf8f3] border border-[#c9a961]/20 rounded-lg">
                    <p className="text-xs text-[#8b8278] mb-1">선택된 향수</p>
                    <p className="font-semibold text-[#2a2620]">{selectedPerfume.name}</p>
                    <p className="text-xs text-[#8b8278] mt-1">현재 재고: <span className="font-bold text-[#c9a961]">{selectedPerfume.total_stock ?? 0}개</span></p>
                  </div>

                  {/* 입고 수량 */}
                  <div>
                    <label className="block text-xs text-[#8b8278] mb-2 tracking-wider font-bold uppercase">입고 수량 *</label>
                    <input
                      type="number"
                      min="1"
                      value={receiveQty}
                      onChange={e => setReceiveQty(e.target.value)}
                      placeholder="수량 입력"
                      className="w-full px-4 py-3 border border-[#e8dcc8] rounded-lg text-sm focus:outline-none focus:border-[#c9a961] bg-[#faf8f3]"
                    />
                    {receiveQty && parseInt(receiveQty) > 0 && (
                      <p className="text-xs text-[#c9a961] mt-1">
                        입고 후 재고: {(selectedPerfume.total_stock ?? 0) + parseInt(receiveQty)}개
                      </p>
                    )}
                  </div>

                  {/* 로트 번호 */}
                  <div>
                    <label className="block text-xs text-[#8b8278] mb-2 tracking-wider font-bold uppercase">로트 번호 (선택)</label>
                    <input
                      type="text"
                      value={lotNumber}
                      onChange={e => setLotNumber(e.target.value)}
                      placeholder="예: LOT-2026-04-001"
                      className="w-full px-4 py-3 border border-[#e8dcc8] rounded-lg text-sm focus:outline-none focus:border-[#c9a961] bg-[#faf8f3]"
                    />
                  </div>

                  {/* 입고 사유 */}
                  <div>
                    <label className="block text-xs text-[#8b8278] mb-2 tracking-wider font-bold uppercase">입고 사유</label>
                    <select
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                      className="w-full px-4 py-3 border border-[#e8dcc8] rounded-lg text-sm focus:outline-none focus:border-[#c9a961] bg-[#faf8f3]"
                    >
                      <option value="">선택 (기본: 관리자 입고)</option>
                      <option value="정기 발주">정기 발주</option>
                      <option value="긴급 발주">긴급 발주 (재고 부족)</option>
                      <option value="교환 입고">교환/반품 처리 입고</option>
                      <option value="샘플 입고">샘플 입고</option>
                      <option value="재고 조정">재고 조정</option>
                    </select>
                  </div>

                  <button
                    onClick={handleReceive}
                    disabled={submitting || !receiveQty}
                    className="w-full py-4 bg-[#1b271d] text-white text-xs tracking-[0.3em] hover:bg-[#c9a961] transition-all uppercase disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold"
                  >
                    {submitting ? '처리 중...' : '입고 처리'}
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 재고 이력 탭 ── */}
        {activeTab === 'logs' && (
          <div className="bg-white rounded-2xl border border-[#e8dcc8] shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8dcc8] flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#2a2620] tracking-wider">최근 재고 변동 이력 (50건)</h3>
            </div>
            {logLoading ? (
              <div className="py-16 text-center text-[#8b8278] text-sm">이력 로딩 중...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#faf8f3] border-b border-[#e8dcc8]">
                      {['일시', '향수명', '구분', '변동', '변동 전', '변동 후', '로트', '사유'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-[#8b8278] font-semibold whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stockLogs.map(log => (
                      <tr key={log.stock_log_id} className="border-b border-[#f0e8d8] hover:bg-[#faf8f3]">
                        <td className="px-4 py-3 text-[#8b8278] whitespace-nowrap">{fmtDate(log.created_at)}</td>
                        <td className="px-4 py-3 font-medium text-[#2a2620]">{log.Perfumes?.name || '-'}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.change_type === 'STOCK_IN' ? 'bg-green-50 text-green-600' :
                            log.change_type === 'STOCK_OUT' ? 'bg-red-50 text-red-500' :
                            'bg-gray-50 text-gray-500'
                          }`}>
                            {log.change_type === 'STOCK_IN' ? '입고' : log.change_type === 'STOCK_OUT' ? '출고' : log.change_type}
                          </span>
                        </td>
                        <td className={`px-4 py-3 font-bold ${log.change_amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                          {log.change_amount > 0 ? '+' : ''}{log.change_amount}
                        </td>
                        <td className="px-4 py-3 text-[#8b8278]">{log.quantity_before}</td>
                        <td className="px-4 py-3 font-semibold text-[#2a2620]">{log.quantity_after}</td>
                        <td className="px-4 py-3 text-[#8b8278]">{log.lot_number || '-'}</td>
                        <td className="px-4 py-3 text-[#8b8278]">{log.reason || '-'}</td>
                      </tr>
                    ))}
                    {stockLogs.length === 0 && (
                      <tr><td colSpan={8} className="text-center py-12 text-[#8b8278]">재고 이력이 없습니다</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── 재고 부족 탭 ── */}
        {activeTab === 'alerts' && (
          <div className="space-y-3">
            {lowStock.length === 0 ? (
              <div className="py-20 text-center bg-white rounded-2xl border border-[#e8dcc8]">
                <Package size={40} className="mx-auto mb-3 text-[#c9a961]/30" />
                <p className="text-sm text-[#8b8278]">재고 부족 상품이 없습니다 🎉</p>
              </div>
            ) : lowStock.map(p => (
              <div key={p.perfume_id} className="bg-white rounded-2xl border border-amber-200 p-5 flex items-center justify-between shadow-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle size={14} className="text-amber-500" />
                    <p className="font-semibold text-[#2a2620]">{p.name}</p>
                    <span className="text-[10px] text-[#8b8278]">{p.Brands?.brand_name}</span>
                  </div>
                  <p className="text-xs text-[#8b8278]">
                    현재 재고: <span className="font-bold text-red-500">{p.total_stock ?? 0}개</span>
                    <span className="mx-2">·</span>
                    임계값: <span className="font-medium">{p.stock_threshold ?? 10}개</span>
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedPerfume(p); setActiveTab('receive'); }}
                  className="px-4 py-2 bg-[#1b271d] text-white text-xs tracking-widest hover:bg-[#c9a961] transition-all rounded-lg whitespace-nowrap"
                >
                  입고 처리 →
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StockManagement;
