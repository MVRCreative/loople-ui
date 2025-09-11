import { supabase } from '../supabase';

export interface Payment {
  id: string;
  club_id: string;
  registration_id: string;
  stripe_payment_intent_id?: string;
  amount: number;
  fee_amount?: number;
  payment_method: 'card' | 'cash' | 'check' | 'transfer';
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
  registration?: {
    member: {
      first_name: string;
      last_name: string;
    };
    event: {
      title: string;
    };
  };
}

export interface CreatePaymentData {
  club_id: string;
  registration_id: string;
  stripe_payment_intent_id?: string;
  amount: number;
  fee_amount?: number;
  payment_method: 'card' | 'cash' | 'check' | 'transfer';
}

export class PaymentsService {
  /**
   * Get all payments with optional filters
   */
  static async getPayments(filters: { club_id?: string; registration_id?: string; status?: string } = {}): Promise<Payment[]> {
    try {
      let query = supabase
        .from('payments')
        .select(`
          *,
          registration:registrations(
            member:members(first_name, last_name),
            event:events(title)
          )
        `)
        .order('created_at', { ascending: false });

      if (filters.club_id) {
        query = query.eq('club_id', filters.club_id);
      }
      if (filters.registration_id) {
        query = query.eq('registration_id', filters.registration_id);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching payments:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in getPayments:', error);
      throw error;
    }
  }

  /**
   * Create a new payment record
   */
  static async createPayment(paymentData: CreatePaymentData): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .insert(paymentData)
        .select();
      
      if (error) {
        console.error('Error creating payment:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in createPayment:', error);
      throw error;
    }
  }

  /**
   * Update a payment
   */
  static async updatePayment(paymentId: string, updates: Partial<CreatePaymentData & { status?: string }>): Promise<Payment[]> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', paymentId)
        .select();
      
      if (error) {
        console.error('Error updating payment:', error);
        throw error;
      }
      
      return data || [];
    } catch (error) {
      console.error('Error in updatePayment:', error);
      throw error;
    }
  }

  /**
   * Get payment by ID
   */
  static async getPaymentById(paymentId: string): Promise<Payment | null> {
    try {
      const { data, error } = await supabase
        .from('payments')
        .select(`
          *,
          registration:registrations(
            member:members(first_name, last_name),
            event:events(title)
          )
        `)
        .eq('id', paymentId)
        .single();
      
      if (error) {
        console.error('Error fetching payment:', error);
        throw error;
      }
      
      return data;
    } catch (error) {
      console.error('Error in getPaymentById:', error);
      throw error;
    }
  }

  /**
   * Create Stripe payment intent
   */
  static async createStripePaymentIntent(amount: number, currency: string = 'usd', applicationFeeAmount?: number): Promise<unknown> {
    try {
      const { data, error } = await supabase.functions.invoke('create-payment-intent', {
        method: 'POST',
        body: {
          amount,
          currency,
          application_fee_amount: applicationFeeAmount
        }
      });
      
      if (error) {
        console.error('Error creating payment intent:', error);
        throw error;
      }
      
      return data as unknown;
    } catch (error) {
      console.error('Error in createStripePaymentIntent:', error);
      throw error;
    }
  }
}
