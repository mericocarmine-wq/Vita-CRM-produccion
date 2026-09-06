import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateCapture } from "@/hooks/useTeamResults";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import type { TeamWithLeader, UserProfileOption } from "@/types/domain";

interface Props {
  teams: TeamWithLeader[];
  profiles: UserProfileOption[];
}

export default function CaptureDialog({ teams, profiles }: Props) {
  const createCapture = useCreateCapture();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    user_id: "",
    team_id: "",
    capture_date: format(new Date(), "yyyy-MM-dd"),
    num_socios: 0,
    location: "",
    notes: "",
  });

  const handleSubmit = () => {
    if (!form.user_id || form.num_socios <= 0) return;
    createCapture.mutate(
      {
        user_id: form.user_id,
        team_id: form.team_id || null,
        capture_date: form.capture_date,
        num_socios: form.num_socios,
        location: form.location || null,
        notes: form.notes || null,
      },
      { onSuccess: () => { setOpen(false); setForm({ user_id: "", team_id: "", capture_date: format(new Date(), "yyyy-MM-dd"), num_socios: 0, location: "", notes: "" }); } }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="h-4 w-4 mr-1" />Registrar Captación</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Registrar Captación</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Captador</Label>
            <Select value={form.user_id} onValueChange={(v) => setForm({ ...form, user_id: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar captador" /></SelectTrigger>
              <SelectContent>
                {profiles.map((p) => <SelectItem key={p.id} value={p.id}>{p.full_name || p.email}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Equipo</Label>
            <Select value={form.team_id} onValueChange={(v) => setForm({ ...form, team_id: v })}>
              <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
              <SelectContent>
                {teams.map((t) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Fecha</Label>
            <Input type="date" value={form.capture_date} onChange={(e) => setForm({ ...form, capture_date: e.target.value })} />
          </div>
          <div>
            <Label>Nº Socios Captados</Label>
            <Input type="number" min={0} value={form.num_socios} onChange={(e) => setForm({ ...form, num_socios: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Ubicación (opcional)</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="Ej: Centro Comercial X" />
          </div>
          <div>
            <Label>Notas (opcional)</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </div>
          <Button onClick={handleSubmit} disabled={createCapture.isPending || !form.user_id || form.num_socios <= 0} className="w-full">
            Registrar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
