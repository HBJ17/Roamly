# Roamly — South India travel, curated

Roamly is a travel marketplace for South India built on MongoDB, Express, React and Node.
Travellers pick a city and see **only** the hotels, cabs, tour packages and intercity routes that actually serve it. They can then book one item or plan a whole trip and pay for it in one go. Local partners list inventory in their own city. An admin team approves partners, manages money flows and moderates content.

## What it does

### Travellers
- **Destination-first discovery.** Choose Chennai, and hotels, cabs and packages are all Chennai's. The navbar switcher and `?destination=` URLs keep every page scoped to that city.
- **Real availability.** Each hotel room type has a room count per night. Cabs have a fleet size per day. Intercity services have seats per departure and only run on their operating days. Packages cap the group size per departure.
- **Trip planner.** Pick a starting city, destination, dates and party size, then:
  - choose onward and return services that really run between the two cities on those days;
  - choose a hotel and room type that fit the party, and a local cab for the stay;
  - adjust an auto-generated day-by-day plan of that city's attractions;
  - book everything as one trip.
- **Checkout.** Inventory is held for 15 minutes. Pay from the Roamly wallet or online through Razorpay (UPI, card, net banking). A sandbox gateway is used when no Razorpay keys are set.
- **Paperwork.** Each paid booking gets a signed QR voucher that partners can scan, plus a PDF tax invoice with GST.
- **Cancellations.** Refunds follow the Flexible, Moderate or Strict policy tiers (admin-configurable) and go straight to the wallet.
- **Promo codes and loyalty.** Coupons can have usage limits, per-traveller limits, and be restricted to a booking type or destination. Loyalty points are earned and redeemed.
- **Reviews.** Only travellers with a completed booking can review. Ratings are multi-criteria, other travellers can vote them helpful, and partners can reply.
- **Account.** Bookings, saved listings, trip plans, wallet statement and top-up, realtime messages with partners and notifications.
- **Languages and currencies.** 11 interface languages (including Arabic RTL) and live display currency rates. Prices are charged in INR.
- **Installable PWA.** Bookings and vouchers stay viewable offline.

### Partners
- **Partner types.** Hotel Partner, Cab Operator and Tour Operator are tied to their home city and can only list inventory there. Intercity Transit partners list routes between cities.
- **Approval.** New partners start as *Pending* until an admin approves them.
- **Portal.**
  - Dashboard with earnings trend and upcoming arrivals.
  - Listing editors: room types, fleet, schedules, and package day plans built from that city's hotels and sights.
  - Bookings (each partner sees only their own lines), QR check-in, review replies and messages.
  - Earnings ledger and payout requests to a validated bank account.

### Admins
- Dashboard covering GMV, commission, GST, and top destinations.
- Partner approval and suspension, with commission set per partner.
- Traveller management, including audited wallet adjustments.
- Listing moderation, destination and attraction editor, promo codes, payout processing and review moderation.
- Platform settings: commission, GST, loyalty, payout minimum and cancellation tiers.
- A full audit trail.

## Architecture

```
client/   React 18 + Vite SPA (React Router, Leaflet, Socket.IO client)
server/   Express REST API + Socket.IO, Mongoose models, Jest/Supertest tests
          ├─ models/       Destination, Hotel (room types), Transport (local | intercity),
          │                Package, Booking (line items), Payment, WalletTransaction,
          │                AgencyTransaction, Payout, Itinerary, Review, Conversation, ...
          ├─ services/     pricing, availability, bookings, checkout, cancellation,
          │                settlement, planner, coupons, payments gateway, email, documents
          ├─ validators/   zod request schemas
          └─ seed/         six-city demo dataset (Chennai, Madurai, Kodaikanal, Thanjavur,
                           Bangalore, Kanyakumari)
```

Key rules live on the server, not just in the UI:
- A partner can only create listings in its own city. A package can only bundle a hotel from its city. A trip plan rejects any hotel, cab, attraction or route that does not belong to the chosen destination.
- Bookings are created as payment holds. They are confirmed only after a verified payment (Razorpay signature or webhook) or an atomic wallet debit.
- Availability is re-checked after a hold is saved, so two travellers cannot take the last room.

## Running locally

Prerequisite: Node 18+.

### Quickest: in-memory database (no MongoDB needed)

```bash
npm run install:all
npm run dev:api:memory     # API on :5000 with fresh demo data (first run downloads a MongoDB binary)
npm run dev:client         # http://localhost:5173
```

### With your own MongoDB

```bash
cp server/.env.example server/.env   # set MONGO_URI and JWT_SECRET
npm run seed
npm run dev:api
npm run dev:client
```

### Docker

```bash
cp .env.example .env                 # set JWT_SECRET and MONGO_ROOT_PASSWORD
npm run docker:up                    # http://localhost
npm run docker:seed                  # optional: load the demo data
```

### Demo accounts

These are loaded by the seed.

| Role | Username | Password |
|---|---|---|
| Traveller | `traveler` | `user123` |
| Admin (choose *Admin* on sign-in) | `admin` | `admin123` |
| Hotel partner, Chennai | `chennai_hotels` | `agency123` |
| Cab operator, Chennai | `chennai_cabs` | `agency123` |
| Tour operator, Chennai | `chennai_tours` | `agency123` |
| Intercity transit | `redbus_express` | `agency123` |

Every city has the same pattern: `<city>_stays` or `<city>_hotels`, `<city>_cabs` and `<city>_tours`.

## Configuration

See `server/.env.example`. Optional integrations:
- **Razorpay:** set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (test keys work), and `RAZORPAY_WEBHOOK_SECRET` for `/api/payments/webhook`. Without keys, a sandbox gateway is used outside production.
- **SMTP:** set `SMTP_HOST` and the related variables for real emails (confirmations, password resets, verification, partner approval). Without them, emails and their links are printed to the API console.

## Tests

```bash
npm test
```

The API suite runs against an in-memory MongoDB. It covers:
- authentication, including legacy Flask password hashes;
- destination scoping;
- availability and sell-out;
- payments and signature checks;
- refunds and partner settlement.

CI (`.github/workflows/ci.yml`) runs the tests and the client build on every push.
