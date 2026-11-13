# TrackMe (SD - Service Delivery)

TrackMe is a service-delivery tracking layer: create orders via API, give customers a live tracking link, and let technicians work through a day queue with status updates.

## Why we're building this

Sometimes the ability to read is a nuisance, anyhow. [Frogfoot](https://www.frogfoot.co.za/) just delivered the worst experience — a fourth time in a row.

I was genuinely so pissed off. The service was so trash that I thought it was a one-man operation. I wouldn’t have minded them falling under the trap of [ICASA](https://www.icasa.org.za/). The service was so trash that I was willing to have them succumb to the disaster of [ICASA](https://www.icasa.org.za/)’s 30% black empowerment scheme.

Then I did my research and found out they are not a one-man shop — which made it even worse. To even think about it: you have a sister company called Box. You would think you would have learned your lessons during those periods. No. Let’s just continue delivering trash to users.

Damn, you pissed me off so much over the past couple of days.

---

### The real problem

I’m going to put something together, because I realized my biggest problem isn’t that your people didn’t show up.

**The biggest problem is that you told me you were going to show up — and you didn’t.**

I understand life happens. But when life happens, *call me* and tell me that life happened and you cannot show up. Don’t just not show up and then call me the next day like, “Oh, by the way…” No.

Don’t tell me “yes, I’ll make myself available” — because I sadly need the internet at home — and then still not show up.

Then you have the audacity to tell me you were outside when I was outside the whole time. Even better: you tell me you called me, and I see no missed calls — not on my phone, not on WhatsApp. Yet you insist you called.

I have to call you over and over and over again. I have to call a number that’s unavailable most of the time (maybe I’m exaggerating, but it felt like 90% of the time — I only reached someone after 4 or 5 attempts, even after taking breaks) just to figure out where the hell your people are.

So I’ve been thinking: what in heaven’s name would help in this process?

Because it makes no sense. You tell me you’re going to show up, so I have to stay locked in my house. Because I’m locked in my house, there are things I can’t do — my life is tied down to your nuisance. If I knew you weren’t going to come, I would have continued living my life.

The best way for me to know you’re not going to come is for you to **communicate effectively** where you are and what’s going to happen.

---

### The booking and communication failures

My favorite part: you book me for 12, and you don’t show up at 12. Then I call and find out the 12:00 booking is just a *window* in which a technician might come.

Come again.

1. You booked me.
2. Your technician has other people booked in the same slot.
3. The technician is unreachable, so I can’t know where they are.
4. They just don’t show up.

What? Nah, guys. Y’all need to fix this.

And you can’t blame systems when you were sending me SMS messages. You send me an SMS to tell me you’re coming — so I think, okay, you’re serious. Then you send another saying the person is on site. I go outside: no one is on site. I call — can’t reach you. I have to call multiple times. An hour later I finally reach someone, and they say, “Oh, this is what that means.” Weird. Okay. Bye.

You don’t show up that day — who knows what happens?

The next day, you sound shocked when you ask me if your guys showed up. *How do you not know your guy did not show up?*

Then you don’t show up again. Then you’re shocked when you call me after I’ve been calling repeatedly, after repeated rescheduling — all I get is an email saying, “We have rescheduled.” On the fourth time, you expect me to be calm?

I am on a streak where I have to put this on social media. So this is going on social media. I’m going to call it trash on social media. Lucky for you, I’m a nobody with zero influence and my voice doesn’t matter — I just need to vent, because that was the most atrocious experience. It was so bad I’ve been wishing [ICASA](https://www.icasa.org.za/) would shut you down. That’s how bad the service was.

Y’all need to pick up your socks, because what is this?

---

### What could have resolved this

What would have resolved this is **effective communication**:

- Tell me there are other people ahead of me and how far the technician is.
- Show me when the technician picks up orders and where they are in the route.
- If I want priority delivery, let me pay extra so I’m first in line. I rarely do that — but in this case, I would have.
- Let me see where you are, when you’re on your way, and how far you are, so I can plan my life around it.

I just need a good experience and something I can look at to know where things stand. But having to pick up the phone and not be able to reach you — and then the internet service provider says they can’t reach you either — come on.

What kind of system do you have over there? And what are you doing if you haven’t solved this already? I just don’t get it.

**So: let’s put something together.**

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
