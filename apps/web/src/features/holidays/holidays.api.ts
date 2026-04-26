import api from '../../services/axios';
import type {
  PublicHolidayResponse,
  PublicHolidaysListParams,
  PaginatedResponse,
} from '@ube-hr/shared';

export const getHolidays = async (params?: PublicHolidaysListParams) => {
  const r = await api.get<PaginatedResponse<PublicHolidayResponse>>(
    '/api/holidays',
    { params },
  );
  return r.data;
};

export const getHoliday = async (id: number) => {
  const r = await api.get<PublicHolidayResponse>(`/api/holidays/${id}`);
  return r.data;
};

export const createHoliday = async (data: {
  name: string;
  date: string;
  description?: string;
}) => {
  const r = await api.post<PublicHolidayResponse>('/api/holidays', data);
  return r.data;
};

export const updateHoliday = async (
  id: number,
  data: { name?: string; date?: string; description?: string | null },
) => {
  const r = await api.patch<PublicHolidayResponse>(`/api/holidays/${id}`, data);
  return r.data;
};

export const deleteHoliday = (id: number) => api.delete(`/api/holidays/${id}`);
