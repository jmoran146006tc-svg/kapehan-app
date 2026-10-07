import { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, View } from 'react-native';
import { router } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { withTimeout } from '@/lib/timeout';
import { getUserFriendlyError } from '@/lib/errors';
import { blurActiveElement } from '@/lib/navigation';
import { dayjs } from '@/lib/dayjs';
import { removeReviewAsAdmin, resolveOpenReportsForReview, resolveReport, setUserStatus } from '@/lib/moderation';
import { REPORT_REASONS_LISTING, REPORT_REASONS_REVIEW, REPORTS_PAGE_LIMIT } from '@/constants/moderation';
import type { Report } from '@/types/report';
import { toReview, type Review } from '@/types/review';
import { useToast } from '@/hooks/useToast';
import { FilterChip } from '@/components/filter-chip';
import { EmptyState } from '@/components/empty-state';
import { ReviewPhotoStrip } from '@/components/review-photo-strip';
import { RemoveReviewDialog } from '@/components/remove-review-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { Text } from '@/components/ui/text';

interface Reporter { name: string; email: string }
interface AdminReportsListProps {
  reports: Report[];
  loading: boolean;
  loadFailed: boolean;
  adminUid: string;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
}

export function AdminReportsList({ reports, loading, loadFailed, adminUid, refreshing, onRefresh }: AdminReportsListProps) {
  const [filter, setFilter] = useState<'open' | 'resolved' | 'all'>('open');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [removing, setRemoving] = useState<{ report: Report; reviewerName: string } | null>(null);
  const [suspending, setSuspending] = useState<Report | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const reporters = useRef(new Map<string, Promise<Reporter>>());
  const { showToast } = useToast();

  const getReporter = useCallback((uid: string) => {
    const existing = reporters.current.get(uid);
    if (existing) return existing;
    const request = withTimeout(getDoc(doc(db, 'users', uid))).then((snapshot) => {
      const data = snapshot.data();
      return { name: typeof data?.name === 'string' && data.name ? data.name : 'Unknown user', email: typeof data?.email === 'string' ? data.email : '' };
    }).catch((error) => {
      reporters.current.delete(uid);
      showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not load reporter details.') });
      return { name: 'Unknown user', email: '' };
    });
    reporters.current.set(uid, request);
    return request;
  }, [showToast]);

  async function resolve(report: Report, status: 'dismissed' | 'actioned') {
    if (updatingId) return;
    setUpdatingId(report.id);
    try {
      await resolveReport({ reportId: report.id, adminUid, status });
      showToast({ type: 'success', message: status === 'dismissed' ? 'Report dismissed.' : 'Report marked actioned.' });
    } catch (error) { showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not resolve this report. Please try again.') }); }
    finally { setUpdatingId(null); }
  }

  async function suspend() {
    if (!suspending || updatingId) return;
    setUpdatingId(suspending.id);
    let suspended = false;
    try {
      await setUserStatus(suspending.targetUserId, 'suspended');
      suspended = true;
      await resolveReport({ reportId: suspending.id, adminUid, status: 'actioned' });
      showToast({ type: 'success', message: 'Account suspended and report marked actioned.' });
      blurActiveElement(); setSuspending(null);
    } catch (error) {
      if (suspended) { showToast({ type: 'info', message: 'Account suspended, but the report still needs to be marked actioned.' }); blurActiveElement(); setSuspending(null); }
      else showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not suspend this account. Please try again.') });
    } finally { setUpdatingId(null); }
  }

  const visible = reports.filter((report) => filter === 'all' || (filter === 'open' ? report.status === 'open' : report.status !== 'open'));
  return <>
    <FlatList
      className="flex-1"
      style={{ minHeight: 0 }}
      data={loading ? [] : visible}
      keyExtractor={(report) => report.id}
      initialNumToRender={6}
      windowSize={5}
      contentContainerClassName="gap-3 pb-8"
      refreshing={refreshing}
      onRefresh={() => { reporters.current.clear(); setRefreshVersion((value) => value + 1); void onRefresh(); }}
      ListHeaderComponent={<View className="gap-3 pb-2">
        <Text className="text-xl font-bold">Reports</Text>
        <Text className="text-sm text-muted-foreground">Showing the latest {REPORTS_PAGE_LIMIT} reports. Pull down to refresh content previews.</Text>
        <View className="flex-row flex-wrap gap-2">{(['open', 'resolved', 'all'] as const).map((status) => <FilterChip key={status} label={status[0].toUpperCase() + status.slice(1)} selected={filter === status} onPress={() => setFilter(status)} />)}</View>
      </View>}
      ListEmptyComponent={loading ? <View className="gap-3"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></View> : loadFailed ? <EmptyState title="Reports are unavailable" description="Pull down to retry." /> : <EmptyState title="No matching reports" description="Reports from the community will appear here." />}
      renderItem={({ item }) => <ReportCard report={item} getReporter={getReporter} refreshVersion={refreshVersion} disabled={updatingId !== null || !adminUid} adminUid={adminUid} onRemove={(reviewerName) => { blurActiveElement(); setRemoving({ report: item, reviewerName }); }} onSuspend={() => { blurActiveElement(); setSuspending(item); }} onResolve={(status) => void resolve(item, status)} />}
    />
    <RemoveReviewDialog open={removing !== null} reviewerName={removing?.reviewerName ?? ''} onOpenChange={(open) => { if (!open) { blurActiveElement(); setRemoving(null); } }} onConfirm={async (reasonLabel) => {
      if (!removing?.report.reviewId || !adminUid) return;
      const report = removing.report;
      setUpdatingId(report.id);
      try {
        const result = await removeReviewAsAdmin({ shopId: report.shopId, reviewId: report.reviewId!, reasonLabel });
        setRefreshVersion((value) => value + 1);
        showToast({ type: 'success', message: result.notified ? 'Review removed and reviewer notified.' : 'Review removed. The reviewer no longer has an account to notify.' });
        // This includes the selected report and every open sibling, in separate requests.
        if (!await resolveOpenReportsForReview({ shopId: report.shopId, reviewId: report.reviewId!, adminUid })) showToast({ type: 'info', message: 'Review removed, but some reports still need to be marked actioned.' });
      } finally { setUpdatingId(null); }
    }} />
    <Dialog open={suspending !== null} onOpenChange={(open) => { if (!open && !updatingId) { blurActiveElement(); setSuspending(null); } }}>
      <DialogContent>
        <DialogHeader><DialogTitle>Suspend {suspending?.targetType === 'review' ? 'author' : 'owner'}?</DialogTitle></DialogHeader>
        <Text>This account will be suspended and the report marked actioned.</Text>
        <Button className="min-h-11" variant="destructive" loading={updatingId === suspending?.id} loadingLabel="Suspending…" onPress={() => void suspend()}><Text>Suspend account</Text></Button>
        <Button className="min-h-11" variant="outline" disabled={updatingId !== null} onPress={() => { blurActiveElement(); setSuspending(null); }}><Text>Cancel</Text></Button>
      </DialogContent>
    </Dialog>
  </>;
}

function ReportCard({ report, getReporter, refreshVersion, disabled, adminUid, onRemove, onSuspend, onResolve }: {
  report: Report;
  getReporter: (uid: string) => Promise<Reporter>;
  refreshVersion: number;
  disabled: boolean;
  adminUid: string;
  onRemove: (reviewerName: string) => void;
  onSuspend: () => void;
  onResolve: (status: 'dismissed' | 'actioned') => void;
}) {
  const [reporter, setReporter] = useState<Reporter>({ name: 'Unknown user', email: '' });
  const [preview, setPreview] = useState<{ review: Review | null; failed: boolean } | null>(null);
  const { showToast } = useToast();
  useEffect(() => {
    let active = true;
    if (report.reporterId) void getReporter(report.reporterId).then((value) => { if (active) setReporter(value); });
    return () => { active = false; };
  }, [getReporter, report.reporterId, refreshVersion]);
  useEffect(() => {
    if (report.targetType !== 'review' || !report.reviewId || !report.shopId) return;
    let active = true;
    void withTimeout(getDoc(doc(db, 'shops', report.shopId, 'reviews', report.reviewId))).then((snapshot) => {
      if (active) setPreview({ review: snapshot.exists() ? toReview(snapshot.id, snapshot.data()) : null, failed: false });
    }).catch((error) => {
      if (!active) return;
      setPreview({ review: null, failed: true });
      showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not load the reported review.') });
    });
    return () => { active = false; };
  }, [report.targetType, report.shopId, report.reviewId, report.status, refreshVersion, showToast]);
  const reason = [...REPORT_REASONS_REVIEW, ...REPORT_REASONS_LISTING].find((item) => item.key === report.reason)?.label ?? report.reason;
  return <Card><CardHeader className="gap-3">
    <View className="flex-row flex-wrap gap-2"><Badge variant="secondary"><Text>{report.targetType === 'review' ? 'Review' : 'Listing'}</Text></Badge><Badge variant="outline"><Text>{reason}</Text></Badge><Badge variant="secondary"><Text>{report.status}</Text></Badge></View>
    <Text className="text-lg font-semibold">{report.shopName || 'Unknown listing'}</Text>
    <Text className="text-sm text-muted-foreground">Reported by {reporter.name}{reporter.email ? ` · ${reporter.email}` : ''}</Text>
    {report.excerpt ? <View className="gap-1"><Text className="text-xs text-muted-foreground">Reported text</Text><Text>{report.excerpt}</Text></View> : null}
    {report.details ? <Text>{report.details}</Text> : null}
    <Text className="text-xs text-muted-foreground">{report.createdAt ? dayjs(report.createdAt.toDate()).fromNow() : 'Just now'}</Text>
    {report.targetType === 'review' ? <View className="gap-2 rounded-xl bg-secondary p-3">
      <Text className="font-semibold">Current review</Text>
      {!preview ? <Skeleton className="h-16 w-full" /> : preview.failed ? <Text className="text-muted-foreground">Preview unavailable. Pull down to retry.</Text> : preview.review ? <>
        <Text>{preview.review.userName} · {preview.review.rating}/5</Text><Text>{preview.review.text || 'No written comment.'}</Text><ReviewPhotoStrip photos={preview.review.photos} />
      </> : <Text className="text-muted-foreground">Content already removed</Text>}
    </View> : null}
    {report.status === 'open' ? <View className="flex-row flex-wrap gap-2">
      {report.targetType === 'review' && preview?.review ? <Button className="min-h-11 border-destructive" variant="outline" disabled={disabled} onPress={() => onRemove(preview.review!.userName)}><Text className="text-destructive">Remove review</Text></Button> : null}
      <Button className="min-h-11" variant="outline" disabled={disabled || !report.targetUserId || report.targetUserId === adminUid} onPress={onSuspend}><Text>{report.targetType === 'review' ? 'Suspend author' : 'Suspend owner'}</Text></Button>
      <Button className="min-h-11" variant="outline" disabled={disabled || !report.shopId} onPress={() => { blurActiveElement(); router.push({ pathname: '/(admin)/listing/[id]', params: { id: report.shopId } }); }}><Text>{report.targetType === 'review' ? 'View listing' : 'Review listing'}</Text></Button>
      {report.targetType === 'listing' || (preview && !preview.failed && !preview.review) ? <Button className="min-h-11" variant="outline" disabled={disabled} onPress={() => onResolve('actioned')}><Text>Mark actioned</Text></Button> : null}
      <Button className="min-h-11" variant="ghost" disabled={disabled} onPress={() => onResolve('dismissed')}><Text>Dismiss</Text></Button>
    </View> : <View className="gap-1"><Text className="text-xs text-muted-foreground">Resolved by {report.resolvedBy || 'an administrator'}{report.resolvedAt ? ` · ${dayjs(report.resolvedAt.toDate()).fromNow()}` : ''}</Text>{report.adminNote ? <Text className="text-sm">{report.adminNote}</Text> : null}</View>}
  </CardHeader></Card>;
}
