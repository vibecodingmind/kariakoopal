export default function RootLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA] dark:bg-[#0D1117]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-[#0B5D3A] flex items-center justify-center mx-auto animate-pulse">
          <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="12" cy="12" r="10" />
            <path d="M16.24 7.76l-2.12 6.36-6.36 2.12 2.12-6.36 6.36-2.12z" />
          </svg>
        </div>
        <p className="text-sm text-[#6C757D] dark:text-[#8B949E] font-medium">Loading Kariako Guide...</p>
      </div>
    </div>
  );
}
