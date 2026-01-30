import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
  variant?: "default" | "primary" | "secondary";
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  className,
  variant = "default",
}: StatCardProps) {
  return (
    <div
      className={cn(
        "stat-card animate-fade-in",
        variant === "primary" && "gradient-loft text-primary-foreground",
        variant === "secondary" && "gradient-loft-green text-secondary-foreground",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p
            className={cn(
              "stat-label",
              variant !== "default" && "text-current/70"
            )}
          >
            {title}
          </p>
          <p className={cn("stat-value", variant !== "default" && "text-current")}>
            {value}
          </p>
          {trend && (
            <div
              className={cn(
                "flex items-center gap-1 text-sm font-medium",
                trend.isPositive ? "text-success" : "text-destructive",
                variant !== "default" && "text-current/80"
              )}
            >
              {trend.isPositive ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-muted-foreground text-xs">vs mês anterior</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            "p-3 rounded-xl",
            variant === "default" && "bg-primary/10 text-primary",
            variant !== "default" && "bg-white/20 text-current"
          )}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}