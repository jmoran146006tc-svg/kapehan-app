import { useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight, Calendar, Check, Mail, Star, X } from 'lucide-react-native';
import { collection, doc, getDocs, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Icon } from '@/components/ui/icon';
import { LogoutButton } from '@/components/logout-button';
import { Logo } from '@/components/logo';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { FilterChip } from '@/components/filter-chip';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/useToast';

type AdminTab = 'users' | 'owners';
type ListingFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'archived';
type AdminUser = AppUserDocument & { id: string };
type AdminShop = Shop;

export default function AdminDashboardScreen() {
  const insets = useSafeAreaInsets();
  const { user: admin, role } = useAuth();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>('users');
  const [listingFilter, setListingFilter] = useState<ListingFilter>('all');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shops, setShops] = useState<AdminShop[]>([]);
  const [shopsLoading, setShopsLoading] = useState(true);
  const [usersLoadFailed, setUsersLoadFailed] = useState(false);
  const [shopsLoadFailed, setShopsLoadFailed] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

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
  const pending = shops.filter((shop) => shop.status === 'pending').length;

  async function refresh() {
    setRefreshing(true);
    try {
      const [userSnapshot, shopSnapshot] = await Promise.all([getDocs(collection(db, 'users')), getDocs(collection(db, 'shops'))]);
      setUsers(userSnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AdminUser));
      setShops(shopSnapshot.docs.map((item) => toShop(item.id, item.data())));
      setUsersLoadFailed(false);
      setShopsLoadFailed(false);
    } catch (error) { showToast({ type: 'error', message: getUserFriendlyError(error, 'We could not refresh the dashboard.') }); }
    finally { setRefreshing(false); }
  }

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

  return <View className="flex-1 bg-background" style={{ minHeight: 0 }}>
    <View className="border-b border-border bg-card px-4 pb-5" style={{ paddingTop: Math.max(insets.top, 16) }}>
      <View className="mx-auto w-full max-w-2xl">
        <View className="flex-row items-center justify-between gap-3">
          <View className="flex-row items-center gap-2">
            <Logo width={40} height={40} />
            <View><Text className="font-serif text-lg font-bold text-foreground">Kapehan</Text><Text className="text-xs text-muted-foreground">Administration</Text></View>
          </View>
          <LogoutButton size="sm" variant="outline" />
        </View>
        <View className="mt-5 flex-row flex-wrap items-end justify-between gap-4 border-t border-border pt-5">
          <View className="flex-1"><Text className="font-serif text-3xl font-bold text-foreground">The counter</Text><Text className="mt-1 text-sm text-muted-foreground">Review shops. Manage people.</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel={pending ? 'Open pending listings' : 'Open listings'} onPress={() => { setListingFilter(pending ? 'pending' : 'all'); setTab('owners'); }} className="flex-row items-center gap-3 border-b border-accent pb-1">
            <Text className="font-serif text-3xl font-bold text-accent">{pending}</Text>
            <View><Text className="text-xs font-semibold text-foreground">Awaiting review</Text><Text className="text-xs text-muted-foreground">{pending ? 'Open queue' : 'See listings'}</Text></View>
            <Icon as={ArrowRight} size={16} className="text-accent" />
          </Pressable>
        </View>
      </View>
    </View>
    <View className="mx-auto w-full max-w-2xl flex-1 gap-3 px-4" style={{ minHeight: 0 }}>
      <View className="flex-row gap-8 border-b border-border">
        <Button variant="ghost" className={tab === 'users' ? 'rounded-none border-b border-foreground px-1' : 'rounded-none px-1'} onPress={() => setTab('users')}><Text className={tab === 'users' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>People <Text className="text-xs text-muted-foreground">{customerUsers.length}</Text></Text></Button>
        <Button variant="ghost" className={tab === 'owners' ? 'rounded-none border-b border-foreground px-1' : 'rounded-none px-1'} onPress={() => { setListingFilter('all'); setTab('owners'); }}><Text className={tab === 'owners' ? 'font-semibold text-foreground' : 'text-muted-foreground'}>Listings <Text className="text-xs text-muted-foreground">{shops.length}</Text></Text></Button>
      </View>
      {tab === 'users' && usersLoadFailed ? <Text className="text-muted-foreground">User accounts are unavailable right now.</Text> : null}
      {tab === 'owners' && shopsLoadFailed ? <Text className="text-muted-foreground">Listings are unavailable right now.</Text> : null}
      {tab === 'users' ? <UsersList users={customerUsers} reviewCounts={reviewCounts} adminId={admin?.uid} updatingId={updatingId} onStatus={setUserStatus} loadFailed={usersLoadFailed} refreshing={refreshing} onRefresh={refresh} /> : <OwnersList shops={shops} loading={shopsLoading} updatingId={updatingId} onStatus={setShopStatus} onRemovalDecision={decideRemoval} loadFailed={shopsLoadFailed} refreshing={refreshing} onRefresh={refresh} statusFilter={listingFilter} onStatusFilterChange={setListingFilter} />}
    </View>
  </View>;
}

