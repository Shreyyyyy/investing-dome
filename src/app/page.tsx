"use client";

import Link from "next/link";
import { ShieldCheck, Compass, BarChart4, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 md:py-20 text-center flex flex-col items-center justify-center">
      <div className="w-16 h-16 border border-brass-500 rounded-full flex items-center justify-center text-brass-500 mb-8 bg-white shadow-sm">
        <Compass size={28} className="animate-spin-slow" />
      </div>

      <h1 className="font-serif text-4xl md:text-6xl font-bold text-hunter-800 tracking-tight leading-none mb-6">
        Shrey's Bespoke Wealth <br className="hidden md:inline" />
        <span className="italic text-brass-600">Planning & Diagnostics</span>
      </h1>

      <p className="font-serif text-lg md:text-xl text-hunter-800 max-w-2xl leading-relaxed mb-12 italic opacity-85">
        "Wealth is not about having money, it is about having options." - Discover the absolute best direct investment configurations, sourced through live market audits and refined via state-of-the-art Groq Intelligence.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-3xl mb-12 text-left">
        <div className="p-6 bg-white border border-cream-200 rounded-lg shadow-sm">
          <div className="text-brass-500 mb-3"><BarChart4 size={24} /></div>
          <h3 className="font-serif text-lg font-bold text-hunter-800 mb-2">Empirical Audits</h3>
          <p className="text-xs text-hunter-800/80 leading-relaxed">
            Real-time calculations fetched directly from exchange databases. No blind theory.
          </p>
        </div>

        <div className="p-6 bg-white border border-cream-200 rounded-lg shadow-sm">
          <div className="text-brass-500 mb-3"><ShieldCheck size={24} /></div>
          <h3 className="font-serif text-lg font-bold text-hunter-800 mb-2">Secure OAuth2</h3>
          <p className="text-xs text-hunter-800/80 leading-relaxed">
            Your credentials and private keys are encrypted and stored within your personal locker.
          </p>
        </div>

        <div className="p-6 bg-white border border-cream-200 rounded-lg shadow-sm">
          <div className="text-brass-500 mb-3"><Compass size={24} /></div>
          <h3 className="font-serif text-lg font-bold text-hunter-800 mb-2">Zero Commissions</h3>
          <p className="text-xs text-hunter-800/80 leading-relaxed">
            Harnessing 100% free search engines and local Offline LLM alternatives.
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full">
        <Link 
          href="/login" 
          className="w-full sm:w-auto px-8 py-4 bg-hunter-800 text-white rounded font-serif uppercase tracking-widest text-xs hover:bg-hunter-900 border border-hunter-800 hover:border-hunter-900 transition duration-300 flex items-center justify-center gap-2 shadow-sm"
        >
          Enter the Club Locker <ArrowRight size={14} />
        </Link>
        <Link 
          href="/admin" 
          className="w-full sm:w-auto px-8 py-4 bg-transparent text-brass-600 rounded font-serif uppercase tracking-widest text-xs hover:bg-cream-100 border border-brass-500 transition duration-300 flex items-center justify-center"
        >
          Administrative Terminal
        </Link>
      </div>
    </div>
  );
}
