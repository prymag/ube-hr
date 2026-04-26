import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getHolidays,
  getHoliday,
  createHoliday,
  updateHoliday,
  deleteHoliday,
} from './holidays.api';
import type { PublicHolidaysListParams } from '@ube-hr/shared';

export const holidayKeys = {
  all: ['holidays'] as const,
  lists: () => [...holidayKeys.all, 'list'] as const,
  detail: (id: number) => [...holidayKeys.all, 'detail', id] as const,
};

export function useHolidays(params?: PublicHolidaysListParams) {
  return useQuery({
    queryKey: [...holidayKeys.lists(), params],
    queryFn: () => getHolidays(params),
  });
}

export function useHoliday(id: number) {
  return useQuery({
    queryKey: holidayKeys.detail(id),
    queryFn: () => getHoliday(id),
  });
}

export function useCreateHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createHoliday,
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.lists() }),
  });
}

export function useUpdateHoliday(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      name?: string;
      date?: string;
      description?: string | null;
    }) => updateHoliday(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: holidayKeys.detail(id) });
      qc.invalidateQueries({ queryKey: holidayKeys.lists() });
    },
  });
}

export function useDeleteHoliday() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteHoliday,
    onSuccess: () => qc.invalidateQueries({ queryKey: holidayKeys.lists() }),
  });
}
