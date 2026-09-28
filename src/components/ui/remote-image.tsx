import { Image as ExpoImage, type ImageProps } from 'expo-image';
import { cssInterop } from 'nativewind';

type RemoteImageProps = ImageProps & { className?: string };

function RemoteImage({ cachePolicy = 'memory-disk', ...props }: RemoteImageProps) {
  return <ExpoImage cachePolicy={cachePolicy} {...props} />;
}

// Third-party native views need explicit interop before className can set their size.
cssInterop(RemoteImage, { className: 'style' });

export { RemoteImage };
