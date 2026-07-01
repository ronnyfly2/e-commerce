import client from './client';
import { API } from './endpoints';
import type { ApiResponse } from '@/shared/types/api.types';

export const uploadsApi = {
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return client
      .post<ApiResponse<{ url: string }>>(API.uploadImage, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      .then((r) => r.data.data.url);
  },
};
