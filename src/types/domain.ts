import type { Database } from "@/integrations/supabase/types";

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type ProfileSummary = Pick<Profile, "id" | "full_name" | "email">;

export type Capture = Database["public"]["Tables"]["captures"]["Row"];
export type Objective = Database["public"]["Tables"]["objectives"]["Row"];
export type ObjectiveInsert = Database["public"]["Tables"]["objectives"]["Insert"];
export type Task = Database["public"]["Tables"]["tasks"]["Row"];
export type TaskInsert = Database["public"]["Tables"]["tasks"]["Insert"];
export type Team = Database["public"]["Tables"]["teams"]["Row"];
export type TeamMember = Database["public"]["Tables"]["team_members"]["Row"];
export type TeamRole = Database["public"]["Enums"]["team_role"];
export type ObjectivePeriod = Database["public"]["Enums"]["objective_period"];

export type CaptureWithRelations = Capture & {
  profile: ProfileSummary | null;
  team: Pick<Team, "name"> | null;
};

export type ObjectiveWithRelations = Objective & {
  profile: ProfileSummary | null;
  team: Pick<Team, "name"> | null;
};

export type TeamWithLeader = Team & {
  leader: Pick<Profile, "full_name" | "email"> | null;
};

export type TeamMemberWithRelations = TeamMember & {
  profile: ProfileSummary | null;
  team: Pick<Team, "name"> | null;
};

export type TaskWithRelations = Task & {
  profiles: Pick<Profile, "full_name" | "email"> | null;
  creator: Pick<Profile, "full_name" | "email"> | null;
};

export type UserProfileOption = ProfileSummary;
