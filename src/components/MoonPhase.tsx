'use client';

interface Props {
  lunarDay: number;
  size?: number;
}

export default function MoonPhase({ lunarDay, size = 64 }: Props) {
  const r = 38;
  const cx = 50;
  const cy = 50;
  const day = Math.max(1, Math.min(30, lunarDay));
  const id = `moon-${day}`;

  const phase = (day - 1) / 29;
  const isNewMoon = phase < 0.03 || phase > 0.97;
  const isFullMoon = Math.abs(phase - 0.5) < 0.03;
  const illuminatedPath = getIlluminatedPath(phase, r, cx, cy);

  const glowStrength = Math.sin(phase * Math.PI);

  return (
    <svg width={size} height={size} viewBox="0 0 100 100"
      style={{ filter: `drop-shadow(0 0 ${6 + glowStrength * 18}px rgba(255,230,180,${0.08 + glowStrength * 0.22}))` }}>
      <defs>
        <radialGradient id={`${id}-lit`} cx="38%" cy="36%">
          <stop offset="0%" stopColor="#fffde8" />
          <stop offset="30%" stopColor="#f7e8a8" />
          <stop offset="65%" stopColor="#d9b868" />
          <stop offset="90%" stopColor="#b89448" />
          <stop offset="100%" stopColor="#9a7a3a" />
        </radialGradient>

        <radialGradient id={`${id}-dark`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="#2a2d38" />
          <stop offset="100%" stopColor="#14161e" />
        </radialGradient>

        <radialGradient id={`${id}-earthshine`} cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(80,90,120,0.12)" />
          <stop offset="100%" stopColor="rgba(40,45,60,0.05)" />
        </radialGradient>

        <clipPath id={`${id}-circle`}>
          <circle cx={cx} cy={cy} r={r} />
        </clipPath>

        {!isNewMoon && !isFullMoon && illuminatedPath && (
          <clipPath id={`${id}-lit-clip`}>
            <path d={illuminatedPath} />
          </clipPath>
        )}
        {isFullMoon && (
          <clipPath id={`${id}-lit-clip`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
        )}
      </defs>

      {/* Orbit ring */}
      <circle cx={cx} cy={cy} r={r + 2} fill="none"
        stroke="rgba(201,169,110,0.15)" strokeWidth="0.4" strokeDasharray="1.2 2.4" />

      {/* Dark moon base */}
      <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-dark)`} />

      {/* Earthshine on dark side */}
      {!isNewMoon && (
        <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-earthshine)`} />
      )}

      {/* Illuminated surface */}
      {!isNewMoon && (
        <g clipPath={`url(#${id}-circle)`}>
          {isFullMoon ? (
            <circle cx={cx} cy={cy} r={r} fill={`url(#${id}-lit)`} />
          ) : illuminatedPath ? (
            <path d={illuminatedPath} fill={`url(#${id}-lit)`} />
          ) : null}
        </g>
      )}

      {/* Craters - only on lit portion */}
      {!isNewMoon && (isFullMoon || illuminatedPath) && (
        <g clipPath={`url(#${id}-lit-clip)`}>
          <circle cx={40} cy={36} r={5} fill="rgba(160,130,60,0.12)" />
          <circle cx={42} cy={37} r={3.5} fill="rgba(140,110,50,0.08)" />
          <circle cx={56} cy={50} r={7} fill="rgba(160,130,60,0.10)" />
          <circle cx={57} cy={51} r={5} fill="rgba(140,110,50,0.06)" />
          <circle cx={36} cy={58} r={4} fill="rgba(160,130,60,0.09)" />
          <circle cx={60} cy={34} r={3} fill="rgba(160,130,60,0.07)" />
          <circle cx={46} cy={66} r={4.5} fill="rgba(160,130,60,0.08)" />
          <circle cx={52} cy={42} r={2.5} fill="rgba(160,130,60,0.06)" />
          <circle cx={35} cy={46} r={3.5} fill="rgba(160,130,60,0.07)" />
        </g>
      )}

      {/* Terminator edge highlight */}
      {!isNewMoon && !isFullMoon && illuminatedPath && (
        <g clipPath={`url(#${id}-circle)`}>
          <path d={illuminatedPath} fill="none"
            stroke="rgba(255,245,200,0.15)" strokeWidth="1.2" />
        </g>
      )}

      {/* Rim light */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill="none"
        stroke={isNewMoon ? 'rgba(201,169,110,0.1)' : `rgba(255,240,200,${0.06 + glowStrength * 0.08})`}
        strokeWidth="0.6" />
    </svg>
  );
}

function getIlluminatedPath(phase: number, r: number, cx: number, cy: number): string {
  if (phase < 0.03 || phase > 0.97) return '';
  if (Math.abs(phase - 0.5) < 0.03) return '';

  const angle = phase * 2 * Math.PI;

  if (phase < 0.5) {
    const cosA = Math.cos(angle);
    const tRx = Math.max(1, r * Math.abs(cosA));
    const tSweep = cosA > 0 ? 1 : 0;
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${tRx} ${r} 0 0 ${tSweep} ${cx} ${cy - r} Z`;
  } else {
    const cosA = Math.cos((phase - 0.5) * 2 * Math.PI);
    const tRx = Math.max(1, r * Math.abs(cosA));
    const tSweep = cosA > 0 ? 0 : 1;
    return `M ${cx} ${cy - r} A ${r} ${r} 0 0 0 ${cx} ${cy + r} A ${tRx} ${r} 0 0 ${tSweep} ${cx} ${cy - r} Z`;
  }
}
