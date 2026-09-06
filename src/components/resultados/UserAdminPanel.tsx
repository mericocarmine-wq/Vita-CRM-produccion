import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useUsersWithDetails, useCreateUser, useUpdateUserRole, useDeleteUser, UserWithDetails } from "@/hooks/useUserAdmin";
import { useTeams } from "@/hooks/useTeamResults";
import { UserPlus, Pencil, Trash2, Users, Shield, Search, AlertTriangle } from "lucide-react";
import { format } from "date-fns";

export default function UserAdminPanel() {
  const { data: users, isLoading } = useUsersWithDetails();
  const { data: teams } = useTeams();
  const createUser = useCreateUser();
  const updateRole = useUpdateUserRole();
  const deleteUser = useDeleteUser();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterTeam, setFilterTeam] = useState<string>("all");

  // Create user dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    full_name: "",
    email: "",
    password: "",
    teamRole: "captador" as "jefe" | "captador",
    team_id: "",
  });

  // Edit user dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserWithDetails | null>(null);
  const [editForm, setEditForm] = useState({
    teamRole: "captador" as "jefe" | "captador",
    team_id: "",
  });

  // Delete user dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserWithDetails | null>(null);
  const [reassignTo, setReassignTo] = useState("");

  const jefes = useMemo(() => {
    return users?.filter((u) => u.team_member?.role === "jefe") || [];
  }, [users]);

  const teamsForCaptador = useMemo(() => {
    return teams || [];
  }, [teams]);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter((u) => {
      const matchSearch = !search || 
        u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = filterRole === "all" ||
        (filterRole === "jefe" && u.team_member?.role === "jefe") ||
        (filterRole === "captador" && u.team_member?.role === "captador") ||
        (filterRole === "sin_asignar" && !u.team_member) ||
        (filterRole === "admin" && u.role === "admin");
      const matchTeam = filterTeam === "all" || u.team_member?.team_id === filterTeam;
      return matchSearch && matchRole && matchTeam;
    });
  }, [users, search, filterRole, filterTeam]);

  const pendingUsers = useMemo(() => {
    return users?.filter((u) => !u.team_member && u.role !== "admin") || [];
  }, [users]);

  const handleCreate = () => {
    if (!createForm.full_name || !createForm.email || !createForm.password) return;
    if (createForm.teamRole === "captador" && !createForm.team_id) return;
    createUser.mutate(createForm, {
      onSuccess: () => {
        setCreateOpen(false);
        setCreateForm({ full_name: "", email: "", password: "", teamRole: "captador", team_id: "" });
      },
    });
  };

  const openEdit = (user: UserWithDetails) => {
    setEditUser(user);
    setEditForm({
      teamRole: user.team_member?.role || "captador",
      team_id: user.team_member?.team_id || "",
    });
    setEditOpen(true);
  };

  const handleEdit = () => {
    if (!editUser) return;
    if (editForm.teamRole === "captador" && !editForm.team_id) return;
    updateRole.mutate(
      { userId: editUser.id, teamRole: editForm.teamRole, team_id: editForm.team_id || undefined },
      { onSuccess: () => setEditOpen(false) }
    );
  };

  const openDelete = (user: UserWithDetails) => {
    setDeleteTarget(user);
    setReassignTo("");
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteUser.mutate(
      { userId: deleteTarget.id, reassignTo: reassignTo === "none" ? undefined : reassignTo || undefined },
      { onSuccess: () => setDeleteOpen(false) }
    );
  };

  const isLeader = (user: UserWithDetails) => user.team_member?.role === "jefe";

  if (isLoading) return <div className="flex items-center justify-center py-10 text-muted-foreground">Cargando usuarios...</div>;

  return (
    <div className="space-y-6">
      {/* Pending users alert */}
      {pendingUsers.length > 0 && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-yellow-600">
              <AlertTriangle className="h-4 w-4" />
              Usuarios pendientes de asignación ({pendingUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingUsers.map((u) => (
                <div key={u.id} className="flex items-center justify-between p-3 bg-background rounded-md border">
                  <div>
                    <p className="text-sm font-medium">{u.full_name || "Sin nombre"}</p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                    <p className="text-xs text-muted-foreground">Registrado: {format(new Date(u.created_at), "dd/MM/yyyy HH:mm")}</p>
                  </div>
                  <Button size="sm" onClick={() => openEdit(u)}>
                    <Shield className="h-3 w-3 mr-1" />
                    Asignar rol
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre o email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por rol" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los roles</SelectItem>
            <SelectItem value="jefe">Jefes de equipo</SelectItem>
            <SelectItem value="captador">Captadores</SelectItem>
            <SelectItem value="sin_asignar">Sin asignar</SelectItem>
            <SelectItem value="admin">Administradores</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterTeam} onValueChange={setFilterTeam}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Filtrar por equipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los equipos</SelectItem>
            {teamsForCaptador.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Create user button */}
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-1" />Crear usuario</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Crear nuevo usuario</DialogTitle>
              <DialogDescription>Rellena los datos del nuevo usuario y asigna su rol.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nombre completo</Label>
                <Input
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  placeholder="Nombre y apellidos"
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="usuario@email.com"
                />
              </div>
              <div>
                <Label>Contraseña</Label>
                <Input
                  type="password"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                />
              </div>
              <div>
                <Label>Rol</Label>
                <Select
                  value={createForm.teamRole}
                  onValueChange={(v: "jefe" | "captador") => setCreateForm({ ...createForm, teamRole: v, team_id: "" })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jefe">Jefe de equipo</SelectItem>
                    <SelectItem value="captador">Captador</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  {createForm.teamRole === "jefe"
                    ? "Los jefes de equipo no requieren asignación a un equipo."
                    : "Los captadores deben pertenecer a un equipo."}
                </p>
              </div>

              {createForm.teamRole === "captador" && (
                <div>
                  <Label>Asignar a jefe de equipo <span className="text-destructive">*</span></Label>
                  <Select value={createForm.team_id} onValueChange={(v) => setCreateForm({ ...createForm, team_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                    <SelectContent>
                      {teamsForCaptador.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name} — {t.leader?.full_name || t.leader?.email || "Sin líder"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {teamsForCaptador.length === 0 && (
                    <p className="text-xs text-destructive mt-1">No hay equipos disponibles. Crea un equipo primero.</p>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
              <Button
                onClick={handleCreate}
                disabled={createUser.isPending || !createForm.full_name || !createForm.email || !createForm.password || (createForm.teamRole === "captador" && !createForm.team_id)}
              >
                {createUser.isPending ? "Creando..." : "Crear usuario"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-foreground">{users?.length || 0}</p>
            <p className="text-xs text-muted-foreground">Total usuarios</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-primary">{jefes.length}</p>
            <p className="text-xs text-muted-foreground">Jefes de equipo</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-foreground">{users?.filter((u) => u.team_member?.role === "captador").length || 0}</p>
            <p className="text-xs text-muted-foreground">Captadores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pendingUsers.length}</p>
            <p className="text-xs text-muted-foreground">Pendientes</p>
          </CardContent>
        </Card>
      </div>

      {/* Users table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Equipo</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                        {user.full_name?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      {user.full_name || "Sin nombre"}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                  <TableCell>
                    {user.role === "admin" ? (
                      <Badge className="bg-primary/20 text-primary border-primary/30">Admin</Badge>
                    ) : user.team_member?.role === "jefe" ? (
                      <Badge variant="outline" className="border-blue-500/50 text-blue-600">Jefe de equipo</Badge>
                    ) : user.team_member?.role === "captador" ? (
                      <Badge variant="outline" className="border-green-500/50 text-green-600">Captador</Badge>
                    ) : (
                      <Badge variant="outline" className="border-yellow-500/50 text-yellow-600">Sin asignar</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {user.team_member ? (
                      <span className="text-sm flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {user.team_member.team_name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(user.created_at), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    {user.role !== "admin" && (
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(user)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openDelete(user)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredUsers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se encontraron usuarios
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>
              {editUser?.full_name || editUser?.email} — Cambia el rol o equipo del usuario.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Rol</Label>
              <Select
                value={editForm.teamRole}
                onValueChange={(v: "jefe" | "captador") => setEditForm({ ...editForm, teamRole: v, team_id: "" })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jefe">Jefe de equipo</SelectItem>
                  <SelectItem value="captador">Captador</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                {editForm.teamRole === "jefe"
                  ? "Los jefes de equipo no requieren asignación."
                  : "Este captador debe pertenecer a un equipo."}
              </p>
            </div>

            {editForm.teamRole === "captador" && (
              <div>
                <Label>Asignar a equipo <span className="text-destructive">*</span></Label>
                <Select value={editForm.team_id} onValueChange={(v) => setEditForm({ ...editForm, team_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar equipo" /></SelectTrigger>
                  <SelectContent>
                    {teamsForCaptador.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} — {t.leader?.full_name || t.leader?.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleEdit}
              disabled={updateRole.isPending || (editForm.teamRole === "captador" && !editForm.team_id)}
            >
              {updateRole.isPending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Eliminar usuario
            </DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar a <strong>{deleteTarget?.full_name || deleteTarget?.email}</strong>? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>

          {deleteTarget && isLeader(deleteTarget) && (
            <div className="space-y-3 p-3 bg-yellow-500/5 border border-yellow-500/30 rounded-md">
              <p className="text-sm text-yellow-700 font-medium">
                Este usuario es jefe de equipo. ¿Qué hacer con sus captadores?
              </p>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger><SelectValue placeholder="Dejar sin asignación" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Dejar sin asignación</SelectItem>
                  {jefes
                    .filter((j) => j.id !== deleteTarget.id)
                    .map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        Reasignar a {j.full_name || j.email}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? "Eliminando..." : "Eliminar usuario"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
