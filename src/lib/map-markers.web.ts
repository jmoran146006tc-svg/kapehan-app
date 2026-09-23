import L from 'leaflet';
import { MAP_MARKER_COLORS } from '@/constants/map';

function pinIcon(color: string, size: number) {
  const height = Math.round(size * 1.25);
  return L.divIcon({
    className: 'kapehan-map-marker',
    html: `<svg width="${size}" height="${height}" viewBox="0 0 24 30" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 1C6.48 1 2 5.48 2 11c0 7.5 10 18 10 18s10-10.5 10-18C22 5.48 17.52 1 12 1Z" fill="${color}" stroke="#fff" stroke-width="2"/><circle cx="12" cy="11" r="3.5" fill="#fff"/></svg>`,
    iconSize: [size, height],
    iconAnchor: [Math.round(size / 2), height],
  });
}

export const shopMarkerIcon = pinIcon(MAP_MARKER_COLORS.shop, 34);
export const selectedShopMarkerIcon = pinIcon(MAP_MARKER_COLORS.selectedShop, 42);
export const userMarkerIcon = pinIcon(MAP_MARKER_COLORS.user, 34);
