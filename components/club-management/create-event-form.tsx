import { EventForm } from "./event-form";

interface CreateEventFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateEventForm({ onSuccess, onCancel }: CreateEventFormProps) {
  return (
    <EventForm
      mode="create"
      onSuccess={onSuccess}
      onCancel={onCancel}
    />
  );
}


