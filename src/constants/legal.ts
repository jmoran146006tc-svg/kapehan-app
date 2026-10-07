const CONTACT_EMAIL = 'moranjoshua102@gmail.com';
const DPO_NAME = 'TRISHA MAE LLANO';
const EFFECTIVE_DATE = 'October 10, 2026';

export const TERMS_TEXT = `TERMS AND CONDITIONS
Effective ${EFFECTIVE_DATE}

Please read these Terms before creating a Kapehan account. By ticking the box and creating an account, you agree to them.

1. ABOUT KAPEHAN
Kapehan is a mobile and web application that helps people discover, filter, compare, and review coffee shops in Tagum City. It was developed by Kenneth Gano, Trisha Mae Llano, Joshua Miguel Moran, and Kryztel Kate Valdez as a project for CCE106 (Application Development and Emerging Technologies) at UM Tagum College. Kapehan does not take reservations or process payments.

2. YOUR ACCOUNT
2.1 You must provide accurate information and keep your password confidential. You are responsible for activity under your account.
2.2 You choose to register as a Customer or a Coffee Shop Owner. Administrator accounts are created only by the Kapehan team.
2.3 You must be at least 18 years old, or have the consent of a parent or guardian, to use Kapehan.
2.4 You may keep only one account per email address.

3. CUSTOMERS
3.1 Customers can browse and compare shops, save favorites, set search preferences, and post one review per shop. You may edit your review later; the app shows that it was edited.
3.2 Reviews must reflect your own honest experience. Do not post reviews for a shop you own, work for, or compete with, and do not post fake, paid, or coordinated reviews.

4. COFFEE SHOP OWNERS
4.1 Owners may submit and maintain listings for shops they own or are authorized to represent. You confirm that the information and photos you submit are accurate and that you have the right to use them.
4.2 New and edited listings are reviewed by an administrator. A listing becomes visible to customers only when approved, and saving changes to a listing sends it back for review.
4.3 Owners may reply to reviews about their shop. Replies must be respectful and must not disclose personal information about reviewers.
4.4 An owner may request removal of a listing. An administrator decides on the request.

5. CONTENT RULES
You may not post content that is unlawful, defamatory, hateful, harassing, sexually explicit, misleading, or that infringes someone else's rights; that contains another person's personal information; or that is spam or advertising unrelated to coffee shops. Do not attempt to access data or features that are not meant for your role, interfere with the service, or probe its security.

6. YOUR CONTENT
You keep ownership of what you post (reviews, replies, photos, listing details). By posting, you give the Kapehan team a non-exclusive, royalty-free permission to store, display, and process it within the app for as long as it is on the service, and for the purposes of this school project.

7. MODERATION, SUSPENSION, AND REMOVAL
Administrators may approve, reject, revoke, or archive listings, and may suspend accounts that break these Terms. We may remove content that violates these Terms. We may also correct or remove inaccurate listing information.

8. ACCURACY OF INFORMATION
Shop details (hours, prices, menus, WiFi, tags, locations) are provided by shop owners and the Kapehan team and may be incomplete or out of date. Some shop information and starting ratings were compiled from public sources, including Google Maps ratings, and may differ from current conditions. Please confirm important details with the shop before you visit. Ratings and reviews are opinions of users and are not endorsed by Kapehan.

9. LOCATION
If you allow location access, Kapehan uses your device location to show distances and nearby shops. You can turn this off in your device settings; the app will still work without it.

10. THIRD-PARTY SERVICES
Kapehan relies on third-party services, including Google Firebase (authentication and database), Cloudinary (image hosting), map providers (Google Maps on Android, OpenStreetMap on the web), and Expo (app delivery). Their availability and terms are outside our control, and interruptions may affect the app.

11. AVAILABILITY AND CHANGES
Kapehan is provided "as is" and "as available". It is a student project, and we do not guarantee uninterrupted or error-free service. We may change, suspend, or discontinue features at any time. We may update these Terms; continued use after an update means you accept the updated Terms.

12. LIMITATION OF LIABILITY
To the extent allowed by Philippine law, the Kapehan team is not liable for losses arising from your use of the app, from inaccurate shop information, from user-generated content, or from third-party services. Nothing in these Terms limits liability that cannot be limited by law or any right you have under the Data Privacy Act of 2012.

13. ENDING YOUR ACCOUNT
You may stop using Kapehan at any time and may ask us to delete your account by contacting us (see Section 14). We may suspend or end accounts that violate these Terms.

14. GOVERNING LAW AND CONTACT
These Terms are governed by the laws of the Republic of the Philippines. Questions or concerns: ${CONTACT_EMAIL}.`;

