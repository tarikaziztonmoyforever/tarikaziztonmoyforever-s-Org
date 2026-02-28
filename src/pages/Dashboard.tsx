import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Wallet, Utensils, ShoppingCart, TrendingUp, AlertCircle, Copy, Check, Users, Calendar, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { bn } from '../i18n';
import { format } from 'date-fns';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Dashboard() {
  const { mess, profile } = useAuth();
  const [copied, setCopied] = useState(false);
  const [stats, setStats] = useState({
    members: 0,
    pendingDeposits: 0,
  });
  const [liveMeals, setLiveMeals] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);

  const fetchStats = async () => {
    if (!mess) return;
    const { count: membersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('mess_id', mess.id);

    const { count: pendingCount } = await supabase
      .from('deposits')
      .select('*', { count: 'exact', head: true })
      .eq('mess_id', mess.id)
      .eq('status', 'pending');

    setStats({
      members: membersCount || 0,
      pendingDeposits: pendingCount || 0,
    });
  };

  const fetchLiveMeals = async () => {
    if (!mess) return;
    const today = format(new Date(), 'yyyy-MM-dd');
    const { data } = await supabase
      .from('meals')
      .select('*, profiles(*)')
      .eq('mess_id', mess.id)
      .eq('date', today)
      .gt('meal_count', 0);
    
    setLiveMeals(data || []);
  };

  const fetchMessages = async () => {
    if (!mess) return;
    const { data } = await supabase
      .from('messages')
      .select('*, profiles(*)')
      .eq('mess_id', mess.id)
      .order('created_at', { ascending: false })
      .limit(20);
    
    setMessages(data || []);
  };

  useEffect(() => {
    if (!mess) return;

    fetchStats();
    fetchLiveMeals();
    fetchMessages();

    const chatChannel = supabase.channel(`chat_${mess.id}`)
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        if (payload.new.mess_id === mess.id) {
          console.log('New message received for this mess:', payload);
          fetchMessages();
        }
      })
      .subscribe((status) => {
        console.log('Chat subscription status:', status);
      });

    const channel = supabase.channel('dashboard_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'deposits' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, fetchLiveMeals)
      .subscribe();

    return () => {
      supabase.removeChannel(chatChannel);
      supabase.removeChannel(channel);
    };
  }, [mess]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !mess || !profile) {
      console.log('Missing data for sending message:', { newMessage, messId: mess?.id, profileId: profile?.id });
      return;
    }

    setSending(true);
    try {
      const { error } = await supabase.from('messages').insert({
        mess_id: mess.id,
        user_id: profile.id,
        content: newMessage.trim(),
      });

      if (error) {
        console.error('Supabase error sending message:', error);
        throw error;
      }
      setNewMessage('');
      await fetchMessages(); // Manually fetch after sending to be sure
    } catch (err: any) {
      alert('মেসেজ পাঠানো সম্ভব হয়নি: ' + err.message);
    } finally {
      setSending(false);
    }
  };

  const copyCode = () => {
    if (!mess) return;
    navigator.clipboard.writeText(mess.unique_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cards = [
    { label: bn.totalBalance, value: `৳${mess?.main_balance || 0}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: bn.totalExpense, value: `৳${mess?.total_expense || 0}`, icon: ShoppingCart, color: 'text-rose-600', bg: 'bg-rose-50' },
    { label: bn.remainingBalance, value: `৳${Math.max(0, (mess?.main_balance || 0) - (mess?.total_expense || 0))}`, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { label: bn.totalMeals, value: mess?.total_meals || 0, icon: Utensils, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: bn.mealRate, value: `৳${mess?.meal_rate?.toFixed(2) || 0}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const pieData = {
    labels: [bn.totalExpense, bn.remainingBalance],
    datasets: [{
      data: [mess?.total_expense || 0, Math.max(0, (mess?.main_balance || 0) - (mess?.total_expense || 0))],
      backgroundColor: ['#f43f5e', '#10b981'],
      borderWidth: 0,
      hoverOffset: 10
    }],
  };

  return (
    <div className="space-y-10 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">{mess?.mess_name}</h1>
          <p className="text-slate-500 mt-1 font-medium">{bn.welcome}, {profile?.full_name}</p>
        </div>
        
        <div className="bg-white border border-slate-100 rounded-3xl p-4 flex items-center gap-6 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
              <Users size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">{bn.uniqueCode}</p>
              <p className="text-lg font-mono font-bold text-slate-900">{mess?.unique_code}</p>
            </div>
          </div>
          <button 
            onClick={copyCode}
            className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-600"
          >
            {copied ? <Check size={20} className="text-emerald-600" /> : <Copy size={20} />}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
              {card.label === bn.totalBalance && stats.pendingDeposits > 0 && (
                <div className="flex items-center gap-1 text-[8px] font-bold bg-amber-100 text-amber-600 px-2 py-1 rounded-full">
                  <AlertCircle size={10} />
                  {stats.pendingDeposits} {bn.pending}
                </div>
              )}
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{card.label}</p>
            <h3 className="text-xl font-black text-slate-900 mt-1">{card.value}</h3>
          </motion.div>
        ))}
      </div>

      {/* Charts & Live Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Live Dashboard */}
        <div className="premium-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">লাইভ মিল ড্যাশবোর্ড</h3>
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {liveMeals.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-medium">আজ এখন পর্যন্ত কেউ মিল দেয়নি</div>
            ) : (
              liveMeals.map((meal, i) => (
                <motion.div 
                  key={meal.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden">
                      {meal.profiles?.avatar_url ? (
                        <img src={meal.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">{meal.profiles?.full_name?.charAt(0)}</div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{meal.profiles?.full_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">আজকের মিল</p>
                    </div>
                  </div>
                  <div className="bg-blue-600 text-white w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shadow-lg shadow-blue-500/20">
                    {meal.meal_count}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Live Comments */}
        <div className="premium-card p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">মেস চ্যাট (লাইভ)</h3>
            <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
          </div>
          
          <div className="flex-1 space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6 custom-scrollbar flex flex-col-reverse">
            {messages.length === 0 ? (
              <div className="text-center py-10 text-slate-400 font-medium">কোনো মেসেজ নেই</div>
            ) : (
              messages.map((msg, i) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex items-start gap-3 ${msg.user_id === profile?.id ? 'flex-row-reverse' : ''}`}
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                    {msg.profiles?.avatar_url ? (
                      <img src={msg.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-blue-600 font-bold">
                        {msg.profiles?.full_name?.charAt(0) || '?'}
                      </div>
                    )}
                  </div>
                  <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${
                    msg.user_id === profile?.id 
                      ? 'bg-blue-600 text-white rounded-tr-none' 
                      : 'bg-slate-100 text-slate-900 rounded-tl-none'
                  }`}>
                    <p className="font-bold text-[10px] mb-1 opacity-70">
                      {msg.profiles?.full_name || 'সদস্য'} • {msg.created_at ? format(new Date(msg.created_at), 'h:mm a') : ''}
                    </p>
                    <p className="leading-relaxed">{msg.content}</p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          <form onSubmit={sendMessage} className="relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="কিছু লিখুন..."
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-4 pl-5 pr-14 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            <button 
              type="submit"
              disabled={sending || !newMessage.trim()}
              className="absolute right-2 top-2 bottom-2 px-4 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-all disabled:opacity-50 disabled:grayscale"
            >
              {sending ? <Loader2 className="animate-spin" size={16} /> : 'পাঠান'}
            </button>
          </form>
        </div>

        {/* Budget Status */}
        <div className="premium-card p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-8">{bn.financialOverview}</h3>
          <div className="h-[250px] relative">
            <Pie 
              data={pieData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { position: 'bottom', labels: { color: '#64748b', font: { weight: 'bold', size: 12 }, padding: 30, usePointStyle: true } }
                }
              }}
            />
          </div>
          <div className="mt-8 space-y-4">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-bold text-slate-600">{bn.remainingBalance}</span>
              </div>
              <span className="text-sm font-black text-slate-900">৳{Math.max(0, (mess?.main_balance || 0) - (mess?.total_expense || 0))}</span>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-rose-500" />
                <span className="text-sm font-bold text-slate-600">{bn.totalExpense}</span>
              </div>
              <span className="text-sm font-black text-slate-900">৳{mess?.total_expense || 0}</span>
            </div>
          </div>
        </div>

        {/* Calendar Summary */}
        <div className="premium-card p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">ক্যালেন্ডার সারসংক্ষেপ</h3>
            <Calendar size={20} className="text-blue-600" />
          </div>
          <div className="space-y-6">
            <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
              <p className="text-sm font-bold text-blue-600 uppercase tracking-wider mb-2">চলতি মাস</p>
              <p className="text-2xl font-black text-slate-900">{mess?.month ? format(new Date(mess.month), 'MMMM yyyy') : format(new Date(), 'MMMM yyyy')}</p>
            </div>
            <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">মিল শুরু হয়েছে</p>
              <p className="text-2xl font-black text-slate-900">{mess?.meal_start_date ? format(new Date(mess.meal_start_date), 'dd MMM yyyy') : 'সেট করা হয়নি'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-center gap-4 text-blue-600">
        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm">
          <AlertCircle size={24} />
        </div>
        <div>
          <p className="text-sm font-bold">{bn.proTip}</p>
          <p className="text-sm opacity-80">{bn.proTipText}</p>
        </div>
      </div>
    </div>
  );
}
