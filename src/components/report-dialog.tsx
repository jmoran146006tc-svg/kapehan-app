import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { FilterChip } from '@/components/filter-chip';
import { MAX_REPORT_DETAILS, REPORT_REASONS_LISTING, REPORT_REASONS_REVIEW } from '@/constants/moderation';
import { reportFormSchema, type ReportFormValues } from '@/lib/schemas/report';
import { blurActiveElement } from '@/lib/navigation';
import { getUserFriendlyError } from '@/lib/errors';
import { useToast } from '@/hooks/useToast';
import type { ReportReason } from '@/types/report';

interface ReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetType: 'review' | 'listing';
  onSubmit: (values: ReportFormValues) => Promise<void>;
}

export function ReportDialog(props: ReportDialogProps) {
  return props.open ? <OpenReportDialog key={props.targetType} {...props} /> : null;
}

function OpenReportDialog({ onOpenChange, targetType, onSubmit }: ReportDialogProps) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [pending, setPending] = useState(false);
  const { showToast } = useToast();
  function close() { blurActiveElement(); onOpenChange(false); }
  async function send() {
    if (pending) return;
    const parsed = reportFormSchema.safeParse({ reason, details });
    if (!parsed.success) { showToast({ type: 'error', message: parsed.error.issues[0]?.message ?? 'Choose a reason.' }); return; }
    setPending(true);
    try {
      await onSubmit(parsed.data);
      showToast({ type: 'success', message: 'Thanks, an admin will review this.' });
      close();
    } catch (error) {
      showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not send your report. Please try again.') });
    } finally { setPending(false); }
  }
  return <Dialog open onOpenChange={(open) => { if (!open && !pending) close(); }}>
    <DialogContent className="max-h-[85%]">
      <DialogHeader><DialogTitle>Report {targetType}</DialogTitle></DialogHeader>
      <ScrollView contentContainerClassName="gap-4 pb-2" keyboardShouldPersistTaps="handled">
        <Text className="text-sm text-muted-foreground">Tell us why this content needs review. Reports are shared with administrators.</Text>
        <View className="flex-row flex-wrap gap-2">{(targetType === 'review' ? REPORT_REASONS_REVIEW : REPORT_REASONS_LISTING).map((item) => <FilterChip key={item.key} label={item.label} selected={reason === item.key} onPress={() => { if (!pending) setReason(item.key); }} />)}</View>
        <Input accessibilityLabel="Report details (optional)" multiline className="min-h-24 py-3" maxLength={MAX_REPORT_DETAILS} placeholder="Details (optional)" value={details} onChangeText={setDetails} editable={!pending} />
        <Button className="min-h-11" loading={pending} loadingLabel="Sending report…" disabled={!reason} onPress={() => void send()}><Text>Send report</Text></Button>
        <Button className="min-h-11" variant="outline" disabled={pending} onPress={close}><Text>Cancel</Text></Button>
      </ScrollView>
    </DialogContent>
  </Dialog>;
}
