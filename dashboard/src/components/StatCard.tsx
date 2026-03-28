import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Card, CardContent } from './ui/card'
import { cn } from '../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon?: React.ReactNode
  className?: string
}

export default function StatCard({
  title,
  value,
  change,
  changeLabel,
  icon,
  className,
}: StatCardProps) {
  const isPositive = change !== undefined && change > 0
  const isNegative = change !== undefined && change < 0
  const isNeutral = change !== undefined && change === 0

  const displayValue = typeof value === 'number' ? value.toLocaleString('pt-BR') : value

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-display font-bold tracking-tight">{displayValue}</p>
          </div>
          {icon && (
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
        </div>
        {change !== undefined && (
          <div className="mt-3 flex items-center gap-1.5">
            <div
              className={cn(
                "flex items-center gap-0.5 text-sm font-medium",
                isPositive && "text-success",
                isNegative && "text-destructive",
                isNeutral && "text-muted-foreground"
              )}
            >
              {isPositive && <TrendingUp className="h-3.5 w-3.5" />}
              {isNegative && <TrendingDown className="h-3.5 w-3.5" />}
              {isNeutral && <Minus className="h-3.5 w-3.5" />}
              <span>
                {isPositive && '+'}
                {change.toFixed(1)}%
              </span>
            </div>
            {changeLabel && (
              <span className="text-xs text-muted-foreground">{changeLabel}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
