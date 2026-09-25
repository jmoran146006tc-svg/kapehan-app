import Svg, { Path } from 'react-native-svg';
import { MAP_PIN_PATHS } from '@/constants/map-pin-paths';

export function MapPinMarker({ color, size = 34 }: { color: string; size?: number }) {
  return <Svg width={size} height={size} viewBox="0 0 512 512" accessible={false}>
    {MAP_PIN_PATHS.map((path, index) => <Path key={index} d={path.d} fill={index === 0 ? color : path.fill} transform={path.transform} />)}
  </Svg>;
}
