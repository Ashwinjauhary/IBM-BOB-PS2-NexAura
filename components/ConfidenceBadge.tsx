"use client";

interface ConfidenceBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showBar?: boolean;
}

export default function ConfidenceBadge({
  score,
  size = "md",
  showBar = true,
}: ConfidenceBadgeProps) {
  const level =
    score >= 70 ? "high" : score >= 40 ? "medium" : "low";

  const colors = {
    high: { fill: "var(--accent-emerald)", bg: "var(--accent-emerald-glow)", text: "var(--accent-emerald)" },
    medium: { fill: "var(--accent-amber)", bg: "var(--accent-amber-glow)", text: "var(--accent-amber)" },
    low: { fill: "var(--accent-red)", bg: "var(--accent-red-glow)", text: "var(--accent-red)" },
  };

  const c = colors[level];

  const textSizes = { sm: "0.75rem", md: "0.9rem", lg: "1.1rem" };
  const dotSizes = { sm: 6, md: 8, lg: 10 };
  const barHeights = { sm: 4, md: 6, lg: 8 };

  // Dot visualization (5 dots)
  const filledDots = Math.round(score / 20);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        {/* Dots */}
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              style={{
                width: dotSizes[size],
                height: dotSizes[size],
                borderRadius: "50%",
                background:
                  i < filledDots ? c.fill : "var(--border-default)",
                transition: "background 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Percentage */}
        <span
          style={{
            fontSize: textSizes[size],
            fontWeight: 700,
            color: c.text,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {score}%
        </span>
      </div>

      {/* Bar */}
      {showBar && (
        <div
          style={{
            height: barHeights[size],
            background: "var(--bg-secondary)",
            borderRadius: "var(--radius-full)",
            overflow: "hidden",
          }}
        >
          <div
            className={`confidence-fill confidence-${level}`}
            style={{
              width: `${score}%`,
              height: "100%",
            }}
          />
        </div>
      )}
    </div>
  );
}
