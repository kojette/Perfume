import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Package, EyeOff, Search, 
  Image as ImageIcon, Percent, RotateCcw, Ban, Star, CheckSquare, Square
} from 'lucide-react';
import { Ornament } from '../Ornament';

const PerfumeManagement = () => {
  const [perfumes, setPerfumes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]); 
  const [filterBrand, setFilterBrand] = useState('all'); 
  
  const initialFormState = {
    id: null,
    name: '',
    brand: '',
    price: 0,
    volume: '50ml',
    category: '플로럴',
    gender: '유니섹스',
    notes: { top: '', middle: '', base: '' },
    stock: 0,
    imageUrl: '',
    isDiscontinued: false,
    discontinueReason: '',
    isNew: false, 
    discountRate: 0 
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('perfumeInventory') || '[]');
    setPerfumes(saved);
  }, []);

  const saveAndRefresh = (data) => {
    localStorage.setItem('perfumeInventory', JSON.stringify(data));
    setPerfumes(data);
  };

  const handleSave = (e) => {
    e.preventDefault();
    const allData = JSON.parse(localStorage.getItem('perfumeInventory') || '[]');
    if (formData.id) {
      const updated = allData.map(p => p.id === formData.id ? formData : p);
      saveAndRefresh(updated);
    } else {
      const newData = { ...formData, id: Date.now(), createdAt: new Date().toISOString() };
      allData.push(newData);
      saveAndRefresh(allData);
    }
    setIsModalOpen(false);
  };

  const handleSetOutOfStock = (id) => {
    if(confirm('이 상품을 품절 처리하시겠습니까?')) {
      const updated = perfumes.map(p => p.id === id ? { ...p, stock: 0 } : p);
      saveAndRefresh(updated);
    }
  };

  const applyBulkDiscount = () => {
    if (selectedIds.length === 0) return alert('할인을 적용할 상품을 선택해주세요.');
    const rate = prompt('선택한 상품들에 적용할 할인율(%)을 입력하세요 (0 입력 시 할인 취소):');
    if (rate !== null && !isNaN(rate)) {
      const updated = perfumes.map(p => 
        selectedIds.includes(p.id) ? { ...p, discountRate: parseInt(rate) } : p
      );
      saveAndRefresh(updated);
      setSelectedIds([]);
    }
  };

  const filteredPerfumes = useMemo(() => {
    return perfumes.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = filterBrand === 'all' || p.brand === filterBrand;
      return matchesSearch && matchesBrand;
    });
  }, [perfumes, searchTerm, filterBrand]);

  const brands = useMemo(() => ['all', ...new Set(perfumes.map(p => p.brand))], [perfumes]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">ADMINISTRATION</div>
          <Ornament className="mb-6" />
          <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-4">인벤토리 관리</h1>
        </div>

        {/* 상단 컨트롤바 */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 justify-between items-center bg-white p-4 rounded-xl border border-[#c9a961]/10">
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8b8278]" />
              <input 
                type="text" placeholder="검색..." 
                className="w-full pl-10 pr-4 py-2 bg-[#faf8f3] rounded-lg text-sm outline-none border border-transparent focus:border-[#c9a961]/30 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              className="px-3 py-2 bg-[#faf8f3] rounded-lg text-xs border-none outline-none cursor-pointer"
              onChange={(e) => setFilterBrand(e.target.value)}
            >
              {brands.map(b => <option key={b} value={b}>{b === 'all' ? '전체 브랜드' : b}</option>)}
            </select>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button onClick={applyBulkDiscount} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-[11px] font-bold hover:bg-orange-100 transition-colors">
              <Percent className="w-3.5 h-3.5" /> 일괄 할인 설정
            </button>
            <button onClick={() => { setFormData(initialFormState); setIsModalOpen(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#2a2620] text-white rounded-lg text-[11px] font-bold hover:bg-[#c9a961] transition-all">
              <Plus className="w-3.5 h-3.5" /> 신규 등록
            </button>
          </div>
        </div>

        {/* 리스트 테이블 */}
        <div className="bg-white border border-[#c9a961]/20 rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead className="bg-[#fcfaf7] border-b border-[#c9a961]/20">
              <tr className="text-[10px] tracking-widest text-[#8b8278] font-bold uppercase">
                <th className="p-5 w-12">선택</th>
                <th className="p-5">제품 상세</th>
                <th className="p-5">가격/재고</th>
                <th className="p-5">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#c9a961]/10">
              {filteredPerfumes.map(p => (
                <tr key={p.id} className={`${p.isDiscontinued ? 'bg-red-50/30' : 'hover:bg-gray-50/30'} transition-colors`}>
                  <td className="p-5">
                    <button onClick={() => toggleSelect(p.id)} className="text-[#c9a961]">
                      {selectedIds.includes(p.id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="p-5 flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-white rounded border border-[#c9a961]/10 overflow-hidden shadow-inner">
                      {p.imageUrl ? <img src={p.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-full h-full p-3 text-[#c9a961]/10" />}
                      {p.isNew && <div className="absolute top-0 right-0 bg-[#c9a961] text-white text-[7px] px-1 font-bold shadow-sm">NEW</div>}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#2a2620] flex items-center gap-1.5">
                        {p.name}
                        {p.isNew && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </div>
                      <div className="text-[10px] text-[#8b8278] font-medium">{p.brand} · {p.category} · {p.volume}</div>
                      {p.isDiscontinued && <div className="text-[9px] text-red-500 font-bold mt-0.5 italic">단종: {p.discontinueReason}</div>}
                    </div>
                  </td>
                  <td className="p-5">
                    {/* 가격 표시 로직: 할인 시 취소선 적용 */}
                    {p.discountRate > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-red-500 line-through decoration-red-500/70 font-medium">
                          {p.price.toLocaleString()}원
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#2a2620]">
                            {(p.price * (1 - p.discountRate / 100)).toLocaleString()}원
                          </span>
                          <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1 rounded">
                            {p.discountRate}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-[#2a2620]">{p.price.toLocaleString()}원</div>
                    )}
                    
                    <div className={`text-[10px] mt-1 ${p.stock === 0 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                      {p.stock === 0 ? '품절' : `재고 ${p.stock}개`}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-1.5">
                      {!p.isDiscontinued ? (
                        <>
                          <button onClick={() => { setFormData(p); setIsModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded" title="수정"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => handleSetOutOfStock(p.id)} className="p-2 text-amber-600 hover:bg-amber-50 rounded" title="품절"><Ban className="w-4 h-4" /></button>
                          <button onClick={() => {
                            const r = prompt('단종 사유:');
                            if(r) saveAndRefresh(perfumes.map(i => i.id === p.id ? {...i, isDiscontinued: true, discontinueReason: r} : i))
                          }} className="p-2 text-red-400 hover:bg-red-50 rounded" title="단종"><EyeOff className="w-4 h-4" /></button>
                        </>
                      ) : (
                        <button onClick={() => saveAndRefresh(perfumes.map(i => i.id === p.id ? {...i, isDiscontinued: false, discontinueReason: ''} : i))} className="flex items-center gap-1 px-3 py-1.5 bg-[#2a2620] text-white text-[10px] rounded hover:bg-[#c9a961] transition-all">
                          <RotateCcw className="w-3 h-3" /> 복구
                        </button>
                      )}
                      <button onClick={() => { if(confirm('데이터를 영구 삭제하시겠습니까?')) saveAndRefresh(perfumes.filter(i => i.id !== p.id)) }} className="p-2 text-gray-300 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모달 창 (기존 정보 입력 + 신상 체크박스) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] border border-[#c9a961]/20">
            <div className="flex justify-between items-center mb-6 border-b border-[#c9a961]/10 pb-4">
              <h2 className="font-display text-lg tracking-widest text-[#2a2620] uppercase font-bold">Product Specification</h2>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input type="checkbox" checked={formData.isNew} onChange={e => setFormData({...formData, isNew: e.target.checked})} className="w-4 h-4 accent-[#c9a961]" />
                <span className="text-[10px] font-bold text-[#c9a961] group-hover:text-[#2a2620] transition-colors">신상(NEW) 라인업 등록</span>
              </label>
            </div>
            
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-tighter">Image Preview</label>
                  <div className="relative aspect-square bg-[#faf8f3] border border-dashed border-[#c9a961]/30 rounded-lg flex items-center justify-center overflow-hidden hover:bg-[#f5f0e6] transition-colors">
                    {formData.imageUrl ? <img src={formData.imageUrl} className="w-full h-full object-cover" /> : <ImageIcon className="w-8 h-8 text-[#c9a961]/20" />}
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => setFormData({...formData, imageUrl: reader.result});
                        reader.readAsDataURL(file);
                      }
                    }} />
                  </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Scent Notes</label>
                   <input className="w-full text-xs border-b border-[#c9a961]/10 py-2 outline-none focus:border-[#c9a961] transition-all" placeholder="TOP NOTES" value={formData.notes.top} onChange={e => setFormData({...formData, notes: {...formData.notes, top: e.target.value}})} />
                   <input className="w-full text-xs border-b border-[#c9a961]/10 py-2 outline-none focus:border-[#c9a961] transition-all" placeholder="MIDDLE NOTES" value={formData.notes.middle} onChange={e => setFormData({...formData, notes: {...formData.notes, middle: e.target.value}})} />
                   <input className="w-full text-xs border-b border-[#c9a961]/10 py-2 outline-none focus:border-[#c9a961] transition-all" placeholder="BASE NOTES" value={formData.notes.base} onChange={e => setFormData({...formData, notes: {...formData.notes, base: e.target.value}})} />
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-[#c9a961] font-bold uppercase">Perfume Name</label>
                  <input required placeholder="향수 이름" className="w-full border-b py-2 outline-none text-sm font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] text-[#c9a961] font-bold uppercase">Brand</label>
                  <input required placeholder="브랜드" className="w-full border-b py-2 outline-none text-sm" value={formData.brand} onChange={e => setFormData({...formData, brand: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Price (원)</label>
                    <input type="number" className="w-full border-b py-1 text-sm outline-none focus:border-[#c9a961]" value={formData.price} onChange={e => setFormData({...formData, price: parseInt(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Stock (재고)</label>
                    <input type="number" className="w-full border-b py-1 text-sm outline-none focus:border-[#c9a961]" value={formData.stock} onChange={e => setFormData({...formData, stock: parseInt(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Volume</label>
                    <select className="w-full border-b py-2 text-[11px] bg-transparent outline-none cursor-pointer" value={formData.volume} onChange={e => setFormData({...formData, volume: e.target.value})}>
                      <option>30ml</option><option>50ml</option><option>100ml</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Gender</label>
                    <select className="w-full border-b py-2 text-[11px] bg-transparent outline-none cursor-pointer" value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})}>
                      <option value="유니섹스">유니섹스</option><option value="남성용">남성용</option><option value="여성용">여성용</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Category</label>
                  <select className="w-full border-b py-2 text-[11px] bg-transparent outline-none cursor-pointer" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                    <option>플로럴</option><option>우디</option><option>시트러스</option><option>머스크</option><option>그린</option><option>오리엔탈</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-10">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 text-[10px] text-gray-400 border rounded-lg uppercase tracking-widest hover:bg-gray-50 transition-colors">Cancel</button>
                  <button type="submit" className="flex-[2] py-3 bg-[#2a2620] text-white text-[10px] font-bold rounded-lg uppercase tracking-[0.2em] hover:bg-[#c9a961] transition-all shadow-md">Save Changes</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PerfumeManagement;