import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { Profile, Mess } from '../types';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  mess: Mess | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshMess: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [mess, setMess] = useState<Mess | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (data) setProfile(data);
    if (error) console.error('Error fetching profile:', error);
  };

  const refreshMess = async () => {
    if (!profile?.mess_id) {
      setMess(null);
      return;
    }
    const { data, error } = await supabase
      .from('messes')
      .select('*')
      .eq('id', profile.mess_id)
      .single();
    
    if (data) setMess(data);
    if (error) console.error('Error fetching mess:', error);
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      refreshProfile();
    } else {
      setProfile(null);
      setMess(null);
    }
  }, [user]);

  useEffect(() => {
    if (profile?.mess_id) {
      refreshMess();
    }
  }, [profile?.mess_id]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, profile, mess, loading, signOut, refreshProfile, refreshMess }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
