'use client';

interface Props {
  lunarDay: number;
  size?: number;
}

export default function MoonPhase({ lunarDay, size = 64 }: Props) {
  const r = 38;
  const cx = 50;
  const cy = 50;

  let maskPath = '';
  let fillMask = true;

  if (lunarDay === 1) {
    fillMask = false;
  } else if (lunarDay <= 8) {
    const rx = Math.max(2, r - (lunarDay - 1) * (r / 7));
    maskPath = `M ${cx + r * Math.cos(-Math.PI / 2)} ${cy + r * Math.sin(-Math.PI / 2)}
      A ${r} ${r} 0 0 1 ${cx + r * Math.cos(Math.PI / 2)} ${cy + r * Math.sin(Math.PI / 2)}
      A ${rx} ${r} 0 0 0 ${cx + r * Math.cos(-Math.PI / 2)} ${cy + r * Math.sin(-Math.PI / 2)} Z`;
  } else if (lunarDay <= 15) {
    const progress = (lunarDay - 8) / 7;
    const rx = r * (1 - progress * 2);
    if (rx > 0) {
      maskPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r} Z`;
    } else {
      maskPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${Math.abs(rx)} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    }
  } else if (lunarDay <= 22) {
    const progress = (lunarDay - 15) / 7;
    const rx = r * (progress * 2 - 1);
    if (rx > 0) {
      maskPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${rx} ${r} 0 0 0 ${cx} ${cy - r} Z`;
    } else {
      maskPath = `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${Math.abs(rx)} ${r} 0 0 1 ${cx} ${cy - r} Z`;
    }
  } else {
    const rx = Math.max(2, r - (30 - lunarDay) * (r / 7));
    maskPath = `M ${cx - r * Math.cos(-Math.PI / 2)} ${cy + r * Math.sin(-Math.PI / 2)}
      A ${r} ${r} 0 0 0 ${cx - r * Math.cos(Math.PI / 2)} ${cy + r * Math.sin(Math.PI / 2)}
      A ${rx} ${r} 0 0 1 ${cx - r * Math.cos(-Math.PI / 2)} ${cy + r * Math.sin(-Math.PI / 2)} Z`;
  }

  const id = `moon-${lunarDay}`;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{ filter: 'drop-shadow(0 0 30px rgba(255,230,180,0.2))' }}>
      <defs>
        <radialGradient id={`${id}-grad`} cx="35%" cy="40%">
          <stop offset="0%" stopColor="#fff8e1" />
          <stop offset="55%" stopColor="#f0d896" />
          <stop offset="100%" stopColor="#c9a96e" />
        </radialGradient>
        {fillMask && maskPath && (
          <mask id={`${id}-mask`}>
            <rect width="100" height="100" fill="black" />
            <path d={maskPath} fill="white" />
          </mask>
        )}
      </defs>
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="rgba(201,169,110,0.22)" strokeWidth="0.5" strokeDasharray="0.8 1.8" />
      {fillMask && maskPath ? (
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-grad)`} mask={`url(#${id}-mask)`} />
      ) : lunarDay >= 13 && lunarDay <= 17 ? (
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-grad)`} />
      ) : null}
    </svg>
  );
}
