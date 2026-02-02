import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, Trash2, Package, EyeOff, Search, 
  Image as ImageIcon, Percent, RotateCcw, Ban, Star, CheckSquare, Square
} from 'lucide-react';
import { Ornament } from '../Ornament';
import { supabase } from '../../supabaseClient';

const PerfumeManagement = () => {
  const [perfumes, setPerfumes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [scents, setScents] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]); 
  const [filterBrand, setFilterBrand] = useState('all'); 
  
  const initialFormState = {
    perfume_id: null,
    name: '',
    name_en: '',
    brand_id: null,
    price: 0,
    sale_rate: 0,
    volume_ml: 50,
    concentration: 'EDP',
    gender: 'UNISEX',
    description: '',
    notes: { 
      top: { scent_id: null, intensity: 0 }, 
      middle: { scent_id: null, intensity: 0 }, 
      base: { scent_id: null, intensity: 0 } 
    },
    total_stock: 0,
    imageUrl: '',
    is_active: true,
    discontinued_date: null,
    discontinue_reason: '',
    is_new: false,
    selected_tags: []
  };
  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchPerfumes(),
        fetchBrands(),
        fetchScents(),
        fetchTags()
      ]);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerfumes = async () => {
    const { data, error } = await supabase
      .from('Perfumes')
      .select(`
        *,
        Brands (brand_name),
        Perfume_Notes (
          note_id,
          note_type,
          intensity_percent,
          Scents (scent_id, scent_name)
        ),
        Perfume_Tags (
          Preference_Tags (tag_id, tag_name)
        ),
        Perfume_Images (image_url, is_thumbnail)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const transformedData = data.map(p => ({
      ...p,
      brand: p.Brands?.brand_name || '',
      imageUrl: p.Perfume_Images?.find(img => img.is_thumbnail)?.image_url || '',
      notes: {
        top: p.Perfume_Notes?.find(n => n.note_type === 'TOP'),
        middle: p.Perfume_Notes?.find(n => n.note_type === 'MIDDLE'),
        base: p.Perfume_Notes?.find(n => n.note_type === 'BASE')
      },
      tags: p.Perfume_Tags?.map(pt => pt.Preference_Tags) || [],
      isDiscontinued: p.discontinued_date !== null,
      isNew: false // 신상 여부는 별도 로직으로 판단 (예: 30일 이내 등록)
    }));

    setPerfumes(transformedData);
  };

  const fetchBrands = async () => {
    const { data, error } = await supabase
      .from('Brands')
      .select('brand_id, brand_name')
      .eq('is_active', true)
      .order('brand_name');

    if (error) throw error;
    setBrands(data);
  };

  const fetchScents = async () => {
    const { data, error } = await supabase
      .from('Scents')
      .select('scent_id, scent_name, scent_category')
      .order('scent_name');

    if (error) throw error;
    setScents(data);
  };

  const fetchTags = async () => {
    const { data, error } = await supabase
      .from('Preference_Tags')
      .select('tag_id, tag_name, tag_type')
      .eq('is_active', true)
      .order('tag_name');

    if (error) throw error;
    setTags(data);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      if (formData.perfume_id) {
        // 수정
        const { error: updateError } = await supabase
          .from('Perfumes')
          .update({
            name: formData.name,
            name_en: formData.name_en,
            brand_id: formData.brand_id,
            price: formData.price,
            sale_rate: formData.sale_rate,
            sale_price: formData.price * (1 - formData.sale_rate / 100),
            volume_ml: formData.volume_ml,
            concentration: formData.concentration,
            gender: formData.gender,
            description: formData.description,
            total_stock: formData.total_stock,
            is_active: formData.is_active,
            discontinued_date: formData.discontinued_date,
            updated_at: new Date().toISOString()
          })
          .eq('perfume_id', formData.perfume_id);

        if (updateError) throw updateError;

        // 노트 업데이트 (기존 삭제 후 재등록)
        await supabase
          .from('Perfume_Notes')
          .delete()
          .eq('perfume_id', formData.perfume_id);

        await saveNotes(formData.perfume_id);

        // 이미지 업데이트
        if (formData.imageUrl) {
          await updatePerfumeImage(formData.perfume_id, formData.imageUrl);
        }

        // 태그 업데이트
        await updatePerfumeTags(formData.perfume_id, formData.selected_tags);

      } else {
        // 신규 등록
        const { data: newPerfume, error: insertError } = await supabase
          .from('Perfumes')
          .insert({
            name: formData.name,
            name_en: formData.name_en,
            brand_id: formData.brand_id,
            price: formData.price,
            sale_rate: formData.sale_rate,
            sale_price: formData.price * (1 - formData.sale_rate / 100),
            cost: formData.price * 0.6, // 임시 원가 설정
            volume_ml: formData.volume_ml,
            concentration: formData.concentration,
            gender: formData.gender,
            description: formData.description,
            total_stock: formData.total_stock,
            is_active: true,
            release_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // 노트 저장
        await saveNotes(newPerfume.perfume_id);

        // 이미지 저장
        if (formData.imageUrl) {
          await savePerfumeImage(newPerfume.perfume_id, formData.imageUrl);
        }

        // 태그 저장
        await updatePerfumeTags(newPerfume.perfume_id, formData.selected_tags);
      }

      await fetchPerfumes();
      setIsModalOpen(false);
      setFormData(initialFormState);

    } catch (err) {
      console.error('Error saving perfume:', err);
      alert('저장 중 오류가 발생했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const saveNotes = async (perfumeId) => {
    const notes = [];
    
    if (formData.notes.top.scent_id) {
      notes.push({
        perfume_id: perfumeId,
        scent_id: formData.notes.top.scent_id,
        note_type: 'TOP',
        intensity_percent: formData.notes.top.intensity || 33
      });
    }
    
    if (formData.notes.middle.scent_id) {
      notes.push({
        perfume_id: perfumeId,
        scent_id: formData.notes.middle.scent_id,
        note_type: 'MIDDLE',
        intensity_percent: formData.notes.middle.intensity || 33
      });
    }
    
    if (formData.notes.base.scent_id) {
      notes.push({
        perfume_id: perfumeId,
        scent_id: formData.notes.base.scent_id,
        note_type: 'BASE',
        intensity_percent: formData.notes.base.intensity || 34
      });
    }

    if (notes.length > 0) {
      const { error } = await supabase
        .from('Perfume_Notes')
        .insert(notes);
      
      if (error) throw error;
    }
  };

  const savePerfumeImage = async (perfumeId, imageUrl) => {
    const { error } = await supabase
      .from('Perfume_Images')
      .insert({
        perfume_id: perfumeId,
        image_url: imageUrl,
        image_type: 'MAIN',
        is_thumbnail: true,
        display_order: 0
      });

    if (error) throw error;
  };

  const updatePerfumeImage = async (perfumeId, imageUrl) => {
    // 기존 썸네일 이미지 삭제
    await supabase
      .from('Perfume_Images')
      .delete()
      .eq('perfume_id', perfumeId)
      .eq('is_thumbnail', true);

    // 새 이미지 추가
    await savePerfumeImage(perfumeId, imageUrl);
  };

  const updatePerfumeTags = async (perfumeId, tagIds) => {
    // 기존 태그 삭제
    await supabase
      .from('Perfume_Tags')
      .delete()
      .eq('perfume_id', perfumeId);

    // 새 태그 추가
    if (tagIds && tagIds.length > 0) {
      const tagData = tagIds.map(tagId => ({
        perfume_id: perfumeId,
        tag_id: tagId,
        relevance_score: 50
      }));

      const { error } = await supabase
        .from('Perfume_Tags')
        .insert(tagData);

      if (error) throw error;
    }
  };

  const handleSetOutOfStock = async (id) => {
    if (!confirm('이 상품을 품절 처리하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('Perfumes')
        .update({ total_stock: 0 })
        .eq('perfume_id', id);

      if (error) throw error;
      await fetchPerfumes();
    } catch (err) {
      console.error('Error setting out of stock:', err);
      alert('품절 처리 중 오류가 발생했습니다');
    }
  };

  const handleDiscontinue = async (id) => {
    const reason = prompt('단종 사유:');
    if (!reason) return;

    try {
      const { error } = await supabase
        .from('Perfumes')
        .update({ 
          discontinued_date: new Date().toISOString().split('T')[0],
          is_active: false
        })
        .eq('perfume_id', id);

      if (error) throw error;
      
      // Perfume_Renewals에 기록
      await supabase
        .from('Perfume_Renewals')
        .insert({
          perfume_id: id,
          changed_at: new Date().toISOString().split('T')[0],
          description: reason,
          change_type: 'DISCONTINUED'
        });

      await fetchPerfumes();
    } catch (err) {
      console.error('Error discontinuing perfume:', err);
      alert('단종 처리 중 오류가 발생했습니다');
    }
  };

  const handleRestore = async (id) => {
    try {
      const { error } = await supabase
        .from('Perfumes')
        .update({ 
          discontinued_date: null,
          is_active: true
        })
        .eq('perfume_id', id);

      if (error) throw error;
      await fetchPerfumes();
    } catch (err) {
      console.error('Error restoring perfume:', err);
      alert('복구 중 오류가 발생했습니다');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('데이터를 영구 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

    try {
      // 관련 데이터 먼저 삭제
      await supabase.from('Perfume_Notes').delete().eq('perfume_id', id);
      await supabase.from('Perfume_Images').delete().eq('perfume_id', id);
      await supabase.from('Perfume_Tags').delete().eq('perfume_id', id);
      
      // 향수 삭제
      const { error } = await supabase
        .from('Perfumes')
        .delete()
        .eq('perfume_id', id);

      if (error) throw error;
      await fetchPerfumes();
    } catch (err) {
      console.error('Error deleting perfume:', err);
      alert('삭제 중 오류가 발생했습니다');
    }
  };

  const applyBulkDiscount = async () => {
    if (selectedIds.length === 0) return alert('할인을 적용할 상품을 선택해주세요.');
    
    const rate = prompt('선택한 상품들에 적용할 할인율(%)을 입력하세요 (0 입력 시 할인 취소):');
    if (rate === null || isNaN(rate)) return;

    try {
      setLoading(true);
      
      for (const id of selectedIds) {
        const perfume = perfumes.find(p => p.perfume_id === id);
        if (perfume) {
          await supabase
            .from('Perfumes')
            .update({ 
              sale_rate: parseInt(rate),
              sale_price: perfume.price * (1 - parseInt(rate) / 100)
            })
            .eq('perfume_id', id);
        }
      }

      await fetchPerfumes();
      setSelectedIds([]);
    } catch (err) {
      console.error('Error applying bulk discount:', err);
      alert('일괄 할인 적용 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const filteredPerfumes = useMemo(() => {
    return perfumes.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           p.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBrand = filterBrand === 'all' || p.brand_id === parseInt(filterBrand);
      return matchesSearch && matchesBrand;
    });
  }, [perfumes, searchTerm, filterBrand]);

  const brandOptions = useMemo(() => {
    return [{ brand_id: 'all', brand_name: '전체 브랜드' }, ...brands];
  }, [brands]);

  const toggleSelect = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const openEditModal = (perfume) => {
    setFormData({
      perfume_id: perfume.perfume_id,
      name: perfume.name,
      name_en: perfume.name_en || '',
      brand_id: perfume.brand_id,
      price: perfume.price,
      sale_rate: perfume.sale_rate || 0,
      volume_ml: perfume.volume_ml,
      concentration: perfume.concentration || 'EDP',
      gender: perfume.gender || 'UNISEX',
      description: perfume.description || '',
      notes: {
        top: { 
          scent_id: perfume.notes.top?.Scents?.scent_id || null, 
          intensity: perfume.notes.top?.intensity_percent || 0 
        },
        middle: { 
          scent_id: perfume.notes.middle?.Scents?.scent_id || null, 
          intensity: perfume.notes.middle?.intensity_percent || 0 
        },
        base: { 
          scent_id: perfume.notes.base?.Scents?.scent_id || null, 
          intensity: perfume.notes.base?.intensity_percent || 0 
        }
      },
      total_stock: perfume.total_stock,
      imageUrl: perfume.imageUrl,
      is_active: perfume.is_active,
      discontinued_date: perfume.discontinued_date,
      discontinue_reason: '',
      is_new: perfume.isNew,
      selected_tags: perfume.tags.map(t => t.tag_id)
    });
    setIsModalOpen(true);
  };

  if (loading && perfumes.length === 0) {
    return (
      <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4"></div>
          <p className="text-[#8b8278] italic">데이터를 불러오는 중...</p>
        </div>
      </div>
    );
  }

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
                type="text" 
                placeholder="검색..." 
                className="w-full pl-10 pr-4 py-2 bg-[#faf8f3] rounded-lg text-sm outline-none border border-transparent focus:border-[#c9a961]/30 transition-all"
                onChange={(e) => setSearchTerm(e.target.value)}
                value={searchTerm}
              />
            </div>
            <select 
              className="px-3 py-2 bg-[#faf8f3] rounded-lg text-xs border-none outline-none cursor-pointer"
              onChange={(e) => setFilterBrand(e.target.value)}
              value={filterBrand}
            >
              {brandOptions.map(b => (
                <option key={b.brand_id} value={b.brand_id}>
                  {b.brand_name}
                </option>
              ))}
            </select>
          </div>
          
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={applyBulkDiscount} 
              disabled={loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg text-[11px] font-bold hover:bg-orange-100 transition-colors disabled:opacity-50"
            >
              <Percent className="w-3.5 h-3.5" /> 일괄 할인 설정
            </button>
            <button 
              onClick={() => { setFormData(initialFormState); setIsModalOpen(true); }} 
              disabled={loading}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-[#2a2620] text-white rounded-lg text-[11px] font-bold hover:bg-[#c9a961] transition-all disabled:opacity-50"
            >
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
                <tr key={p.perfume_id} className={`${p.isDiscontinued ? 'bg-red-50/30' : 'hover:bg-gray-50/30'} transition-colors`}>
                  <td className="p-5">
                    <button onClick={() => toggleSelect(p.perfume_id)} className="text-[#c9a961]">
                      {selectedIds.includes(p.perfume_id) ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                    </button>
                  </td>
                  <td className="p-5 flex items-center gap-4">
                    <div className="relative w-12 h-12 bg-white rounded border border-[#c9a961]/10 overflow-hidden shadow-inner">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" />
                      ) : (
                        <ImageIcon className="w-full h-full p-3 text-[#c9a961]/10" />
                      )}
                      {p.isNew && <div className="absolute top-0 right-0 bg-[#c9a961] text-white text-[7px] px-1 font-bold shadow-sm">NEW</div>}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-[#2a2620] flex items-center gap-1.5">
                        {p.name}
                        {p.isNew && <Star className="w-3 h-3 text-amber-400 fill-amber-400" />}
                      </div>
                      <div className="text-[10px] text-[#8b8278] font-medium">
                        {p.brand} · {p.concentration} · {p.volume_ml}ml
                      </div>
                      {p.isDiscontinued && (
                        <div className="text-[9px] text-red-500 font-bold mt-0.5 italic">
                          단종: {new Date(p.discontinued_date).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-5">
                    {p.sale_rate > 0 ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] text-red-500 line-through decoration-red-500/70 font-medium">
                          {p.price.toLocaleString()}원
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#2a2620]">
                            {(p.sale_price || p.price).toLocaleString()}원
                          </span>
                          <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1 rounded">
                            {p.sale_rate}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs font-bold text-[#2a2620]">{p.price.toLocaleString()}원</div>
                    )}
                    
                    <div className={`text-[10px] mt-1 ${p.total_stock === 0 ? 'text-red-500 font-bold' : 'text-gray-500'}`}>
                      {p.total_stock === 0 ? '품절' : `재고 ${p.total_stock}개`}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex gap-1.5">
                      {!p.isDiscontinued ? (
                        <>
                          <button 
                            onClick={() => openEditModal(p)} 
                            className="p-2 text-blue-500 hover:bg-blue-50 rounded" 
                            title="수정"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleSetOutOfStock(p.perfume_id)} 
                            className="p-2 text-amber-600 hover:bg-amber-50 rounded" 
                            title="품절"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDiscontinue(p.perfume_id)} 
                            className="p-2 text-red-400 hover:bg-red-50 rounded" 
                            title="단종"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        </>
                      ) : (
                        <button 
                          onClick={() => handleRestore(p.perfume_id)} 
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#2a2620] text-white text-[10px] rounded hover:bg-[#c9a961] transition-all"
                        >
                          <RotateCcw className="w-3 h-3" /> 복구
                        </button>
                      )}
                      <button 
                        onClick={() => handleDelete(p.perfume_id)} 
                        className="p-2 text-gray-300 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모달 창 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-6">
          <div className="bg-white rounded-2xl w-full max-w-3xl p-8 shadow-2xl overflow-y-auto max-h-[90vh] border border-[#c9a961]/20">
            <div className="flex justify-between items-center mb-6 border-b border-[#c9a961]/10 pb-4">
              <h2 className="font-display text-lg tracking-widest text-[#2a2620] uppercase font-bold">
                Product Specification
              </h2>
              <label className="flex items-center gap-2 cursor-pointer group">
                <input 
                  type="checkbox" 
                  checked={formData.is_new} 
                  onChange={e => setFormData({...formData, is_new: e.target.checked})} 
                  className="w-4 h-4 accent-[#c9a961]" 
                />
                <span className="text-[10px] font-bold text-[#c9a961] group-hover:text-[#2a2620] transition-colors">
                  신상(NEW) 라인업 등록
                </span>
              </label>
            </div>
            
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase tracking-tighter">
                    Image Preview
                  </label>
                  <div className="relative aspect-square bg-[#faf8f3] border border-dashed border-[#c9a961]/30 rounded-lg flex items-center justify-center overflow-hidden hover:bg-[#f5f0e6] transition-colors">
                    {formData.imageUrl ? (
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-8 h-8 text-[#c9a961]/20" />
                    )}
                    <input 
                      type="text" 
                      placeholder="이미지 URL 입력" 
                      className="absolute bottom-2 left-2 right-2 px-2 py-1 text-xs border rounded bg-white/90"
                      value={formData.imageUrl}
                      onChange={(e) => setFormData({...formData, imageUrl: e.target.value})}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Scent Notes</label>
                  <select 
                    className="w-full text-xs border-b border-[#c9a961]/10 py-2 outline-none focus:border-[#c9a961] transition-all bg-transparent"
                    value={formData.notes.top.scent_id || ''}
                    onChange={e => setFormData({
                      ...formData, 
                      notes: {...formData.notes, top: {...formData.notes.top, scent_id: e.target.value ? parseInt(e.target.value) : null}}
                    })}
                  >
                    <option value="">TOP NOTES - 선택</option>
                    {scents.map(s => (
                      <option key={s.scent_id} value={s.scent_id}>
                        {s.scent_name} ({s.scent_category})
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    className="w-full text-xs border-b border-[#c9a961]/10 py-2 outline-none focus:border-[#c9a961] transition-all bg-transparent"
                    value={formData.notes.middle.scent_id || ''}
                    onChange={e => setFormData({
                      ...formData, 
                      notes: {...formData.notes, middle: {...formData.notes.middle, scent_id: e.target.value ? parseInt(e.target.value) : null}}
                    })}
                  >
                    <option value="">MIDDLE NOTES - 선택</option>
                    {scents.map(s => (
                      <option key={s.scent_id} value={s.scent_id}>
                        {s.scent_name} ({s.scent_category})
                      </option>
                    ))}
                  </select>
                  
                  <select 
                    className="w-full text-xs border-b border-[#c9a961]/10 py-2 outline-none focus:border-[#c9a961] transition-all bg-transparent"
                    value={formData.notes.base.scent_id || ''}
                    onChange={e => setFormData({
                      ...formData, 
                      notes: {...formData.notes, base: {...formData.notes.base, scent_id: e.target.value ? parseInt(e.target.value) : null}}
                    })}
                  >
                    <option value="">BASE NOTES - 선택</option>
                    {scents.map(s => (
                      <option key={s.scent_id} value={s.scent_id}>
                        {s.scent_name} ({s.scent_category})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Tags</label>
                  <div className="flex flex-wrap gap-2 p-3 border border-[#c9a961]/20 rounded-lg bg-[#faf8f3] max-h-32 overflow-y-auto">
                    {tags.map(tag => (
                      <label key={tag.tag_id} className="flex items-center gap-1 text-[10px] cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={formData.selected_tags.includes(tag.tag_id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({...formData, selected_tags: [...formData.selected_tags, tag.tag_id]});
                            } else {
                              setFormData({...formData, selected_tags: formData.selected_tags.filter(id => id !== tag.tag_id)});
                            }
                          }}
                          className="w-3 h-3 accent-[#c9a961]"
                        />
                        <span className="text-[#8b8278]">{tag.tag_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4 pt-4">
                <div className="space-y-1">
                  <label className="text-[9px] text-[#c9a961] font-bold uppercase">Perfume Name</label>
                  <input 
                    required 
                    placeholder="향수 이름" 
                    className="w-full border-b py-2 outline-none text-sm font-bold" 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-[#c9a961] font-bold uppercase">English Name</label>
                  <input 
                    placeholder="영문명 (선택)" 
                    className="w-full border-b py-2 outline-none text-sm" 
                    value={formData.name_en} 
                    onChange={e => setFormData({...formData, name_en: e.target.value})} 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[9px] text-[#c9a961] font-bold uppercase">Brand</label>
                  <select 
                    required
                    className="w-full border-b py-2 text-sm outline-none focus:border-[#c9a961] bg-transparent cursor-pointer" 
                    value={formData.brand_id || ''} 
                    onChange={e => setFormData({...formData, brand_id: e.target.value ? parseInt(e.target.value) : null})}
                  >
                    <option value="">브랜드 선택</option>
                    {brands.map(b => (
                      <option key={b.brand_id} value={b.brand_id}>{b.brand_name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Price (원)</label>
                    <input 
                      type="number" 
                      required
                      className="w-full border-b py-1 text-sm outline-none focus:border-[#c9a961]" 
                      value={formData.price} 
                      onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Sale Rate (%)</label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      className="w-full border-b py-1 text-sm outline-none focus:border-[#c9a961]" 
                      value={formData.sale_rate} 
                      onChange={e => setFormData({...formData, sale_rate: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Stock (재고)</label>
                  <input 
                    type="number" 
                    required
                    className="w-full border-b py-1 text-sm outline-none focus:border-[#c9a961]" 
                    value={formData.total_stock} 
                    onChange={e => setFormData({...formData, total_stock: parseInt(e.target.value) || 0})} 
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Volume (ml)</label>
                    <input 
                      type="number"
                      className="w-full border-b py-2 text-[11px] outline-none focus:border-[#c9a961]" 
                      value={formData.volume_ml} 
                      onChange={e => setFormData({...formData, volume_ml: parseInt(e.target.value) || 50})}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] text-gray-400 font-bold uppercase">Concentration</label>
                    <select 
                      className="w-full border-b py-2 text-[11px] bg-transparent outline-none cursor-pointer" 
                      value={formData.concentration} 
                      onChange={e => setFormData({...formData, concentration: e.target.value})}
                    >
                      <option value="EDP">EDP</option>
                      <option value="EDT">EDT</option>
                      <option value="EDC">EDC</option>
                      <option value="PARFUM">Parfum</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Gender</label>
                  <select 
                    className="w-full border-b py-2 text-[11px] bg-transparent outline-none cursor-pointer" 
                    value={formData.gender} 
                    onChange={e => setFormData({...formData, gender: e.target.value})}
                  >
                    <option value="UNISEX">유니섹스</option>
                    <option value="MALE">남성용</option>
                    <option value="FEMALE">여성용</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] text-gray-400 font-bold uppercase">Description</label>
                  <textarea 
                    rows="3"
                    placeholder="향수 설명 (선택)" 
                    className="w-full border border-[#c9a961]/20 rounded p-2 text-xs outline-none focus:border-[#c9a961]" 
                    value={formData.description} 
                    onChange={e => setFormData({...formData, description: e.target.value})}
                  />
                </div>

                <div className="flex gap-2 pt-10">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="flex-1 py-3 text-[10px] text-gray-400 border rounded-lg uppercase tracking-widest hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-[2] py-3 bg-[#2a2620] text-white text-[10px] font-bold rounded-lg uppercase tracking-[0.2em] hover:bg-[#c9a961] transition-all shadow-md disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
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