function UsersList({ users, reviewCounts, adminId, updatingId, onStatus, loadFailed, refreshing, onRefresh }: { users: AdminUser[]; reviewCounts: Record<string, number>; adminId?: string; updatingId: string | null; onStatus: (account: AdminUser, status: 'active' | 'suspended') => void; loadFailed: boolean; refreshing: boolean; onRefresh: () => Promise<void> }) {
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
    <FlatList className="flex-1" style={{ minHeight: 0 }} data={visibleUsers} keyExtractor={(account) => account.id} initialNumToRender={10} windowSize={7} refreshing={refreshing} onRefresh={() => void onRefresh()} contentContainerClassName="pb-8" ListHeaderComponent={<View className="gap-3 pb-2 pt-1"><Text className="font-serif text-xl font-bold">People</Text><Input placeholder="Search name or email" value={search} onChangeText={setSearch} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">{(['all', 'active', 'suspended'] as const).map((status) => <FilterChip key={status} label={status[0].toUpperCase() + status.slice(1)} selected={statusFilter === status} onPress={() => setStatusFilter(status)} />)}</ScrollView></View>} ListEmptyComponent={!loadFailed ? <Text className="py-4 text-muted-foreground">No matching accounts.</Text> : null} renderItem={({ item: account }) => {
      const status = account.status ?? 'active';
      return <View className="border-b border-border py-4">
        <View className="flex-row items-start justify-between gap-3">
          <View className="flex-1"><Text className="text-base font-semibold text-foreground">{account.name || 'Unnamed user'}</Text><Text className="mt-0.5 text-sm text-muted-foreground">{account.email}</Text></View>
          <View className="flex-row items-center gap-1.5 pt-1"><View className={status === 'active' ? 'h-2 w-2 rounded-full bg-success-foreground' : 'h-2 w-2 rounded-full bg-destructive'} /><Text className="text-xs capitalize text-muted-foreground">{status}</Text></View>
        </View>
        <Text className="mt-2 text-xs text-muted-foreground">{account.role === 'owner' ? 'Shop owner' : 'Member'} · Joined {account.createdAt ? dayjs(account.createdAt.toDate()).format('MMM D, YYYY') : 'recently'}</Text>
        <View className="mt-3 flex-row flex-wrap items-center gap-3"><Button size="sm" variant="outline" disabled={account.id === adminId} loading={updatingId === account.id} loadingLabel="Updating…" onPress={() => onStatus(account, status === 'active' ? 'suspended' : 'active')}><Text>{status === 'active' ? 'Suspend' : 'Reactivate'}</Text></Button><Button size="sm" variant="link" onPress={() => setViewingAccount(account)}><Text>View account</Text></Button></View>
      </View>;
    }} />
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

