'use client';
import Image from "next/image";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { isLoggedIn } from '../lib/auth';
import { useTheme } from '../components/ThemeProvider';

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  content: string;
}

const testimonials: Testimonial[] = [
  { initials: "NM", name: "Nilesh Makwana", role: "Business Owner", content: "BillTea has made my billing work very simple and smooth. I can create invoices and quotations quickly, and tracking payments is now very easy. It saves my time and keeps everything properly organised." },
  { initials: "B", name: "Brijeshbhai", role: "Business Owner", content: "Since I started using BillTea, managing invoices has become much more easy. Everything is clear and straightforward, and I don’t have to worry about missing payments anymore. It really helps me stay organised." },
  { initials: "NS", name: "Nilam Shah", role: "Business Owner", content: "BillTea is very simple to use and saves a lot of my time. Creating quotations and converting them into invoices takes just a few clicks. Now my billing process feels much more smooth and hassle free." },
  { initials: "DK", name: "Deepak Kumar", role: "Retailer", content: "The WhatsApp integration is a game-changer. Sending invoices directly to clients' phones has improved our payment collection speed drastically." }
];

export default function LandingPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState<boolean>(false);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
  
  useEffect(() => {
    setIsUserLoggedIn(isLoggedIn());
    document.body.classList.add('no-scrollbar');
    return () => {
      document.body.classList.remove('no-scrollbar');
    };
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  return (
    <div className="bg-slate-50 dark:bg-[#030305] text-slate-800 dark:text-slate-300 font-sans min-h-screen flex flex-col overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-600 dark:selection:text-cyan-300 relative transition-colors duration-300">
      {/* Background Nebulas */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-500/20 dark:bg-cyan-600/10 blur-[120px]" />
        <div className="absolute top-[30%] right-[-20%] w-[60%] h-[60%] rounded-full bg-purple-500/20 dark:bg-purple-700/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] rounded-full bg-blue-500/20 dark:bg-blue-600/10 blur-[120px]" />
        {/* Subtle Grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>

      {/* Top Navbar */}
      <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-[#030305]/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 transition-all">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
   <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden transition-all">
  <Image
    src={
      isDark
        ? "/Biltea-white-03.png"
        : "/BillTea-dark-04.png"
    }
    alt="BillTea Logo"
    width={40}
    height={40}
    className="h-full w-full object-contain"
  />
</div>

<span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-300 transition-colors">
  BillTea
</span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-8">
            {['Features', 'Reviews', 'Pricing'].map((item, i) => (
              <motion.a
                key={item}
                href={`#${item.toLowerCase()}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * i }}
                className="text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors relative group"
              >
                {item}
                <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-cyan-500 group-hover:w-full transition-all duration-300"></span>
              </motion.a>
            ))}
          </nav>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-4"
          >
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="text-slate-600 dark:text-cyan-400 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors flex items-center justify-center p-2 rounded-full hover:bg-slate-100 dark:hover:bg-cyan-500/10 active:scale-95"
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined select-none">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            {isUserLoggedIn ? (
              <button
                onClick={() => router.push('/home')}
                className="hidden md:block relative overflow-hidden group bg-transparent border border-cyan-500/50 hover:border-cyan-500 text-cyan-600 dark:text-cyan-300 px-6 py-2 rounded-full font-semibold transition-all duration-300 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)]"
              >
                <span className="relative z-10">Dashboard</span>
                <div className="absolute inset-0 bg-cyan-50 dark:bg-cyan-500/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
              </button>
            ) : (
              <>
                <button
                  onClick={() => router.push('/login')}
                  className="hidden md:block text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-semibold"
                >
                  Login
                </button>
                <button
                  onClick={() => router.push('/signup')}
                  className="hidden md:block relative overflow-hidden group bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-6 py-2 rounded-full font-semibold transition-all duration-300 shadow-[0_0_10px_rgba(34,211,238,0.3)] dark:shadow-[0_0_15px_rgba(34,211,238,0.4)] hover:shadow-[0_0_15px_rgba(34,211,238,0.5)] hover:scale-105"
                >
                  <span className="relative z-10 flex items-center gap-2">Get Started <span className="material-symbols-outlined text-sm">rocket_launch</span></span>
                </button>
              </>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-cyan-600 dark:text-cyan-400 p-2"
            >
              <span className="material-symbols-outlined">{mobileMenuOpen ? 'close' : 'menu'}</span>
            </button>
          </motion.div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden bg-white/95 dark:bg-[#05050A]/95 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 overflow-hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                {['Features', 'Reviews', 'Pricing'].map((item) => (
                  <a
                    key={item}
                    href={`#${item.toLowerCase()}`}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-lg font-medium text-slate-700 dark:text-slate-300 hover:text-cyan-600 dark:hover:text-cyan-300 transition-colors"
                  >
                    {item}
                  </a>
                ))}
                <div className="h-px bg-slate-200 dark:bg-white/10 my-2"></div>
                {isUserLoggedIn ? (
                  <button
                    onClick={() => { setMobileMenuOpen(false); router.push('/home'); }}
                    className="w-full bg-cyan-50 dark:bg-cyan-500/20 border border-cyan-500/50 text-cyan-700 dark:text-cyan-300 py-3 rounded-xl font-semibold flex justify-center items-center gap-2"
                  >
                    Dashboard
                  </button>
                ) : (
                  <div className="flex flex-col gap-3">
                    <button
                      onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
                      className="w-full text-slate-700 dark:text-slate-300 font-semibold py-2"
                    >
                      Login
                    </button>
                    <button
                      onClick={() => { setMobileMenuOpen(false); router.push('/signup'); }}
                      className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="flex-grow pt-24 z-10">
        {/* Hero Section */}
        <section className="relative min-h-[90vh] flex items-center justify-center px-6 py-20 overflow-hidden">
          <div className="max-w-5xl mx-auto text-center space-y-8 relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-cyan-500/30 bg-white/50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 text-sm font-semibold backdrop-blur-md shadow-sm dark:shadow-none"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
              </span>
              Next-Gen Billing Software is Here
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black text-slate-900 dark:text-white tracking-tighter leading-[1.1]"
            >
              Billing From <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 dark:from-cyan-400 dark:via-blue-500 dark:to-purple-600 drop-shadow-sm dark:drop-shadow-[0_0_30px_rgba(34,211,238,0.4)]">
                The Future.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="text-lg md:text-2xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto font-light leading-relaxed"
            >
              Experience seamless invoicing, smart quotations, and effortless payment tracking, all wrapped in a beautiful interface.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
            >
              <button
                onClick={() => router.push('/signup')}
                className="group relative px-8 py-4 bg-slate-900 dark:bg-white text-white dark:text-black rounded-full font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-xl shadow-slate-200/50 dark:shadow-none"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-300 dark:to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative flex items-center gap-2 text-white dark:text-black group-hover:text-white transition-colors">
                  Launch Platform <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </span>
              </button>

              <button className="flex items-center gap-3 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors font-medium group">
                <div className="h-12 w-12 rounded-full border border-slate-200 dark:border-white/20 flex items-center justify-center bg-white/50 dark:bg-white/5 group-hover:bg-slate-100 dark:group-hover:bg-white/10 group-hover:border-cyan-500/50 transition-all backdrop-blur-md shadow-sm dark:shadow-none">
                  <span className="material-symbols-outlined text-cyan-600 dark:text-cyan-400">play_arrow</span>
                </div>
                See How It Works
              </button>
            </motion.div>
          </div>

          {/* Decorative Hero Elements */}
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/4 left-10 w-24 h-24 bg-gradient-to-br from-purple-500/10 to-transparent rounded-2xl border border-purple-500/20 backdrop-blur-xl rotate-12 hidden lg:block"
          />
          <motion.div
            animate={{ y: [0, 30, 0], rotate: [0, 45, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute bottom-1/3 right-10 w-32 h-32 bg-gradient-to-bl from-cyan-500/10 to-transparent rounded-full border border-cyan-500/20 backdrop-blur-xl hidden lg:block"
          />
        </section>

        {/* Asymmetrical Features */}
        <section className="py-32 px-6 max-w-7xl mx-auto relative" id="features">
          <div className="text-center mb-24">
            <h2 className="text-sm font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase mb-4">Core Capabilities</h2>
            <h3 className="text-4xl md:text-5xl font-bold text-slate-900 dark:text-white">Powering your business.</h3>
          </div>

          <div className="grid md:grid-cols-12 gap-6 relative">
            {/* Feature 1 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-7 bg-white/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-10 hover:border-cyan-500/50 transition-colors group relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-md"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] group-hover:bg-cyan-500/20 transition-colors" />
              <div className="h-14 w-14 rounded-2xl bg-cyan-50 dark:bg-cyan-500/20 flex items-center justify-center text-cyan-600 dark:text-cyan-400 mb-8 border border-cyan-200 dark:border-cyan-500/30">
                <span className="material-symbols-outlined text-2xl">request_quote</span>
              </div>
              <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Instant Quotations</h4>
              <p className="text-slate-600 dark:text-slate-400 text-lg leading-relaxed max-w-md">Generate professional, branded quotes in seconds. Impress your clients and close deals faster with our streamlined builder.</p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-5 bg-white/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-10 hover:border-purple-500/50 transition-colors group relative overflow-hidden flex flex-col justify-between shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-md"
            >
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-[60px] group-hover:bg-purple-500/20 transition-colors" />
              <div className="h-14 w-14 rounded-2xl bg-purple-50 dark:bg-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 mb-8 border border-purple-200 dark:border-purple-500/30">
                <span className="material-symbols-outlined text-2xl">receipt_long</span>
              </div>
              <div>
                <h4 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">One-Click Invoices</h4>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">Convert approved quotations into tax-ready invoices instantly. No redundant data entry required.</p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-4 bg-white/70 dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-10 hover:border-blue-500/50 transition-colors group relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-md"
            >
              <div className="h-14 w-14 rounded-2xl bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-8 border border-blue-200 dark:border-blue-500/30">
                <span className="material-symbols-outlined text-2xl">payments</span>
              </div>
              <h4 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Payment Tracking</h4>
              <p className="text-slate-600 dark:text-slate-400">Track partial and full payments effortlessly. Know exactly who owes you what.</p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div
              whileHover={{ y: -5 }}
              className="md:col-span-8 bg-gradient-to-br from-white/70 dark:from-white/[0.05] to-transparent border border-slate-200 dark:border-white/10 rounded-3xl p-10 hover:border-emerald-500/50 dark:hover:border-white/30 transition-colors group relative overflow-hidden shadow-xl shadow-slate-200/50 dark:shadow-none backdrop-blur-md"
            >
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                <div className="flex-1">
                  <div className="h-14 w-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-8 border border-emerald-200 dark:border-emerald-500/30">
                    <span className="material-symbols-outlined text-2xl">chat</span>
                  </div>
                  <h4 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">WhatsApp Integration</h4>
                  <p className="text-slate-600 dark:text-slate-400 text-lg">Send invoices and reminders directly to your client's WhatsApp. Accelerate your cash flow dramatically.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Cross-Platform Support */}
        <section className="py-20 bg-white dark:bg-white/[0.02] border-y border-slate-200 dark:border-white/5 relative z-10">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center justify-between gap-10"
            >
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">Work from anywhere, on any device.</h3>
                <p className="text-lg text-slate-600 dark:text-slate-400">Available across all platforms to keep your business moving.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-6 text-slate-700 dark:text-slate-300">
                <div className="flex items-center gap-3 font-medium bg-slate-50 dark:bg-[#08080C] px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                  <span className="material-symbols-outlined text-cyan-500 text-3xl">language</span>
                  <span className="text-lg">Web</span>
                </div>
                <div className="flex items-center gap-3 font-medium bg-slate-50 dark:bg-[#08080C] px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none">
                  <span className="material-symbols-outlined text-emerald-500 text-3xl">android</span>
                  <span className="text-lg">Android</span>
                </div>
                <div className="flex items-center gap-3 font-medium bg-slate-50 dark:bg-[#08080C] px-6 py-4 rounded-2xl border border-slate-200 dark:border-white/5 opacity-60 relative shadow-sm dark:shadow-none">
                  <span className="material-symbols-outlined text-slate-800 dark:text-white text-3xl">phone_iphone</span>
                  <span className="text-lg">iOS</span>
                  <span className="absolute -top-3 -right-4 text-xs font-bold bg-cyan-100 dark:bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 px-3 py-1 rounded-full border border-cyan-200 dark:border-cyan-500/30 whitespace-nowrap">Coming Soon</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Marquee Testimonials */}
        <section className="py-32 bg-slate-100 dark:bg-black/50 border-y border-slate-200 dark:border-white/5 overflow-hidden" id="reviews">
          <div className="text-center mb-16">
            <h2 className="text-sm font-bold tracking-widest text-cyan-600 dark:text-cyan-400 uppercase mb-4">Community</h2>
            <h3 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white">Loved by business owners.</h3>
          </div>

          <div className="relative flex overflow-x-hidden group">
            {/* Gradient masks for smooth fading at edges */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-slate-100 dark:from-[#030305] to-transparent z-10"></div>
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-slate-100 dark:from-[#030305] to-transparent z-10"></div>

            <motion.div
              animate={{ x: ["0%", "-50%"] }}
              transition={{ ease: "linear", duration: 30, repeat: Infinity }}
              className="flex gap-6 px-6 w-max"
            >
              {[...testimonials, ...testimonials].map((t, i) => (
                <div key={i} className="w-[400px] bg-white dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 rounded-2xl p-8 hover:bg-slate-50 dark:hover:bg-white/[0.05] transition-colors shrink-0 flex flex-col shadow-lg shadow-slate-200/50 dark:shadow-none">
                  <div className="flex text-cyan-500 dark:text-cyan-400 mb-6">
                    {[1, 2, 3, 4, 5].map(star => <span key={star} className="material-symbols-outlined text-lg">star</span>)}
                  </div>
                  <p className="text-slate-700 dark:text-slate-300 text-lg font-light leading-relaxed mb-8 flex-grow">"{t.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                      {t.initials}
                    </div>
                    <div>
                      <h5 className="text-slate-900 dark:text-white font-semibold">{t.name}</h5>
                      <span className="text-cyan-600 dark:text-cyan-400 text-sm">{t.role}</span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing Orbs */}
        <section className="py-32 px-6 max-w-7xl mx-auto" id="pricing">
          <div className="text-center mb-24">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white">Transparent Pricing</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4 max-w-xl mx-auto">Scale your business without scaling your costs exponentially.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Free */}
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group shadow-xl shadow-slate-200/50 dark:shadow-none">
              <h3 className="text-xl text-slate-700 dark:text-slate-300 font-medium mb-4">Free Plan</h3>
              <div className="text-5xl font-bold text-slate-900 dark:text-white mb-8">₹0</div>
              <ul className="space-y-4 text-slate-600 dark:text-slate-400 mb-10 w-full flex-grow">
                <li className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-sm">check</span> Quotations & Invoices</li>
                <li className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-sm">check</span> Standard Reports</li>
                <li className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-sm">check</span> Mobile App Access</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors font-semibold">Start Free</button>
            </div>

            {/* Monthly (Glowing) */}
            <div className="bg-slate-900 dark:bg-[#0A0A10] border border-cyan-500/50 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden md:-translate-y-6 shadow-[0_0_40px_rgba(34,211,238,0.3)] dark:shadow-[0_0_40px_rgba(34,211,238,0.15)] group">
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50"></div>
              <div className="absolute top-0 right-0 p-4">
                <span className="bg-cyan-500/20 text-cyan-300 text-xs font-bold px-3 py-1 rounded-full border border-cyan-500/30">PRO</span>
              </div>
              <h3 className="text-xl text-cyan-300 font-medium mb-4 mt-4">Monthly</h3>
              <div className="text-5xl font-bold text-white mb-8">₹3500<span className="text-lg text-slate-400 dark:text-slate-500 font-normal">/mo</span></div>
              <ul className="space-y-4 text-slate-300 mb-10 w-full flex-grow font-medium">
                <li className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-cyan-400 text-sm shadow-glow">check</span> Multiple Branches</li>
                <li className="flex items-center justify-center gap-2 text-white"><span className="material-symbols-outlined text-cyan-400 text-sm">check</span> WhatsApp Utility Messages</li>
                <li className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-cyan-400 text-sm">check</span> Priority Support</li>
              </ul>
              <button className="w-full py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold transition-colors shadow-[0_0_20px_rgba(34,211,238,0.4)]">Upgrade Now</button>
            </div>

            {/* Yearly */}
            <div className="bg-white dark:bg-white/[0.02] border border-slate-200 dark:border-white/10 rounded-3xl p-8 flex flex-col items-center text-center relative overflow-hidden group shadow-xl shadow-slate-200/50 dark:shadow-none">
              <div className="absolute top-4 right-4"><span className="text-emerald-600 dark:text-emerald-400 text-xs font-bold bg-emerald-100 dark:bg-emerald-400/10 px-2 py-1 rounded-md border border-emerald-200 dark:border-emerald-400/20">Save 16%</span></div>
              <h3 className="text-xl text-slate-700 dark:text-slate-300 font-medium mb-4">Yearly</h3>
              <div className="text-5xl font-bold text-slate-900 dark:text-white mb-8">₹35k<span className="text-lg text-slate-500 font-normal">/yr</span></div>
              <ul className="space-y-4 text-slate-600 dark:text-slate-400 mb-10 w-full flex-grow">
                <li className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-sm">check</span> All Monthly Features</li>
                <li className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-sm">check</span> 2 Months Free</li>
                <li className="flex items-center justify-center gap-2"><span className="material-symbols-outlined text-cyan-600 dark:text-cyan-500 text-sm">check</span> Enterprise Support</li>
              </ul>
              <button className="w-full py-3 rounded-full border border-slate-300 dark:border-white/20 text-slate-700 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 transition-colors font-semibold">Billed Annually</button>
            </div>
          </div>
        </section>

      </main>

      {/* Futuristic Footer */}
      <footer className="w-full pt-20 pb-10 border-t border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-black/80 relative z-10 transition-colors">
        <div className="px-6 max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold">B</div>
              <span className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">BillTea - Indux Technology Product</span>
            </div>
            <p className="text-slate-600 dark:text-slate-500 text-sm max-w-xs text-center md:text-left">Building the future of business management and billing tools.</p>
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-4">
            {['Privacy Policy', 'Terms of Service', 'Support', 'API Docs'].map(link => (
              <a key={link} href="#" className="text-slate-600 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 text-sm transition-colors">{link}</a>
            ))}
          </div>
        </div>
        <div className="text-center mt-16 text-slate-500 dark:text-slate-600 text-xs">
          © {new Date().getFullYear()} Indux Technology. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
