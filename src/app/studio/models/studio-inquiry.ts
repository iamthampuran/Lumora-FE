import { PaginatedResponse } from "../../shared/models/paginated-response";

export interface StudioInquiryDetail{
    inquiryId: string;
    clientName: string;
    clientAvatarUrl?: string | null;
    eventType: string;
    eventTitle: string;
    eventDate: Date;
    location: string;
    quotedAmount: number | null;
    receivedAt: Date;
}

export interface GetStudioInquiriesResponse{
    newCount: number;
    acceptedCount: number;
    confirmedCount: number;
    rejectedCount: number;
    inquiries: PaginatedResponse<StudioInquiryDetail>;
}

export interface InquiryFilter{
    eventTypes? : string[];
    fromDate?: Date;
    toDate?: Date;
    location?: string;
    minAmount?: number;
    maxAmount?: number;
}