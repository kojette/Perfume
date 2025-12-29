export function Footer() {
  return (
    <footer className="bg-white border-t border-black/5 py-12 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="text-xl tracking-[0.3em] mb-4">ESSENCE</h3>
            <p className="text-sm text-muted-foreground">
              하이엔드 프래그런스<br />
              1947년부터 이어온 전통
            </p>
          </div>

          <div>
            <h4 className="tracking-wider mb-4">쇼핑</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">전체 컬렉션</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">시그니처</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">리미티드 에디션</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">선물 세트</a></li>
            </ul>
          </div>

          <div>
            <h4 className="tracking-wider mb-4">고객 서비스</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">자주 묻는 질문</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">배송 안내</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">반품 및 교환</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">고객센터</a></li>
            </ul>
          </div>

          <div>
            <h4 className="tracking-wider mb-4">매장 안내</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">서울 플래그십</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">부산 센텀점</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">제주 한라점</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">전체 매장</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
          <p>© 2025 ESSENCE. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-foreground transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-foreground transition-colors">이용약관</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
