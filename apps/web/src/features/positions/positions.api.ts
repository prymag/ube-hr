import api from '../../services/axios';
import type {
  PositionResponse,
  PositionsListParams,
  PaginatedResponse,
} from '@ube-hr/shared';

export const getPositions = async (params?: PositionsListParams) => {
  const r = await api.get<PaginatedResponse<PositionResponse>>(
    '/api/positions',
    { params },
  );
  return r.data;
};

export const getPosition = async (id: number) => {
  const r = await api.get<PositionResponse>(`/api/positions/${id}`);
  return r.data;
};

export const createPosition = async (data: {
  name: string;
  description?: string;
  reportsToId?: number | null;
}) => {
  const r = await api.post<PositionResponse>('/api/positions', data);
  return r.data;
};

export const updatePosition = async (
  id: number,
  data: {
    name?: string;
    description?: string | null;
    reportsToId?: number | null;
  },
) => {
  const r = await api.patch<PositionResponse>(`/api/positions/${id}`, data);
  return r.data;
};

export const deletePosition = (id: number) =>
  api.delete(`/api/positions/${id}`);
