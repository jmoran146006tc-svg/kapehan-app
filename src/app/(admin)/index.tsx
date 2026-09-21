import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Check, Coffee, X } from 'lucide-react-native';
import { collection, collectionGroup, doc, onSnapshot, serverTimestamp, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/useAuth';
import { dayjs } from '@/lib/dayjs';
import { getUserFriendlyError } from '@/lib/errors';
import { withTimeout } from '@/lib/timeout';
import { toShop, type Shop } from '@/types/shop';
import type { AppUserDocument } from '@/types/user';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Icon } from '@/components/ui/icon';
import { LogoutButton } from '@/components/logout-button';
import { StatTile } from '@/components/stat-tile';
import { Text } from '@/components/ui/text';

type AdminTab = 'users' | 'owners';
type AdminUser = AppUserDocument & { id: string };

export default function AdminDashboardScreen() {
  const { user: admin } = useAuth();
  const [tab, setTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [shops, setShops] = useState<Shop[]>([]);
  const [reviewCounts, setReviewCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => onSnapshot(collection(db, 'users'), (snapshot) => setUsers(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as AdminUser)), (snapshotError) => setError(getUserFriendlyError(snapshotError, 'We could not load user accounts. Please try again.'))), []);
  useEffect(() => onSnapshot(collection(db, 'shops'), (snapshot) => setShops(snapshot.docs.map((item) => toShop(item.id, item.data()))), (snapshotError) => setError(getUserFriendlyError(snapshotError, 'We could not load listings. Please try again.'))), []);
  useEffect(() => onSnapshot(collectionGroup(db, 'reviews'), (snapshot) => setReviewCounts(snapshot.docs.reduce<Record<string, number>>((counts, item) => { const uid = String(item.data().userId ?? ''); return uid ? { ...counts, [uid]: (counts[uid] ?? 0) + 1 } : counts; }, {})), () => undefined), []);

  const customerUsers = useMemo(() => users.filter((account) => account.role === 'user'), [users]);
  const owners = users.filter((account) => account.role === 'owner').length;
  const pending = shops.filter((shop) => shop.status === 'pending').length;
  const reviews = Object.values(reviewCounts).reduce((sum, count) => sum + count, 0);

  async function setUserStatus(account: AdminUser, status: 'active' | 'suspended') { setError(null); setUpdatingId(account.id); try { await withTimeout(writeUserStatus(account.id, status)); } catch (actionError) { setError(getUserFriendlyError(actionError, 'We could not update this account. Please try again.')); } finally { setUpdatingId(null); } }
  async function setShopStatus(shop: Shop, status: 'approved' | 'rejected') { setError(null); setUpdatingId(shop.id); try { await withTimeout(writeShopStatus(shop, status)); } catch (actionError) { setError(getUserFriendlyError(actionError, 'We could not update this listing. Please try again.')); } finally { setUpdatingId(null); } }

  return <ScrollView className="flex-1 bg-background" contentContainerClassName="mx-auto w-full max-w-2xl gap-4 pb-8"><View className="gap-4 bg-primary px-4 pb-5 pt-12"><View className="flex-row items-center justify-between"><View><Text className="text-2xl font-bold text-primary-foreground">Admin Dashboard</Text><Text className="text-sm text-primary-foreground/70">Kapehan · Content Management</Text></View><LogoutButton size="sm" variant="ghost" /></View><View className="flex-row gap-2"><StatTile value={users.length} label="Users" className="border-primary-foreground/10 bg-primary-foreground/10" /><StatTile value={owners} label="Owners" className="border-primary-foreground/10 bg-primary-foreground/10" /><StatTile value={pending} label="Pending" className="border-primary-foreground/10 bg-primary-foreground/10" /><StatTile value={reviews} label="Reviews" className="border-primary-foreground/10 bg-primary-foreground/10" /></View></View><View className="gap-4 px-4"><View className="flex-row border-b border-border"><Button variant="ghost" className={tab === 'users' ? 'flex-1 rounded-none border-b-2 border-accent' : 'flex-1 rounded-none'} onPress={() => setTab('users')}><Text className={tab === 'users' ? 'font-bold text-accent' : undefined}>Users</Text></Button><Button variant="ghost" className={tab === 'owners' ? 'flex-1 rounded-none border-b-2 border-accent' : 'flex-1 rounded-none'} onPress={() => setTab('owners')}><Text className={tab === 'owners' ? 'font-bold text-accent' : undefined}>Owners {pending ? `(${pending})` : ''}</Text></Button></View>{error ? <Text accessibilityRole="alert" className="text-destructive">{error}</Text> : null}{tab === 'users' ? <UsersList users={customerUsers} reviewCounts={reviewCounts} adminId={admin?.uid} updatingId={updatingId} onStatus={setUserStatus} /> : <OwnersList shops={shops} updatingId={updatingId} onStatus={setShopStatus} />}</View></ScrollView>;
}

