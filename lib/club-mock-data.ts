// Mock data for club management features based on Postman collection

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

export interface Member {
  id: string;
  clubId: string;
  userId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  memberType: "individual" | "family" | "adult" | "youth";
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  membershipStartDate: string;
  membershipEndDate?: string;
  status: "active" | "inactive" | "pending";
  role?: string;
}

export interface Event {
  id: string;
  clubId: string;
  title: string;
  description: string;
  eventType: "meeting" | "competition" | "practice" | "social";
  startDate: string;
  endDate: string;
  location: string;
  maxCapacity?: number;
  registrationDeadline?: string;
  priceMember?: number;
  priceNonMember?: number;
  status: "upcoming" | "ongoing" | "completed" | "cancelled";
  registeredCount: number;
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

// Mock club data
export const mockClubData: ClubData = {
  id: "1",
  name: "Dolphins Swim Club",
  subdomain: "dolphins-swim-club",
  description: "Competitive swimming for all ages",
  contactEmail: "info@dolphinsswimclub.com",
  contactPhone: "(555) 123-4567",
  address: "123 Pool Lane",
  city: "Swimtown",
  state: "CA",
  zipCode: "90210",
  memberCount: 45,
  upcomingEvents: 3,
  monthlyRevenue: 12500,
  activePrograms: 5,
  onboardingCompleted: true,
};

// Mock members data
export const mockMembers: Member[] = [
  {
    id: "1",
    clubId: "1",
    userId: "user-1",
    firstName: "John",
    lastName: "Davis",
    email: "john.davis@example.com",
    phone: "(555) 111-2222",
    dateOfBirth: "1990-05-15",
    memberType: "adult",
    emergencyContactName: "Jane Davis",
    emergencyContactPhone: "(555) 111-3333",
    membershipStartDate: "2024-01-01",
    status: "active",
    role: "admin",
  },
  {
    id: "2",
    clubId: "1",
    userId: "user-2",
    firstName: "Emma",
    lastName: "Wilson",
    email: "emma.wilson@example.com",
    phone: "(555) 222-3333",
    dateOfBirth: "2010-05-15",
    memberType: "youth",
    emergencyContactName: "Sarah Wilson",
    emergencyContactPhone: "(555) 222-4444",
    membershipStartDate: "2024-01-01",
    status: "active",
  },
  {
    id: "3",
    clubId: "1",
    firstName: "Michael",
    lastName: "Brown",
    email: "michael.brown@example.com",
    phone: "(555) 333-4444",
    dateOfBirth: "1985-08-20",
    memberType: "adult",
    emergencyContactName: "Lisa Brown",
    emergencyContactPhone: "(555) 333-5555",
    membershipStartDate: "2024-02-15",
    status: "active",
  },
  {
    id: "4",
    clubId: "1",
    firstName: "Sarah",
    lastName: "Johnson",
    email: "sarah.johnson@example.com",
    phone: "(555) 444-5555",
    dateOfBirth: "2012-03-10",
    memberType: "youth",
    emergencyContactName: "David Johnson",
    emergencyContactPhone: "(555) 444-6666",
    membershipStartDate: "2024-03-01",
    status: "pending",
  },
  {
    id: "5",
    clubId: "1",
    firstName: "Robert",
    lastName: "Garcia",
    email: "robert.garcia@example.com",
    phone: "(555) 555-6666",
    dateOfBirth: "1978-12-05",
    memberType: "adult",
    emergencyContactName: "Maria Garcia",
    emergencyContactPhone: "(555) 555-7777",
    membershipStartDate: "2023-11-01",
    status: "inactive",
  },
];

// Mock events data
export const mockEvents: Event[] = [
  {
    id: "1",
    clubId: "1",
    title: "Summer Championship",
    description: "Annual summer swimming championship",
    eventType: "competition",
    startDate: "2024-07-15T09:00:00Z",
    endDate: "2024-07-15T17:00:00Z",
    location: "Main Pool",
    maxCapacity: 50,
    registrationDeadline: "2024-07-10T23:59:59Z",
    priceMember: 25.00,
    priceNonMember: 35.00,
    status: "upcoming",
    registeredCount: 15,
  },
  {
    id: "2",
    clubId: "1",
    title: "Weekly Practice",
    description: "Regular practice session for all members",
    eventType: "practice",
    startDate: "2024-06-20T18:00:00Z",
    endDate: "2024-06-20T20:00:00Z",
    location: "Competition Pool",
    maxCapacity: 30,
    priceMember: 0,
    priceNonMember: 15.00,
    status: "upcoming",
    registeredCount: 25,
  },
  {
    id: "3",
    clubId: "1",
    title: "Club Meeting",
    description: "Monthly club meeting and updates",
    eventType: "meeting",
    startDate: "2024-06-25T19:00:00Z",
    endDate: "2024-06-25T21:00:00Z",
    location: "Club House",
    maxCapacity: 100,
    priceMember: 0,
    priceNonMember: 0,
    status: "upcoming",
    registeredCount: 35,
  },
  {
    id: "4",
    clubId: "1",
    title: "Spring Invitational",
    description: "Spring swimming invitational meet",
    eventType: "competition",
    startDate: "2024-05-15T08:00:00Z",
    endDate: "2024-05-15T16:00:00Z",
    location: "Main Pool",
    maxCapacity: 75,
    registrationDeadline: "2024-05-10T23:59:59Z",
    priceMember: 30.00,
    priceNonMember: 40.00,
    status: "completed",
    registeredCount: 42,
  },
];

// Mock registrations data
export const mockRegistrations: Registration[] = [
  {
    id: "1",
    clubId: "1",
    eventId: "1",
    memberId: "1",
    registrationDate: "2024-06-01T10:00:00Z",
    status: "confirmed",
    notes: "First time participant",
    member: {
      firstName: "John",
      lastName: "Davis",
      email: "john.davis@example.com",
    },
    event: {
      title: "Summer Championship",
      startDate: "2024-07-15T09:00:00Z",
    },
  },
  {
    id: "2",
    clubId: "1",
    eventId: "1",
    memberId: "2",
    registrationDate: "2024-06-02T14:30:00Z",
    status: "confirmed",
    member: {
      firstName: "Emma",
      lastName: "Wilson",
      email: "emma.wilson@example.com",
    },
    event: {
      title: "Summer Championship",
      startDate: "2024-07-15T09:00:00Z",
    },
  },
  {
    id: "3",
    clubId: "1",
    eventId: "2",
    memberId: "3",
    registrationDate: "2024-06-15T09:15:00Z",
    status: "confirmed",
    member: {
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.brown@example.com",
    },
    event: {
      title: "Weekly Practice",
      startDate: "2024-06-20T18:00:00Z",
    },
  },
  {
    id: "4",
    clubId: "1",
    eventId: "3",
    memberId: "1",
    registrationDate: "2024-06-10T11:00:00Z",
    status: "pending",
    member: {
      firstName: "John",
      lastName: "Davis",
      email: "john.davis@example.com",
    },
    event: {
      title: "Club Meeting",
      startDate: "2024-06-25T19:00:00Z",
    },
  },
];

// Mock payments data
export const mockPayments: Payment[] = [
  {
    id: "1",
    clubId: "1",
    registrationId: "1",
    stripePaymentIntentId: "pi_1234567890",
    amount: 25.00,
    feeAmount: 1.25,
    paymentMethod: "card",
    status: "completed",
    createdAt: "2024-06-01T10:30:00Z",
    registration: {
      member: {
        firstName: "John",
        lastName: "Davis",
      },
      event: {
        title: "Summer Championship",
      },
    },
  },
  {
    id: "2",
    clubId: "1",
    registrationId: "2",
    stripePaymentIntentId: "pi_0987654321",
    amount: 25.00,
    feeAmount: 1.25,
    paymentMethod: "card",
    status: "completed",
    createdAt: "2024-06-02T15:00:00Z",
    registration: {
      member: {
        firstName: "Emma",
        lastName: "Wilson",
      },
      event: {
        title: "Summer Championship",
      },
    },
  },
  {
    id: "3",
    clubId: "1",
    registrationId: "3",
    amount: 0.00,
    paymentMethod: "card",
    status: "completed",
    createdAt: "2024-06-15T09:30:00Z",
    registration: {
      member: {
        firstName: "Michael",
        lastName: "Brown",
      },
      event: {
        title: "Weekly Practice",
      },
    },
  },
  {
    id: "4",
    clubId: "1",
    registrationId: "4",
    stripePaymentIntentId: "pi_1122334455",
    amount: 0.00,
    paymentMethod: "card",
    status: "pending",
    createdAt: "2024-06-10T11:15:00Z",
    registration: {
      member: {
        firstName: "John",
        lastName: "Davis",
      },
      event: {
        title: "Club Meeting",
      },
    },
  },
];
