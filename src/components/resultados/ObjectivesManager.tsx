import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useCreateObjective, useUpdateObjective, useDeleteObjective } from "@/hooks/useTeamResults";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Trash2, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import type { ObjectiveInsert, ObjectivePeriod, ObjectiveWithRelations, TeamWithLeader, UserProfileOption } from "@/types/domain";

interface Props {
  objectives: ObjectiveWithRelations[];
  teams: TeamWithLeader[];
  profiles: UserProfileOption[];
}

type ObjectiveScope = "global" | "team" | "user";

type ObjectiveForm = {
  user_id: string;
  team_id: string;
  period: ObjectivePeriod;
  target: number;
  scope: ObjectiveScope;
};

export default function ObjectivesManager({ objectives, teams, profiles }: Props) {
  const { isAdmin } = useAuth();
  const createObjective = useCreateObjective();
  const updateObjective = useUpdateObjective();
  const deleteObjective = useDeleteObjective();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<ObjectiveForm>({ user_id: "", team_id: "", period: "mensual", target: 0, scope: "global" });

  const handleCreate = () => {
    const obj: ObjectiveInsert = { period: form.period, target: form.target };
    if (form.scope === "user" && form.user_id) obj.user_id = form.user_id;
    if (form.scope === "team" && form.team_id) obj.team_id = form.team_id;
    createObjective.mutate(obj, { onSuccess: () => setOpen(false) });
  };

  const globalObjs = objectives.filter((o) => !o.user_id && !o.team_id);
  const teamObjs = objectives.filter((o) => o.team_id && !o.user_id);
  const userObjs = objectives.filter((o) => o.user_id);

  const periodLabel = (p: ObjectivePeriod) => p === "diario" ? "Diario" : p === "semanal" ? "Semanal" : "Mensual";

  return (
    <div className="space-y-6">
      {isAdmin && (
        <div className="flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-1" />Nuevo Objetivo</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Crear Objetivo</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Alcance</Label>
                  <Select value={form.scope} onValueChange={(v: ObjectiveScope) => setForm({ ...form, scope: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="global">Global</SelectItem>
                      <SelectItem value="team">Equipo</SelectItem>
                      <SelectItem value="user">Captador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.scope === "team" && (
                  <div>
                    <Label>Equipo</Label>
                    <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                      <SelectContent>
                        {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {form.scope === "user" && (
                  <div>
                    <Label>Captador</Label>
                    <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar captador" /></SelectTrigger>
                      <SelectContent>
                        {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Periodo</Label>
                  <Select value={form.period} onValueChange={(v: ObjectivePeriod) => setForm({ ...form, period: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diario">Diario</SelectItem>
                      <SelectItem value="semanal">Semanal</SelectItem>
                      <SelectItem value="mensual">Mensual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Meta (socios)</Label>
                  <Input type="number" value={form.target} onChange={(e) => setForm({ ...form, target: Number(e.target.value) })} />
                </div>
                <Button onClick={handleCreate} disabled={createObjective.isPending} className="w-full">Crear Objetivo</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Global */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Objetivos Globales</CardTitle></CardHeader>
        <CardContent>
          {globalObjs.length > 0 ? (
            <div className="space-y-2">
              {globalObjs.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{periodLabel(o.period)}</Badge>
                    <span className="font-medium">{o.target} socios</span>
                  </div>
                  {isAdmin && <Button variant="ghost" size="sm" onClick={() => deleteObjective.mutate(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Sin objetivos globales</p>}
        </CardContent>
      </Card>

      {/* By team */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Objetivos por Equipo</CardTitle></CardHeader>
        <CardContent>
          {teamObjs.length > 0 ? (
            <div className="space-y-2">
              {teamObjs.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <Badge>{o.team?.name}</Badge>
                    <Badge variant="outline">{periodLabel(o.period)}</Badge>
                    <span className="font-medium">{o.target} socios</span>
                  </div>
                  {isAdmin && <Button variant="ghost" size="sm" onClick={() => deleteObjective.mutate(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Sin objetivos por equipo</p>}
        </CardContent>
      </Card>

      {/* By user */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Objetivos por Captador</CardTitle></CardHeader>
        <CardContent>
          {userObjs.length > 0 ? (
            <div className="space-y-2">
              {userObjs.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{o.profile?.full_name || o.profile?.email}</span>
                    <Badge variant="outline">{periodLabel(o.period)}</Badge>
                    <span className="font-medium">{o.target} socios</span>
                  </div>
                  {isAdmin && <Button variant="ghost" size="sm" onClick={() => deleteObjective.mutate(o.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              ))}
            </div>
          ) : <p className="text-sm text-muted-foreground">Sin objetivos individuales</p>}
        </CardContent>
      </Card>
    </div>
  );
}
