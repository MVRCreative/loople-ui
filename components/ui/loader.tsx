import { cn } from "@/lib/utils";

/**
 * Loader - A simple circular spinner using theme-aware colors
 *
 * Purpose: Minimal loading indicator for async states
 * Variants: size (sm, default, lg)
 * Accessibility: Uses aria-label for screen readers
 *
 * Usage:
 * ```tsx
 * <Loader />            // default size
 * <Loader size="sm" />  // small
 * <Loader size="lg" />  // large
 * ```
 */

interface LoaderProps {
  size?: "sm" | "default" | "lg";
  className?: string;
}

export function Loader({ size = "default", className }: LoaderProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    default: "h-8 w-8 border-2",
    lg: "h-12 w-12 border-[3px]",
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-primary border-t-transparent",
        sizeClasses[size],
        className
      )}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
}
