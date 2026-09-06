import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import type { CaptureWithRelations, ObjectiveWithRelations, TeamMemberWithRelations } from "@/types/domain";
import { buildCaptadorDetails, monthStartFor } from "@/lib/resultadosMetrics";

interface Props {
  captures: CaptureWithRelations[];
  members: TeamMemberWithRelations[];
  objectives: ObjectiveWithRelations[];
}

function pctColor(pct: number) {
  if (pct >= 100) return "text-green-600 bg-green-100";
  if (pct >= 70) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
}

export default function CaptadorView({ captures, members, objectives }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthStart = monthStartFor();
  const weekAgo = format(new Date(Date.now() - 7 * 86400000), "yyyy-MM-dd");
  const twoWeeksAgo = format(new Date(Date.now() - 14 * 86400000), "yyyy-MM-dd");

  const captadores = useMemo(() => {
    return buildCaptadorDetails(captures, members, objectives, today, weekAgo, twoWeeksAgo, monthStart);
  }, [captures, members, objectives, today, monthStart, weekAgo, twoWeeksAgo]);

  if (captadores.length === 0) return <p className="text-muted-foreground text-center py-10">Sin captadores registrados</p>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {captadores.map((c) => (
        <Card key={c.userId}>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center justify-between text-base">
              <div>
                <span>{c.name}</span>
                <span className="text-xs text-muted-foreground ml-2">{c.teamName} · {c.role}</span>
              </div>
              <div className="flex items-center gap-1">
                {c.trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
                {c.trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
                {c.trend === "stable" && <Minus className="h-4 w-4 text-yellow-500" />}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-2 mb-3 text-center">
              <div className="bg-secondary rounded p-2">
                <p className="text-lg font-bold">{c.todayTotal}</p>
                <p className="text-[10px] text-muted-foreground">Hoy</p>
              </div>
              <div className="bg-secondary rounded p-2">
                <p className="text-lg font-bold">{c.weekTotal}</p>
                <p className="text-[10px] text-muted-foreground">Semana</p>
              </div>
              <div className="bg-secondary rounded p-2">
                <p className="text-lg font-bold">{c.monthTotal}</p>
                <p className="text-[10px] text-muted-foreground">Mes</p>
              </div>
              <div className="bg-secondary rounded p-2">
                <p className="text-lg font-bold">{c.periodTotal}</p>
                <p className="text-[10px] text-muted-foreground">Total</p>
              </div>
            </div>

            {c.objective > 0 && (
              <div className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span>Objetivo mensual: {c.objective}</span>
                  <Badge className={pctColor(c.pct)}>{c.pct}%</Badge>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full ${c.pct >= 100 ? "bg-green-500" : c.pct >= 70 ? "bg-yellow-500" : "bg-red-500"}`} style={{ width: `${Math.min(c.pct, 100)}%` }} />
                </div>
              </div>
            )}

            {c.dailyData.length > 0 && (
              <ResponsiveContainer width="100%" height={100}>
                <BarChart data={c.dailyData}>
                  <XAxis dataKey="date" fontSize={9} tickLine={false} />
                  <YAxis hide />
                  <Tooltip />
                  <Bar dataKey="socios" fill="hsl(352, 65%, 40%)" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
