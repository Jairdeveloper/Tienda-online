interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export default function TableSkeleton({
  rows = 5,
  columns = 4,
}: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="flex gap-4 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <div
              key={i}
              className="h-4 bg-gray-200 rounded flex-1"
              style={{ maxWidth: i === 0 ? "30%" : undefined }}
            />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 px-4 py-3 border-b border-gray-100"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <div
              key={colIdx}
              className="h-4 bg-gray-200 rounded flex-1"
              style={{
                maxWidth:
                  colIdx === columns - 1
                    ? "15%"
                    : colIdx === 0
                      ? "30%"
                      : undefined,
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
