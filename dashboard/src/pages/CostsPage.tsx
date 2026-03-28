import { useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { DollarSign, MessageSquare, ArrowDown, ArrowUp } from 'lucide-react'
import { useCostMetrics } from '../hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  index,
}: {
  title: string
  value: string
  subtitle?: string
  icon: React.ElementType
  index: number
}) {
  return (
    <Card className="animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </div>
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function formatUSD(value: number): string {
  return `$${value.toFixed(4)}`
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

export default function CostsPage() {
  const [days, setDays] = useState('30')
  const { data, isLoading } = useCostMetrics(Number(days))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const chartData = (data?.daily_series ?? []).map((p) => ({
    date: p.date.slice(5), // MM-DD
    cost: p.cost_usd,
    input: p.input_tokens,
    output: p.output_tokens,
    messages: p.messages,
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Custos de IA</h1>
          <p className="text-muted-foreground mt-1">Gastos com o modelo de linguagem por dia</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Últimos 7 dias</SelectItem>
            <SelectItem value="30">Últimos 30 dias</SelectItem>
            <SelectItem value="60">Últimos 60 dias</SelectItem>
            <SelectItem value="90">Últimos 90 dias</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          title="Total gasto (USD)"
          value={formatUSD(data?.total_cost_usd ?? 0)}
          subtitle={`últimos ${days} dias`}
          icon={DollarSign}
          index={0}
        />
        <StatCard
          title="Mensagens"
          value={String(data?.total_messages ?? 0)}
          subtitle="respostas do agente"
          icon={MessageSquare}
          index={1}
        />
        <StatCard
          title="Tokens de entrada"
          value={formatTokens(data?.total_input_tokens ?? 0)}
          subtitle="total no período"
          icon={ArrowDown}
          index={2}
        />
        <StatCard
          title="Tokens de saída"
          value={formatTokens(data?.total_output_tokens ?? 0)}
          subtitle="total no período"
          icon={ArrowUp}
          index={3}
        />
      </div>

      <Card className="animate-fade-in animate-delay-200">
        <CardHeader>
          <CardTitle className="text-base">Custo diário (USD)</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Nenhum dado disponível para o período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tickFormatter={(v) => `$${v.toFixed(4)}`}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  formatter={(value: number) => [formatUSD(value), 'Custo']}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="cost" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card className="animate-fade-in animate-delay-300">
        <CardHeader>
          <CardTitle className="text-base">Tokens por dia</CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-muted-foreground text-sm">
              Nenhum dado disponível para o período
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis
                  tickFormatter={(v) => formatTokens(v)}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <Tooltip
                  formatter={(value: number, name: string) => [
                    formatTokens(value),
                    name === 'input' ? 'Entrada' : 'Saída',
                  ]}
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                  }}
                />
                <Bar dataKey="input" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} name="input" />
                <Bar dataKey="output" fill="hsl(142, 76%, 36%)" radius={[4, 4, 0, 0]} name="output" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
