import { useState, useRef, useCallback } from 'react';
import { uploadApi } from '@/api/upload.api';
import { resolveImageUrl } from '@/utils/imageUrl';

interface UseImageUploadReturn {
    /** URL de preview locale (blob) ou URL résolue depuis le backend */
    imagePreview: string | null;
    /** true pendant l'upload */
    uploading: boolean;
    /** Ref à passer au <input type="file" /> */
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    /** Handler pour onChange du <input type="file" /> */
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<string | null>;
    /** Ouvre la boîte de dialogue fichier */
    openFilePicker: () => void;
    /** Réinitialise (preview = null) */
    resetImage: () => void;
    /** Initialise la preview à partir d'une URL existante (édition) */
    setPreviewFromUrl: (url: string | null | undefined) => void;
}

/**
 * Hook réutilisable pour l'upload d'image (produits, menus, etc.).
 * Gère : preview locale immédiate, upload vers le backend, état de chargement.
 */
export function useImageUpload(): UseImageUploadReturn {
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>): Promise<string | null> => {
        const file = e.target.files?.[0];
        if (!file) return null;

        setUploading(true);
        try {
            setImagePreview(URL.createObjectURL(file));
            const result = await uploadApi.uploadImage(file);
            return result.url;
        } catch {
            setImagePreview(null);
            throw new Error("Erreur lors de l'upload de l'image.");
        } finally {
            setUploading(false);
        }
    }, []);

    const openFilePicker = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    const resetImage = useCallback(() => {
        setImagePreview(null);
    }, []);

    const setPreviewFromUrl = useCallback((url: string | null | undefined) => {
        setImagePreview(resolveImageUrl(url));
    }, []);

    return {
        imagePreview,
        uploading,
        fileInputRef,
        handleFileChange,
        openFilePicker,
        resetImage,
        setPreviewFromUrl,
    };
}
