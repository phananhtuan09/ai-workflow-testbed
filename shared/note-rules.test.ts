import { describe, expect, it } from 'vitest';
import { MAX_NOTE_LENGTH, validateNoteBody } from './note-rules';

describe('validateNoteBody', () => {
  it('accepts a normal note', () => {
    expect(validateNoteBody('Leave at the front desk')).toBeUndefined();
  });

  it('rejects an empty or whitespace-only note', () => {
    expect(validateNoteBody('   ')).toBe('validation.noteRequired');
  });

  it('rejects a note over the length limit', () => {
    expect(validateNoteBody('a'.repeat(MAX_NOTE_LENGTH + 1))).toBe('validation.noteTooLong');
  });
});
