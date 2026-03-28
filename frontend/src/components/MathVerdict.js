'use client';

export default function MathVerdict({ statement, isTrue }) {
  const color = isTrue ? '#68dbae' : '#ff4444';
  const label = isTrue ? 'TRUE' : 'FALSE';

  return (
    <div
      className="rounded-[8px] border p-[32px] flex flex-col items-center gap-[20px] text-center"
      style={{ borderColor: color, background: `${color}10` }}
    >
      <span
        className="font-mono text-[10px] tracking-[2px] uppercase"
        style={{ color }}
      >
        Mathematical Statement
      </span>

      <p className="font-mono text-[18px] text-white break-all">{statement}</p>

      <div
        className="font-bold text-[48px] tracking-[-1px] leading-none"
        style={{ color }}
      >
        {label}
      </div>

      <p className="text-[13px] text-[#8c909f]">
        Verified by arithmetic evaluation — irrefutable proof.
      </p>
    </div>
  );
}
