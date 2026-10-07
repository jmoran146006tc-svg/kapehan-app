import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { FilterChip } from '@/components/filter-chip';
import { REMOVAL_REASONS } from '@/constants/moderation';
import { blurActiveElement } from '@/lib/navigation';
import { getUserFriendlyError } from '@/lib/errors';
import { useToast } from '@/hooks/useToast';

interface RemoveReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reviewerName: string;
  onConfirm: (reasonLabel: string) => Promise<void>;
}
export function RemoveReviewDialog(props: RemoveReviewDialogProps) {
  return props.open ? <OpenRemoveReviewDialog {...props} /> : null;
}
function OpenRemoveReviewDialog({ reviewerName, onConfirm, onOpenChange }: RemoveReviewDialogProps) {
  const [reason, setReason] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const { showToast } = useToast();
  function close() { blurActiveElement(); onOpenChange(false); }
  async function confirm() {
    if (!reason || pending) return;
    setPending(true);
    try { await onConfirm(reason); close(); }
    catch (error) { showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not remove this review. Please try again.') }); }
    finally { setPending(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) close(); }}>
    <DialogContent className="max-h-[85%]">
      <DialogHeader className="pr-10"><DialogTitle>Remove review by {reviewerName}</DialogTitle></DialogHeader>
      <ScrollView contentContainerClassName="gap-4 pb-2">
        <Text className="text-sm text-muted-foreground">The reviewer will be notified and the shop&apos;s rating will be recalculated.</Text>
        <View className="flex-row flex-wrap gap-2">{REMOVAL_REASONS.map((item) => <FilterChip key={item.key} label={item.label} selected={reason === item.label} onPress={() => { if (!pending) setReason(item.label); }} />)}</View>
        <Button className="min-h-11" variant="destructive" disabled={!reason} loading={pending} loadingLabel="Removing…" onPress={() => void confirm()}><Text>Remove review</Text></Button>
        <Button className="min-h-11" variant="outline" disabled={pending} onPress={close}><Text>Cancel</Text></Button>
      </ScrollView>
    </DialogContent>
  </Dialog>;
}
