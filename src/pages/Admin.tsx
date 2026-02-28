import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Users, Shield, Trash2, Settings, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { bn } from '../i18n';
import { Profile } from '../types';

export default function Admin() {
  const { mess, profile, refreshMess } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<Profile[]>([]);
  const [isClearing, setIsClearing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [settings, setSettings] = useState({
    meal_start_date: mess?.meal_start_date || '',
    month: mess?.month || '',
  });

  useEffect(() => {
    if (!mess) return;
    fetchMembers();
  }, [mess]);

  const fetchMembers = async () => {
    if (!mess) return;
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('mess_id', mess.id);
    setMembers(data || []);
    setLoading(false);
  };

  const updateRole = async (userId: string, newRole: 'admin' | 'sub-admin' | 'member') => {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);
    
    if (error) alert(error.message);
    else fetchMembers();
  };

  const updateSettings = async () => {
    if (!mess) return;
    const { error } = await supabase
      .from('messes')
      .update(settings)
      .eq('id', mess.id);
    
    if (error) alert(error.message);
    else {
      alert(bn.success);
      refreshMess();
    }
  };

  const clearMonthlyData = async () => {
    if (!mess) return;
    setIsClearing(true);
    try {
      // Clear meals
      await supabase.from('meals').delete().eq('mess_id', mess.id);
      // Clear bazar
      await supabase.from('bazar').delete().eq('mess_id', mess.id);
      // Clear deposits
      await supabase.from('deposits').delete().eq('mess_id', mess.id);
      // Clear messages
      await supabase.from('messages').delete().eq('mess_id', mess.id);
      
      // Reset mess stats
      await supabase.from('messes').update({
        main_balance: 0,
        total_expense: 0,
        total_meals: 0,
        meal_rate: 0
      }).eq('id', mess.id);

      // Reset all profile stats for this mess
      await supabase.from('profiles').update({
        total_meals: 0,
        total_contribution: 0,
        balance: 0
      }).eq('mess_id', mess.id);
      
      alert(bn.success);
      setShowConfirm(false);
      refreshMess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsClearing(false);
    }
  };

  if (profile?.role !== 'admin' && profile?.role !== 'sub-admin') {
    return <div className="p-10 text-center text-rose-500 font-bold">Access Denied</div>;
  }

  return (
    <div className="space-y-10 pb-20">
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">{bn.adminPanel}</h1>
        <p className="text-slate-500 mt-1 font-medium">Manage your mess settings and members</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Settings */}
        <div className="premium-card p-8 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
              <Settings size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Mess Settings</h2>
          </div>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Month</label>
              <input 
                type="month" 
                value={settings.month}
                onChange={(e) => setSettings({...settings, month: e.target.value})}
                className="input-field"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">Meal Start Date</label>
              <input 
                type="date" 
                value={settings.meal_start_date}
                onChange={(e) => setSettings({...settings, meal_start_date: e.target.value})}
                className="input-field"
              />
            </div>
            <button onClick={updateSettings} className="btn-primary w-full">
              {bn.save}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="premium-card p-8 border-rose-100 bg-rose-50/30">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600">
              <AlertTriangle size={20} />
            </div>
            <h2 className="text-xl font-black text-slate-900">Danger Zone</h2>
          </div>
          <p className="text-slate-500 text-sm mb-6">Resetting monthly data will permanently delete all meals and bazar entries for this mess.</p>
          <button 
            onClick={() => setShowConfirm(true)}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={20} />
            {bn.clearData}
          </button>
        </div>
      </div>

      {/* Members Management */}
      <div className="premium-card p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
            <Users size={20} />
          </div>
          <h2 className="text-xl font-black text-slate-900">{bn.manageMembers}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50">
                <th className="pb-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Member</th>
                <th className="pb-4 text-slate-400 font-black uppercase text-[10px] tracking-widest">Current Role</th>
                <th className="pb-4 text-slate-400 font-black uppercase text-[10px] tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map(m => (
                <tr key={m.id} className="group">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                        {m.avatar_url ? (
                          <img src={m.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">{m.full_name.charAt(0)}</div>
                        )}
                      </div>
                      <span className="font-bold text-slate-900">{m.full_name}</span>
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      m.role === 'admin' ? 'bg-amber-100 text-amber-600' : 
                      m.role === 'sub-admin' ? 'bg-purple-100 text-purple-600' :
                      'bg-blue-100 text-blue-600'
                    }`}>
                      {m.role === 'admin' ? 'অ্যাডমিন' : m.role === 'sub-admin' ? 'সাব-অ্যাডমিন' : 'সদস্য'}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    {profile?.role === 'admin' && m.id !== profile.id && (
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => updateRole(m.id, m.role === 'sub-admin' ? 'member' : 'sub-admin')}
                          className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-all"
                          title={m.role === 'sub-admin' ? 'Remove Sub-Admin' : 'Make Sub-Admin'}
                        >
                          <Shield size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowConfirm(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-[2.5rem] p-10 max-w-md w-full relative z-10 shadow-2xl text-center"
            >
              <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-4">{bn.clearDataConfirm}</h3>
              <p className="text-slate-500 mb-8 font-medium">This action cannot be undone. All meal records and bazar expenses for this month will be lost.</p>
              <div className="flex gap-4">
                <button onClick={() => setShowConfirm(false)} className="flex-1 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold rounded-2xl transition-all">
                  {bn.cancel}
                </button>
                <button 
                  onClick={clearMonthlyData}
                  disabled={isClearing}
                  className="flex-1 py-4 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 transition-all flex items-center justify-center gap-2"
                >
                  {isClearing ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={20} />}
                  {bn.clearData}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
