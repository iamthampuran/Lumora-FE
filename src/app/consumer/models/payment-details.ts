export interface PaymentDetails {
  studio: PaymentStudioInfo;
  event: PaymentEventInfo;
  cost: PaymentCostBreakdown;
  upi: UpiPayment;
}

export interface PaymentStudioInfo {
  name: string;
  logoUrl?: string;
  rating: number;
  reviewCount: number;
  location: string;
  tags: string[];
}

export interface PaymentEventInfo {
  title: string;
  date: string;
  duration: number;
  location: string;
}

export interface PaymentCostBreakdown {
  serviceFee: number;
  platformFee: number;
  totalAmount: number;
}

export interface UpiPayment {
  upiId: string;
  qrCodeBase64: string;
  orderId: string;
}