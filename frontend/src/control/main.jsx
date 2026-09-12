import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import API from '../api/axios';
import AdminDashboard from '../pages/AdminDashboard';
import './control.css';

window.__KEYRA_ADMIN__ = true;

function Control() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const clear = () => { sessionStorage.removeItem('keyra_admin_token'); setUser(null); };
  useEffect(() => {
    const interceptor = API.interceptors.response.use(response => response, error => {
      if ([401,403].includes(error.response?.status) && !error.config.url.includes('admin-login')) {
        clear(); setError('Your admin session has ended or access was removed. Please sign in again.');
      }
      return Promise.reject(error);
    });
    if (sessionStorage.getItem('keyra_admin_token')) {
      API.get('/admin/session').then(({data}) => setUser(data.user)).catch(() => { clear(); setError('Could not verify access. Please sign in again.'); }).finally(() => setChecking(false));
    } else setChecking(false);
    return () => API.interceptors.response.eject(interceptor);
  }, []);
  const login = async event => {
    event.preventDefault(); setBusy(true); setError('');
    try {
      const {data} = await API.post('/auth/admin-login', {email, password});
      sessionStorage.setItem('keyra_admin_token', data.token);
      const response = await API.get('/admin/session');
      setUser(response.data.user); setPassword('');
    } catch(error) {
      clear();
      setError(error.response?.data?.message || 'The server may be waking up. Please try again in a moment.');
    } finally { setBusy(false); }
  };
  if (checking) return <main className="gate"><p role="status">Verifying administrator access…</p></main>;
  if (user) return <AdminDashboard onLogout={() => { clear(); setPassword(''); }} />;
  return <main className="gate">
    <section className="gate-story" aria-label="KeyraComics admin workspace">
      <a className="wordmark" href="/control/"><span className="brand-icon">K</span> KEYRA<span>COMICS</span></a>
      <div><p className="control-eyebrow">BEHIND EVERY GREAT STORY</p><h1>Your world.<br/>In good hands.</h1><p className="gate-copy">The private workspace for the people<br/>who bring KeyraComics to life.</p></div>
      <div className="story-panels" aria-hidden="true"><span>CREATE.</span><span>PUBLISH.</span><span>CONNECT.</span></div>
      <footer>KEYRACOMICS / ADMINISTRATION</footer>
    </section>
    <section className="gate-form">
      <div className="lock-mark" aria-hidden="true">↗</div><p className="control-eyebrow">ADMIN ACCESS ONLY</p><h2>Welcome to control.</h2><p>Sign in with your KeyraComics administrator account.</p>
      {error && <p role="alert" className="login-error">{error}</p>}
      <form onSubmit={login}>
        <label>Email address<input type="email" autoComplete="username" value={email} onChange={event=>setEmail(event.target.value)} required placeholder="you@example.com" /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={event=>setPassword(event.target.value)} required placeholder="Your password" /></label>
        <button disabled={busy} type="submit">{busy ? 'Verifying access…' : 'Enter workspace →'}</button>
      </form>
      <p className="gate-note">Access is restricted to existing administrators. Contact your account owner if you need access.</p>
      <div className="gate-security"><span>●</span> Verified permissions on every request</div>
    </section>
  </main>;
}
createRoot(document.getElementById('root')).render(<BrowserRouter><Control /></BrowserRouter>);
