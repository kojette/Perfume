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
        <div className="mb-16 text-center">
          <h1 className="font-display text-3xl tracking-[0.4em] text-[#c9a961] mb-4">
            RECOMMEND
          </h1>
          <p className="text-sm opacity-70 italic">
            당신의 취향을 태그로 남겨보세요
          </p>
        </div>

        {/* Tag Input */}
        <div className="mb-12">
          <label className="block text-xs tracking-widest mb-3 opacity-70">
            PREFERENCE TAGS
          </label>

          <div className="border border-[#c9a961]/30 rounded-xl p-4 flex flex-wrap gap-3 bg-white/60">
            {tags.map((tag, idx) => (
              <span
                key={idx}
                className="text-xs tracking-widest px-3 py-1 rounded-full border border-[#c9a961]/40 text-[#c9a961] italic"
              >
                #{tag}
              </span>
            ))}

            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="ex) 플로럴, 데이트, 아프로디테"
              className="flex-1 min-w-[180px] outline-none bg-transparent text-sm italic"
            />
          </div>
        </div>

        {/* Scroll List */}
        <div>
          <h2 className="text-sm tracking-widest mb-6 opacity-70">
            RECOMMENDED SCENTS
          </h2>

          <div className="max-h-[420px] overflow-y-auto pr-2 space-y-6">
            {[1, 2, 3, 4, 5].map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-6 p-4 rounded-2xl bg-white/70 hover:bg-white transition"
              >
                <div className="w-20 h-20 rounded-xl bg-[#e8e2d6]" />

                <div className="flex-1">
                  <p className="tracking-widest text-sm">
                    AION No.{i + 1}
                  </p>
                  <p className="text-xs opacity-60 italic mt-1">
                    플로럴 · 머스크 · 신화적 이미지
                  </p>
                </div>

                <div className="text-xs tracking-widest text-[#c9a961]">
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
