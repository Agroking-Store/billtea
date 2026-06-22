'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from '../components/ThemeProvider';
import { isLoggedIn } from '../lib/auth';

interface Testimonial {
  initials: string;
  name: string;
  role: string;
  content: string;
}

const testimonials: Testimonial[] = [
  {
    initials: "NM",
    name: "Nilesh Makwana",
    role: "Business Owner",
    content: "Billaro has made my billing work very simple and smooth. I can create invoices and quotations quickly, and tracking payments is now very easy. It saves my time and keeps everything properly organised."
  },
  {
    initials: "B",
    name: "Brijeshbhai",
    role: "Business Owner",
    content: "Since I started using Billaro, managing invoices has become much more easy. Everything is clear and straightforward, and I don’t have to worry about missing payments anymore. It really helps me stay organised."
  },
  {
    initials: "NS",
    name: "Nilam Shah",
    role: "Business Owner",
    content: "Billaro is very simple to use and saves a lot of my time. Creating quotations and converting them into invoices takes just a few clicks. Now my billing process feels much more smooth and hassle free."
  }
];

export default function LandingPage() {
  const router = useRouter();
  const { isDark, toggleTheme } = useTheme();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [formSubmitted, setFormSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (isLoggedIn()) {
      router.push('/home');
    }
  }, [router]);

  // Testimonial auto-slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitted(true);
    setTimeout(() => setFormSubmitted(false), 5000);
  };

  return (
    <div className="bg-background text-on-surface font-body min-h-screen flex flex-col antialiased selection:bg-primary/30 selection:text-primary transition-colors duration-300">
      
      {/* TopNavBar */}
      <header className="fixed top-0 w-full z-50 bg-surface border-b border-primary/10 shadow-[0_0_30px_rgba(125,211,252,0.05)] transition-all">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <img 
              className="h-8 w-8 rounded-lg object-contain transition-opacity duration-300" 
              alt="Indux Technology Logo" 
              src="/logo.jpg" 
            />
            <span className="text-xl font-headline font-bold tracking-tight text-on-surface text-glow">
              Indux Technology
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-on-surface hover:text-primary transition-all duration-300 px-3 py-1.5 rounded-lg active:scale-95 text-primary font-semibold border-b-2 border-primary pb-1">Features</a>
            <a href="#pricing" className="text-on-surface-variant hover:text-primary transition-all duration-300 px-3 py-1.5 rounded-lg active:scale-95">Pricing</a>
            <a href="#availability" className="text-on-surface-variant hover:text-primary transition-all duration-300 px-3 py-1.5 rounded-lg active:scale-95">Availability</a>
            <a href="#testimonials" className="text-on-surface-variant hover:text-primary transition-all duration-300 px-3 py-1.5 rounded-lg active:scale-95">Reviews</a>
          </nav>

          <div className="flex items-center gap-4">
            {/* Theme Toggle Button */}
            <button 
              onClick={toggleTheme}
              className="text-on-surface-variant hover:text-primary transition-colors flex items-center justify-center p-2 rounded-full hover:bg-primary/5 active:scale-95"
              aria-label="Toggle Theme"
            >
              <span className="material-symbols-outlined select-none">
                {isDark ? 'light_mode' : 'dark_mode'}
              </span>
            </button>

            <button 
              onClick={() => router.push('/login')}
              className="hidden md:block text-on-surface-variant hover:text-primary transition-colors font-semibold active:scale-95 cursor-pointer"
            >
              Login
            </button>
            <button 
              onClick={() => router.push('/signup')}
              className="hidden md:block bg-primary hover:bg-primary/90 text-on-primary px-5 py-2 rounded-lg font-semibold transition-all duration-300 active:scale-95 shadow-md shadow-primary/20 cursor-pointer"
            >
              Get Started
            </button>

            {/* Mobile Menu Button */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden text-primary p-2 active:scale-95"
              aria-label="Toggle Navigation Menu"
            >
              <span className="material-symbols-outlined select-none">
                {mobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-surface-container border-b border-primary/10 px-8 py-6 flex flex-col gap-4 animate-fade-in-down">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-surface hover:text-primary">Features</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-surface hover:text-primary">Pricing</a>
            <a href="#availability" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-surface hover:text-primary">Availability</a>
            <a href="#testimonials" onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-on-surface hover:text-primary">Reviews</a>
            <hr className="border-primary/10 my-2" />
            <button 
              onClick={() => { setMobileMenuOpen(false); router.push('/login'); }}
              className="text-center text-on-surface font-semibold py-2 rounded-lg hover:bg-primary/5 cursor-pointer w-full"
            >
              Login
            </button>
            <button 
              onClick={() => { setMobileMenuOpen(false); router.push('/signup'); }}
              className="text-center bg-primary text-on-primary font-semibold py-3 rounded-lg shadow-md cursor-pointer w-full"
            >
              Get Started
            </button>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="flex-grow pt-24">
        
        {/* Hero Section */}
        <section className="relative py-20 lg:py-32 px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-background to-background -z-10"></div>
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-sm font-semibold tracking-wide">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                New: WhatsApp Integration Available
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-headline font-bold leading-tight text-on-surface">
                Smart Billing.<br/>
                <span className="text-primary text-glow">Simple Tracking.</span><br/>
                Secure Data.
              </h1>
              
              <p className="text-xl text-on-surface-variant max-w-xl font-body leading-relaxed">
                Indux Technology helps Indian business owners manage instant quotations, easy invoicing, payment tracking, and expense management all in one secure place.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button onClick={() => router.push('/signup')} className="bg-primary hover:bg-primary/90 text-on-primary px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group shadow-lg shadow-primary/20 active:scale-95 cursor-pointer">
                  Get App Now
                  <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                </button>
                <button className="glass-panel hover:bg-surface-container text-on-surface px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer">
                  <span className="material-symbols-outlined text-primary">play_circle</span>
                  Watch Demo
                </button>
              </div>
            </div>
            
            <div className="relative w-full h-[350px] sm:h-[450px] lg:h-[600px] glass-elevated rounded-3xl overflow-hidden group">
              <img 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                alt="Indux Dashboard Interface" 
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBKsx2Ph1RS-RkHTV1hXXpgVcmuCQHJUfruandWvM0KjAiLG_0fcBNOe5Bvqc6j2_oITAU_8dvpS0RygWdslm8lu3UtekdqVoXNKtlWBFsNQhnWV71iE9ZCSWuF3RJhFADpeQewh7D7qxWqbY0RlWA_eynyGGGmCIluJk8Hm67F5S2e4xGIehsftsMJtBqlLumR_oTnSrWhi8vmMCNrRQ95uFHhHG_oTb0wXQH5v-UcfBTE2r2yJ0l276yY6RmWeYBFsY1O_-sILlk" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-60"></div>
            </div>
          </div>
        </section>

        {/* Features Bento Grid */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto relative" id="features">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Amazing Features</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Built for non-technical users, powerful enough for daily business operations.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {/* Bento Grid Item 1: Large */}
            <div className="md:col-span-2 glass-panel rounded-2xl p-8 flex flex-col justify-end relative overflow-hidden group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 w-16 h-16 rounded-full bg-primary-container flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl select-none">request_quote</span>
              </div>
              <h3 className="text-2xl font-bold mb-2 text-on-surface">Create Quotes Instantly</h3>
              <p className="text-on-surface-variant max-w-md">Prepare professional quotations in just a few clicks - no complexity, no delays.</p>
            </div>
            
            {/* Bento Grid Item 2 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-end relative group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 text-secondary">
                <span className="material-symbols-outlined text-3xl select-none">receipt_long</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Convert Quote to Invoice</h3>
              <p className="text-on-surface-variant text-sm">Turn approved quotes into invoices instantly - no rework needed.</p>
            </div>

            {/* Bento Grid Item 3 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-end relative group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 text-primary">
                <span className="material-symbols-outlined text-3xl select-none">payments</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Track Payments Easily</h3>
              <p className="text-on-surface-variant text-sm">Manage full and partial payments clearly in one simple dashboard.</p>
            </div>

            {/* Bento Grid Item 4 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-end relative group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 text-secondary">
                <span className="material-symbols-outlined text-3xl select-none">notifications_active</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Follow-Up Reminders</h3>
              <p className="text-on-surface-variant text-sm">Never miss a quotation follow-up with automatic reminders.</p>
            </div>

            {/* Bento Grid Item 5 */}
            <div className="glass-panel rounded-2xl p-8 flex flex-col justify-end relative group hover:border-primary/50 transition-all duration-300 shadow-xl shadow-primary/5 bg-surface-container-lowest hover:scale-[1.02]">
              <div className="absolute top-8 right-8 text-tertiary">
                <span className="material-symbols-outlined text-3xl select-none">account_balance_wallet</span>
              </div>
              <h3 className="text-xl font-bold mb-2 text-on-surface">Manage Business Expenses</h3>
              <p className="text-on-surface-variant text-sm">Record and track all your business expenses effortlessly.</p>
            </div>
          </div>
        </section>

        {/* Availability Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto relative" id="availability">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Available Everywhere You Are</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Access your business data from any device, anytime, anywhere.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* iOS */}
            <div className="glass-elevated rounded-3xl p-8 flex flex-col items-center text-center group hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <svg className="w-10 h-10 fill-current text-primary" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-.1 3.81 1.58a5.98 5.98 0 0 1 4.7 3c-2.95 1.79-2.48 5.72 1.09 7.17-.67 1.69-1.92 3.82-3 5m-3.41-14.7c1.38-1.68 1.4-3.53 1.4-3.53s-1.8.03-3.14 1.6c-1.29 1.49-1.35 3.32-1.35 3.32s1.7.07 3.09-1.39z"/>
                </svg>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">iOS App</h3>
              <p className="text-on-surface-variant text-sm mb-6">Optimized for iPhone and iPad for a seamless mobile experience.</p>
              <button className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300 cursor-pointer">
                Coming Soon
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
            
            {/* Android */}
            <div className="glass-elevated rounded-3xl p-8 flex flex-col items-center text-center group hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl select-none">android</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Android App</h3>
              <p className="text-on-surface-variant text-sm mb-6">Powerful billing tools right in your pocket for all Android devices.</p>
              <button className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300 cursor-pointer">
                Coming Soon
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>

            {/* Web */}
            <div className="glass-elevated rounded-3xl p-8 flex flex-col items-center text-center group hover:border-primary/50 transition-all duration-300 hover:scale-[1.02]">
              <div className="w-16 h-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-4xl select-none">language</span>
              </div>
              <h3 className="text-xl font-bold text-on-surface mb-2">Web Dashboard</h3>
              <p className="text-on-surface-variant text-sm mb-6">Full-featured desktop experience for complex business management.</p>
              <button onClick={() => router.push('/home')} className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all duration-300 cursor-pointer">
                Launch Web App
                <span className="material-symbols-outlined text-sm">open_in_new</span>
              </button>
            </div>
          </div>
        </section>

        {/* Testimonial Slider Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto overflow-hidden" id="testimonials">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">App Reviews</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Hear what our customers have to say about their experience with Billaro.</p>
          </div>
          
          <div className="relative max-w-4xl mx-auto pb-12 testimonial-slider-container">
            <div 
              className="flex transition-transform duration-700 ease-in-out" 
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {testimonials.map((t, index) => (
                <div key={index} className="w-full flex-shrink-0 px-4 md:px-12 testimonial-slide">
                  <div className={`testimonial-card transition-all duration-700 rounded-3xl p-8 md:p-12 flex flex-col items-center text-center bg-surface-bright border border-outline-variant/30 h-full ${index === currentSlide ? 'shadow-[0_8px_30px_rgb(3,105,161,0.15)] border-primary/30 scale-100' : 'opacity-40 scale-90'}`}>
                    <div className="flex gap-1 mb-6 text-primary">
                      {[...Array(5)].map((_, i) => (
                        <span key={i} className="material-symbols-outlined fill-current select-none">star</span>
                      ))}
                    </div>
                    <p className="text-lg md:text-xl text-on-surface-variant italic mb-8 font-body leading-relaxed flex-grow">
                      "{t.content}"
                    </p>
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-14 h-14 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl">
                        {t.initials}
                      </div>
                      <div>
                        <h4 className="font-bold text-on-surface text-lg">{t.name}</h4>
                        <p className="text-sm text-primary font-medium tracking-wide">{t.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Navigation Dots */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-3 z-10">
              {testimonials.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  aria-label={`Go to slide ${index + 1}`} 
                  className={`testimonial-dot transition-all duration-500 h-2 rounded-full cursor-pointer focus:outline-none ${index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-primary/20 hover:bg-primary/40'}`}
                ></button>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto" id="pricing">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Unbelievable Pricing</h2>
            <p className="text-on-surface-variant">Different plans for different user needs.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            {/* Free Plan */}
            <div className="glass-panel rounded-3xl p-8 flex flex-col hover:scale-[1.02] transition-transform duration-300">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-on-surface mb-2">Free</h3>
                <div className="text-4xl font-headline font-bold text-primary">₹0</div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow text-on-surface-variant">
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Quotations</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Invoices</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Reports</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Upload images</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Desktop + Mobile App</li>
              </ul>
              <button onClick={() => router.push('/signup')} className="w-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface py-3 rounded-lg font-semibold transition-colors active:scale-95 cursor-pointer">
                Register for Free
              </button>
            </div>

            {/* Monthly Plan (Highlighted) */}
            <div className="glass-elevated rounded-3xl p-8 flex flex-col relative transform md:-translate-y-4 border-primary/45 shadow-xl shadow-primary/10 hover:scale-[1.03] transition-all duration-300">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-on-primary px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider shadow-md">
                Most Popular
              </div>
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-on-surface mb-2">Monthly</h3>
                <div className="text-4xl font-headline font-bold text-primary">
                  ₹3500<span className="text-lg text-on-surface-variant font-normal">/mo</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow text-on-surface-variant">
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> All Free Features</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Multiple branch support</li>
                <li className="flex items-center gap-3 text-on-surface font-semibold"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Send Utility WhatsApp msg</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Priority Customer Support</li>
              </ul>
              <button className="w-full bg-primary hover:bg-primary/90 text-on-primary py-3 rounded-lg font-semibold transition-all shadow-md active:scale-95 cursor-pointer">
                Select &amp; Pay
              </button>
            </div>

            {/* Yearly Plan */}
            <div className="glass-panel rounded-3xl p-8 flex flex-col hover:scale-[1.02] transition-transform duration-300">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-on-surface mb-2">Yearly</h3>
                <div className="text-4xl font-headline font-bold text-primary">
                  ₹35000<span className="text-lg text-on-surface-variant font-normal">/yr</span>
                </div>
              </div>
              <ul className="space-y-4 mb-8 flex-grow text-on-surface-variant">
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> All Monthly Features</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Save roughly 2 months</li>
                <li className="flex items-center gap-3"><span className="material-symbols-outlined text-primary text-sm select-none">check</span> Enterprise level support</li>
              </ul>
              <button className="w-full bg-surface-container hover:bg-surface-container-high border border-outline-variant text-on-surface py-3 rounded-lg font-semibold transition-colors active:scale-95 cursor-pointer">
                Select &amp; Pay
              </button>
            </div>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="py-24 px-6 lg:px-8 max-w-7xl mx-auto" id="contact">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface">Contact Us</h2>
            <p className="text-on-surface-variant max-w-2xl mx-auto">Get in touch with us for any questions or support.</p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Form */}
            <div className="glass-panel rounded-3xl p-8 shadow-xl shadow-primary/5">
              <form onSubmit={handleContactSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="name">Name</label>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
                    id="name" 
                    name="name" 
                    placeholder="Your Name" 
                    type="text"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="email">Email</label>
                  <input 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow" 
                    id="email" 
                    name="email" 
                    placeholder="your.email@example.com" 
                    type="email"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-on-surface mb-2" htmlFor="message">Message</label>
                  <textarea 
                    className="w-full bg-surface-container-lowest border border-outline-variant rounded-xl px-4 py-3 text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-none" 
                    id="message" 
                    name="message" 
                    placeholder="How can we help you?" 
                    rows={4}
                    required
                  ></textarea>
                </div>
                <button 
                  className="w-full bg-primary hover:bg-primary/90 text-on-primary py-4 rounded-xl font-semibold transition-all duration-300 shadow-md active:scale-95 cursor-pointer" 
                  type="submit"
                >
                  Send Message
                </button>
              </form>

              {formSubmitted && (
                <div className="mt-4 p-4 bg-primary/10 border border-primary/20 text-primary rounded-xl text-center font-medium animate-fade-in">
                  Thank you! Your message has been sent successfully.
                </div>
              )}
            </div>

            {/* Contact Info Panel */}
            <div className="flex flex-col gap-8 justify-center lg:pl-8">
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined select-none">call</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface mb-1">Phone</h4>
                  <p className="text-on-surface-variant font-medium">+91 88661 41352 | +91 78188 61352</p>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined select-none">mail</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface mb-1">Email</h4>
                  <a className="text-on-surface-variant hover:text-primary transition-colors font-medium" href="mailto:billaroapp@gmail.com">
                    billaroapp@gmail.com
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4 group">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined select-none">location_on</span>
                </div>
                <div>
                  <h4 className="text-xl font-bold text-on-surface mb-1">Location</h4>
                  <p className="text-on-surface-variant leading-relaxed font-medium">
                    Visat Road, 626, Emporis by Poddar Realty Group B/s, Decathlon Rd, near Tapovan Circle, Motera, Ahmedabad, Gujarat 380005.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full py-12 bg-surface-container-lowest border-t border-outline-variant/30">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-2">
            <span className="text-lg font-headline font-semibold text-on-surface text-glow">Indux Technology</span>
            <span className="font-body text-sm text-on-surface-variant">© 2024 Indux Technology. All rights reserved.</span>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Privacy Policy</a>
            <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Terms of Service</a>
            <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">Contact Support</a>
            <a className="font-body text-sm text-on-surface-variant hover:text-primary transition-colors cursor-pointer" href="#">API Documentation</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
