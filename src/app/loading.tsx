export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A1D]">
      <div className="text-center space-y-4">
        <div className="mx-auto animate-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo.svg"
            alt="Chimbo Direct"
            className="h-12 w-auto mx-auto"
          />
        </div>
        <p className="text-sm text-[#78716C] dark:text-[#A1A1AA] font-medium">Loading Chimbo Direct...</p>
      </div>
    </div>
  );
}
