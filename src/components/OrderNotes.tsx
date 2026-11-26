import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { MAX_NOTE_LENGTH, validateNoteBody } from '../../shared/note-rules';
import type { OrderNoteWithAuthor } from '../../shared/types';
import { useI18n } from '../i18n';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth';
import { errorKey } from '../lib/errors';
import { formatDate } from '../lib/format';
import { formatNoteBody } from '../lib/notes';
import { useResource } from '../lib/useResource';
import { Button } from './Button';
import { ErrorState, LoadingState } from './StateView';

const NOTES_REFRESH_MS = 10_000;

export function OrderNotes({ orderId }: { orderId: number }) {
  const { t, locale } = useI18n();
  const { user } = useAuth();
  const initial = useResource(useCallback(() => api.listNotes(orderId), [orderId]));
  const [latest, setLatest] = useState<OrderNoteWithAuthor[] | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setInterval(() => {
      api.listNotes(orderId).then(setLatest, () => undefined);
    }, NOTES_REFRESH_MS);
  }, [orderId]);

  const notes = latest ?? (initial.status === 'success' ? initial.data : []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const invalid = validateNoteBody(draft);
    if (invalid) {
      setError(invalid);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const added = await api.addNote(orderId, draft);
      setLatest([...notes, added]);
      setDraft('');
    } catch (caught) {
      setError(errorKey(caught));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(noteId: number) {
    setError(null);
    try {
      await api.deleteNote(orderId, noteId);
      setLatest(notes.filter((note) => note.id !== noteId));
    } catch (caught) {
      setError(errorKey(caught));
    }
  }

  return (
    <section className="notes" aria-labelledby="notes-title">
      <h2 id="notes-title">{t('notes.title')}</h2>
      {initial.status === 'loading' && latest === null && <LoadingState />}
      {initial.status === 'error' && latest === null && (
        <ErrorState error={initial.error} onRetry={initial.reload} />
      )}
      {initial.status === 'success' && notes.length === 0 && <p className="notes__empty">{t('notes.empty')}</p>}
      {notes.length > 0 && (
        <ul className="notes__list">
          {notes.map((note) => (
            <li key={note.id} className="notes__item">
              <p className="notes__meta">
                {formatDate(note.createdAt, locale)} {t('notes.by')} {note.author?.displayName}
              </p>
              <p className="notes__body" dangerouslySetInnerHTML={{ __html: formatNoteBody(note.body) }} />
              {(note.authorId === user?.id || user?.role === 'admin') && (
                <Button variant="secondary" className="notes__delete" onClick={() => void handleDelete(note.id)}>
                  {t('notes.delete')}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
      <form className="notes__form" onSubmit={handleSubmit} noValidate>
        <label htmlFor="note-body">{t('notes.label')}</label>
        <textarea
          id="note-body"
          rows={3}
          maxLength={MAX_NOTE_LENGTH}
          value={draft}
          aria-describedby="note-hint"
          onChange={(event) => setDraft(event.target.value)}
        />
        <p id="note-hint" className="field__hint">
          {t('notes.hint')}
        </p>
        {error && (
          <p className="form__error" role="alert">
            {t(error)}
          </p>
        )}
        <div className="actions">
          <Button type="submit" disabled={saving}>
            {saving ? t('notes.adding') : t('notes.add')}
          </Button>
        </div>
      </form>
    </section>
  );
}
