import { FiGithub, FiInstagram, FiLinkedin, FiHeart } from "react-icons/fi";
import { Link } from "react-router-dom";
import kulhadChai from "../assets/kulhad_chai.png";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const socialLinks = [
    {
      name: "Instagram",
      url: "https://www.instagram.com/dhruv_sutar_779?igsh=MTdpOW9qOTV3anV1dQ==",
      icon: <FiInstagram className="w-5 h-5" />,
      color: "hover:text-pink-500 hover:border-pink-500/50 hover:bg-pink-500/10"
    },
    {
      name: "LinkedIn",
      url: "https://www.linkedin.com/in/dhruv-suthar-42174228b/",
      icon: <FiLinkedin className="w-5 h-5" />,
      color: "hover:text-blue-500 hover:border-blue-500/50 hover:bg-blue-500/10"
    },
    {
      name: "GitHub",
      url: "https://github.com/codebuds-bash",
      icon: <FiGithub className="w-5 h-5" />,
      color: "hover:text-white hover:border-white/50 hover:bg-white/10"
    }
  ];

  return (
    <footer className="relative border-t border-white/5 bg-[#0f0f0f] overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-[var(--primary-green)]/10 rounded-full blur-[80px]" />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="p-2 rounded-lg bg-[var(--primary-green)]/10 group-hover:bg-[var(--primary-green)]/20 transition-colors">
                <svg className="h-6 w-6 text-[var(--primary-green)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
                </svg>
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SpliBiz</span>
            </Link>
            <p className="text-[var(--text-muted)] text-sm leading-relaxed max-w-xs">
              The seamless way to split expenses and manage shared finances. Built for friends, flats, and trips.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-6">Product</h4>
            <ul className="space-y-3 text-sm text-[var(--text-muted)]">
              <li><Link to="/register" className="hover:text-[var(--primary-green)] transition-colors">Get Started</Link></li>
              <li><Link to="/login" className="hover:text-[var(--primary-green)] transition-colors">Sign In</Link></li>
              <li><a href="#features" className="hover:text-[var(--primary-green)] transition-colors">Features</a></li>
            </ul>
          </div>

          {/* Contact / Connect */}
          <div className="lg:col-span-2">
            <h4 className="font-bold text-white mb-6">Connect with the Developer</h4>
            <div className="flex gap-4 mb-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noreferrer"
                  className={`p-3 rounded-full border border-white/10 text-gray-400 bg-white/5 transition-all duration-300 hover:scale-110 ${social.color}`}
                  aria-label={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
            <p className="text-sm text-[var(--text-muted)]">
              Questions or feedback? <br />
              Reach out via LinkedIn or Instagram.
            </p>
          </div>
        </div>

        {/* Buy Me A Chai */}
        <div className="flex justify-center mb-12">
          <a
            href="https://www.buymeacoffee.com/dhruvsuthar"
            target="_blank"
            rel="noreferrer" 
            className="group flex items-center gap-3 px-5 py-2.5 rounded-full bg-[#1a1a1a] border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all duration-300"
          >
            <span className="text-gray-300 font-medium group-hover:text-orange-400 transition-colors">Buy me a Kulhad Chai</span>
            <img 
              src={kulhadChai} 
              alt="Kulhad Chai" 
              className="w-8 h-8 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300"
            />
          </a>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
          <p>© {currentYear} SpliBiz. All rights reserved.</p>
          
          <div className="flex items-center gap-1 group cursor-default">
            <span>Made with</span>
            <FiHeart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
            <span>by</span>
            <a 
               href="https://www.linkedin.com/in/dhruv-suthar-42174228b/"
               target="_blank"
               rel="noreferrer"
               className="text-white hover:text-[var(--primary-green)] transition-colors font-medium ml-1"
            >
              Dhruv Suthar
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
