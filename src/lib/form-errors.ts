import type { FieldErrors, FieldValues } from 'react-hook-form';
import type { ToastInput } from '@/components/ui/toast';

export function toastFormErrors<T extends FieldValues>(
  errors: FieldErrors<T>,
  showToast: (input: ToastInput) => void,
) {
  function firstMessage(value: unknown): string | null {
    if (!value || typeof value !== 'object') return null;
    if ('message' in value && typeof value.message === 'string') return value.message;
    for (const child of Object.values(value)) {
      const message = firstMessage(child);
      if (message) return message;
    }
    return null;
  }

  showToast({ type: 'error', message: firstMessage(errors) ?? 'Please check the form and try again.' });
}
