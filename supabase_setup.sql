# Supabase Setup Instructions

To use this application, you need to set up a Supabase project and run the following SQL in the SQL Editor:

```sql
-- 1. Create Tables

-- Messes table
CREATE TABLE messes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_name TEXT NOT NULL,
  admin_id UUID, -- Will be linked to profiles later
  unique_code TEXT UNIQUE NOT NULL,
  main_balance NUMERIC DEFAULT 0,
  total_expense NUMERIC DEFAULT 0,
  total_meals NUMERIC DEFAULT 0,
  meal_rate NUMERIC DEFAULT 0,
  daily_meal_limit INTEGER DEFAULT 2,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'member',
  mess_id UUID REFERENCES messes(id),
  avatar_url TEXT,
  total_meals NUMERIC DEFAULT 0,
  total_contribution NUMERIC DEFAULT 0,
  balance NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Link messes admin_id to profiles
ALTER TABLE messes ADD CONSTRAINT fk_admin FOREIGN KEY (admin_id) REFERENCES profiles(id);

-- Deposits table
CREATE TABLE deposits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Meals table
CREATE TABLE meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_count NUMERIC DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Bazar table
CREATE TABLE bazar (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mess_id UUID REFERENCES messes(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- 2. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE messes, deposits, meals, bazar, profiles;

-- 3. RLS Policies (Simplified for demo, refine for production)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE bazar ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all profiles in their mess, but only update their own
CREATE POLICY "Profiles are viewable by mess members" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Messes: Viewable by members
CREATE POLICY "Messes are viewable by members" ON messes FOR SELECT USING (true);
CREATE POLICY "Admins can update their mess" ON messes FOR UPDATE USING (auth.uid() = admin_id);
CREATE POLICY "Any user can create a mess" ON messes FOR INSERT WITH CHECK (true);

-- Deposits: Viewable by mess members, insertable by any member, updatable by admin
CREATE POLICY "Deposits viewable by mess members" ON deposits FOR SELECT USING (true);
CREATE POLICY "Members can request deposits" ON deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can update deposits" ON deposits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM messes WHERE id = deposits.mess_id AND admin_id = auth.uid())
);

-- Meals: Viewable by members, insertable/updatable by members
CREATE POLICY "Meals viewable by members" ON meals FOR SELECT USING (true);
CREATE POLICY "Members can manage their meals" ON meals FOR ALL USING (auth.uid() = user_id);

-- Bazar: Viewable by members, insertable by members
CREATE POLICY "Bazar viewable by members" ON bazar FOR SELECT USING (true);
CREATE POLICY "Members can add bazar entries" ON bazar FOR INSERT WITH CHECK (true);
```

Set these environment variables in your `.env`:
`VITE_SUPABASE_URL=your_supabase_url`
`VITE_SUPABASE_ANON_KEY=your_supabase_anon_key`
