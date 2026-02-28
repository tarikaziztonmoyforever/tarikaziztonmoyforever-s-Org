import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Loader2, Wallet, Check, X, Clock, AlertCircle, TrendingUp, ShoppingCart, Utensils } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { bn } from '../i18n';

export default function Finance() {
  const { mess, profile, refreshMess, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [amount, setAmount] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!mess) return;
    fetchDeposits();

    const channel = supabase.channel('finance_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, fetchDeposits)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mess]);

  const fetchDeposits = async () => {
    if (!mess) return;
    const { data } = await supabase
      .from('deposits')
      .select('*, profiles(*)')
      .eq('mess_id', mess.id)
      .order('created_at', { ascending: false });
    
    setDeposits(data || []);
    setLoading(false);
  };

  const handleRequestDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess || !profile) return;
    setSubmitting(true);

    try {
      const { error } = await supabase.from('deposits').insert({
        user_id: profile.id,
        mess_id: mess.id,
        amount: Number(amount),
        status: 'pending',
      });

      if (error) throw error;
      setIsModalOpen(false);
      setAmount('');
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (deposit: any) => {
    if (profile?.role !== 'admin' && profile?.role !== 'sub-admin') return;
    
    try {
      const { error: depError } = await supabase
        .from('deposits')
        .update({ status: 'approved' })
        .eq('id', deposit.id);

      if (depError) throw depError;

      const { error: messError } = await supabase
        .from('messes')
        .update({ main_balance: (mess?.main_balance || 0) + deposit.amount })
        .eq('id', mess?.id);

      if (messError) throw messError;

      const { data: userData } = await supabase
        .from('profiles')
        .select('total_contribution, balance')
        .eq('id', deposit.user_id)
        .single();

      const { error: profError } = await supabase
        .from('profiles')
        .update({ 
          total_contribution: (userData?.total_contribution || 0) + deposit.amount,
          balance: (userData?.balance || 0) + deposit.amount 
        })
        .eq('id', deposit.user_id);

      if (profError) throw profError;

      await refreshMess();
      await refreshProfile();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    if (profile?.role !== 'admin' && profile?.role !== 'sub-admin') return;
    await supabase.from('deposits').update({ status: 'rejected' }).eq('id', id);
  };

  const stats = [
    { label: bn.totalBalance, value: `৳${mess?.main_balance || 0}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: bn.totalExpense, value: `৳${mess?.total_expense || 0}`, icon: ShoppingCart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: bn.mealRate, value: `৳${mess?.meal_rate?.toFixed(2) || 0}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{bn.finance}</h1>
          <p className="text-slate-500 mt-1 font-medium">মেসের জমা-খরচ এবং আর্থিক হিসাব পরিচালনা করুন</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={22} />
          {bn.addDeposit}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card p-8"
          >
            <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-sm`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-wider">{stat.label}</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="premium-card overflow-hidden">
        <div className="p-8 border-b border-slate-50">
          <h3 className="text-xl font-black text-slate-900">সাম্প্রতিক লেনদেন</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">সদস্য</th>
                <th className="p-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">পরিমাণ</th>
                <th className="p-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">তারিখ</th>
                <th className="p-6 text-slate-400 font-black uppercase text-[10px] tracking-widest">অবস্থা</th>
                {(profile?.role === 'admin' || profile?.role === 'sub-admin') && <th className="p-6 text-slate-400 font-black uppercase text-[10px] tracking-widest text-right">অ্যাকশন</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center">
                    <Loader2 className="animate-spin text-blue-600 mx-auto" size={40} />
                  </td>
                </tr>
              ) : deposits.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-20 text-center text-slate-400 font-medium">কোনো লেনদেন পাওয়া যায়নি</td>
                </tr>
              ) : (
                deposits.map((deposit) => (
                  <tr key={deposit.id} className="hover:bg-slate-50/30 transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                          {deposit.profiles?.avatar_url ? (
                            <img src={deposit.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">{deposit.profiles?.full_name?.charAt(0)}</div>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{deposit.profiles?.full_name}</span>
                      </div>
                    </td>
                    <td className="p-6 font-black text-slate-900">৳{deposit.amount}</td>
                    <td className="p-6 text-slate-500 text-sm font-medium">{format(new Date(deposit.created_at), 'dd MMM, hh:mm a')}</td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        deposit.status === 'approved' ? 'bg-emerald-100 text-emerald-600' :
                        deposit.status === 'pending' ? 'bg-amber-100 text-amber-600' :
                        'bg-rose-100 text-rose-600'
                      }`}>
                        {deposit.status === 'approved' ? bn.approved : deposit.status === 'pending' ? bn.pending : bn.rejected}
                      </span>
                    </td>
                    {(profile?.role === 'admin' || profile?.role === 'sub-admin') && (
                      <td className="p-6 text-right">
                        {deposit.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleApprove(deposit)}
                              className="p-2 bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white rounded-xl transition-all shadow-sm"
                            >
                              <Check size={18} />
                            </button>
                            <button
                              onClick={() => handleReject(deposit.id)}
                              className="p-2 bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white rounded-xl transition-all shadow-sm"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white border border-slate-100 rounded-[2.5rem] p-10 shadow-premium"
            >
              <h2 className="text-2xl font-black text-slate-900 mb-8 tracking-tight">{bn.addDeposit}</h2>
              <form onSubmit={handleRequestDeposit} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-400 ml-1">টাকার পরিমাণ (৳)</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="number"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input-field pl-12"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3 text-amber-600">
                  <AlertCircle size={20} className="shrink-0" />
                  <p className="text-xs font-bold leading-relaxed">
                    আপনার জমা দেওয়া টাকা অ্যাডমিন অনুমোদন করার পর মূল ব্যালেন্সে যোগ হবে।
                  </p>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all"
                  >
                    {bn.cancel}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 btn-primary flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={20} /> : bn.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
