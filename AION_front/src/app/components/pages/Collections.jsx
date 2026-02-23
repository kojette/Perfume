import { useState, useEffect } from 'react';
import { ChevronRight } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export default function Collections() {
  const [collection, setCollection] = useState(null);
  const [media, setMedia] = useState([]);
  const [perfumes, setPerfumes] = useState([]);
  const [textBlocks, setTextBlocks] = useState([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = window.location.pathname.startsWith('/admin') ||
    localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    fetchActiveCollection();
  }, []);

  // 백엔드에서 미디어+텍스트+향수를 한 번에 받아옴
  const fetchActiveCollection = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/collections/active?type=COLLECTION`);

      if (res.status === 404) {
        setError('활성화된 컬렉션이 없습니다.');
        return;
      }

      if (!res.ok) throw new Error('서버 오류가 발생했습니다.');

      const json = await res.json();
      if (!json.success) {
        setError(json.message || '컬렉션을 불러올 수 없습니다.');
        return;
      }

      const data = json.data;
      setCollection(data);
      setMedia(data.mediaList || []);
      setTextBlocks(data.textBlocks || []);

      // 백엔드 camelCase 필드를 그대로 사용
      setPerfumes(data.perfumes || []);
    } catch (err) {
      console.error('Error fetching collection:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // 미디어 자동 전환 (5초마다)
  useEffect(() => {
    if (media.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentMediaIndex(prev => (prev + 1) % media.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [media]);

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
          <p className="text-[#8b8278] italic">컬렉션을 불러오는 중...</p>
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
            onClick={fetchActiveCollection}
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
      {/* 히어로 섹션 */}
      <div className="relative h-[70vh] overflow-hidden">
        {/* 배경 미디어 */}
        <div className="absolute inset-0">
          {media.map((item, index) => (
            <div
              key={item.mediaId}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentMediaIndex ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img
                src={item.mediaUrl}
                alt={`Collection media ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/30"></div>
            </div>
          ))}
        </div>

        {/* 텍스트 블록들 */}
        <div className="relative h-full">
          {textBlocks.map((block) => (
            <div
              key={block.textBlockId}
              className="absolute"
              style={{
                left: block.positionX,
                top: block.positionY,
                transform: 'translate(-50%, -50%)',
                color: collection?.textColor || '#c9a961'
              }}
            >
              <p
                className={`
                  ${getFontSize(block.fontSize)}
                  ${getFontWeight(block.fontWeight)}
                  ${block.isItalic ? 'italic' : ''}
                  tracking-widest drop-shadow-lg text-center px-4
                `}
              >
                {block.content}
              </p>
            </div>
          ))}
        </div>

        {/* 기본 텍스트 (텍스트 블록 없을 때) */}
        {textBlocks.length === 0 && collection && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h1
                className="text-4xl md:text-6xl font-display tracking-[0.3em] mb-4 drop-shadow-lg"
                style={{ color: collection.textColor }}
              >
                {collection.title}
              </h1>
              {collection.description && (
                <p
                  className="text-lg md:text-xl italic tracking-wider drop-shadow-lg"
                  style={{ color: collection.textColor }}
                >
                  {collection.description}
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
          <h2 className="font-display text-3xl tracking-[0.3em] text-[#c9a961] mb-4">COLLECTION</h2>
          <p className="text-base italic text-[#6f6756]">
            {perfumes.length}개의 향수로 구성된 컬렉션
          </p>
        </div>

        {/* 향수 그리드 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {perfumes.map((perfume) => (
            <div
              key={perfume.perfumeId}
              className={`group cursor-pointer ${perfume.isFeatured ? 'md:col-span-2 lg:col-span-1' : ''}`}
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

                {perfume.isFeatured && (
                  <div className="absolute top-4 right-4 bg-[#c9a961] text-white px-3 py-1 text-xs tracking-wider">
                    FEATURED
                  </div>
                )}

                {perfume.saleRate > 0 && (
                  <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 text-xs font-bold">
                    {perfume.saleRate}% OFF
                  </div>
                )}
              </div>

              <div className="text-center">
                <p className="text-xs text-[#8b8278] mb-1 tracking-wider">{perfume.brandName}</p>
                <h3 className="text-lg font-medium text-[#2a2620] mb-1 tracking-wide">{perfume.name}</h3>
                {perfume.nameEn && (
                  <p className="text-xs text-[#c9a961] italic mb-2">{perfume.nameEn}</p>
                )}
                <div className="flex items-center justify-center gap-2">
                  {perfume.saleRate > 0 ? (
                    <>
                      <span className="text-sm text-gray-400 line-through">₩{perfume.price?.toLocaleString()}</span>
                      <span className="text-lg font-semibold text-[#c9a961]">₩{perfume.salePrice?.toLocaleString()}</span>
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

        {/* 관리자 버튼 */}
        {isAdmin && (
          <button
            onClick={() => window.location.href = '/admin/collections'}
            className="fixed bottom-8 right-8 z-50 px-6 py-3 bg-black/80 text-[#c9a961] border border-[#c9a961] hover:bg-[#c9a961] hover:text-black transition-all"
          >
            COLLECTION 편집하기
          </button>
        )}
      </div>
    </div>
  );
}