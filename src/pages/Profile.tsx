import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Phone, Mail, Shield, Calendar, Utensils, Wallet, TrendingUp, Camera, Loader2, CheckCircle2, Award, LogOut } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { supabase } from '../lib/supabase';
import { bn } from '../i18n';

export default function Profile() {
  const { profile, user, mess, refreshProfile, signOut } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);

  const calculatedBalance = (profile?.total_contribution || 0) - ((profile?.total_meals || 0) * (mess?.meal_rate || 0));

  const stats = [
    { label: 'মোট মিল', value: profile?.total_meals || 0, icon: Utensils, color: 'text-amber-600', bg: 'bg-amber-50' },
    { label: 'মোট জমা', value: `৳${profile?.total_contribution || 0}`, icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'বর্তমান ব্যালেন্স', value: `৳${calculatedBalance.toFixed(2)}`, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
  ];

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setSuccess(false);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error('You must select an image to upload.');
      }

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user?.id}/${fileName}`;

      console.log('Uploading file:', { filePath, fileName, fileType: file.type });

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) {
        console.error('Supabase storage upload error:', uploadError);
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);
      
      console.log('File uploaded, public URL:', publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user?.id);

      if (updateError) {
        console.error('Supabase profile update error:', updateError);
        throw updateError;
      }

      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      console.error('Profile upload error:', error);
      alert('ছবি আপলোড করা সম্ভব হয়নি: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-32">
      <div className="relative">
        <div className="h-72 bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 rounded-[3rem] shadow-2xl shadow-blue-500/30" />
        <div className="absolute -bottom-20 left-10 flex flex-col md:flex-row md:items-end gap-10">
          <div className="relative group">
            <div className="w-48 h-48 rounded-[3rem] bg-white border-[10px] border-slate-50 overflow-hidden shadow-2xl transition-transform group-hover:scale-[1.02]">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl font-black text-blue-600 bg-blue-50">
                  {profile?.full_name?.charAt(0)}
                </div>
              )}
            </div>
            <label className="absolute bottom-3 right-3 p-4 bg-white hover:bg-slate-50 text-blue-600 rounded-2xl shadow-2xl cursor-pointer transition-all border border-slate-100">
              {uploading ? <Loader2 className="animate-spin" size={24} /> : <Camera size={24} />}
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload} 
                disabled={uploading}
              />
            </label>
          </div>
          <div className="mb-8">
            <h1 className="text-5xl font-black text-slate-900 tracking-tight">{profile?.full_name}</h1>
            <div className="flex items-center gap-4 mt-3">
              <span className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                profile?.role === 'admin' ? 'bg-amber-100 text-amber-600' : 
                profile?.role === 'sub-admin' ? 'bg-purple-100 text-purple-600' :
                'bg-blue-100 text-blue-600'
              }`}>
                {profile?.role === 'admin' ? 'অ্যাডমিন' : profile?.role === 'sub-admin' ? 'সাব-অ্যাডমিন' : 'সদস্য'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-bold text-lg">{mess?.mess_name}</span>
              {success && (
                <motion.span 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  className="flex items-center gap-1.5 text-emerald-600 text-sm font-bold ml-2"
                >
                  <CheckCircle2 size={18} />
                  ছবি আপডেট হয়েছে!
                </motion.span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-24 grid grid-cols-1 md:grid-cols-3 gap-8">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card p-10"
          >
            <div className={`p-5 rounded-3xl w-fit mb-8 ${stat.bg} ${stat.color}`}>
              <stat.icon size={32} />
            </div>
            <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">{stat.label}</p>
            <h3 className="text-4xl font-black text-slate-900 mt-3">{stat.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="premium-card p-12 space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
              <Mail size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">যোগাযোগের তথ্য</h3>
          </div>
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-3xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Mail size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">ইমেইল অ্যাড্রেস</p>
                <p className="text-slate-900 font-bold text-lg">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Phone size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">ফোন নম্বর</p>
                <p className="text-slate-900 font-bold text-lg">{profile?.phone}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="premium-card p-12 space-y-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-900">
              <Shield size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-900">অ্যাকাউন্ট স্ট্যাটাস</h3>
          </div>
          <div className="space-y-8">
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-3xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Shield size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">সদস্যের ভূমিকা</p>
                <p className="text-slate-900 font-bold text-lg capitalize">
                  {profile?.role === 'admin' ? 'অ্যাডমিন' : profile?.role === 'sub-admin' ? 'সাব-অ্যাডমিন' : 'সদস্য'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-14 h-14 rounded-3xl bg-rose-50 flex items-center justify-center text-rose-600">
                <Calendar size={24} />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">যোগদানের তারিখ</p>
                <p className="text-slate-900 font-bold text-lg">{profile?.created_at ? format(new Date(profile.created_at), 'dd MMMM yyyy') : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-10">
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-10 py-5 bg-rose-50 text-rose-600 rounded-3xl font-black uppercase tracking-widest hover:bg-rose-100 transition-all active:scale-95 shadow-lg shadow-rose-500/10"
        >
          <LogOut size={24} />
          সাইন আউট
        </button>
      </div>
    </div>
  );
}
