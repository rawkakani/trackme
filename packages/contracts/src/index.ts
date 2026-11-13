import { z } from "zod";

export const Email = z.string().email().max(254);
export const Phone = z.string().regex(/^\+[1-9]\d{6,14}$/);
export const LatLng = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });

export const Address = z.object({
  line1: z.string().max(200),
  line2: z.string().max(200).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  location: LatLng.optional(),
  instructions: z.string().max(500).optional(),
});

export const CustomerInput = z
  .object({
    name: z.string().max(120).optional(),
    email: Email.optional(),
    phone: Phone.optional(),
  })
  .refine((v) => v.email || v.phone, { message: "email or phone required" });

export const TechnicianRef = z
  .object({
    name: z.string().max(120).optional(),
    email: Email.optional(),
    phone: Phone.optional(),
  })
  .refine((v) => v.email || v.phone, { message: "email or phone required" });

export const ManagerRef = z.object({ name: z.string().max(120).optional(), email: Email });
export const ProviderRef = z
  .object({ name: z.string().max(120).optional(), email: Email.optional(), phone: Phone.optional() })
  .refine((v) => v.email || v.phone, { message: "email or phone required" });

export const Appointment = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  kind: z.enum(["exact", "window"]),
  start: z.string().datetime({ offset: true }).optional(),
  end: z.string().datetime({ offset: true }).optional(),
});

export const OrderStatus = z.enum(["scheduled", "en_route", "on_site", "completed", "unable", "cancelled"]);

export const CreateOrderRequest = z.object({
  externalRef: z.string().max(120).optional(),
  customer: CustomerInput,
  address: Address,
  handledBy: TechnicianRef,
  appointment: Appointment,
  durationMinutes: z.number().int().min(5).max(600).default(60),
  service: z.string().max(120).optional(),
  notes: z.string().max(2000).optional(),
  manager: ManagerRef.optional(),
  provider: ProviderRef.optional(),
});

export const UpdateOrderRequest = z
  .object({
    appointment: Appointment.optional(),
    handledBy: TechnicianRef.optional(),
    durationMinutes: z.number().int().min(5).max(600).optional(),
    customer: CustomerInput.optional(),
    address: Address.optional(),
    notes: z.string().max(2000).optional(),
    reason: z.string().max(500).optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: "at least one field required" });

export const QueuePlace = z.object({
  position: z.number().int().min(1),
  total: z.number().int().min(1),
  ahead: z.number().int().min(0),
});

export const CreateOrderResponse = z.object({
  orderId: z.string(),
  externalRef: z.string().nullable().optional(),
  status: OrderStatus,
  queue: QueuePlace,
  trackingUrl: z.string(),
  technicianUrl: z.string().optional(),
});

export const TaskAction = z.object({
  type: z.enum(["start", "arrive", "complete", "unable"]),
  note: z.string().max(1000).optional(),
  location: LatLng.optional(),
});

export const LocationPing = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).optional(),
  at: z.string().datetime({ offset: true }).optional(),
});

export type TCreateOrderRequest = z.infer<typeof CreateOrderRequest>;
export type TCreateOrderResponse = z.infer<typeof CreateOrderResponse>;
export type TTaskAction = z.infer<typeof TaskAction>;
export type TLocationPing = z.infer<typeof LocationPing>;
