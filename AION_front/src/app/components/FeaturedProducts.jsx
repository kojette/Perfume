import { useEffect, useState } from "react";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star } from 'lucide-react';
import { Ornament } from './Ornament';
import { supabase } from "../supabaseClient";//

export function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPerfumes = async () => {
      // 1. DB 스키마에 정의된 정확한 관계와 컬럼명을 사용합니다.
      const { data, error } = await supabase
        .from("Perfumes")
        .select(`
          perfume_id,
          name,
          name_en,
          description,
          price,
          sale_price,
          concentration,
          brand_id,
          Brands (
            brand_name
          ),
          Perfume_Images (
            image_url,
            is_thumbnail
          )
        `)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(4);

      if (error) {
        console.error("Perfume fetch error:", error);
        setLoading(false);
        return;
      }
      console.log("FETCH RESULT:", data);///////
      // 2. 가공 로직: DB 구조와 프론트 UI 구조를 연결
      const mappedData = data.map(p => ({
        id: p.perfume_id,
        name: p.name,
        nameEn: p.name_en,
        greekName: p.Brands?.brand_name ?? "OLYMPUS", // 브랜드명 매핑
        category: p.concentration ?? "EDP", // DB의 부향률을 카테고리 자리에 표시
        price: `₩${(p.sale_price ?? p.price)?.toLocaleString()}`,
        // 썸네일 우선 선택 로직
        image: 
          p.Perfume_Images?.find(i => i.is_thumbnail)?.image_url ?? 
          p.Perfume_Images?.[0]?.image_url ?? 
          "/fallback-perfume.jpg", 
        rating: 5, // 현재 DB에 평점 컬럼이 없으므로 임시로 5점 처리
        description: p.description ?? ""
      }));

      setProducts(mappedData);
      setLoading(false);
    };

    fetchPerfumes();
  }, []);

  if (loading) return <div className="py-24 text-center">Loading Divine Scent...</div>;

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      {/* ... (상단 헤더 부분은 기존과 동일) ... */}
      <div className="text-center mb-20">
        <div className="text-[#c9a961] text-xs tracking-[0.4em] mb-3 italic">
          DIVINE COLLECTION
        </div>
        <Ornament className="mb-6" />
        <h2 className="font-display text-5xl tracking-[0.2em] text-[#2a2620] mb-4">
          신들의 향기
        </h2>
        <p className="text-sm text-muted-foreground italic max-w-2xl mx-auto">
          그리스 신화 속 신들에게서 영감을 받은 신성한 향수 컬렉션
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
        {products.map((product) => (
          <div key={product.id} className="group cursor-pointer">
            <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-white border border-[#c9a961]/20">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a2620]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                <button className="border border-[#c9a961] text-[#c9a961] px-6 py-2 text-sm tracking-[0.2em] hover:bg-[#c9a961] hover:text-[#2a2620] transition-all">
                  자세히 보기
                </button>
              </div>
            </div>

            <div className="text-center space-y-3">
              <div className="text-[#c9a961] text-xs tracking-[0.3em] italic">
                {product.greekName}
              </div>
              <h3 className="tracking-[0.15em] text-lg font-medium">
                {product.name}
              </h3>
              <p className="font-display text-xs tracking-[0.3em] text-[#c9a961]">
                {product.nameEn}
              </p>
              <p className="text-[10px] tracking-[0.2em] text-muted-foreground uppercase">
                {product.category}
              </p>

              <div className="flex justify-center gap-1 py-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={10}
                    className={i < product.rating ? "fill-[#c9a961] text-[#c9a961]" : "text-[#c9a961]/30"}
                  />
                ))}
              </div>

              <p className="text-xs italic text-muted-foreground leading-relaxed line-clamp-2 px-4">
                {product.description}
              </p>

              <div className="flex items-center justify-center py-1">
                <div className="h-[px] w-4 bg-[#c9a961]/30"></div>
                <div className="mx-2 text-[#c9a961] text-[10px]">✦</div>
                <div className="h-[px] w-4 bg-[#c9a961]/30"></div>
              </div>

              <p className="tracking-[0.15em] text-[#2a2620] font-semibold">
                {product.price}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}