import * as CheckboxPrimitive from '@rn-primitives/checkbox';
import { Check } from 'lucide-react-native';
import { Icon } from '@/components/ui/icon';
import { cn } from '@/lib/utils';

export type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root>;
export type CheckboxIndicatorProps = React.ComponentProps<typeof CheckboxPrimitive.Indicator>;

function Checkbox({ className, children, ...props }: CheckboxProps) {
  return <CheckboxPrimitive.Root
    className={cn('size-6 shrink-0 items-center justify-center rounded-md border border-input bg-background', props.checked && 'border-primary bg-primary', className)}
    {...props}>
    {children ?? <CheckboxIndicator />}
  </CheckboxPrimitive.Root>;
}

function CheckboxIndicator({ className, ...props }: CheckboxIndicatorProps) {
  return <CheckboxPrimitive.Indicator className={cn('items-center justify-center', className)} {...props}>
    <Icon as={Check} size={16} className="text-primary-foreground" />
  </CheckboxPrimitive.Indicator>;
}

export { Checkbox, CheckboxIndicator };
