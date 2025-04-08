import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
}

export default function LoadingIndicator({ message = "Loading..." }: LoadingIndicatorProps) {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm mb-6 flex items-center justify-center">
      <Loader2 className="h-6 w-6 animate-spin text-[#E74C3C]" />
      <span className="ml-3">{message}</span>
    </div>
  );
}
