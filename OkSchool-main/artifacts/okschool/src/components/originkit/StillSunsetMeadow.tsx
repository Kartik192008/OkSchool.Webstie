import { useEffect } from "react";

export default function StillSunsetMeadow() {
  useEffect(() => {
    const body = document.body;
    body.classList.add("originkit-bg");
    return () => {
      body.classList.remove("originkit-bg");
    };
  }, []);

  const cloudCount = 7;
  const clouds = Array.from({ length: cloudCount }, (_, i) => ({
    id: i,
    left: (i * 15) % 100,
    top: 8 + (i * 6) % 30,
    delay: -i * 2.5,
    duration: 30 + i * 4,
    size: 50 + i * 12,
    opacity: 0.35 + (i % 3) * 0.15,
  }));

  const flowerCount = 18;
  const flowers = Array.from({ length: flowerCount }, (_, i) => ({
    id: i,
    left: 3 + (i * 11) % 92,
    bottom: 1 + (i * 4) % 7,
    hue: 20 + (i * 37) % 70,
    size: 5 + (i % 5),
    delay: -i * 0.4,
    duration: 3 + (i % 3),
  }));

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden" aria-hidden="true">
      {/* Sunset sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#ff9a9e] via-[#fecfef] to-[#a1c4fd]" />

      {/* Sun */}
      <div
        className="absolute top-[10%] left-[15%] w-28 h-28 bg-[#ffd700]/70 rounded-full blur-2xl animate-pulse"
      />

      {/* Clouds */}
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute rounded-full bg-white/50 blur-lg"
          style={{
            left: `${cloud.left}%`,
            top: `${cloud.top}%`,
            width: `${cloud.size}px`,
            height: `${cloud.size * 0.4}px`,
            opacity: cloud.opacity,
            animation: `floatCloud ${cloud.duration}s linear infinite`,
            animationDelay: `${cloud.delay}s`,
          }}
        />
      ))}

      {/* Horizon shadow */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[7%] bg-gradient-to-t from-[#2d3436]/60 to-transparent"
      />

      {/* Grass field */}
      <div className="absolute bottom-0 left-0 right-0 h-[20%] bg-[#6fbf73] overlay-[linear-gradient(to_bottom,#74c69d,#5a9e5f)]" />

      {/* Grass texture overlay */}
      <div
        className="absolute bottom-0 left-0 right-0 h-full"
        style={{
          backgroundImage:
            "url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%226%22 height=%226%22 viewBox=%220 0 6 6%22><path stroke=%22%234a7c59%22 stroke-width=%220.4%22 d=%22M3 0L3 6M0 3L6 3%22/%22></svg>')",
          backgroundRepeat: "repeat",
          opacity: 0.35,
        }}
      />

      {/* Flowers */}
      {flowers.map((flower) => (
        <div
          key={flower.id}
          className="absolute rounded-full"
          style={{
            left: `${flower.left}%`,
            bottom: `${flower.bottom}%`,
            width: `${flower.size}px`,
            height: `${flower.size}px`,
            backgroundColor: `hsl(${flower.hue}, 75%, 55%)`,
            animation: `sway ${flower.duration}s ease-in-out infinite`,
            animationDelay: `${flower.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
