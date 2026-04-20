import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDepartments,
  getDepartment,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from './departments.api';
import type { DepartmentsListParams } from '@ube-hr/shared';

export const departmentKeys = {
  all: ['departments'] as const,
  lists: () => [...departmentKeys.all, 'list'] as const,
  detail: (id: number) => [...departmentKeys.all, 'detail', id] as const,
};

export function useDepartments(params?: DepartmentsListParams) {
  return useQuery({
    queryKey: [...departmentKeys.lists(), params],
    queryFn: () => getDepartments(params),
  });
}

export function useDepartment(id: number) {
  return useQuery({
    queryKey: departmentKeys.detail(id),
    queryFn: () => getDepartment(id),
  });
}

export function useCreateDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.lists() }),
  });
}

export function useUpdateDepartment(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?: string;
      description?: string | null;
      headId?: number | null;
    }) => updateDepartment(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: departmentKeys.detail(id) });
      qc.invalidateQueries({ queryKey: departmentKeys.lists() });
    },
  });
}

export function useDeleteDepartment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteDepartment,
    onSuccess: () => qc.invalidateQueries({ queryKey: departmentKeys.lists() }),
  });
}
