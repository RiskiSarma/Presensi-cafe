import { HTMLAttributes } from "react";

export default function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-fade-in-up rounded-card border border-border/70 bg-surface p-5 shadow-warm transition-all duration-200 hover:shadow-warm-lg ${className}`}
      {...props}
    />
  );
}
