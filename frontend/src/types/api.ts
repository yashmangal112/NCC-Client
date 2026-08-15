// types/api.ts
// ─────────────────────────────────────────────────────────────────────────────
// Mirrors the exact shape your Express controllers return.
// Keep this in sync with your Prisma schema + controller selects.
// ─────────────────────────────────────────────────────────────────────────────

// ─── Shared ──────────────────────────────────────────────────────────────────

export interface Pagination {
  total:      number;
  page:       number;
  limit:      number;
  totalPages: number;
  hasMore:    boolean;
}

// ─── Event Card (used in list + sections) ────────────────────────────────────

export interface ApiEventCard {
  id:               string;
  slug:             string;
  title:            string;
  subtitle:         string | null;
  category:         string;
  startDate:        string;        // ISO string from DB
  venueName:        string | null;
  venueCity:        string | null;
  coverImage:       string | null;
  basePrice:        number;
  originalPrice:    number | null;
  tag:              string | null;
  tagColor:         string | null;
  isLive:           boolean;
  rating:           number | null;
  totalReviews:     number;
  interestedCount:  number;
  hasSeatSelection: boolean;
}

// ─── Browse Section ───────────────────────────────────────────────────────────

export interface ApiEventSection {
  id:          string;
  label:       string;
  emoji:       string;
  accentColor: string;
  events:      ApiEventCard[];
}

// ─── Ticket Tier ─────────────────────────────────────────────────────────────

export interface ApiTicketTier {
  id:            string;
  name:          string;
  price:         number;
  originalPrice: number | null;
  color:         string | null;
  totalSeats:    number;
  bookedSeats:   number;          // available = totalSeats - bookedSeats
  perks:         string[];
  sortOrder:     number;
  isActive:      boolean;
}

// ─── Event Artist ─────────────────────────────────────────────────────────────

export interface ApiEventArtist {
  id:           string;
  artistId:     string | null;
  name:         string;
  role:         string;
  genre:        string | null;
  image:        string | null;
  followers:    string | null;
  socialHandle: string | null;
  sortOrder:    number;
}

// ─── Seat (in seat map) ───────────────────────────────────────────────────────

export interface ApiSeat {
  id:         string;
  seatNumber: number;
  seatLabel:  string;
  seatType:   "VIP" | "PREMIUM" | "STANDARD" | "ECONOMY";
  isBooked:   boolean;
  isBlocked:  boolean;
  heldUntil:  string | null;
}

export interface ApiSeatRow {
  id:           string;
  rowLabel:     string;
  seatCount:    number;
  aisleSplitAt: number | null;
  seats:        ApiSeat[];
}

export interface ApiSeatSection {
  id:          string;
  sectionName: string;
  seatType:    "VIP" | "PREMIUM" | "STANDARD" | "ECONOMY";
  color:       string | null;
  priceOverride: number | null;
  sortOrder:   number;
  rows:        ApiSeatRow[];
}

// ─── Review ───────────────────────────────────────────────────────────────────

export interface ApiReview {
  id:          string;
  userName:    string;
  userAvatar:  string | null;
  location:    string | null;
  rating:      number;
  title:       string | null;
  body:        string;
  helpful:     number;
  verified:    boolean;
  createdAt:   string;
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

export interface ApiFAQ {
  id:        string;
  question:  string;
  answer:    string;
  sortOrder: number;
}

// ─── Full Event Detail ────────────────────────────────────────────────────────

export interface ApiEventDetail extends ApiEventCard {
  description:     string | null;
  longDescription: string | null;
  subcategory:     string | null;
  tags:            string[];
  gallery:         { id: string; url: string; alt: string }[];
  endDate:         string | null;
  doorsOpen:       string | null;
  showStart:       string | null;
  duration:        string | null;
  ageRestriction:  string | null;
  language:        string | null;
  venueAddress:    string | null;
  venueState:      string | null;
  venueCapacity:   number | null;
  venueMapUrl:     string | null;
  venueLat:        number | null;
  venueLng:        number | null;
  organizer:       string | null;
  organizerLogo:   string | null;
  bookingFee:      number;
  gstPercent:      number;
  isRefundable:    boolean;
  refundPolicy:    string | null;
  goingCount:      number;
  status:          "UPCOMING" | "LIVE" | "SOLDOUT" | "CANCELLED" | "COMPLETED";
  featured:        boolean;

  // Relations
  tickets:         ApiTicketTier[];
  artists:         ApiEventArtist[];
  seatSections:    ApiSeatSection[];
  reviews:         ApiReview[];
  faqs:            ApiFAQ[];
}

// ─── Events List Response ─────────────────────────────────────────────────────

export interface ApiEventsListResponse {
  events:     ApiEventCard[];
  pagination: Pagination;
}

// ─── Seats Response ───────────────────────────────────────────────────────────

export interface ApiSeatsResponse {
  eventId:  string;
  sections: ApiSeatSection[];
  summary: {
    total:     number;
    booked:    number;
    available: number;
  };
}

// ─── Filters Response ─────────────────────────────────────────────────────────

export interface ApiFiltersResponse {
  cities:     string[];
  categories: string[];
}


// -------- Payment --------------------------------

export interface ApiPaymentResponse {
  order_id: string;
  amount: number;
  currency: string;
}

export interface ApiPaymentVerifyResponse {
  ticketId: string;
}