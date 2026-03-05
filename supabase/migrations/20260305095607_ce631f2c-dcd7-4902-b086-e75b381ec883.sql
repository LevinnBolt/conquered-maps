
-- Achievements table
CREATE TABLE public.achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_key text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements" ON public.achievements
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON public.achievements
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Streaks table
CREATE TABLE public.streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer NOT NULL DEFAULT 0,
  longest_streak integer NOT NULL DEFAULT 0,
  last_active_date date,
  total_xp integer NOT NULL DEFAULT 0,
  level integer NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streaks" ON public.streaks
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streaks" ON public.streaks
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streaks" ON public.streaks
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Power-ups inventory
CREATE TABLE public.power_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  power_up_type text NOT NULL,
  quantity integer NOT NULL DEFAULT 1,
  UNIQUE(user_id, power_up_type)
);
ALTER TABLE public.power_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own power_ups" ON public.power_ups
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own power_ups" ON public.power_ups
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own power_ups" ON public.power_ups
FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Daily challenges
CREATE TABLE public.daily_challenges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  challenge_type text NOT NULL DEFAULT 'quiz',
  challenge_data jsonb,
  xp_reward integer NOT NULL DEFAULT 100,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(challenge_date)
);
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view daily challenges" ON public.daily_challenges
FOR SELECT TO authenticated USING (true);

-- Daily challenge completions
CREATE TABLE public.challenge_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id),
  completed_at timestamptz NOT NULL DEFAULT now(),
  score integer NOT NULL DEFAULT 0,
  UNIQUE(user_id, challenge_id)
);
ALTER TABLE public.challenge_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own completions" ON public.challenge_completions
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own completions" ON public.challenge_completions
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Chat messages for rooms
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  message_type text NOT NULL DEFAULT 'text',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Room members can view chat" ON public.chat_messages
FOR SELECT TO authenticated USING (public.is_room_member(auth.uid(), room_id));

CREATE POLICY "Room members can send chat" ON public.chat_messages
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id AND public.is_room_member(auth.uid(), room_id));

-- Enable realtime for chat
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Grant starter power-ups function
CREATE OR REPLACE FUNCTION public.grant_starter_power_ups(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.power_ups (user_id, power_up_type, quantity)
  VALUES 
    (_user_id, 'fifty_fifty', 3),
    (_user_id, 'time_freeze', 2),
    (_user_id, 'double_points', 1)
  ON CONFLICT (user_id, power_up_type) DO NOTHING;
END;
$$;
