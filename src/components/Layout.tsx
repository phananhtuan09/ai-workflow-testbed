import { Link, Outlet, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n';
import { useAuth } from '../lib/auth';
import { Button } from './Button';

export function Layout() {
  const { t, locale, setLocale } = useI18n();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login');
  }

  return (
    <div className="layout">
      <header className="layout__header">
        <Link to="/orders" className="layout__brand">
          {t('app.title')}
        </Link>
        <nav className="layout__nav">
          {user && <Link to="/orders">{t('nav.orders')}</Link>}
          <Button variant="secondary" onClick={() => setLocale(locale === 'en' ? 'vi' : 'en')}>
            {t('nav.language')}
          </Button>
          {user && (
            <>
              <span className="layout__user">{user.displayName}</span>
              <Button variant="secondary" onClick={handleLogout}>
                {t('nav.logout')}
              </Button>
            </>
          )}
        </nav>
      </header>
      <main className="layout__main">
        <Outlet />
      </main>
    </div>
  );
}
