import { ButtonHTMLAttributes, ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "ghost";
  size?: "default" | "sm";
  children: ReactNode;
}

export function Button({
  variant = "default",
  size = "default",
  children,
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center gap-1 rounded-[var(--radius-sm)] font-medium cursor-pointer transition-all font-[inherit] leading-[1.4]";

  const variants = {
    default:
      "border border-border bg-surface text-text hover:bg-bg hover:border-text-muted",
    primary:
      "bg-primary text-white border border-primary hover:bg-primary-hover hover:border-primary-hover",
    ghost:
      "border-none text-text-secondary hover:bg-bg hover:text-text",
  };

  const sizes = {
    default: "px-3 py-1.5 text-xs",
    sm: "px-2 py-[3px] text-[11px]",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
