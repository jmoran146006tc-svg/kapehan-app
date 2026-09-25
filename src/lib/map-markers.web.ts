import L from 'leaflet';
import { MAP_MARKER_COLORS } from '@/constants/map';
import { MAP_PIN_PATHS } from '@/constants/map-pin-paths';

function pinIcon(color: string, size: number) {
  const height = size;
  const paths = MAP_PIN_PATHS.map((path, index) =>
    `<path d="${path.d}" fill="${index === 0 ? color : path.fill}" transform="${path.transform}"/>`,
  ).join('');
  return L.divIcon({
    className: 'kapehan-map-marker',
    html: `<svg width="${size}" height="${height}" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${paths}</svg>`,
    iconSize: [size, height],
    iconAnchor: [Math.round(size / 2), height],
  });
}

export const shopMarkerIcon = pinIcon(MAP_MARKER_COLORS.shop, 34);
export const selectedShopMarkerIcon = pinIcon(MAP_MARKER_COLORS.selectedShop, 42);
export const userMarkerIcon = pinIcon(MAP_MARKER_COLORS.user, 34);
