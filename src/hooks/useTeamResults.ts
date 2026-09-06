import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type {
  CaptureInsert,
  CaptureWithRelations,
  Objective,
  ObjectiveInsert,
  ObjectiveWithRelations,
  TeamMemberWithRelations,
  TeamWithLeader,
} from "@/types/domain";
import { toast } from "sonner";

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*, leader:profiles!teams_leader_id_fkey(full_name, email)")
        .order("name");
      if (error) throw error;
      return data as TeamWithLeader[];
    },
  });
}

export function useTeamMembers(teamId?: string) {
  return useQuery({
    queryKey: ["team_members", teamId],
    queryFn: async () => {
      let query = supabase
        .from("team_members")
        .select("*, profile:profiles!team_members_user_id_fkey(full_name, email), team:teams!team_members_team_id_fkey(name)");
      if (teamId) query = query.eq("team_id", teamId);
      const { data, error } = await query;
      if (error) throw error;
      return data as TeamMemberWithRelations[];
    },
  });
}

export function useCaptures(filters?: { dateFrom?: string; dateTo?: string; userId?: string; teamId?: string }) {
  return useQuery({
    queryKey: ["captures", filters],
    queryFn: async () => {
      let query = supabase
        .from("captures")
        .select("*, profile:profiles!captures_user_id_fkey(full_name, email), team:teams!captures_team_id_fkey(name)")
        .order("capture_date", { ascending: false });

      if (filters?.dateFrom) query = query.gte("capture_date", filters.dateFrom);
      if (filters?.dateTo) query = query.lte("capture_date", filters.dateTo);
      if (filters?.userId) query = query.eq("user_id", filters.userId);
      if (filters?.teamId) query = query.eq("team_id", filters.teamId);

      const { data, error } = await query;
      if (error) throw error;
      return data as CaptureWithRelations[];
    },
  });
}

export function useObjectives() {
  return useQuery({
    queryKey: ["objectives"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("objectives")
        .select("*, profile:profiles!objectives_user_id_fkey(full_name, email), team:teams!objectives_team_id_fkey(name)");
      if (error) throw error;
      return data as ObjectiveWithRelations[];
    },
  });
}

export function useCreateCapture() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (capture: CaptureInsert) => {
      const { data, error } = await supabase.from("captures").insert(capture).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["captures"] });
      toast.success("Captación registrada");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (obj: ObjectiveInsert) => {
      const { data, error } = await supabase.from("objectives").insert(obj).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast.success("Objetivo creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Objective> & { id: string }) => {
      const { data, error } = await supabase.from("objectives").update(updates).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast.success("Objetivo actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteObjective() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("objectives").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast.success("Objetivo eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateTeam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (team: { name: string; leader_id: string }) => {
      const { data, error } = await supabase.from("teams").insert(team).select().single();
      if (error) throw error;
      // Add leader as jefe member
      await supabase.from("team_members").insert({ team_id: data.id, user_id: team.leader_id, role: "jefe" as const });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Equipo creado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (member: { team_id: string; user_id: string; role: "jefe" | "captador" }) => {
      const { data, error } = await supabase.from("team_members").insert(member).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Miembro añadido");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Miembro eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
