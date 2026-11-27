// apps/admin/app/dashboard/_components/Sparkline.tsx
type Props = {
  data: number[];
  stroke?: string;
  className?: string;
};

export default function Sparkline({
  data,
  stroke = '#C9A24A',
  className = 'h-12 w-full',
}: Props) {
  // Not enough data → elegant flat line
  if (data.length < 2) {
    return (
      <svg
        viewBox="0 0 100 30"
        className={className}
        preserveAspectRatio="none"
      >
        <line
          x1="0"
          y1="16"
          x2="100"
          y2="16"
          stroke={stroke}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.35"
        />
      </svg>
    );
  }

  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const step = 100 / (data.length - 1);

  const points = data.map((v, i) => {
    const x = i * step;
    const y = 26 - ((v - min) / range) * 20;
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`)
    .join(' ');

  const areaPath = `${linePath} L100,30 L0,30 Z`;

  return (
    <svg viewBox="0 0 100 30" className={className} preserveAspectRatio="none">
      <defs>
        <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkGrad)" />
      <path
        d={linePath}
        fill="none"
        stroke={stroke}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
