import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTeams,
  getTeam,
  createTeam,
  updateTeam,
  deleteTeam,
  getTeamMembers,
  addTeamMember,
  removeTeamMember,
  getMyTeams,
} from './teams.api';
import type { TeamsListParams } from '@ube-hr/shared';

export const teamKeys = {
  all: ['teams'] as const,
  lists: () => [...teamKeys.all, 'list'] as const,
  mine: () => [...teamKeys.all, 'mine'] as const,
  detail: (id: number) => [...teamKeys.all, 'detail', id] as const,
  members: (id: number) => [...teamKeys.all, 'members', id] as const,
};

export function useTeams(params?: TeamsListParams) {
  return useQuery({
    queryKey: [...teamKeys.lists(), params],
    queryFn: () => getTeams(params),
  });
}

export function useMyTeams() {
  return useQuery({
    queryKey: teamKeys.mine(),
    queryFn: getMyTeams,
  });
}

export function useTeam(teamId: number) {
  return useQuery({
    queryKey: teamKeys.detail(teamId),
    queryFn: () => getTeam(teamId),
  });
}

export function useTeamMembers(teamId: number) {
  return useQuery({
    queryKey: teamKeys.members(teamId),
    queryFn: () => getTeamMembers(teamId),
  });
}

export function useCreateTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createTeam,
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.lists() }),
  });
}

export function useUpdateTeam(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; description?: string }) =>
      updateTeam(teamId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: teamKeys.detail(teamId) });
      qc.invalidateQueries({ queryKey: teamKeys.lists() });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteTeam,
    onSuccess: () => qc.invalidateQueries({ queryKey: teamKeys.lists() }),
  });
}

export function useAddTeamMember(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => addTeamMember(teamId, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: teamKeys.members(teamId) }),
  });
}

export function useRemoveTeamMember(teamId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => removeTeamMember(teamId, userId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: teamKeys.members(teamId) }),
  });
}
