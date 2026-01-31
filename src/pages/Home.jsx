import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { FiZap, FiRefreshCw, FiShield, FiUsers, FiDollarSign, FiActivity } from "react-icons/fi";
import { FaAndroid, FaApple } from "react-icons/fa";

export default function Home() {
  const [visibleFeatures, setVisibleFeatures] = useState(new Set());
  const observerRef = useRef(null);

  useEffect(() => {
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
            observerRef.current.unobserve(entry.target);
          }
        }
      });
    }, { threshold: 0.1 });

    const elements = document.querySelectorAll('.animate-on-scroll');
    elements.forEach(el => observerRef.current.observe(el));

    return () => {
      if (observerRef.current) observerRef.current.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] relative overflow-hidden font-sans text-gray-300">
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #3ecf8e 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        </div>

        <div className="relative z-10 animate-fade-in-up">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--primary-green)]/30 bg-[var(--primary-green)]/10 text-xs font-mono text-[var(--primary-green)] mb-6">
                <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[var(--primary-green)]"></span>
                </span>
                <span>The Modern Way to Share Costs</span>
            </div>

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white mb-6 leading-tight">
                Master your <br />
                <span className="text-[var(--primary-green)]">Shared Expenses.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                SpliBiz replaces awkward IOUs with a powerful, real-time ledger. 
                Perfect for roommates, trips, and collaborative projects.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 w-full sm:w-auto">
                <Link
                to="/register"
                className="btn-primary px-8 py-3 text-lg"
                >
                Start for Free
                </Link>
                <a
                href="#how-it-works"
                className="px-8 py-3 rounded-lg border border-[var(--border-color)] text-white hover:bg-white/5 transition-colors font-medium text-lg"
                >
                Learn More
                </a>
            </div>

            <div className="mt-12 flex flex-col items-center gap-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
              <p className="text-sm text-gray-500 font-medium uppercase tracking-widest">Available on Mobile</p>
              <div className="flex flex-wrap justify-center gap-4">
                <a
                  href="https://expo.dev/artifacts/eas/m36hXozx982mPfmW4z4guB.apk"
                  className="flex items-center gap-3 px-6 py-3 rounded-xl bg-[#3DDC84]/10 border border-[#3DDC84]/20 text-[#3DDC84] hover:bg-[#3DDC84]/20 transition-all hover:scale-105 active:scale-95 group"
                >
                  <FaAndroid className="text-2xl group-hover:drop-shadow-[0_0_8px_rgba(61,220,132,0.5)] transition-all" />
                  <div className="text-left">
                    <div className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Download APK</div>
                    <div className="font-bold text-lg leading-none">Android</div>
                  </div>
                </a>

                <div className="flex items-center gap-3 px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-gray-500 cursor-not-allowed">
                  <FaApple className="text-2xl" />
                  <div className="text-left">
                    <div className="text-[10px] opacity-80 uppercase tracking-wider font-bold">Coming Soon</div>
                    <div className="font-bold text-lg leading-none">iOS</div>
                  </div>
                </div>
              </div>
            </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-white/5 bg-white/5">
        <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { label: "Active Groups", value: "2,000+" },
              { label: "Expenses Logged", value: "$10M+" },
              { label: "Simplified Debts", value: "ZERO" },
              { label: "Uptime", value: "99.9%" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-[var(--primary-green)] uppercase tracking-widest">{stat.label}</div>
              </div>
            ))}
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 relative bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Why Choose SpliBiz?</h2>
            <p className="text-gray-400">
                We've stripped away the clutter to focus on what matters: 
                <span className="text-white"> accuracy, speed, and transparency.</span>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                title: "Precision Splitting",
                desc: "Handle complex splits with ease. Percentages, shares, or exact amounts—we calculate it all instantly.",
                icon: <FiZap className="w-6 h-6" />
              },
              {
                title: "Real-time Ledger",
                desc: "Every expense is recorded and synced immediately across all group members' devices.",
                icon: <FiActivity className="w-6 h-6" />
              },
              {
                title: "Smart Settlements",
                desc: "Our algorithm simplifies debts to minimize the number of transactions needed to settle up.",
                icon: <FiDollarSign className="w-6 h-6" />
              },
              {
                title: "Group Management",
                desc: "Create groups for any occasion—apartment bills, vacation trips, or weekend dinners.",
                icon: <FiUsers className="w-6 h-6" />
              },
              {
                title: "Instant Sync",
                desc: "Secure, reliable data synchronization powered by Supabase. Never lose track of a bill.",
                icon: <FiRefreshCw className="w-6 h-6" />
              },
              {
                title: "Secure & Private",
                desc: "Your financial data is yours. We prioritize security and privacy in every transaction.",
                icon: <FiShield className="w-6 h-6" />
              }
            ].map((f, i) => (
              <div 
                key={i}
                data-index={i}
                className={`animate-on-scroll glass-panel p-6 rounded-xl border border-[var(--border-color)] hover:border-[var(--primary-green)] transition-all duration-500 group ${
                  visibleFeatures.has(String(i)) ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                }`}
                style={{ transitionDelay: `${i * 50}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-[var(--primary-green)]/10 flex items-center justify-center text-[var(--primary-green)] mb-6 group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-3">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how-it-works" className="py-24 px-6 border-t border-white/5">
         <div className="max-w-5xl mx-auto">
             <h2 className="text-3xl md:text-4xl font-bold text-white mb-12 text-center">How it works</h2>
             
             <div className="space-y-12">
                 {[
                     { step: "01", title: "Create a Group", desc: "Start by creating a group for your trip, house, or project and invite your friends." },
                     { step: "02", title: "Add Expenses", desc: "Whenever someone pays for something, log it in the app. Takes less than 10 seconds." },
                     { step: "03", title: "Settle Up", desc: "At the end of the month or trip, SpliBiz tells you exactly who owes whom. Pay up and relax." }
                 ].map((item, i) => (
                     <div key={i} className="flex flex-col md:flex-row gap-6 md:items-center group">
                         <div className="text-5xl font-black text-[#1a1a1a] group-hover:text-[var(--primary-green)]/20 transition-colors font-mono">
                             {item.step}
                         </div>
                         <div>
                             <h3 className="text-2xl font-bold text-white mb-2">{item.title}</h3>
                             <p className="text-gray-400 max-w-2xl">{item.desc}</p>
                         </div>
                     </div>
                 ))}
             </div>
         </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 text-center">
          <div className="max-w-3xl mx-auto glass-panel p-10 rounded-2xl border border-[var(--primary-green)]/30 bg-gradient-to-b from-[var(--primary-green)]/5 to-transparent">
              <h2 className="text-3xl font-bold text-white mb-4">Ready to get organized?</h2>
              <p className="text-gray-400 mb-8">Join thousands of users who trust SpliBiz for their shared expenses.</p>
              <Link to="/register" className="btn-primary px-8 py-3 inline-flex items-center gap-2">
                  Get Started Now <FiZap />
              </Link>
          </div>
      </section>

      <Footer />
    </div>
  );
}
