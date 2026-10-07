import { useState } from 'react';
import { ScrollView } from 'react-native';
import { RemoteImage } from '@/components/ui/remote-image';
import { PressableScale } from '@/components/ui/pressable-scale';
import { PhotoViewerModal } from '@/components/photo-viewer-modal';
import { cloudinaryImageUrl } from '@/lib/cloudinary';
import { blurActiveElement } from '@/lib/navigation';

export function ReviewPhotoStrip({ photos }: { photos: string[] }) {
  const [viewing, setViewing] = useState<number | null>(null);
  if (!photos.length) return null;
  return <>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 py-2">
      {photos.map((photo, index) => (
        <PressableScale key={`${photo}-${index}`} className="h-16 w-16 overflow-hidden rounded-xl bg-secondary" accessibilityLabel={`View review photo ${index + 1} of ${photos.length}`} onPress={() => { blurActiveElement(); setViewing(index); }}>
          <RemoteImage source={{ uri: cloudinaryImageUrl(photo, 240) }} className="h-full w-full" contentFit="cover" />
        </PressableScale>
      ))}
    </ScrollView>
    <PhotoViewerModal photos={photos} visible={viewing !== null} startIndex={viewing ?? 0} onClose={() => setViewing(null)} />
  </>;
}
