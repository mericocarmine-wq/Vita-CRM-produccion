import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { CaptureWithRelations, ObjectiveWithRelations, TeamMemberWithRelations, TeamWithLeader } from "@/types/domain";
import { buildTeamDetails, monthStartFor } from "@/lib/resultadosMetrics";

interface Props {
  captures: CaptureWithRelations[];
  teams: TeamWithLeader[];
  members: TeamMemberWithRelations[];
  objectives: ObjectiveWithRelations[];
}

function pctColor(pct: number) {
  if (pct >= 100) return "text-green-600 bg-green-100";
  if (pct >= 70) return "text-yellow-600 bg-yellow-100";
  return "text-red-600 bg-red-100";
}

export default function TeamView({ captures, teams, members, objectives }: Props) {
  const monthStart = monthStartFor();

  const teamData = useMemo(() => {
    return buildTeamDetails(teams, members, captures, objectives, monthStart);
  }, [teams, members, captures, objectives, monthStart]);

  if (teams.length === 0) return <p className="text-muted-foreground text-center py-10">No hay equipos configurados. Usa la pestaña "Gestionar" para crear equipos.</p>;

  return (
    <div className="space-y-6">
      {teamData.map((team) => (
        <Card key={team.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span>{team.name}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-normal text-muted-foreground">Jefe: {team.leader?.full_name || team.leader?.email}</span>
                {team.objective > 0 && <Badge className={pctColor(team.pct)}>{team.pct}% objetivo</Badge>}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-bold">{team.memberStats.length}</p>
                <p className="text-xs text-muted-foreground">Captadores</p>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-bold">{team.totalPeriod}</p>
                <p className="text-xs text-muted-foreground">Socios (periodo)</p>
              </div>
              <div className="text-center p-3 bg-secondary rounded-lg">
                <p className="text-2xl font-bold">{team.totalMonth}</p>
                <p className="text-xs text-muted-foreground">Socios (mes)</p>
              </div>
            </div>
            {team.memberStats.length > 0 ? (
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left px-4 py-2 font-medium">Captador</th>
                      <th className="text-left px-4 py-2 font-medium">Rol</th>
                      <th className="text-right px-4 py-2 font-medium">Total</th>
                      <th className="text-right px-4 py-2 font-medium">Mes</th>
                      <th className="text-right px-4 py-2 font-medium">Objetivo</th>
                      <th className="text-right px-4 py-2 font-medium">%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {team.memberStats.map((m) => (
                      <tr key={m.id} className="border-t">
                        <td className="px-4 py-2">{m.profile?.full_name || m.profile?.email}</td>
                        <td className="px-4 py-2"><Badge variant="outline">{m.role}</Badge></td>
                        <td className="px-4 py-2 text-right font-medium">{m.total}</td>
                        <td className="px-4 py-2 text-right">{m.monthTotal}</td>
                        <td className="px-4 py-2 text-right">{m.objective || "—"}</td>
                        <td className="px-4 py-2 text-right">
                          {m.objective > 0 ? <Badge className={pctColor(m.pct)}>{m.pct}%</Badge> : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin miembros en este equipo</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
