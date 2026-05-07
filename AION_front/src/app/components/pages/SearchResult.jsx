import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { getRecommendations } from '../../../services/recommendationApi';
import { Ornament } from '../Ornament';

const SUGGESTED_TAGS = ['데이트', '럭셔리', '청량함', '신비로운', '로맨틱한', '달콤함', '가을', '겨울', '봄', '여름', '데일리', '오피스'];

const SearchResult = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [inputValue, setInputValue] = useState('');
    const [selectedTags, setSelectedTags] = useState(() => {
        const q = new URLSearchParams(window.location.search).get('q') || '';
        return [...q.matchAll(/#(\S+)/g)].map(m => m[1]);
    });
    const [searchText, setSearchText] = useState(() => {
        const q = new URLSearchParams(window.location.search).get('q') || '';
        return q.replace(/#\S+/g, '').trim();
    });
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (searchText || selectedTags.length > 0) {
            performSearch();
        } else {
            setResults([]);
        }
    }, [searchText, selectedTags]);

    const performSearch = async () => {
        setLoading(true);
        try {
            if (selectedTags.length > 0) {
                const res = await getRecommendations({
                    search: searchText || undefined,
                    tags: selectedTags,
                    size: 100,
                });
                const items = (res.content || []).map(p => ({
                    perfumeId: p.id,
                    name: p.name,
                    price: p.salePrice || p.price,
                    imageUrl: p.imageUrl,
                    brandName: p.brandName,
                    tags: p.tags || [],
                    discountRate: p.discountRate || 0,
                    originalPrice: p.originalPrice,
                }));
                setResults(items);
            } else {
                const response = await fetch(
                    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/search/functions?keyword=${searchText}`
                );
                if (response.ok) {
                    const json = await response.json();
                    setResults(json.data || []);
                }
            }
        } catch (e) {
            console.error('검색 실패:', e);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const trimmed = inputValue.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('#')) {
            const tag = trimmed.substring(1);
            if (tag && !selectedTags.includes(tag)) {
                setSelectedTags(prev => [...prev, tag]);
                setSearchText('');
            }
            setInputValue('');
        } else {
            setSearchText(trimmed);
            setSelectedTags([]);
            setInputValue('');
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === ' ' && inputValue.startsWith('#')) {
            e.preventDefault();
            const tag = inputValue.substring(1).trim();
            if (tag && !selectedTags.includes(tag)) {
                setSelectedTags(prev => [...prev, tag]);
                setSearchText('');
            }
            setInputValue('');
        }
        if (e.key === 'Backspace' && inputValue === '' && selectedTags.length > 0) {
            setSelectedTags(prev => prev.slice(0, -1));
        }
    };

    const removeTag = (tag) => setSelectedTags(prev => prev.filter(t => t !== tag));

    const addSuggestedTag = (tag) => {
        if (!selectedTags.includes(tag)) {
            setSelectedTags(prev => [...prev, tag]);
            setSearchText('');
        }
    };

    const clearAll = () => {
        setSelectedTags([]);
        setSearchText('');
        setInputValue('');
        setResults([]);
        setSearchParams({});
    };

    const hasFilter = searchText || selectedTags.length > 0;

    return (
        <div className="min-h-screen bg-[#faf8f3] pt-12 pb-20 px-6">
            <div className="max-w-6xl mx-auto">
                <div className="text-center mb-10">
                    <Ornament className="mb-4" />
                    <h2
                        className="text-2xl font-display tracking-[0.3em] text-[#2a2620] mb-8 cursor-pointer hover:text-[#c9a961] transition-colors"
                        onClick={clearAll}
                    >
                        SEARCH
                    </h2>

                    <form onSubmit={handleSubmit}
                        className="max-w-4xl mx-auto bg-white border border-[#c9a961]/30 shadow-sm focus-within:border-[#c9a961] transition-colors min-h-[56px] flex items-center px-4 gap-2 flex-wrap">

                        {selectedTags.map(tag => (
                            <span key={tag}
                                className="flex items-center gap-1 px-3 py-1 bg-[#1a1510] text-[#c9a961] text-xs border border-[#c9a961] flex-shrink-0">
                                #{tag}
                                <button type="button" onClick={() => removeTag(tag)}
                                    className="hover:text-white transition-colors ml-1 cursor-pointer">✕</button>
                            </span>
                        ))}

                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={selectedTags.length === 0 && !searchText
                                ? '향수명 검색 또는 #태그 입력'
                                : '#태그 추가...'}
                            className="flex-1 min-w-[160px] bg-transparent outline-none text-[#2a2620] text-sm tracking-widest placeholder-[#8b8278]/50 py-3"
                        />

                        {hasFilter && (
                            <button type="button" onClick={clearAll}
                                className="text-[#8b8278] hover:text-[#c9a961] transition-colors p-1 cursor-pointer flex-shrink-0">
                                ✕
                            </button>
                        )}

                        <button type="submit"
                            className="bg-[#2a2620] text-white text-xs tracking-[0.3em] hover:bg-[#c9a961] transition-colors cursor-pointer px-6 py-3 flex-shrink-0">
                            검색
                        </button>
                    </form>

                    <p className="text-[10px] text-[#8b8278]/60 tracking-widest mt-2">
                        #을 붙이면 태그로 검색됩니다 &nbsp;예) #데이트 &nbsp;#럭셔리
                    </p>
                </div>

                {!hasFilter && (
                    <div className="mb-10">
                        <p className="text-[10px] tracking-[0.5em] text-[#8b8278] uppercase mb-3 text-center">추천 태그</p>
                        <div className="flex flex-wrap gap-2 justify-center">
                            {SUGGESTED_TAGS.map(tag => (
                                <button key={tag} onClick={() => addSuggestedTag(tag)}
                                    className="px-4 py-1.5 border border-[#c9a961]/40 text-[#8b8278] text-xs hover:border-[#c9a961] hover:text-[#c9a961] hover:bg-[#c9a961]/5 transition-colors cursor-pointer">
                                    #{tag}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {hasFilter && !loading && (
                    <div className="border-b border-[#c9a961]/20 pb-4 mb-8 flex items-center gap-3 flex-wrap">
                        {selectedTags.map(t => (
                            <span key={t} className="text-[#c9a961] text-xs font-medium">#{t}</span>
                        ))}
                        {searchText && selectedTags.length > 0 && <span className="text-[#8b8278] text-xs">·</span>}
                        {searchText && <span className="text-[#2a2620] text-xs">'{searchText}'</span>}
                        <span className="text-[#8b8278] text-xs">검색 결과</span>
                        <span className="text-[#2a2620] text-xs font-bold">{results.length}개</span>
                    </div>
                )}

                {loading && (
                    <div className="text-center py-20 text-[#c9a961] text-xs tracking-widest animate-pulse">
                        검색 중...
                    </div>
                )}

                {!loading && hasFilter && results.length === 0 && (
                    <div className="text-center py-32 border border-dashed border-[#c9a961]/30 bg-white">
                        <p className="text-[#8b8278] text-sm tracking-widest mb-6 italic">
                            검색 결과가 없습니다
                        </p>
                        <button onClick={() => navigate('/collections')}
                            className="px-8 py-3 bg-[#faf8f3] border border-[#c9a961] text-[#c9a961] text-[10px] tracking-[0.3em] hover:bg-[#c9a961] hover:text-white transition-colors cursor-pointer">
                            전체 컬렉션 보기
                        </button>
                    </div>
                )}

                {!loading && results.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
                        {results.map((item) => (
                            <div key={item.perfumeId} className="group cursor-pointer"
                                onClick={() => navigate(`/collections?perfumeId=${item.perfumeId}`)}>

                                <div className="aspect-[3/4] bg-white border border-[#eee] mb-4 bg-cover bg-center group-hover:border-[#c9a961]/50 transition-colors overflow-hidden"
                                    style={{
                                        backgroundImage: item.imageUrl
                                            ? `url(${item.imageUrl})`
                                            : `url(https://via.placeholder.com/300x400?text=${encodeURIComponent(item.name)})`
                                    }}>
                                    {item.discountRate > 0 && (
                                        <span className="inline-block m-2 px-2 py-0.5 bg-[#1a1510] text-[#c9a961] text-[9px]">
                                            {item.discountRate}%
                                        </span>
                                    )}
                                </div>

                                <h3 className="font-serif text-base text-[#1a1a1a] mb-1 group-hover:text-[#c9a961] transition-colors">
                                    {item.name}
                                </h3>
                                <p className="text-xs text-[#8b8278] mb-1">{item.brandName || 'AION SIGNATURE'}</p>
                                {item.discountRate > 0 && (
                                    <p className="text-[10px] text-[#8b8278] line-through">
                                        ₩{item.originalPrice?.toLocaleString()}
                                    </p>
                                )}
                                <p className="text-sm font-medium text-[#c9a961]">₩{item.price?.toLocaleString()}</p>

                                {item.tags?.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {item.tags.slice(0, 2).map((t, i) => (
                                            <span key={i} className="text-[9px] text-[#8b8278]/70">#{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchResult;