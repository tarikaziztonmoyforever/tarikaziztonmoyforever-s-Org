import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { PlusCircle, UserPlus, Loader2, ShieldCheck, Hash, Users, Coffee, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bn } from '../i18n';

export default function MessSetup() {
  const { user, profile, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'select' | 'create' | 'join mess'>('select');
  const [messName, setMessName] = useState('');
  const [messCode, setMessCode] = useState('');

  const handleCreateMess = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUserId = user?.id || profile?.id;
    if (!currentUserId) return;
    setLoading(true);

    try {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const { data: messData, error: messError } = await supabase
        .from('messes')
        .insert({
          mess_name: messName,
          unique_code: code,
          admin_id: currentUserId,
          daily_meal_limit: 3,
        })
        .select()
        .single();

      if (messError) throw messError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ mess_id: messData.id, role: 'admin' })
        .eq('id', currentUserId);

      if (profileError) throw profileError;
      await refreshProfile();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleJoinMess = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUserId = user?.id || profile?.id;
    if (!currentUserId) return;
    setLoading(true);

    try {
      const { data: messData, error: messError } = await supabase
        .from('messes')
        .select('id')
        .eq('unique_code', messCode.toUpperCase())
        .single();

      if (messError) throw new Error('Invalid mess code');

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ mess_id: messData.id, role: 'member' })
        .eq('id', currentUserId);

      if (profileError) throw profileError;
      await refreshProfile();
    } catch (err: any) {
      alert(err.message);
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

      <AnimatePresence mode="wait">
        {mode === 'select' ? (
          <motion.div
            key="select"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-10"
          >
            <div
              onClick={() => setMode('create')}
              className="premium-card p-16 flex flex-col items-center text-center group cursor-pointer hover:border-blue-200 transition-all"
            >
              <div className="w-24 h-24 bg-blue-50 rounded-[2.5rem] flex items-center justify-center text-blue-600 mb-10 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-2xl shadow-blue-500/10 border border-blue-100">
                <PlusCircle size={48} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">মেস তৈরি করুন</h2>
              <p className="text-slate-500 font-bold text-lg leading-relaxed mb-10">
                অ্যাডমিন হিসেবে একটি নতুন মেস শুরু করুন। আপনি সদস্য, মিল এবং অর্থ পরিচালনা করতে পারবেন।
              </p>
              <div className="mt-auto flex items-center gap-3 text-blue-600 font-black uppercase tracking-[0.2em] text-sm">
                শুরু করুন <ArrowRight size={20} />
              </div>
            </div>

            <div
              onClick={() => setMode('join')}
              className="premium-card p-16 flex flex-col items-center text-center group cursor-pointer hover:border-emerald-200 transition-all"
            >
              <div className="w-24 h-24 bg-emerald-50 rounded-[2.5rem] flex items-center justify-center text-emerald-600 mb-10 group-hover:bg-emerald-600 group-hover:text-white transition-all shadow-2xl shadow-emerald-500/10 border border-emerald-100">
                <UserPlus size={48} />
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">মেসে যোগ দিন</h2>
              <p className="text-slate-500 font-bold text-lg leading-relaxed mb-10">
                আপনার কাছে কি মেস কোড আছে? আপনার বিদ্যমান মেসে যোগ দিতে এবং ট্র্যাকিং শুরু করতে এটি লিখুন।
              </p>
              <div className="mt-auto flex items-center gap-3 text-emerald-600 font-black uppercase tracking-[0.2em] text-sm">
                যোগ দিন <ArrowRight size={20} />
              </div>
            </div>
          </motion.div>
        ) : mode === 'create' ? (
          <motion.div
            key="create"
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -30 }}
            className="w-full max-w-lg bg-white/80 backdrop-blur-2xl border border-white rounded-[3rem] p-12 md:p-16 shadow-premium"
          >
            <div className="text-center mb-12">
              <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 mb-8">
                <Coffee size={40} />
              </div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">নতুন মেস তৈরি করুন</h1>
              <p className="text-slate-500 font-bold text-lg">আপনার মেসের একটি অনন্য নাম দিন</p>
            </div>

            <form onSubmit={handleCreateMess} className="space-y-8">
              <div className="space-y-3">
                <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-2">মেসের নাম</label>
                <div className="relative">
                  <Users className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
                  <input
                    type="text"
                    required
                    value={messName}
                    onChange={(e) => setMessName(e.target.value)}
                    className="input-field pl-14 py-5 px-6 text-lg"
                    placeholder="উদা: ড্রিম মেস"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-3"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle2 size={22} /> <span className="text-lg">মেস তৈরি করুন</span></>}
              </button>
              
              <button
                type="button"
                onClick={() => setMode('select')}
                className="w-full text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-colors"
              >
                পিছনে যান
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="join"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="w-full max-w-md bg-white/80 backdrop-blur-xl border border-white rounded-[2.5rem] p-10 shadow-premium"
          >
            <div className="text-center mb-10">
              <div className="w-16 h-16 bg-emerald-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-xl shadow-emerald-500/30 mb-6">
                <ShieldCheck size={32} />
              </div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">মেসে যোগ দিন</h1>
              <p className="text-slate-500 font-medium">যোগ দিতে ৬-সংখ্যার কোডটি লিখুন</p>
            </div>

            <form onSubmit={handleJoinMess} className="space-y-6">
              <div className="space-y-2">
                <label className="block text-sm font-black uppercase tracking-widest text-slate-400 ml-1">মেস কোড</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    required
                    value={messCode}
                    onChange={(e) => setMessCode(e.target.value)}
                    className="input-field pl-12 uppercase tracking-[0.5em] font-black"
                    placeholder="ABCDEF"
                    maxLength={6}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" size={22} /> : <><CheckCircle2 size={22} /> <span className="text-lg">মেসে যোগ দিন</span></>}
              </button>

              <button
                type="button"
                onClick={() => setMode('select')}
                className="w-full text-slate-400 hover:text-slate-900 font-black uppercase tracking-widest text-[10px] transition-colors"
              >
                পিছনে যান
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
