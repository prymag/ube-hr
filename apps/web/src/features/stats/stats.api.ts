import api from '../../services/axios';
import type { StatsResponse } from '@ube-hr/shared';

export const getStats = async () => {
  const r = await api.get<StatsResponse>('/api/stats');
  return r.data;
};
