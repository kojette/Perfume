import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star } from 'lucide-react';
import { Ornament } from './Ornament';

const products = [
  {
    id: 1,
    name: '아폴론의 빛',
    nameEn: 'APOLLO\'S RADIANCE',
    greekName: 'Ἀπόλλων',
    category: '시트러스 & 우디',
    price: '₩385,000',
    image: 'https://images.unsplash.com/photo-1719175936556-dbd05e415913?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXJmdW1lJTIwYm90dGxlfGVufDF8fHx8MTc2Njg2MzA3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    description: '태양신의 광채를 담은 밝고 따뜻한 향'
  },
  {
    id: 2,
    name: '아프로디테의 정원',
    nameEn: 'APHRODITE\'S GARDEN',
    greekName: 'Ἀφροδίτη',
    category: '플로럴 & 머스크',
    price: '₩365,000',
    image: 'https://images.unsplash.com/photo-1747052881000-a640a4981dd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZnJhZ3JhbmNlfGVufDF8fHx8MTc2NjkwNzA0OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    description: '사랑의 여신이 거니는 장미 정원의 향기'
  },
  {
    id: 3,
    name: '아르테미스의 숲',
    nameEn: 'ARTEMIS\' FOREST',
    greekName: 'Ἄρτεμις',
    category: '그린 & 우디',
    price: '₩345,000',
    image: 'https://images.unsplash.com/photo-1592400374401-002fe1d25961?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcGVyZnVtZXxlbnwxfHx8fDE3NjY5Nzg0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    description: '달의 여신이 지키는 신성한 숲의 청량함'
  },
  {
    id: 4,
    name: '제우스의 천상',
    nameEn: 'ZEUS\' OLYMPUS',
    greekName: 'Ζεύς',
    category: '오리엔탈 & 앰버',
    price: '₩420,000',
    image: 'https://images.unsplash.com/photo-1654973433534-1238e06f6b38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwY29zbWV0aWNzfGVufDF8fHx8MTc2Njk3ODQ1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    description: '신들의 왕이 지배하는 올림포스의 위엄'
  }
];

export function FeaturedProducts() {
  return (
    <section className="py-24 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-20">
        <div className="text-[#c9a961] text-xs tracking-[0.4em] mb-3 italic">DIVINE COLLECTION</div>
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
            {/* Product Image */}
            <div className="relative aspect-[3/4] mb-6 overflow-hidden bg-white border border-[#c9a961]/20">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#2a2620]/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end justify-center pb-6">
                <button className="border border-[#c9a961] text-[#c9a961] px-6 py-2 text-sm tracking-[0.2em] hover:bg-[#c9a961] hover:text-[#2a2620] transition-all">
                  자세히 보기
                </button>
              </div>
            </div>
            
            {/* Product Info */}
            <div className="text-center space-y-3">
              <div className="text-[#c9a961] text-xs tracking-[0.3em] italic">{product.greekName}</div>
              <h3 className="tracking-[0.15em] text-lg">{product.name}</h3>
              <p className="font-display text-xs tracking-[0.3em] text-[#c9a961]">{product.nameEn}</p>
              <p className="text-xs tracking-[0.2em] text-muted-foreground">{product.category}</p>
              
              {/* Rating */}
              <div className="flex justify-center gap-1 py-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={12}
                    className={i < Math.floor(product.rating) ? "fill-[#c9a961] text-[#c9a961]" : "text-[#c9a961]/30"}
                  />
                ))}
              </div>
              
              <p className="text-sm italic text-muted-foreground leading-relaxed">{product.description}</p>
              
              {/* Decorative divider */}
              <div className="flex items-center justify-center py-2">
                <div className="h-[1px] w-8 bg-[#c9a961]/30"></div>
                <div className="mx-2 text-[#c9a961] text-xs">✦</div>
                <div className="h-[1px] w-8 bg-[#c9a961]/30"></div>
              </div>
              
              <p className="tracking-[0.2em] text-[#2a2620]">{product.price}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
