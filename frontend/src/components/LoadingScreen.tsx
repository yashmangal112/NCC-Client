"use client"

export default function LoadingScreen() {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "#06050f",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: "24px",
    }}>
      {/* Rings + Logo */}
      <div style={{ position: "relative", width: 140, height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ ...ring, width: 108, height: 108, borderLeftColor: "rgba(120,160,255,0.4)", borderRightColor: "rgba(80,120,255,0.2)", animation: "spin 2s linear infinite" }} />
        <div style={{ ...ring, width: 128, height: 128, borderTopColor: "#3b5fe2", borderRightColor: "rgba(59,95,226,0.2)", animation: "spin 2.8s linear infinite" }} />
        <div style={{ ...ring, width: 148, height: 148, borderBottomColor: "#6b8fff", borderLeftColor: "rgba(107,143,255,0.15)", animation: "spin 4s linear infinite reverse" }} />
        <img
          src="/favicon.png"  // ← put your logo in /public/logo.png
          alt="GoBeyondTickets"
          style={{ width: 82, height: 82, borderRadius: 0, objectFit: "cover", position: "relative", zIndex: 2, animation: "shimmerImg 2.4s ease-in-out infinite" }}
        />
      </div>

      {/* Brand name */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: 5, color: "#fff", textTransform: "uppercase", position: "relative", overflow: "hidden" }}>
          GoBeyondTickets
          <span style={{ position: "absolute", inset: 0, background: "linear-gradient(105deg, transparent 25%, rgba(160,190,255,0.9) 50%, transparent 75%)", WebkitBackgroundClip: "text", backgroundClip: "text", color: "transparent", backgroundSize: "200% 100%", animation: "shimmer 2.4s ease-in-out infinite" }}>
            GoBeyondTickets
          </span>
        </div>
        <p style={{ fontSize: 11, letterSpacing: 2.5, textTransform: "uppercase", color: "rgba(107,143,255,0.55)", animation: "pulse 2.4s ease-in-out infinite" }}>
          Your better experiences awaits
        </p>
      </div>

      {/* Dots */}
      <div style={{ display: "flex", gap: 7 }}>
        {[["#3b5fe2", "0s"], ["#5577ff", "0.2s"], ["#6b8fff", "0.4s"]].map(([color, delay], i) => (
          <div key={i} style={{ width: 5, height: 5, borderRadius: "50%", background: color, animation: `dotPulse 1.4s ease-in-out ${delay} infinite` }} />
        ))}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0% { background-position: -100% 0; } 100% { background-position: 200% 0; } }
        @keyframes shimmerImg { 0%,100% { filter: brightness(0.85) drop-shadow(0 0 8px rgba(80,120,255,0.4)); } 50% { filter: brightness(1.15) drop-shadow(0 0 22px rgba(100,150,255,0.85)); } }
        @keyframes pulse { 0%,100% { opacity:0.4; } 50% { opacity:1; } }
        @keyframes dotPulse { 0%,80%,100% { transform:scale(0.55); opacity:0.25; } 40% { transform:scale(1); opacity:1; } }
      `}</style>
    </div>
  )
}

const ring: React.CSSProperties = {
  position: "absolute", borderRadius: "50%",
  border: "1.5px solid transparent",
}