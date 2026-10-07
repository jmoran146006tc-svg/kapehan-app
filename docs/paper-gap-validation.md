# Paper-gap implementation and QA — October 8, 2026

## Feature coverage and code-path review

| Feature | Files | Acceptance review |
| --- | --- | --- |
| A: name and location search | `src/utils/search.ts`, `useFilteredShops.ts`, `shop-card.tsx`, customer Search | NFD/ASCII normalization, punctuation and abbreviation expansion, all tokens matched across name/address in any order. Address-only matches show the address; name matches do not. Without a location, name matches rank first. Empty addresses work. Focused assertions covered Apokon, mixed name/address, street/barangay abbreviations, accented cafe names, punctuation, and missing tokens. |
| B: distance | `locationStore.ts`, `useUserLocation.ts`, `constants/distance.ts`, `discovery-filter-row.tsx`, Home/Search/Profile, preference schema/type | One shared in-flight permission/position request; successful location is reused for the session. Explicit taps can retry denial/error. 1/3/5/10 km options toggle or clear. Denial toasts and does not set the filter. Saved filters wait without hiding all shops. Search and distance-filtered Home keep nearest-first ordering; normal Home retains its existing rating-ranked featured list. All four existing hook callers retain the same coordinate-or-null return type. |
| C: history | `useSearchHistory.ts`, `constants/history.ts`, user type, `recentlyViewed.ts`, Search/Profile, rules | Submitted searches and result openings record normalized, case-insensitively deduplicated entries, capped at 10 and 80 characters. Typing alone does not record. Optimistic refs protect rapid edits from older snapshots. Record failures only warn; remove/clear failures toast. Recent chips rerun/remove/clear; Profile clears search history and expands from 5 to at most 20 visits. Optional fields support older documents. History snapshots do not reset unsaved preference edits. |
| D: review photos | `constants/reviews.ts`, photo picker/strip/viewer components, `shop-gallery.tsx`, review type/schema/library, customer and both owner review screens, rules | Up to 3 images, parallel uploads with partial-success handling, public-photo notice, removable thumbnails, submission disabled while uploading, persisted empty arrays on edits. A stable serialized snapshot of the author's own content/version controls form resets, so unrelated reviews/replies do not erase drafts. Shared viewer keeps paging, contain-fit images, counter, close control and dots; reduced motion disables its transition. Visual parity needs device/browser inspection. Admin photos are included in E. |
| E: moderation | moderation/report constants, types, schema and libraries; report/removal dialogs; `admin-reports-list.tsx`; admin dashboard/listing detail; customer/owner entry points; notification metadata; rules/tests | Self-reports blocked by UI/client/rules. Deterministic IDs block repeat submissions. Admins inspect current review content and photos, dismiss/resolve reports, confirm suspension, or remove reviews directly or from reports. Removal atomically updates shop aggregates, existing profile counts and the notification. The last removal sets average/count to zero. Sibling reports resolve separately. Missing legacy rating data produces the required repair message. |

These acceptance paths were inspected in code. They do not constitute signed-in browser, Android or iOS proof. Emulator tests validate Firestore authorization and atomic state changes independently of screen rendering.

## Rules and integrity

- `users`: optional `recentSearches` on create and owner update, list size at most 10. Admins gain only the specified one-step `reviewCount` decrement in addition to existing status changes.
- `reviews`: optional `photos`, at most 3 strings, each at most 500 characters and matching the Cloudinary HTTPS host. Only author rating/text/edit-time updates additionally allow photos. Owner replies keep their existing field restriction. Authors still cannot delete reviews.
- Admin review deletion checks the parent count and matching rating bucket. The new first shop-update branch validates a one-bucket decrement and consistent average, without allowing unrelated fields to change. Existing owner and status clauses remain intact.
- `review_removed` notification creation is the first notification branch and requires an admin plus a review that exists before, and is absent after, that same atomic write.
- `reports`: deterministic-ID, signed-in create only; self-targets and invalid schemas denied. The reporter can get their own ID (including a missing ID for duplicate checks); only admins can list. Only open reports can be resolved, and only status/resolver/time/note can change. No client deletion.
- The supplied rule snippets compiled and passed the emulator without semantic changes. No new composite indexes were added. New queries use equality filters only or a single creation-time ordering.

### Access-call analysis

For an ordinary admin removing another user's review, the write rules use approximately 10 document-access calls before caching: review delete 4 (admin profile, shop before/after, review), shop update 1 (admin profile), reviewer profile update 2 (the existing status branch and new count branch each check admin), notification 3 (admin profile and review existence before/after). Each individual write remains below 10. Explicit transaction reads have their own read authorization. The complete four-write transaction passed the emulator, including both first and last review removal. Sibling reports use a separate query and batches of at most 10 writes, each with one admin lookup before caching; a 10-write resolution batch also passed.

