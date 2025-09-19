import { EventForm } from "./event-form";
import { Event as ApiEvent } from "@/lib/services/events.service";

interface EditEventFormProps {
  event: ApiEvent;
  onSuccess: () => void;
  onCancel: () => void;
}

export function EditEventForm({ event, onSuccess, onCancel }: EditEventFormProps) {
  return (
    <EventForm
      mode="edit"
      event={event}
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}


