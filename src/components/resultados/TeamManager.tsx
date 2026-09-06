import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCreateTeam, useAddTeamMember, useRemoveTeamMember } from "@/hooks/useTeamResults";
import { useProfiles } from "@/hooks/useTasks";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Trash2, Users, UserPlus } from "lucide-react";
import type { TeamMemberWithRelations, TeamRole, TeamWithLeader } from "@/types/domain";

interface Props {
  teams: TeamWithLeader[];
  members: TeamMemberWithRelations[];
}

type MemberForm = {
  team_id: string;
  user_id: string;
  role: TeamRole;
};

export default function TeamManager({ teams, members }: Props) {
  const { data: allProfiles } = useProfiles();
  const createTeam = useCreateTeam();
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();

  const [teamOpen, setTeamOpen] = useState(false);
  const [teamForm, setTeamForm] = useState({ name: "", leader_id: "" });
  const [memberOpen, setMemberOpen] = useState(false);
  const [memberForm, setMemberForm] = useState<MemberForm>({ team_id: "", user_id: "", role: "captador" });

  const handleCreateTeam = () => {
    if (!teamForm.name || !teamForm.leader_id) return;
    createTeam.mutate(teamForm, { onSuccess: () => { setTeamOpen(false); setTeamForm({ name: "", leader_id: "" }); } });
  };

  const handleAddMember = () => {
    if (!memberForm.team_id || !memberForm.user_id) return;
    addMember.mutate(memberForm, { onSuccess: () => { setMemberOpen(false); setMemberForm({ team_id: "", user_id: "", role: "captador" }); } });
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Dialog open={teamOpen} onOpenChange={setTeamOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" />Nuevo Equipo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear Equipo</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nombre del equipo</Label><Input value={teamForm.name} onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })} /></div>
              <div>
                <Label>Jefe de equipo</Label>
                <Select value={teamForm.leader_id} onValueChange={(v) => setTeamForm({ ...teamForm, leader_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                  <SelectContent>{allProfiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={handleCreateTeam} disabled={createTeam.isPending} className="w-full">Crear</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={memberOpen} onOpenChange={setMemberOpen}>
          <DialogTrigger asChild><Button variant="outline"><UserPlus className="h-4 w-4 mr-1" />Añadir Miembro</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Añadir Miembro</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Equipo</Label>
                <Select value={memberForm.team_id} onValueChange={(v) => setMemberForm({ ...memberForm, team_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                  <SelectContent>{teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Usuario</Label>
                <Select value={memberForm.user_id} onValueChange={(v) => setMemberForm({ ...memberForm, user_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar usuario" /></SelectTrigger>
                  <SelectContent>{allProfiles?.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Rol</Label>
                <Select value={memberForm.role} onValueChange={(v: TeamRole) => setMemberForm({ ...memberForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jefe">Jefe</SelectItem>
                    <SelectItem value="captador">Captador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddMember} disabled={addMember.isPending} className="w-full">Añadir</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {teams.map((t) => {
        const teamMembers = members.filter((m) => m.team_id === t.id);
        return (
          <Card key={t.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Users className="h-4 w-4 text-primary" />
                {t.name}
                <span className="text-xs text-muted-foreground font-normal ml-2">Líder: {t.leader?.full_name || t.leader?.email}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {teamMembers.length > 0 ? (
                <div className="space-y-2">
                  {teamMembers.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2 border rounded">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{m.profile?.full_name || m.profile?.email}</span>
                        <Badge variant="outline">{m.role}</Badge>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => removeMember.mutate(m.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                  ))}
                </div>
              ) : <p className="text-sm text-muted-foreground">Sin miembros</p>}
            </CardContent>
          </Card>
        );
      })}

      {teams.length === 0 && <p className="text-muted-foreground text-center py-10">Crea tu primer equipo para empezar</p>}
    </div>
  );
}
