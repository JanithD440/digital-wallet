import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Lock, ArrowRight, ArrowLeft, Loader2, QrCode, Eye, EyeOff } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const SUBTITLES = {
  login: 'Share your business card, scan others, and save them all in one place.',
  signup: 'Create your account and build your digital business card.',
  forgot: "Enter your email and we'll send you a password reset link.",
}

export default function Login() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [needsConfirm, setNeedsConfirm] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const switchMode = (m) => {
    setMode(m)
    setError('')
    setInfo('')
    setNeedsConfirm(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setInfo('')
    setNeedsConfirm(false)

    if (mode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          setError('Your email is not confirmed yet. Check your inbox for the confirmation link.')
          setNeedsConfirm(true)
        } else if (error.message.toLowerCase().includes('invalid login')) {
          setError('Incorrect email or password. You can reset your password below.')
        } else {
          setError(error.message)
        }
      } else {
        navigate('/dashboard')
      }
    }

    if (mode === 'signup') {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) setError(error.message)
      else if (data.user && data.user.identities?.length === 0)
        setError('This email is already registered. Please log in instead.')
      else if (!data.session) setInfo('Account created. Please confirm your email (check your inbox).')
      else navigate('/dashboard')
    }

    if (mode === 'forgot') {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) setError(error.message)
      else setInfo('Reset link sent. Check your inbox (and spam folder).')
    }

    setLoading(false)
  }

  const resendConfirmation = async () => {
    setError('')
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) setError(error.message)
    else {
      setNeedsConfirm(false)
      setInfo('Confirmation email sent again.')
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4">
      <motion.div
        className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-indigo-600/30 blur-3xl"
        animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-600/30 blur-3xl"
        animate={{ x: [0, -60, 0], y: [0, -40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="glass relative w-full max-w-md rounded-3xl p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <motion.div
            initial={{ rotate: -12, scale: 0.6 }}
            animate={{ rotate: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
            className="grid h-14 w-14 place-items-center rounded-2xl bg-linear-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-fuchsia-500/30"
          >
            <QrCode className="h-7 w-7 text-white" />
          </motion.div>
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight">
            <span className="text-gradient">
              {mode === 'forgot' ? 'Reset password' : 'Digital Wallet'}
            </span>
          </h1>
          <p className="mt-2 text-sm text-white/50">{SUBTITLES[mode]}</p>
        </div>

        {mode !== 'forgot' && (
          <div className="mt-8 grid grid-cols-2 rounded-xl bg-white/5 p-1 text-sm font-medium">
            {['login', 'signup'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => switchMode(m)}
                className="relative cursor-pointer rounded-lg py-2"
              >
                {mode === m && (
                  <motion.span
                    layoutId="mode-pill"
                    className="absolute inset-0 rounded-lg bg-white/10"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">{m === 'login' ? 'Login' : 'Sign up'}</span>
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className={`space-y-4 ${mode === 'forgot' ? 'mt-8' : 'mt-6'}`}>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              className="field"
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          {mode !== 'forgot' && (
            <div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <input
                  className="field"
                  style={{ paddingRight: '2.75rem' }}
                  type={showPw ? 'text' : 'password'}
                  placeholder="Password (min 6 characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer p-1 text-white/40 hover:text-white"
                  aria-label="Toggle password visibility"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {mode === 'login' && (
                <div className="mt-2 text-right">
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="cursor-pointer text-xs text-indigo-300 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
              )}
            </div>
          )}

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300"
              >
                {error}
                {needsConfirm && (
                  <button
                    type="button"
                    onClick={resendConfirmation}
                    className="mt-1 block cursor-pointer text-xs text-indigo-300 hover:underline"
                  >
                    Resend confirmation email
                  </button>
                )}
              </motion.div>
            )}
            {info && (
              <motion.p
                key="info"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300"
              >
                {info}
              </motion.p>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            disabled={loading}
            className="btn-primary"
          >
            {loading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <>
                {mode === 'login' && 'Login'}
                {mode === 'signup' && 'Create account'}
                {mode === 'forgot' && 'Send reset link'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </motion.button>

          {mode === 'forgot' && (
            <button
              type="button"
              onClick={() => switchMode('login')}
              className="mx-auto flex cursor-pointer items-center gap-1 text-sm text-white/50 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4" /> Back to login
            </button>
          )}
        </form>
      </motion.div>
    </div>
  )
}