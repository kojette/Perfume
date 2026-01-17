export function Ornament({ className = "" }) {
  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      <svg width="80" height="20" viewBox="0 0 80 20" fill="none" className="text-[#c9a961]">
        <path d="M0 10 Q20 5, 40 10 T80 10" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="40" cy="10" r="3" fill="currentColor"/>
        <circle cx="20" cy="10" r="1.5" fill="currentColor"/>
        <circle cx="60" cy="10" r="1.5" fill="currentColor"/>
      </svg>
    </div>
  );
}

export function CornerOrnament({ position = "top-left", className = "" }) {
  const positionClasses = {
    'top-left': 'top-8 left-8',
    'top-right': 'top-8 right-8 rotate-90',
    'bottom-left': 'bottom-8 left-8 -rotate-90',
    'bottom-right': 'bottom-8 right-8 rotate-180'
  };

  return (
    <div className={`absolute ${positionClasses[position]} ${className}`}>
      <svg width="60" height="60" viewBox="0 0 60 60" fill="none" className="text-[#c9a961] opacity-40">
        <path d="M0 0 L15 0 C15 8, 8 15, 0 15 Z" fill="currentColor"/>
        <path d="M5 5 L10 5 C10 7, 7 10, 5 10 Z" fill="none" stroke="currentColor" strokeWidth="0.5"/>
        <circle cx="20" cy="20" r="1" fill="currentColor"/>
        <circle cx="25" cy="25" r="0.5" fill="currentColor"/>
      </svg>
    </div>
  );
}
