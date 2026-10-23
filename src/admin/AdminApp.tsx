import { getAuth, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, signOut, type User } from 'firebase/auth';
import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { isAdmin } from '../catalog/api';
import { firebaseApp, firebaseEnabled } from '../lib/firebase';
import { asset } from '../site/content';
import { ProductsAdmin } from './ProductsAdmin';
import './admin.css';

type Session = { state: 'loading' } | { state: 'signed-out' } | { state: 'not-admin'; user: User } | { state: 'admin'; user: User };

/**
 * /admin: sign in with Google or with an email and password created in the Firebase console, then manage the catalog.
 * Signing in alone grants nothing: the account also needs an admins/{uid} document.
 */
export default function AdminApp() {
  if (!firebaseEnabled) {
    return (
      <AdminShell>
        <div className="admin-card admin-narrow">
          <h1>Firebase is not set up yet</h1>
          <p>Add the REACT_APP_FIREBASE_* values to .env.local and restart the dev server.</p>
        </div>
      </AdminShell>
    );
  }
  return <SignedInGate />;
}

function SignedInGate() {
  const [session, setSession] = useState<Session>({ state: 'loading' });

  useEffect(() => {
    const auth = getAuth(firebaseApp());
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setSession({ state: 'signed-out' });
      setSession((await isAdmin(user.uid)) ? { state: 'admin', user } : { state: 'not-admin', user });
    });
  }, []);

  const logout = () => signOut(getAuth(firebaseApp()));

  if (session.state === 'loading') return <AdminShell><p className="admin-muted">Loading…</p></AdminShell>;
  if (session.state === 'signed-out') return <AdminShell><LoginForm /></AdminShell>;
  if (session.state === 'not-admin')
    return (
      <AdminShell>
        <div className="admin-card admin-narrow">
          <h1>No admin access</h1>
          <p>
            {session.user.email} is signed in but is not an admin yet. Send this ID to the site owner so they can add it in Firestore under{' '}
            <code>admins</code>:
          </p>
          <code className="admin-uid">{session.user.uid}</code>
          <button type="button" className="admin-btn" onClick={logout}>
            Sign out
          </button>
        </div>
      </AdminShell>
    );
  return (
    <AdminShell email={session.user.email} onLogout={logout}>
      <ProductsAdmin />
    </AdminShell>
  );
}

function AdminShell({ children, email, onLogout }: { children: ReactNode; email?: string | null; onLogout?: () => void }) {
  return (
    <div className="admin">
      <header className="admin-bar">
        <Link to="/" className="admin-brand">
          <img src={asset('cow-emblem-128.webp')} alt="" width={30} height={32} />
          Nimmi’s admin
        </Link>
        {email && (
          <div className="admin-bar__user">
            <span>{email}</span>
            <button type="button" className="admin-btn admin-btn--ghost" onClick={onLogout}>
              Sign out
            </button>
          </div>
        )}
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signInWithEmailAndPassword(getAuth(firebaseApp()), email.trim(), password);
    } catch {
      setError('That email and password did not match. Try again.');
      setBusy(false);
    }
  };

  const google = async () => {
    setBusy(true);
    setError('');
    const auth = getAuth(firebaseApp());
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      const code = (err as { code?: string }).code;
      // Some phone browsers block the popup; a full page redirect works there.
      if (code === 'auth/popup-blocked' || code === 'auth/operation-not-supported-in-this-environment') return signInWithRedirect(auth, provider);
      if (code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request') setError('Google sign in did not work. Try again.');
      setBusy(false);
    }
  };

  return (
    <form className="admin-card admin-narrow admin-form" onSubmit={submit}>
      <h1>Sign in</h1>
      <button type="button" className="admin-btn admin-btn--google" onClick={google} disabled={busy}>
        <GoogleMark />
        Continue with Google
      </button>
      <p className="admin-or">or with email</p>
      <label>
        Email
        <input type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
      </label>
      <label>
        Password
        <input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button type="submit" className="admin-btn" disabled={busy}>
        {busy ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" width="18" height="18" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.7 6c4.5-4.2 6.9-10.3 6.9-17.7z" />
      <path fill="#FBBC05" d="M10.6 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.7-6c-2.2 1.5-5 2.3-8.2 2.3-6.2 0-11.5-4.1-13.4-9.8l-7.9 6.1C6.6 42.6 14.6 48 24 48z" />
    </svg>
  );
}
