export function Newsletter() {
  return (
    <section className="py-20 px-6 bg-black text-white">
      <div className="max-w-2xl mx-auto text-center">
        <p className="text-sm tracking-[0.3em] opacity-70 mb-4">NEWSLETTER</p>
        <h2 className="text-3xl tracking-wider mb-6">
          특별한 소식을 전해드립니다
        </h2>
        <p className="text-sm opacity-70 mb-8">
          신제품 출시 소식과 독점 혜택을 가장 먼저 만나보세요
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto">
          <input
            type="email"
            placeholder="이메일 주소를 입력해주세요"
            className="flex-1 px-6 py-3 bg-transparent border border-white/30 focus:border-white outline-none transition-colors"
          />
          <button className="px-8 py-3 bg-white text-black hover:bg-white/90 transition-colors tracking-wider">
            구독하기
          </button>
        </div>
      </div>
    </section>
  );
}
