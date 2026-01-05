import { useState } from "react";

export function Recommend() {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && tagInput.trim() !== "") {
      e.preventDefault();
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };


  return (
    <main className="min-h-screen bg-[#faf8f3] pt-32 px-6">
      <div className="max-w-5xl mx-auto">

        {/* Title */}
        <div className="mb-20 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-[0.25em] text-[#c9a961] mb-6 drop-shadow-sm">
            RECOMMEND
          </h1>
          <p className="text-base italic text-[#6f6756]">
            당신의 취향을 바탕으로 향을 제안합니다
          </p>
        </div>

        {/* Search Row */}
        <div className="mb-8 flex flex-col md:flex-row gap-4 items-stretch">

          {/* Product Name Search */}
          <input
            placeholder="상품명 검색"
            className="flex-1 px-5 py-3 rounded-xl border border-[#c9a961]/30 bg-white/70 text-sm italic outline-none focus:border-[#c9a961]"
          />

          {/* Sort */}
          <select
            className="w-40 px-4 py-3 rounded-xl border border-[#c9a961]/30 bg-white/70 text-sm tracking-widest outline-none"
          >
            <option>최신순</option>
            <option>가격순</option>
            <option>추천순</option>
            <option>판매순</option>
          </select>
        </div>

        {/* Tag Input */}
        <div className="mb-14">
          <label className="block text-sm font-semibold tracking-widest mb-3 text-[#6f6756]">
            PREFERENCE TAGS
          </label>

          <div className="border border-[#c9a961]/30 rounded-2xl p-4 flex flex-wrap gap-3 bg-white/70 shadow-sm">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-sm px-4 py-1.5 rounded-full border border-[#c9a961]/50 text-[#c9a961] font-medium italic bg-white"
              >
                #{tag}
              </span>
            ))}

            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex) 플로럴, 데이트, 아프로디테"
              className="flex-1 min-w-[200px] outline-none bg-transparent text-sm italic text-[#4b463a]"
            />
          </div>
        </div>

        {/* Scroll List */}
        <div>
          <h2 className="text-base font-semibold tracking-widest mb-8 text-[#6f6756]">
            RECOMMENDED SCENTS
          </h2>

          <div className="max-h-[460px] overflow-y-auto pr-2 space-y-6">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-6 p-6 rounded-2xl bg-white/80 shadow-sm hover:shadow-md transition"
              >
                <div className="w-20 h-20 rounded-xl bg-[#e8e2d6]" />

                <div className="flex-1">
                  <p className="tracking-widest text-base font-semibold text-[#3f3b2f]">
                    AION No.{i + 1}
                  </p>
                  <p className="text-sm italic text-[#7a735f] mt-2">
                    플로럴 · 머스크 · 신화적 이미지
                  </p>
                </div>

                <div className="text-sm tracking-widest font-medium text-[#c9a961]">
                  VIEW
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
