import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import TaskCard from "./TaskCard";
import type { Database } from "@/integrations/supabase/types";

type TaskStatus = Database["public"]["Enums"]["task_status"];
type Task = Database["public"]["Tables"]["tasks"]["Row"] & {
  profiles?: { full_name: string | null; email: string } | null;
  creator?: { full_name: string | null; email: string } | null;
};

const columns: { id: TaskStatus; label: string; color: string }[] = [
  { id: "pendiente", label: "Pendiente", color: "bg-amber-500" },
  { id: "en_curso", label: "En curso", color: "bg-blue-500" },
  { id: "realizada", label: "Realizada", color: "bg-emerald-500" },
];

interface KanbanBoardProps {
  tasks: Task[];
  onStatusChange: (taskId: string, newStatus: TaskStatus) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
  hideRealized?: boolean;
}

export default function KanbanBoard({ tasks, onStatusChange, onEdit, onDelete, hideRealized = false }: KanbanBoardProps) {
  const displayColumns = hideRealized ? columns.filter(c => c.id !== "realizada") : columns;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as TaskStatus;
    if (result.source.droppableId !== newStatus) {
      onStatusChange(result.draggableId, newStatus);
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 h-full overflow-x-auto pb-4">
        {displayColumns.map((col) => {
          const colTasks = tasks.filter((t) => t.status === col.id);
          return (
            <div key={col.id} className="flex-1 min-w-[280px] max-w-[400px]">
              <div className="flex items-center gap-2 mb-3 px-1">
                <div className={`w-2 h-2 rounded-full ${col.color}`} />
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                <span className="text-xs text-muted-foreground ml-auto">{colTasks.length}</span>
              </div>
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={`min-h-[200px] rounded-lg p-2 transition-colors ${
                      snapshot.isDraggingOver ? "bg-accent/50" : "bg-muted/30"
                    }`}
                  >
                    {colTasks.map((task, idx) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={idx}
                        onEdit={onEdit}
                        onDelete={onDelete}
                      />
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
}
