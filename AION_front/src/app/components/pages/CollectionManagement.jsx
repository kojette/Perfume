import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { 
  Plus, Save, Eye, Image as ImageIcon, Type, Palette, 
  X, Search, Check, ChevronDown, ChevronUp,
  Edit2, Trash2, Star
} from 'lucide-react';
import { Ornament } from '../Ornament';

export default function CollectionManagement() {
  const [collections, setCollections] = useState([]);
  const [selectedType, setSelectedType] = useState('COLLECTION');
  const [isEditing, setIsEditing] = useState(false);
  const [currentCollection, setCurrentCollection] = useState(null);
  const [activeTab, setActiveTab] = useState('basic');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    text_color: '#c9a961',
    is_published: false
  });

  const [mediaList, setMediaList] = useState([]);
  const [mediaInput, setMediaInput] = useState('');
  const [mediaType, setMediaType] = useState('IMAGE');

  const [textBlocks, setTextBlocks] = useState([]);
  const [textInput, setTextInput] = useState({
    content: '',
    font_size: 'medium',
    font_weight: 'normal',
    is_italic: false,
    position_x: '50%',
    position_y: '50%'
  });

  const [allPerfumes, setAllPerfumes] = useState([]);
  const [selectedPerfumes, setSelectedPerfumes] = useState([]);
  const [perfumeSearch, setPerfumeSearch] = useState('');
  const [showPerfumeSelector, setShowPerfumeSelector] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchCollections();
    fetchAllPerfumes();
  }, [selectedType]);

  const fetchCollections = async () => {
    try {
      const { data, error } = await supabase
        .from('Collections')
        .select('*')
        .eq('type', selectedType)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCollections(data || []);
    } catch (err) {
      console.error('Error fetching collections:', err);
    }
  };

  const fetchAllPerfumes = async () => {
    try {
      const { data, error } = await supabase
        .from('Perfumes')
        .select('perfume_id, name, name_en, price, sale_price, sale_rate, brand_id')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Perfume fetch error:', error);
        throw error;
      }
      
      const brandIds = [...new Set(data?.map(p => p.brand_id).filter(Boolean))];
      const { data: brands } = await supabase
        .from('Brands')
        .select('brand_id, brand_name')
        .in('brand_id', brandIds);

      const brandMap = {};
      brands?.forEach(b => {
        brandMap[b.brand_id] = b.brand_name;
      });

      const perfumeIds = data?.map(p => p.perfume_id) || [];
      const { data: images } = await supabase
        .from('Perfume_Images')
        .select('perfume_id, image_url, is_thumbnail')
        .in('perfume_id', perfumeIds)
        .eq('is_thumbnail', true);

      const imageMap = {};
      images?.forEach(img => {
        imageMap[img.perfume_id] = img.image_url;
      });
      
      const transformed = data?.map(p => ({
        ...p,
        brand_name: brandMap[p.brand_id] || '브랜드 없음',
        thumbnail: imageMap[p.perfume_id]
      })) || [];
      
      console.log('✅ 향수 목록 로드:', transformed.length, '개');
      setAllPerfumes(transformed);
    } catch (err) {
      console.error('❌ 향수 로드 실패:', err);
      alert('향수 목록을 불러오는데 실패했습니다: ' + err.message);
    }
  };

  const loadCollection = async (collectionId) => {
    try {
      setLoading(true);

      const { data: collection, error: collectionError } = await supabase
        .from('Collections')
        .select('*')
        .eq('collection_id', collectionId)
        .single();

      if (collectionError) throw collectionError;
      
      setCurrentCollection(collection);
      setFormData({
        title: collection.title,
        description: collection.description || '',
        text_color: collection.text_color,
        is_published: collection.is_published
      });

      const { data: media, error: mediaError } = await supabase
        .from('Collection_Media')
        .select('*')
        .eq('collection_id', collectionId)
        .order('display_order');

      if (mediaError) throw mediaError;
      setMediaList(media || []);

      const { data: texts, error: textsError } = await supabase
        .from('Collection_Text_Blocks')
        .select('*')
        .eq('collection_id', collectionId)
        .order('display_order');

      if (textsError) throw textsError;
      setTextBlocks(texts || []);

      // 향수 데이터 로드 (수정된 방식)
      const { data: perfumeData, error: perfumesError } = await supabase
        .from('Collection_Perfumes')
        .select('display_order, is_featured, perfume_id')
        .eq('collection_id', collectionId)
        .order('display_order');

      if (perfumesError) throw perfumesError;

      const perfumeIds = perfumeData?.map(p => p.perfume_id) || [];
      const { data: perfumes } = await supabase
        .from('Perfumes')
        .select('perfume_id, name, name_en, price, sale_rate, sale_price, brand_id')
        .in('perfume_id', perfumeIds);

      const brandIds = [...new Set(perfumes?.map(p => p.brand_id).filter(Boolean))];
      const { data: brands } = await supabase
        .from('Brands')
        .select('brand_id, brand_name')
        .in('brand_id', brandIds);

      const brandMap = {};
      brands?.forEach(b => brandMap[b.brand_id] = b.brand_name);

      const { data: images } = await supabase
        .from('Perfume_Images')
        .select('perfume_id, image_url, is_thumbnail')
        .in('perfume_id', perfumeIds)
        .eq('is_thumbnail', true);

      const imageMap = {};
      images?.forEach(img => imageMap[img.perfume_id] = img.image_url);

      const transformedPerfumes = perfumeData?.map(cp => {
        const perfume = perfumes?.find(p => p.perfume_id === cp.perfume_id);
        return {
          ...perfume,
          display_order: cp.display_order,
          is_featured: cp.is_featured,
          brand_name: brandMap[perfume?.brand_id],
          thumbnail: imageMap[cp.perfume_id]
        };
      }).filter(p => p.perfume_id) || [];
      
      setSelectedPerfumes(transformedPerfumes);
      setIsEditing(true);
    } catch (err) {
      console.error('Error loading collection:', err);
      alert('컬렉션을 불러오는데 실패했습니다: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const startNewCollection = () => {
    setCurrentCollection(null);
    setFormData({
      title: '',
      description: '',
      text_color: '#c9a961',
      is_published: false
    });
    setMediaList([]);
    setTextBlocks([]);
    setSelectedPerfumes([]);
    setIsEditing(true);
    setActiveTab('basic');
  };

  const addMedia = () => {
    if (!mediaInput.trim()) {
      alert('미디어 URL을 입력하세요');
      return;
    }

    setMediaList([
      ...mediaList,
      {
        media_id: `temp_${Date.now()}`,
        media_url: mediaInput,
        media_type: mediaType,
        display_order: mediaList.length
      }
    ]);
    setMediaInput('');
  };

  const removeMedia = (index) => {
    setMediaList(mediaList.filter((_, i) => i !== index));
  };

  const moveMedia = (index, direction) => {
    const newList = [...mediaList];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newList.length) return;
    
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    
    const updated = newList.map((item, i) => ({ ...item, display_order: i }));
    setMediaList(updated);
  };

  const addTextBlock = () => {
    if (!textInput.content.trim()) {
      alert('텍스트 내용을 입력하세요');
      return;
    }

    setTextBlocks([
      ...textBlocks,
      {
        text_block_id: `temp_${Date.now()}`,
        ...textInput,
        display_order: textBlocks.length
      }
    ]);

    setTextInput({
      content: '',
      font_size: 'medium',
      font_weight: 'normal',
      is_italic: false,
      position_x: '50%',
      position_y: '50%'
    });
  };

  const removeTextBlock = (index) => {
    setTextBlocks(textBlocks.filter((_, i) => i !== index));
  };

  const togglePerfumeSelection = (perfume) => {
    const isSelected = selectedPerfumes.some(p => p.perfume_id === perfume.perfume_id);
    
    if (isSelected) {
      setSelectedPerfumes(selectedPerfumes.filter(p => p.perfume_id !== perfume.perfume_id));
    } else {
      setSelectedPerfumes([
        ...selectedPerfumes,
        {
          ...perfume,
          display_order: selectedPerfumes.length,
          is_featured: false
        }
      ]);
    }
  };

  const togglePerfumeFeatured = (perfumeId) => {
    setSelectedPerfumes(selectedPerfumes.map(p =>
      p.perfume_id === perfumeId ? { ...p, is_featured: !p.is_featured } : p
    ));
  };

  const movePerfume = (index, direction) => {
    const newList = [...selectedPerfumes];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newList.length) return;
    
    [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
    
    const updated = newList.map((item, i) => ({ ...item, display_order: i }));
    setSelectedPerfumes(updated);
  };

  const saveCollection = async () => {
    if (!formData.title.trim()) {
      alert('제목을 입력하세요');
      return;
    }

    if (mediaList.length === 0) {
      alert('최소 1개의 배경 이미지를 추가하세요');
      return;
    }

    try {
      setLoading(true);

      let collectionId = currentCollection?.collection_id;

      if (currentCollection) {
        const { error: updateError } = await supabase
          .from('Collections')
          .update({
            title: formData.title,
            description: formData.description,
            text_color: formData.text_color,
            is_published: formData.is_published,
            updated_at: new Date().toISOString()
          })
          .eq('collection_id', collectionId);

        if (updateError) throw updateError;
      } else {
        const { data: newCollection, error: insertError } = await supabase
          .from('Collections')
          .insert({
            title: formData.title,
            type: selectedType,
            description: formData.description,
            text_color: formData.text_color,
            is_published: formData.is_published,
            is_active: false
          })
          .select()
          .single();

        if (insertError) throw insertError;
        collectionId = newCollection.collection_id;
      }

      await supabase
        .from('Collection_Media')
        .delete()
        .eq('collection_id', collectionId);

      if (mediaList.length > 0) {
        const mediaInserts = mediaList.map((m, index) => ({
          collection_id: collectionId,
          media_url: m.media_url,
          media_type: m.media_type,
          display_order: index
        }));

        const { error: mediaError } = await supabase
          .from('Collection_Media')
          .insert(mediaInserts);

        if (mediaError) throw mediaError;
      }

      await supabase
        .from('Collection_Text_Blocks')
        .delete()
        .eq('collection_id', collectionId);

      if (textBlocks.length > 0) {
        const textInserts = textBlocks.map((t, index) => ({
          collection_id: collectionId,
          content: t.content,
          font_size: t.font_size,
          font_weight: t.font_weight,
          is_italic: t.is_italic,
          position_x: t.position_x,
          position_y: t.position_y,
          display_order: index
        }));

        const { error: textError } = await supabase
          .from('Collection_Text_Blocks')
          .insert(textInserts);

        if (textError) throw textError;
      }

      await supabase
        .from('Collection_Perfumes')
        .delete()
        .eq('collection_id', collectionId);

      if (selectedPerfumes.length > 0) {
        const perfumeInserts = selectedPerfumes.map((p, index) => ({
          collection_id: collectionId,
          perfume_id: p.perfume_id,
          display_order: index,
          is_featured: p.is_featured
        }));

        const { error: perfumeError } = await supabase
          .from('Collection_Perfumes')
          .insert(perfumeInserts);

        if (perfumeError) throw perfumeError;
      }

      alert('저장되었습니다!');
      fetchCollections();
      setIsEditing(false);
    } catch (err) {
      console.error('Error saving:', err);
      alert('저장 실패: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (collectionId, currentActive) => {
    try {
      await supabase
        .from('Collections')
        .update({ is_active: false })
        .eq('type', selectedType);

      if (!currentActive) {
        await supabase
          .from('Collections')
          .update({ is_active: true })
          .eq('collection_id', collectionId);
      }

      fetchCollections();
    } catch (err) {
      console.error('Error toggling active:', err);
      alert('활성화 실패');
    }
  };

  const deleteCollection = async (collectionId) => {
    if (!confirm('정말 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('Collections')
        .delete()
        .eq('collection_id', collectionId);

      if (error) throw error;
      fetchCollections();
      alert('삭제되었습니다');
    } catch (err) {
      console.error('Error deleting:', err);
      alert('삭제 실패');
    }
  };

  const filteredPerfumes = allPerfumes.filter(p =>
    p.name.toLowerCase().includes(perfumeSearch.toLowerCase()) ||
    p.brand_name?.toLowerCase().includes(perfumeSearch.toLowerCase())
  );

  if (!isEditing) {
    return (
      <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-[#c9a961] text-[10px] tracking-[0.5em] mb-4 italic">ADMINISTRATION</div>
            <Ornament className="mb-6" />
            <h1 className="font-display text-3xl tracking-[0.3em] text-[#2a2620] mb-4">
              {selectedType === 'COLLECTION' ? '컬렉션' : '시그니처'} 관리
            </h1>
          </div>

          <div className="flex gap-4 mb-8 justify-center">
            <button
              onClick={() => setSelectedType('COLLECTION')}
              className={`px-6 py-3 rounded-lg text-sm tracking-widest transition-all ${
                selectedType === 'COLLECTION'
                  ? 'bg-[#c9a961] text-white'
                  : 'bg-white text-[#8b8278] border border-[#c9a961]/20'
              }`}
            >
              컬렉션
            </button>
            <button
              onClick={() => setSelectedType('SIGNATURE')}
              className={`px-6 py-3 rounded-lg text-sm tracking-widest transition-all ${
                selectedType === 'SIGNATURE'
                  ? 'bg-[#c9a961] text-white'
                  : 'bg-white text-[#8b8278] border border-[#c9a961]/20'
              }`}
            >
              시그니처
            </button>
          </div>

          <div className="mb-8 flex justify-end">
            <button
              onClick={startNewCollection}
              className="flex items-center gap-2 px-6 py-3 bg-[#2a2620] text-white rounded-lg hover:bg-[#c9a961] transition-all"
            >
              <Plus size={20} /> 새로 만들기
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {collections.map(collection => (
              <div
                key={collection.collection_id}
                className={`bg-white rounded-xl p-6 border-2 transition-all ${
                  collection.is_active
                    ? 'border-[#c9a961] shadow-lg'
                    : 'border-[#c9a961]/20'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#2a2620] mb-1">
                      {collection.title}
                    </h3>
                    {collection.is_active && (
                      <span className="text-xs bg-[#c9a961] text-white px-2 py-1 rounded">
                        현재 활성화
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => loadCollection(collection.collection_id)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded"
                      title="수정"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => deleteCollection(collection.collection_id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <p className="text-sm text-[#8b8278] mb-4 line-clamp-2">
                  {collection.description || '설명 없음'}
                </p>

                <div className="flex gap-2">
                  <button
                    onClick={() => toggleActive(collection.collection_id, collection.is_active)}
                    className={`flex-1 py-2 text-xs rounded transition-all ${
                      collection.is_active
                        ? 'bg-gray-200 text-gray-600'
                        : 'bg-[#c9a961] text-white hover:bg-[#b89851]'
                    }`}
                  >
                    {collection.is_active ? '비활성화' : '활성화'}
                  </button>
                  <button
                    className={`px-3 py-2 text-xs rounded border ${
                      collection.is_published
                        ? 'bg-green-50 text-green-600 border-green-200'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    {collection.is_published ? '공개' : '비공개'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {collections.length === 0 && (
            <div className="text-center py-20">
              <p className="text-lg text-[#8b8278] italic">
                등록된 {selectedType === 'COLLECTION' ? '컬렉션' : '시그니처'}가 없습니다
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ==================== 편집 모드 UI (전체) ====================
  return (
    <div className="min-h-screen bg-[#faf8f3] pt-40 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="font-display text-2xl tracking-[0.3em] text-[#2a2620]">
            {currentCollection ? '수정' : '새로 만들기'} - {selectedType === 'COLLECTION' ? '컬렉션' : '시그니처'}
          </h1>
          <div className="flex gap-3">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center gap-2 px-4 py-2 border border-[#c9a961]/40 rounded-lg hover:bg-[#c9a961]/10"
            >
              <Eye size={18} /> 미리보기
            </button>
            <button
              onClick={saveCollection}
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-[#c9a961] text-white rounded-lg hover:bg-[#b89851] disabled:opacity-50"
            >
              <Save size={18} /> {loading ? '저장중...' : '저장'}
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>

        {/* 탭 메뉴 */}
        <div className="flex gap-2 mb-8 border-b border-[#c9a961]/20">
          {[
            { id: 'basic', icon: Type, label: '기본 정보' },
            { id: 'media', icon: ImageIcon, label: '배경 미디어' },
            { id: 'text', icon: Palette, label: '텍스트 블록' },
            { id: 'perfumes', icon: Check, label: '향수 선택' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 text-sm tracking-wider transition-all ${
                activeTab === tab.id
                  ? 'text-[#c9a961] border-b-2 border-[#c9a961]'
                  : 'text-[#8b8278] hover:text-[#c9a961]'
              }`}
            >
              <tab.icon size={16} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-xl p-8 shadow-sm">
          {/* 기본 정보 탭 */}
          {activeTab === 'basic' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#2a2620] mb-2">
                  제목 *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                  placeholder="예: 2024 Spring Collection"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2a2620] mb-2">
                  설명
                </label>
                <textarea
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                  placeholder="컬렉션 설명"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#2a2620] mb-2">
                  텍스트 색상
                </label>
                <div className="flex gap-4 items-center">
                  <input
                    type="color"
                    value={formData.text_color}
                    onChange={e => setFormData({ ...formData, text_color: e.target.value })}
                    className="h-12 w-24 rounded border border-[#c9a961]/30 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.text_color}
                    onChange={e => setFormData({ ...formData, text_color: e.target.value })}
                    className="flex-1 px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                    placeholder="#c9a961"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_published"
                  checked={formData.is_published}
                  onChange={e => setFormData({ ...formData, is_published: e.target.checked })}
                  className="w-5 h-5 accent-[#c9a961]"
                />
                <label htmlFor="is_published" className="text-sm font-medium text-[#2a2620]">
                  즉시 공개 (체크 해제 시 비공개)
                </label>
              </div>
            </div>
          )}

          {/* 배경 미디어 탭 */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div className="border border-[#c9a961]/30 rounded-lg p-6">
                <h3 className="text-sm font-medium text-[#2a2620] mb-4">새 미디어 추가</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  <select
                    value={mediaType}
                    onChange={e => setMediaType(e.target.value)}
                    className="px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                  >
                    <option value="IMAGE">이미지</option>
                    <option value="GIF">GIF (움짤)</option>
                  </select>

                  <input
                    type="text"
                    value={mediaInput}
                    onChange={e => setMediaInput(e.target.value)}
                    placeholder="이미지 URL 입력"
                    className="md:col-span-3 px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                  />
                </div>

                <button
                  onClick={addMedia}
                  className="w-full py-3 bg-[#c9a961]/20 border border-[#c9a961]/40 rounded-lg text-[#c9a961] hover:bg-[#c9a961]/30 transition-all"
                >
                  + 미디어 추가
                </button>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[#2a2620] mb-3">
                  등록된 미디어 ({mediaList.length}개) - 5초마다 자동 전환
                </h3>
                
                <div className="space-y-3">
                  {mediaList.map((media, index) => (
                    <div
                      key={media.media_id}
                      className="flex items-center gap-4 p-4 border border-[#c9a961]/20 rounded-lg bg-gray-50"
                    >
                      <div className="w-20 h-20 rounded overflow-hidden bg-white flex-shrink-0">
                        <img
                          src={media.media_url}
                          alt={`Media ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/80?text=Error';
                          }}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-[#2a2620]">
                            {index + 1}번째
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            media.media_type === 'GIF'
                              ? 'bg-purple-100 text-purple-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}>
                            {media.media_type}
                          </span>
                        </div>
                        <p className="text-xs text-[#8b8278] truncate">
                          {media.media_url}
                        </p>
                      </div>

                      <div className="flex gap-1">
                        <button
                          onClick={() => moveMedia(index, 'up')}
                          disabled={index === 0}
                          className="p-2 hover:bg-white rounded disabled:opacity-30"
                          title="위로"
                        >
                          <ChevronUp size={16} />
                        </button>
                        <button
                          onClick={() => moveMedia(index, 'down')}
                          disabled={index === mediaList.length - 1}
                          className="p-2 hover:bg-white rounded disabled:opacity-30"
                          title="아래로"
                        >
                          <ChevronDown size={16} />
                        </button>
                        <button
                          onClick={() => removeMedia(index)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                          title="삭제"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {mediaList.length === 0 && (
                  <p className="text-center text-[#8b8278] py-8 italic">
                    배경 미디어를 추가하세요 (최소 1개 필요)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 텍스트 블록 탭 */}
          {activeTab === 'text' && (
            <div className="space-y-6">
              <div className="border border-[#c9a961]/30 rounded-lg p-6">
                <h3 className="text-sm font-medium text-[#2a2620] mb-4">새 텍스트 블록 추가</h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#8b8278] mb-2">텍스트 내용</label>
                    <input
                      type="text"
                      value={textInput.content}
                      onChange={e => setTextInput({ ...textInput, content: e.target.value })}
                      placeholder="예: SPRING 2024"
                      className="w-full px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2">폰트 크기</label>
                      <select
                        value={textInput.font_size}
                        onChange={e => setTextInput({ ...textInput, font_size: e.target.value })}
                        className="w-full px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                      >
                        <option value="small">작게</option>
                        <option value="medium">보통</option>
                        <option value="large">크게</option>
                        <option value="xlarge">매우 크게</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2">폰트 두께</label>
                      <select
                        value={textInput.font_weight}
                        onChange={e => setTextInput({ ...textInput, font_weight: e.target.value })}
                        className="w-full px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                      >
                        <option value="light">얇게</option>
                        <option value="normal">보통</option>
                        <option value="medium">중간</option>
                        <option value="bold">굵게</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2">가로 위치 (X)</label>
                      <input
                        type="text"
                        value={textInput.position_x}
                        onChange={e => setTextInput({ ...textInput, position_x: e.target.value })}
                        placeholder="50% 또는 100px"
                        className="w-full px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-[#8b8278] mb-2">세로 위치 (Y)</label>
                      <input
                        type="text"
                        value={textInput.position_y}
                        onChange={e => setTextInput({ ...textInput, position_y: e.target.value })}
                        placeholder="50% 또는 100px"
                        className="w-full px-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_italic"
                      checked={textInput.is_italic}
                      onChange={e => setTextInput({ ...textInput, is_italic: e.target.checked })}
                      className="w-5 h-5 accent-[#c9a961]"
                    />
                    <label htmlFor="is_italic" className="text-sm text-[#2a2620]">
                      이탤릭체
                    </label>
                  </div>

                  <button
                    onClick={addTextBlock}
                    className="w-full py-3 bg-[#c9a961]/20 border border-[#c9a961]/40 rounded-lg text-[#c9a961] hover:bg-[#c9a961]/30 transition-all"
                  >
                    + 텍스트 블록 추가
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-[#2a2620] mb-3">
                  등록된 텍스트 블록 ({textBlocks.length}개)
                </h3>
                
                <div className="space-y-3">
                  {textBlocks.map((block, index) => (
                    <div
                      key={block.text_block_id}
                      className="flex items-center gap-4 p-4 border border-[#c9a961]/20 rounded-lg bg-gray-50"
                    >
                      <div className="flex-1">
                        <p className={`text-lg mb-2 ${block.is_italic ? 'italic' : ''}`}
                           style={{ 
                             fontWeight: block.font_weight === 'bold' ? 'bold' : 'normal',
                             color: formData.text_color 
                           }}>
                          {block.content}
                        </p>
                        <div className="flex gap-4 text-xs text-[#8b8278]">
                          <span>크기: {block.font_size}</span>
                          <span>위치: ({block.position_x}, {block.position_y})</span>
                        </div>
                      </div>

                      <button
                        onClick={() => removeTextBlock(index)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded"
                        title="삭제"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                {textBlocks.length === 0 && (
                  <p className="text-center text-[#8b8278] py-8 italic">
                    텍스트 블록을 추가하세요 (선택사항)
                  </p>
                )}
              </div>
            </div>
          )}

          {/* 향수 선택 탭 */}
          {activeTab === 'perfumes' && (
            <div className="space-y-6">
              <div>
                <div className="flex gap-4 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8b8278]" />
                    <input
                      type="text"
                      value={perfumeSearch}
                      onChange={e => setPerfumeSearch(e.target.value)}
                      placeholder="향수 또는 브랜드 검색..."
                      className="w-full pl-10 pr-4 py-3 border border-[#c9a961]/30 rounded-lg focus:border-[#c9a961] outline-none"
                    />
                  </div>
                  <button
                    onClick={() => setShowPerfumeSelector(!showPerfumeSelector)}
                    className="px-6 py-3 bg-[#c9a961] text-white rounded-lg hover:bg-[#b89851]"
                  >
                    {showPerfumeSelector ? '목록 닫기' : '향수 선택'}
                  </button>
                </div>

                {showPerfumeSelector && (
                  <div className="border border-[#c9a961]/30 rounded-lg p-4 max-h-96 overflow-y-auto mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {filteredPerfumes.map(perfume => {
                        const isSelected = selectedPerfumes.some(p => p.perfume_id === perfume.perfume_id);
                        
                        return (
                          <div
                            key={perfume.perfume_id}
                            onClick={() => togglePerfumeSelection(perfume)}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-[#c9a961]/20 border-2 border-[#c9a961]'
                                : 'bg-gray-50 border-2 border-transparent hover:border-[#c9a961]/30'
                            }`}
                          >
                            <div className="w-12 h-12 rounded overflow-hidden bg-white flex-shrink-0">
                              {perfume.thumbnail ? (
                                <img
                                  src={perfume.thumbnail}
                                  alt={perfume.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] flex items-center justify-center">
                                  <span className="text-lg text-[#c9a961]/40">{perfume.name.charAt(0)}</span>
                                </div>
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-[#2a2620] truncate">
                                {perfume.name}
                              </p>
                              <p className="text-xs text-[#8b8278]">
                                {perfume.brand_name} · ₩{perfume.price.toLocaleString()}
                              </p>
                            </div>

                            {isSelected && (
                              <Check className="text-[#c9a961] flex-shrink-0" size={20} />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium text-[#2a2620] mb-3">
                  선택된 향수 ({selectedPerfumes.length}개)
                </h3>
                
                <div className="space-y-3">
                  {selectedPerfumes.map((perfume, index) => (
                    <div
                      key={perfume.perfume_id}
                      className="flex items-center gap-4 p-4 border border-[#c9a961]/20 rounded-lg bg-white"
                    >
                      <div className="w-16 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                        {perfume.thumbnail ? (
                          <img
                            src={perfume.thumbnail}
                            alt={perfume.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] flex items-center justify-center">
                            <span className="text-2xl text-[#c9a961]/40">{perfume.name.charAt(0)}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#2a2620] mb-1">
                          {perfume.name}
                        </p>
                        <p className="text-xs text-[#8b8278]">
                          {perfume.brand_name} · ₩{perfume.price.toLocaleString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => togglePerfumeFeatured(perfume.perfume_id)}
                          className={`flex items-center gap-1 px-3 py-2 rounded-lg text-xs transition-all ${
                            perfume.is_featured
                              ? 'bg-amber-100 text-amber-700 border border-amber-300'
                              : 'bg-gray-100 text-gray-600 border border-gray-300 hover:bg-amber-50'
                          }`}
                          title="Featured 설정"
                        >
                          <Star size={14} className={perfume.is_featured ? 'fill-amber-700' : ''} />
                          {perfume.is_featured ? 'Featured' : '일반'}
                        </button>

                        <div className="flex gap-1">
                          <button
                            onClick={() => movePerfume(index, 'up')}
                            disabled={index === 0}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                            title="위로"
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            onClick={() => movePerfume(index, 'down')}
                            disabled={index === selectedPerfumes.length - 1}
                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30"
                            title="아래로"
                          >
                            <ChevronDown size={16} />
                          </button>
                        </div>

                        <button
                          onClick={() => togglePerfumeSelection(perfume)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded"
                          title="제거"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedPerfumes.length === 0 && (
                  <p className="text-center text-[#8b8278] py-8 italic">
                    향수를 선택하세요
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 미리보기 모달 */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
            <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-[#2a2620]">미리보기</h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 hover:bg-gray-100 rounded"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-6">
                <div className="relative h-96 rounded-lg overflow-hidden mb-6">
                  {mediaList[0] && (
                    <img
                      src={mediaList[0].media_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/30"></div>

                  {textBlocks.map((block, index) => (
                    <div
                      key={index}
                      className="absolute"
                      style={{
                        left: block.position_x,
                        top: block.position_y,
                        transform: 'translate(-50%, -50%)',
                        color: formData.text_color
                      }}
                    >
                      <p
                        className={`
                          tracking-widest drop-shadow-lg text-center px-4
                          ${block.font_size === 'small' ? 'text-base' : ''}
                          ${block.font_size === 'medium' ? 'text-xl' : ''}
                          ${block.font_size === 'large' ? 'text-3xl' : ''}
                          ${block.font_size === 'xlarge' ? 'text-5xl' : ''}
                          ${block.font_weight === 'light' ? 'font-light' : ''}
                          ${block.font_weight === 'normal' ? 'font-normal' : ''}
                          ${block.font_weight === 'medium' ? 'font-medium' : ''}
                          ${block.font_weight === 'bold' ? 'font-bold' : ''}
                          ${block.is_italic ? 'italic' : ''}
                        `}
                      >
                        {block.content}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {selectedPerfumes.slice(0, 6).map(perfume => (
                    <div key={perfume.perfume_id} className="text-center">
                      <div className="aspect-square rounded-lg overflow-hidden mb-2 bg-gray-100">
                        {perfume.thumbnail && (
                          <img
                            src={perfume.thumbnail}
                            alt={perfume.name}
                            className="w-full h-full object-cover"
                          />
                        )}
                      </div>
                      <p className="text-sm font-medium text-[#2a2620] truncate">
                        {perfume.name}
                      </p>
                      {perfume.is_featured && (
                        <span className="inline-block mt-1 text-xs bg-[#c9a961] text-white px-2 py-0.5 rounded">
                          FEATURED
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}