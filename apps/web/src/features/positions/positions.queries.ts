import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPositions,
  getPosition,
  createPosition,
  updatePosition,
  deletePosition,
} from './positions.api';
import type { PositionsListParams } from '@ube-hr/shared';

export const positionKeys = {
  all: ['positions'] as const,
  lists: () => [...positionKeys.all, 'list'] as const,
  detail: (id: number) => [...positionKeys.all, 'detail', id] as const,
};

export function usePositions(params?: PositionsListParams) {
  return useQuery({
    queryKey: [...positionKeys.lists(), params],
    queryFn: () => getPositions(params),
  });
}

export function usePosition(id: number) {
  return useQuery({
    queryKey: positionKeys.detail(id),
    queryFn: () => getPosition(id),
  });
}

export function useCreatePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createPosition,
    onSuccess: () => qc.invalidateQueries({ queryKey: positionKeys.lists() }),
  });
}

export function useUpdatePosition(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?: string;
      description?: string | null;
      departmentId?: number;
    }) => updatePosition(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: positionKeys.detail(id) });
      qc.invalidateQueries({ queryKey: positionKeys.lists() });
    },
  });
}

export function useDeletePosition() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deletePosition,
    onSuccess: () => qc.invalidateQueries({ queryKey: positionKeys.lists() }),
  });
}
