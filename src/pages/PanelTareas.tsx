import { useState, useMemo } from "react";
import { useTasks, useProfiles } from "@/hooks/useTasks";
import { useAuth } from "@/contexts/AuthContext";
import KanbanBoard from "@/components/KanbanBoard";
import CreateTaskDialog from "@/components/CreateTaskDialog";
import EditTaskDialog from "@/components/EditTaskDialog";
import DeleteTaskDialog from "@/components/DeleteTaskDialog";
import Dashboard from "@/components/Dashboard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, LayoutDashboard, History, Shield } from "lucide-react";

import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"];

type Section = "mi_espacio" | "historial" | "admin";

export default function PanelTareas() {
  const { isAdmin, user } = useAuth();
  const [section, setSection] = useState<Section>("mi_espacio");
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const [filterUser, setFilterUser] = useState("all");

  // Fetch data for current section
  const filter = section === "admin" && !isAdmin ? "mi_espacio" : section;
  const { tasks, isLoading, createTask, updateTask, deleteTask } = useTasks(filter);
  const { tasks: teamTasks } = useTasks("equipo");
  const { data: profiles } = useProfiles();

  const sections: { id: Section; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: "mi_espacio", label: "Mi Espacio", icon: LayoutDashboard },
    { id: "historial", label: "Historial", icon: History },
    ...(isAdmin ? [{ id: "admin" as Section, label: "Admin", icon: Shield, adminOnly: true }] : []),
  ];

  // For Mi Espacio dashboard: merge personal + team tasks
  const allVisibleTasks = useMemo(() => {
    if (section !== "mi_espacio") return tasks;
    return [...tasks, ...teamTasks.filter((t) => !tasks.some((mt) => mt.id === t.id))];
  }, [section, tasks, teamTasks]);

  // For Admin: filter by user
  const filteredTasks = useMemo(() => {
    if (section !== "admin" || filterUser === "all") return tasks;
    return tasks.filter((t) => t.assigned_to === filterUser || t.created_by === filterUser);
  }, [section, tasks, filterUser]);

  const displayTasks = section === "admin" ? filteredTasks : tasks;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Panel de Tareas</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestión completa de tareas</p>
        </div>
        {section !== "historial" && section !== "admin" && (
          <CreateTaskDialog onCreate={(t) => createTask.mutate(t)} />
        )}
      </div>

      {/* Section tabs */}
      <div className="flex items-center gap-1 mb-4 bg-muted/50 rounded-lg p-1 w-fit">
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => { setSection(s.id); setFilterUser("all"); }}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              section === s.id
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <s.icon className="h-4 w-4" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Admin filter */}
      {section === "admin" && (
        <div className="mb-4 w-56">
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger><SelectValue placeholder="Filtrar por miembro" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los miembros</SelectItem>
              {profiles?.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content area */}
      <div className="flex-1 min-h-0">
        {section === "historial" ? (
          <HistorialContent tasks={tasks} />
        ) : (
          <Tabs defaultValue="dashboard" className="flex-1 flex flex-col h-full">
            <TabsList className="mb-4 w-fit">
              <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
              <TabsTrigger value="kanban">Kanban</TabsTrigger>
            </TabsList>
            <TabsContent value="dashboard" className="flex-1">
              <Dashboard tasks={section === "mi_espacio" ? allVisibleTasks : displayTasks} />
            </TabsContent>
            <TabsContent value="kanban" className="flex-1">
              <KanbanBoard
                tasks={displayTasks}
                hideRealized={section !== "admin"}
                onStatusChange={(id, status) => updateTask.mutate({ id, status })}
                onEdit={setEditTask}
                onDelete={setDeleteTarget}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>

      <EditTaskDialog task={editTask} open={!!editTask} onOpenChange={(o) => !o && setEditTask(null)} onSave={(u) => updateTask.mutate(u)} />
      <DeleteTaskDialog task={deleteTarget} open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} onConfirm={(id) => { deleteTask.mutate(id); setDeleteTarget(null); }} />
    </div>
  );
}

function HistorialContent({ tasks }: { tasks: Database["public"]["Tables"]["tasks"]["Row"][] }) {
  if (tasks.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
        <p>No hay tareas completadas todavía</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={cn(
            "bg-card rounded-lg border border-border p-4 border-l-4",
            task.visibility === "privada" ? "border-l-task-private" : "border-l-task-team"
          )}
        >
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground line-through opacity-70">{task.title}</h4>
              {task.description && <p className="text-xs text-muted-foreground mt-0.5">{task.description}</p>}
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(task.updated_at).toLocaleDateString("es-ES")}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
