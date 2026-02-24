import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { ChevronRight } from 'lucide-react';

export default function Signature() {
  // [수정] 개별 상태들을 하나의 객체로 관리하여 렌더링 최적화
  const [data, setData] = useState({
    signature: null,
    media: [],
    perfumes: [],
    textBlocks: []
  });
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = window.location.pathname.startsWith("/admin") || localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    fetchActiveSignature();
  }, []);

  // [핵심 수정] 5~6번의 API 호출을 1번의 Single Query로 통합
  const fetchActiveSignature = async () => {
    try {
      setLoading(true);
      
      const { data: collection, error: dbError } = await supabase
        .from('Collections')
        .select(`
          *,
          media:Collection_Media(*),
          textBlocks:Collection_Text_Blocks(*),
          collectionPerfumes:Collection_Perfumes(
            display_order,
            is_featured,
            perfume:Perfumes(
              perfume_id, name, name_en, price, sale_rate, sale_price,
              brand:Brands(brand_name),
              images:Perfume_Images(image_url)
            )
          )
        `)
        .eq('type', 'SIGNATURE')
        .eq('is_active', true)
        .eq('is_published', true)
        .eq('collectionPerfumes.perfume.images.is_thumbnail', true) // 썸네일만 필터링
        .maybeSingle();

      if (dbError) throw dbError;
      if (!collection) {
        setError('활성화된 시그니처가 없습니다.');
        return;
      }

      // [수정] 중첩된 JSON 데이터를 UI에서 쓰기 좋게 가공(Transform)
      const transformedPerfumes = (collection.collectionPerfumes || [])
        .map(cp => ({
          ...cp.perfume,
          display_order: cp.display_order,
          is_featured: cp.is_featured,
          brand_name: cp.perfume?.brand?.brand_name,
          thumbnail: cp.perfume?.images?.[0]?.image_url
        }))
        .sort((a, b) => a.display_order - b.display_order);

      setData({
        signature: collection,
        media: (collection.media || []).sort((a, b) => a.display_order - b.display_order),
        textBlocks: (collection.textBlocks || []).sort((a, b) => a.display_order - b.display_order),
        perfumes: transformedPerfumes
      });

    } catch (err) {
      console.error('Error fetching signature:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 미디어 자동 전환 (5초)
  useEffect(() => {
    if (data.media.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentMediaIndex((prev) => (prev + 1) % data.media.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [data.media.length]);

  // 폰트 스타일 매핑 함수들은 그대로 유지
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
      light: 'font-light', normal: 'font-normal', medium: 'font-medium', bold: 'font-bold'
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

  // [수정] 데이터 접근 경로 변경 (예: signature -> data.signature)
  const { signature, media, perfumes, textBlocks } = data;

  return (
    <div className="min-h-screen bg-[#faf8f3]">
      {/* 히어로 섹션 */}
      <div className="relative h-[70vh] overflow-hidden">
        <div className="absolute inset-0">
          {media.map((item, index) => (
            <div
              key={item.media_id || index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentMediaIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={item.media_url}
                alt={`Signature media ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          ))}
        </div>

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
              <p className={`
                ${getFontSize(block.font_size)}
                ${getFontWeight(block.font_weight)}
                ${block.is_italic ? 'italic' : ''}
                tracking-widest drop-shadow-lg text-center px-4
              `}>
                {block.content}
              </p>
            </div>
          ))}
        </div>

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

        {media.length > 1 && (
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2">
            {media.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentMediaIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentMediaIndex ? 'bg-[#c9a961] w-8' : 'bg-white/50 hover:bg-white/80'
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
          <h2 className="font-display text-3xl tracking-[0.3em] text-[#c9a961] mb-4">SIGNATURE</h2>
          <p className="text-base italic text-[#6f6756]">AION을 대표하는 시그니처 향수 라인</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {perfumes.map((perfume) => (
            <div
              key={perfume.perfume_id}
              className={`group cursor-pointer ${perfume.is_featured ? 'md:col-span-2 lg:col-span-1' : ''}`}
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
                      <span className="text-6xl text-[#c9a961]/20">{perfume.name?.charAt(0)}</span>
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
                <p className="text-xs text-[#8b8278] mb-1 tracking-wider">{perfume.brand_name}</p>
                <h3 className="text-lg font-medium text-[#2a2620] mb-1 tracking-wide">{perfume.name}</h3>
                {perfume.name_en && (
                  <p className="text-xs text-[#c9a961] italic mb-2">{perfume.name_en}</p>
                )}
                <div className="flex items-center justify-center gap-2">
                  {perfume.sale_rate > 0 ? (
                    <>
                      <span className="text-sm text-gray-400 line-through">₩{perfume.price?.toLocaleString()}</span>
                      <span className="text-lg font-semibold text-[#c9a961]">₩{perfume.sale_price?.toLocaleString()}</span>
                    </>
                  ) : (
                    <span className="text-lg font-semibold text-[#c9a961]">₩{perfume.price?.toLocaleString()}</span>
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
            <p className="text-lg text-[#8b8278] italic">아직 등록된 향수가 없습니다</p>
          </div>
        )}
        
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