import { useQuery, useMutation, useQueryClient, skipToken } from '@tanstack/react-query';
import { getUsers, getUser, getUserTeams, createUser, updateUser, deleteUser } from './users.api';
import { addTeamMember, removeTeamMember } from '../teams/teams.api';
import type { UsersListParams } from './user.types';

export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  detail: (id: number) => [...userKeys.all, 'detail', id] as const,
  teams: (id: number) => [...userKeys.all, 'teams', id] as const,
};

export function useUsers(params?: UsersListParams) {
  return useQuery({
    queryKey: [...userKeys.lists(), params],
    queryFn: () => getUsers(params),
  });
}

export function useUser(id: number | undefined) {
  return useQuery({
    queryKey: id !== undefined ? userKeys.detail(id) : [],
    queryFn: id !== undefined ? () => getUser(id) : skipToken,
  });
}

export function useUserTeams(userId: number | undefined) {
  return useQuery({
    queryKey: [...userKeys.all, 'teams', userId] as const,
    queryFn: userId !== undefined ? () => getUserTeams(userId) : skipToken,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useUpdateUser(userId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { name?: string; role?: string }) => updateUser(userId, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteUser,
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.lists() }),
  });
}

export function useAddUserToTeam(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: number) => {
      if (userId === null) return Promise.reject(new Error('No userId'));
      return addTeamMember(teamId, userId);
    },
    onSuccess: () => {
      if (userId !== null) qc.invalidateQueries({ queryKey: userKeys.teams(userId) });
    },
  });
}

export function useRemoveUserFromTeam(userId: number | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (teamId: number) => {
      if (userId === null) return Promise.reject(new Error('No userId'));
      return removeTeamMember(teamId, userId);
    },
    onSuccess: () => {
      if (userId !== null) qc.invalidateQueries({ queryKey: userKeys.teams(userId) });
    },
  });
}
