import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  tooltip: string;
  className?: string;
  variant?: "default" | "primary" | "secondary";
}

export function MetricCard({
  title,
  value,
  icon,
  tooltip,
  className,
  variant = "default",
}: MetricCardProps) {
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
          <div className="flex items-center gap-1.5">
            <p
              className={cn(
                "stat-label",
                variant !== "default" && "text-current/70"
              )}
            >
              {title}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info 
                    className={cn(
                      "w-3.5 h-3.5 cursor-help",
                      variant === "default" 
                        ? "text-muted-foreground hover:text-foreground" 
                        : "text-current/50 hover:text-current/80"
                    )} 
                  />
                </TooltipTrigger>
                <TooltipContent 
                  className="max-w-[280px] text-xs leading-relaxed"
                  side="top"
                >
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <p className={cn("stat-value", variant !== "default" && "text-current")}>
            {value}
          </p>
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
