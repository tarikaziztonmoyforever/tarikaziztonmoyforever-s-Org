import React from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Home, Utensils, ShoppingCart, Wallet, User, Info, LogOut, ShieldCheck, Settings, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'motion/react';
import { bn } from '../i18n';

export default function Navigation() {
  const { profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: '/', icon: Home, label: bn.home },
    { to: '/meals', icon: Utensils, label: bn.meals },
    { to: '/bazar', icon: ShoppingCart, label: bn.bazar },
    { to: '/finance', icon: Wallet, label: bn.finance },
    { to: '/profile', icon: User, label: bn.profile },
  ];

  if (profile?.role === 'admin' || profile?.role === 'sub-admin') {
    navItems.push({ to: '/admin', icon: Settings, label: bn.admin });
  }

  const isHome = location.pathname === '/';

  return (
    <>
      {/* Top Bar with Back Button and Profile */}
      <div className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-xl border-b border-slate-100 z-40 px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {!isHome && (
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-600"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
              <ShieldCheck size={18} />
            </div>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">{bn.appName}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <NavLink to="/profile" className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-blue-600 font-bold">
                {profile?.full_name?.charAt(0)}
              </div>
            )}
          </NavLink>
        </div>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/90 backdrop-blur-2xl border-t border-slate-100 z-40 px-4 flex items-center justify-around pb-safe">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-300 relative ${
                isActive ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.div
                    layoutId="nav-active"
                    className="absolute -top-1 w-12 h-1 bg-blue-600 rounded-full"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon size={24} className={isActive ? 'scale-110' : ''} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${isActive ? 'opacity-100' : 'opacity-60'}`}>
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
