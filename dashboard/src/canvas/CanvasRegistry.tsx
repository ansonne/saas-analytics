import {
  LineChart as RechartsLine,
  Line,
  BarChart as RechartsBar,
  Bar,
  PieChart as RechartsPie,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import StatCard from '../components/StatCard'
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card'
import type { CanvasComponent } from './parseCanvas'

const COLORS = [
  'hsl(var(--primary))',
  'hsl(220 70% 60%)',
  'hsl(160 60% 45%)',
  'hsl(35 90% 55%)',
  'hsl(280 65% 60%)',
  'hsl(0 70% 55%)',
]

// ——— StatCard ———

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
}

function CanvasStatCard({ title, value, change, changeLabel }: StatCardProps) {
  return <StatCard title={title} value={value} change={change} changeLabel={changeLabel} />
}

// ——— LineChart ———

interface LineSeries {
  name: string
  data: { date: string; value: number }[]
}

interface LineChartProps {
  title?: string
  lines: LineSeries[]
}

function CanvasLineChart({ title, lines }: LineChartProps) {
  // Merge all series into a unified date-keyed array
  const dateMap: Record<string, Record<string, number>> = {}
  for (const series of lines) {
    for (const point of series.data) {
      dateMap[point.date] = dateMap[point.date] ?? {}
      dateMap[point.date][series.name] = point.value
    }
  }
  const data = Object.entries(dateMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, vals]) => ({ date: date.slice(5), ...vals }))

  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? 'pt-0' : 'pt-4'}>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsLine data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              {lines.length > 1 && <Legend />}
              {lines.map((s, i) => (
                <Line
                  key={s.name}
                  type="monotone"
                  dataKey={s.name}
                  stroke={COLORS[i % COLORS.length]}
                  dot={false}
                  strokeWidth={2}
                />
              ))}
            </RechartsLine>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ——— BarChart ———

interface BarChartProps {
  title?: string
  data: { name: string; value: number }[]
}

function CanvasBarChart({ title, data }: BarChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? 'pt-0' : 'pt-4'}>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsBar data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </RechartsBar>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ——— PieChart ———

interface PieChartProps {
  title?: string
  data: { name: string; value: number }[]
}

function CanvasPieChart({ title, data }: PieChartProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={title ? 'pt-0' : 'pt-4'}>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <RechartsPie>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {data.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend iconType="circle" iconSize={8} />
            </RechartsPie>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}

// ——— DataTable ———

interface DataTableProps {
  title?: string
  columns: string[]
  rows: (string | number)[][]
}

function CanvasDataTable({ title, columns, rows }: DataTableProps) {
  return (
    <Card>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={`overflow-x-auto ${title ? 'pt-0' : 'pt-4'}`}>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b text-muted-foreground">
              {columns.map((col, i) => (
                <th key={i} className="text-left px-2 py-1.5 font-medium whitespace-nowrap">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-b last:border-0 hover:bg-muted/30">
                {row.map((cell, ci) => (
                  <td key={ci} className="px-2 py-1.5 whitespace-nowrap">
                    {String(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </CardContent>
    </Card>
  )
}

// ——— Registry ———

type AnyProps = Record<string, unknown>

const REGISTRY: Record<string, (props: AnyProps) => React.ReactElement | null> = {
  StatCard: (p) => <CanvasStatCard {...(p as unknown as StatCardProps)} />,
  LineChart: (p) => <CanvasLineChart {...(p as unknown as LineChartProps)} />,
  BarChart: (p) => <CanvasBarChart {...(p as unknown as BarChartProps)} />,
  PieChart: (p) => <CanvasPieChart {...(p as unknown as PieChartProps)} />,
  DataTable: (p) => <CanvasDataTable {...(p as unknown as DataTableProps)} />,
}

export function renderCanvasComponent(component: CanvasComponent, key: number) {
  const renderer = REGISTRY[component.type]
  if (!renderer) return null
  return <div key={key}>{renderer(component.props)}</div>
}
