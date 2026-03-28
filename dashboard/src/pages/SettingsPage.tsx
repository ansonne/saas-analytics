import { useState } from 'react'
import { Save, Loader2, Settings2, Info } from 'lucide-react'
import { useAgentState, useUpdateAgentState } from '../hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'

export default function SettingsPage() {
  const { data: settings, isLoading } = useAgentState()
  const updateSetting = useUpdateAgentState()
  const [editingKey, setEditingKey] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const handleEdit = (key: string, value: string) => {
    setEditingKey(key)
    setEditValue(value)
  }

  const handleSave = async () => {
    if (!editingKey) return
    await updateSetting.mutateAsync({ key: editingKey, value: editValue })
    setEditingKey(null)
    setEditValue('')
  }

  const handleCancel = () => {
    setEditingKey(null)
    setEditValue('')
  }

  const settingLabels: Record<string, { label: string; description: string }> = {
    default_model: {
      label: 'Modelo LLM',
      description: 'Modelo utilizado para responder perguntas',
    },
    mcp_tool_call_limit: {
      label: 'Limite de Tool Calls',
      description: 'Número máximo de chamadas de ferramenta por resposta',
    },
    daily_budget_usd: {
      label: 'Orçamento Diário (USD)',
      description: 'Limite de gasto diário em dólares',
    },
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
        <p className="text-muted-foreground mt-1">Ajustes do agente de analytics</p>
      </div>

      <Card className="animate-fade-in animate-delay-100">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Configurações do Agente</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {settings?.filter((s) => s.key in settingLabels).map((setting, index) => {
              const info = settingLabels[setting.key]
              const isEditing = editingKey === setting.key

              return (
                <div
                  key={setting.key}
                  className="p-5 flex items-start gap-4 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex-1">
                    <label className="font-medium text-foreground">{info.label}</label>
                    {info.description && (
                      <p className="text-sm text-muted-foreground mt-0.5">{info.description}</p>
                    )}
                    {isEditing ? (
                      <div className="mt-3 flex gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 border border-input rounded-md px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                        <Button
                          onClick={handleSave}
                          disabled={updateSetting.isPending}
                          size="sm"
                        >
                          {updateSetting.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <Save className="h-4 w-4 mr-1" />
                          )}
                          Salvar
                        </Button>
                        <Button
                          onClick={handleCancel}
                          variant="outline"
                          size="sm"
                        >
                          Cancelar
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <code className="text-sm text-foreground font-mono bg-muted px-2 py-1 rounded">
                          {setting.value}
                        </code>
                      </div>
                    )}
                  </div>
                  {!isEditing && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(setting.key, setting.value)}
                    >
                      Editar
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in animate-delay-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base">Informações do Sistema</CardTitle>
          </div>
          <CardDescription>Dados técnicos da aplicação</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="text-sm text-muted-foreground">Versão</span>
              <div className="mt-1">
                <Badge variant="secondary">0.1.0</Badge>
              </div>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">API Endpoint</span>
              <div className="mt-1">
                <code className="text-sm font-mono text-foreground">/api</code>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
