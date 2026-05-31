import Image from 'next/image';

export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A1D]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl overflow-hidden mx-auto animate-pulse ring-2 ring-[#065F46]/10">
          <Image
            src="/logo-mark.png"
            alt="Chimbo Direct"
            width={64}
            height={64}
            className="w-full h-full object-cover"
            priority
          />
        </div>
        <p className="text-sm text-[#78716C] dark:text-[#A1A1AA] font-medium">Loading Chimbo Direct...</p>
      </div>
    </div>
  );
}
