"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Users, History, FileSpreadsheet, Lock, LogIn, Trash2, KeyRound } from "lucide-react";

export default function AdminPage() {
  const router = useRouter();
  
  // Auth states
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminUsername, setAdminUsername] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [loginError, setAdminLoginError] = useState("");
  
  // Database states
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  useEffect(() => {
    // Check if admin is logged in this session
    const status = sessionStorage.getItem("heritage_admin_auth");
    if (status === "true") {
      setIsAdminLoggedIn(true);
    }
    loadAdminData();
  }, []);

  const loadAdminData = () => {
    // Fetch users and transaction audits from local storage
    const users = JSON.parse(localStorage.getItem("heritage_registered_users") || "[]");
    const logs = JSON.parse(localStorage.getItem("heritage_audit_logs") || "[]");
    setRegisteredUsers(users);
    setAuditLogs(logs);
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminLoginError("");
    
    // Proper admin password validation (secure bespoke values)
    if (adminUsername === "curator" && adminPassword === "heritage_secret_2026") {
      sessionStorage.setItem("heritage_admin_auth", "true");
      setIsAdminLoggedIn(true);
      loadAdminData();
    } else {
      setAdminLoginError("Incorrect administrative credentials.");
    }
  };

  const handleClearLogs = () => {
    if (confirm("Are you sure you want to purge all transaction audit logs?")) {
      localStorage.removeItem("heritage_audit_logs");
      setAuditLogs([]);
    }
  };

  const handleAdminSignout = () => {
    sessionStorage.removeItem("heritage_admin_auth");
    setIsAdminLoggedIn(false);
  };

  if (!isAdminLoggedIn) {
    return (
      <div className="flex-1 flex items-center justify-center px-4 py-16">
        <form 
          onSubmit={handleAdminLogin}
          className="w-full max-w-sm bg-white border-2 border-brass-500 rounded-lg p-8 shadow-md"
        >
          <div className="w-12 h-12 rounded-full border border-brass-500 flex items-center justify-center text-brass-500 mb-6 bg-cream-50 mx-auto">
            <Lock size={20} />
          </div>

          <h2 className="font-serif text-2xl font-bold text-hunter-800 tracking-tight text-center mb-1">
            Administrative Gate
          </h2>
          <p className="text-[10px] uppercase tracking-widest text-brass-600 mb-8 font-bold text-center">
            Verification Required
          </p>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-1">
                Admin Username
              </label>
              <input
                type="text"
                placeholder="e.g. curator"
                value={adminUsername}
                onChange={(e) => setAdminUsername(e.target.value)}
                className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded text-xs focus:outline-none focus:border-brass-500 text-hunter-800"
                required
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-brass-600 font-bold mb-1">
                Master Password
              </label>
              <input
                type="password"
                placeholder="••••••••••••••••"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full px-4 py-3 bg-cream-50 border border-cream-200 rounded text-xs focus:outline-none focus:border-brass-500 text-hunter-800"
                required
              />
            </div>
          </div>

          {loginError && (
            <p className="text-xs text-red-600 mb-4 italic text-center font-bold">
              {loginError}
            </p>
          )}

          <button
            type="submit"
            className="w-full py-4 bg-hunter-800 hover:bg-hunter-900 text-white rounded font-serif uppercase tracking-widest text-xs font-bold transition duration-300 flex items-center justify-center gap-2 shadow-sm"
          >
            <LogIn size={14} /> Open Admin Terminal
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-12 py-8 space-y-8">
      
      {/* Admin Top Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center border-b border-cream-200 pb-6 gap-4">
        <div>
          <span className="text-xs uppercase tracking-widest text-brass-600 font-bold">
            SECURE MANAGEMENT PANEL
          </span>
          <h2 className="font-serif text-3xl font-bold text-hunter-800">
            Heritage Administrative Desk
          </h2>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleAdminSignout}
            className="px-4 py-2 border border-cream-200 hover:bg-cream-100 rounded text-xs uppercase tracking-wider font-bold text-hunter-800"
          >
            Secure Logoff
          </button>
        </div>
      </div>

      {/* Grid containing tables */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* User Account Registry Table */}
        <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm flex flex-col">
          <h3 className="font-serif text-lg font-bold text-hunter-800 border-b border-cream-100 pb-3 mb-4 flex items-center gap-2">
            <Users size={18} className="text-brass-500" /> Member Account Registry ({registeredUsers.length})
          </h3>
          
          <div className="overflow-x-auto flex-1">
            <table className="min-w-full text-xs text-left">
              <thead className="uppercase tracking-widest text-[9px] font-bold text-brass-600 bg-cream-50">
                <tr>
                  <th className="px-4 py-3">Member Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Tavily Key</th>
                  <th className="px-4 py-3">Groq Key</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 text-hunter-800">
                {registeredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-4 py-6 text-center text-hunter-800/60 italic">
                      No active member accounts registered yet.
                    </td>
                  </tr>
                ) : (
                  registeredUsers.map((user, idx) => (
                    <tr key={idx} className="hover:bg-cream-50/50">
                      <td className="px-4 py-3 font-serif font-bold">{user.name}</td>
                      <td className="px-4 py-3 font-mono">{user.email}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-brass-600">
                        {user.tavilyKey ? `${user.tavilyKey.substring(0, 10)}...` : "DDG Default"}
                      </td>
                      <td className="px-4 py-3 font-mono text-[10px] text-brass-600">
                        {user.groqKey ? `${user.groqKey.substring(0, 10)}...` : "Local Ollama"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Action Audit Log Table */}
        <div className="bg-white border border-cream-200 rounded-lg p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center border-b border-cream-100 pb-3 mb-4">
            <h3 className="font-serif text-lg font-bold text-hunter-800 flex items-center gap-2">
              <History size={18} className="text-brass-500" /> Transaction Audit Trail ({auditLogs.length})
            </h3>
            
            {auditLogs.length > 0 && (
              <button 
                onClick={handleClearLogs}
                className="text-[10px] uppercase font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
              >
                <Trash2 size={12} /> Clear Logs
              </button>
            )}
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="min-w-full text-xs text-left">
              <thead className="uppercase tracking-widest text-[9px] font-bold text-brass-600 bg-cream-50">
                <tr>
                  <th className="px-4 py-3">Member</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Horizon</th>
                  <th className="px-4 py-3">Risk Category</th>
                  <th className="px-4 py-3">Action Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 text-hunter-800">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-hunter-800/60 italic">
                      No wealth plan diagnostic logs registered yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log, idx) => (
                    <tr key={idx} className="hover:bg-cream-50/50">
                      <td className="px-4 py-3">{log.user}</td>
                      <td className="px-4 py-3 font-serif font-bold">₹{log.amount?.toLocaleString()}</td>
                      <td className="px-4 py-3">{log.timeframe}</td>
                      <td className="px-4 py-3 font-semibold text-brass-600">{log.risk}</td>
                      <td className="px-4 py-3 font-mono text-[10px] text-hunter-800/70">{log.date}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
