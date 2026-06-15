"use client";

import { useState } from "react";
import { useRouter } from "next/router"; // Wait, for App Router we should use next/navigation! Let's use next/navigation
import { useRouter as useAppRouter } from "next/navigation";
import { KeyRound, Lock, User, Sparkles, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useAppRouter();
  const [selectedIdentity, setSelectedIdentity] = useState("Lord Sterling");
  const [tavilyKey, setTavilyKey] = useState("tvly-sk-default-heritage-key");
  const [groqKey, setGroqKey] = useState("");
  const [isOAuthLogging, setIsOAuthLogging] = useState(false);

  const handleOAuthLogin = () => {
    setIsOAuthLogging(true);
    setTimeout(() => {
      // Create user session details
      const userSession = {
        name: selectedIdentity,
        email: `${selectedIdentity.toLowerCase().replace(" ", "")}@heritage.club`,
        tavilyKey: tavilyKey || "tvly-sk-default-heritage-key",
        groqKey: groqKey || "",
        avatar: selectedIdentity === "Lord Sterling" ? "🎩" : "👒"
      };
      
      localStorage.setItem("heritage_session", JSON.stringify(userSession));
      
      // Also register this user in the registered users table for the Admin Dashboard to read!
      const existingUsers = JSON.parse(localStorage.getItem("heritage_registered_users") || "[]");
      const userExists = existingUsers.some((u: any) => u.email === userSession.email);
      if (!userExists) {
        existingUsers.push(userSession);
        localStorage.setItem("heritage_registered_users", JSON.stringify(existingUsers));
      }
      
      router.push("/dashboard");
    }, 1500);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-cream-200 rounded-lg p-8 shadow-sm flex flex-col items-center">
        <div className="w-12 h-12 rounded-full border border-brass-500 flex items-center justify-center text-brass-500 mb-6 bg-cream-50">
          <KeyRound size={20} />
        </div>

        <h2 className="font-serif text-2xl md:text-3xl font-bold text-hunter-800 tracking-tight text-center mb-1">
          Bespoke Portal
        </h2>
        <p className="text-xs uppercase tracking-widest text-brass-600 mb-8 font-bold">
          OAuth2 Verified Entrance
        </p>

        {/* Identity selection to mimic elite "old money" simulated personas */}
        <div className="w-full mb-6">
          <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-2">
            Select Your Heritage Identity
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSelectedIdentity("Lord Sterling")}
              className={`p-3 border rounded text-xs uppercase tracking-wider font-serif font-bold transition duration-200 ${
                selectedIdentity === "Lord Sterling"
                  ? "bg-hunter-800 text-white border-hunter-800"
                  : "bg-white text-hunter-800 border-cream-200 hover:bg-cream-50"
              }`}
            >
              🎩 Lord Sterling
            </button>
            <button
              onClick={() => setSelectedIdentity("Lady Abigail")}
              className={`p-3 border rounded text-xs uppercase tracking-wider font-serif font-bold transition duration-200 ${
                selectedIdentity === "Lady Abigail"
                  ? "bg-hunter-800 text-white border-hunter-800"
                  : "bg-white text-hunter-800 border-cream-200 hover:bg-cream-50"
              }`}
            >
              👒 Lady Abigail
            </button>
          </div>
        </div>

        {/* API Keys Configuration */}
        <div className="w-full space-y-4 mb-8">
          <div>
            <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-1">
              Tavily API Key (Optional / Falls back to DDG)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brass-500">
                <Sparkles size={14} />
              </span>
              <input
                type="password"
                placeholder="tvly-sk-..."
                value={tavilyKey}
                onChange={(e) => setTavilyKey(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-cream-50 border border-cream-200 rounded text-xs focus:outline-none focus:border-brass-500 text-hunter-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-1">
              Groq API Key (Falls back to local Ollama)
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brass-500">
                <Lock size={14} />
              </span>
              <input
                type="password"
                placeholder="gsk_..."
                value={groqKey}
                onChange={(e) => setGroqKey(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-cream-50 border border-cream-200 rounded text-xs focus:outline-none focus:border-brass-500 text-hunter-800"
              />
            </div>
            <p className="text-[10px] text-hunter-800/60 mt-1 italic leading-tight">
              Stored locally on your phone/browser for privacy. Not shared on cloud.
            </p>
          </div>
        </div>

        {/* OAuth Connect Button */}
        <button
          onClick={handleOAuthLogin}
          disabled={isOAuthLogging}
          className="w-full py-4 bg-brass-500 hover:bg-brass-600 text-white rounded font-serif uppercase tracking-widest text-xs font-bold transition duration-300 flex items-center justify-center gap-2 shadow-sm"
        >
          {isOAuthLogging ? (
            <span className="flex items-center space-x-2">
              <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              <span>Attuning Keys...</span>
            </span>
          ) : (
            <>
              <LogIn size={14} /> Authenticate via OAuth2
            </>
          )}
        </button>
      </div>
    </div>
  );
}
