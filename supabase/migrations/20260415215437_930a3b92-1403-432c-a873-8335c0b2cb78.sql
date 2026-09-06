
-- Enum for objective periods
CREATE TYPE public.objective_period AS ENUM ('diario', 'semanal', 'mensual');

-- Enum for team member roles
CREATE TYPE public.team_role AS ENUM ('jefe', 'captador');

-- Teams table
CREATE TABLE public.teams (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  leader_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Team members
CREATE TABLE public.team_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role team_role NOT NULL DEFAULT 'captador',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(team_id, user_id)
);

-- Captures (daily records of partners captured)
CREATE TABLE public.captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  capture_date DATE NOT NULL DEFAULT CURRENT_DATE,
  num_socios INTEGER NOT NULL DEFAULT 0,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Objectives (configurable targets)
CREATE TABLE public.objectives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  period objective_period NOT NULL DEFAULT 'mensual',
  target INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_captures_user_date ON public.captures(user_id, capture_date);
CREATE INDEX idx_captures_team_date ON public.captures(team_id, capture_date);
CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_user ON public.team_members(user_id);
CREATE INDEX idx_objectives_user ON public.objectives(user_id);
CREATE INDEX idx_objectives_team ON public.objectives(team_id);

-- Enable RLS
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.objectives ENABLE ROW LEVEL SECURITY;

-- Triggers for updated_at
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_captures_updated_at BEFORE UPDATE ON public.captures FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_objectives_updated_at BEFORE UPDATE ON public.objectives FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: teams
CREATE POLICY "Authenticated users can view teams" ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage teams" ON public.teams FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Team leaders can update own team" ON public.teams FOR UPDATE TO authenticated USING (leader_id = auth.uid());

-- RLS: team_members
CREATE POLICY "Authenticated users can view team members" ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage team members" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS: captures
CREATE POLICY "Admins can manage all captures" ON public.captures FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own captures" ON public.captures FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can insert own captures" ON public.captures FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own captures" ON public.captures FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Team leaders can view team captures" ON public.captures FOR SELECT TO authenticated USING (
  team_id IN (SELECT id FROM public.teams WHERE leader_id = auth.uid())
);
CREATE POLICY "Team members can view team captures" ON public.captures FOR SELECT TO authenticated USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);

-- RLS: objectives
CREATE POLICY "Admins can manage all objectives" ON public.objectives FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own objectives" ON public.objectives FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can view team objectives" ON public.objectives FOR SELECT TO authenticated USING (
  team_id IN (SELECT team_id FROM public.team_members WHERE user_id = auth.uid())
);
CREATE POLICY "Team leaders can manage team objectives" ON public.objectives FOR ALL TO authenticated USING (
  team_id IN (SELECT id FROM public.teams WHERE leader_id = auth.uid())
);

-- Enable realtime for captures
ALTER PUBLICATION supabase_realtime ADD TABLE public.captures;
