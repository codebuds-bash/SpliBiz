import Navbar from "../components/Navbar";

export default function Home() {
  return (
    <div className="min-h-screen bg-[var(--bg-body)]">
      <Navbar />

      <main className="px-6 py-24 max-w-7xl mx-auto flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#232323] border border-[var(--border-color)] text-xs font-mono text-[var(--text-muted)] mb-8">
          <span className="text-[var(--primary-green)]">NEW</span>
          <span>v2.0 is now live</span>
        </div>
      
        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-8 max-w-4xl leading-[1.1]">
          Split expenses <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--primary-green)] to-[#249c6e]">
            without the headache
          </span>
        </h1>

        <p className="text-[var(--text-muted)] text-lg md:text-xl max-w-2xl mb-12 leading-relaxed">
          SpliBiz helps flats, trips, and friends manage shared expenses effortlessly. 
          Real-time tracking, secure settlements, and zero confusion.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-24">
          <a
            href="/register"
            className="btn-primary py-3 px-6 text-base"
          >
            Sign Up
          </a>

          <a
            href="#features"
            className="btn-secondary py-3 px-6 text-base"
          >
            Documentation
          </a>
        </div>

        {/* Feature cards */}
        <section
          id="features"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full"
        >
          {[
            {
              title: "Expense Groups",
              desc: "Create dedicated workspaces for your flatmates or trips.",
              icon: "M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            },
            {
              title: "Quick Join",
              desc: "Onboard members instantly via QR code or magic links.", 
              icon: "M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
            },
            {
              title: "Smart Settlements", 
              desc: "Our algorithm calculates the most efficient way to pay back.",
              icon: "M9 7h6m0 36v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            },
            {
              title: "Real-time Sync",
              desc: "Powered by Supabase for instant updates across devices.",
              icon: "M13 10V3L4 14h7v7l9-11h-7z"
            },
          ].map((f, i) => (
            <div
              key={i}
              className="card group hover:border-[var(--primary-green)] transition-all duration-300 text-left"
            >
              <div className="w-10 h-10 mb-4 text-[var(--text-muted)] group-hover:text-[var(--primary-green)] transition-colors">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <h3 className="text-white font-medium text-lg mb-2">{f.title}</h3>
              <p className="text-[var(--text-muted)] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
