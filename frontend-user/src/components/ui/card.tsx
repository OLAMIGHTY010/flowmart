import * as React from "react";
import { cn } from "@/lib/utils";

interface CustomCardProps extends React.ComponentProps<"div"> {
  title?: string;
  subtitle?: string;
  status?: "approved" | "pending" | "upload" | string;
}

function Card({ className, title, subtitle, status, children, ...props }: CustomCardProps) {
  const isRowLayout = title || subtitle || status;

  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-xl bg-card border border-border shadow-sm",
        isRowLayout ? "flex items-center justify-between p-4 gap-4" : "",
        className
      )}
      {...props}
    >
      {isRowLayout ? (
        <>
          {/* Left side: Text details */}
          <div className="flex flex-col gap-0.5">
            {title && <h4 className="text-sm font-semibold text-foreground">{title}</h4>}
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
          </div>

          {/* Right side: Status indicator / Action slot */}
          <div className="flex items-center gap-2">
            {status && (
              <span className={cn(
                "text-xs font-medium px-2.5 py-1 rounded-full uppercase tracking-wider text-[10px]",
                status === "approved" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                status === "pending" && " text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
                status === "upload" && "bg-blue-100  text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              )}>
                {status}
              </span>
            )}
            {children}
          </div>
        </>
      ) : (
        children
      )}
    </div>
  );
}

function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  );
}

function CardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("text-lg font-semibold leading-none tracking-tight", className)}
      {...props}
    />
  );
}

function CardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
}

function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn("flex items-center p-6 pt-0", className)}
      {...props}
    />
  );
}

function CardAction({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("ml-auto", className)} {...props} />;
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
};