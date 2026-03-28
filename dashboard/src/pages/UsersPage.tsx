import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import type { User } from '../api/types'
import { useAuth } from '../contexts/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'

const ROLE_LABELS: Record<string, string> = {
  MASTER: 'Master',
  ADMIN: 'Admin',
  USER: 'Usuário',
}

const ROLE_COLORS: Record<string, string> = {
  MASTER: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ADMIN: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  USER: 'bg-muted text-muted-foreground',
}

export default function UsersPage() {
  const { user: currentUser } = useAuth()
  const queryClient = useQueryClient()
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('USER')
  const [inviteResult, setInviteResult] = useState<{ email: string; initial_password: string } | null>(null)
  const [inviteError, setInviteError] = useState('')

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetchApi<User[]>('/auth/users'),
    enabled: currentUser?.role === 'MASTER',
  })

  const toggleActive = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      fetchApi<User>(`/auth/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active }),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
  })

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault()
    setInviteError('')
    setInviteResult(null)
    try {
      const res = await fetchApi<{ email: string; role: string; initial_password: string }>(
        '/auth/invite',
        { method: 'POST', body: JSON.stringify({ email: inviteEmail, role: inviteRole }) },
      )
      setInviteResult(res)
      setInviteEmail('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (err: unknown) {
      setInviteError(err instanceof Error ? err.message : 'Erro ao convidar')
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <h1 className="text-2xl font-bold">Usuários</h1>

      {/* Invite form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Convidar usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleInvite} className="flex gap-3 items-end flex-wrap">
            <div className="space-y-1.5 flex-1 min-w-48">
              <label className="text-sm font-medium">E-mail (@condoconta.com.br)</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="nome@condoconta.com.br"
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Perfil</label>
              <select
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              >
                <option value="USER">Usuário</option>
                <option value="ADMIN">Admin</option>
                {currentUser?.role === 'MASTER' && <option value="MASTER">Master</option>}
              </select>
            </div>
            <Button type="submit">Convidar</Button>
          </form>
          {inviteError && <p className="mt-2 text-sm text-destructive">{inviteError}</p>}
          {inviteResult && (
            <div className="mt-3 rounded-md bg-muted p-3 text-sm space-y-1">
              <p className="font-medium text-foreground">Usuário criado!</p>
              <p>E-mail: <span className="font-mono">{inviteResult.email}</span></p>
              <p>Senha inicial: <span className="font-mono select-all">{inviteResult.initial_password}</span></p>
              <p className="text-muted-foreground text-xs">Compartilhe a senha com o usuário via canal seguro.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Users list — MASTER only */}
      {currentUser?.role === 'MASTER' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Todos os usuários</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="px-4 py-2.5 text-left font-medium">E-mail</th>
                  <th className="px-4 py-2.5 text-left font-medium">Perfil</th>
                  <th className="px-4 py-2.5 text-left font-medium">Status</th>
                  <th className="px-4 py-2.5 text-left font-medium">Criado em</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-2.5 font-mono text-xs">{u.email}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_COLORS[u.role]}`}>
                        {ROLE_LABELS[u.role]}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex h-2 w-2 rounded-full ${u.is_active ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                      <span className="ml-1.5 text-xs text-muted-foreground">{u.is_active ? 'Ativo' : 'Inativo'}</span>
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      {u.id !== currentUser.id && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7"
                          onClick={() => toggleActive.mutate({ id: u.id, is_active: !u.is_active })}
                        >
                          {u.is_active ? 'Desativar' : 'Ativar'}
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
