import { useState, useEffect, useMemo } from "react";
import { supabase } from '../../supabaseClient';

export default function Recommend() {
  const [perfumeData, setPerfumeData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("latest");

  // 향수 데이터 가져오기
  useEffect(() => {
    fetchPerfumes();
  }, []);

  const fetchPerfumes = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('Perfumes')
        .select(`
          perfume_id,
          name,
          name_en,
          price,
          sale_rate,
          sale_price,
          volume_ml,
          concentration,
          gender,
          season,
          occasion,
          avg_rating,
          is_active,
          brand_id,
          Brands (
            brand_name,
            brand_name_en
          ),
          Perfume_Notes (
            note_type,
            Scents (
              scent_name
            )
          ),
          Perfume_Tags (
            Preference_Tags (
              tag_name,
              tag_type
            )
          )
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 데이터 변환
      const transformedData = data.map(perfume => {
        // 향 카테고리 추출
        const scentCategories = perfume.Perfume_Notes
          ?.map(note => note.Scents?.scent_category)
          .filter((v, i, a) => v && a.indexOf(v) === i) || [];

        // 태그 추출
        const tags = [
          ...(perfume.Perfume_Tags?.map(pt => pt.Preference_Tags?.tag_name).filter(Boolean) || []),
          perfume.gender === 'MALE' ? '남성' : perfume.gender === 'FEMALE' ? '여성' : '중성',
          ...(perfume.season || []),
          ...(perfume.occasion || [])
        ];

        return {
          id: perfume.perfume_id,
          name: perfume.name,
          nameEn: perfume.name_en || perfume.name,
          greekName: perfume.name, // 그리스 이름은 별도 필드가 없으면 name 사용
          category: scentCategories.join(' & ') || '기타',
          price: perfume.sale_price || perfume.price,
          originalPrice: perfume.sale_rate > 0 ? perfume.price : null,
          discountRate: perfume.sale_rate || 0,
          tags: tags,
          description: `${perfume.Brands?.brand_name || ''} ${perfume.volume_ml}ml ${perfume.concentration || ''}`,
          rating: Math.round(perfume.avg_rating || 0),
          brand: perfume.Brands?.brand_name || ''
        };
      });

      setPerfumeData(transformedData);
    } catch (err) {
      console.error('Error fetching perfumes:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      if (!selectedTags.includes(tagInput.trim())) {
        setSelectedTags([...selectedTags, tagInput.trim()]);
      }
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  // 필터링 및 정렬 로직
  const filteredAndSortedPerfumes = useMemo(() => {
    let result = [...perfumeData];

    // 1. 상품명 검색 필터링
    if (searchTerm.trim()) {
      result = result.filter(perfume => 
        perfume.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perfume.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perfume.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        perfume.brand.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 2. 태그 필터링
    if (selectedTags.length > 0) {
      result = result.filter(perfume =>
        selectedTags.some(selectedTag =>
          perfume.tags.some(perfumeTag =>
            perfumeTag.toLowerCase().includes(selectedTag.toLowerCase())
          )
        )
      );
    }

    // 3. 정렬
    switch (sortBy) {
      case "latest":
        // 이미 created_at desc로 정렬되어 있음
        break;
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;
      case "rating":
        result.sort((a, b) => b.rating - a.rating);
        break;
      case "popular":
        result.sort((a, b) => b.rating - a.rating || a.id - b.id);
        break;
      default:
        break;
    }

    return result;
  }, [perfumeData, searchTerm, selectedTags, sortBy]);

  if (loading) {
    return (
      <main className="min-h-screen bg-[#faf8f3] pt-16 px-6 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#c9a961] mx-auto mb-4"></div>
          <p className="text-[#8b8278] italic">향수 데이터를 불러오는 중...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-[#faf8f3] pt-16 px-6 pb-20 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 opacity-20">⚠️</div>
          <p className="text-lg text-red-500 mb-2">데이터를 불러오는 중 오류가 발생했습니다</p>
          <p className="text-sm text-[#a39d8f] mb-4">{error}</p>
          <button 
            onClick={fetchPerfumes}
            className="px-6 py-2 bg-[#c9a961] text-white rounded-lg hover:bg-[#b89851] transition-colors"
          >
            다시 시도
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#faf8f3] pt-16 px-6 pb-20">
      <div className="max-w-5xl mx-auto">

        {/* Title */}
        <div className="mb-20 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-[0.25em] text-[#c9a961] mb-6 drop-shadow-sm">
            RECOMMEND
          </h1>
          <p className="text-base italic text-[#6f6756]">
            당신의 취향을 바탕으로 향을 제안합니다
          </p>
        </div>

        {/* Quick Theme Recommendations */}
        <div className="mb-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <button
            onClick={() => setSelectedTags(['남성'])}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all cursor-pointer"
          >
            <div className="text-2xl mb-2">👔</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">남성</div>
            <div className="text-[10px] text-[#8b8278] italic">Men</div>
          </button>

          <button
            onClick={() => setSelectedTags(['여성'])}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all cursor-pointer"
          >
            <div className="text-2xl mb-2">👗</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">여성</div>
            <div className="text-[10px] text-[#8b8278] italic">Women</div>
          </button>

          <button
            onClick={() => setSelectedTags(['데이트', 'ROMANTIC'])}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all cursor-pointer"
          >
            <div className="text-2xl mb-2">💕</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">데이트</div>
            <div className="text-[10px] text-[#8b8278] italic">Date</div>
          </button>

          <button
            onClick={() => setSelectedTags(['청량한', 'FRESH'])}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all cursor-pointer"
          >
            <div className="text-2xl mb-2">🌿</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">청량한</div>
            <div className="text-[10px] text-[#8b8278] italic">Fresh</div>
          </button>

          <button
            onClick={() => setSearchTerm('플로럴')}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all cursor-pointer"
          >
            <div className="text-2xl mb-2">🌸</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">봄/여름</div>
            <div className="text-[10px] text-[#8b8278] italic">Spring/Summer</div>
          </button>

          <button
            onClick={() => setSearchTerm('우디')}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all cursor-pointer"
          >
            <div className="text-2xl mb-2">🍂</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">가을/겨울</div>
            <div className="text-[10px] text-[#8b8278] italic">Fall/Winter</div>
          </button>
        </div>

        {/* Search Row */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-stretch">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="상품명, 카테고리 검색"
            className="flex-1 px-5 py-3 rounded-xl border border-[#c9a961]/30 bg-white/70 text-sm italic outline-none focus:border-[#c9a961] transition-colors"
          />

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-44 px-4 py-3 rounded-xl border border-[#c9a961]/30 bg-white/70 text-sm tracking-widest outline-none focus:border-[#c9a961] transition-colors cursor-pointer"
          >
            <option value="latest">최신순</option>
            <option value="price-low">가격 낮은순</option>
            <option value="price-high">가격 높은순</option>
            <option value="rating">평점순</option>
            <option value="popular">인기순</option>
          </select>
        </div>

        {/* Tag Input */}
        <div className="mb-14">
          <label className="block text-sm font-semibold tracking-widest mb-3 text-[#6f6756]">
            PREFERENCE TAGS
          </label>

          <div className="border border-[#c9a961]/30 rounded-2xl p-4 flex flex-wrap gap-3 bg-white/70 shadow-sm min-h-[60px]">
            {selectedTags.map((tag, idx) => (
              <span
                key={idx}
                className="text-sm px-4 py-1.5 rounded-full border border-[#c9a961]/50 text-[#c9a961] font-medium italic bg-white flex items-center gap-2 cursor-pointer hover:bg-[#c9a961] hover:text-white transition-colors"
                onClick={() => removeTag(tag)}
              >
                #{tag}
                <span className="text-xs">✕</span>
              </span>
            ))}

            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex) 플로럴, 데이트, 우디"
              className="flex-1 min-w-[200px] outline-none bg-transparent text-sm italic text-[#4b463a] placeholder:text-[#a39d8f]"
            />
          </div>
          
          <p className="text-xs text-[#8b8278] mt-2 italic">
            Enter 키로 태그 추가 · 태그 클릭으로 제거
          </p>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-base font-semibold tracking-widest text-[#6f6756]">
            RECOMMENDED SCENTS
          </h2>
          <p className="text-sm text-[#8b8278] italic">
            {filteredAndSortedPerfumes.length}개의 향수
          </p>
        </div>

        {/* Scroll List */}
        <div>
          {filteredAndSortedPerfumes.length > 0 ? (
            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-6 custom-scrollbar">
              {filteredAndSortedPerfumes.map((perfume) => (
                <div
                  key={perfume.id}
                  className="flex items-center gap-6 p-6 rounded-2xl bg-white/80 shadow-sm hover:shadow-lg hover:bg-white transition-all duration-300 cursor-pointer group"
                >
                  <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#e8e2d6] to-[#d4cfc3] flex items-center justify-center flex-shrink-0 group-hover:scale-105 transition-transform">
                    <span className="text-2xl opacity-40">{perfume.name.charAt(0)}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <p className="tracking-widest text-base font-semibold text-[#3f3b2f] mb-1">
                          {perfume.name}
                        </p>
                        <p className="text-xs tracking-wider text-[#c9a961] mb-2 italic">
                          {perfume.nameEn}
                        </p>
                        <p className="text-sm italic text-[#7a735f]">
                          {perfume.category}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        {perfume.discountRate > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            <span className="text-xs text-red-500 line-through">
                              ₩{perfume.originalPrice?.toLocaleString()}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-lg font-semibold text-[#c9a961]">
                                ₩{perfume.price.toLocaleString()}
                              </span>
                              <span className="text-[9px] font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">
                                {perfume.discountRate}%
                              </span>
                            </div>
                          </div>
                        ) : (
                          <p className="text-lg font-semibold text-[#c9a961] mb-1">
                            ₩{perfume.price.toLocaleString()}
                          </p>
                        )}
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={i < perfume.rating ? "text-[#c9a961]" : "text-[#e8e2d6]"}
                            >
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 mt-3">
                      {perfume.tags.slice(0, 4).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-0.5 rounded-full bg-[#f5f1e8] text-[#8b8278] border border-[#e8e2d6]"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm tracking-widest font-medium text-[#c9a961] border border-[#c9a961]/30 px-4 py-2 rounded-lg hover:bg-[#c9a961] hover:text-white transition-all flex-shrink-0">
                    VIEW
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4 opacity-20">🔍</div>
              <p className="text-lg text-[#8b8278] italic mb-2">
                검색 결과가 없습니다
              </p>
              <p className="text-sm text-[#a39d8f]">
                다른 키워드나 태그로 검색해보세요
              </p>
            </div>
          )}
        </div>

      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f5f1e8;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c9a961;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #b89851;
        }
      `}</style>
    </main>
  );
}