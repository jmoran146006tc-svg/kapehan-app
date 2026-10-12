import { View } from 'react-native';
import { Clock, X } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { PressableScale } from '@/components/ui/pressable-scale';
import { Text } from '@/components/ui/text';

type Props = { query: string; onSearch: () => void; onRemove: () => void };

export function RecentSearchChip({ query, onSearch, onRemove }: Props) {
  return (
    <View className="min-w-0 max-w-full shrink flex-row items-center rounded-full border border-border bg-card">
      {/* Layout belongs on the animated wrapper; the label uses the space left by remove. */}
      <PressableScale style={{ flexShrink: 1, minWidth: 0 }} className="min-h-11 min-w-0 flex-row items-center gap-2 pl-3 pr-1" onPress={onSearch} accessibilityLabel={`Search for ${query}`}>
        <Icon as={Clock} size={16} className="shrink-0 text-muted-foreground" />
        <Text numberOfLines={1} ellipsizeMode="tail" className="min-w-0 shrink text-sm">{query}</Text>
      </PressableScale>
      <PressableScale style={{ flexShrink: 0 }} className="h-11 w-11 items-center justify-center" onPress={onRemove} accessibilityLabel={`Remove ${query} from search history`}>
        <Icon as={X} size={16} />
      </PressableScale>
    </View>
  );
}
