import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Calendar, Check, Coffee, Mail, Star, X } from 'lucide-react-native';
import { collection, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { dayjs } from '@/lib/dayjs';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';
import { blurActiveElement } from '@/lib/navigation';
import { toShop, type Shop } from '@/types/shop';
import type { AppUserDocument } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { LogoutButton } from '@/components/logout-button';
import { StatTile } from '@/components/stat-tile';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { FilterChip } from '@/components/filter-chip';
import { ShopCardSkeleton } from '@/components/shop-card-skeleton';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/useToast';

type AdminTab = 'users' | 'owners';
type AdminUser = AppUserDocument & { id: string };
type AdminShop = Shop;

export default function AdminDashboardScreen() {
  const { user: admin, role } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [usersLoadFailed, setUsersLoadFailed] = useState(false);
  const [shopsLoadFailed, setShopsLoadFailed] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'admin') return;
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      setUsersLoadFailed(false);
      setUsers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AdminUser));
    }, (snapshotError) => { setUsersLoadFailed(true); showToast({ type: 'error', message: getUserFriendlyError(snapshotError, 'We could not load user accounts. Please try again.') }); });
  }, [role, showToast]);
  useEffect(() => {
    if (role !== 'admin') return;
    return onSnapshot(collection(db, 'shops'), (snapshot) => {
      setShopsLoadFailed(false);
      setShops(snapshot.docs.map((item) => toShop(item.id, item.data())));
      setShopsLoading(false);
    }, (snapshotError) => { setShopsLoading(false); setShopsLoadFailed(true); showToast({ type: 'error', message: getUserFriendlyError(snapshotError, 'We could not load listings. Please try again.') }); });
  }, [role, showToast]);
  const customerUsers = useMemo(() => users.filter((account) => account.role !== 'admin'), [users]);
  const reviewCounts = useMemo(() => Object.fromEntries(users.map((account) => [account.id, account.reviewCount ?? 0])), [users]);
  const owners = users.filter((account) => account.role === 'owner').length;
  const pending = shops.filter((shop) => shop.status === 'pending').length;
  const reviews = shops.reduce((sum, shop) => sum + shop.reviewCount, 0);

  async function setUserStatus(account: AdminUser, status: 'active' | 'suspended') { setUpdatingId(account.id); try { await withTimeout(writeUserStatus(account.id, status)); showToast({ type: 'success', message: status === 'suspended' ? 'Account suspended' : 'Account reactivated' }); } catch (actionError) { showToast({ type: 'error', message: getUserFriendlyError(actionError, 'We could not update this account. Please try again.') }); } finally { setUpdatingId(null); } }
  async function setShopStatus(shop: AdminShop, status: 'approved' | 'rejected') {
    setUpdatingId(shop.id);
    try {
      await withTimeout(writeShopStatus(shop, status));
      showToast({ type: 'success', message: status === 'approved' ? 'Listing approved' : 'Listing rejected' });
    } catch (actionError) {
      showToast({ type: 'error', message: getUserFriendlyError(actionError, 'We could not update this listing. Please try again.') });
    } finally {
      setUpdatingId(null);
    }
  }

  async function decideRemoval(shop: AdminShop, decision: 'revoke' | 'deny') {
    setUpdatingId(shop.id);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'shops', shop.id), decision === 'revoke'
        ? { status: 'archived', removalRequest: null }
        : { removalRequest: null });
      if (decision === 'revoke') {
        batch.set(doc(collection(db, 'users', shop.ownerId, 'notifications')), {
          type: 'listing_archived',
          message: `${shop.name} was archived after your removal request.`,
          shopId: shop.id,
          read: false,
          createdAt: serverTimestamp(),
        });
      }
      await withTimeout(batch.commit());
      showToast({ type: 'success', message: decision === 'revoke' ? 'Listing archived' : 'Removal request denied' });
    } catch (actionError) {
      showToast({ type: 'error', message: getUserFriendlyError(actionError, 'We could not review this removal request. Please try again.') });
    } finally {
      setUpdatingId(null);
    }
  }

  return <ScrollView className="flex-1 bg-background" contentContainerClassName="mx-auto w-full max-w-2xl gap-4 pb-8"><View className="gap-4 bg-primary px-4 pb-5 pt-12"><View className="flex-row items-center justify-between"><View><Text className="text-2xl font-bold text-primary-foreground">Admin Dashboard</Text><Text className="text-sm text-primary-foreground/70">Kapehan · Content Management</Text></View><LogoutButton size="sm" variant="ghost" /></View><View className="flex-row gap-2"><StatTile value={users.length} label="Users" tone="onDark" className="border-primary-foreground/10 bg-primary-foreground/10" /><StatTile value={owners} label="Owners" tone="onDark" className="border-primary-foreground/10 bg-primary-foreground/10" /><StatTile value={pending} label="Pending" tone="onDark" className="border-primary-foreground/10 bg-primary-foreground/10" /><StatTile value={reviews} label="Reviews" tone="onDark" className="border-primary-foreground/10 bg-primary-foreground/10" /></View></View><View className="gap-4 px-4"><View className="flex-row border-b border-border"><Button variant="ghost" className={tab === 'users' ? `flex-1 rounded-none border-b-2 border-accent ${Platform.select({ web: 'hover:bg-transparent dark:hover:bg-transparent' }) ?? ''}` : 'flex-1 rounded-none'} onPress={() => setTab('users')}><Text className={tab === 'users' ? 'font-bold text-accent' : undefined}>Users</Text></Button><Button variant="ghost" className={tab === 'owners' ? `flex-1 rounded-none border-b-2 border-accent ${Platform.select({ web: 'hover:bg-transparent dark:hover:bg-transparent' }) ?? ''}` : 'flex-1 rounded-none'} onPress={() => setTab('owners')}><Text className={tab === 'owners' ? 'font-bold text-accent' : undefined}>Owners {pending ? `(${pending})` : ''}</Text></Button></View>{tab === 'users' && usersLoadFailed ? <Text className="text-muted-foreground">User accounts are unavailable right now.</Text> : null}{tab === 'owners' && shopsLoadFailed ? <Text className="text-muted-foreground">Listings are unavailable right now.</Text> : null}{tab === 'users' ? <UsersList users={customerUsers} reviewCounts={reviewCounts} adminId={admin?.uid} updatingId={updatingId} onStatus={setUserStatus} loadFailed={usersLoadFailed} /> : <OwnersList shops={shops} loading={shopsLoading} updatingId={updatingId} onStatus={setShopStatus} onRemovalDecision={decideRemoval} loadFailed={shopsLoadFailed} />}</View></ScrollView>;
}

