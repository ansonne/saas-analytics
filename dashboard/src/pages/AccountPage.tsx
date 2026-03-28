import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { fetchApi } from '../api/client'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Save, Loader2, User } from 'lucide-react'

const ROLE_LABELS: Record<string, string> = {
  MASTER: 'Master',
  ADMIN: 'Admin',
  USER: 'Usuário',
}

export default function AccountPage() {
  const { user } = useAuth()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (next !== confirm) {
      setError('A nova senha e a confirmação não coincidem.')
      return
    }
    if (next.length < 8) {
      setError('A nova senha deve ter pelo menos 8 caracteres.')
      return
    }

    setLoading(true)
    try {
      await fetchApi('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ current_password: current, new_password: next }),
      })
      setSuccess(true)
      setCurrent('')
      setNext('')
      setConfirm('')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Erro ao alterar senha')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-display font-bold text-foreground">Minha Conta</h1>
        <p className="text-muted-foreground mt-1">Informações e segurança da sua conta</p>
      </div>

      <Card className="animate-fade-in animate-delay-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Perfil</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">E-mail</span>
            <span className="font-mono">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Perfil</span>
            <span>{user ? ROLE_LABELS[user.role] : '—'}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in animate-delay-200">
        <CardHeader>
          <CardTitle className="text-base">Alterar senha</CardTitle>
          <CardDescription>Use uma senha forte com pelo menos 8 caracteres.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Senha atual</label>
              <input
                type="password"
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Nova senha</label>
              <input
                type="password"
                value={next}
                onChange={(e) => setNext(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Confirmar nova senha</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {success && <p className="text-sm text-green-600">Senha alterada com sucesso!</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar nova senha
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
