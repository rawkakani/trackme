# SD (Service Delivery) — Base Foundation, Roadmap, MVP & Initial Plan

> Captured from product direction as stated. This document reflects what was specified to be built.

## 1. Base foundation (as specified)

### Core concept
- Two interfaces are needed (form still being debated: bot vs. physical interface) in the age of LLMs/AIs/chatbots.
- **Client interface:** a status update interface.
  - Simple page showing: appointment booked today at this time, and your place/line in the order.
  - Essentially a status/tracking update (like tracking a delivery).
- **Core screen / interaction:** a standalone chat interface.
  - Technician uses a simple chat interface to send updates of what they are doing for that day.
  - Updates can be sent as a voice note, or by tapping something on the screen (e.g. “met XYZ”), and the system handles the rest.
  - When things change, it updates the person’s/user’s base/view.

### Service approach
- **API-first service layer.**
  - Can be integrated into other services so it can be triggered via API.
  - Can be plugged into whatever system is needed and send messages to whoever needs to receive them.
- **Order creation:** will be done via the chat interface (e.g. “create order” button) in the future; for now focus is **API only**.

### Core entities / identifiers (as stated)
- **Customer:** number and email (order accepts number and email).
- **Technician:** handles orders; identified/organized by technician (email or number). A technician can receive multiple different orders/emails which will then be organized correctly.
- **Manager:** manages technician(s); uniquely identified by email for now. Manager receives notification/config in order creation.
- **External provider (e.g. ISP / sales consultant):** email (and number as applicable); also receives notifications to keep track of orders.
- **Primary identifiers (for now):** uniquely identified by email for manager and for customer; second/secondary primary ID can be cell phone number; email for sales consultant/technician person at ISP.

### Order creation & notifications (API)
- **Create Order API** (needed now).
  - Creates an order and handles organizing.
  - Order includes customer (number, email) and “handled by” (technician).
  - Organizes/orders by technician (technician identified by email or their number).
- **On order creation:** send notification to the user/customer because the order accepts a number and an email.
  - Notification includes a link to the interface where they can view things.
- **External provider part:** send a notification to the other provider so they can keep track; they keep track of all of their orders on a similar status page.
- **Manager:** same status/tracking context sent to the manager of that technician so they can track what everybody is doing. Order creation includes a field to add the manager’s notification.

### Access / views (by role)
All share a core tracking/status concept; default is a **list of deliveries/orders**, filtered by access role.

- **Consumer/Customer**
  - Knows: what time is their order, what order/position they are in that list, and most likely time/estimated time of arrival.
  - Can view how many people were booked in that day and where they are in that order.
  - Main reason for seeing the list: to see who is before them and who is after them that day, but **without** seeing details of who those others are (sees only that they are e.g. 3rd in the list).
  - Can pay to bump themselves up on the list / book priority to be first in the list of orders.
  - When it is **not** their turn: a screen with queue number, estimated time of arrival, and a “bump yourself up” button.
  - When it **is** their turn: see the time and how far the person (technician) is from them.
  - Link to interface sent on day of booking or when sent (could be for following week or day after).

- **Technician**
  - Gets a list of things to do (task list) for the day.
  - Can tick tasks when done; can tap/send update (including voice note) indicating completion (e.g. met XYZ) and system handles the rest.
  - When working on the next person: click on them and view the information of the person and directions/location and contact details needed.
  - Task list they go through.

- **Manager**
  - Management view tied by their email.
  - Sees the name of their technician(s) they manage and a list/view of it.
  - When opened, able to see everyone they manage.
  - Can see everyone that needs to be worked on that day for all technicians they are managing.
  - Access: able to reschedule things on behalf of the technician.

- **External provider / Internet Service Provider (ISP) (sales consultant/person)**
  - Another management/overview view.
  - Similar view to see how all their orders are going.
  - Less interaction: access is **viewing only** (overview of what’s going on).

### Scheduling & priority
- Customer can pay for delivery/priority to be first in the list of orders (bump up).
- “Bump yourself up”: puts you first in the list after you’ve paid.
- Manager can reschedule on behalf of the technician.

---

## 2. Roadmap (everything specified)

### Interfaces & interaction
- [ ] Decide/refine interface form: bot vs. physical interface (debated).
- [ ] Client-facing status update interface (delivery-tracking-style status page).
- [ ] Standalone chat interface (core screen) for technician updates (text/voice note/tap actions).
- [ ] Chat-interface-driven actions (e.g. create order button) in addition to API.
- [ ] Updates/changes reflected in the user’s base/view in real time/as they happen.

