# TrackMe (SD - Service Delivery)

TrackMe is a service-delivery tracking layer: create orders via API, give customers a live tracking link, and let technicians work through a day queue with status updates.

## Why we're building this

This project is motivated by repeated breakdowns in a real-world service delivery experience (four failed appointment attempts in a row). The core issue was not only that technicians did not arrive, but that there was no reliable communication about what was happening.

When customers are given a booking time, they reorganize their day around it. If a provider cannot meet that commitment, the minimum expectation is timely, accurate communication so the customer can plan accordingly.

## Problems observed

### 1. Missed appointments without proactive notice
- Appointments were missed multiple times.
- When delays or changes occurred, the customer was not informed in advance.
- Rescheduling often happened silently (e.g. via email) or was discovered only after the customer followed up.

### 2. Poor communication and misleading status updates
- Notifications claimed a technician was on site when no one was present.
- The provider reported calling the customer, but there were no missed calls on phone or messaging apps.
- Customers were told to be available for a specific time, but later learned the "booking" was only a general arrival window.

### 3. Lack of visibility into scheduling and progress
- Multiple customers appeared to be booked into the same slot with no transparency into queue position.
- There was no way to see where the technician was, how many stops were ahead, or whether arrival was still likely.
- The customer could not make informed decisions (wait, reschedule, or continue with their day).

### 4. Unreachable support
- Reaching the provider often required repeated calls, with many attempts going unanswered or unavailable.
- Even the upstream service provider could not reliably reach the delivery team.
- The burden of tracking down status fell entirely on the customer.

## What TrackMe solves (MVP)

- **Create Order API:** integrators create orders (customer, address, technician/handled-by, appointment) and receive `orderId` + customer `trackingUrl` (and `technicianUrl` on first issue).
- **Customer tracking:** queue position, booked count, ETA, and live state (waiting / your turn with distance / on site / done / unable or cancelled with reason).
- **Technician flow:** day task list, task details (contact/directions/notes), actions (Start → Arrived → Done / Can’t complete with reason), and location updates while en route.
- **Live updates:** tracking and technician views update via SSE when status/queue changes.

## Setup

### Prerequisites
- [Bun](https://bun.sh/) >= 1.2

### Install
```bash
bun install
```

### Build web
```bash
bun run build
```

### Create an API key
Prints the key once (store it securely; it is not shown again):
```bash
bun run key:create dev
```

### Run the API
```bash
bun run dev
```
- Default: `http://localhost:4100`
- Serves the API (`/v1/*`) and the built web app.
- SQLite DB defaults to `./data/sd.db` (created automatically).

### Create an order (example)
```bash
curl -sS -X POST http://localhost:4100/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -d '{
    "externalRef": "ISP-1001",
    "customer": {"name": "Thandi Mokoena", "email": "thandi@example.com", "phone": "+27821234567"},
    "address": {"line1": "14 Jacaranda Street", "city": "Pretoria", "location": {"lat": -25.7479, "lng": 28.2293}},
    "handledBy": {"email": "tech@example.com", "name": "Sipho Dlamini", "phone": "+27820000001"},
    "appointment": {"date": "2026-11-13", "kind": "window", "start": "2026-11-13T08:00:00+02:00", "end": "2026-11-13T12:00:00+02:00"},
    "durationMinutes": 60,
    "service": "Fibre installation"
  }'
```
Response includes `orderId`, `queue`, `trackingUrl` (and `technicianUrl` when first issued).

### Seed demo data
With the API running:
```bash
bun run seed
```
Prints customer tracking links and a technician link for a sample day.

### Configuration
Environment variables (defaults shown):
- `PORT=4100`
- `SD_PUBLIC_URL=http://localhost:4100`
- `SD_DB=./data/sd.db`
- `SD_TIMEZONE=Africa/Johannesburg`
- `SD_DEFAULT_COUNTRY=ZA`
- `SD_DAY_START=08:00`
- `SD_AVG_SPEED_KMH=30`
- `SD_ROAD_FACTOR=1.4`
- `SD_DEFAULT_TRAVEL_MIN=25`

## Docs
- `FOUNDATION.md` — product foundation, roadmap, MVP scope
- `IMPLEMENTATION_PLAN.md` — implementation plan
- `openapi.yaml` — API contract (also served at `/v1/openapi.yaml` when running)