function UsersList({ users, reviewCounts, adminId, updatingId, onStatus }: { users: AdminUser[]; reviewCounts: Record<string, number>; adminId?: string; updatingId: string | null; onStatus: (account: AdminUser, status: 'active' | 'suspended') => void }) { return <View className="gap-3"><Text className="text-xl font-bold">Registered Users</Text>{users.map((account) => { const status = account.status ?? 'active'; const initials = (account.name || account.email || 'U').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase(); return <Card key={account.id}><CardHeader className="gap-3"><View className="flex-row items-start gap-3"><View className="h-10 w-10 items-center justify-center rounded-full bg-secondary"><Text className="font-bold">{initials}</Text></View><View className="flex-1"><CardTitle>{account.name || 'Unnamed user'}</CardTitle><Text className="text-sm text-muted-foreground">{account.email}</Text></View><Badge className={status === 'active' ? 'border-transparent bg-green-100' : 'border-transparent bg-red-100'} variant="secondary"><Text className={status === 'active' ? 'text-green-800' : 'text-red-700'}>{status}</Text></Badge></View><Text className="text-sm text-muted-foreground">Joined {account.createdAt ? dayjs(account.createdAt.toDate()).format('MMM D, YYYY') : 'recently'} · {reviewCounts[account.id] ?? 0} reviews</Text><View className="flex-row gap-2"><Button className="flex-1" size="sm" variant="outline" disabled={account.id === adminId} loading={updatingId === account.id} loadingLabel="Updating…" onPress={() => onStatus(account, status === 'active' ? 'suspended' : 'active')}><Text>{status === 'active' ? 'Suspend Account' : 'Reactivate Account'}</Text></Button><Button className="flex-1" size="sm" variant="outline" onPress={() => Alert.alert(account.name || 'Account', account.email || 'No email address available.')}><Text>View Account</Text></Button></View></CardHeader></Card>; })}{users.length === 0 ? <Text className="text-muted-foreground">No customer accounts yet.</Text> : null}</View>; }

function OwnersList({ shops, updatingId, onStatus }: { shops: Shop[]; updatingId: string | null; onStatus: (shop: Shop, status: 'approved' | 'rejected') => void }) { return <View className="gap-3"><Text className="text-xl font-bold">Owner Accounts</Text>{shops.map((shop) => <Pressable key={shop.id} onPress={() => shop.status === 'pending' && router.push({ pathname: '/(admin)/listing/[id]', params: { id: shop.id } })}><Card className={shop.status === 'pending' ? 'border-l-4 border-l-amber-500' : undefined}><CardHeader className="gap-3"><View className="flex-row items-start justify-between gap-3"><View className="flex-1"><View className="flex-row items-center gap-2"><Icon as={Coffee} size={17} className="text-accent" /><CardTitle>{shop.name}</CardTitle></View><Text className="text-sm text-muted-foreground">Registered listing</Text></View><Badge className={shop.status === 'approved' ? 'border-transparent bg-green-100' : shop.status === 'pending' ? 'border-transparent bg-amber-100' : 'border-transparent bg-red-100'} variant="secondary"><Text className={shop.status === 'approved' ? 'text-green-800' : shop.status === 'pending' ? 'text-amber-800' : 'text-red-700'}>{shop.status}</Text></Badge></View>{shop.status === 'approved' ? <Button variant="outline" className="border-destructive" loading={updatingId === shop.id} loadingLabel="Updating…" onPress={() => onStatus(shop, 'rejected')}><Text className="text-destructive">Revoke Listing</Text></Button> : null}{shop.status === 'pending' ? <View className="flex-row gap-2"><Button className="flex-1 bg-green-700" loading={updatingId === shop.id} loadingLabel="Updating…" onPress={() => onStatus(shop, 'approved')}><Icon as={Check} size={16} className="text-white" /><Text>Approve Listing</Text></Button><Button className="flex-1" variant="destructive" loading={updatingId === shop.id} loadingLabel="Updating…" onPress={() => onStatus(shop, 'rejected')}><Icon as={X} size={16} className="text-destructive-foreground" /><Text>Reject</Text></Button></View> : null}</CardHeader></Card></Pressable>)}{shops.length === 0 ? <Text className="text-muted-foreground">No owner listings yet.</Text> : null}</View>; }

async function writeUserStatus(uid: string, status: 'active' | 'suspended') { const batch = writeBatch(db); batch.update(doc(db, 'users', uid), { status }); await batch.commit(); }
async function writeShopStatus(shop: Shop, status: 'approved' | 'rejected') { const batch = writeBatch(db); batch.update(doc(db, 'shops', shop.id), { status }); batch.set(doc(collection(db, 'users', shop.ownerId, 'notifications')), { type: status === 'approved' ? 'listing_approved' : 'listing_rejected', message: `${shop.name} was ${status}.`, shopId: shop.id, read: false, createdAt: serverTimestamp() }); await batch.commit(); }
