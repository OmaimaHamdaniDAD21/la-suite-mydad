interface ProgressProps {
  value: number;
  color?: string;
  className?: string;
}

export function Progress({
  value,
  color = "var(--primary)",
  className = "",
}: ProgressProps) {
  return (
    <div className={`h-1 bg-border-light rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${Math.min(100, Math.max(0, value))}%`, background: color }}
      />
    </div>
  );
}
