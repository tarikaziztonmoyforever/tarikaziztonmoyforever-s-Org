import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { Plus, Loader2, Calendar, Minus, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { bn } from '../i18n';

export default function Meals() {
  const { mess, profile, refreshMess } = useAuth();
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<any[]>([]);
  const [meals, setMeals] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const [selectedDayDetails, setSelectedDayDetails] = useState<Date | null>(null);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(selectedDate),
    end: endOfMonth(selectedDate),
  });

  useEffect(() => {
    if (!mess) return;
    fetchData();

    const channel = supabase.channel('meal_updates')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, fetchData)
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [mess, selectedDate]);

  const fetchData = async () => {
    if (!mess) return;
    setLoading(true);
    
    const { data: membersData } = await supabase
      .from('profiles')
      .select('*')
      .eq('mess_id', mess.id);

    const { data: mealsData } = await supabase
      .from('meals')
      .select('*, profiles(*)')
      .eq('mess_id', mess.id)
      .gte('date', format(startOfMonth(selectedDate), 'yyyy-MM-dd'))
      .lte('date', format(endOfMonth(selectedDate), 'yyyy-MM-dd'));

    setMembers(membersData || []);
    setMeals(mealsData || []);
    setLoading(false);
  };

  const updateMeal = async (userId: string, date: Date, currentCount: number, delta: number) => {
    if (!mess) return;

    // Data locking: Cannot change past dates
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (date < today) {
      alert('অতীতের তথ্য পরিবর্তন করা সম্ভব নয়।');
      return;
    }

    const newCount = Math.max(0, Math.min(mess.daily_meal_limit * 2, currentCount + delta));
    if (newCount === currentCount) return;

    const dateStr = format(date, 'yyyy-MM-dd');
    const updateKey = `${userId}-${dateStr}`;
    setIsUpdating(updateKey);

    try {
      const { error } = await supabase
        .from('meals')
        .upsert({
          user_id: userId,
          mess_id: mess.id,
          date: dateStr,
          meal_count: newCount,
        }, { onConflict: 'user_id,date' });

      if (error) throw error;

      // Recalculate mess totals from database to ensure accuracy
      const { data: allMeals } = await supabase
        .from('meals')
        .select('meal_count')
        .eq('mess_id', mess.id);
      
      const totalMessMeals = (allMeals || []).reduce((acc, m) => acc + m.meal_count, 0);
      const newMealRate = (mess.total_expense || 0) / (totalMessMeals || 1);
      
      await supabase.from('messes').update({
        total_meals: totalMessMeals,
        meal_rate: newMealRate
      }).eq('id', mess.id);

      // Recalculate profile totals
      const { data: userMeals } = await supabase
        .from('meals')
        .select('meal_count')
        .eq('user_id', userId)
        .eq('mess_id', mess.id);
      
      const totalUserMeals = (userMeals || []).reduce((acc, m) => acc + m.meal_count, 0);
      
      await supabase.from('profiles').update({
        total_meals: totalUserMeals
      }).eq('id', userId);

      fetchData();
      refreshMess();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(null);
    }
  };

  const getDayMeals = (date: Date) => {
    return meals.filter(m => isSameDay(new Date(m.date), date));
  };

  if (loading) {
    return (
      <div className="h-[60vh] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">{bn.mealTracking}</h1>
          <p className="text-slate-500 mt-1 font-medium">{bn.manageDailyMeals}</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white border border-slate-100 rounded-2xl p-2 shadow-soft">
          <button 
            onClick={() => setSelectedDate(subMonths(selectedDate, 1))}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex items-center gap-2 px-2">
            <Calendar size={18} className="text-blue-600" />
            <span className="text-slate-900 font-black text-sm uppercase tracking-wider">{format(selectedDate, 'MMMM yyyy')}</span>
          </div>
          <button 
            onClick={() => setSelectedDate(addMonths(selectedDate, 1))}
            className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-900 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Calendar Grid View */}
      <div className="grid grid-cols-7 gap-2 md:gap-4">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest py-2">{d}</div>
        ))}
        {daysInMonth.map((day, i) => {
          const dayMeals = getDayMeals(day);
          const totalDayMeals = dayMeals.reduce((acc, m) => acc + m.meal_count, 0);
          const isCurrentDay = isToday(day);
          
          return (
            <motion.button
              key={day.toString()}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.01 }}
              onClick={() => setSelectedDayDetails(day)}
              className={`relative aspect-square rounded-2xl border p-2 flex flex-col items-center justify-center transition-all hover:shadow-lg group ${
                isCurrentDay 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-500/20' 
                  : 'bg-white border-slate-100 text-slate-900 hover:border-blue-200'
              }`}
            >
              <span className={`text-sm font-black ${isCurrentDay ? 'text-white' : 'text-slate-900'}`}>{format(day, 'd')}</span>
              {totalDayMeals > 0 && (
                <div className={`mt-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isCurrentDay ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'
                }`}>
                  {totalDayMeals}
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Main Tracking Table */}
      <div className="premium-card overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between">
          <h3 className="text-lg font-black text-slate-900">সদস্য তালিকা ও মিল</h3>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Info size={14} />
            <span>প্রতি বেলা ১টি করে মিল গণনা করা হয়</span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-slate-400 font-black uppercase text-[10px] tracking-widest sticky left-0 bg-white/90 backdrop-blur-md z-10 border-r border-slate-100">{bn.member}</th>
                {daysInMonth.map(day => (
                  <th key={day.toString()} className={`p-4 text-center min-w-[80px] ${isToday(day) ? 'bg-blue-50/50' : ''}`}>
                    <div className={`text-[10px] font-black uppercase tracking-tighter ${isToday(day) ? 'text-blue-600' : 'text-slate-400'}`}>
                      {format(day, 'EEE')}
                    </div>
                    <div className={`text-lg font-black ${isToday(day) ? 'text-blue-600' : 'text-slate-900'}`}>
                      {format(day, 'dd')}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {members.map(member => (
                <tr key={member.id} className="hover:bg-slate-50/30 transition-colors">
                  <td className="p-6 sticky left-0 bg-white/90 backdrop-blur-md z-10 border-r border-slate-100">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-sm font-black shadow-sm border border-blue-100 overflow-hidden">
                        {member.avatar_url ? (
                          <img src={member.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          member.full_name.charAt(0)
                        )}
                      </div>
                      <span className="text-slate-900 text-sm font-black whitespace-nowrap">{member.full_name}</span>
                    </div>
                  </td>
                  {daysInMonth.map(day => {
                    const meal = meals.find(m => m.user_id === member.id && isSameDay(new Date(m.date), day));
                    const count = meal?.meal_count || 0;
                    const isUpdatingThis = isUpdating === `${member.id}-${format(day, 'yyyy-MM-dd')}`;
                    const isCurrentDay = isToday(day);
                    const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                    return (
                      <td key={day.toString()} className={`p-3 text-center ${isCurrentDay ? 'bg-blue-50/20' : ''}`}>
                        <div className="flex flex-col items-center gap-2">
                          <div className="flex items-center bg-slate-50 rounded-xl p-1 border border-slate-100">
                            <button
                              disabled={isUpdatingThis || isPast || (member.id !== profile?.id && profile?.role !== 'admin' && profile?.role !== 'sub-admin')}
                              onClick={() => updateMeal(member.id, day, count, -1)}
                              className="w-8 h-8 rounded-lg hover:bg-white text-slate-400 hover:text-rose-500 flex items-center justify-center disabled:opacity-30 transition-all shadow-sm active:scale-90"
                            >
                              <Minus size={14} />
                            </button>
                            <span className={`text-sm font-black w-10 ${count > 0 ? 'text-blue-600' : 'text-slate-300'}`}>
                              {isUpdatingThis ? <Loader2 size={12} className="animate-spin mx-auto" /> : count}
                            </span>
                            <button
                              disabled={isUpdatingThis || isPast || (member.id !== profile?.id && profile?.role !== 'admin' && profile?.role !== 'sub-admin')}
                              onClick={() => updateMeal(member.id, day, count, 1)}
                              className="w-8 h-8 rounded-lg hover:bg-white text-slate-400 hover:text-emerald-500 flex items-center justify-center disabled:opacity-30 transition-all shadow-sm active:scale-90"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Day Details Modal */}
      <AnimatePresence>
        {selectedDayDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedDayDetails(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[2.5rem] p-10 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 tracking-tight">{format(selectedDayDetails, 'dd MMMM yyyy')}</h2>
                  <p className="text-slate-500 font-medium">দিনের বিস্তারিত তথ্য</p>
                </div>
                <button onClick={() => setSelectedDayDetails(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-4">
                {getDayMeals(selectedDayDetails).length === 0 ? (
                  <div className="text-center py-10 text-slate-400 font-medium">এই দিনে কোনো মিল রেকর্ড নেই</div>
                ) : (
                  getDayMeals(selectedDayDetails).map((meal, i) => (
                    <div key={meal.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border border-slate-100 overflow-hidden">
                          {meal.profiles?.avatar_url ? (
                            <img src={meal.profiles.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">{meal.profiles?.full_name?.charAt(0)}</div>
                          )}
                        </div>
                        <span className="font-bold text-slate-900">{meal.profiles?.full_name}</span>
                      </div>
                      <div className="bg-blue-600 text-white px-4 py-2 rounded-xl font-black text-sm shadow-lg shadow-blue-500/20">
                        {meal.meal_count} মিল
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
