import { describe, expect, it } from 'vitest';
import { formatNoteBody } from './notes';

describe('formatNoteBody', () => {
  it('turns **text** into bold text', () => {
    expect(formatNoteBody('Deliver to the **2nd floor**')).toBe('Deliver to the <strong>2nd floor</strong>');
  });

  it('keeps line breaks', () => {
    expect(formatNoteBody('Line one\nLine two')).toBe('Line one<br>Line two');
  });

  it('leaves single asterisks alone', () => {
    expect(formatNoteBody('5 * 3 boxes')).toBe('5 * 3 boxes');
  });
});
