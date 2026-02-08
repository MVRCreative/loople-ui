import { supabase } from '../supabase';

export interface ClubInquirySubmission {
  id: number;
  user_id: string;
  email: string;
  name?: string | null;
  message: string;
  status: string;
  created_at: string;
}

export interface SubmitClubInquiryData {
  name?: string;
  email: string;
  message: string;
}

export interface SubmitClubInquiryResponse {
  success: boolean;
  data?: { id: number; created_at: string };
  error?: string;
}

export interface GetClubInquirySubmissionsResponse {
  success: boolean;
  data?: ClubInquirySubmission[];
  error?: string;
}

export class ClubInquiryService {
  static async submitClubInquiry(
    data: SubmitClubInquiryData
  ): Promise<SubmitClubInquiryResponse> {
    try {
      const { data: fnData, error } = await supabase.functions.invoke(
        'club-inquiry',
        {
          method: 'POST',
          body: {
            name: data.name?.trim(),
            email: data.email.trim(),
            message: data.message.trim(),
          },
        }
      );

      if (error) {
        return {
          success: false,
          error: error.message ?? 'Failed to submit inquiry',
        };
      }

      const payload = fnData as {
        success?: boolean;
        data?: { id: number; created_at: string };
        error?: string;
      };

      if (!payload?.success) {
        return {
          success: false,
          error: payload?.error ?? 'Failed to submit inquiry',
        };
      }

      return {
        success: true,
        data: payload.data,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to submit inquiry',
      };
    }
  }

  static async getClubInquirySubmissions(): Promise<GetClubInquirySubmissionsResponse> {
    try {
      const { data: fnData, error } = await supabase.functions.invoke(
        'club-inquiry',
        { method: 'GET' }
      );

      if (error) {
        return {
          success: false,
          error: error.message ?? 'Failed to fetch submissions',
        };
      }

      const payload = fnData as {
        success?: boolean;
        data?: ClubInquirySubmission[];
        error?: string;
      };

      if (!payload?.success) {
        return {
          success: false,
          error: payload?.error ?? 'Failed to fetch submissions',
        };
      }

      return {
        success: true,
        data: payload.data ?? [],
      };
    } catch (err) {
      return {
        success: false,
        error:
          err instanceof Error ? err.message : 'Failed to fetch submissions',
      };
    }
  }
}
