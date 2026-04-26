import api from '../../services/axios';
import type {
  LeaveBalanceResponse,
  LeaveBalanceWithUser,
  LeaveBalanceAuditResponse,
  LeaveAccrualConfigResponse,
  LeaveBalanceGrantInput,
  PaginatedResponse,
} from '@ube-hr/shared';

export const getBalancesForUser = async (userId: number) => {
  const r = await api.get<LeaveBalanceResponse[]>(`/api/leave-balance/${userId}`);
  return r.data;
};

export const getAllBalances = async (params?: {
  userId?: number;
  leaveType?: string;
  page?: number;
  pageSize?: number;
}) => {
  const r = await api.get<PaginatedResponse<LeaveBalanceWithUser>>('/api/leave-balance', { params });
  return r.data;
};

export const grantBalance = async (userId: number, data: LeaveBalanceGrantInput) => {
  const r = await api.post<{ ok: boolean }>(`/api/leave-balance/${userId}/grant`, data);
  return r.data;
};

export const getAuditHistory = async (userId: number, leaveType?: string) => {
  const r = await api.get<LeaveBalanceAuditResponse[]>(
    `/api/leave-balance/${userId}/history`,
    { params: leaveType ? { leaveType } : undefined },
  );
  return r.data;
};

export const getAccrualConfigs = async () => {
  const r = await api.get<LeaveAccrualConfigResponse[]>('/api/leave-balance/config');
  return r.data;
};

export const updateAccrualConfig = async (type: string, monthlyRate: number) => {
  const r = await api.put<LeaveAccrualConfigResponse>(
    `/api/leave-balance/config/${type}`,
    { monthlyRate },
  );
  return r.data;
};

export const triggerAccrual = async () => {
  const r = await api.post<{ processed: number; skipped: number }>('/api/leave-balance/accrue');
  return r.data;
};
