import { useState, useMemo } from "react";

// 실제 향수 데이터
const perfumeData = [
  {
    id: 1,
    name: '아폴론의 빛',
    nameEn: 'APOLLO\'S RADIANCE',
    greekName: 'Ἀπόλλων',
    category: '시트러스 & 우디',
    price: 385000,
    tags: ['시트러스', '우디', '남성', '데이트', '아폴론', '밝은'],
    description: '태양신의 광채를 담은 밝고 따뜻한 향',
    rating: 5
  },
  {
    id: 2,
    name: '아프로디테의 정원',
    nameEn: 'APHRODITE\'S GARDEN',
    greekName: 'Ἀφροδίτη',
    category: '플로럴 & 머스크',
    price: 365000,
    tags: ['플로럴', '머스크', '여성', '로맨틱', '아프로디테', '우아한'],
    description: '사랑의 여신이 거니는 장미 정원의 향기',
    rating: 5
  },
  {
    id: 3,
    name: '아르테미스의 숲',
    nameEn: 'ARTEMIS\' FOREST',
    greekName: 'Ἄρτεμις',
    category: '그린 & 우디',
    price: 345000,
    tags: ['그린', '우디', '중성', '자연', '아르테미스', '청량한'],
    description: '달의 여신이 지키는 신성한 숲의 청량함',
    rating: 5
  },
  {
    id: 4,
    name: '제우스의 천상',
    nameEn: 'ZEUS\' OLYMPUS',
    greekName: 'Ζεύς',
    category: '오리엔탈 & 앰버',
    price: 420000,
    tags: ['오리엔탈', '앰버', '남성', '카리스마', '제우스', '강렬한'],
    description: '신들의 왕이 지배하는 올림포스의 위엄',
    rating: 5
  },
  {
    id: 5,
    name: '헤라의 위엄',
    nameEn: 'HERA\'S MAJESTY',
    greekName: 'Ἥρα',
    category: '플로럴 & 파우더리',
    price: 395000,
    tags: ['플로럴', '파우더리', '여성', '고급', '헤라', '우아한'],
    description: '여신의 여왕이 품은 고귀한 향기',
    rating: 5
  },
  {
    id: 6,
    name: '포세이돈의 바다',
    nameEn: 'POSEIDON\'S OCEAN',
    greekName: 'Ποσειδῶν',
    category: '아쿠아틱 & 미네랄',
    price: 375000,
    tags: ['아쿠아틱', '미네랄', '중성', '시원한', '포세이돈', '청량한'],
    description: '바다의 신이 다스리는 푸른 심해의 신비',
    rating: 4
  },
  {
    id: 7,
    name: '아테나의 지혜',
    nameEn: 'ATHENA\'S WISDOM',
    greekName: 'Ἀθηνᾶ',
    category: '허브 & 우디',
    price: 355000,
    tags: ['허브', '우디', '중성', '지적', '아테나', '차분한'],
    description: '지혜의 여신이 선사하는 명료한 향기',
    rating: 5
  },
  {
    id: 8,
    name: '디오니소스의 축제',
    nameEn: 'DIONYSUS\' FEAST',
    greekName: 'Διόνυσος',
    category: '프루티 & 스파이시',
    price: 340000,
    tags: ['프루티', '스파이시', '중성', '활기찬', '디오니소스', '달콤한'],
    description: '축제의 신이 주최하는 황홀한 연회',
    rating: 4
  }
];

export default function Recommend() {
  const [searchTerm, setSearchTerm] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState([]);
  const [sortBy, setSortBy] = useState("latest");

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
        perfume.category.toLowerCase().includes(searchTerm.toLowerCase())
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
        result.reverse();
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
  }, [searchTerm, selectedTags, sortBy]);

  return (
    <main className="min-h-screen bg-[#faf8f3] pt-32 px-6 pb-20">
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
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all"
          >
            <div className="text-2xl mb-2">👔</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">남성</div>
            <div className="text-[10px] text-[#8b8278] italic">Men</div>
          </button>

          <button
            onClick={() => setSelectedTags(['여성'])}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all"
          >
            <div className="text-2xl mb-2">👗</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">여성</div>
            <div className="text-[10px] text-[#8b8278] italic">Women</div>
          </button>

          <button
            onClick={() => setSelectedTags(['데이트'])}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all"
          >
            <div className="text-2xl mb-2">💕</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">데이트</div>
            <div className="text-[10px] text-[#8b8278] italic">Date</div>
          </button>

          <button
            onClick={() => setSelectedTags(['청량한'])}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all"
          >
            <div className="text-2xl mb-2">🌿</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">청량한</div>
            <div className="text-[10px] text-[#8b8278] italic">Fresh</div>
          </button>

          <button
            onClick={() => setSearchTerm('플로럴')}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all"
          >
            <div className="text-2xl mb-2">🌸</div>
            <div className="text-sm font-semibold tracking-wider text-[#2a2620] mb-1">봄/여름</div>
            <div className="text-[10px] text-[#8b8278] italic">Spring/Summer</div>
          </button>

          <button
            onClick={() => setSearchTerm('우디')}
            className="group p-5 bg-white/70 border border-[#c9a961]/20 rounded-xl hover:border-[#c9a961] hover:bg-white transition-all"
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
              placeholder="ex) 플로럴, 데이트, 아프로디테"
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
                    <span className="text-2xl opacity-40">{perfume.greekName.charAt(0)}</span>
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
                        <p className="text-lg font-semibold text-[#c9a961] mb-1">
                          ₩{perfume.price.toLocaleString()}
                        </p>
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