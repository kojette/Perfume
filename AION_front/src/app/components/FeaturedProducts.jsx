import { useEffect, useState } from "react";
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star } from 'lucide-react';
import { Ornament } from './Ornament';
import { supabase } from "../supabaseClient";
import { useNavigate } from 'react-router-dom';

export function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchPerfumes = async () => {
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
          avg_rating,
          Brands (
            brand_name
          ),
          Perfume_Images (
            image_url,
            is_thumbnail
          )
        `)
        .eq("is_active", true)

      if (error) {
        console.error("Perfume fetch error:", error);
        setLoading(false);
        return;
      }

      const shuffled = [...data].sort(() => 0.5 - Math.random()).slice(0, 4);

      const mappedData = shuffled.map(p => ({
        id: p.perfume_id,
        name: p.name,
        nameEn: p.name_en,
        greekName: p.Brands?.brand_name || "OLYMPUS",
        category: p.concentration || "EDP",
        price: `₩${(p.sale_price || p.price)?.toLocaleString()}`,
        description: p.description || "신성한 신들의 향기",
        image: p.Perfume_Images?.find(i => i.is_thumbnail)?.image_url || p.Perfume_Images?.[0]?.image_url,
        rating: Math.floor(p.avg_rating) || 5
      }));

      setProducts(mappedData);
      setLoading(false);
    };

    fetchPerfumes();
  }, []);

  if (loading) return <div className="py-24 text-center">Loading Divine Scent...</div>;

  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
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
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/collections', {state: {targetPerfumeId: product.id}});
                  }}
                  className="border border-[#c9a961] text-[#c9a961] px-6 py-2 text-sm tracking-[0.2em] hover:bg-[#c9a961] hover:text-[#2a2620] transition-all cursor-pointer">
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

              <div className="flex items-center justify-center py-1">
                <div className="h-[px] w-4 bg-[#c9a961]/30"></div>
                <div className="mx-2 text-[#c9a961] text-[10px]">✦</div>
                <div className="h-[px] w-4 bg-[#c9a961]/30"></div>
              </div>

              <p className="text-xs italic text-muted-foreground leading-relaxed line-clamp-2 px-4">
                {product.description}
              </p>

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