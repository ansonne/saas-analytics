import { useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { useSubscriptionMetrics, usePaymentMetrics } from '../hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'hsl(var(--success))',
  INACTIVE: 'hsl(var(--muted-foreground))',
  CANCELED: 'hsl(var(--destructive))',
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Ativas',
  INACTIVE: 'Inativas',
  CANCELED: 'Canceladas',
}

export default function SubscriptionsPage() {
  const [days, setDays] = useState('30')
  const { data: subscriptions, isLoading: subsLoading } = useSubscriptionMetrics(Number(days))
  const { data: payments, isLoading: paymentsLoading } = usePaymentMetrics(Number(days))

  const isLoading = subsLoading || paymentsLoading

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statusData = Object.entries(subscriptions?.status_breakdown ?? {}).map(
    ([name, value]) => ({
      name,
      label: STATUS_LABELS[name] || name,
      value,
      color: STATUS_COLORS[name] ?? 'hsl(var(--muted-foreground))',
    })
  )

  const totalSubscriptions = statusData.reduce((sum, item) => sum + item.value, 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Assinaturas</h1>
          <p className="text-muted-foreground mt-1">Débito automático e pagamentos recorrentes</p>
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {statusData.map(({ name, label, value, color }, index) => (
          <Card
            key={name}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium text-muted-foreground">{label}</span>
              </div>
              <p className="text-3xl font-display font-bold">
                {value.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalSubscriptions > 0 ? ((value / totalSubscriptions) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in animate-delay-100">
          <CardHeader>
            <CardTitle className="text-base">Novas Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {subscriptions?.new_subscriptions_series?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={subscriptions.new_subscriptions_series}>
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
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('pt-BR')}
                      formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Novas']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--success))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--success))', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Sem novas assinaturas no período
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-delay-200">
          <CardHeader>
            <CardTitle className="text-base">Cancelamentos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {subscriptions?.cancellation_series?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={subscriptions.cancellation_series}>
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
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('pt-BR')}
                      formatter={(v: number) => [v.toLocaleString('pt-BR'), 'Cancelamentos']}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="hsl(var(--destructive))"
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--destructive))', r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                  Sem cancelamentos no período
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="animate-fade-in animate-delay-300">
        <CardHeader>
          <CardTitle className="text-base">Pagamentos: Sucesso vs Falha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {payments?.success_rate_series?.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={payments.success_rate_series.map((item) => ({
                    date: item.date,
                    Sucesso:
                      (payments.success_series?.find((s) => s.date === item.date)?.value ?? 0),
                    Falha:
                      (payments.failed_series?.find((f) => f.date === item.date)?.value ?? 0),
                  }))}
                >
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
                  <YAxis
                    tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('pt-BR')}
                    formatter={(v: number, name: string) => [v.toLocaleString('pt-BR'), name]}
                  />
                  <Legend />
                  <Bar dataKey="Sucesso" stackId="a" fill="hsl(var(--success))" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Falha" stackId="a" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sem dados de pagamento no período
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
