import { useState } from 'react'

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCEEDED: 'Login realizado',
  LOGIN_FAILED: 'Login falhou',
  PAYMENT_CARD_OK: 'Pagamento aprovado',
  PAYMENT_CARD_FAILED: 'Pagamento recusado',
  PAYMENT_PIX_OK: 'Pagamento PIX realizado',
  PAYMENT_SLIP_OK: 'Pagamento via boleto',
  SUBSCRIPTION_CREATED: 'Assinatura criada',
  SUBSCRIPTION_UPDATED: 'Assinatura atualizada',
  SUBSCRIPTION_CANCELLED: 'Assinatura cancelada',
  SUBSCRIPTION_PAYMENT_OK: 'Pgto. assinatura aprovado',
  SUBSCRIPTION_PAYMENT_FAILED: 'Pgto. assinatura recusado',
  CARD_CREATED: 'Cartão cadastrado',
  CARD_UPDATED: 'Cartão atualizado',
  CARD_INACTIVE: 'Cartão inativado',
  INVOICE_VIEWED: 'Fatura visualizada',
  INVOICE_PIX_CREATED: 'Cobrança PIX gerada',
  INVOICE_SLIP_CREATED: 'Boleto gerado',
}
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'
import { useActivityMetrics } from '../hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'
import { ScrollArea } from '../components/ui/scroll-area'

const COLORS = ['hsl(217, 91%, 60%)', 'hsl(142, 76%, 36%)', 'hsl(38, 92%, 50%)', 'hsl(0, 84%, 60%)', 'hsl(280, 65%, 60%)', 'hsl(190, 90%, 50%)']

export default function ActivityPage() {
  const [days, setDays] = useState('30')
  const { data: activity, isLoading } = useActivityMetrics(Number(days))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const pieData = Object.entries(activity?.actions_breakdown ?? {})
    .slice(0, 6)
    .map(([name, value]) => ({ name: ACTION_LABELS[name] ?? name, value }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Atividade de Usuários</h1>
          <p className="text-muted-foreground mt-1">Logins e ações dos clientes</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="animate-fade-in animate-delay-100">
        <CardHeader>
          <CardTitle className="text-base">Usuários Ativos por Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {activity?.dau_series?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={activity.dau_series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    tickFormatter={(v) =>
                      new Date(v + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
                    }
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis allowDecimals={false}
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Usuários']}
                  />
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5, fill: 'hsl(var(--primary))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sem dados de atividade no período
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in animate-delay-200">
          <CardHeader>
            <CardTitle className="text-base">Distribuição de Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              {pieData.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      formatter={(value: string) => value.replace(/_/g, ' ')}
                      wrapperStyle={{ fontSize: '11px' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(v: number) => v.toLocaleString('pt-BR')}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Sem dados no período
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-delay-300">
          <CardHeader>
            <CardTitle className="text-base">Todas as Ações</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              <div className="space-y-2 pr-4">
                {Object.keys(activity?.actions_breakdown ?? {}).length ? (
                  Object.entries(activity?.actions_breakdown ?? {}).map(([action, count]) => (
                    <div
                      key={action}
                      className="flex justify-between text-sm py-2 border-b border-border last:border-0"
                    >
                      <span className="text-foreground">{ACTION_LABELS[action] ?? action}</span>
                      <span className="text-muted-foreground font-medium tabular-nums">
                        {count.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm py-8">
                    Sem ações no período
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
