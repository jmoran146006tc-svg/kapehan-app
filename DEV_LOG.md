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

## 2026-09-25 — Round 2 fixes and quality pass

### Completed

1. Deployed the current Firestore rules to `kapehan-app-4c616`; the final deployment compiled the review timestamp rules and confirmed the release. Previewed the favorite-follower backfill, created the 2 missing records, and confirmed the next preview found 0 missing records across 4 users.
2. Changed the global compare popover trigger and close controls to use a single direct pressable child, and limited background follower reconciliation to one attempt per user/shop per app session. Favorite writes now report a failed follower write instead of silently saving an incomplete favorite.
3. Centralized owner listing updates in one helper that writes only owner-editable content and always sets `status: 'pending'`. The owner rule already requires the resulting status to be pending; both edit screens show the return-to-review confirmation.
4. Gave toasts a styled opaque card and leading success/error icon inside the animation wrapper, with safe-area-aware spacing above the tab bar. Added shared async action/toast handling for preference saves and a single compare-limit constant.
5. Added a visible auth form entrance on web/native and a directional reset-password transition. Home, Search, Saved, owner, and admin shop lists now show skeletons until their first snapshots finish.
6. Preserved original review and owner-reply timestamps on edits, wrote separate `editedAt` timestamps, displayed muted edited markers in customer and owner review lists, and deployed narrow security-rule validation for the new fields.

### Validation

| Check | Result | Notes |
| --- | --- | --- |
| Firestore rules deployment | Passed | Final rules compiled and were released to `cloud.firestore` in the verified project. |
| Favorite-follower backfill | Passed | Preview 2 → applied 2 → post-apply preview 0. |
| Signed-in Firestore rules smoke test | Passed | A customer favorite created a follower; the owner could add a menu item and send a notification the customer read; a customer shop edit was denied; an owner edit became pending and appeared in an admin pending query. Temporary test data was removed and original fields restored. |
| Review/reply timestamp smoke test | Passed | A seeded customer edited a review and the owner edited its reply; both gained `editedAt` while their original posting times stayed unchanged. The original review and notification state were restored. |
| `npx tsc --noEmit` | Passed | Final workspace check. |
| `npx expo lint --no-cache` | Passed | Final uncached check with no warnings. |
| `git diff --check` | Passed | No whitespace errors. |
| Web export | Passed | `npx expo export --platform web` bundled successfully. |
| Signed-in and visual regression | Pending | The local Metro watcher failed to start; the exported site served locally, but the in-app browser twice timed out attaching to it. Browser test logins have been requested. Compare popover, toast appearance, auth motion, and viewport behavior still need a visual pass. |

## 2026-09-26 — Comparison popover web crash

- Traced the `Primitive.div failed to slot onto its children` exception to the web popover portal receiving both an overlay and content. The Radix portal uses `asChild` and requires one child. Web now portals the content directly; native retains its overlay.
- Reproduced the exact exception with the installed Radix primitive using two children, then confirmed the single-child form renders.
- Exported a temporary local comparison smoke route, opened the popover with two selected shops, and cleared the selection in the browser. The dialog appeared, closed cleanly, and the browser reported no console errors. Removed the temporary route and server afterward.

## 2026-10-07 — Auth pill, container motion, and compact tabs

- Gave the Log In/Register pill explicit layout and palette styles, equal-width pressables, and direct replacement navigation. Preserved the sliding indicator, keyboard header collapse, and hidden pill on other auth routes.
- Replaced map-preview, toast, and native dialog spring entrances with reduced-motion-aware timing. Kept the map preview mounted when selecting another shop and preserved deliberate scale pulses and marker behavior.
- Reduced tab icons to 20px with 2.25 strokes, labels to 11px/600, and pill spacing. Reserved a full-width icon slot and a 52px bar plus the bottom safe-area inset; comparison positioning still uses the measured bar height plus 16px.
- Validation: `npx tsc --noEmit`, `npx expo lint --no-cache`, and `git diff --check` passed. Source inspection did not confirm that Expo Router's `Link asChild` drops child classes; its slot handles style/class merging, so the specific native interop cause remains unverified.
- Visual QA remains pending: Metro's file watcher failed (CI mode served the HTML page, but the full web-bundle request timed out), browser automation stopped because it could not confidently identify Chrome's URL, and no Android or iOS Expo Go device was available. The temporary preview server was stopped afterward.

## 2026-10-08 — Close paper gaps (search, distance, history, review photos, moderation)

