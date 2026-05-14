/**
 * Utilitaire de calcul des frais de livraison.
 */
export const DELIVERY_PRICING: { maxKm: number; price: number }[] = [
  { maxKm: 1, price: 0 },
  { maxKm: 3, price: 2 },
  { maxKm: 5, price: 3.5 },
  { maxKm: 8, price: 5 },
  { maxKm: 10, price: 7 },
];

/** Distance maximale couverte. Au-delà → hors zone */
export const MAX_DELIVERY_KM = 10;

/**
 * Coordonnées de la sandwicherie.
 * Modifier ici si la sandwicherie déménage.
 * Pour trouver les coords : Google Maps → clic droit → "Copier les coordonnées"
 */
export const RESTAURANT_COORDS = {
  lat: parseFloat(process.env.RESTAURANT_LAT ?? '50.8669079'),
  lng: parseFloat(process.env.RESTAURANT_LNG ?? '4.2992231'),
};

/**
 * Calcule la distance en km entre deux points GPS (formule de Haversine).
 */
export function haversineKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export interface DeliveryFeeResult {
  fee: number;
  distanceKm: number;
  outOfRange: boolean;
}

/**
 * Calcule le prix de livraison depuis les coordonnées du client.
 * C'est ici que le prix est décidé
 */
export function calculateDeliveryFee(
  customerLat: number,
  customerLng: number,
): DeliveryFeeResult {
  const distanceKm = haversineKm(
    RESTAURANT_COORDS.lat, RESTAURANT_COORDS.lng,
    customerLat, customerLng,
  );

  if (distanceKm > MAX_DELIVERY_KM) {
    return { fee: 0, distanceKm, outOfRange: true };
  }

  const tier = DELIVERY_PRICING.find(t => distanceKm <= t.maxKm);
  const fee = tier?.price ?? 0;

  return { fee, distanceKm, outOfRange: false };
}