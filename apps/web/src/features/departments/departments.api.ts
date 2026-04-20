import api from '../../services/axios';
import type {
  DepartmentResponse,
  DepartmentsListParams,
  PaginatedResponse,
} from '@ube-hr/shared';

export const getDepartments = async (params?: DepartmentsListParams) => {
  const r = await api.get<PaginatedResponse<DepartmentResponse>>(
    '/api/departments',
    { params },
  );
  return r.data;
};

export const getDepartment = async (id: number) => {
  const r = await api.get<DepartmentResponse>(`/api/departments/${id}`);
  return r.data;
};

export const createDepartment = async (data: {
  name: string;
  description?: string;
  headId?: number | null;
}) => {
  const r = await api.post<DepartmentResponse>('/api/departments', data);
  return r.data;
};

export const updateDepartment = async (
  id: number,
  data: { name?: string; description?: string | null; headId?: number | null },
) => {
  const r = await api.patch<DepartmentResponse>(`/api/departments/${id}`, data);
  return r.data;
};

export const deleteDepartment = (id: number) =>
  api.delete(`/api/departments/${id}`);
