import client from '@/api/client';
import { API } from '@/api/endpoints';
import type { ApiResponse } from '@/shared/types/api.types';
import type { SeedStatus } from './types';

export const devToolsApi = {
  list: () => client.get<ApiResponse<SeedStatus[]>>(API.devToolsSeeds).then((r) => r.data.data),

  runAll: () => client.post<ApiResponse<SeedStatus[]>>(API.devToolsSeedsRunAll).then((r) => r.data.data),

  runOne: (id: string) => client.post<ApiResponse<SeedStatus[]>>(API.devToolsSeedRun(id)).then((r) => r.data.data),

  deleteOne: (id: string) => client.delete<ApiResponse<SeedStatus[]>>(API.devToolsSeedDelete(id)).then((r) => r.data.data),

  wipeDatabase: (confirm: string) =>
    client.delete<ApiResponse<{ truncatedTables: string[] }>>(API.devToolsWipeDatabase, { data: { confirm } })
      .then((r) => r.data.data),
};
