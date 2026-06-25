import Link from 'next/link';

export function Navbar() {
  return (
    <nav className="bg-slate-950/90 backdrop-blur border-b border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center gap-3">
            <span className="text-3xl">📚</span>
            <div>
              <p className="text-lg font-semibold text-white">Study Agent</p>
              <p className="text-xs text-slate-400">Smart study chat for learners</p>
            </div>
          </Link>
          <div className="flex gap-8">
            <Link
              href="/"
              className="text-slate-300 hover:text-white transition font-medium"
            >
              Chat
            </Link>
            <Link
              href="/dashboard"
              className="text-slate-300 hover:text-white transition font-medium"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
