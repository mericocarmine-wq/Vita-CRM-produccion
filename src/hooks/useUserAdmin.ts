import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserWithDetails {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
  role: "admin" | "user";
  team_member?: {
    id: string;
    team_id: string;
    role: "jefe" | "captador";
    team_name: string;
  } | null;
}

export function useUsersWithDetails() {
  return useQuery({
    queryKey: ["admin_users"],
    queryFn: async () => {
      const [profilesRes, rolesRes, membersRes, teamsRes] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("*"),
        supabase.from("team_members").select("*"),
        supabase.from("teams").select("*"),
      ]);

      if (profilesRes.error) throw profilesRes.error;

      const rolesMap = new Map<string, "admin" | "user">();
      rolesRes.data?.forEach((r) => rolesMap.set(r.user_id, r.role));

      const teamsMap = new Map<string, string>();
      teamsRes.data?.forEach((t) => teamsMap.set(t.id, t.name));

      const membersMap = new Map<string, { id: string; team_id: string; role: "jefe" | "captador"; team_name: string }>();
      membersRes.data?.forEach((m) => {
        membersMap.set(m.user_id, {
          id: m.id,
          team_id: m.team_id,
          role: m.role as "jefe" | "captador",
          team_name: teamsMap.get(m.team_id) || "Sin nombre",
        });
      });

      return profilesRes.data.map((p): UserWithDetails => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        avatar_url: p.avatar_url,
        created_at: p.created_at,
        role: rolesMap.get(p.id) || "user",
        team_member: membersMap.get(p.id) || null,
      }));
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      email: string;
      password: string;
      full_name: string;
      teamRole: "jefe" | "captador";
      team_id?: string;
    }) => {
      // Use edge function to create user as admin
      const { data, error } = await supabase.functions.invoke("admin-create-user", {
        body: params,
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Usuario creado correctamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      userId: string;
      teamRole: "jefe" | "captador";
      team_id?: string;
    }) => {
      // Remove existing team memberships
      await supabase.from("team_members").delete().eq("user_id", params.userId);

      if (params.teamRole === "captador" && params.team_id) {
        // Add as captador to the specified team
        const { error } = await supabase.from("team_members").insert({
          user_id: params.userId,
          team_id: params.team_id,
          role: "captador",
        });
        if (error) throw error;
      } else if (params.teamRole === "jefe") {
        // Check if they lead a team already
        const { data: existingTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("leader_id", params.userId)
          .maybeSingle();

        if (existingTeam) {
          // Ensure they're a jefe member of their team
          const { error } = await supabase.from("team_members").insert({
            user_id: params.userId,
            team_id: existingTeam.id,
            role: "jefe",
          });
          if (error && !error.message.includes("duplicate")) throw error;
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      toast.success("Rol actualizado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (params: { userId: string; reassignTo?: string }) => {
      // If user is a team leader, optionally reassign captadores
      const { data: ledTeam } = await supabase
        .from("teams")
        .select("id")
        .eq("leader_id", params.userId)
        .maybeSingle();

      if (ledTeam && params.reassignTo) {
        // Move captadores to new leader's team
        const { data: newLeaderTeam } = await supabase
          .from("teams")
          .select("id")
          .eq("leader_id", params.reassignTo)
          .maybeSingle();

        if (newLeaderTeam) {
          await supabase
            .from("team_members")
            .update({ team_id: newLeaderTeam.id })
            .eq("team_id", ledTeam.id)
            .eq("role", "captador");
        }
      }

      // Remove team memberships
      await supabase.from("team_members").delete().eq("user_id", params.userId);

      // Delete team if leader
      if (ledTeam) {
        await supabase.from("team_members").delete().eq("team_id", ledTeam.id);
        await supabase.from("teams").delete().eq("id", ledTeam.id);
      }

      // Remove role
      await supabase.from("user_roles").delete().eq("user_id", params.userId);

      // Delete profile
      await supabase.from("profiles").delete().eq("id", params.userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin_users"] });
      queryClient.invalidateQueries({ queryKey: ["team_members"] });
      queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Usuario eliminado");
    },
    onError: (e: Error) => toast.error(e.message),
  });
}
