# Development log

## 2026-09-17 — Feature completion pass

### Completed

1. Replaced symbolic price tiers with `priceMin`/`priceMax`, derived buckets, numeric validation, price filtering, display formatting, and deterministic seed values.
2. Added hardened Firestore rules and Firebase deployment configuration. The rules protect roles, listing ownership/status, review aggregate transactions, and owner notifications without Cloud Functions.
3. Added UID-keyed reviews with atomic aggregate updates, edit-in-place customer review UI, and owner review visibility.
4. Added the live owner dashboard, owner notifications, user preferences, comparison navigation, recently viewed history, and shared auth/loading feedback.
5. Removed unused Expo starter-template components, hooks, styles, and assets while retaining the dialog’s native animation helper.
6. Replaced the starter README with project setup, security/seed instructions, validation commands, and Windows troubleshooting.

### Validation

| Check | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | Passed | Rechecked after form-validation and error-feedback work. |
| `npx expo lint` | Passed | Checked after adding Expo-compatible lint configuration and resolving its findings. |
| `npx expo export --platform web` | Inconclusive | Router type generation completed, but Metro stalled during static export in the OneDrive workspace. |
| Firestore rules deployment | Pending | Requires an authenticated Firebase CLI; run after the seed migration below. |

### Migration and deployment notes

- The deterministic seed migration was run against the configured demo project on 2026-09-17; owner-created legacy listings still need `priceMin` and `priceMax` before the hardened rules are deployed.
- Review deletion is deliberately denied for now because deletion must also recompute the aggregate in the same transaction. Editing an existing review is supported and preserves `avgRating`/`reviewCount`.
- After deployment, manually exercise signup/login, customer browse/search/save/review, owner listing create/edit, admin decision, notifications, history, and access-denied privilege escalation attempts with at least two accounts.

### Follow-up: validation and error feedback

- Authentication now validates required name/email/password input before making a Firebase request and turns Firebase codes into user-facing messages.
- Listing create/edit validates coordinates, PHP prices, price ordering, required text, and open-day 24-hour hours. Network/upload/save failures remain on the form as actionable feedback.
- Preferences, saved shops, shop loading, reviews, and listing decisions now surface friendly Firestore failures instead of raw SDK messages or a silent failure.

## 2026-09-25 — Bug fix and polish pass

### Completed

1. Corrected selected-tab hover colors, compare highlight borders and controls (including an accessible popover above the tab bar), rating breakdown spacing, and the owner shop page's nested scrolling.
2. Restored the original custom map pin paths from Git history and used the existing shop, selected-shop, and user color tokens on web and native maps.
3. Added admin account and listing search/status filters, owner role badges, and full listing review details (photos, hours, menu). Admin review totals now use stored aggregates instead of a collection-group listener; admin subscriptions wait for the resolved admin role.
4. Added focus blurring before owner tab navigation and dialog closing, web form semantics for login and registration, and distinct `/owner/shop/:id` routes so direct `/shop/:id` links open the customer screen.
5. Added action-result toasts, loading placeholders, empty-state illustrations, bounded authentication content, and gentle press/hover feedback.
6. Added saved-shop hours/menu notifications using client-side fan-out and shop-scoped follower records. Without Cloud Functions or a scheduler, live open/closed transitions cannot be observed; notifications are sent after an owner saves changed hours or a menu item add/edit/remove. The follower backfill script previews existing favorites by default and writes only with `--apply`.

### Validation

| Check | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | Passed | Rechecked after implementation groups. |
| `npx expo lint` | Passed | Rechecked after implementation groups. |
| `npx expo export --platform web` | Passed | Production web bundle built; Firestore debug scaffolding was absent from its JavaScript. |
| Desktop/mobile browser snapshots | Partial | Login layout and direct-link route resolution were checked in headless Chrome; authenticated admin/owner/customer interactions need real accounts. |
| Firestore rules and follower backfill | Pending | Production rules deployment and reviewed existing-favorite backfill require a project-confirmed credentialed run; the script has not written data. |

### Follow-up

- Exercise favorite notifications, admin actions, owner scrolling, compare controls, map markers, and focus transitions with signed-in accounts on desktop and native devices after deploying rules and backfilling follower records.
