import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FiZap, FiRefreshCw, FiShield, FiGithub, FiCheck } from "react-icons/fi";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const [visibleFeatures, setVisibleFeatures] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
    // 1. Handle Scroll for other effects (if any)
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    
    // 2. Initialize Intersection Observer for Animations
    observerRef.current = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = entry.target.dataset.index;
          if (index) {
            setVisibleFeatures(prev => {
              const newSet = new Set(prev);
              newSet.add(index);
              return newSet;
            });
            // Stop observing once visible to save resources
            observerRef.current.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.1 });

    // 3. Observe elements
    // We use a small timeout to ensure DOM is ready if needed, or just select immediately
    const features = document.querySelectorAll('.feature-card-animate');
    features.forEach(el => observerRef.current.observe(el));

    // Cleanup
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0f0f0f] relative overflow-hidden selection:bg-[var(--primary-green)] selection:text-black font-sans">
      {/* Animated Background Mesh */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-[var(--primary-green)] rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-600 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative z-10">
        <Navbar />

        {/* Hero Section */}
        <main className="px-6 pt-32 pb-20 md:pt-48 md:pb-32 max-w-7xl mx-auto flex flex-col items-center text-center">
          
          {/* Badge */}
          <div className="animate-fade-in-up inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-xs font-mono text-[var(--primary-green)] mb-8 hover:scale-105 transition-transform cursor-default">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span>SpliBiz v2.0 Live</span>
          </div>

          <h1 className="animate-fade-in-up delay-100 text-6xl md:text-8xl font-bold tracking-tight text-white mb-8 max-w-5xl leading-[1.1] drop-shadow-2xl">
            Split bills, <br />
            <span className="text-gradient-premium">not friendships.</span>
          </h1>

          <p className="animate-fade-in-up delay-200 text-gray-400 text-lg md:text-xl max-w-2xl mb-12 leading-relaxed opacity-90">
            The most seamless way to track shared expenses for trips, flats, and groups. 
            Real-time sync, smart settlements, and zero awkward conversations.
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row gap-6 mb-24 w-full sm:w-auto">
            <Link
              to="/register"
              className="group relative px-8 py-4 bg-[var(--primary-green)] text-black font-bold text-lg rounded-xl overflow-hidden shadow-[0_0_20px_rgba(62,207,142,0.4)] transition-all hover:shadow-[0_0_40px_rgba(62,207,142,0.6)] hover:scale-105"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              {/* Shimmer effect */}
              <div className="absolute inset-0 w-full h-full animate-shimmer opacity-0 group-hover:opacity-100 transition-opacity"></div>
              
              <span className="relative flex items-center gap-2">
                Get Started Free 
                <svg className="w-5 h-5 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6"></path></svg>
              </span>
            </Link>

            <a
              href="#how-it-works"
              className="px-8 py-4 glass-panel text-white font-medium text-lg rounded-xl hover:bg-white/10 transition-all border border-white/5 hover:border-white/20"
            >
              How it works
            </a>
          </div>

          {/* Stats / Social Proof */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-16 border-t border-white/10 pt-12 w-full max-w-4xl opacity-80">
            {[
              { label: "Active Users", value: "10K+" },
              { label: "Expenses Tracked", value: "$5M+" },
              { label: "Groups Created", value: "2.5K+" },
              { label: "App Rating", value: "4.9/5" },
            ].map((stat, i) => (
              <div key={i} className="animate-fade-in-up delay-400 flex flex-col">
                <span className="text-3xl font-bold text-white mb-1">{stat.value}</span>
                <span className="text-sm text-gray-500 uppercase tracking-wider">{stat.label}</span>
              </div>
            ))}
          </div>
        </main>

        {/* Features Grid */}
        <section id="features" className="py-20 px-6 relative">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">Everything you need</h2>
              <p className="text-gray-400">Powerful features to manage your shared finances.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  title: "Smart Splitting",
                  desc: "Split by percentage, shares, or exact amounts. Our algorithm handles the math instantly.",
                  icon: <FiZap className="w-8 h-8 text-white" />,
                  color: "from-yellow-400 to-orange-500"
                },
                {
                  title: "Real-time Sync",
                  desc: "Changes update instantly across all devices. No more 'did you add that?' texts.",
                  icon: <FiRefreshCw className="w-8 h-8 text-white" />,
                  color: "from-blue-400 to-cyan-500"
                },
                {
                  title: "Instant Verification",
                  desc: "Join groups in seconds via QR codes or magic links. No signup friction.",
                  icon: <FiShield className="w-8 h-8 text-white" />,
                  color: "from-green-400 to-emerald-500"
                }
              ].map((f, i) => (
                <div 
                  key={i}
                  data-index={i}
                  // Removed the loop-causing ref!
                  className={`feature-card-animate glass-panel p-8 rounded-2xl transition-all duration-700 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-[var(--primary-green)]/10 ${
                    visibleFeatures.has(String(i)) 
                      ? "opacity-100 translate-y-0" 
                      : "opacity-0 translate-y-20"
                  }`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    {f.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-4">{f.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Footer / Credits */}
        <footer className="py-12 border-t border-white/10 bg-black/40 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[var(--primary-green)] rounded-lg flex items-center justify-center font-bold text-black">S</div>
              <span className="text-xl font-bold text-white tracking-tight">SpliBiz</span>
            </div>
            
            <div className="text-center md:text-right">
              <p className="text-gray-500 text-sm mb-2">
                Designed & Developed with ❤️ by 
              </p>
              <a 
                href="https://github.com/dhruvsuthar" 
                target="_blank" 
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel text-white font-medium hover:bg-white/10 transition-colors bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] hover:animate-pulse"
              >
                <FiGithub className="w-4 h-4" />
                <span>Dhruv Suthar</span>
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
