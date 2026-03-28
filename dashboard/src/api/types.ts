export interface OverviewStats {
  dau_today: number
  dau_yesterday: number
  dau_change_pct: number
  active_subscriptions: number
  invoices_created_today: number
  invoices_paid_today: number
  payment_success_rate: number
  total_customers: number
}

export interface TimeSeriesPoint {
  date: string
  value: number
}

export interface ActivityMetrics {
  dau_series: TimeSeriesPoint[]
  actions_breakdown: Record<string, number>
  top_actions: { action: string; count: number }[]
}

export interface InvoiceMetrics {
  created_series: TimeSeriesPoint[]
  paid_series: TimeSeriesPoint[]
  status_breakdown: Record<string, number>
}

export interface SubscriptionMetrics {
  active_series: TimeSeriesPoint[]
  new_subscriptions_series: TimeSeriesPoint[]
  cancellation_series: TimeSeriesPoint[]
  status_breakdown: Record<string, number>
}

export interface PaymentMetrics {
  success_series: TimeSeriesPoint[]
  failed_series: TimeSeriesPoint[]
  success_rate_series: { date: string; rate: number; total: number }[]
}

export interface ChatSession {
  id: string
  title: string | null
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessage {
  id: number
  session_id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
  input_tokens?: number
  output_tokens?: number
  cost_usd?: number
  tools_used?: string
  queries_used?: string
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[]
}

export interface CostDayPoint {
  date: string
  cost_usd: number
  input_tokens: number
  output_tokens: number
  messages: number
}

export interface CostMetrics {
  daily_series: CostDayPoint[]
  total_cost_usd: number
  total_input_tokens: number
  total_output_tokens: number
  total_messages: number
}

export interface User {
  id: string
  email: string
  role: 'MASTER' | 'ADMIN' | 'USER'
  is_active: boolean
  created_at: string
}

export interface LoginResponse {
  access_token: string
  token_type: string
  user: User
}

export interface AgentState {
  key: string
  value: string
  updated_at: string
}
