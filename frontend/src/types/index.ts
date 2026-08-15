import { IconType } from "react-icons";

// ─── Navigation ──────────────────────────────────────────────────────────────

export interface NavLink {
  label: string;
  href: string;
}

// ─── Hero ────────────────────────────────────────────────────────────────────

export interface HeroSlide {
  id: number;
  tag: string;
  title: string;
  slug: string;
  subtitle: string;
  desc: string;
  date: string;
  venue: string;
  price: string;
  badge: string;
  gradient: string;
  accent: string;
  img: string;
}

// ─── Categories ──────────────────────────────────────────────────────────────

export interface Category {
  icon: IconType;
  label: string;
  count: string;
  color: string;
}

// ─── Events ──────────────────────────────────────────────────────────────────

export interface Event {
  id: number;
  title: string;
  slug: string;
  category: string;
  date: string;
  venue: string;
  city: string;
  price: string;
  originalPrice: string | null;
  rating: number;
  reviews: number;
  image: string;
  tag: string;
  tagColor: string;
  interested: string;
}

// ─── Artists ─────────────────────────────────────────────────────────────────

export interface Artist {
  id: number;
  name: string;
  genre: string;
  upcoming: number;
  followers: string;
  image: string;
}

// ─── Cities ──────────────────────────────────────────────────────────────────

export interface City {
  name: string;
  events: number;
  img: string;
}

// ─── Stats ───────────────────────────────────────────────────────────────────

export interface Stat {
  icon: IconType;
  value: string;
  label: string;
}

// ─── Features ────────────────────────────────────────────────────────────────

export interface Feature {
  icon: IconType;
  title: string;
  desc: string;
  color: string;
}

// ─── Event Card ──────────────────────────────────────────────────────────────

export interface BrowseEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  date: string;
  venue: string;
  city: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  totalReviews: number;
  interested: string;
  image: string;
  tag: string;
  tagColor: string;
  isLive?: boolean;
  isSoldOut?: boolean;
  duration?: string;
  ageRestriction?: string;
  startDate: string;
  venueName: string;
  basePrice: number;
}

// ─── Event Section ───────────────────────────────────────────────────────────

export interface EventSection {
  id: string;
  label: string;           // display name e.g. "Live Right Now"
  emoji: string;
  accentColor: string;     // hex for glow / highlights
  events: BrowseEvent[];
}

// ─── Filter ──────────────────────────────────────────────────────────────────

export interface FilterState {
  city: string;
  date: string;
  priceRange: [number, number];
  categories: string[];
  sort: "trending" | "date" | "price_asc" | "price_desc" | "rating";
}

// ─── Footer ──────────────────────────────────────────────────────────────────

export type FooterLinks = Record<string, string[]>;

export interface SocialLink {
  icon: IconType;
  href: string;
  label: string;
}

// ─── Shared Component Props ──────────────────────────────────────────────────

export interface SectionHeaderProps {
  tag?: string;
  title: string;
  subtitle?: string;
  cta?: string;
  onCtaClick?: () => void;
}


export interface CloudinaryImage {
  secure_url: string;
  public_id: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  phone?: string;
}

export interface AuthContextType {
  user: User | null;
  logout: () => void;
  login: (email: string, password: string) => Promise<void>;
  isLoading: boolean;
}

// ─── Event Detail ─────────────────────────────────────────────────────────

export type TicketTier = {
  id: string;
  name: string;          // e.g. "General Admission", "VIP", "Platinum"
  price: number;
  originalPrice?: number;
  available: number;
  total: number;
  perks: string[];
  color: string;
};

export type EventArtist = {
  id: string;
  name: string;
  role: string;          // e.g. "Headliner", "Support Act"
  genre: string;
  image: string;
  followers: string;
  socialHandle?: string;
};

export type EventGalleryImage = {
  id: string;
  url: string;
  alt: string;
};

export type ReviewUser = {
  name: string;
  avatar: string;
  location: string;
};

export type EventReview = {
  id: string;
  user: ReviewUser;
  rating: number;
  date: string;
  title: string;
  body: string;
  helpful: number;
  verified: boolean;
};

export type FAQItem = {
  question: string;
  answer: string;
};

export type EventDetail = {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  category: string;
  subcategory: string;
  tags: string[];

  // Media
  coverImage: string;
  bannerVideo?: string;
  gallery: EventGalleryImage[];

  // Timing
  startDate: string;        // ISO string
  endDate: string;
  doorsOpen: string;        // e.g. "6:00 PM"
  showStart: string;        // e.g. "7:30 PM"
  duration: string;         // e.g. "3 hrs"
  ageRestriction: string;   // e.g. "18+"

  // Venue
  venueName: string;
  venueAddress: string;
  venueCity: string;
  venueState: string;
  venueCapacity: number;
  venueMapUrl: string;
  venueLat: number;
  venueLng: number;

  // Ticketing
  ticketTiers?: TicketTier[];
  basePrice?: number;
  tickets?: { price: number }[];
  hasSeatSelection: boolean;
  bookingFee: number;       // flat fee in ₹
  gstPercent: number;

  // Engagement
  rating: number;
  totalReviews: number;
  interestedCount: number;
  goingCount: number;

  // Artists
  artists: EventArtist[];

  // Content
  reviews: EventReview[];
  faqs: FAQItem[];

  // Meta
  organizer: string;
  organizerLogo: string;
  language: string;
  isRefundable: boolean;
  refundPolicy: string;
  status: "upcoming" | "live" | "soldout" | "cancelled";
  featured: boolean;
  tag: string;
  tagColor: string;
};

// ─── Booking Flow ─────────────────────────────────────────────────────────

export type SelectedTicket = {
  tier: TicketTier;
  quantity: number;
};

export type BookingStep = "select" | "login_gate" | "details" | "payment" | "confirm";

export type BookingState = {
  step: BookingStep;
  selectedTickets: SelectedTicket[];
  intentStep: BookingStep | null;   // step user was trying to reach before login
};