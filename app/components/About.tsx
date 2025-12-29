import { ImageWithFallback } from './figma/ImageWithFallback';

export function About() {
  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-sm tracking-[0.3em] text-muted-foreground mb-4">OUR STORY</p>
            <h2 className="text-4xl tracking-wider mb-6">
              향기로 만들어가는<br />특별한 순간
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <p>
                ESSENCE는 1947년 프랑스 그라스에서 시작된 
                하이엔드 프래그런스 하우스입니다.
              </p>
              <p>
                75년이 넘는 세월 동안 전통적인 조향 기법과 
                혁신적인 창의성을 조화시켜, 시대를 초월한 
                향수를 선보여왔습니다.
              </p>
              <p>
                최상급 천연 원료만을 사용하여 각 향수는 
                예술 작품과 같은 완성도를 자랑합니다.
              </p>
            </div>
            <button className="mt-8 px-8 py-3 border-2 border-black hover:bg-black hover:text-white transition-all duration-300 tracking-widest">
              브랜드 스토리
            </button>
          </div>

          <div className="order-1 lg:order-2 aspect-square">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1608656218680-e8be81ce71d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG9yYWwlMjBhcnJhbmdlbWVudHxlbnwxfHx8fDE3NjY5MDY5MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
              alt="Floral arrangement"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
