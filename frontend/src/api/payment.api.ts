import { apiClient } from './axios.config';

export interface CheckoutSessionResponse {
    url: string;
    sessionId: string;
}

export const paymentApi = {
    /** Crée une session Stripe Checkout pour un user connecté */
    createCheckoutSession: async (orderId: number): Promise<CheckoutSessionResponse> => {
        const response = await apiClient.post('/payments/checkout-session', { orderId });
        return response.data;
    },

    /** Crée une session Stripe Checkout pour un invité */
    createGuestCheckoutSession: async (
        orderId: number,
        email: string,
        guestToken: string,
    ): Promise<CheckoutSessionResponse> => {
        const response = await apiClient.post('/payments/guest/checkout-session', {
            orderId,
            email,
            guestToken,
        });
        return response.data;
    },
};