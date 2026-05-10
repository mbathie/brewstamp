"use client";

interface SparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  strokeWidth?: number;
  className?: string;
}

export function Sparkline({
  data,
  color = "currentColor",
  width = 80,
  height = 24,
  strokeWidth = 1.5,
  className,
}: SparklineProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const padY = strokeWidth;

  const points = data.map((v, i) => {
    const x = i * stepX;
    const y = height - padY - ((v - min) / range) * (height - padY * 2);
    return `${x},${y}`;
  });

  // Build an area fill underneath the line.
  const areaPath = `M ${points[0]} L ${points.slice(1).join(" L ")} L ${width},${height} L 0,${height} Z`;
  const linePath = `M ${points.join(" L ")}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      aria-hidden
    >
      <path d={areaPath} fill={color} fillOpacity={0.12} />
      <path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
