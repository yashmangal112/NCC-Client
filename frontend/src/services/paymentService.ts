import { apiClient } from "@/lib/apiClient";
import type {
  ApiPaymentResponse,
  ApiPaymentVerifyResponse,
} from "@/types/api";

// ─── POST /transactions/payment ──────────────────────────────────────────────

export async function createPaymentOrder(payload: {
  amount: number;
  eventId: string;
}): Promise<ApiPaymentResponse> {
  return apiClient.post<ApiPaymentResponse>("/transactions/payment", payload);
}

// ─── POST /transactions/verify ───────────────────────────────────────────────

export async function verifyPayment(payload: {
  razorpay_order_id:   string;
  razorpay_payment_id: string;
  razorpay_signature:  string;
  eventId:             string;
  quantity:            number;
  tierId?:             string;
  seats?:              string[];
  attendees?:          any[];
  phone_number?:       string;
}): Promise<ApiPaymentVerifyResponse> {
  return apiClient.post<ApiPaymentVerifyResponse>(
    "/transactions/verify",
    payload
  );
}