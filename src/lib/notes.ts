// Notes support a small formatting subset: **bold** and line breaks.
export function formatNoteBody(body: string): string {
  return body.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\r?\n/g, '<br>');
}
