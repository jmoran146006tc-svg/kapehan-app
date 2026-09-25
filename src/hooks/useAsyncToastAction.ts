import { useCallback, useState } from 'react';
import { useToast } from '@/hooks/useToast';
import { getUserFriendlyError } from '@/lib/errors';

export function useAsyncToastAction() {
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  const run = useCallback(async (
    action: () => Promise<unknown>,
    messages: { success: string; error: string; onError?: (error: unknown) => void },
  ) => {
    setPending(true);
    try {
      await action();
      showToast({ type: 'success', message: messages.success });
      return true;
    } catch (error) {
      messages.onError?.(error);
      showToast({ type: 'error', message: getUserFriendlyError(error, messages.error) });
      return false;
    } finally {
      setPending(false);
    }
  }, [showToast]);

  return { run, pending };
}
