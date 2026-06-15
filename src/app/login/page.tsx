"use client";

import { useState } from "react";
import { useRouter as useAppRouter } from "next/navigation";
import { KeyRound, Lock, User, Sparkles, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useAppRouter();
  const [selectedIdentity, setSelectedIdentity] = useState("Lord Sterling");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [tavilyKey, setTavilyKey] = useState("tvly-sk-default-heritage-key");
  const [groqKey, setGroqKey] = useState("");
  const [isOAuthLogging, setIsOAuthLogging] = useState(false);

  const handleOAuthLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!username.trim() || !password.trim()) {
      setLoginError("Both username and password are strictly mandatory.");
      return;
    }

    // Classy validation matching our elegant elite personas
    const isLordSterling = username.toLowerCase() === "sterling" && password === "sterling_heritage_2026";
    const isLadyAbigail = username.toLowerCase() === "abigail" && password === "abigail_heritage_2026";

    if (!isLordSterling && !isLadyAbigail) {
      setLoginError("Incorrect credentials. Try 'sterling' / 'sterling_heritage_2026' or 'abigail' / 'abigail_heritage_2026'.");
      return;
    }

    // Match chosen identity to username if entered
    const finalIdentity = isLordSterling ? "Lord Sterling" : "Lady Abigail";

    setIsOAuthLogging(true);
    setTimeout(() => {
      // Create user session details
      const userSession = {
        name: finalIdentity,
        email: `${finalIdentity.toLowerCase().replace(" ", "")}@heritage.club`,
        tavilyKey: tavilyKey || "tvly-sk-default-heritage-key",
        groqKey: groqKey || "",
        avatar: finalIdentity === "Lord Sterling" ? "🎩" : "👒"
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
    }, 1200);
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <form 
        onSubmit={handleOAuthLogin}
        className="w-full max-w-md bg-white border border-cream-200 rounded-lg p-8 shadow-sm flex flex-col items-center"
      >
        <div className="w-12 h-12 rounded-full border border-brass-500 flex items-center justify-center text-brass-500 mb-6 bg-cream-50">
          <KeyRound size={20} />
        </div>

        <h2 className="font-serif text-2xl md:text-3xl font-bold text-hunter-800 tracking-tight text-center mb-1 font-sans">
          Bespoke Portal
        </h2>
        <p className="text-xs uppercase tracking-widest text-brass-600 mb-8 font-bold font-sans">
          OAuth2 Verified Entrance
        </p>

        {/* Credentials Form Block */}
        <div className="w-full space-y-4 mb-6">
          <div>
            <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-1 font-sans">
              Cabinet Username *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brass-500">
                <User size={14} />
              </span>
              <input
                type="text"
                placeholder="e.g., sterling"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-cream-50 border border-cream-200 rounded text-xs focus:outline-none focus:border-brass-500 text-hunter-800 font-sans"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-1 font-sans">
              Cabinet Password *
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-brass-500">
                <Lock size={14} />
              </span>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-cream-50 border border-cream-200 rounded text-xs focus:outline-none focus:border-brass-500 text-hunter-800 font-sans"
                required
              />
            </div>
          </div>
        </div>

        {/* API Keys Configuration */}
        <div className="w-full space-y-4 mb-6 border-t border-cream-100 pt-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-1 font-sans">
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
                className="w-full pl-9 pr-4 py-3 bg-cream-50 border border-cream-200 rounded text-xs focus:outline-none focus:border-brass-500 text-hunter-800 font-sans"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-1 font-sans">
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
                className="w-full pl-9 pr-4 py-3 bg-cream-50 border border-cream-200 rounded text-xs focus:outline-none focus:border-brass-500 text-hunter-800 font-sans"
              />
            </div>
            <p className="text-[10px] text-hunter-800/60 mt-1 italic leading-tight font-sans">
              Stored locally on your browser for privacy. Not shared on cloud.
            </p>
          </div>
        </div>

        {loginError && (
          <div className="w-full p-3 bg-red-50 border border-red-200 rounded text-xs text-red-600 mb-6 flex items-center gap-2 font-sans font-medium">
            <AlertCircle size={14} /> {loginError}
          </div>
        )}

        {/* OAuth Connect Button */}
        <button
          type="submit"
          disabled={isOAuthLogging}
          className="w-full py-4 bg-brass-500 hover:bg-brass-600 text-white rounded font-sans uppercase tracking-widest text-xs font-bold transition duration-300 flex items-center justify-center gap-2 shadow-sm"
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
      </form>
    </div>
  );
}
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
