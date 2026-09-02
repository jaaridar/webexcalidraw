import { useCallback, useEffect, useRef, useState } from 'react'
import { Excalidraw } from '@excalidraw/excalidraw'
import { nanoid } from 'nanoid'
import { supabase } from './supabase'
import '@excalidraw/excalidraw/index.css'

type CanvasData = { elements: readonly unknown[]; appState?: Record<string, unknown>; files?: Record<string, unknown> }
type User = { id: string; email?: string }

const emptyCanvas: CanvasData = { elements: [], appState: { theme: 'light' } }

function AuthScreen({ onUser }: { onUser: (user: User) => void }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setBusy(true); setMessage('')
    const result = mode === 'signin'
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${window.location.origin}/` } })
    setBusy(false)
    if (result.error) { setMessage(mode === 'signin' ? 'Invalid email or password.' : result.error.message); return }
    if (mode === 'signup' && !result.data.session) setMessage('Check your email to confirm your account.')
    else if (result.data.user) onUser({ id: result.data.user.id, email: result.data.user.email })
  }

  return <main style={styles.auth}><section style={styles.panel}><p style={styles.eyebrow}>WEB EXCALIDRAW</p><h1>Draw together,<br /><span>without friction.</span></h1><p style={styles.muted}>A private, persistent workspace for your best ideas.</p><form onSubmit={submit} style={styles.form}><label>Email<input required type="email" value={email} onChange={e => setEmail(e.target.value)} /></label><label>Password<input required minLength={6} type="password" value={password} onChange={e => setPassword(e.target.value)} /></label>{message && <p role="alert" style={styles.error}>{message}</p>}<button disabled={busy} style={styles.primary}>{busy ? 'Working…' : mode === 'signin' ? 'Sign in' : 'Create account'}</button></form><button style={styles.link} onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setMessage('') }}>{mode === 'signin' ? 'Need an account? Create one' : 'Already have an account? Sign in'}</button></section></main>
}

function CanvasList({ user, onSelect, onSignOut }: { user: User; onSelect: (id: string) => void; onSignOut: () => void }) {
  const [ids, setIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const createNew = () => { const id = nanoid(12); setIds(current => [id, ...current].slice(0, 100)); onSelect(id) }
  return <main style={styles.list}><header style={styles.header}><div><p style={styles.eyebrow}>WEB EXCALIDRAW</p><h1>Your canvases</h1><p style={styles.muted}>{user.email}</p></div><button style={styles.secondary} onClick={onSignOut}>Sign out</button></header><button style={styles.create} onClick={createNew}>＋ New canvas</button>{loading ? <p>Loading canvases…</p> : ids.length ? ids.map(id => <article style={styles.canvasRow} key={id}><span><strong>Canvas</strong><code>{id}</code></span><button style={styles.secondary} onClick={() => onSelect(id)}>Open</button></article>) : <section style={styles.empty}><h2>Start with a blank page.</h2><p>Every idea deserves room to become something.</p></section>}</main>
}

export default function App() {
  const [user, setUser] = useState<User | null>(null); const [canvasId, setCanvasId] = useState<string | null>(null); const [data, setData] = useState<CanvasData | null>(null); const [error, setError] = useState(''); const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    let active = true
    const clearAuthFragment = () => {
      if (window.location.hash.includes('access_token=')) {
        window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`)
      }
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      if (data.session?.user) setUser({ id: data.session.user.id, email: data.session.user.email })
      clearAuthFragment()
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      setUser(session?.user ? { id: session.user.id, email: session.user.email } : null)
      clearAuthFragment()
    })

    return () => { active = false; listener.subscription.unsubscribe() }
  }, [])
  const open = useCallback(async (id: string) => { setCanvasId(id); setError(''); const { data: session } = await supabase.auth.getSession(); const res = await fetch(`/api/load?id=${encodeURIComponent(id)}`, { headers: { Authorization: `Bearer ${session.session?.access_token ?? ''}` } }); if (!res.ok) { setError('Unable to load this canvas.'); setData(emptyCanvas); return } setData(await res.json()) }, [])
  const save = useCallback((next: CanvasData) => { if (!canvasId) return; if (saveTimer.current) clearTimeout(saveTimer.current); saveTimer.current = setTimeout(async () => { const { data: session } = await supabase.auth.getSession(); const res = await fetch('/api/save', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.session?.access_token ?? ''}` }, body: JSON.stringify({ id: canvasId, data: next }) }); if (!res.ok) setError('Changes could not be saved.'); }, 700) }, [canvasId])
  if (!user) return <AuthScreen onUser={setUser} />
  if (!canvasId || !data) return <CanvasList user={user} onSelect={open} onSignOut={() => supabase.auth.signOut()} />
  return <div style={{ height: '100vh', width: '100vw' }}>{error && <div role="alert" style={styles.toast}>{error}</div>}<button style={styles.back} onClick={() => { setCanvasId(null); setData(null); setError('') }}>← Canvases</button><Excalidraw initialData={data as never} onChange={next => save(next as CanvasData)} theme="light" /></div>
}

const styles: Record<string, React.CSSProperties> = { auth: { minHeight: '100vh', background: '#151515', color: '#f4f1ea', display: 'grid', placeItems: 'center', padding: 24 }, panel: { width: '100%', maxWidth: 440, padding: 40, background: '#202020', border: '1px solid #3b3b3b', borderRadius: 16 }, eyebrow: { color: '#f0a35b', fontSize: 12, fontWeight: 700, letterSpacing: '0.16em' }, h1: { fontSize: 42, lineHeight: 1.05, margin: '24px 0 12px' }, muted: { color: '#aaa', lineHeight: 1.5 }, form: { display: 'grid', gap: 18, marginTop: 32 }, formLabel: { display: 'grid', gap: 8 }, input: { padding: 12, borderRadius: 8, border: '1px solid #555', background: '#151515', color: '#fff', font: 'inherit' }, primary: { padding: 13, border: 0, borderRadius: 8, background: '#f0a35b', color: '#151515', fontWeight: 700, cursor: 'pointer' }, link: { marginTop: 22, border: 0, background: 'transparent', color: '#f0a35b', cursor: 'pointer' }, error: { color: '#ff8d7a', fontSize: 14 }, list: { minHeight: '100vh', background: '#151515', color: '#f4f1ea', padding: '48px 7vw' }, header: { display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: 24 }, create: { marginTop: 48, padding: '16px 22px', border: 0, borderRadius: 8, background: '#f0a35b', fontWeight: 700, cursor: 'pointer' }, secondary: { padding: '10px 14px', border: '1px solid #555', borderRadius: 8, background: 'transparent', color: '#f4f1ea', cursor: 'pointer' }, canvasRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: 720, padding: '18px 0', borderBottom: '1px solid #333' }, canvasRowSpan: { display: 'grid', gap: 6 }, empty: { marginTop: 100, color: '#aaa' }, back: { position: 'absolute', zIndex: 10, top: 12, left: 12, padding: '9px 13px', border: '1px solid #ddd', borderRadius: 8, background: '#fff', cursor: 'pointer' }, toast: { position: 'absolute', zIndex: 20, top: 14, right: 14, padding: 12, background: '#ff8d7a', color: '#151515', borderRadius: 8 } }
