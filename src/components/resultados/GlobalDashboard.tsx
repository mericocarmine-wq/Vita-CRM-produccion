import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, TrendingUp, Users, Target, AlertTriangle, Medal } from "lucide-react";
import { format } from "date-fns";
import type { CaptureWithRelations, ObjectiveWithRelations, TeamMemberWithRelations, TeamWithLeader } from "@/types/domain";
import {
  buildCaptadorRanking,
  buildDailyData,
  buildResultAlerts,
  buildTeamRanking,
  monthStartFor,
  sumCaptures,
  weekRangeFor,
} from "@/lib/resultadosMetrics";

interface Props {
  captures: CaptureWithRelations[];
  teams: TeamWithLeader[];
  members: TeamMemberWithRelations[];
  objectives: ObjectiveWithRelations[];
}

function getCompletionColor(pct: number) {
  if (pct >= 100) return "text-green-600 bg-green-100";
  if (pct >= 70) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
}

function getProgressColor(pct: number) {
  if (pct >= 100) return "bg-green-500";
  if (pct >= 70) return "bg-yellow-500";
  return "bg-red-500";
}

export default function GlobalDashboard({ captures, teams, members, objectives }: Props) {
  const today = format(new Date(), "yyyy-MM-dd");
  const { weekStart, weekEnd } = weekRangeFor();
  const monthStart = monthStartFor();

  const totalToday = useMemo(() => sumCaptures(captures.filter((c) => c.capture_date === today)), [captures, today]);
  const totalWeek = useMemo(() => sumCaptures(captures.filter((c) => c.capture_date >= weekStart && c.capture_date <= weekEnd)), [captures, weekStart, weekEnd]);
  const totalMonth = useMemo(() => sumCaptures(captures.filter((c) => c.capture_date >= monthStart)), [captures, monthStart]);
  const totalPeriod = useMemo(() => sumCaptures(captures), [captures]);

  const globalObjective = useMemo(() => {
    const monthly = objectives.filter((o) => !o.user_id && !o.team_id && o.period === "mensual");
    return monthly.length ? monthly[0].target : 0;
  }, [objectives]);

  const completionPct = globalObjective > 0 ? Math.round((totalMonth / globalObjective) * 100) : 0;

  const teamRanking = useMemo(() => buildTeamRanking(teams, captures, members, objectives, monthStart), [teams, captures, members, objectives, monthStart]);
  const captadorRanking = useMemo(() => buildCaptadorRanking(captures, monthStart), [captures, monthStart]);
  const dailyData = useMemo(() => buildDailyData(captures), [captures]);
  const alerts = useMemo(() => buildResultAlerts(captadorRanking, teamRanking, objectives), [captadorRanking, teamRanking, objectives]);

  const medalEmoji = (i: number) => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `${i + 1}º`;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Target className="h-4 w-4" />Hoy</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalToday}</p><p className="text-xs text-muted-foreground">socios captados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><TrendingUp className="h-4 w-4" />Semana</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalWeek}</p><p className="text-xs text-muted-foreground">socios captados</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Users className="h-4 w-4" />Mes</CardTitle></CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalMonth}</p>
            {globalObjective > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Objetivo: {globalObjective}</span>
                  <Badge className={getCompletionColor(completionPct)}>{completionPct}%</Badge>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getProgressColor(completionPct)}`} style={{ width: `${Math.min(completionPct, 100)}%` }} />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Trophy className="h-4 w-4" />Periodo</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold">{totalPeriod}</p><p className="text-xs text-muted-foreground">total filtrado</p></CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" />Alertas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((a, i) => (
              <div key={i} className={`text-sm p-2 rounded ${a.type === "warning" ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"}`}>
                {a.message}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Evolución diaria</CardTitle></CardHeader>
        <CardContent>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="socios" fill="hsl(352, 65%, 40%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-sm text-center py-8">Sin datos para el periodo seleccionado</p>
          )}
        </CardContent>
      </Card>

      {/* Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Trophy className="h-4 w-4" />Ranking de Equipos</CardTitle></CardHeader>
          <CardContent>
            {teamRanking.length > 0 ? (
              <div className="space-y-3">
                {teamRanking.map((t, i) => (
                  <div key={t.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{medalEmoji(i)}</span>
                      <div>
                        <p className="text-sm font-medium">{t.name}</p>
                        <p className="text-xs text-muted-foreground">{t.memberCount} miembros · Líder: {t.leader?.full_name || t.leader?.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{t.total} socios</p>
                      {t.objective > 0 && <Badge className={getCompletionColor(t.pct)}>{t.pct}%</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">No hay equipos configurados</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Medal className="h-4 w-4" />Ranking de Captadores</CardTitle></CardHeader>
          <CardContent>
            {captadorRanking.length > 0 ? (
              <div className="space-y-3">
                {captadorRanking.slice(0, 10).map((c, i) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{medalEmoji(i)}</span>
                      <p className="text-sm font-medium">{c.name}</p>
                    </div>
                    <p className="text-sm font-bold">{c.total} socios</p>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin datos</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
