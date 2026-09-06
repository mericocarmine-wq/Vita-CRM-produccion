import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile, Task, TaskInsert, TaskWithRelations } from "@/types/domain";
import { toast } from "sonner";

export function useTasks(filter?: "mi_espacio" | "equipo" | "historial" | "admin") {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tasksQuery = useQuery({
    queryKey: ["tasks", filter, user?.id],
    queryFn: async () => {
      let query = supabase.from("tasks").select("*, profiles!tasks_assigned_to_fkey(full_name, email), creator:profiles!tasks_created_by_fkey(full_name, email)");

      if (filter === "mi_espacio") {
        query = query.or(`assigned_to.eq.${user!.id},created_by.eq.${user!.id}`).neq("status", "realizada");
      } else if (filter === "equipo") {
        query = query.eq("visibility", "equipo").neq("status", "realizada");
      } else if (filter === "historial") {
        query = query.eq("status", "realizada");
      }
      // admin: no filters, get everything

      const { data, error } = await query.order("created_at", { ascending: false });
      if (error) throw error;
      return data as TaskWithRelations[];
    },
    enabled: !!user,
  });

  const createTask = useMutation({
    mutationFn: async (task: Omit<TaskInsert, "created_by">) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, created_by: user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea creada correctamente");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateTask = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea actualizada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      toast.success("Tarea eliminada");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return { tasks: tasksQuery.data ?? [], isLoading: tasksQuery.isLoading, createTask, updateTask, deleteTask };
}

export function useProfiles() {
  return useQuery({
    queryKey: ["profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data as Profile[];
    },
  });
}
