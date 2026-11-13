# TrackMe (SD - Service Delivery)

TrackMe is a service-delivery tracking layer: create orders via API, give customers a live tracking link, and let technicians work through a day queue with status updates.

## Why we're building this

Sometimes the thing of being able to read is a nuisance, anyhow. Frog food just delivered the worst experience. A 4th time in a row.  Um, And I'm genuinely personal. I'm so pissed off. I was like, the service is so trash.  I wouldn't mind them falling under the trap of Ikasa. Now, Their service is so trash. That like, I thought there were one man operation, just dash at how trash they were that I was like, I'm willing to have you guys.  Succumb to the disaster of Ikasa's 30% black empowerment scheme. And then I wish I did my research and it turns out you guys aren't. A one man shop.  So it makes it even worse to realize just how trash your surface is. To even think about it, you have a sister company called box. You would think you would have learned your lessons during those periods.  No. Let's just continue delivering trash to users. Damn, you guys pissed me off so much over the past couple of days.  Um, And I'm going to put something together, right? Because I realized my biggest problem. Isn't that your people didn't show up?  The biggest problem is you told me you were going to show up and you didn't show up, right? I understand life happens, right? I understand life happens.  But when life happens, call me and tell me that life happened and you cannot show up. Don't just not show up and then call me the next thing, go like, oh, by the way, did you, did, did, did, what? No.  Then don't tell me you are your very. Yes, I'll make myself available because I sadly need the internet in the home. And then you still don't show up.  And then you have the audacity to tell me that you were outside when I was outside the whole time when you were telling me you were outside. No, no, even better yet, you have the guests, you tell me you called me, and I see no missed calls, not on my phone, not on my WhatsApp, and you have the audacity to tell me you called me, and I see no missed calls. I have to call you over and over and over again, and not to topic.  I have to call you and reach a number that's unavailable. 90% of the time. 90% of the time, I might be exaggerating, but I found 90% of the time because I only reached you maybe after 4 or 5 attempts. Um, After even taking breaks, to be able to get somebody on the line to figure out where the hell are your people? So yes, um, I've been thinking about, like, what, heaven's name would help me in this process?  Because it makes no sense. Right? You tell me you're gonna show up, so I have to stay locked into my house.  No, because I'm locked into my house, there's things I can't do. I can't go out, do when life is just completely tied down to your nuisance. Now, if I knew you weren't going to come, I would have continued living my life.  And the best way for me to normally they're not going to come is for you to just communicate to me effectively where you are and what's going to happen. My favorite part is you tell me over booking for 12 and you don't show up at 12. Then I call and I find out, oh, the booking at 12 is just a window of bookings that their technician would come in.  Come again. Come again. So, so, so, number one, you booked me.  Number 2 your technician has other people booked in the same slot. And I think the technician is unreachable to know where he is. Number four, He just doesn't show up.  What? Nah, guys, nah, guys. Y'all y'all need to fix your shit.  Um, and you can't blame Microsoft because you were sending me SMS. You sent me an SMS, the booking is, you see, that's what if it makes it worse. You send me an SMS to tell me.  To tell me you're coming. Right, then that makes me go, okay, you're serious with your life. Then you send me another, some of the person's on site.  I go outside, the person's not on site. Okay, and then I call, I can't reach you. I have to call you multiple times.  I can't reach you. An hour later, I call, finally, I can reach you, and they're like, 0 no, this is what this means. Huh, weird.  Okay. Bye. You don't show up on that date because who knows what happens?  The next day you look, you sound shocked when you ask me if your guys showed up. How do you not know your guy did not show up? I'm gonna explain to me how you did not know your guy did not show up.  Um, And then, You don't show up again. And then you're shocked when you call me after I've been calm. All 3 repeated it, repeated, rescheduling.  All I get is an email telling me, oh, we have rescheduled. On the 4th time, you expect me to be calm, to be calm? You know what's the saddest part?  I am currently on this streak of I have to put on social media. So this is going on social media. I am going to call you trash, all of our social media.  Lucky for you, I'm a nobody and I have 0 Influence and I, and, and, and my, and my voice does not matter in this case. I just need to vent this out because That was the most atrocious. It was fully shit.  It was so bad. I've been wishing upon you that he castle shut you down, thanks to the 30% bee coming up very soon. That's just how shit the service was.  Y'all needs to pick up your socks because what is this bullshit? Anyhow. Now to move on to what I think could have resolved this.  Which was effective communication, which was you telling me that, oh, there's a couple of other people in front of you, and this is how far the technician is, right? Like, oh, but tells me when the person is picking up a bunch of orders. And if I want priority delivery, I pay extra.  Cool. I don't ever do that. Barely, when I really, really, really need it.  Like, for example, in this case, sure, I would pay that extra delivery, so I am 1st in line. Right. Um, And I know that I'm coming, I'm being, I'm going to be served, right?  I can see where you are, I can see when you're on your way. I can see how far you are. So I can then plan my life around this.  Right? I just need a good experience and something I can look at to know where and how things are going. But having to pick up the phone and not be able to reach you, and then to top it off, try to reach.  The internet service provider and they say they can't reach you, come on guys. Come on, guys. What kind of atrocious system do you have over there?  And what are you guys doing if you have not solved this already? I just don't I just don't get it, guys. I really just don't get it.  So. Let's put something together.

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
