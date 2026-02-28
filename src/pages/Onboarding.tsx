import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { UserCircle, Phone, Loader2, Save, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { bn } from '../i18n';

export default function Onboarding() {
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');

  const handleCreateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase.from('profiles').insert({
        id: user.id,
        full_name: fullName,
        phone: phone,
        role: 'member',
      });

      if (error) throw error;
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

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white/80 backdrop-blur-2xl border border-white rounded-[3rem] p-12 md:p-16 shadow-premium"
      >
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-blue-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 mb-8">
            <ShieldCheck size={40} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">প্রোফাইল সম্পন্ন করুন</h1>
          <p className="text-slate-500 font-bold text-lg">শুরু করার জন্য আপনার সম্পর্কে কিছু তথ্য দিন</p>
        </div>

        <form onSubmit={handleCreateProfile} className="space-y-8">
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-2">{bn.fullName}</label>
            <div className="relative">
              <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="input-field pl-14 py-5 px-6 text-lg"
                placeholder="আপনার নাম"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-black uppercase tracking-[0.2em] text-slate-400 ml-2">{bn.phone}</label>
            <div className="relative">
              <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={24} />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="input-field pl-14 py-5 px-6 text-lg"
                placeholder="+880 1XXX XXXXXX"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-3"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={22} />
            ) : (
              <>
                <Save size={22} />
                <span className="text-lg">প্রোফাইল সেভ করুন</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
