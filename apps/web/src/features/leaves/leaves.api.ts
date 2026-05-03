import api from '../../services/axios';
import type {
  LeaveRequestResponse,
  LeaveRequestDetailResponse,
  LeaveBalanceResponse,
  LeaveApprovalHistoryItem,
  LeaveRequestsListParams,
  PaginatedResponse,
} from '@ube-hr/shared';

export interface CreateLeavePayload {
  type: string;
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  halfDay?: 'AM' | 'PM';
  reason?: string;
}

export const getMyLeaves = async (params?: LeaveRequestsListParams) => {
  const r = await api.get<PaginatedResponse<LeaveRequestResponse>>(
    '/api/leaves',
    { params },
  );
  return r.data;
};

export const getLeaveApprovals = async (params?: LeaveRequestsListParams) => {
  const r = await api.get<PaginatedResponse<LeaveRequestResponse>>(
    '/api/leaves/approvals',
    { params },
  );
  return r.data;
};

export const getLeave = async (id: number) => {
  const r = await api.get<LeaveRequestDetailResponse>(`/api/leaves/${id}`);
  return r.data;
};

export const createLeave = async (data: CreateLeavePayload) => {
  const r = await api.post<LeaveRequestResponse>('/api/leaves', data);
  return r.data;
};

export const cancelLeave = async (id: number) => {
  const r = await api.patch<LeaveRequestResponse>(`/api/leaves/${id}/cancel`);
  return r.data;
};

export const approveLeave = async (id: number) => {
  const r = await api.patch<LeaveRequestResponse>(`/api/leaves/${id}/approve`);
  return r.data;
};

export const rejectLeave = async (id: number, comment: string) => {
  const r = await api.patch<LeaveRequestResponse>(`/api/leaves/${id}/reject`, {
    comment,
  });
  return r.data;
};

export const getMyBalances = async () => {
  const r = await api.get<LeaveBalanceResponse[]>('/api/leaves/balances');
  return r.data;
};

export const getMyApprovalHistory = async (params?: LeaveRequestsListParams) => {
  const r = await api.get<PaginatedResponse<LeaveApprovalHistoryItem>>(
    '/api/leaves/approvals/history',
    { params },
  );
  return r.data;
};
