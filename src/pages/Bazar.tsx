import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Loader2, ShoppingCart, Trash2, Calendar, X, Tag, Wallet, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { bn } from '../i18n';

export default function Bazar() {
  const { mess, profile, refreshMess } = useAuth();
  const [loading, setLoading] = useState(true);
  const [entries, setEntries] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState({ 
    name: '', 
    amount: '', 
    date: format(new Date(), 'yyyy-MM-dd'),
    performer_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (members.length > 0 && !newItem.performer_id) {
      const currentMember = members.find(m => m.id === profile?.id);
      setNewItem(prev => ({ 
        ...prev, 
        performer_id: currentMember ? currentMember.id : members[0].id 
      }));
    }
  }, [members, profile]);

  useEffect(() => {
    if (!mess) return;
    fetchEntries();
    fetchMembers();

    const channel = supabase.channel('bazar_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bazar' }, fetchEntries)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mess]);

  const fetchEntries = async () => {
    if (!mess) return;
    const { data } = await supabase
      .from('bazar')
      .select('*, profiles(*)')
      .eq('mess_id', mess.id)
      .order('date', { ascending: false });
    
    setEntries(data || []);
    setLoading(false);
  };

  const fetchMembers = async () => {
    if (!mess) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('mess_id', mess.id);
    setMembers(data || []);
  };

  const handleAddEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mess || !profile) return;
    
    const amount = Number(newItem.amount);
    if (isNaN(amount) || amount <= 0) {
      alert('সঠিক টাকার পরিমাণ লিখুন');
      return;
    }
    if (!newItem.name.trim()) {
      alert('বাজারের নাম লিখুন');
      return;
    }
    if (!newItem.performer_id) {
      alert('সদস্য নির্বাচন করুন');
      return;
    }

    setSubmitting(true);

    try {
      console.log('Adding bazar entry:', { messId: mess.id, itemName: newItem.name.trim(), amount, date: newItem.date, performerId: newItem.performer_id });
      
      const { error: insertError } = await supabase.from('bazar').insert({
        mess_id: mess.id,
        item_name: newItem.name.trim(),
        amount: amount,
        date: newItem.date,
        performer_id: newItem.performer_id
      });

      if (insertError) {
        console.error('Supabase error inserting bazar:', insertError);
        throw insertError;
      }
      
      const newTotalExpense = (mess.total_expense || 0) + amount;
      const newMainBalance = (mess.main_balance || 0) - amount;
      const newMealRate = newTotalExpense / (mess.total_meals || 1);
      
      console.log('Updating mess stats:', { newTotalExpense, newMainBalance, newMealRate });
      
      const { error: updateError } = await supabase.from('messes').update({ 
        total_expense: newTotalExpense,
        main_balance: newMainBalance,
        meal_rate: newMealRate
      }).eq('id', mess.id);

      if (updateError) {
        console.error('Supabase error updating mess stats:', updateError);
        throw updateError;
      }

      setIsModalOpen(false);
      setNewItem({ 
        name: '', 
        amount: '', 
        date: format(new Date(), 'yyyy-MM-dd'),
        performer_id: profile.id 
      });
      await refreshMess();
      await fetchEntries();
    } catch (err: any) {
      alert('বাজার যোগ করা সম্ভব হয়নি: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, amount: number) => {
    if (!mess || !confirm('Are you sure?')) return;
    
    try {
      const { error } = await supabase.from('bazar').delete().eq('id', id);
      if (error) throw error;

      const newTotalExpense = (mess.total_expense || 0) - amount;
      const newMainBalance = (mess.main_balance || 0) + amount;
      const newMealRate = newTotalExpense / (mess.total_meals || 1);
      
      await supabase.from('messes').update({ 
        total_expense: newTotalExpense,
        main_balance: newMainBalance,
        meal_rate: newMealRate
      }).eq('id', mess.id);
      
      refreshMess();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{bn.bazarTracking}</h1>
          <p className="text-slate-500 mt-1 font-medium">মেসের প্রতিদিনের খরচ এবং বাজারের তালিকা</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={22} />
          {bn.addBazar}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full h-40 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={32} />
          </div>
        ) : entries.length === 0 ? (
          <div className="col-span-full premium-card p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 mx-auto mb-6">
              <ShoppingCart size={40} />
            </div>
            <p className="text-slate-500 font-bold text-lg">এখনো কোনো বাজারের তথ্য নেই</p>
            <p className="text-slate-400 mt-1">প্রথম বাজার যোগ করে শুরু করুন!</p>
          </div>
        ) : (
          entries.map((entry, i) => (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="premium-card p-6 flex flex-col justify-between group"
            >
              <div className="flex items-start justify-between mb-6">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm border border-blue-100">
                  <ShoppingCart size={28} />
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{bn.amount}</p>
                  <p className="text-2xl font-black text-slate-900">৳{entry.amount}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-lg font-black text-slate-900 truncate">{entry.item_name}</h3>
                
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 overflow-hidden">
                    {entry.profiles?.avatar_url ? (
                      <img src={entry.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold text-xs">{entry.profiles?.full_name?.charAt(0)}</div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{bn.performer}</p>
                    <p className="text-xs font-bold text-slate-900 truncate">{entry.profiles?.full_name}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-xs">
                    <Calendar size={14} className="text-blue-600" />
                    {format(new Date(entry.date), 'dd MMM yyyy')}
                  </div>
                  {(profile?.role === 'admin' || profile?.role === 'sub-admin') && (
                    <button 
                      onClick={() => handleDelete(entry.id, entry.amount)}
                      className="text-slate-300 hover:text-rose-500 transition-colors p-2 hover:bg-rose-50 rounded-xl"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
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
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{bn.addBazar}</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleAddEntry} className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-400 ml-1">{bn.itemName}</label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="text"
                      required
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="input-field pl-12"
                      placeholder="চাল, ডাল, তেল..."
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-400 ml-1">{bn.amount} (৳)</label>
                  <div className="relative">
                    <Wallet className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="number"
                      required
                      value={newItem.amount}
                      onChange={(e) => setNewItem({ ...newItem, amount: e.target.value })}
                      className="input-field pl-12"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-400 ml-1">{bn.performer}</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <select
                      required
                      value={newItem.performer_id}
                      onChange={(e) => setNewItem({ ...newItem, performer_id: e.target.value })}
                      className="input-field pl-12 appearance-none"
                    >
                      {members.map(m => (
                        <option key={m.id} value={m.id}>{m.full_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-400 ml-1">{bn.date}</label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                      type="date"
                      required
                      value={newItem.date}
                      onChange={(e) => setNewItem({ ...newItem, date: e.target.value })}
                      className="input-field pl-12"
                    />
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary flex-1 flex items-center justify-center gap-2"
                  >
                    {submitting ? <Loader2 className="animate-spin" size={22} /> : bn.save}
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
