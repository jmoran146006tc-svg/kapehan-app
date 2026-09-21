import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

interface FilterChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function FilterChip({ label, selected = false, onPress }: FilterChipProps) {
  return (
    <Button size="sm" variant={selected ? 'default' : 'outline'} className={selected ? 'rounded-full bg-accent' : 'rounded-full bg-secondary'} onPress={onPress}>
      <Text>{label}</Text>
    </Button>
  );
}
