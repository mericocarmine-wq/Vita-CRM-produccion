import { Draggable } from "@hello-pangea/dnd";
import { useAuth } from "@/contexts/AuthContext";
import { Pencil, Trash2, GripVertical, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Database } from "@/integrations/supabase/types";

type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  profiles?: { full_name: string | null; email: string } | null;
  creator?: { full_name: string | null; email: string } | null;
};

interface TaskCardProps {
  task: Task;
  index: number;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
}

function getDueInfo(dueDate: string | null) {
  if (!dueDate) return null;
  const now = new Date();
  const due = new Date(dueDate);
  const diffMs = due.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  let color = "text-muted-foreground";
  let urgent = false;
  if (diffMs < 0) {
    color = "text-destructive";
    urgent = true;
  } else if (diffHours <= 24) {
    color = "text-destructive";
    urgent = true;
  } else if (diffDays <= 3) {
    color = "text-amber-500";
  }

  const label = diffMs < 0
    ? "Vencida"
    : diffHours < 1
      ? `${Math.max(0, Math.round(diffMs / 60000))}m`
      : diffHours < 24
        ? `${Math.round(diffHours)}h`
        : `${Math.round(diffDays)}d`;

  return { color, urgent, label, date: due };
}

export default function TaskCard({ task, index, onEdit, onDelete }: TaskCardProps) {
  const { isAdmin } = useAuth();
  const dueInfo = getDueInfo(task.due_date);

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group bg-card rounded-lg border border-border p-3 mb-2 shadow-sm transition-shadow",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/20",
            "border-l-4",
            task.visibility === "privada" ? "border-l-task-private" : "border-l-task-team"
          )}
        >
          <div className="flex items-start gap-2">
            <div {...provided.dragHandleProps} className="mt-1 text-muted-foreground/40 hover:text-muted-foreground cursor-grab">
              <GripVertical className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">{task.title}</h4>
              {task.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
              )}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded font-medium",
                  task.visibility === "privada"
                    ? "bg-task-private/10 text-task-private"
                    : "bg-task-team/10 text-task-team"
                )}>
                  {task.visibility === "privada" ? "Privada" : "Equipo"}
                </span>
                {task.profiles && (
                  <span className="text-[10px] text-muted-foreground truncate">
                    → {task.profiles.full_name || task.profiles.email}
                  </span>
                )}
                {dueInfo && (
                  <span className={cn("text-[10px] flex items-center gap-0.5 font-medium", dueInfo.color)}>
                    {dueInfo.urgent ? <AlertTriangle className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                    {dueInfo.label}
                  </span>
                )}
              </div>
            </div>
            {isAdmin && (
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => onEdit?.(task)} className="p-1 rounded hover:bg-accent text-muted-foreground hover:text-foreground">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => onDelete?.(task)} className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </Draggable>
  );
}
