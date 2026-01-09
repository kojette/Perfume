import { ImageWithFallback } from './figma/ImageWithFallback';
import { Ornament } from './Ornament';

export function About() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1 space-y-6">
            <div className="text-[#c9a961] text-xs tracking-[0.4em] italic">OUR LEGACY</div>
            <Ornament />
            <h2 className="font-display text-5xl tracking-[0.15em] text-[#2a2620]">
              천년의 향기,<br />
              영원의 예술
            </h2>
            
            <div className="space-y-5 text-muted-foreground leading-loose italic">
              <p>
                OLYMPUS는 1847년 그리스 아테네에서 시작된 
                전통 조향 하우스입니다.
              </p>
              <p>
                파르테논 신전의 대리석처럼 순수하고, 
                에게해의 석양처럼 찬란한 향수를 만들어온 
                175년의 유산을 이어가고 있습니다.
              </p>
              <p>
                고대 그리스의 신화와 철학에서 영감을 받아, 
                각 향수는 하나의 서사시가 되어 
                당신만의 이야기를 써내려갑니다.
              </p>
              <p className="text-[#c9a961] not-italic tracking-[0.2em] pt-4">
                "향기는 영혼의 언어다" - 플라톤
              </p>
            </div>

            {/* Decorative divider */}
            <div className="flex items-center py-4">
              <div className="h-[1px] w-12 bg-gradient-to-r from-[#c9a961] to-transparent"></div>
              <div className="mx-3 text-[#c9a961] text-sm">✦</div>
              <div className="h-[1px] flex-1 bg-gradient-to-r from-[#c9a961] to-transparent"></div>
            </div>

            <button className="px-8 py-4 border-2 border-[#c9a961] text-[#c9a961] hover:bg-[#c9a961] hover:text-[#2a2620] transition-all duration-500 tracking-[0.3em] text-sm">
              브랜드 여정 탐험하기
            </button>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="aspect-square overflow-hidden border-4 border-[#c9a961]/20 relative">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1608656218680-e8be81ce71d7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmbG9yYWwlMjBhcnJhbmdlbWVudHxlbnwxfHx8fDE3NjY5MDY5MTh8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="Floral arrangement"
                className="w-full h-full object-cover"
              />
              {/* Corner decorations */}
              <div className="absolute top-0 left-0 w-16 h-16 border-l-4 border-t-4 border-[#c9a961]"></div>
              <div className="absolute top-0 right-0 w-16 h-16 border-r-4 border-t-4 border-[#c9a961]"></div>
              <div className="absolute bottom-0 left-0 w-16 h-16 border-l-4 border-b-4 border-[#c9a961]"></div>
              <div className="absolute bottom-0 right-0 w-16 h-16 border-r-4 border-b-4 border-[#c9a961]"></div>
            </div>

            {/* Floating ornament */}
            <div className="absolute -bottom-6 -right-6 bg-[#c9a961] text-white p-8 max-w-[200px]">
              <div className="text-4xl font-display">175</div>
              <div className="text-xs tracking-[0.3em] mt-2">YEARS OF<br/>EXCELLENCE</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
