import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  nameEn: string;
  category: string;
  price: string;
  image: string;
  rating: number;
  description: string;
}

const products: Product[] = [
  {
    id: 1,
    name: '노블 우드',
    nameEn: 'NOBLE WOOD',
    category: '우디 계열',
    price: '₩285,000',
    image: 'https://images.unsplash.com/photo-1719175936556-dbd05e415913?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBwZXJmdW1lJTIwYm90dGxlfGVufDF8fHx8MTc2Njg2MzA3OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    description: '샌달우드와 시더의 깊이감'
  },
  {
    id: 2,
    name: '엘레강스 로즈',
    nameEn: 'ELEGANCE ROSE',
    category: '플로럴 계열',
    price: '₩265,000',
    image: 'https://images.unsplash.com/photo-1747052881000-a640a4981dd0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVnYW50JTIwZnJhZ3JhbmNlfGVufDF8fHx8MTc2NjkwNzA0OHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    description: '다마스크 로즈의 우아함'
  },
  {
    id: 3,
    name: '퓨어 미스트',
    nameEn: 'PURE MIST',
    category: '시트러스 계열',
    price: '₩245,000',
    image: 'https://images.unsplash.com/photo-1592400374401-002fe1d25961?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwcGVyZnVtZXxlbnwxfHx8fDE3NjY5Nzg0NTB8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 4.5,
    description: '베르가못과 네롤리의 청량함'
  },
  {
    id: 4,
    name: '미드나잇 오드',
    nameEn: 'MIDNIGHT OUD',
    category: '오리엔탈 계열',
    price: '₩320,000',
    image: 'https://images.unsplash.com/photo-1654973433534-1238e06f6b38?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcmVtaXVtJTIwY29zbWV0aWNzfGVufDF8fHx8MTc2Njk3ODQ1MHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
    rating: 5,
    description: '아가우드의 신비로운 매력'
  }
];

export function FeaturedProducts() {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto">
      <div className="text-center mb-16">
        <p className="text-sm tracking-[0.3em] text-muted-foreground mb-2">SIGNATURE COLLECTION</p>
        <h2 className="text-4xl tracking-wider">시그니처 컬렉션</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.map((product) => (
          <div key={product.id} className="group cursor-pointer">
            <div className="aspect-[3/4] mb-4 overflow-hidden bg-gray-100">
              <ImageWithFallback
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
              />
            </div>
            
            <div className="text-center space-y-2">
              <p className="text-xs tracking-[0.2em] text-muted-foreground">{product.category}</p>
              <h3 className="tracking-wider">{product.name}</h3>
              <p className="text-xs tracking-[0.3em] text-muted-foreground">{product.nameEn}</p>
              
              <div className="flex justify-center gap-1 py-2">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < Math.floor(product.rating) ? "fill-black" : ""}
                  />
                ))}
              </div>
              
              <p className="tracking-wider">{product.price}</p>
              <p className="text-sm text-muted-foreground">{product.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
