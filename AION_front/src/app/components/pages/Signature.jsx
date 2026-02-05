import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { ChevronRight } from 'lucide-react';

export default function Signature() {
  const [signature, setSignature] = useState(null);
  const [media, setMedia] = useState([]);
  const [perfumes, setPerfumes] = useState([]);
  const [textBlocks, setTextBlocks] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = window.location.pathname.startsWith("/admin") || localStorage.getItem('isAdmin') === 'true';

  // 활성화된 시그니처 가져오기
  useEffect(() => {
    fetchActiveSignature();
  }, []);

  const fetchActiveSignature = async () => {
    try {
      setLoading(true);
      
      // 1. 활성화된 시그니처 가져오기
      const { data: signatureData, error: signatureError } = await supabase
        .from('Collections')
        .select('*')
        .eq('type', 'SIGNATURE')
        .eq('is_active', true)
        .eq('is_published', true)
        .maybeSingle();

      if (signatureError) throw signatureError;
      if (!signatureData) {
        setError('활성화된 시그니처가 없습니다.');
        setLoading(false);
        return;
      }

      setSignature(signatureData);

      // 2. 미디어 가져오기
      const { data: mediaData, error: mediaError } = await supabase
        .from('Collection_Media')
        .select('*')
        .eq('collection_id', signatureData.collection_id)
        .order('display_order', { ascending: true });

      if (mediaError) throw mediaError;
      setMedia(mediaData || []);

      // 3. 향수 가져오기 (수정된 버전)
      const { data: perfumeData, error: perfumeError } = await supabase
        .from('Collection_Perfumes')
        .select(`
          display_order,
          is_featured,
          perfume_id
        `)
        .eq('collection_id', signatureData.collection_id)
        .order('display_order', { ascending: true });

      if (perfumeError) throw perfumeError;

      // 향수 상세 정보 가져오기
      const perfumeIds = perfumeData?.map(p => p.perfume_id) || [];

      const { data: perfumes } = await supabase
        .from('Perfumes')
        .select('perfume_id, name, name_en, price, sale_rate, sale_price, brand_id')
        .in('perfume_id', perfumeIds);

      // 브랜드 정보
      const brandIds = [...new Set(perfumes?.map(p => p.brand_id).filter(Boolean))];
      const { data: brands } = await supabase
        .from('Brands')
        .select('brand_id, brand_name')
        .in('brand_id', brandIds);

      const brandMap = {};
      brands?.forEach(b => brandMap[b.brand_id] = b.brand_name);

      // 이미지 정보
      const { data: images } = await supabase
        .from('Perfume_Images')
        .select('perfume_id, image_url, is_thumbnail')
        .in('perfume_id', perfumeIds)
        .eq('is_thumbnail', true);

      const imageMap = {};
      images?.forEach(img => imageMap[img.perfume_id] = img.image_url);

      // 데이터 결합
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

      setPerfumes(transformedPerfumes);

      // 4. 텍스트 블록 가져오기
      const { data: textData, error: textError } = await supabase
        .from('Collection_Text_Blocks')
        .select('*')
        .eq('collection_id', signatureData.collection_id)
        .order('display_order', { ascending: true });

      if (textError) throw textError;
      setTextBlocks(textData || []);

    } catch (err) {
      console.error('Error fetching signature:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 미디어 자동 전환 (5초)
  useEffect(() => {
    if (media.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentMediaIndex((prev) => (prev + 1) % media.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [media.length]);

  // 폰트 크기 매핑
  const getFontSize = (size) => {
    const sizes = {
      small: 'text-sm md:text-base',
      medium: 'text-lg md:text-xl',
      large: 'text-2xl md:text-3xl',
      xlarge: 'text-3xl md:text-5xl'
    };
    return sizes[size] || sizes.medium;
  };

  const getFontWeight = (weight) => {
    const weights = {
      light: 'font-light',
      normal: 'font-normal',
      medium: 'font-medium',
      bold: 'font-bold'
    };
    return weights[weight] || weights.normal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4"></div>
          <p className="text-[#8b8278] italic">시그니처를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#faf8f3] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#8b8278] mb-4">{error}</p>
          <button 
            onClick={fetchActiveSignature}
            className="px-6 py-2 bg-[#c9a961] text-white rounded hover:bg-[#b89851] transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {/* 히어로 섹션 - 배경 미디어 + 텍스트 */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* 배경 미디어 */}
        <div className="absolute inset-0">
          {media.map((item, index) => (
            <div
              key={item.media_id}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentMediaIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={item.media_url}
                alt={`Signature media ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {/* 오버레이 */}
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          ))}
        </div>

        {/* 텍스트 블록들 */}
        <div className="relative h-full">
          {textBlocks.map((block) => (
            <div
              key={block.text_block_id}
              className="absolute"
              style={{
                left: block.position_x,
                top: block.position_y,
                transform: 'translate(-50%, -50%)',
                color: signature?.text_color || '#c9a961'
              }}
            >
              <p
                className={`
                  ${getFontSize(block.font_size)}
                  ${getFontWeight(block.font_weight)}
                  ${block.is_italic ? 'italic' : ''}
                  tracking-widest
                  drop-shadow-lg
                  text-center
                  px-4
                `}
              >
                {block.content}
              </p>
            </div>
          ))}
        </div>

        {/* 기본 텍스트 (텍스트 블록이 없을 경우) */}
        {textBlocks.length === 0 && signature && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1 
                className="text-4xl md:text-6xl font-display tracking-[0.3em] mb-4 drop-shadow-lg"
                style={{ color: signature.text_color }}
              >
                {signature.title}
              </h1>
              {signature.description && (
                <p 
                  className="text-lg md:text-xl italic tracking-wider drop-shadow-lg"
                  style={{ color: signature.text_color }}
                >
                  {signature.description}
                </p>
              )}
            </div>
          </div>
        )}

        {/* 미디어 인디케이터 */}
        {media.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentMediaIndex 
                    ? 'bg-[#c9a961] w-8' 
                    : 'bg-white/50 hover:bg-white/80'
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* 향수 목록 섹션 */}
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-4">
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent"></div>
            <div className="mx-3 text-[#c9a961] text-xs">✦</div>
            <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[#c9a961] to-transparent"></div>
          </div>
          <h2 className="font-display text-3xl tracking-[0.3em] text-[#c9a961] mb-4">
            SIGNATURE
          </h2>
          <p className="text-base italic text-[#6f6756]">
            AION을 대표하는 시그니처 향수 라인
          </p>
        </div>

        {/* 향수 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {perfumes.map((perfume) => (
            <div
              key={perfume.perfume_id}
              className={`group cursor-pointer ${
                perfume.is_featured ? 'md:col-span-2 lg:col-span-1' : ''
              }`}
            >
              <div className="relative overflow-hidden rounded-lg mb-4 bg-white shadow-sm">
                <div className="aspect-square">
                  {perfume.thumbnail ? (
                    <img
                      src={perfume.thumbnail}
                      alt={perfume.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] flex items-center justify-center">
                      <span className="text-6xl text-[#c9a961]/20">{perfume.name.charAt(0)}</span>
                    </div>
                  )}
                </div>
                
                {perfume.is_featured && (
                  <div className="absolute top-4 right-4 bg-[#c9a961] text-white px-3 py-1 text-xs tracking-wider">
                    SIGNATURE
                  </div>
                )}

                {perfume.sale_rate > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-bold">
                    {perfume.sale_rate}% OFF
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-[#8b8278] mb-1 tracking-wider">
                  {perfume.brand_name}
                </p>
                <h3 className="text-lg font-medium text-[#2a2620] mb-1 tracking-wide">
                  {perfume.name}
                </h3>
                {perfume.name_en && (
                  <p className="text-xs text-[#c9a961] italic mb-2">
                    {perfume.name_en}
                  </p>
                )}
                
                <div className="flex items-center justify-center gap-2">
                  {perfume.sale_rate > 0 ? (
                    <>
                      <span className="text-sm text-gray-400 line-through">
                        ₩{perfume.price.toLocaleString()}
                      </span>
                      <span className="text-lg font-semibold text-[#c9a961]">
                        ₩{perfume.sale_price.toLocaleString()}
                      </span>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-[#c9a961]">
                      ₩{perfume.price.toLocaleString()}
                    </span>
                  )}
                </div>

                <button className="mt-4 flex items-center gap-2 mx-auto text-sm text-[#c9a961] hover:text-[#2a2620] transition-colors group-hover:gap-3 transition-all">
                  자세히 보기 <ChevronRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        {perfumes.length === 0 && (
          <div className="text-center py-20">
            <p className="text-lg text-[#8b8278] italic">
              아직 등록된 향수가 없습니다
            </p>
          </div>
        )}
        
        {/* 관리자 편집 버튼 */}
        {isAdmin && (
          <button
            onClick={() => window.location.href = '/admin/collections'}
            className="fixed bottom-8 right-8 z-50 flex items-center gap-2 px-6 py-4 bg-[#c9a961] text-black font-bold rounded-full shadow-2xl hover:scale-110 transition-transform cursor-pointer border-2 border-black"
          >
            <span>✏️ SIGNATURE 편집</span>
          </button>
        )}
      </div>
    </div>
  );
}