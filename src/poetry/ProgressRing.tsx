/**
 * Couplet progress for one poem: the faint arc is couplets begun, the solid arc couplets mastered.
 * Nothing is drawn for a poem that has not been started.
 */
export function ProgressRing({ started, mastered, total, size = 30, stroke = 3.5 }: { started: number; mastered: number; total: number; size?: number; stroke?: number }) {
  if (!total || !started) return null;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const arc = (v: number) => ({ strokeDasharray: c, strokeDashoffset: c * (1 - Math.max(0, Math.min(1, v / total))) });
  const done = mastered >= total;
  return (
    <svg className={`poem-ring ${done ? "is-done" : ""}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`已开始 ${started}/${total} 联，已掌握 ${mastered} 联`}>
      <g transform={`rotate(-90 ${size / 2} ${size / 2})`} fill="none" strokeWidth={stroke} strokeLinecap="round">
        <circle className="poem-ring-track" cx={size / 2} cy={size / 2} r={r} />
        <circle className="poem-ring-started" cx={size / 2} cy={size / 2} r={r} style={arc(started)} />
        {mastered > 0 && <circle className="poem-ring-mastered" cx={size / 2} cy={size / 2} r={r} style={arc(mastered)} />}
      </g>
    </svg>
  );
}
