interface SkeletonProps {
  variant?: "text" | "card" | "table-row" | "image" | "circle";
  width?: string;
  height?: string;
  className?: string;
}

export default function Skeleton({
  variant = "text",
  width,
  height,
  className = "",
}: SkeletonProps) {
  const base = "animate-pulse bg-gray-200 rounded";

  const variants: Record<string, string> = {
    text: "h-4 w-full",
    card: "h-48 w-full rounded-xl",
    "table-row": "h-10 w-full",
    image: "aspect-[4/3] w-full rounded-xl",
    circle: "h-12 w-12 rounded-full",
  };

  return (
    <div
      className={`${base} ${variants[variant]} ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}
