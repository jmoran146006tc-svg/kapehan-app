import { View } from 'react-native';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

// TODO: react-hook-form + zod, per your form stack. Fields per the §5 /shops
// schema: name, address, lat/lng, priceRange, noiseLevel, ambianceTags,
// hours (§6), photos via Cloudinary unsigned upload.

export default function CreateListingScreen() {
  return (
    <View className="flex-1 bg-background p-4 gap-4">
      <Text className="text-2xl font-bold">New Listing</Text>
      <Input placeholder="Shop name" />
      <Input placeholder="Address" />
      {/* TODO: hours input, photo picker → Cloudinary upload */}
      <Button>
        <Text>Submit for approval</Text>
      </Button>
    </View>
  );
}
