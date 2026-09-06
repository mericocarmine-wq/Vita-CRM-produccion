import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Clock, AlertTriangle, CheckCircle, ListTodo, PlayCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  profiles?: { full_name: string | null; email: string } | null;
  creator?: { full_name: string | null; email: string } | null;
};

interface DashboardProps {
  tasks: Task[];
}

function getCountdown(dueDate: string | null) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let colorClass = "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
  let level: "ok" | "warn" | "danger" | "expired" = "ok";

  if (diffMs < 0) {
    colorClass = "bg-destructive/10 text-destructive border-destructive/30";
    level = "expired";
  } else if (diffHours <= 24) {
    colorClass = "bg-destructive/10 text-destructive border-destructive/30";
    level = "danger";
  } else if (diffDays <= 3) {
    colorClass = "bg-amber-500/10 text-amber-600 border-amber-500/30";
    level = "warn";
  }

  let label: string;
  if (diffMs < 0) {
    const overHours = Math.abs(diffHours);
    label = overHours < 24 ? `Vencida hace ${Math.round(overHours)}h` : `Vencida hace ${Math.round(Math.abs(diffDays))}d`;
  } else if (diffHours < 1) {
    label = `${Math.max(0, Math.round(diffMs / 60000))} min`;
  } else if (diffHours < 24) {
    label = `${Math.round(diffHours)} horas`;
  } else {
    label = `${Math.round(diffDays)} días`;
  }

  return { colorClass, level, label, due };
}

export default function Dashboard({ tasks }: DashboardProps) {
  const { isAdmin } = useAuth();

  const stats = useMemo(() => {
    const pendiente = tasks.filter((t) => t.status === "pendiente").length;
    const enCurso = tasks.filter((t) => t.status === "en_curso").length;
    const realizada = tasks.filter((t) => t.status === "realizada").length;
    const withDue = tasks.filter((t) => t.due_date && t.status !== "realizada");
    const expiring = withDue.filter((t) => {
      const diff = new Date(t.due_date!).getTime() - Date.now();
      return diff > 0 && diff <= 3 * 24 * 60 * 60 * 1000;
    });
    const expired = withDue.filter((t) => new Date(t.due_date!).getTime() < Date.now());
    return { pendiente, enCurso, realizada, total: tasks.length, expiring: expiring.length, expired: expired.length };
  }, [tasks]);

  const urgentTasks = useMemo(() => {
    return tasks
      .filter((t) => t.due_date && t.status !== "realizada")
      .sort((a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime())
      .slice(0, 10);
  }, [tasks]);

  const statCards = [
    { label: "Pendientes", value: stats.pendiente, icon: ListTodo, color: "text-amber-500" },
    { label: "En curso", value: stats.enCurso, icon: PlayCircle, color: "text-blue-500" },
    { label: "Realizadas", value: stats.realizada, icon: CheckCircle, color: "text-emerald-500" },
    { label: "Por vencer", value: stats.expiring, icon: Clock, color: "text-amber-500" },
    { label: "Vencidas", value: stats.expired, icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="bg-card border border-border rounded-lg p-4 flex flex-col items-center gap-1">
            <s.icon className={cn("h-5 w-5", s.color)} />
            <span className="text-2xl font-bold text-foreground">{s.value}</span>
            <span className="text-xs text-muted-foreground">{s.label}</span>
          </div>
        ))}
      </div>

      {urgentTasks.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Tareas con fecha límite
          </h3>
          <div className="space-y-2">
            {urgentTasks.map((task) => {
              const cd = getCountdown(task.due_date);
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-lg border bg-card",
                    cd && cd.level !== "ok" && "border-l-4",
                    cd?.level === "expired" && "border-l-destructive",
                    cd?.level === "danger" && "border-l-destructive",
                    cd?.level === "warn" && "border-l-amber-500"
                  )}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {isAdmin && task.profiles && (
                        <span className="text-[10px] text-muted-foreground">
                          {task.profiles.full_name || task.profiles.email}
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {task.due_date && new Date(task.due_date).toLocaleDateString("es-ES", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  {cd && (
                    <span className={cn("text-xs px-2 py-1 rounded-full border font-medium whitespace-nowrap", cd.colorClass)}>
                      {cd.level === "expired" && <AlertTriangle className="h-3 w-3 inline mr-1" />}
                      {cd.label}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
