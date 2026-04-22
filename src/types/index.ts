import { Timestamp } from "firebase/firestore";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type TimestampLike = Timestamp | string | { seconds: number; nanoseconds: number } | any;

export type StoreStatus = "available" | "slightly_crowded" | "full" | "closed";
export type PlanType = "free" | "premium";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | null;

export interface SeatCapacity {
  counterTotal: number;
  tableTotal: number;
}

export interface SeatDetail {
  counterAvailable: number | null;
  tableAvailable: number | null;
}

export interface BusinessHours {
  open: string;
  close: string;
  holidays: string[];
}

export interface Store {
  id: string;
  name: string;
  genre: string;
  area: string;
  description: string;
  address: string;
  phone: string;
  budgetRange: string;
  systemInfo: string;
  businessHours: BusinessHours;
  images: string[];
  googleMapsEmbedUrl: string;
  googleMapsDirectionUrl: string;
  status: StoreStatus;
  seatCapacity: SeatCapacity | null;
  seatDetail: SeatDetail | null;
  statusUpdatedAt: TimestampLike | null;
  plan: PlanType;
  subscriptionStatus: SubscriptionStatus;
  ownerId: string;
  // Billing fields — only available via /api/store/me (not exposed to public Firestore reads)
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  trialEndDate?: TimestampLike | null;
  isActive: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface Coupon {
  id: string;
  storeId: string;
  title: string;
  description: string;
  isActive: boolean;
  createdAt: TimestampLike;
  updatedAt: TimestampLike;
}

export interface Admin {
  uid: string;
  email: string;
  createdAt: TimestampLike;
}

export type AreaKey =
  | "shimotori"
  | "kamitori"
  | "ginnan"
  | "shinshigai"
  | "other";

export type GenreKey =
  | "authentic"
  | "darts"
  | "girls"
  | "muscle"
  | "apparel"
  | "standing"
  | "other";
