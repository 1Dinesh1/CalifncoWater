# Califnco Water — Project Status
## Assignment
- Company: Califnco
- Role: Software Developer
- Deadline: 25 October 2026, 11:59 PM IST
- Budget: Strictly zero cost; free tiers only.
- Source of requirements: Califnco Round 1 Technical Assignment PDF.
## Selected Stack
- Mobile: React Native + Expo + JavaScript
- Backend: Firebase Authentication + Cloud Firestore
- Admin: React + Vite, deployed to Vercel
- Automation: Make.com first, only if free-tier requirements are met
- Primary AI editor: Antigravity
- Backup AI editor: Cursor
- Version control: Git
## Fixed Project Location
D:\CalifncoProject\CalifncoWater
## Current Setup
- Node.js: v24.13.1
- npm: 11.8.0
- Git: 2.53.0.windows.1
- Expo project created using blank template (root App.js, no Expo Router).
- Project upgraded to Expo SDK 58 to match installed Expo Go.
- Metro bundling: Verified on Android via Expo Go.
- Firebase project: `califnco-water` (Firebase Web SDK v13.1.0 initialized in `src/firebase.js`).
- Admin panel: not created yet.
- AI automation: not configured yet.
## Checkpoints
- M0-setup-ready: Committed baseline (`bb3fca1`).
- M1-catalogue: VERIFIED (implemented and manually verified on Android using Expo Go, committed as `8a06fd4`).
- M2-firebase-auth: IMPLEMENTED (NOT VERIFIED on physical Android device / pending user device testing).
  - Implemented features:
    - Customer registration (`createUserWithEmailAndPassword`) with email, password, and confirm password.
    - Customer login (`signInWithEmailAndPassword`) with email and password.
    - Real-time auth state listener (`onAuthStateChanged`) tracking signed-in customer.
    - Customer sign-out (`signOut`) with confirmation prompt.
    - Client-side validation: empty inputs, regex email format, min-6-char password length, password match check.
    - Friendly human-readable translation for Firebase auth error codes (weak password, user not found, wrong password, email in use, invalid credential, network error).
    - `AuthModal` component matching Califnco Water brand with Sign In / Register tabs, password visibility toggle, loading spinner, and keyboard handling.
    - Header in `CatalogueScreen` showing "Sign In" button when signed out, and customer avatar with email and "Sign Out" button when signed in.
    - Personalized greeting in hero banner when logged in.
    - Catalogue search, category filtering, cart stepper controls, and cart modal preserved.
  - Files created/modified:
    - `src/firebase.js`: Initialized Firebase app and exported `auth` using `getAuth(app)`.
    - `src/components/AuthModal.js`: Modal for customer sign-in and registration with validation and error alerts.
    - `src/screens/CatalogueScreen.js`: Integrated auth state listener, header sign-in/sign-out actions, and AuthModal mounting.
    - `src/components/CartModal.js`: Added customer auth context to order notes.
  - Remaining manual tests on Android (Expo Go):
    - Register a new customer account.
    - Test validation errors (empty fields, invalid email, short password, mismatched passwords).
    - Sign out and sign back in with valid credentials.
    - Verify header and hero banner update with customer email.
    - Verify catalogue and cart work seamlessly before, during, and after login.
