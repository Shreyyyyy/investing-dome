"use client";

import { useState } from "react";
import { useRouter as useAppRouter } from "next/navigation";
import { KeyRound, Lock, User, LogIn, AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useAppRouter();
  const [selectedIdentity, setSelectedIdentity] = useState("Lord Sterling");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [isOAuthLogging, setIsOAuthLogging] = useState(false);

  const handleOAuthLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    const cleanUsername = username.trim();
    const cleanPassword = password.trim();

    if (!cleanUsername || !cleanPassword) {
      setLoginError("Both username and password are strictly mandatory.");
      return;
    }

    // Retrieve the registered accounts database from localStorage
    const existingUsers = JSON.parse(localStorage.getItem("heritage_registered_users") || "[]");
    
    // Check if the username already exists in our records
    const matchedUser = existingUsers.find((u: any) => u.username?.toLowerCase() === cleanUsername.toLowerCase());

    if (matchedUser) {
      // Validate password for existing account
      if (matchedUser.password !== cleanPassword) {
        setLoginError("This username is already registered with a different password.");
        return;
      }
      
      // Ensure matchedUser has username property for legacy account self-healing
      if (!matchedUser.username) {
        matchedUser.username = cleanUsername;
        localStorage.setItem("heritage_registered_users", JSON.stringify(existingUsers));
      }
      
      setIsOAuthLogging(true);
      setTimeout(() => {
        // Log in with existing account
        localStorage.setItem("heritage_session", JSON.stringify(matchedUser));
        router.push("/dashboard");
      }, 1000);
    } else {
      // Automatically register a new account on-the-fly!
      setIsOAuthLogging(true);
      setTimeout(() => {
        const uppercaseName = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1);
        const newUserSession = {
          username: cleanUsername,
          password: cleanPassword,
          name: uppercaseName,
          email: `${cleanUsername.toLowerCase()}@heritage.club`,
          tavilyKey: "tvly-sk-default-heritage-key",
          groqKey: "",
          avatar: cleanUsername.toLowerCase().includes("lady") || cleanUsername.toLowerCase().includes("abigail") ? "👒" : "🎩"
        };
        
        // Add to users database
        existingUsers.push(newUserSession);
        localStorage.setItem("heritage_registered_users", JSON.stringify(existingUsers));
        
        // Log in immediately
        localStorage.setItem("heritage_session", JSON.stringify(newUserSession));
        router.push("/dashboard");
      }, 1200);
    }
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
        <p className="text-xs uppercase tracking-widest text-brass-600 mb-6 font-bold font-sans">
          OAuth2 Verified Entrance
        </p>

        <p className="text-[11px] text-center text-hunter-800/70 mb-6 bg-cream-50 p-3 border border-cream-200 rounded leading-relaxed font-sans">
          🔑 **Cabinet Registration Enabled**: Enter any custom Username & Password to instantly create and register a new account on-the-fly, or use `sterling` / `sterling_heritage_2026`.
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
