import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`bg-surface border border-border rounded-[var(--radius)] shadow hover:shadow-md transition-shadow ${className}`}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`px-3.5 py-2.5 border-b border-border flex justify-between items-center ${className}`}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <div className="text-[13px] font-semibold">{children}</div>;
}

export function CardBadge({ children }: { children: ReactNode }) {
  return (
    <div className="text-[11px] font-semibold text-text-secondary">
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-3 px-3.5 ${className}`}>{children}</div>;
}
