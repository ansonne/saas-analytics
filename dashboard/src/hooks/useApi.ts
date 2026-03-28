import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchApi } from '../api/client'
import type {
  OverviewStats,
  ActivityMetrics,
  InvoiceMetrics,
  SubscriptionMetrics,
  PaymentMetrics,
  CostMetrics,
  ChatSession,
  ChatSessionWithMessages,
  AgentState,
} from '../api/types'

export function useOverview() {
  return useQuery({
    queryKey: ['overview'],
    queryFn: () => fetchApi<OverviewStats>('/overview'),
    refetchInterval: 60000,
  })
}

export function useActivityMetrics(days = 7) {
  return useQuery({
    queryKey: ['metrics', 'activity', days],
    queryFn: () => fetchApi<ActivityMetrics>(`/metrics/activity?days=${days}`),
  })
}

export function useInvoiceMetrics(days = 7) {
  return useQuery({
    queryKey: ['metrics', 'invoices', days],
    queryFn: () => fetchApi<InvoiceMetrics>(`/metrics/invoices?days=${days}`),
  })
}

export function useSubscriptionMetrics(days = 7) {
  return useQuery({
    queryKey: ['metrics', 'subscriptions', days],
    queryFn: () => fetchApi<SubscriptionMetrics>(`/metrics/subscriptions?days=${days}`),
  })
}

export function usePaymentMetrics(days = 7) {
  return useQuery({
    queryKey: ['metrics', 'payments', days],
    queryFn: () => fetchApi<PaymentMetrics>(`/metrics/payments?days=${days}`),
  })
}

export function useCostMetrics(days = 30) {
  return useQuery({
    queryKey: ['metrics', 'costs', days],
    queryFn: () => fetchApi<CostMetrics>(`/metrics/costs?days=${days}`),
  })
}

export function useChatSessions() {
  return useQuery({
    queryKey: ['chat', 'sessions'],
    queryFn: () => fetchApi<ChatSession[]>('/chat/sessions'),
  })
}

export function useChatSession(sessionId: string | null) {
  return useQuery({
    queryKey: ['chat', 'session', sessionId],
    queryFn: () => fetchApi<ChatSessionWithMessages>(`/chat/sessions/${sessionId}`),
    enabled: !!sessionId,
    retry: false,
  })
}

export function useCreateChatSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () =>
      fetchApi<ChatSession>('/chat/sessions', {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
    },
  })
}

export function useDeleteChatSession() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (sessionId: string) =>
      fetchApi(`/chat/sessions/${sessionId}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat', 'sessions'] })
    },
  })
}

export function useAgentState() {
  return useQuery({
    queryKey: ['settings', 'agent-state'],
    queryFn: () => fetchApi<AgentState[]>('/settings/agent-state'),
  })
}

export function useUpdateAgentState() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ key, value }: { key: string; value: string }) =>
      fetchApi(`/settings/agent-state/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'agent-state'] })
    },
  })
}
