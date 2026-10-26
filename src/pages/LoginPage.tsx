import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '../components/Button';
import { TextField } from '../components/TextField';
import { useI18n } from '../i18n';
import { useAuth } from '../lib/auth';
import { errorKey } from '../lib/errors';

export function LoginPage() {
  const { t } = useI18n();
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to="/orders" replace />;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(username, password);
      const from = (location.state as { from?: string } | null)?.from;
      navigate(from ?? '/orders', { replace: true });
    } catch (caught) {
      setError(errorKey(caught));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit}>
      <h1>{t('login.title')}</h1>
      <TextField
        label={t('login.username')}
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
        required
      />
      <TextField
        label={t('login.password')}
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        required
      />
      {error && (
        <p className="form__error" role="alert">
          {t(error)}
        </p>
      )}
      <Button type="submit" disabled={submitting}>
        {t('login.submit')}
      </Button>
    </form>
  );
}