- M3-orders-dealer: IMPLEMENTED (Customer Checkout, My Orders, Service Booking, and Dealer Application/Approval Step 1 implemented; pending manual Android device verification).
  - Implemented features:
    - Cloud Firestore integration via `src/firebase.js` exporting `db = getFirestore(app)`.
    - Cash on Delivery checkout modal in `src/components/CartModal.js`: collects customer name, phone, delivery address, validates inputs, and submits order payload with `serverTimestamp()` to `orders` collection.
    - Customer "My Orders" modal in `src/components/OrdersModal.js`:
      - Queries Firestore collection `orders` filtered strictly by `userId == auth.currentUser.uid`.
      - Client-side sort by `createdAt desc` (no composite index prerequisite).
      - Displays shortened order ID (`#...`), formatted date and time, total in INR (`formatPrice`), items list with names and quantities, order status badge (`Placed`), and payment badge (`Cash on Delivery • Pending`).
      - Loading state with `ActivityIndicator`, empty state ("No Orders Placed Yet"), and friendly error state with retry.
      - Guest state: prompts unauthenticated users to sign in with one-tap transition to `AuthModal`.
      - Pull-to-refresh (`RefreshControl`) and manual header refresh button.
      - Strict read-only enforcement (no customer update or delete actions).
    - Customer "Service Booking" modal in `src/components/ServiceBookingModal.js`:
      - Service category selection: Installation (new machine setup), Repair (leaks, motor/pump, low flow), Maintenance (filter/membrane replacement, TDS check).
      - Preferred date selection: dynamic 5-day selector pills starting from tomorrow, plus custom date entry.
      - Time slot selection: Morning (9 AM - 12 PM), Afternoon (12 PM - 3 PM), Evening (3 PM - 6 PM).
      - Contact phone number with 10-digit validation and optional customer name.
      - Full service address input with min 8-character completeness check.
      - Optional notes input for machine model and specific issue details.
      - Conforms strictly to `firestore.rules`: writes only allowed fields to `serviceBookings` collection.
      - Duplicate submission prevention: disables submit button and displays activity spinner while saving.
      - Success confirmation alert displayed only after Firestore confirms write, followed by form reset and modal dismissal.
      - Guest state: prompts unauthenticated guests to sign in with a single tap to open `AuthModal`.
    - Dealer Application & Admin Approval/Rejection (Step 1):
      - Created `src/components/DealerApplyModal.js` using the existing authenticated Firebase user.
      - Collects Business/Dealership Name (min 3 chars), Contact Mobile Phone (validated 10 digits), City/Town (min 2 chars), and optional GSTIN (validated 15 chars).
      - Stores application in `/dealers/{currentUser.uid}` with `userId`, `email`, `businessName`, `phone`, `city`, optional `gstNumber`, `status: 'pending'`, and `createdAt: serverTimestamp()`.
      - Prevents duplicate applications from overwriting an existing approved/rejected profile: checks for existing profile and displays status card (`pending`, `approved`, `rejected`) with full details.
      - Added clear entry points in `src/screens/CatalogueScreen.js`:
        - Account menu option (`Apply for Dealership` / `Dealership Status: Pending/Approved/Declined`).
        - Hero card action pill (`🏢 Dealership` / `⏳ Pending` / `🏢 Partner`).
        - Guest handling: unauthenticated guests are prompted to sign in with a single tap to `AuthModal`.
      - Added "🏢 Dealers Desk" in `admin-web`:
        - New component `admin-web/src/components/DealersTable.jsx` with search bar (by business name, email, phone, city, GST, or UID), status filter dropdown (`All`, `pending`, `approved`, `rejected`), applied dates, and responsive table layout.
        - One-click "✓ Approve" and "✕ Reject" actions updating only the `status` field in Firestore.
        - Added dealer statistics card to `StatCards.jsx` showing authorized dealer count and pending request counter.
        - Built and verified with Vite 6 (0 errors).
      - Mobile Navigation Redesign & Dedicated Account UI:
      - Implemented bottom navigation bar (`src/components/BottomNavBar.js`) with 4 tabs: 🏠 Home, 📦 My Orders, 🛠️ Services, 👤 Account (or 🔐 Sign In when logged out).
      - Home tab displays the complete product catalogue with category filter pills, search input, and cart stepper controls.
      - Top header streamlined: brand title and tagline on left, persistent cart button with item count badge on right.
      - Removed overcrowded header buttons and hero card pill clutter in favor of persistent bottom tab navigation.
      - Dedicated `AccountScreen` (`src/screens/AccountScreen.js`):
        - For signed-in users: displays user email, verified customer badge, shortened UID, dealership program status card (with status badge and action button), quick navigation links (My Orders, Book Service), customer care information, and a clearly visible, red-bordered Sign Out button with native confirmation dialog.
        - For signed-out users: displays welcoming guest banner, prominent Sign In/Register button, dealership preview, and support details.
        - Back button (`← Store`) returns user directly to the Home catalogue.
      - Android Hardware Back Handling:
        - Listens to `BackHandler` `hardwareBackPress` events.
        - Dismisses any active modal (CartModal, OrdersModal, ServiceBookingModal, DealerApplyModal, AuthModal) in precedence.
        - If on Account tab, navigates smoothly back to Home tab.
        - If on Home with no modals open, allows default Android exit behavior. Never traps the user.
      - Floating Bottom Cart Bar:
        - Positioned cleanly above the bottom navigation bar (`bottom: 58px`).
        - Product list content padding adjusts dynamically so products and controls are never obscured.
    - Security Rules in `firestore.rules` and `firestore.rules.proposed`:
      - Authenticated users can read only their own `/dealers/{uid}` document (`request.auth.uid == dealerId`).
      - Authenticated users can create only their own document (`request.auth.uid == dealerId`), strictly enforcing initial status `'pending'`, server timestamp, required fields, and field allowlist.
      - Normal users cannot update or delete `/dealers` records (prevents self-approval or profile overwrites).
      - Authorized administrators (`isAdmin()`) can read all dealer applications and update ONLY the `status` field to `['pending', 'approved', 'rejected']`.
      - Customer `orders`, `serviceBookings`, and `admins` security rules remain 100% intact.
      - Note: Local rules match the mobile payload exactly; "Missing or insufficient permissions" occurs when live Firebase Console has not yet been updated with the reviewed rules.
  - Remaining manual tests on Android (Expo Go):
    - Bottom Tabs & Navigation:
      - Launch Expo Go and verify the persistent bottom navigation bar is visible with 4 tabs.
      - Tap "My Orders" tab; verify Orders modal opens. Tap top right `✕` or Android hardware back; verify modal closes cleanly.
      - Tap "Services" tab; verify Service Booking modal opens. Tap top right `✕` or Android hardware back; verify modal closes cleanly.
      - Tap "Account" tab; verify the dedicated Account screen renders with top `← Store` back button.
      - Tap `← Store` or press Android hardware back; verify screen returns to Home.
    - Authentication Flow & Sign Out in Account Screen:
      - While logged out, navigate to Account tab; verify guest prompt with "Sign In / Register" button.
      - Tap "Sign In / Register"; sign in with valid credentials.
      - Verify Account screen re-renders showing your email, verified badge, and dealership status.
      - Tap "Sign Out of Account"; verify confirmation prompt appears. Tap "Sign Out"; verify app resets to signed-out state.
    - Orders & Checkout:
      - Add items to cart; verify header cart button badge updates.
      - Verify floating bottom cart bar appears above the bottom tab bar.
      - Tap "View Cart"; proceed to checkout and place a Cash on Delivery order.
      - Open "My Orders" from the bottom tabs or Account screen; confirm order appears at top.
    - Dealer Application & Permissions:
      - Sign in as a customer. Go to Account tab > "Apply for Dealership".
      - Fill business name, phone, city, optional GST; submit application.
      - Once rules are published in Firebase Console, verify write succeeds and status transitions to "Application Pending Review".
      - In `admin-web`, log in as admin, switch to "🏢 Dealers Desk", verify application appears, and click "✓ Approve".
      - Return to mobile Account tab; verify status card displays "Dealership Active - ✅ AUTHORIZED DEALER".