- A: added accent/punctuation/abbreviation-normalized all-token name/address search, address-match card context, name-first ranking without location, and location-aware search copy.
- B: added a shared, idempotent location store while preserving the existing hook return type; 1/3/5/10 km filters and nullable saved preference; denial feedback and a non-filtering waiting state. Distance-filtered Home retains nearest-first ordering, while default featured ordering stays rating-based. Stale permission responses cannot reapply a chip after All/reset or unmount.
- C: added optional `users.recentSearches` (10 entries, 2–80 characters), submit/result-open recording, case-insensitive promotion, remove/clear actions, a scrollable recent-search block, and Profile's expandable 5/20 visit list. Profile preference drafts no longer reset on unrelated history snapshots.
- D: added optional review `photos` (up to 3 Cloudinary HTTPS URLs), multi-selection with partial upload success, submission blocking, photo removal/edit persistence, thumbnails on all review surfaces, and the extracted full-screen gallery viewer. Form reset now depends only on the current author's identity/content/version. Gallery visual parity and physical picker behavior remain manual QA items.
- E: added top-level `reports` with deterministic one-per-reporter/target IDs, private reporter/admin access, open/dismissed/actioned lifecycle, report/removal dialogs, admin Reports tab/metric/current-content previews, suspension/resolve actions, and direct listing-detail review removal. Added `review_removed` notifications and neutral informational feedback for non-fatal sibling-resolution failures.
- Rules: added optional search-history validation, bounded Cloudinary review-photo validation, admin one-step profile-count decrement, atomic review removal/aggregate checks, linked removal notifications first in the notification OR-chain, and report schema/access/resolution rules. The supplied snippets required no semantic changes. Existing author/owner constraints remain; authors cannot delete reviews.
- Aggregate design: the shop rule validates exactly one bucket decrement, count and average; the review rule binds deletion to the matching bucket. A trusted admin could theoretically lower aggregates without deleting, as explicitly accepted by the brief. A last-review removal returns `avgRating` to 0 and does not restore an imported Google baseline. Legacy shops without `ratingCounts` are refused with the repair message; review `scripts/backfill-shop-fields.mjs` before any separately authorized repair.
- Access budget: approximately 10 uncached write-rule document accesses (review delete 4, shop update 1, profile update 2 including the existing status branch, notification 3), with each write below 10. The full four-write transaction and separate 10-write report resolution batch passed the emulator. Report resolution is never included in the removal transaction.
- No additional composite indexes: dashboard reports use only `orderBy(createdAt)` plus limit, while sibling reports use equality-only filters. `scripts/d.mjs` now previews/counts and deletes reports made by or targeting orphaned users under its unchanged apply/project guards. It was syntax-checked only, never executed against data.
- Added Firebase-12-compatible `@firebase/rules-unit-testing` 5.0.2 as the sole dev dependency, local-only emulator configuration, 33 rules tests, deployment notes, and `docs/paper-gap-validation.md` with detailed acceptance reasoning, platform QA, paper/ERD updates and limitations. No runtime dependency, server or scheduler was added.
- Deviations: the brief's `brgy visayan` example requires a stored `barangay`/`brgy` token under its explicit all-token rule; a bare `Visayan Village` address does not contain that token. The existing toast provider gained `info`, filter-chip touch targets were raised to 44 pixels, reports/previews honor the requested latest-100 window and get-on-display/refresh behavior, and absent author profiles skip notification with explicit feedback. User-supplied legal text was preserved; review its coverage of the newly stored queries/photos/reports before publication.
- `.env` was not read or modified. Expo checks disable dotenv loading. Rules/indexes were not deployed; no production data was read or changed, and no apply/yes data script was run.

### Validation

| Check | Result | Notes |
| --- | --- | --- |
| `npx tsc --noEmit` | Passed | Passed after A–E and again after the final small-screen/distance follow-ups. |
| `npx expo lint --no-cache` | Passed | Passed after A–E and again on the final workspace, with no warnings and dotenv loading disabled. |
| Search helper assertions | Passed | Name/address combinations, abbreviations, accents, punctuation, missing tokens, empty address and prototype-named tokens. |
| `npm run test:rules` | Passed | 33/33 tests on local `demo-kapehan`; includes full removal, last-review zero, separate 10-report resolution batch, malformed/unauthorized cases and existing listing/review regression paths. |
| `git diff --check` | Passed | No whitespace errors. |
| `node --check scripts/d.mjs` | Passed | Syntax only; no purge/data access performed. |
| `npx expo export --platform web` | Passed | Exported `dist` with React Compiler enabled, placeholder public configuration and dotenv disabled. Bundle validation only; no authenticated/backend or device proof. |
| Browser / Android / iOS interactive QA | Not run | No signed-in app session used; production data access prohibited. Acceptance paths inspected in source; device checklist supplied separately. |
| Production deployment / data repair | Not run | Explicitly excluded by the task. |
