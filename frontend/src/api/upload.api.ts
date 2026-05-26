import { apiClient } from './axios.config';

export interface UploadResponse {
    url: string;
    filename: string;
    size: number;
}

export const uploadApi = {
    /**
     * Upload une image (ADMIN/EMPLOYEE)
     * Retourne l'URL relative de l'image uploadée
     */
    uploadImage: async (file: File): Promise<UploadResponse> => {
        const formData = new FormData();
        formData.append('file', file);

        const response = await apiClient.post('/upload/image', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });

        return response.data;
    },
};
