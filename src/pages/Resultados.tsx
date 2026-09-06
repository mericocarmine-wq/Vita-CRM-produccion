import { useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useCaptures, useTeams, useTeamMembers, useObjectives } from "@/hooks/useTeamResults";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import GlobalDashboard from "@/components/resultados/GlobalDashboard";
import TeamView from "@/components/resultados/TeamView";
import CaptadorView from "@/components/resultados/CaptadorView";
import ObjectivesManager from "@/components/resultados/ObjectivesManager";
import CaptureDialog from "@/components/resultados/CaptureDialog";
import TeamManager from "@/components/resultados/TeamManager";
import UserAdminPanel from "@/components/resultados/UserAdminPanel";
import { format, startOfMonth } from "date-fns";

export default function Resultados() {
  const { isAdmin } = useAuth();
  const [dateFrom, setDateFrom] = useState(format(startOfMonth(new Date()), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterTeam, setFilterTeam] = useState<string>("all");
  const [filterUser, setFilterUser] = useState<string>("all");

  const { data: teams } = useTeams();
  const { data: members } = useTeamMembers();
  const { data: captures, isLoading } = useCaptures({ dateFrom, dateTo, teamId: filterTeam !== "all" ? filterTeam : undefined, userId: filterUser !== "all" ? filterUser : undefined });
  const { data: allCaptures } = useCaptures({ dateFrom, dateTo });
  const { data: objectives } = useObjectives();

  const profiles = useMemo(() => {
    if (!members) return [];
    const map = new Map<string, { id: string; full_name: string | null; email: string }>();
    members.forEach((m) => {
      if (m.profile) map.set(m.user_id, { id: m.user_id, full_name: m.profile.full_name, email: m.profile.email });
    });
    return Array.from(map.values());
  }, [members]);

  const exportCSV = () => {
    if (!captures?.length) return;
    const rows = [["Fecha", "Captador", "Equipo", "Socios", "Ubicación", "Notas"]];
    captures.forEach((c) => {
      rows.push([c.capture_date, c.profile?.full_name || "", c.team?.name || "", String(c.num_socios), c.location || "", c.notes || ""]);
    });
    const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `resultados_${dateFrom}_${dateTo}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex items-center justify-center h-full"><p className="text-muted-foreground">Cargando...</p></div>;

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Resultados de Equipo</h1>
          <p className="text-sm text-muted-foreground mt-1">Rendimiento de captación de socios</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-40" />
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-40" />
          <Select value={filterTeam} onValueChange={(v) => { setFilterTeam(v); setFilterUser("all"); }}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Equipo" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los equipos</SelectItem>
              {teams?.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterUser} onValueChange={setFilterUser}>
            <SelectTrigger className="w-44"><SelectValue placeholder="Captador" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" />CSV</Button>
          {isAdmin && <CaptureDialog teams={teams || []} profiles={profiles} />}
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="flex-1 flex flex-col">
        <TabsList className="mb-4 flex-wrap">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="equipos">Por Equipo</TabsTrigger>
          <TabsTrigger value="captadores">Por Captador</TabsTrigger>
          <TabsTrigger value="objetivos">Objetivos</TabsTrigger>
          {isAdmin && <TabsTrigger value="gestionar">Gestionar</TabsTrigger>}
          {isAdmin && <TabsTrigger value="usuarios">Usuarios</TabsTrigger>}
        </TabsList>
        <TabsContent value="dashboard" className="flex-1 overflow-auto">
          <GlobalDashboard captures={allCaptures || []} teams={teams || []} members={members || []} objectives={objectives || []} />
        </TabsContent>
        <TabsContent value="equipos" className="flex-1 overflow-auto">
          <TeamView captures={allCaptures || []} teams={teams || []} members={members || []} objectives={objectives || []} />
        </TabsContent>
        <TabsContent value="captadores" className="flex-1 overflow-auto">
          <CaptadorView captures={allCaptures || []} members={members || []} objectives={objectives || []} />
        </TabsContent>
        <TabsContent value="objetivos" className="flex-1 overflow-auto">
          <ObjectivesManager objectives={objectives || []} teams={teams || []} profiles={profiles} />
        </TabsContent>
        {isAdmin && (
          <TabsContent value="gestionar" className="flex-1 overflow-auto">
            <TeamManager teams={teams || []} members={members || []} />
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="usuarios" className="flex-1 overflow-auto">
            <UserAdminPanel />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
