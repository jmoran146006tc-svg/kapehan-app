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
