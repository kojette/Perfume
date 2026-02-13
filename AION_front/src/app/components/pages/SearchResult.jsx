import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import { Ornament } from '../Ornament';

const SearchResult = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [inputValue, setInputValue] = useState(query);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (query) {
            setInputValue(query);
            fetchSearchResults(query);
        } else {
            setResults([]);
            setLoading(false);
        }
    }, [query]);

    const fetchSearchResults = async (searchKeyword) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:8080/api/search/functions?keyword=${searchKeyword}`);

            if (response.ok) {
                const json = await response.json();
                console.log("백엔드 응답 데이터: ", json);

                let items = json.data;

                if (items && items.length > 0) {
                  const perfumeIds = items.map(item => item.perfumeId);
                  const {data: images} = await supabase
                    .from('Perfume_Images')
                    .select('perfume_id, image_url')
                    .in('perfume_id', perfumeIds)
                    .eq('is_thumbnail', true);

                    const imageMap = {};
                    images?.forEach(img => {
                      imageMap[img.perfume_id] = img.image_url;
                    });

                    items = items.map(item => ({
                      ...item,
                      imageUrl : imageMap[item.perfumeId] || item.imageUrl || null
                    }));
                }

                setResults(items);

            }
        } catch (error) {
            console.error("검색 API 호출 실패: ", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        if (inputValue.trim() !== '') {
            setSearchParams({q: inputValue.trim()});
        }
    };

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6">
        <div className="max-w-6xl mx-auto">
        
        <div className="text-center mb-12">
          <Ornament className="mb-4" />
          <h2 className="text-2xl font-display tracking-[0.3em] text-[#2a2620] mb-8">SEARCH</h2>
          
          <form 
            onSubmit={handleSearchSubmit} 
            className="max-w-4xl mx-auto flex h-14 bg-white border border-[#c9a961]/30 shadow-sm focus-within:border-[#c9a961] transition-colors"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="찾으시는 컬렉션이나 향을 입력해주세요"
              className="flex-1 px-6 bg-transparent outline-none text-[#2a2620] text-sm tracking-widest placeholder-[#8b8278]/50"
            />
            <button 
              type="submit"
              className="w-32 bg-[#2a2620] text-white text-xs tracking-[0.3em] hover:bg-[#c9a961] transition-colors cursor-pointer"
            >
              검색
            </button>
          </form>
        </div>

        {/* 검색 결과 카운트 영역 */}
        {query && !loading && (
          <div className="border-b border-[#c9a961]/20 pb-4 mb-8">
            <p className="text-[#8b8278] text-xs tracking-widest">
              '{query}'에 대한 <span className="text-[#2a2620] font-bold">{results.length}</span>개의 결과
            </p>
          </div>
        )}

        {/* 로딩 중일 때 화면 */}
        {loading && query && (
          <div className="text-center py-20 text-[#c9a961] text-xs tracking-widest animate-pulse">
            검색 중...
          </div>
        )}

        {/* 결과가 없을 때 화면 */}
        {!loading && query && results.length === 0 && (
          <div className="text-center py-32 border border-dashed border-[#c9a961]/30 bg-white">
            <p className="text-[#8b8278] text-sm tracking-widest mb-6 italic">
              입력하신 '{query}'에 대한 상품이 존재하지 않습니다.
            </p>
            <button 
              onClick={() => navigate('/collections')}
              className="px-8 py-3 bg-[#faf8f3] border border-[#c9a961] text-[#c9a961] text-[10px] tracking-[0.3em] hover:bg-[#c9a961] hover:text-white transition-colors cursor-pointer"
            >
              전체 컬렉션 보기
            </button>
          </div>
        )}

        {/* 검색 결과가 있을 때 상품 리스트 (그리드) */}
        {!loading && results.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
            {results.map((item) => (
              <div 
                key={item.perfumeId} 
                className="group cursor-pointer"
                onClick={() => navigate(`/perfume/${item.perfumeId}`)}
              >
                {/* 상품 이미지 영역 */}
                <div 
                  className="aspect-[3/4] bg-white border border-[#eee] mb-4 bg-cover bg-center group-hover:border-[#c9a961]/50 transition-colors" 
                    style={{
                        backgroundImage: item.imageUrl ? `url(${item.imageUrl})` 
                            : `url(https://via.placeholder.com/300x400?text=${encodeURIComponent(item.name)})`}}
                ></div>
                {/* 상품 정보 영역 */}
                <h3 className="font-serif text-lg text-[#1a1a1a] mb-1 group-hover:text-[#c9a961] transition-colors">
                  {item.name}
                </h3>
                <p className="text-xs text-[#8b8278] mb-2">{item.brand?.name || 'AION SIGNATURE'}</p>
                <p className="text-sm font-medium text-[#2a2620]">₩{item.price?.toLocaleString()}</p>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
    )
}

export default SearchResult;