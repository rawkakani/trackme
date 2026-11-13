![TrackMe cover](assets/cover.svg?v=2)

TrackMe is a service-delivery tracking layer: create orders via API, give customers a live tracking link, and let technicians work through a day queue with status updates.

## 💡 Why we're building this

[Frogfoot](https://www.frogfoot.co.za/) missed my installation four times in a row. 😤

The service was so bad that I assumed it was a one-man operation. It isn't, which makes it worse. They have a sister company, [Vox](https://www.vox.co.za/), and still haven't learned. 🤦

---

### 🎯 The real problem

The biggest problem isn't that the technicians didn't show up. It's that they told me they would, and didn't. 🚫

Life happens. When it does, they should call and say they can't make it. Instead, they skip the appointment and phone the next day: "Oh, by the way…"

They told me they were outside when I was outside the whole time. 🙃 They said they called, but my phone and WhatsApp show no missed calls. 📵 To find out where anyone was, I had to call again and again. The number was unavailable most of the time. It felt like 90% of the time, and I only got through after four or five attempts.

I stayed home 🏠 because they said they were coming, and that kept me from everything else I needed to do. If I had known they weren't coming, I would have carried on with my day.

---

### 📅 The booking and communication failures

I was booked for 12:00 and nobody came at 12:00. 🕛 When I called, I learned that 12:00 was only a *window* in which a technician might arrive.

1. I was booked for 12:00.
2. The technician had other customers in the same slot.
3. The technician was unreachable, so I couldn't tell where they were.
4. They never arrived.

They can't blame their systems, because they sent me SMS messages. 💬 One said the technician was coming. Another said the technician was on site. I went outside and nobody was there. 👀 I called and couldn't get through. An hour later someone answered and told me, "Oh, this is what that means."

They didn't show up that day. The next day they called, shocked, to ask whether their technician had come. *How do they not know whether their own technician showed up?*

Then they didn't show up again. After repeated calls and repeated rescheduling, all I got was an email: "We have rescheduled." By the fourth time, they expected me to be calm. 😑

---

### ✅ What could have resolved this

What would have resolved this is **effective communication**:

- 👥 Show me who is ahead of me and how far away the technician is.
- 🗺️ Show me when the technician picks up orders and where they are on the route.
- 🚗 Show me when they are on their way, so I can plan my day around it.
- ⭐ Let me pay extra for priority so I'm first in line. I rarely would, but here I would have.

I just need something I can look at to know where things stand. Instead I couldn't reach them, and even the internet service provider couldn't reach them. What system do they have over there, and why hasn't this been solved?

**So let's build it.** 🚀

## 🔍 Problems observed

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

If you don't adopt this afterwards, then I wish you all the best with [ICASA](https://www.icasa.org.za/). 😉

## 📦 What TrackMe solves (MVP)

- **Create Order API:** integrators create orders (customer, address, technician/handled-by, appointment) and receive `orderId` + customer `trackingUrl` (and `technicianUrl` on first issue).
- **Customer tracking:** queue position, booked count, ETA, and live state (waiting / your turn with distance / on site / done / unable or cancelled with reason).
- **Technician flow:** day task list, task details (contact/directions/notes), actions (Start → Arrived → Done / Can’t complete with reason), and location updates while en route.
- **Live updates:** tracking and technician views update via SSE when status/queue changes.

## 🛠️ Setup

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
- [`FOUNDATION.md`](FOUNDATION.md) — product foundation, roadmap, MVP scope
- [`IMPLEMENTATION_PLAN.md`](IMPLEMENTATION_PLAN.md) — implementation plan
- [`openapi.yaml`](openapi.yaml) — API contract (also served at `/v1/openapi.yaml` when running)

