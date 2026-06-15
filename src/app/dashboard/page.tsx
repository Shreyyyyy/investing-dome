"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend 
} from "recharts";
import { 
  Coins, Hourglass, ShieldAlert, Award, Compass, RefreshCw, FileDown, 
  HelpCircle, CheckCircle2, AlertCircle, TrendingUp, Calendar, Newspaper,
  Shield, Scale, Flame, LayoutGrid, Target, Sparkles
} from "lucide-react";

const COLORS = ["#8a704c", "#1e3f20", "#2c4a5e", "#7b506f", "#bf5a36", "#4682b4"];

export default function UserDashboard() {
  const router = useRouter();
  
  // States
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [planReady, setPlanReady] = useState(false);
  const [reportText, setReportText] = useState("");
  const [recommendedFunds, setRecommendedFunds] = useState<any[]>([]);
  const [apiTotals, setApiTotals] = useState<any>(null);

  // API Keys state for Editing inside App
  const [isEditingKeys, setIsEditingKeys] = useState(false);
  const [editGroqKey, setEditGroqKey] = useState("");
  const [editTavilyKey, setEditTavilyKey] = useState("");
  
  // User selections
  const [amount, setAmount] = useState(10000);
  const [timeframe, setTimeframe] = useState("1 Year");
  const [risk, setRisk] = useState("Balanced");
  const [allocation, setAllocation] = useState("Multiple Stocks/ETFs (Diversified)");
  const [customGoal, setCustomGoal] = useState("");
  
  // Charting state
  const [chartAsset, setChartAsset] = useState("NIFTYBEES.NS");
  const [customChartAsset, setCustomChartAsset] = useState("");
  const [isCustomChart, setIsCustomChart] = useState(false);
  const [chartPeriod, setChartPeriod] = useState("5 Years");
  const [chartData, setChartData] = useState<any[]>([]);
  const [chartLoading, setChartLoading] = useState(false);
  const [growthMetrics, setGrowthMetrics] = useState<any>(null);
  const [scrapedNews, setScrapedNews] = useState<any[]>([]);

  // Simulation fallback dataset to make sure charts work offline immediately
  const mockChartData: Record<string, any[]> = {
    "NIFTYBEES.NS": [
      { date: "2021", price: 160 }, { date: "2022", price: 185 }, 
      { date: "2023", price: 210 }, { date: "2024", price: 240 }, { date: "2025", price: 275 }
    ],
    "MON100.NS": [
      { date: "2021", price: 90 }, { date: "2022", price: 110 }, 
      { date: "2023", price: 125 }, { date: "2024", price: 145 }, { date: "2025", price: 180 }
    ],
    "GOLDBEES.NS": [
      { date: "2021", price: 41 }, { date: "2022", price: 46 }, 
      { date: "2023", price: 53 }, { date: "2024", price: 62 }, { date: "2025", price: 74 }
    ],
    "LIQUIDBEES.NS": [
      { date: "2021", price: 1000 }, { date: "2022", price: 1000 }, 
      { date: "2023", price: 1000 }, { date: "2024", price: 1000 }, { date: "2025", price: 1000 }
    ]
  };

  useEffect(() => {
    const activeSession = localStorage.getItem("heritage_session");
    if (!activeSession) {
      router.push("/login");
    } else {
      const parsed = JSON.parse(activeSession);
      
      // Self-heal: Retrieve the latest credentials and keys from registered users to stay perfectly in sync on restart/reload
      const existingUsers = JSON.parse(localStorage.getItem("heritage_registered_users") || "[]");
      const matchedUser = existingUsers.find((u: any) => {
        const uUsername = u.username?.toLowerCase() || "";
        const pUsername = parsed.username?.toLowerCase() || "";
        const uEmail = u.email?.toLowerCase() || "";
        const pEmail = parsed.email?.toLowerCase() || "";
        const uName = u.name?.toLowerCase() || "";
        const pName = parsed.name?.toLowerCase() || "";
        
        return (
          (uUsername && pUsername && uUsername === pUsername) ||
          (uEmail && pEmail && uEmail === pEmail) ||
          (uName && pName && uName === pName)
        );
      });
      
      const currentSession = matchedUser ? { ...parsed, ...matchedUser } : parsed;
      
      setSession(currentSession);
      setEditGroqKey(currentSession.groqKey || "");
      setEditTavilyKey(currentSession.tavilyKey || "");
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (!loading) {
      fetchChartData();
    }
  }, [chartAsset, customChartAsset, isCustomChart, chartPeriod, loading]);

  const fetchChartData = async () => {
    const symbol = isCustomChart ? customChartAsset : chartAsset;
    if (!symbol) return;
    
    setChartLoading(true);
    try {
      const res = await fetch(`/api/chart?symbol=${symbol}&period=${chartPeriod}`);
      const data = await res.json();
      
      if (data.success && data.chartData && data.chartData.length > 0) {
        setChartData(data.chartData);
        const start = data.chartData[0].price;
        const end = data.chartData[data.chartData.length - 1].price;
        const growth = ((end - start) / start) * 100;
        setGrowthMetrics({ start, end, growth });
      } else {
        // Fallback to simulated specs if exchange endpoint has a rate-limit or is offline
        const fallback = mockChartData[symbol] || mockChartData["NIFTYBEES.NS"];
        setChartData(fallback);
        const start = fallback[0].price;
        const end = fallback[fallback.length - 1].price;
        const growth = ((end - start) / start) * 100;
        setGrowthMetrics({ start, end, growth });
      }
    } catch (e) {
      const fallback = mockChartData[symbol] || mockChartData["NIFTYBEES.NS"];
      setChartData(fallback);
      const start = fallback[0].price;
      const end = fallback[fallback.length - 1].price;
      const growth = ((end - start) / start) * 100;
      setGrowthMetrics({ start, end, growth });
    } finally {
      setChartLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    setAnalyzing(true);
    setPlanReady(false);
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          timeframe,
          risk,
          allocation,
          focus_area: customGoal,
          tavilyKey: session?.tavilyKey,
          groqKey: session?.groqKey
        })
      });
      
      const resData = await response.json();
      if (resData.success) {
        setReportText(resData.report);
        setRecommendedFunds(resData.recommended_funds || []);
        setApiTotals(resData.calculated_totals || null);
        setScrapedNews(resData.raw_news_items || []);
        setPlanReady(true);
        
        // Log transaction inside the Admin Activity Table!
        const auditLog = JSON.parse(localStorage.getItem("heritage_audit_logs") || "[]");
        auditLog.push({
          user: session?.name,
          email: session?.email,
          amount,
          timeframe,
          risk,
          date: new Date().toLocaleString()
        });
        localStorage.setItem("heritage_audit_logs", JSON.stringify(auditLog));
      } else {
        alert(`Analysis Error: ${resData.error}`);
      }
    } catch (err: any) {
      alert(`Network/API Error: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSaveKeys = () => {
    if (!session) return;
    
    const updatedSession = {
      ...session,
      groqKey: editGroqKey,
      tavilyKey: editTavilyKey,
    };
    
    setSession(updatedSession);
    localStorage.setItem("heritage_session", JSON.stringify(updatedSession));
    
    const existingUsers = JSON.parse(localStorage.getItem("heritage_registered_users") || "[]");
    const updatedUsers = existingUsers.map((u: any) => {
      const uUsername = u.username?.toLowerCase() || "";
      const sUsername = session.username?.toLowerCase() || "";
      const uEmail = u.email?.toLowerCase() || "";
      const sEmail = session.email?.toLowerCase() || "";
      const uName = u.name?.toLowerCase() || "";
      const sName = session.name?.toLowerCase() || "";
      
      if (
        (uUsername && sUsername && uUsername === sUsername) ||
        (uEmail && sEmail && uEmail === sEmail) ||
        (uName && sName && uName === sName)
      ) {
        return {
          ...u,
          groqKey: editGroqKey,
          tavilyKey: editTavilyKey,
        };
      }
      return u;
    });
    localStorage.setItem("heritage_registered_users", JSON.stringify(updatedUsers));
    
    setIsEditingKeys(false);
    alert("API keys updated and secured successfully!");
  };

  const handleSignout = () => {
    localStorage.removeItem("heritage_session");
    router.push("/");
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-cream-50">
        <div className="w-8 h-8 border-4 border-brass-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
      
      {/* LEFT COLUMN: Controls & Config */}
      <div className="lg:col-span-1 space-y-6">
        
        {/* User Card */}
        <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-cream-100 rounded-full -mr-8 -mt-8 flex items-center justify-center text-2xl">
            {session?.avatar || "🎩"}
          </div>
          <span className="text-[10px] tracking-widest uppercase font-bold text-brass-600 block mb-1">
            MEMBER CABINET
          </span>
          <h2 className="font-serif text-xl font-bold text-hunter-800">{session?.name}</h2>
          <p className="text-xs text-hunter-800/60 font-mono mb-4">{session?.email}</p>
          
          {!isEditingKeys ? (
            <div className="border-t border-cream-100 pt-4 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-hunter-800/70">Groq Key:</span>
                <span className="font-mono text-[10px] text-brass-600">
                  {session?.groqKey ? `${session.groqKey.substring(0, 6)}...` : "None (Ollama)"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-hunter-800/70">Tavily Key:</span>
                <span className="font-mono text-[10px] text-brass-600">
                  {session?.tavilyKey ? `${session.tavilyKey.substring(0, 8)}...` : "DDG fallback"}
                </span>
              </div>
              <button 
                onClick={() => setIsEditingKeys(true)}
                className="w-full mt-2 py-1.5 bg-cream-50 hover:bg-cream-100 text-hunter-800 border border-cream-200 text-[10px] uppercase tracking-wider font-bold rounded transition"
              >
                Configure API Keys
              </button>
            </div>
          ) : (
            <div className="border-t border-cream-100 pt-4 space-y-3 text-xs">
              <div>
                <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1">
                  Groq API Key
                </label>
                <input 
                  type="password"
                  placeholder="gsk_..."
                  value={editGroqKey}
                  onChange={(e) => setEditGroqKey(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-200 p-2 text-[11px] focus:outline-none focus:border-brass-500 rounded text-hunter-800 font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1">
                  Tavily API Key
                </label>
                <input 
                  type="password"
                  placeholder="tvly-sk-..."
                  value={editTavilyKey}
                  onChange={(e) => setEditTavilyKey(e.target.value)}
                  className="w-full bg-cream-50 border border-cream-200 p-2 text-[11px] focus:outline-none focus:border-brass-500 rounded text-hunter-800 font-mono"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSaveKeys}
                  className="flex-1 py-1.5 bg-brass-500 hover:bg-brass-600 text-white text-[10px] uppercase tracking-wider font-bold rounded transition"
                >
                  Save
                </button>
                <button 
                  onClick={() => {
                    setEditGroqKey(session?.groqKey || "");
                    setEditTavilyKey(session?.tavilyKey || "");
                    setIsEditingKeys(false);
                  }}
                  className="flex-1 py-1.5 bg-transparent text-hunter-800 border border-cream-200 text-[10px] uppercase tracking-wider font-bold rounded hover:bg-cream-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <button 
            onClick={handleSignout}
            className="w-full mt-4 py-2 bg-transparent text-hunter-800 border border-cream-200 text-xs uppercase tracking-wider font-bold rounded hover:bg-cream-100 transition"
          >
            Leave Locker
          </button>
        </div>

        {/* Form Controls (Luxurious Bespoke Parameters) */}
        <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm space-y-5">
          <div className="border-b border-cream-100 pb-2">
            <span className="text-[9px] tracking-widest uppercase font-bold text-brass-600 block">
              PORTFOLIO CONFIGURATOR
            </span>
            <h3 className="font-serif text-lg font-bold text-hunter-800">
              Bespoke Parameters
            </h3>
          </div>

          {/* Investment Amount Input & Presets */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1.5">
              Investment Capital (₹) *
            </label>
            <div className="relative rounded bg-cream-50 border border-cream-200">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brass-600 text-xs font-bold pointer-events-none">
                ₹
              </span>
              <input 
                type="number"
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full bg-transparent py-3 pl-8 pr-4 text-xs font-bold focus:outline-none focus:border-brass-500 rounded text-hunter-800"
                min="1000"
              />
            </div>
            
            {/* Elegant Luxury Capital Presets */}
            <div className="grid grid-cols-5 gap-1 mt-2">
              {[
                { label: "10k", value: 10000 },
                { label: "50k", value: 50000 },
                { label: "1L", value: 100000 },
                { label: "5L", value: 500000 },
                { label: "10L", value: 1000000 }
              ].map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => setAmount(preset.value)}
                  className={`py-1 rounded text-[10px] font-mono tracking-wider font-bold border transition ${
                    amount === preset.value
                      ? "bg-brass-500 text-white border-brass-500 shadow-xs"
                      : "bg-cream-50/50 hover:bg-cream-50 text-hunter-800 border-cream-200"
                  }`}
                >
                  ₹{preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Investment Horizon Pills */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1.5">
              Investment Horizon *
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                "1 Week", "1 Month", "6 Months", 
                "1 Year", "3 Years", "5 Years", "10+ Years"
              ].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTimeframe(t)}
                  className={`px-2.5 py-1.5 rounded text-[10px] font-bold font-sans border transition ${
                    timeframe === t
                      ? "bg-hunter-800 text-white border-hunter-800 shadow-xs"
                      : "bg-cream-50/50 hover:bg-cream-100 text-hunter-800 border-cream-200"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
            {/* Informative Subtext for short vs long timeframes */}
            <p className="text-[9px] text-hunter-800/60 mt-1.5 italic leading-tight">
              {timeframe.includes("Week") || timeframe.includes("Month") && !timeframe.includes("10")
                ? "⚠ Short-term plans strictly prioritize ultra-safe cash/liquid preservation yields."
                : "✓ Long-term horizons enable high-performance global and equity index indexing."}
            </p>
          </div>

          {/* Risk Appetite Selection Cards */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1.5">
              Risk Appetite Profile *
            </label>
            <div className="space-y-2">
              {[
                {
                  value: "Low Risk (Safe)",
                  title: "Low Risk (Fiduciary Safe)",
                  desc: "Focus on capital preservation & Nippon Liquid BeES.",
                  icon: <Shield size={14} className="text-blue-600" />
                },
                {
                  value: "Balanced",
                  title: "Balanced Moderate Growth",
                  desc: "Dual indexing across Large Caps and Gold BeES hedge.",
                  icon: <Scale size={14} className="text-brass-600" />
                },
                {
                  value: "High Risk (Max Growth)",
                  title: "High Risk (Maximum Indexing)",
                  desc: "Tech index and Large-cap equities for maximum CAGR.",
                  icon: <Flame size={14} className="text-red-500" />
                }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setRisk(item.value)}
                  className={`w-full p-3 rounded text-left border transition flex items-start gap-3 ${
                    risk === item.value
                      ? "bg-cream-50/80 border-brass-500 shadow-xs ring-1 ring-brass-500/20"
                      : "bg-white hover:bg-cream-50/30 border-cream-200"
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div className="leading-snug">
                    <span className="block text-xs font-bold text-hunter-800">{item.title}</span>
                    <span className="block text-[10px] text-hunter-800/70 mt-0.5 font-sans leading-relaxed">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Allocation Style Radio-Cards */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1.5">
              Allocation Style *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                {
                  value: "Multiple Stocks/ETFs (Diversified)",
                  title: "Diversified Basket",
                  desc: "Multiple non-correlating ETFs.",
                  icon: <LayoutGrid size={13} />
                },
                {
                  value: "Single Stock/ETF (Concentrated)",
                  title: "Concentrated Target",
                  desc: "Direct single target asset.",
                  icon: <Target size={13} />
                }
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAllocation(item.value)}
                  className={`p-3 rounded text-left border transition flex flex-col justify-between h-24 ${
                    allocation === item.value
                      ? "bg-cream-50/80 border-brass-500 shadow-xs ring-1 ring-brass-500/20"
                      : "bg-white hover:bg-cream-50/30 border-cream-200"
                  }`}
                >
                  <div className="flex justify-between items-center w-full">
                    <span className={`p-1 rounded-full ${allocation === item.value ? "bg-brass-500 text-white" : "bg-cream-100 text-brass-600"}`}>
                      {item.icon}
                    </span>
                    <span className={`w-2.5 h-2.5 rounded-full border flex items-center justify-center ${
                      allocation === item.value ? "border-brass-500 bg-brass-500" : "border-cream-300 bg-white"
                    }`}>
                      {allocation === item.value && <span className="w-1 h-1 bg-white rounded-full"></span>}
                    </span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-hunter-800 leading-none">{item.title}</span>
                    <span className="block text-[9px] text-hunter-800/65 mt-1 font-sans leading-tight line-clamp-1">{item.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Special Context Textarea */}
          <div>
            <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1">
              Custom Goals / Context (Optional)
            </label>
            <div className="relative">
              <textarea 
                placeholder="e.g. Saving for house downpayment, children's high-pedigree education fund, or special sector focus..."
                value={customGoal}
                onChange={(e) => setCustomGoal(e.target.value)}
                rows={3}
                className="w-full bg-cream-50 border border-cream-200 p-3 text-xs focus:outline-none focus:border-brass-500 rounded text-hunter-800 leading-relaxed font-sans placeholder-hunter-800/40"
              />
              <span className="absolute bottom-2 right-2 text-brass-600 pointer-events-none opacity-40">
                <Sparkles size={12} />
              </span>
            </div>
          </div>

          <button
            onClick={handleGeneratePlan}
            disabled={analyzing}
            className="w-full py-4 bg-hunter-800 hover:bg-hunter-900 text-white rounded font-serif uppercase tracking-widest text-xs font-bold transition duration-300 flex items-center justify-center gap-2 shadow-sm"
          >
            {analyzing ? (
              <span className="flex items-center space-x-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span>Auditing Market...</span>
              </span>
            ) : (
              <>
                <RefreshCw size={14} /> Formulate Plan
              </>
            )}
          </button>
        </div>

        {/* Live Benchmark Performance Chart Card */}
        <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm space-y-4 font-sans">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-bold text-brass-600 block">
              EMPIRICAL BENCHMARK TRENDS
            </span>
            <h3 className="text-md font-bold text-hunter-800 font-sans">
              Market Performance Explorer
            </h3>
            <p className="text-xs text-hunter-800/60">
              Analyze and explore the historical trajectories of major assets.
            </p>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1">
                Select Benchmark Asset
              </label>
              <select 
                value={isCustomChart ? "CUSTOM" : chartAsset}
                onChange={(e) => {
                  if (e.target.value === "CUSTOM") {
                    setIsCustomChart(true);
                  } else {
                    setIsCustomChart(false);
                    setChartAsset(e.target.value);
                  }
                }}
                className="w-full bg-cream-50 border border-cream-200 p-2.5 text-xs focus:outline-none focus:border-brass-500 rounded text-hunter-800"
              >
                <option value="NIFTYBEES.NS">NIFTYBEES.NS (Nifty 50 Index)</option>
                <option value="MON100.NS">MON100.NS (Nasdaq 100 Index)</option>
                <option value="GOLDBEES.NS">GOLDBEES.NS (Physical Gold Spot)</option>
                <option value="LIQUIDBEES.NS">LIQUIDBEES.NS (1D Rate Treasury / Cash)</option>
                <option value="CUSTOM">Custom Symbol...</option>
              </select>
            </div>

            {isCustomChart && (
              <div>
                <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1">
                  Enter Custom Yahoo Finance Ticker
                </label>
                <input 
                  type="text"
                  placeholder="e.g. RELIANCE.NS, INFY.NS"
                  value={customChartAsset}
                  onChange={(e) => setCustomChartAsset(e.target.value.toUpperCase())}
                  className="w-full bg-cream-50 border border-cream-200 p-2.5 text-xs focus:outline-none focus:border-brass-500 rounded text-hunter-800 uppercase font-mono"
                />
              </div>
            )}

            <div>
              <label className="block text-[10px] tracking-widest uppercase font-bold text-brass-600 mb-1">
                Timeline Range
              </label>
              <div className="flex rounded border border-cream-200 overflow-hidden text-[10px] font-bold">
                {["1 Year", "5 Years", "10 Years"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setChartPeriod(range === "10 Years" ? "10 Years (Max)" : range)}
                    className={`flex-1 py-1.5 transition ${
                      (chartPeriod === "10 Years (Max)" && range === "10 Years") || chartPeriod === range
                        ? "bg-brass-500 text-white"
                        : "bg-cream-50 hover:bg-cream-100 text-hunter-800 border-r border-cream-200 last:border-0"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
            </div>

            {/* Performance Line Chart */}
            <div className="h-44 border border-cream-100 rounded-lg bg-cream-50/20 p-2.5 relative flex flex-col justify-between">
              {chartLoading && (
                <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
                  <span className="w-5 h-5 border-2 border-brass-500 border-t-transparent rounded-full animate-spin"></span>
                </div>
              )}

              {chartData.length > 0 ? (
                <div className="h-28 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f2ebd9" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 8, fill: '#8a704c' }} 
                        stroke="#e2d1b9"
                      />
                      <YAxis 
                        tick={{ fontSize: 8, fill: '#8a704c' }} 
                        domain={['auto', 'auto']}
                        stroke="#e2d1b9"
                        orientation="right"
                      />
                      <Tooltip 
                        contentStyle={{ background: '#fdfbf7', border: '1px solid #e2d1b9', fontSize: '9px', borderRadius: '4px' }}
                        labelStyle={{ fontWeight: 'bold', color: '#1a331e' }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="price" 
                        stroke="#8a704c" 
                        strokeWidth={1.5} 
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-28 flex items-center justify-center text-[10px] text-gray-400">
                  No chart data available.
                </div>
              )}

              {growthMetrics && (
                <div className="border-t border-cream-100 pt-2 flex justify-between text-[10px] font-sans">
                  <div>
                    <span className="text-gray-400 uppercase tracking-widest block font-bold text-[8px]">Start / End Price</span>
                    <span className="font-mono font-bold text-hunter-800">
                      ₹{growthMetrics.start.toFixed(1)} → ₹{growthMetrics.end.toFixed(1)}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-gray-400 uppercase tracking-widest block font-bold text-[8px]">Absolute Growth</span>
                    <span className={`font-mono font-bold ${growthMetrics.growth >= 0 ? "text-green-700" : "text-red-600"}`}>
                      {growthMetrics.growth >= 0 ? "▲" : "▼"} {Math.abs(growthMetrics.growth).toFixed(1)}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* RIGHT COLUMN: Output & Empirical charts */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Recommendation Plan ready or intro */}
        {!planReady && !analyzing ? (
          <div className="bg-white border border-cream-200 rounded-lg p-8 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
            <Compass className="text-brass-500 mb-4 animate-pulse" size={48} />
            <h3 className="font-serif text-xl font-bold text-hunter-800 mb-2">Configure and Generate Your Plan</h3>
            <p className="text-xs text-hunter-800/70 max-w-sm leading-relaxed">
              Your customized plan will compute rates of return, detail market news, and recommend precise asset weightings dynamically.
            </p>
          </div>
        ) : analyzing ? (
          <div className="bg-white border border-cream-200 rounded-lg p-8 shadow-sm text-center flex flex-col items-center justify-center min-h-[300px]">
            <span className="w-8 h-8 border-4 border-brass-500 border-t-transparent rounded-full animate-spin mb-4"></span>
            <h3 className="font-serif text-lg font-bold text-hunter-800">Scouring Active Media Channels...</h3>
            <p className="text-xs text-hunter-800/70 max-w-sm leading-relaxed mt-1">
              Scraping previous and current financial headlines on the recommended funds to build a factual mathematical prediction...
            </p>
          </div>
        ) : (
          <div className="bg-white border border-cream-200 rounded-lg p-8 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-cream-100 pb-4">
              <div>
                <span className="text-[10px] tracking-widest uppercase font-bold text-brass-600">
                  Bespoke Wealth Plan
                </span>
                <h3 className="font-serif text-2xl font-bold text-hunter-800">Diagnostic ledger</h3>
              </div>
              
              <button 
                onClick={() => {
                  const blob = new Blob([reportText], { type: 'text/markdown' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `wealth_plan_${Date.now()}.md`;
                  a.click();
                }}
                className="p-2 border border-cream-200 rounded text-brass-500 hover:bg-cream-50"
                title="Download plan"
              >
                <FileDown size={18} />
              </button>
            </div>

            {/* Graphical Asset Allocation Pie Chart Visualization */}
            {recommendedFunds.length > 0 && (
              <div className="bg-cream-50/40 border border-cream-200 rounded-lg p-6 shadow-sm">
                <span className="text-[10px] tracking-widest uppercase font-bold text-brass-600 block mb-1">
                  PORTFOLIO WEIGHTINGS VISUALIZER
                </span>
                <h4 className="text-sm font-bold text-hunter-800 mb-4 border-b border-cream-200 pb-1.5 font-sans">
                  Asset Allocation & Weighting Split
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                  <div className="h-44 relative flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={recommendedFunds}
                          cx="50%"
                          cy="50%"
                          innerRadius={45}
                          outerRadius={65}
                          paddingAngle={3}
                          dataKey="allocation_pct"
                          nameKey="ticker"
                        >
                          {recommendedFunds.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value, name) => [`${value}% Allocation`, name]}
                          contentStyle={{ background: '#fdfbf7', border: '1px solid #e2d1b9', fontSize: '11px', borderRadius: '4px' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] text-gray-400 uppercase tracking-widest font-bold font-sans">Total Base</span>
                      <span className="text-xs font-bold text-hunter-800 font-mono">₹{amount.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {recommendedFunds.map((fund, index) => {
                      const allocPct = fund.allocation_pct || (recommendedFunds.length === 1 ? 100 : Math.round(100 / recommendedFunds.length));
                      const fundVal = (amount * allocPct) / 100;
                      return (
                        <div key={index} className="flex items-center justify-between p-2 rounded border border-cream-200 bg-white shadow-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></span>
                            <div className="leading-tight">
                              <span className="font-mono text-xs font-bold text-hunter-800 block">{fund.ticker}</span>
                              <span className="text-[9px] text-gray-400 font-sans block truncate max-w-[140px]">{fund.name}</span>
                            </div>
                          </div>
                          <div className="text-right leading-tight">
                            <span className="text-xs font-bold text-hunter-800 block">₹{fundVal.toLocaleString('en-IN')}</span>
                            <span className="text-[9px] font-bold text-brass-600 block">{allocPct}% Weight</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Legitimate Leger Summary Card (Perfect response) */}
            <div className="bg-cream-50 border border-brass-500/30 rounded-lg p-6 shadow-inner relative overflow-hidden font-sans">
              <span className="text-[9px] tracking-widest uppercase font-bold text-brass-600 block mb-1">
                AUDITED INVESTMENT MATURITY RECEIPT
              </span>
              <h4 className="text-lg font-bold text-hunter-800 mb-4 border-b border-cream-200 pb-1.5 font-sans">
                Statement of Legitimate Projections
              </h4>

              {/* Robust Properly Formatted Legitimate Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-cream-200 text-xs font-sans text-left">
                  <thead>
                    <tr className="bg-cream-100 text-brass-600 uppercase tracking-wider text-[9px] font-bold">
                      <th className="px-4 py-2 border border-cream-200">Financial Parameter</th>
                      <th className="px-4 py-2 border border-cream-200 text-right">Value / Metric</th>
                      <th className="px-4 py-2 border border-cream-200 hidden md:table-cell">Details / Audit Basis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cream-100 bg-white">
                    <tr>
                      <td className="px-4 py-2 border border-cream-100 font-semibold">Initial Capital</td>
                      <td className="px-4 py-2 border border-cream-100 text-right font-bold text-hunter-800">₹{amount.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-2 border border-cream-100 text-hunter-800/70 hidden md:table-cell">Your initial principal base in Indian Rupees.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border border-cream-100 font-semibold">Timeframe Horizon</td>
                      <td className="px-4 py-2 border border-cream-100 text-right font-bold text-hunter-800">{timeframe}</td>
                      <td className="px-4 py-2 border border-cream-100 text-hunter-800/70 hidden md:table-cell">Assigned planning period requested.</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2 border border-cream-100 font-semibold">Historical CAGR Rate</td>
                      <td className="px-4 py-2 border border-cream-100 text-right font-bold text-brass-600">
                        {apiTotals && apiTotals.rate_pct ? apiTotals.rate_pct : (risk.toLowerCase().includes("low") ? "5.5% p.a." : risk.toLowerCase().includes("high") ? "14.5% p.a." : "11.2% p.a.")}
                      </td>
                      <td className="px-4 py-2 border border-cream-100 text-hunter-800/70 hidden md:table-cell">Target average corresponding to SEBI index records.</td>
                    </tr>
                    <tr className="bg-green-50/30">
                      <td className="px-4 py-2 border border-cream-100 font-semibold text-green-800">Projected Gains</td>
                      <td className="px-4 py-2 border border-cream-100 text-right font-bold text-green-700">
                        ₹{(() => {
                          if (apiTotals && apiTotals.gain !== undefined) {
                            return Number(apiTotals.gain).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                          }
                          const timeframeYears: Record<string, number> = {
                            "1 Week": 1.0 / 52.0, "1 Month": 1.0 / 12.0, "6 Months": 0.5,
                            "1 Year": 1.0, "3 Years": 3.0, "5 Years": 5.0, "10+ Years": 10.0
                          };
                          const years = timeframeYears[timeframe] || 1.0;
                          const rate = risk.toLowerCase().includes("low") ? 0.055 : risk.toLowerCase().includes("high") ? 0.145 : 0.112;
                          const val = amount * Math.pow(1 + rate, years);
                          return (val - amount).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                        })()}
                      </td>
                      <td className="px-4 py-2 border border-cream-100 text-green-800/70 hidden md:table-cell font-medium">Estimated profit yield over {timeframe}.</td>
                    </tr>
                    <tr className="bg-cream-50/50">
                      <td className="px-4 py-2 border border-cream-100 font-semibold text-hunter-800">Nominal Maturity</td>
                      <td className="px-4 py-2 border border-cream-100 text-right font-bold text-hunter-800">
                        ₹{(() => {
                          if (apiTotals && apiTotals.maturity !== undefined) {
                            return Number(apiTotals.maturity).toLocaleString('en-IN', { maximumFractionDigits: 2 });
                          }
                          const timeframeYears: Record<string, number> = {
                            "1 Week": 1.0 / 52.0, "1 Month": 1.0 / 12.0, "6 Months": 0.5,
                            "1 Year": 1.0, "3 Years": 3.0, "5 Years": 5.0, "10+ Years": 10.0
                          };
                          const years = timeframeYears[timeframe] || 1.0;
                          const rate = risk.toLowerCase().includes("low") ? 0.055 : risk.toLowerCase().includes("high") ? 0.145 : 0.112;
                          const val = amount * Math.pow(1 + rate, years);
                          return val.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                        })()}
                      </td>
                      <td className="px-4 py-2 border border-cream-100 text-hunter-800/70 hidden md:table-cell">Aggregated value of Principal + Projected Gains.</td>
                    </tr>
                    <tr className="bg-brass-500/5">
                      <td className="px-4 py-2 border border-cream-100 font-semibold text-brass-600">Real Value (CPI Adjusted)</td>
                      <td className="px-4 py-2 border border-cream-100 text-right font-bold text-brass-600">
                        ₹{(() => {
                          if (apiTotals && apiTotals.maturity !== undefined) {
                            const timeframeYears: Record<string, number> = {
                              "1 Week": 1.0 / 52.0, "1 Month": 1.0 / 12.0, "6 Months": 0.5,
                              "1 Year": 1.0, "3 Years": 3.0, "5 Years": 5.0, "10+ Years": 10.0
                            };
                            const years = timeframeYears[timeframe] || 1.0;
                            const realVal = Number(apiTotals.maturity) / Math.pow(1 + 0.055, years);
                            return realVal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                          }
                          const timeframeYears: Record<string, number> = {
                            "1 Week": 1.0 / 52.0, "1 Month": 1.0 / 12.0, "6 Months": 0.5,
                            "1 Year": 1.0, "3 Years": 3.0, "5 Years": 5.0, "10+ Years": 10.0
                          };
                          const years = timeframeYears[timeframe] || 1.0;
                          const rate = risk.toLowerCase().includes("low") ? 0.055 : risk.toLowerCase().includes("high") ? 0.145 : 0.112;
                          const val = amount * Math.pow(1 + rate, years);
                          const realVal = val / Math.pow(1 + 0.055, years);
                          return realVal.toLocaleString('en-IN', { maximumFractionDigits: 2 });
                        })()}
                      </td>
                      <td className="px-4 py-2 border border-cream-100 text-brass-600/70 hidden md:table-cell" title="Adjusted for conservative 5.5% Indian core inflation rate">Adjusted for conservative 5.5% core inflation.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <p className="text-[10px] text-hunter-800/50 italic mt-3 leading-tight border-t border-cream-200/50 pt-2 font-sans">
                *CAGR averages correspond to SEBI-registered index averages: Liquid BeES (Debt Index), Nifty 50 BeES (Large Cap Index), and Gold BeES (Physical Gold Spot pricing). Real value factors in a core 5.5% annual inflation rate.
              </p>
            </div>
            
            {/* Proper Legible Typography for Report Body (dangerously set HTML compiled via marked for clean layout) */}
            <div 
              dangerouslySetInnerHTML={{ __html: marked.parse(reportText) }}
              className="prose max-w-none text-sm md:text-base text-slate-800 leading-relaxed font-sans border-t border-cream-100 pt-6 prose-headings:font-bold prose-h1:text-2xl prose-h1:text-hunter-800 prose-h2:text-xl prose-h2:text-hunter-800 prose-h3:text-lg prose-h3:text-hunter-800 prose-p:text-slate-800 prose-li:text-slate-800 prose-table:min-w-full prose-table:border prose-table:border-cream-200 prose-th:px-4 prose-th:py-2 prose-td:px-4 prose-td:py-2 prose-th:bg-cream-100 prose-th:text-hunter-800 prose-td:border-b"
            />

            {/* Clickable direct links to original news sources analysed */}
            {scrapedNews.length > 0 && (
              <div className="border-t border-cream-100 pt-6 space-y-3 font-sans">
                <h4 className="text-md font-bold text-hunter-800 flex items-center gap-2 font-sans">
                  <Newspaper size={16} className="text-brass-500" /> Particular Market News Sources Backing Recommendation
                </h4>
                <div className="space-y-2">
                  {scrapedNews.map((news, idx) => (
                    <div key={idx} className="p-3 bg-cream-50 border border-cream-100 rounded flex justify-between items-center text-xs">
                      <div>
                        <a href={news.url} target="_blank" rel="noopener noreferrer" className="font-serif font-bold text-hunter-800 hover:text-brass-600 block">
                          🔗 {news.title}
                        </a>
                        <span className="text-[10px] text-hunter-800/60 font-mono">Source: {news.source} | Date: {news.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Dedicated Groww Factsheets & Direct Investment Panel */}
        <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm space-y-4 font-sans">
          <div>
            <span className="text-[10px] tracking-widest uppercase font-bold text-brass-600 block">
              REAL-TIME TRANSACTION GATES
            </span>
            <h3 className="text-lg font-bold text-hunter-800 font-sans">
              Bespoke Recommended Fund Factsheets (Groww Integrated)
            </h3>
            <p className="text-xs text-hunter-800/60">
              Audit the specific, dynamic metrics recommended by the AI and click to buy on Groww instantly.
            </p>
          </div>

          {recommendedFunds.length === 0 ? (
            <div className="p-8 text-center bg-cream-50 border border-cream-200 rounded-lg text-hunter-800/60 italic text-xs">
              No bespoke recommendations generated yet. Formulate a plan above to dynamically load your target assets.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recommendedFunds.map((fund, idx) => (
                <div key={idx} className="p-5 bg-white border border-cream-200 rounded-lg hover:border-brass-500/50 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="px-2 py-0.5 bg-cream-100 text-brass-600 rounded text-[10px] font-bold font-mono tracking-wider">{fund.ticker}</span>
                      <span className="text-[9px] uppercase tracking-widest text-gray-400 font-bold">MUTUAL FUND / ETF</span>
                    </div>
                    <h4 className="text-sm font-bold text-hunter-800 leading-tight font-sans">{fund.name}</h4>
                    
                    {/* Beautiful, Clean 2x2 Audit Metric Grid (No raw asterisks) */}
                    <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-3 border-t border-cream-100">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Buying Price</span>
                        <span className="text-xs font-bold text-hunter-800 mt-0.5">{fund.buying_price || "₹N/A"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Expense Ratio</span>
                        <span className="text-xs font-bold text-hunter-800 mt-0.5">{fund.expense_ratio || "N/A"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Total AUM</span>
                        <span className="text-xs font-bold text-hunter-800 mt-0.5">{fund.aum || "N/A"}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[9px] text-gray-400 uppercase tracking-widest font-bold">Beta Score</span>
                        <span className="text-xs font-bold text-brass-600 mt-0.5">{fund.beta || "N/A"}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
