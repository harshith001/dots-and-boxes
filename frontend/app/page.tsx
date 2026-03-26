import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="max-w-sm w-full px-4">
        <h1 className="text-3xl font-semibold text-slate-800 text-center mb-8">
          Dots &amp; Boxes
        </h1>
        <input
          type="text"
          placeholder="Enter your name"
          className="border border-slate-200 rounded-lg px-4 py-2 text-base w-full mb-4"
        />
        <Link
          href="/game"
          className="block text-center bg-slate-800 text-white text-base font-semibold rounded-lg px-6 py-4 w-full hover:bg-slate-700 transition-colors"
        >
          Start Game
        </Link>
      </div>
    </main>
  );
}
