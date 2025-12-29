import { ImageWithFallback } from './figma/ImageWithFallback';

export function Hero() {
  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1559385301-0187cb6eff46?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsdXh1cnklMjBsaWZlc3R5bGV8ZW58MXx8fHwxNzY2OTIwMTUwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Luxury lifestyle"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
      </div>
      
      <div className="relative z-10 text-center text-white px-4 max-w-4xl mx-auto">
        <h1 className="text-6xl md:text-7xl lg:text-8xl tracking-wider mb-6">
          ESSENCE
        </h1>
        <p className="text-lg md:text-xl tracking-[0.3em] mb-8 opacity-90">
          하이엔드 프래그런스 컬렉션
        </p>
        <button className="px-8 py-3 border-2 border-white hover:bg-white hover:text-black transition-all duration-300 tracking-widest">
          컬렉션 둘러보기
        </button>
      </div>
    </section>
  );
}
