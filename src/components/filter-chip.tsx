import { Platform } from 'react-native';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected = false, onPress }: FilterChipProps) {
  return (
    <Button
      size="sm"
      variant={selected ? 'default' : 'outline'}
      className={cn(
        'shrink-0 rounded-full',
        selected ? 'bg-accent' : 'bg-secondary',
        Platform.select({
          web: selected
            ? 'transition-colors duration-150 hover:bg-accent/90'
            : 'transition-colors duration-150 hover:bg-secondary/70',
        }),
      )}
      onPress={onPress}>
      <Text className={selected ? 'text-accent-foreground' : 'text-foreground'}>{label}</Text>
    </Button>
  );
}
