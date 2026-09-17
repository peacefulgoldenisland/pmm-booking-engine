import * as React from "react";

interface AdminTableProps {
  headers: string[];
  children: React.ReactNode;
  isLoading?: boolean;
  skeletonCount?: number;
}

export function AdminTable({ headers, children, isLoading = false, skeletonCount = 5 }: AdminTableProps) {
  return (
    <div className="w-full overflow-auto rounded-sm border border-gray-200 bg-white shadow-sm admin-scrollbar font-sans">
      <table className="w-full text-left text-sm text-gray-700">
        <thead className="sticky top-0 z-20 border-b border-gray-200 bg-[var(--color-surface-50)]">
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="whitespace-nowrap px-6 py-4 font-bold uppercase tracking-widest text-gray-400 text-[10px]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {isLoading ? (
            Array.from({ length: skeletonCount }).map((_, rowIndex) => (
              <tr key={rowIndex} className="animate-pulse">
                {headers.map((_, colIndex) => (
                  <td key={colIndex} className="px-6 py-4">
                    <div className="h-4 w-3/4 rounded bg-gray-100"></div>
                  </td>
                ))}
              </tr>
            ))
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