- M4-admin: IMPLEMENTED & DEPLOYED (Separate React + Vite web admin panel created in `admin-web/`, deployed on Vercel, and verified with live dealer approval).
  - Files created:
    - `admin-web/package.json`: Vite + React + Firebase Web SDK setup.
    - `admin-web/vite.config.js`: Vite configuration with React plugin.
    - `admin-web/index.html`: Responsive HTML entry point with Plus Jakarta Sans & JetBrains Mono typography.
    - `admin-web/vercel.json`: Single Page Application rewrite rules for free Vercel deployment.
    - `admin-web/README.md`: Local setup guide, deployment instructions, and security architecture documentation.
    - `admin-web/src/firebase.js`: Shared Firebase initialization using `califnco-water` web configuration.
    - `admin-web/src/index.css`: Modern, polished design system matching Califnco Water branding.
    - `admin-web/src/main.jsx`: React 18 DOM mount.
    - `admin-web/src/App.jsx`: Main dashboard container with real-time auth listener, Firestore fetching, KPI aggregation, tab switching, and safe status update handlers.
    - `admin-web/src/components/Navbar.jsx`: Brand banner, current admin email display, manual refresh button with spinner, and sign-out action.
    - `admin-web/src/components/StatCards.jsx`: 5 operational KPI metric cards (Total Orders, Gross Revenue, Orders In Progress, Service Requests, Pending Service).
    - `admin-web/src/components/OrdersTable.jsx`: Full orders table with search, status filter, expandable item breakdown, delivery/contact details, and status update selector.
    - `admin-web/src/components/BookingsTable.jsx`: Service Desk table with search, service type filter, status filter, contact/address details, machine notes, and status update selector.
    - `admin-web/src/components/AdminSetupNotice.jsx`: Admin authorization guide, 1-click UID copy, and step-by-step instructions.
    - `admin-web/src/components/LoginView.jsx`: Responsive admin login screen with email/password validation and error messaging.
    - `firestore.rules.proposed`: Proposed production-grade role-based security rules granting verified admins read/update permissions.
  - Implemented features:
    - Separate standalone web application inside `admin-web/` requiring zero modifications to the Expo mobile app.
    - Firebase Email/Password authentication for operational staff.
    - Narrowly scoped, zero-cost role-based admin authorization architecture using `admins/{uid}` in Firestore.
    - Live admin access clearly marked as pending/restricted when security rules or admin documents are not yet deployed, rather than exposing data or pretending it works.
    - Orders Desk with search, status filters, item details, customer info, and status update selector.
    - Service Desk with search, service type filters, customer address/notes, and status update selector.
    - Client-side sorting (`createdAt desc`) avoiding missing composite index errors on Firestore.
    - Safe manual data refresh with visual animation and toast notifications.
    - Free Vercel deployment readiness via `vercel.json` SPA rewrite rules.
  - Commands to run locally:
    ```bash
    cd admin-web
    npm install
    npm run dev    # Local development server at http://localhost:5173
    npm run build  # Production build to admin-web/dist
    ```
  - Free Vercel deployment steps:
    1. Import repository into Vercel Hobby account.
    2. Set Root Directory to `admin-web`.
    3. Framework preset: `Vite` (build command: `npm run build`, output directory: `dist`).
    4. Deploy.
  - Required Firebase Console & rules setup:
    1. In Firebase Console Authentication, create an admin user (e.g. `admin@califnco.com`).
    2. In Firestore Database, create collection `admins` and create a document with Document ID = admin's `UID`, containing `{ role: "admin", email: "admin@califnco.com" }`.
    3. In Firestore Rules, deploy `firestore.rules.proposed` to grant `isAdmin()` read/update access on `orders` and `serviceBookings`.
  - Security limitations:
    - Customer rules remain strictly locked: ordinary users can only read/create documents matching their own UID (`userId == auth.uid`).
    - Without an `admins/{uid}` document and deployed admin rules, queries return `permission-denied` and the dashboard stays in safe restricted mode.
    - Order/booking updates are rejected by Firestore unless authenticated as an authorized administrator.
  - Manual testing steps:
    1. Run `npm run dev` in `admin-web` and open `http://localhost:5173`.
    2. Test login with invalid credentials to verify error messaging.
    3. Sign in with an existing Firebase user account.
    4. Verify the dashboard opens, displaying KPI cards, Orders tab, Service Desk tab, and Admin Setup tab.
    5. Verify that "Admin Authorization Required / Pending" notice appears if the user is not in the `admins` collection.
    6. Switch to the Admin Authorization & Setup tab, copy your UID with the 1-click button, create the document in Firebase Console, and publish the proposed rules.
    7. Click the "Refresh" button and verify live cross-customer orders and service requests populate the tables.
    8. Test updating an order status from "placed" to "confirmed" and a service booking from "requested" to "confirmed".
- M5-automation: not started.
## Working Rules
1. Use free tools and free tiers only. Never enable billing or paid usage without explicit approval.
2. Keep all work in this project folder unless a separate folder is intentionally required.
3. Before changing files, inspect the existing code and identify intended changes.
4. Give the AI coding tool one feature at a time.
5. Review changes, run tests, and verify behavior before committing.
6. Never commit secrets, API keys, passwords, or Firebase private credentials.
7. Never use "git reset --hard" or destructive cleanup commands without discussing them first.
8. Update this file after each milestone with completed work, test results, known issues, and the next task.
9. Do not claim a feature works until it has been tested.
10. If switching AI editors, save all files, review Git status, and provide the next editor with a project handoff.
## Next Action
Proceed with Step 2 of the dealer feature: wholesale pricing that differs from customer prices, dealer bulk ordering, and dealer order history.
