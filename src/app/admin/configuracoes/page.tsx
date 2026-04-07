'use client';

import { useEffect, useState } from "react";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search, UserCheck, UserX } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { Profile, UserRole } from "@/types/supabase";

export default function AdminSettingsPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/admin/profiles?limit=100');
      if (response.ok) {
        const data = await response.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProfiles = profiles.filter(profile =>
    profile.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    profile.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleRoleChange = async (profileId: string, newRole: UserRole) => {
    try {
      const response = await fetch(`/api/admin/profiles/${profileId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });

      if (response.ok) {
        await fetchProfiles();
      }
    } catch (error) {
      console.error('Error updating profile role:', error);
    }
  };

  const handleDeleteProfile = async (profileId: string) => {
    if (!confirm('Tem certeza que deseja excluir este perfil? Esta ação não pode ser desfeita.')) return;

    try {
      const response = await fetch(`/api/admin/profiles/${profileId}`, { method: 'DELETE' });
      if (response.ok) {
        await fetchProfiles();
      }
    } catch (error) {
      console.error('Error deleting profile:', error);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Configurações do Sistema</h1>
      </div>

      <div className="space-y-8">
        {/* User Management Section */}
        <div className="bg-card rounded-2xl border p-6">
          <div className="flex items-center gap-2 mb-6">
            <UserCheck className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Gerenciamento de Usuários</h2>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Cadastro</TableHead>
                  <TableHead className="w-32">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProfiles.map((profile) => (
                  <TableRow key={profile.id}>
                    <TableCell className="font-medium">{profile.name}</TableCell>
                    <TableCell>{profile.email}</TableCell>
                    <TableCell>
                      <Select
                        value={profile.role}
                        onValueChange={(value) => handleRoleChange(profile.id, value as UserRole)}
                      >
                        <SelectTrigger className="w-32">
                          <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                            {profile.role === 'admin' ? 'Admin' : 'Cliente'}
                          </Badge>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="customer">Cliente</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {new Date(profile.created_at || '').toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteProfile(profile.id)}
                        disabled={profile.role === 'admin' && filteredProfiles.filter(p => p.role === 'admin').length === 1}
                      >
                        <UserX className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredProfiles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário encontrado.
            </div>
          )}
        </div>

        {/* System Info Section */}
        <div className="bg-card rounded-2xl border p-6">
          <h2 className="text-lg font-semibold mb-4">Informações do Sistema</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{profiles.length}</div>
              <div className="text-sm text-muted-foreground">Total de Usuários</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {profiles.filter(p => p.role === 'admin').length}
              </div>
              <div className="text-sm text-muted-foreground">Administradores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                {profiles.filter(p => p.role === 'customer').length}
              </div>
              <div className="text-sm text-muted-foreground">Clientes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {new Date().toLocaleDateString("pt-BR")}
              </div>
              <div className="text-sm text-muted-foreground">Data Atual</div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}