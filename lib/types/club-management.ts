// Types for club management components

export interface ClubData {
  id: string;
  name: string;
  subdomain: string;
  description: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  memberCount: number;
  upcomingEvents: number;
  monthlyRevenue: number;
  activePrograms: number;
  onboardingCompleted: boolean;
}

export interface Registration {
  id: string;
  clubId: string;
  eventId: string;
  memberId: string;
  registrationDate: string;
  status: "confirmed" | "pending" | "cancelled";
  notes?: string;
  member: {
    firstName: string;
    lastName: string;
    email: string;
  };
  event: {
    title: string;
    startDate: string;
  };
}

export interface Payment {
  id: string;
  clubId: string;
  registrationId: string;
  stripePaymentIntentId?: string;
  amount: number;
  feeAmount?: number;
  paymentMethod: "card" | "cash" | "check" | "transfer";
  status: "completed" | "pending" | "failed" | "refunded";
  createdAt: string;
  registration: {
    member: {
      firstName: string;
      lastName: string;
    };
    event: {
      title: string;
    };
  };
}
