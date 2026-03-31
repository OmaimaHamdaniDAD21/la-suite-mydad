import { ReactNode } from "react";

type BadgeColor = "green" | "amber" | "red" | "gray" | "blue" | "purple";

interface BadgeProps {
  color: BadgeColor;
  children: ReactNode;
  className?: string;
}

const colorMap: Record<BadgeColor, string> = {
  green: "bg-green-bg text-green",
  amber: "bg-amber-bg text-amber",
  red: "bg-red-bg text-red",
  gray: "bg-bg text-text-muted",
  blue: "bg-primary-bg text-primary",
  purple: "bg-purple-bg text-purple",
};

export function Badge({ color, children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded ${colorMap[color]} ${className}`}
    >
      {children}
    </span>
  );
}

export function Tag({
  color,
  children,
}: {
  color: BadgeColor;
  children: ReactNode;
}) {
  return (
    <span
      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase tracking-wide ${colorMap[color]}`}
    >
      {children}
    </span>
  );
}
