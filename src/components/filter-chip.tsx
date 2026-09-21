import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected = false, onPress }: FilterChipProps) {
  return (
    <Button size="sm" variant={selected ? 'default' : 'outline'} className={selected ? 'shrink-0 rounded-full bg-accent' : 'shrink-0 rounded-full bg-secondary'} onPress={onPress}>
      <Text className={selected ? 'text-accent-foreground' : 'text-foreground'}>{label}</Text>
    </Button>
  );
}
