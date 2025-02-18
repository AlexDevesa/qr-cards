import { ReactNode } from "react";

interface DarkContainerProps {
  children: ReactNode;
}

export default function DarkContainer({ children }: DarkContainerProps) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900 text-gray-200">
      <div className="container">{children}</div>
    </div>
  );
}
