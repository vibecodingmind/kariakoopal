import Image from 'next/image';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A1D]">
      <div className="text-center space-y-4">
        <div className="mx-auto animate-pulse">
          <Image
            src="/logo-header.png"
            alt="Chimbo Direct"
            width={160}
            height={55}
            className="h-12 w-auto mx-auto"
            priority
          />
        </div>
        <p className="text-sm text-[#78716C] dark:text-[#A1A1AA] font-medium">Loading Chimbo Direct...</p>
      </div>
    </div>
  );
}
