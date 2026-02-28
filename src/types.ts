export type Role = 'admin' | 'sub-admin' | 'member';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  role: Role;
  mess_id: string | null;
  avatar_url: string | null;
  total_meals: number;
  total_contribution: number;
  balance: number;
  created_at: string;
}

export interface Mess {
  id: string;
  mess_name: string;
  admin_id: string;
  unique_code: string;
  main_balance: number;
  total_expense: number;
  total_meals: number;
  meal_rate: number;
  daily_meal_limit: number;
  meal_start_date: string | null;
  month: string | null;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  mess_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  profiles?: Profile;
}

export interface Meal {
  id: string;
  user_id: string;
  mess_id: string;
  date: string;
  meal_count: number;
  profiles?: Profile;
}

export interface Message {
  id: string;
  mess_id: string;
  user_id: string;
  content: string;
  created_at: string;
  profiles?: Profile;
}

export interface BazarEntry {
  id: string;
  mess_id: string;
  item_name: string;
  amount: number;
  date: string;
  performer_id: string | null;
  created_at: string;
  profiles?: Profile;
}