function OwnersList({ shops, loading, updatingId, onStatus, onRemovalDecision, loadFailed, refreshing, onRefresh, statusFilter, onStatusFilterChange }: { shops: Shop[]; loading: boolean; updatingId: string | null; onStatus: (shop: Shop, status: 'approved' | 'rejected') => void; onRemovalDecision: (shop: Shop, decision: 'revoke' | 'deny') => void; loadFailed: boolean; refreshing: boolean; onRefresh: () => Promise<void>; statusFilter: ListingFilter; onStatusFilterChange: (filter: ListingFilter) => void }) {
  const [search, setSearch] = useState('');
  const visibleShops = shops.filter((shop) =>
    (statusFilter === 'all' || shop.status === statusFilter) &&
    shop.name.toLowerCase().includes(search.trim().toLowerCase()),
  );
  return <FlatList className="flex-1" style={{ minHeight: 0 }} data={loading ? [] : visibleShops} keyExtractor={(shop) => shop.id} initialNumToRender={8} windowSize={7} refreshing={refreshing} onRefresh={() => void onRefresh()} contentContainerClassName="pb-8" ListHeaderComponent={<View className="gap-3 pb-2 pt-1"><Text className="font-serif text-xl font-bold">Listings</Text><Input placeholder="Search shop name" value={search} onChangeText={setSearch} /><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">{(['all', 'pending', 'approved', 'rejected', 'archived'] as const).map((status) => <FilterChip key={status} label={status[0].toUpperCase() + status.slice(1)} selected={statusFilter === status} onPress={() => onStatusFilterChange(status)} />)}</ScrollView></View>} ListEmptyComponent={loading ? <View className="gap-3 py-4"><Skeleton className="h-4 w-1/2 rounded-sm" /><Skeleton className="h-3 w-1/3 rounded-sm" /><View className="border-b border-border pb-4" /><Skeleton className="h-4 w-2/3 rounded-sm" /><Skeleton className="h-3 w-1/4 rounded-sm" /></View> : !loadFailed ? <Text className="py-4 text-muted-foreground">No matching listings.</Text> : null} renderItem={({ item }) => <ListingRow shop={item} updating={updatingId === item.id} onStatus={onStatus} onRemovalDecision={onRemovalDecision} />} />;
}

function ListingRow({ shop, updating, onStatus, onRemovalDecision }: {
  shop: Shop;
  updating: boolean;
  onStatus: (shop: Shop, status: 'approved' | 'rejected') => void;
  onRemovalDecision: (shop: Shop, decision: 'revoke' | 'deny') => void;
}) {
  const removalPending = Boolean(shop.removalRequest);
  return <View className="border-b border-border py-4">
    <View className="flex-row items-start justify-between gap-3">
      <View className="flex-1"><Text className="text-base font-semibold text-foreground">{shop.name}</Text><Text className="mt-0.5 text-xs text-muted-foreground">Shop listing</Text></View>
      <View className="flex-row items-center gap-1.5 pt-1"><View className={shop.status === 'approved' ? 'h-2 w-2 rounded-full bg-success-foreground' : shop.status === 'pending' ? 'h-2 w-2 rounded-full bg-accent' : 'h-2 w-2 rounded-full bg-muted-foreground'} /><Text className="text-xs capitalize text-muted-foreground">{shop.status}</Text></View>
    </View>
    {shop.removalRequest ? <View className="mt-3 gap-1 rounded-md border border-border bg-secondary/50 p-3"><Text className="text-sm font-semibold text-foreground">Removal requested</Text><Text className="text-sm text-muted-foreground">{shop.removalRequest.reason}</Text></View> : null}
    <View className="mt-3 flex-row flex-wrap items-center gap-2">
      {removalPending ? <><Button size="sm" variant="destructive" loading={updating} loadingLabel="Updating…" onPress={() => onRemovalDecision(shop, 'revoke')}><Text>Revoke listing</Text></Button><Button size="sm" variant="outline" disabled={updating} onPress={() => onRemovalDecision(shop, 'deny')}><Text>Deny request</Text></Button></> : null}
      {!removalPending && shop.status === 'approved' ? <Button size="sm" variant="outline" className="border-destructive" loading={updating} loadingLabel="Updating…" onPress={() => onStatus(shop, 'rejected')}><Text className="text-destructive">Revoke listing</Text></Button> : null}
      {!removalPending && shop.status === 'pending' ? <><Button size="sm" className="bg-success-foreground" loading={updating} loadingLabel="Updating…" onPress={() => onStatus(shop, 'approved')}><Icon as={Check} size={16} className="text-white" /><Text>Approve</Text></Button><Button size="sm" variant="outline" disabled={updating} onPress={() => onStatus(shop, 'rejected')}><Icon as={X} size={16} className="text-destructive" /><Text className="text-destructive">Reject</Text></Button></> : null}
      <Button variant="link" size="sm" onPress={() => router.push({ pathname: '/(admin)/listing/[id]', params: { id: shop.id } })}><Text>View listing</Text></Button>
    </View>
  </View>;
}

async function writeUserStatus(uid: string, status: 'active' | 'suspended') { const batch = writeBatch(db); batch.update(doc(db, 'users', uid), { status }); await batch.commit(); }
async function writeShopStatus(shop: Shop, status: 'approved' | 'rejected') { const batch = writeBatch(db); batch.update(doc(db, 'shops', shop.id), { status }); batch.set(doc(collection(db, 'users', shop.ownerId, 'notifications')), { type: status === 'approved' ? 'listing_approved' : 'listing_rejected', message: `${shop.name} was ${status}.`, shopId: shop.id, read: false, createdAt: serverTimestamp() }); await batch.commit(); }
