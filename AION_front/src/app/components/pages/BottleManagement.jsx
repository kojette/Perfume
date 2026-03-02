/**
 * BottleManagement.jsx
 * 위치: src/components/pages/BottleManagement.jsx
 *
 * 관리자용 공병 템플릿 관리 페이지.
 * 모든 데이터는 백엔드 API (http://localhost:8080/api/custom/bottles) 를 통해 처리.
 *
 * App.jsx 라우팅: /admin/bottles → AdminRoute 로 보호
 */

import React, { useState, useEffect } from 'react';
import { Trash2 } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8080';

// BottleSVG의 shape 키와 동일해야 함
const SHAPE_OPTIONS = [
  { value: 'round',     label: '라운드' },
  { value: 'cylinder',  label: '실린더' },
  { value: 'square',    label: '스퀘어' },
  { value: 'flat',      label: '플랫' },
  { value: 'teardrop',  label: '티어드롭' },
  { value: 'hexagon',   label: '헥사곤' },
  { value: 'artdeco',   label: '아르데코' },
  { value: 'arch',      label: '아치' },
  { value: 'dome',      label: '돔' },
  { value: 'rectangle', label: '레트앵귤러' },
];

const BottleManagement = () => {
  const [bottles, setBottles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ name: '', shape: 'round', basePrice: 15000 });

  const token = sessionStorage.getItem('accessToken');

  useEffect(() => { fetchBottles(); }, []);

  // ── 전체 공병 목록 조회 (관리자, 비활성 포함) ────────────────────────
  // GET /api/custom/bottles/all
  const fetchBottles = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/custom/bottles/all`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setBottles(json.data || []);
      }
    } catch (e) {
      console.error('공병 목록 로드 오류:', e);
    } finally {
      setLoading(false);
    }
  };

  // ── 공병 추가 ────────────────────────────────────────────────────────
  // POST /api/custom/bottles  Body: { name, shape, basePrice }
  const handleAdd = async () => {
    if (!form.name.trim()) { alert('공병 이름을 입력하세요.'); return; }
    try {
      const res = await fetch(`${API_BASE_URL}/api/custom/bottles`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name.trim(),
          shape: form.shape,
          basePrice: Number(form.basePrice),
        }),
      });

      if (res.ok) {
        setFormOpen(false);
        setForm({ name: '', shape: 'round', basePrice: 15000 });
        await fetchBottles();
      } else {
        alert('추가에 실패했습니다.');
      }
    } catch (e) {
      console.error('공병 추가 오류:', e);
    }
  };

  // ── 공병 활성/비활성 토글 ─────────────────────────────────────────────
  // PATCH /api/custom/bottles/{bottleId}/toggle
  const toggleActive = async (bottleId) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/custom/bottles/${bottleId}/toggle`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) await fetchBottles();
      else alert('상태 변경에 실패했습니다.');
    } catch (e) {
      console.error('토글 오류:', e);
    }
  };

  // ── 공병 삭제 ────────────────────────────────────────────────────────
  // DELETE /api/custom/bottles/{bottleId}
  const handleDelete = async (bottleId) => {
    if (!window.confirm('이 공병을 삭제하시겠습니까?')) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/custom/bottles/${bottleId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) await fetchBottles();
      else alert('삭제에 실패했습니다.');
    } catch (e) {
      console.error('삭제 오류:', e);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6">
      <div className="max-w-4xl mx-auto">

        {/* 헤더 */}
        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-3 italic">ADMIN</div>
          <h2 className="font-serif text-2xl tracking-[0.3em] text-[#1a1a1a]">공병 템플릿 관리</h2>
          <p className="text-[9px] text-[#8b8278] mt-2 tracking-widest italic">기본 10종은 코드에 내장. 여기서 추가 공병을 관리합니다.</p>
        </div>

        <div className="flex justify-end mb-6">
          <button
            onClick={() => setFormOpen(!formOpen)}
            className="flex items-center gap-2 px-6 py-3 border border-[#c9a961] text-[#c9a961] text-[11px] tracking-widest hover:bg-[#c9a961] hover:text-white transition-all"
          >
            + 새 공병 추가
          </button>
        </div>

        {/* 추가 폼 */}
        {formOpen && (
          <div className="bg-white border border-[#c9a961]/20 p-6 mb-6 space-y-4">
            <div className="text-[11px] tracking-widest text-[#8b8278] mb-4">새 공병 정보 입력</div>
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-48">
                <label className="text-[10px] tracking-wider text-[#8b8278] block mb-1">이름 *</label>
                <input type="text" value={form.name}
                  onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  className="w-full border-b border-[#c9a961]/30 bg-transparent text-sm pb-1 outline-none"
                  placeholder="공병 이름" />
              </div>
              <div>
                <label className="text-[10px] tracking-wider text-[#8b8278] block mb-1">형태</label>
                <select value={form.shape}
                  onChange={e => setForm(p => ({ ...p, shape: e.target.value }))}
                  className="border border-[#c9a961]/20 text-sm px-3 py-1 bg-[#faf8f3] outline-none">
                  {SHAPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] tracking-wider text-[#8b8278] block mb-1">기본 가격 (₩)</label>
                <input type="number" value={form.basePrice}
                  onChange={e => setForm(p => ({ ...p, basePrice: e.target.value }))}
                  className="w-32 border-b border-[#c9a961]/30 bg-transparent text-sm pb-1 outline-none" />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={handleAdd}
                className="px-6 py-2 bg-[#1a1a1a] text-white text-[11px] tracking-widest hover:bg-[#c9a961] transition-all">저장</button>
              <button onClick={() => setFormOpen(false)}
                className="px-6 py-2 border border-[#c9a961]/30 text-[#8b8278] text-[11px] tracking-widest hover:border-[#c9a961] transition-all">취소</button>
            </div>
          </div>
        )}

        {/* 목록 */}
        {loading ? (
          <div className="text-center text-[#8b8278] italic py-10">로딩 중...</div>
        ) : (
          <div className="bg-white border border-[#c9a961]/20">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#c9a961]/20 text-[10px] tracking-widest text-[#8b8278]">
                  <th className="py-4 px-6 font-normal">이름</th>
                  <th className="py-4 px-4 font-normal">형태 (shape)</th>
                  <th className="py-4 px-4 font-normal text-right">기본 가격</th>
                  <th className="py-4 px-4 font-normal text-center">상태</th>
                  <th className="py-4 px-4 font-normal text-center">관리</th>
                </tr>
              </thead>
              <tbody>
                {bottles.map(b => (
                  <tr key={b.bottleId} className="border-b border-[#eee] last:border-0 hover:bg-[#faf8f3]">
                    <td className="py-4 px-6 text-sm text-[#1a1a1a]">{b.name}</td>
                    <td className="py-4 px-4 text-[11px] text-[#8b8278] font-mono">{b.shape}</td>
                    <td className="py-4 px-4 text-[11px] text-right text-[#c9a961]">₩{b.basePrice?.toLocaleString()}</td>
                    <td className="py-4 px-4 text-center">
                      <button
                        onClick={() => toggleActive(b.bottleId)}
                        className={`text-[10px] tracking-wider px-3 py-1 border transition-all ${
                          b.isActive ? 'border-[#c9a961] text-[#c9a961]' : 'border-red-200 text-red-300'
                        }`}
                      >
                        {b.isActive ? '활성' : '비활성'}
                      </button>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <button onClick={() => handleDelete(b.bottleId)} className="text-red-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                {bottles.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-[#8b8278] italic text-sm">등록된 추가 공병이 없습니다.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default BottleManagement;
