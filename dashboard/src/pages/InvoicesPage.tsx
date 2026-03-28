import { useState } from 'react'
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
import { useInvoiceMetrics } from '../hooks/useApi'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select'

const STATUS_COLORS: Record<string, string> = {
  PAID: 'hsl(var(--success))',
  PENDING: 'hsl(var(--primary))',
  FAILED: 'hsl(var(--destructive))',
  CANCELED: 'hsl(var(--muted-foreground))',
  ERROR: 'hsl(35 90% 55%)',
}

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Pagas',
  PENDING: 'Pendentes',
  FAILED: 'Falhas',
  CANCELED: 'Canceladas',
  ERROR: 'Erro',
}

export default function InvoicesPage() {
  const [days, setDays] = useState('30')
  const { data: invoices, isLoading } = useInvoiceMetrics(Number(days))

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const STATUS_ORDER = ['PAID', 'PENDING', 'FAILED', 'CANCELED', 'ERROR']
  const breakdown = invoices?.status_breakdown ?? {}
  const pieData = STATUS_ORDER
    .map((name) => ({
      name,
      label: STATUS_LABELS[name] || name,
      value: breakdown[name] ?? 0,
      color: STATUS_COLORS[name] ?? 'hsl(var(--muted-foreground))',
    }))
    .filter(({ value }) => value > 0)

  const totalInvoices = pieData.reduce((sum, item) => sum + item.value, 0)

  const chartData = (invoices?.created_series ?? []).map((item) => {
    const paidItem = invoices?.paid_series?.find((p) => p.date === item.date)
    return {
      date: item.date,
      created: item.value,
      paid: paidItem?.value ?? 0,
    }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between animate-fade-in">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Faturas</h1>
          <p className="text-muted-foreground mt-1">Análise de faturas criadas e pagas</p>
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

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {pieData.map(({ name, label, value, color }, index) => (
          <Card
            key={name}
            className="animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-medium text-muted-foreground">{label}</span>
              </div>
              <p className="text-2xl font-display font-bold">
                {value.toLocaleString('pt-BR')}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalInvoices > 0 ? ((value / totalInvoices) * 100).toFixed(1) : 0}% do total
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="animate-fade-in animate-delay-200">
        <CardHeader>
          <CardTitle className="text-base">Faturas Criadas vs Pagas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            {chartData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
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
                    formatter={(v: number, name: string) => [
                      v.toLocaleString('pt-BR'),
                      name === 'created' ? 'Criadas' : 'Pagas',
                    ]}
                  />
                  <Legend formatter={(value) => (value === 'created' ? 'Criadas' : 'Pagas')} />
                  <Line
                    type="monotone"
                    dataKey="created"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    name="created"
                    dot={{ fill: 'hsl(var(--primary))', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="paid"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    name="paid"
                    dot={{ fill: 'hsl(var(--success))', r: 3, strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sem dados de faturas no período
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="animate-fade-in animate-delay-300">
        <CardHeader>
          <CardTitle className="text-base">Distribuição por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            {pieData.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(v: number, _name: string, props: { payload?: { label?: string } }) => [
                      v.toLocaleString('pt-BR'),
                      props.payload?.label ?? _name,
                    ]}
                  />
                  <Legend
                    iconType="circle"
                    iconSize={8}
                    formatter={(_value, entry) => (entry.payload as { label?: string } | undefined)?.label ?? _value}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                Sem dados de status
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
