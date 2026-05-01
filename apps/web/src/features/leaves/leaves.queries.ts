import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getMyLeaves,
  getLeaveApprovals,
  getLeave,
  createLeave,
  cancelLeave,
  approveLeave,
  rejectLeave,
  getMyBalances,
} from './leaves.api';
import type { LeaveRequestsListParams } from '@ube-hr/shared';
import type { CreateLeavePayload } from './leaves.api';

export const leaveKeys = {
  all: ['leaves'] as const,
  myList: () => [...leaveKeys.all, 'my', 'list'] as const,
  approvalList: () => [...leaveKeys.all, 'approvals', 'list'] as const,
  detail: (id: number) => [...leaveKeys.all, 'detail', id] as const,
  myBalances: () => [...leaveKeys.all, 'my', 'balances'] as const,
};

export function useMyLeaves(params?: LeaveRequestsListParams) {
  return useQuery({
    queryKey: [...leaveKeys.myList(), params],
    queryFn: () => getMyLeaves(params),
  });
}

export function useLeaveApprovals(params?: LeaveRequestsListParams) {
  return useQuery({
    queryKey: [...leaveKeys.approvalList(), params],
    queryFn: () => getLeaveApprovals(params),
  });
}

export function useLeave(id: number) {
  return useQuery({
    queryKey: leaveKeys.detail(id),
    queryFn: () => getLeave(id),
  });
}

export function useMyBalances() {
  return useQuery({
    queryKey: leaveKeys.myBalances(),
    queryFn: getMyBalances,
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLeavePayload) => createLeave(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: leaveKeys.myList() }),
  });
}

export function useCancelLeave(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => cancelLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.detail(id) });
      qc.invalidateQueries({ queryKey: leaveKeys.myList() });
    },
  });
}

export function useApproveLeave(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => approveLeave(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.detail(id) });
      qc.invalidateQueries({ queryKey: leaveKeys.approvalList() });
      qc.invalidateQueries({ queryKey: leaveKeys.myList() });
    },
  });
}

export function useRejectLeave(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (comment: string) => rejectLeave(id, comment),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: leaveKeys.detail(id) });
      qc.invalidateQueries({ queryKey: leaveKeys.approvalList() });
      qc.invalidateQueries({ queryKey: leaveKeys.myList() });
    },
  });
}