### API & integrations
- [ ] API-first service layer for integration into external systems and triggering via API.
- [ ] Plug into any system and send messages to required recipients.
- [ ] **Create Order API** (MVP focus): accepts customer number and email, handled-by technician, manager notification, external provider details; organizes by technician.
- [ ] Additional APIs as needed beyond order creation (future).

### Notifications
- [ ] Notify customer on order creation (number and email) with link to interface.
- [ ] Notify external provider/ISP to track orders (similar status page/link).
- [ ] Notify manager of technician so they can track.
- [ ] Support notification delivery channels implied (email, number/SMS/phone as applicable).

### Customer experience
- [ ] Customer status page: appointment time (today/booking), position in line/order, number booked that day.
- [ ] Show most likely time / estimated time of arrival.
- [ ] Visibility of who is before/after in the day (count/position only; no other customers’ details).
- [ ] “Bump yourself up” / pay to be first in list (priority delivery).
- [ ] State when not their turn: queue number, ETA/estimated arrival, bump-up button.
- [ ] State when it is their turn: time and how far the technician/person is from them.
- [ ] Ability to book/pay for priority to move up the list.

### Technician experience
- [ ] Task/list of deliveries for the day.
- [ ] Mark/tick tasks when done.
- [ ] Click task to view person’s information, directions/location, and contact details.
- [ ] Send updates via chat interface (voice note or tap/action like “met XYZ”) with system handling updates.
- [ ] Start/navigation/location context when working on next person (“start a location…” as stated).

### Manager experience
- [ ] Management view tied/uniquely identified by manager email.
- [ ] View technician(s) managed and their lists.
- [ ] See everyone to be worked on that day across all managed technicians.
- [ ] Reschedule on behalf of technician.
- [ ] Receive manager notifications (configured/added in order creation).

### External provider / ISP experience
- [ ] Overview/management-style view of all their orders (similar status page).
- [ ] View-only access (less interaction).
- [ ] Track orders via notifications/link.

### Identity & data model extensions
- [ ] Unique identification by email for manager and customer (current).
- [ ] Secondary ID: customer cell phone number.
- [ ] Email for sales consultant/technician person at ISP.
- [ ] Manager notification field in order creation.
- [ ] External provider fields (email, number) in order creation.

### Later / roadmap (explicitly deferred beyond MVP focus)
- [ ] Full manager rescheduling capabilities in-product (beyond foundation).
- [ ] Full ISP/provider overview productization.
- [ ] Rich chat-interface order creation flow.
- [ ] Expanded multi-role product surfaces beyond MVP customer + technician core.

---

## 3. MVP (focus first — as specified)

**Primary goal:** solve for the customer first. Everything else discussed becomes a roadmap feature except what is needed to support this.

### MVP scope

#### 1) Create Order API
- API-only focus for creating orders now.
- Create an order that:
  - Accepts **customer number and email**.
  - Specifies **handled by** (technician).
  - Handles all organizing/ordering.
- Organize orders by technician (technician identified by their **email or number**); a technician can have multiple orders organized correctly.
- On order creation, return the order id and the customer’s tracking link (the integrator sends it; no email or SMS from SD in the MVP).

#### 2) Customer view (core)
- Customer can see:
  - How many people are booked for them/in that day (context of the day’s bookings).
  - Where they are in that order/line (queue position).
  - Queue number.
  - Estimated time of arrival / most likely time.
- **When it is not their turn:**
  - Screen with queue number and estimated time of arrival.
- **When it is their turn:**
  - See the time and **how far the technician/person is from them**.
- Customer sees position relative to others (e.g. third in list / who before and after in that day) **without** seeing details of other customers.

#### 3) Technician view (core)
- Technician gets a **list/task list** of things to do (deliveries/orders).
- Can **tick** tasks when done.
- Can **click on a task** to view:
  - Details/information of the person.
  - Directions/location to the place.
  - Contact details needed.

#### 4) Core status/tracking behavior
- One core tracking experience/screen concept with different states, filtered appropriately:
  - Default: list of deliveries/orders.
  - Consumer sees their place in line and status; technician sees actionable task list.
- When changes happen, update the person’s view/base accordingly (as supported in MVP implementation).

