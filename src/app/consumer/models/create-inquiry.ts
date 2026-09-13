export interface CreateInquiryPayload {
  eventId: string;
  studioId: string;
  consumerId: string;
  message: string;
  quotedAmount: number;
}