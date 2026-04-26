import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getBalancesForUser,
  getAllBalances,
  grantBalance,
  getAuditHistory,
  getAccrualConfigs,
  updateAccrualConfig,
  triggerAccrual,
} from './leave-balance.api';
import type { LeaveBalanceGrantInput } from '@ube-hr/shared';

export const balanceKeys = {
  all: ['leave-balance'] as const,
  user: (id: number) => [...balanceKeys.all, 'user', id] as const,
  list: (params?: object) => [...balanceKeys.all, 'list', params] as const,
  history: (userId: number, leaveType?: string) =>
    [...balanceKeys.all, 'history', userId, leaveType] as const,
  configs: () => [...balanceKeys.all, 'configs'] as const,
};

export function useUserBalances(userId: number) {
  return useQuery({
    queryKey: balanceKeys.user(userId),
    queryFn: () => getBalancesForUser(userId),
  });
}

export function useAllBalances(params?: {
  userId?: number;
  leaveType?: string;
  page?: number;
  pageSize?: number;
}) {
  return useQuery({
    queryKey: balanceKeys.list(params),
    queryFn: () => getAllBalances(params),
  });
}

export function useAuditHistory(userId: number, leaveType?: string) {
  return useQuery({
    queryKey: balanceKeys.history(userId, leaveType),
    queryFn: () => getAuditHistory(userId, leaveType),
  });
}

export function useAccrualConfigs() {
  return useQuery({
    queryKey: balanceKeys.configs(),
    queryFn: getAccrualConfigs,
  });
}

export function useGrantBalance(userId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: LeaveBalanceGrantInput) => grantBalance(userId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: balanceKeys.user(userId) });
      qc.invalidateQueries({ queryKey: balanceKeys.list() });
      qc.invalidateQueries({ queryKey: balanceKeys.history(userId) });
    },
  });
}

export function useUpdateAccrualConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ type, monthlyRate }: { type: string; monthlyRate: number }) =>
      updateAccrualConfig(type, monthlyRate),
    onSuccess: () => qc.invalidateQueries({ queryKey: balanceKeys.configs() }),
  });
}

export function useTriggerAccrual() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: triggerAccrual,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: balanceKeys.all });
    },
  });
}
