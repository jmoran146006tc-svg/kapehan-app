import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import { MAX_REVIEW_PHOTOS } from '@/constants/reviews';
import { uploadToCloudinary, cloudinaryImageUrl } from '@/lib/cloudinary';
import { withTimeout } from '@/lib/timeout';
import { getUserFriendlyError } from '@/lib/errors';
import { useToast } from '@/hooks/useToast';
import { RemoteImage } from '@/components/ui/remote-image';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';

interface ReviewPhotoPickerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  onUploadingChange: (uploading: boolean) => void;
  disabled?: boolean;
}

export function ReviewPhotoPicker({ photos, onChange, onUploadingChange, disabled }: ReviewPhotoPickerProps) {
  const { showToast } = useToast();
  const [pending, setPending] = useState(0);
  const busy = useRef(false);
  const mounted = useRef(false);
  const currentPhotos = useRef(photos);
  useEffect(() => { currentPhotos.current = photos; }, [photos]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; onUploadingChange(false); };
  }, [onUploadingChange]);

  async function addPhotos() {
    if (disabled || busy.current || photos.length >= MAX_REVIEW_PHOTOS) return;
    busy.current = true;
    onUploadingChange(true);
    try {
      // Keep the picker directly in this user gesture for mobile web.
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: MAX_REVIEW_PHOTOS - photos.length, quality: 0.7 });
      if (!mounted.current || result.canceled) return;
      const assets = result.assets.slice(0, MAX_REVIEW_PHOTOS - photos.length);
      setPending(assets.length);
      const uploads = await Promise.allSettled(assets.map((asset) => withTimeout(uploadToCloudinary(asset.uri))));
      if (!mounted.current) return;
      const successful = uploads.flatMap((upload) => upload.status === 'fulfilled' ? [upload.value] : []);
      onChange([...currentPhotos.current, ...successful].slice(0, MAX_REVIEW_PHOTOS));
      if (uploads.some((upload) => upload.status === 'rejected')) showToast({ type: 'error', message: 'Some photos could not be uploaded. Please try again.' });
    } catch (error) {
      if (mounted.current) showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not select photos. Please try again.') });
    } finally {
      busy.current = false;
      if (mounted.current) { setPending(0); onUploadingChange(false); }
    }
  }

  return <View className="gap-2">
    <View className="flex-row flex-wrap gap-2">
      {photos.map((photo, index) => <View key={`${photo}-${index}`} className="relative h-24 w-24 overflow-hidden rounded-xl bg-secondary">
        <RemoteImage source={{ uri: cloudinaryImageUrl(photo, 240) }} className="h-full w-full" contentFit="cover" />
        <PressableScale className="absolute right-0 top-0 h-11 w-11 items-center justify-center rounded-full bg-card/90" disabled={disabled || pending > 0} hitSlop={12} accessibilityLabel={`Remove photo ${index + 1}`} onPress={() => { if (!busy.current) onChange(photos.filter((_, position) => position !== index)); }}><Icon as={X} size={18} /></PressableScale>
      </View>)}
      {Array.from({ length: pending }, (_, index) => <View key={`pending-${index}`} className="h-24 w-24 items-center justify-center rounded-xl bg-secondary"><Text className="text-xs text-muted-foreground">Uploading…</Text></View>)}
      {!pending && photos.length < MAX_REVIEW_PHOTOS ? <PressableScale className="h-24 w-24 items-center justify-center gap-1 rounded-xl border border-dashed border-border" disabled={disabled} accessibilityLabel="Add review photo" onPress={() => void addPhotos()}><Icon as={Camera} size={22} className="text-muted-foreground" /><Text className="text-xs">Add photo</Text></PressableScale> : null}
    </View>
    <Text className="text-xs text-muted-foreground">Photos are public. Up to {MAX_REVIEW_PHOTOS}.</Text>
  </View>;
}