export const PRIVACY_TEXT = `DATA PRIVACY NOTICE
Effective ${EFFECTIVE_DATE}

This notice explains how Kapehan collects and uses your personal information, in line with the Data Privacy Act of 2012 (Republic Act No. 10173) and its Implementing Rules and Regulations.

1. WHO WE ARE
The Kapehan project team (Kenneth Gano, Trisha Mae Llano, Joshua Miguel Moran, and Kryztel Kate Valdez, UM Tagum College) is the personal information controller. Data protection contact: ${DPO_NAME}, ${CONTACT_EMAIL}.

2. WHAT WE COLLECT
- Account information: your name, email address, role (customer or owner), and password. Your password is handled by Firebase Authentication; we cannot see it, and it is not stored in our database.
- Account activity: the date you joined, your account status, and your number of reviews and shop visits.
- Preferences and lists: your search preferences (WiFi, price, features, open-now), your saved (favorite) shops, and up to 20 recently viewed shops.
- Reviews and replies: your name as shown on the review, your star rating, your written comment, and the time you posted or edited it. Owners' replies are also stored.
- Notifications: in-app messages about listing approvals, review replies, and updates to your favorite shops.
- Device location: only if you allow it. It is used on your device to compute distances to shops. Kapehan does not save your location to its database. Owners can enter a shop's coordinates, which are stored as part of the listing.
- Owner content: listing details, shop photos, and menu items you submit.
- Technical data: our service providers may process basic technical data (such as IP address and device type) when you connect to the app.

3. WHY WE USE IT
- To create and secure your account and apply role-based access.
- To show shops, filters, comparisons, distances, favorites, and your recently viewed list.
- To display reviews and ratings, compute shop averages, and send you related notifications.
- To let owners manage listings and administrators review listings and manage accounts.
- To keep the service safe, investigate abuse, and fix problems.
We do not sell your personal information and we do not use it for advertising.

4. LEGAL BASIS
We process your information based on your consent, given when you tick the agreement box at registration, and to provide the features you request. You can withdraw consent by asking us to delete your account (see Section 9).

5. WHO CAN SEE YOUR INFORMATION
- Other users and the public: your review (with your name and rating), and, for owners, the published listing details. Reviews are visible to anyone using the app.
- Shop owners: reviews written about their shops, and notifications tied to reviews.
- Administrators: account details (name, email, role, status, join date, review count) and listing content, for moderation.
- Your own data (preferences, favorites, history, notifications) is visible to you and, where needed for moderation, to administrators. Firestore security rules restrict other users from reading it.

6. SERVICE PROVIDERS AND DATA TRANSFERS
We use these providers to run Kapehan, and your information may be processed on their servers outside the Philippines: Google Firebase (Authentication and Cloud Firestore), Cloudinary (storage and delivery of listing and menu photos), Google Maps and OpenStreetMap (map display), and Expo (app updates and delivery). They are expected to protect data under their own security and privacy terms. Data is sent over encrypted connections (HTTPS/TLS).

7. HOW LONG WE KEEP IT
We keep your information while your account is active and as needed to run the project. When you ask us to delete your account, we remove your profile, notifications, favorites, history, and your reviews, and we recalculate the affected shop ratings. Backups and provider logs may keep copies for a short additional period. When the school project ends, the team may delete or archive the data.

8. HOW WE PROTECT IT
We use Firebase Authentication, role-based Firestore security rules, encrypted transmission, restricted administrator access, and review of changes before release. No system is completely secure, so please use a strong, unique password. If a data breach affects you, we will notify you and the National Privacy Commission as required by law.

9. YOUR RIGHTS
Under the Data Privacy Act, you have the right to:
- be informed about how your data is processed;
- access the personal data we hold about you;
- object to processing or withdraw your consent;
- correct inaccurate data (you can edit your name, preferences, and reviews in the app);
- request erasure or blocking of your data;
- data portability, where applicable;
- claim damages if you were harmed by inaccurate, unlawfully obtained, or unauthorized use of your data;
- lodge a complaint with the National Privacy Commission (www.privacy.gov.ph).
To use these rights, email ${CONTACT_EMAIL} from the address registered to your account. We will respond within a reasonable time.

10. CHILDREN
Kapehan is not intended for children under 18 without the consent of a parent or guardian. If you believe a minor has registered without consent, contact us and we will remove the account.

11. CHANGES TO THIS NOTICE
We may update this notice. If the changes are significant, we will tell you in the app. Continued use after an update means you accept it.

12. CONTACT
${DPO_NAME}
${CONTACT_EMAIL}`;
