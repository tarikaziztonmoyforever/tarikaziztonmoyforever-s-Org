import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { LogIn, UserPlus, Loader2, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { bn } from '../i18n';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        alert('আপনার ইমেইল চেক করুন কনফার্মেশন লিঙ্কের জন্য!');
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 md:p-12">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10 opacity-30 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-400 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-400 rounded-full blur-[150px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-2xl border border-white rounded-[3rem] p-12 md:p-16 shadow-premium"
      >
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 mb-8">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tight mb-4">{bn.appName}</h1>
          <p className="text-slate-500 font-bold text-lg">আপনার প্রিমিয়াম মেস ম্যানেজমেন্ট পার্টনার</p>
        </div>

        <form onSubmit={handleAuth} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-2">ইমেইল অ্যাড্রেস</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field py-5 px-6 text-lg"
              placeholder="name@example.com"
            />
          </div>
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-2">পাসওয়ার্ড</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field py-5 px-6 text-lg"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              className="bg-rose-50 border border-rose-100 text-rose-600 text-sm p-4 rounded-2xl font-bold flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600" />
              {error}
            </motion.div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : isSignUp ? (
              <>
                <UserPlus size={22} />
                <span className="text-lg">অ্যাকাউন্ট তৈরি করুন</span>
              </>
            ) : (
              <>
                <LogIn size={22} />
                <span className="text-lg">লগ ইন করুন</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-blue-600 hover:text-blue-700 text-sm font-black tracking-tight transition-colors"
          >
            {isSignUp ? 'আগে থেকেই অ্যাকাউন্ট আছে? লগ ইন করুন' : "অ্যাকাউন্ট নেই? সাইন আপ করুন"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
