export default function Hero64() {
  const cloudCount = 8;
  const clouds = Array.from({ length: cloudCount }, (_, i) => ({
    id: i,
    left: (i * 13) % 100,
    top: 5 + (i * 7) % 30,
    delay: -i * 2,
    duration: 28 + i * 5,
    size: 45 + i * 10,
    opacity: 0.5 + (i % 3) * 0.12,
  }));

  return (
    <div className="absolute inset-0 z-[-1] overflow-hidden" aria-hidden="true">
      {/* Sky background: pink-to-white gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ffd1dc] via-[#fff0f5] to-[#e6e6fa]" />

      {/* Sun glow */}
      <div
        className="absolute top-[12%] left-[20%] w-32 h-32 bg-[#ffd700]/40 rounded-full blur-3xl"
      />

      {/* Clouds */}
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute rounded-full bg-white/60 blur-2xl"
          style={{
            left: `${cloud.left}%`,
            top: `${cloud.top}%`,
            width: `${cloud.size}px`,
            height: `${cloud.size * 0.35}px`,
            opacity: cloud.opacity,
            animation: `floatCloud64 ${cloud.duration}s linear infinite`,
            animationDelay: `${cloud.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