function UsersList({ users, reviewCounts, adminId, updatingId, onStatus, loadFailed }: { users: AdminUser[]; reviewCounts: Record<string, number>; adminId?: string; updatingId: string | null; onStatus: (account: AdminUser, status: 'active' | 'suspended') => void; loadFailed: boolean }) {
  const [viewingAccount, setViewingAccount] = useState<AdminUser | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const visibleUsers = users.filter((account) =>
    (statusFilter === 'all' || (account.status ?? 'active') === statusFilter) &&
    `${account.name ?? ''} ${account.email ?? ''}`.toLowerCase().includes(search.trim().toLowerCase()),
  );
  const viewingInitials = (viewingAccount?.name || viewingAccount?.email || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const viewingStatus = viewingAccount?.status ?? 'active';

  return <>
    <View className="gap-3">
      <Text className="text-xl font-bold">Registered Users</Text>
      <Input placeholder="Search name or email" value={search} onChangeText={setSearch} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
        {(['all', 'active', 'suspended'] as const).map((status) => <FilterChip key={status} label={status[0].toUpperCase() + status.slice(1)} selected={statusFilter === status} onPress={() => setStatusFilter(status)} />)}
      </ScrollView>
      {visibleUsers.map((account) => {
        const status = account.status ?? 'active';
        const initials = (account.name || account.email || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
        return <Card key={account.id} className={Platform.select({ web: 'transition-all duration-200 hover:shadow-md' })}><CardHeader className="gap-3"><View className="flex-row items-start gap-3"><View className="h-10 w-10 items-center justify-center rounded-full bg-secondary"><Text className="font-bold">{initials}</Text></View><View className="flex-1"><CardTitle>{account.name || 'Unnamed user'}</CardTitle><Text className="text-sm text-muted-foreground">{account.email}</Text></View><Badge variant="secondary"><Text className="capitalize">{account.role}</Text></Badge><Badge className={status === 'active' ? 'border-transparent bg-green-100' : 'border-transparent bg-red-100'} variant="secondary"><Text className={status === 'active' ? 'text-green-800' : 'text-red-700'}>{status}</Text></Badge></View><Text className="text-sm text-muted-foreground">Joined {account.createdAt ? dayjs(account.createdAt.toDate()).format('MMM D, YYYY') : 'recently'} · {reviewCounts[account.id] ?? 0} reviews</Text><View className="flex-row gap-2"><Button className="flex-1" size="sm" variant="outline" disabled={account.id === adminId} loading={updatingId === account.id} loadingLabel="Updating…" onPress={() => onStatus(account, status === 'active' ? 'suspended' : 'active')}><Text>{status === 'active' ? 'Suspend Account' : 'Reactivate Account'}</Text></Button><Button className="flex-1" size="sm" variant="outline" onPress={() => setViewingAccount(account)}><Text>View Account</Text></Button></View></CardHeader></Card>;
      })}
      {visibleUsers.length === 0 && !loadFailed ? <Text className="text-muted-foreground">No matching accounts.</Text> : null}
    </View>
    <Dialog open={!!viewingAccount} onOpenChange={(open) => { if (!open) { blurActiveElement(); setViewingAccount(null); } }}>
      <DialogContent>
        <DialogHeader className="items-center gap-3">
          <View className="h-16 w-16 items-center justify-center rounded-full bg-secondary"><Text className="text-xl font-bold">{viewingInitials}</Text></View>
          <DialogTitle>{viewingAccount?.name || 'Unnamed user'}</DialogTitle>
        </DialogHeader>
        <View className="gap-3">
          <View className="flex-row items-center gap-3"><Icon as={Mail} size={18} className="text-muted-foreground" /><View className="flex-1"><Text className="text-xs text-muted-foreground">Email</Text><Text>{viewingAccount?.email || 'No email on file'}</Text></View></View>
          <View className="flex-row gap-3"><View className="flex-1 gap-1"><Text className="text-xs text-muted-foreground">Role</Text><Badge variant="secondary"><Text>{viewingAccount?.role ?? 'user'}</Text></Badge></View><View className="flex-1 gap-1"><Text className="text-xs text-muted-foreground">Status</Text><Badge className={viewingStatus === 'active' ? 'border-transparent bg-green-100' : 'border-transparent bg-red-100'} variant="secondary"><Text className={viewingStatus === 'active' ? 'text-green-800' : 'text-red-700'}>{viewingStatus}</Text></Badge></View></View>
          <View className="flex-row items-center gap-3"><Icon as={Calendar} size={18} className="text-muted-foreground" /><View><Text className="text-xs text-muted-foreground">Joined</Text><Text>{viewingAccount?.createdAt ? dayjs(viewingAccount.createdAt.toDate()).format('MMM D, YYYY') : 'Unknown'}</Text></View></View>
          <View className="flex-row items-center gap-3"><Icon as={Star} size={18} className="text-accent" /><Text className="flex-1 text-sm text-muted-foreground">Reviews written</Text><Text className="font-semibold">{reviewCounts[viewingAccount?.id ?? ''] ?? 0}</Text></View>
        </View>
      </DialogContent>
    </Dialog>
  </>;
}

function OwnersList({ shops, loading, updatingId, onStatus, onRemovalDecision, loadFailed }: { shops: Shop[]; loading: boolean; updatingId: string | null; onStatus: (shop: Shop, status: 'approved' | 'rejected') => void; onRemovalDecision: (shop: Shop, decision: 'revoke' | 'deny') => void; loadFailed: boolean }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'archived'>('all');
  const visibleShops = shops.filter((shop) =>
    (statusFilter === 'all' || shop.status === statusFilter) &&
    shop.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return <View className="gap-3">
    <Text className="text-xl font-bold">Owner Accounts</Text>
    <Input placeholder="Search shop name" value={search} onChangeText={setSearch} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
      {(['all', 'pending', 'approved', 'rejected', 'archived'] as const).map((status) => <FilterChip key={status} label={status === 'rejected' ? 'Rejected' : status[0].toUpperCase() + status.slice(1)} selected={statusFilter === status} onPress={() => setStatusFilter(status)} />)}
    </ScrollView>
    {loading ? <><ShopCardSkeleton /><ShopCardSkeleton /></> : visibleShops.map((shop) => <OwnerShopCard key={shop.id} shop={shop} updating={updatingId === shop.id} onStatus={onStatus} onRemovalDecision={onRemovalDecision} />)}
    {!loading && !loadFailed && visibleShops.length === 0 ? <Text className="text-muted-foreground">No matching listings.</Text> : null}
  </View>;
}

function OwnerShopCard({ shop, updating, onStatus, onRemovalDecision }: {
  shop: Shop;
  updating: boolean;
  onStatus: (shop: Shop, status: 'approved' | 'rejected') => void;
  onRemovalDecision: (shop: Shop, decision: 'revoke' | 'deny') => void;
}) {
  const removalPending = Boolean(shop.removalRequest);
  return <Card className={cn(
    removalPending ? 'border-l-4 border-l-amber-600' : shop.status === 'pending' && 'border-l-4 border-l-amber-500',
    Platform.select({ web: 'transition-all duration-200 hover:shadow-md' }),
  )}>
    <CardHeader className="gap-3">
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1"><View className="flex-row items-center gap-2"><Icon as={Coffee} size={17} className="text-accent" /><CardTitle>{shop.name}</CardTitle></View><Text className="text-sm text-muted-foreground">Registered listing</Text></View>
        <Badge className={shop.status === 'approved' ? 'border-transparent bg-green-100' : shop.status === 'pending' ? 'border-transparent bg-amber-100' : 'border-transparent bg-slate-200'} variant="secondary"><Text className={shop.status === 'approved' ? 'text-green-800' : shop.status === 'pending' ? 'text-amber-800' : 'text-slate-800'}>{shop.status}</Text></Badge>
      </View>
      {shop.removalRequest ? <View className="gap-1 rounded-lg bg-amber-50 p-3"><Text className="font-semibold text-amber-900">Removal requested</Text><Text className="text-amber-900">{shop.removalRequest.reason}</Text></View> : null}
      {removalPending ? <View className="flex-row gap-2">
        <Button className="flex-1" variant="destructive" loading={updating} loadingLabel="Updating…" onPress={() => onRemovalDecision(shop, 'revoke')}><Text>Revoke Listing</Text></Button>
        <Button className="flex-1" variant="outline" disabled={updating} onPress={() => onRemovalDecision(shop, 'deny')}><Text>Deny Request</Text></Button>
      </View> : null}
      {!removalPending && shop.status === 'approved' ? <Button variant="outline" className="border-destructive" loading={updating} loadingLabel="Updating…" onPress={() => onStatus(shop, 'rejected')}><Text className="text-destructive">Revoke Listing</Text></Button> : null}
      {!removalPending && shop.status === 'pending' ? <View className="flex-row gap-2"><Button className="flex-1 bg-green-700" loading={updating} loadingLabel="Updating…" onPress={() => onStatus(shop, 'approved')}><Icon as={Check} size={16} className="text-white" /><Text>Approve Listing</Text></Button><Button className="flex-1" variant="destructive" loading={updating} loadingLabel="Updating…" onPress={() => onStatus(shop, 'rejected')}><Icon as={X} size={16} className="text-destructive-foreground" /><Text>Reject</Text></Button></View> : null}
      <Button variant="ghost" size="sm" className="self-start" onPress={() => router.push({ pathname: '/(admin)/listing/[id]', params: { id: shop.id } })}><Text>View listing</Text></Button>
    </CardHeader>
  </Card>;
}

async function writeUserStatus(uid: string, status: 'active' | 'suspended') { const batch = writeBatch(db); batch.update(doc(db, 'users', uid), { status }); await batch.commit(); }
async function writeShopStatus(shop: Shop, status: 'approved' | 'rejected') { const batch = writeBatch(db); batch.update(doc(db, 'shops', shop.id), { status }); batch.set(doc(collection(db, 'users', shop.ownerId, 'notifications')), { type: status === 'approved' ? 'listing_approved' : 'listing_rejected', message: `${shop.name} was ${status}.`, shopId: shop.id, read: false, createdAt: serverTimestamp() }); await batch.commit(); }
