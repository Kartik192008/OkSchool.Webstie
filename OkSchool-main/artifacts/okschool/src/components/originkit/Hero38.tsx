export default function Hero38() {
  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden" aria-hidden="true">
      {/* Light neutral background */}
      <div className="absolute inset-0 bg-[#f8fafc]" />

      {/* Wooden ring - outer darker wood */}
      <div
        className="absolute top-[20%] left-[10%] right-[10%] bottom-[20%] bg-[#8b5a2b]/20 rounded-full blur-[40px]"
      />

      {/* Wood ring stroke */}
      <div
        className="absolute top-[18%] left-[12%] right-[12%] bottom-[18%] border-2 border-[#6b4a2d]/30 rounded-full"
      />

      {/* Inner wood tone */}
      <div
        className="absolute top-[22%] left-[16%] right-[16%] bottom-[22%] bg-[#a67c52]/15 rounded-full blur-[20px]"
      />

      {/* Moss - top arc */}
      <div
        className="absolute top-[14%] left-[8%] right-[8%] h-[18%] bg-[#4a7c59]/50 blur-[25px] rounded-full"
      />

      {/* Moss - bottom arc */}
      <div
        className="absolute bottom-[14%] left-[8%] right-[8%] h-[18%] bg-[#3a6b47]/50 blur-[25px] rounded-full"
      />

      {/* Moss - left arc */}
      <div
        className="absolute top-[18%] left-[10%] w-[18%] bg-[#2d5a3d]/60 blur-[20px] rounded-full"
      />

      {/* Moss - right arc */}
      <div
        className="absolute top-[18%] right-[10%] w-[18%] bg-[#2d5a3d]/60 blur-[20px] rounded-full"
      />

      {/* Center glow */}
      <div
        className="absolute top-[25%] left-[25%] right-[25%] bottom-[25%] bg-white/20 rounded-full blur-[30px]"
      />

      {/* Subtle texture/moss dots */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22><circle cx=%2215%22 cy=%2215%22 r=%221%22 fill=%22%232d5a3d%22 opacity=%220.15%22/%3E<circle cx=%2245%22 cy=%2245%22 r=%221%22 fill=%22%234a7c59%22 opacity=%220.1%22/%3E<circle cx=%2230%22 cy=%2250%22 r=%221%22 fill=%22%233a6b47%22 opacity=%220.12%22/%3E<circle cx=%2250%22 cy=%2230%22 r=%221%22 fill=%22%232d5a3d%22 opacity=%220.08%22/%3E</svg>')",
          backgroundRepeat: "repeat",
          opacity: 0.4,
        }}
      />
    </div>
  );
}
