export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAFAF9] dark:bg-[#0C0A1D]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#3730A3] flex items-center justify-center mx-auto animate-pulse">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
          </svg>
        </div>
        <p className="text-sm text-[#78716C] dark:text-[#A1A1AA] font-medium">Loading Kariako Guide...</p>
      </div>
    </div>
  );
}
