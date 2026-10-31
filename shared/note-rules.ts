export const MAX_NOTE_LENGTH = 500;

// Returns an i18n key, or undefined when the note body is valid.
export function validateNoteBody(body: string): string | undefined {
  const trimmed = body.trim();
  if (trimmed.length === 0) return 'validation.noteRequired';
  if (trimmed.length > MAX_NOTE_LENGTH) return 'validation.noteTooLong';
  return undefined;
}
