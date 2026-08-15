// services/eventService.ts
// ─────────────────────────────────────────────────────────────────────────────
// One function per API endpoint. Components import from here — never raw fetch.
// ─────────────────────────────────────────────────────────────────────────────

import { apiClient } from "@/lib/apiClient";
import type {
  ApiEventCard,
  ApiEventDetail,
  ApiEventSection,
  ApiEventsListResponse,
  ApiSeatsResponse,
  ApiFiltersResponse,
} from "@/types/api";

// ─── GET /events ─────────────────────────────────────────────────────────────

export interface GetEventsParams {
  city?:     string;
  category?: string;
  search?:   string;
  isLive?:   boolean;
  page?:     number;
  limit?:    number;
}

export async function getEvents(
  params: GetEventsParams = {}
): Promise<ApiEventsListResponse> {
  return apiClient.get<ApiEventsListResponse>("/events", {
    ...params,
    isLive: params.isLive !== undefined ? String(params.isLive) : undefined,
  } as Record<string, string>);
}

// ─── GET /events/sections ─────────────────────────────────────────────────────

export async function getEventSections(): Promise<ApiEventSection[]> {
  return apiClient.get<ApiEventSection[]>("/events/sections");
}

// ─── GET /events/meta/filters ─────────────────────────────────────────────────

export async function getEventFilters(): Promise<ApiFiltersResponse> {
  return apiClient.get<ApiFiltersResponse>("/events/meta/filters");
}

// ─── GET /events/:slug ────────────────────────────────────────────────────────

export async function getEventBySlug(slug: string): Promise<ApiEventDetail> {
  return apiClient.get<ApiEventDetail>(`/events/${slug}`);
}

// ─── GET /events/:slug/seats ──────────────────────────────────────────────────

export async function getEventSeats(slug: string): Promise<ApiSeatsResponse> {
  return apiClient.get<ApiSeatsResponse>(`/events/${slug}/seats`);
}