export interface EventDetails {
  title: string;
  category: string;
  date: string;
  location: string;
  duration: number;
  budget: number;
  specialRequirements?: string | null;
  tags: string[];
}

export interface ConsumerDetails {
  id: string;
  name: string;
  email: string;
  phone: string;
  priorBookings: number;
  tierStatus: string;
}

export interface PaymentSummary {
  serviceFee: number;
  platformFee: number;
  totalPaid: number;
  transactionStatus: string;
  transactionId?: string | null;
  paymentMethod?: string | null;
  paidAt?: string | null;
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatarUrl?: string | null;
  location?: string | null;
}

export interface InquiryData {
  inquiryId: string;
  status: 'Submitted' | 'Accepted' | 'Confirmed' | 'Rejected' | string;
  createdAt: string;
  modifiedAt?: string | null;
  quotedAmount: number;
  event: EventDetails;
  consumer: ConsumerDetails;
  payment?: PaymentSummary | null;
  teamAssignments?: TeamMember[];
}