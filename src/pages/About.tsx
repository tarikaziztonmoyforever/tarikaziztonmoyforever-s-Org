import React from 'react';
import { ShieldCheck, Users, Zap, Heart, Github, Globe, Mail, Utensils, ShoppingCart, Wallet } from 'lucide-react';
import { motion } from 'motion/react';
import { bn } from '../i18n';

export default function About() {
  const features = [
    {
      icon: <Utensils className="text-blue-600" />,
      title: bn.meals,
      description: "প্রতিদিনের মিল ট্র্যাকিং এবং অটোমেটিক মিল রেট ক্যালকুলেশন।"
    },
    {
      icon: <ShoppingCart className="text-amber-500" />,
      title: bn.bazar,
      description: "বাজারের খরচ এবং মেসের প্রয়োজনীয় জিনিসের হিসাব রাখা।"
    },
    {
      icon: <Wallet className="text-emerald-500" />,
      title: bn.finance,
      description: "সদস্যদের জমা এবং মেসের আর্থিক অবস্থার স্বচ্ছ ধারণা।"
    },
    {
      icon: <ShieldCheck className="text-rose-500" />,
      title: "নিরাপত্তা",
      description: "অ্যাডমিন কন্ট্রোল এবং সাব-অ্যাডমিন ম্যানেজমেন্ট সিস্টেম।"
    }
  ];

  return (
    <div className="space-y-16 pb-20">
      <div className="text-center max-w-3xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-20 h-20 bg-blue-600 rounded-[2rem] mx-auto flex items-center justify-center text-white shadow-2xl shadow-blue-500/30 mb-8"
        >
          <ShieldCheck size={40} />
        </motion.div>
        <h1 className="text-5xl font-black text-slate-900 tracking-tight">{bn.appName} সম্পর্কে</h1>
        <p className="text-xl text-slate-500 font-medium leading-relaxed">
          {bn.appName} হলো মেস বা হোস্টেল ম্যানেজমেন্টের জন্য একটি আধুনিক এবং সহজ সমাধান। 
          এটি শিক্ষার্থী এবং চাকুরিজীবীদের জন্য তৈরি করা হয়েছে যারা স্বচ্ছতা এবং দক্ষতা পছন্দ করেন।
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="premium-card p-8 text-center"
          >
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-100 shadow-sm">
              {feature.icon}
            </div>
            <h3 className="text-lg font-black text-slate-900 mb-3">{feature.title}</h3>
            <p className="text-slate-500 text-sm font-medium leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </div>

      <div className="premium-card p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">আমাদের লক্ষ্য</h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              আমরা বিশ্বাস করি যে একটি মেস পরিচালনা করা কোনো ঝামেলার কাজ হওয়া উচিত নয়। আমাদের লক্ষ্য হলো একটি স্বচ্ছ, স্বয়ংক্রিয় এবং সহজে ব্যবহারযোগ্য প্ল্যাটফর্ম প্রদান করা যা বিবাদ দূর করে এবং সবার সময় বাঁচায়।
            </p>
            <div className="flex items-center gap-4 pt-4">
              <button className="btn-primary px-8">আমাদের কমিউনিটিতে যোগ দিন</button>
              <button className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all border border-slate-100">
                <Github size={24} />
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="h-32 bg-slate-50 rounded-[2rem] border border-slate-100" />
              <div className="h-48 bg-blue-50 rounded-[2rem] border border-blue-100" />
            </div>
            <div className="space-y-4 pt-8">
              <div className="h-48 bg-slate-100 rounded-[2rem] border border-slate-200" />
              <div className="h-32 bg-slate-50 rounded-[2rem] border border-slate-100" />
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-8">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">আমাদের সাথে যুক্ত হোন</h2>
        <div className="flex items-center gap-6">
          {[Globe, Mail].map((Icon, i) => (
            <button key={i} className="w-14 h-14 bg-white border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-500/10 transition-all">
              <Icon size={24} />
            </button>
          ))}
        </div>
        <p className="text-slate-400 text-sm font-bold tracking-widest uppercase">© 2025 {bn.appName} Premium. All rights reserved.</p>
      </div>
    </div>
  );
}
