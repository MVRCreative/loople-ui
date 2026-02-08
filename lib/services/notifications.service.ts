import { supabase } from "../supabase";

export interface SendDuesReminderParams {
  to: string;
  memberName?: string;
  amount?: string | number;
  dueDate?: string;
}

export interface SendWaitlistConfirmationParams {
  to: string;
  memberName?: string;
}

export interface SendProgramRegistrationConfirmationParams {
  to: string;
  memberName?: string;
}

/**
 * Send a dues reminder email via the send-notification Edge Function.
 */
export async function sendDuesReminder(
  params: SendDuesReminderParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: {
        to: params.to,
        template: "dues_reminder",
        data: {
          memberName: params.memberName,
          amount: params.amount,
          dueDate: params.dueDate,
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send notification",
    };
  }
}

/**
 * Send a waitlist confirmation email.
 */
export async function sendWaitlistConfirmation(
  params: SendWaitlistConfirmationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: {
        to: params.to,
        template: "waitlist_confirmation",
        data: { memberName: params.memberName },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send notification",
    };
  }
}

/**
 * Send a program registration confirmation email.
 */
export async function sendProgramRegistrationConfirmation(
  params: SendProgramRegistrationConfirmationParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke("send-notification", {
      body: {
        to: params.to,
        template: "program_registration",
        data: { memberName: params.memberName },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const result = data as { success?: boolean; error?: string } | null;
    if (result?.error) {
      return { success: false, error: result.error };
    }

    return { success: true };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to send notification",
    };
  }
}