Shop-level rules cannot identify which review was removed: they enforce the arithmetic shape, and the delete rule binds it to the matching bucket. Trusted, out-of-band administrators could still lower aggregates without deleting a review; this is the trust assumption accepted in the brief. No server or Cloud Function was added.

## Deviations and limits

- The brief's `brgy visayan` example conflicts with its all-token rule when the stored address is only `Visayan Village`. Abbreviations expand symmetrically; `barangay` must actually occur in the name/address. No location labels are invented.
- Shared filter chips now have a 44-pixel minimum height. The existing toast provider gained a neutral `info` type for non-fatal report-resolution failures.
- The admin reports tab/metric covers the latest 100 reports, as specified. Previews fetch current content when shown, on status changes, and on pull-to-refresh; they are not continuous review listeners. Already-removed reports can be marked actioned manually after a failed sibling resolution.
- If the author profile is already missing, removal succeeds without a profile update or notification, and the UI states that no account remained to notify.
- Legacy shops without `ratingCounts` require reviewing `scripts/backfill-shop-fields.mjs` before any repair. No repair, purge, rules/index deployment, production read/write, or `.env` access was performed for this work.
- A final review removal resets `avgRating` to 0, rather than restoring an imported Google baseline. Removing a photo URL or failing a later review write does not delete the already-uploaded Cloudinary asset; retention cleanup needs an operational policy.
- Client-side history updates coordinate rapid calls within a hook; simultaneous devices remain last-write-wins. Reads toast friendly errors; non-critical automatic history-write failures only log warnings as requested.

## Device QA with customer, owner and admin accounts

1. Customer: search `apokon`, `mabini st`, a shop name, a mixed name/address query and `22.27`. Verify address rows only for address-dependent matches. Submit a search, reopen the app, change its casing and submit again; verify one newest entry, ten-entry cap, remove-one and Clear all. Visit more than five shops and toggle Show all/Show fewer in Profile.
2. Customer: deny location, tap a distance chip and confirm the explanatory toast with visible shops. Grant permission and retry; test each radius, same-chip clear, All reset and nearest-first results. Save a preferred radius, reopen Search, and verify the waiting note if location is unavailable. Switch among Home/Search/Map/Compare/detail and confirm there is only one initial permission/position request.
3. Customer: post three photos, view each full-screen, swipe/close/reopen, edit and remove/add photos. Check slow/failed uploads, fourth-photo prevention and submission blocking. In another session post a different user's review while a draft is open; the draft must remain. Compare the existing shop gallery before/after on web, Android and iOS, including reduced motion.
4. Owner: open the listing review screen, inspect review photos and add/edit a reply. Report a customer review. Customer: report the listing; repeat the same report and verify the duplicate message. Confirm own-content report buttons are hidden.
5. Admin: inspect Open/Resolved/All, current review preview, reporter identity, details and timestamps. Remove a reported review with a reason. Verify disappearance for customer and owner, new average/count/buckets, author count decrement, author notification and all sibling reports marked actioned. Remove the last review and confirm zero average/count. Repeat direct removal from listing details without a report. Confirm suspension, dismissal, listing review/revocation and Mark actioned paths.
6. On all platforms, test keyboard/dialog closing, long names/reasons, narrow screens, scrollability, photo-picker cancellation and reduced-motion settings. The 33 emulator tests cover non-admin denial and malformed writes; device checks remain necessary for permissions and upload behavior.

## Paper updates

- FR-05: supports name/address/area text matching; clarify that this is token search, not geocoding or inferred barangay membership.
- Objective 2 / FR-06: distance filter UI and saved distance preferences are implemented, with an explicit no-location fallback.
- FR-16 / Figure 5: recent searches are persisted (10), while viewed shops remain a distinct history (20 stored, 5 initially shown).
- FR-11 / Scope / Figure 5: reviews support at most 3 public photos and owner/admin display.
- Figure 1 Content Moderation / Flagged Content, Figure 5 Remove inappropriate content, Figure 11 Report feature, and TC-13 now have implementation paths and emulator evidence. TC-13 still needs a recorded device/UI execution before claiming manual acceptance.
- ERD/data dictionary: add top-level `reports`, references to reporter/target user/shop/review, report lifecycle fields, optional `users.recentSearches`, optional `reviews.photos`, `preferences.maxDistanceKm`, and notification type `review_removed`.
- Maintenance table: add report triage, separate sibling-resolution retries, legacy-rating repair, orphan-report purge, Cloudinary retention and local rules-test execution. Keep production deployments and manual tests recorded separately from build results.
- Review the supplied privacy notice before publication so it explicitly covers saved search queries, public review photos and private moderation reports. The user-provided legal wording was preserved.
