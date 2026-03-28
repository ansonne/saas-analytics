import { Users, CreditCard, FileText, TrendingUp, Zap } from 'lucide-react'
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
} from 'recharts'
import StatCard from '../components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import { useOverview, useActivityMetrics, usePaymentMetrics } from '../hooks/useApi'

export default function OverviewPage() {
  const { data: overview, isLoading: overviewLoading } = useOverview()
  const { data: activity } = useActivityMetrics(30)
  const { data: payments } = usePaymentMetrics(30)

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="animate-fade-in">
        <h1 className="text-2xl font-display font-bold text-foreground">Visão Geral</h1>
        <p className="text-muted-foreground mt-1">Métricas principais do ServicePay</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="animate-fade-in">
          <StatCard
            title="Usuários Ativos Hoje"
            value={overview?.dau_today ?? 0}
            change={overview?.dau_change_pct}
            changeLabel="vs ontem"
            icon={<Users className="h-5 w-5" />}
          />
        </div>
        <div className="animate-fade-in animate-delay-100">
          <StatCard
            title="Assinaturas Ativas"
            value={overview?.active_subscriptions ?? 0}
            icon={<CreditCard className="h-5 w-5" />}
          />
        </div>
        <div className="animate-fade-in animate-delay-200">
          <StatCard
            title="Faturas Criadas Hoje"
            value={overview?.invoices_created_today ?? 0}
            icon={<FileText className="h-5 w-5" />}
          />
        </div>
        <div className="animate-fade-in animate-delay-300">
          <StatCard
            title="Taxa de Sucesso (30d)"
            value={`${overview?.payment_success_rate ?? 0}%`}
            icon={<TrendingUp className="h-5 w-5" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="animate-fade-in animate-delay-200">
          <CardHeader>
            <CardTitle className="text-base">Usuários Ativos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {activity?.dau_series?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={activity.dau_series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
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
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                      labelFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('pt-BR')}
                      formatter={(v: number) => [v, 'Usuários']}
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
                  Sem dados de usuários no período
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in animate-delay-300">
          <CardHeader>
            <CardTitle className="text-base">Taxa de Sucesso de Pagamentos (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              {payments?.success_rate_series?.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={payments.success_rate_series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      tickFormatter={(v) => new Date(v + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      tickLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                      domain={[0, 100]}
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
                      formatter={(v: number) => [`${v}%`, 'Taxa']}
                    />
                    <Bar
                      dataKey="rate"
                      fill="hsl(var(--success))"
                      radius={[4, 4, 0, 0]}
                    />
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

      <Card className="animate-fade-in animate-delay-400">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-warning" />
            <CardTitle className="text-base">Ações Mais Frequentes (30 dias)</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {activity?.top_actions?.slice(0, 8).map(({ action, count }, index) => (
              <div
                key={action}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-foreground font-medium">{action}</span>
                  <span className="text-muted-foreground tabular-nums">
                    {count.toLocaleString('pt-BR')}
                  </span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{
                      width: `${(count / (activity?.top_actions?.[0]?.count || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
            {!activity?.top_actions?.length && (
              <div className="text-center py-8 text-muted-foreground text-sm">
                Sem ações registradas no período
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
