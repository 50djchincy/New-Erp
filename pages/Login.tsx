
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, ChevronRight, FlaskConical, Zap, Info, RefreshCw } from 'lucide-react';

const Login: React.FC = () => {
  const { login, mode, toggleMode, resetSandbox } = useApp();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
    } catch (error) {
      console.error("Login failed", error);
      alert("Authentication failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-8">
        {/* Logo Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 rounded-[2rem] text-white shadow-xl shadow-blue-200/50 transform -rotate-6">
            <span className="text-4xl font-bold tracking-tighter">M</span>
          </div>
          <div className="space-y-1">
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Mozzarella</h1>
            <p className="text-slate-500 font-medium">Smart Restaurant Expense Control</p>
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-slate-200/60 p-8 md:p-10">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-bold text-slate-900">Sign In</h2>
            <button 
              onClick={toggleMode}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                mode === 'sandbox' 
                ? 'bg-orange-50 text-orange-600 ring-1 ring-orange-200' 
                : 'bg-blue-50 text-blue-600 ring-1 ring-blue-200'
              }`}
            >
              {mode === 'sandbox' ? <FlaskConical size={14} /> : <Zap size={14} />}
              {mode.toUpperCase()}
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="chef@mozzarella.io"
                className="w-full h-14 px-5 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                required={mode === 'live'}
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Password</label>
                <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-700">Forgot?</button>
              </div>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-14 px-5 bg-slate-50 border-none rounded-2xl text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-blue-500 transition-all font-medium"
                required={mode === 'live'}
              />
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="group relative w-full h-14 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 transition-all hover:bg-blue-700 hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center overflow-hidden"
            >
              <span className={loading ? 'opacity-0' : 'opacity-100'}>
                {mode === 'sandbox' ? 'Enter Sandbox' : 'Login Now'}
              </span>
              <div className={`absolute transition-all ${loading ? 'opacity-100' : 'opacity-0'}`}>
                <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              </div>
              {!loading && (
                <div className="absolute right-6 opacity-0 group-hover:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0">
                  <ChevronRight size={20} />
                </div>
              )}
            </button>
          </form>

          {mode === 'sandbox' && (
            <div className="mt-8 flex flex-col gap-4">
              <div className="p-4 bg-orange-50/50 rounded-2xl border border-orange-100 flex gap-3">
                <div className="shrink-0 text-orange-400 mt-0.5">
                  <Info size={18} />
                </div>
                <p className="text-[13px] leading-relaxed text-orange-800">
                  Sandbox mode uses local storage. Any data added will stay on this device only.
                </p>
              </div>
              <button 
                onClick={() => { if(confirm('Reset all local data?')) resetSandbox(); }}
                className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 hover:text-red-500 transition-colors uppercase tracking-widest"
              >
                <RefreshCw size={14} />
                Reset Sandbox
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-center gap-6 text-slate-400 font-medium text-sm">
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy</a>
          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          <a href="#" className="hover:text-slate-900 transition-colors">Security</a>
          <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
          <a href="#" className="hover:text-slate-900 transition-colors">Help</a>
        </div>
      </div>
    </div>
  );
};

export default Login;