### Explicitly in MVP focus now
- Customer-facing status/tracking (position, count, ETA, turn state with distance).
- Technician task list (tick, view details/directions/contact).
- Create Order API and order organization by technician.
- Create Order API returns the order id and the tracking link; the integrator passes the link on (SD sends no email or SMS in the MVP).

### Deferred from MVP (roadmap)
- Manager management view, cross-technician oversight, and reschedule-on-behalf UI/flows (beyond what’s required for order data).
- ISP/external provider overview view (beyond notifications/link tracking if included later).
- Chat-interface order creation button/flow (API-only for now).
- Voice-note/chat parsing automation specifics beyond core update mechanism.
- “Bump yourself up” (pay to be first in the list). SD manages orders only; payment is handled outside SD.
- Email and SMS notifications (the integrator sends the links for now).
- Other capabilities listed in roadmap.

---

## 4. Initial plan (based on MVP)

### Phase 0 — Foundation & alignment
- [ ] Confirm MVP actors in scope: **Customer**, **Technician** (and minimal data hooks for manager/provider as needed by order payload/notifications, without full views).
- [ ] Define core domain model: Order, Technician, Customer, Booking/Day queue, Queue position, Status (not started/in progress/done/turn), ETA/most-likely time, Location/distance (for “your turn”).
- [ ] Define identifier rules for MVP: customer (email, number), technician (email or number) as “handled by”.
- [ ] Define order states and transitions (created → queued/scheduled → technician en route/active → completed; reschedule/cancel hooks if required by data model, implementation later).

### Phase 1 — API-first backend (MVP)
- [ ] Implement **Create Order API** (API-only):
  - Inputs: customer number, customer email, handled-by technician (email/number), appointment/booking time & day, location/address & contact details, and fields needed for notifications/link generation.
  - Behavior: create order, assign/organize to technician, place in that technician’s/day’s ordered list.
- [ ] Implement order/queue organization logic:
  - Compute how many booked for that technician/day.
  - Compute customer’s position/order in list.
- [ ] Implement read/status APIs for:
  - Customer status (queue number/position, total booked that day, ETA/most likely time, whether it’s their turn, distance/time-from-customer when it’s their turn).
  - Technician task list (orders assigned, status, customer details, directions/location, contact details).
- [ ] Implement task/status update API for technician actions (tick/done; mark active/current; trigger customer view updates).

### Phase 2 — Notifications & links
- [ ] On order creation, generate customer-facing link to status interface.
- [ ] Return the order id and the link in the Create Order response (no email or SMS sending in the MVP).
- [ ] Ensure links map securely to the correct order/customer view.

### Phase 3 — Customer interface (MVP)
- [ ] Build customer status/tracking page (delivery-tracking-style):
  - Show appointment/booking time, queue position, total booked that day, ETA/most likely time.
  - Show position context (before/after in that day) without exposing other customers’ details.
- [ ] **Not your turn state:** queue number, estimated time of arrival.
- [ ] **Your turn state:** show time and how far the technician/person is from the customer.
- [ ] Reflect updates/changes to the customer’s view when technician/order status changes.

### Phase 4 — Technician interface (MVP)
- [ ] Build technician task list view (list of deliveries/orders for the day).
- [ ] Allow technician to **tick** tasks when done.
- [ ] Allow technician to **click** a task to view: person’s information, directions/location to the place, contact details.
- [ ] Support marking/working on the next person so “your turn” customer view can show distance/progress as specified.

### Phase 5 — MVP hardening & handoff to roadmap
- [ ] Validate end-to-end MVP flow: create order via API → integrator shares the tracking link → customer tracks position/ETA → technician works task list/updates → customer sees turn/distance updates.
- [ ] Document API contract for Create Order and status/update endpoints.
- [ ] Capture deferred items as roadmap backlog (manager view/reschedule, ISP overview, chat-based order creation, voice/tap automation enhancements, additional interfaces).

---

## 5. Summary of immediate build focus

1. **Create Order API** (API-only) that accepts customer number + email, handled-by technician, organizes orders per technician/day.
2. **Customer status experience:** booked count + position in line, ETA/most likely time, and turn state showing time + how far technician is.
3. **Technician task list experience:** list of jobs, tick done, click for person info/directions/location/contact.
4. **Order id and tracking link returned on order creation**; the integrator sends the link. Bump-up, payments, and email/SMS sending are on the roadmap.

All other items specified are retained in the roadmap above.