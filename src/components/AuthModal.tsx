import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Lock, Mail } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, sendPasswordResetEmail } from 'firebase/auth';
import { auth, getFriendlyErrorMessage } from '../firebase';
import { Language } from '../types';
import { getTranslation } from '../translations';

interface AuthModalProps {
  isOpen: boolean;
  lang: Language;
  onClose: () => void;
  onSuccess: (email: string, isLogin: boolean) => void;
  onError: (errMsg: string) => void;
  onResetSent: () => void;
}

export function AuthModal({
  isOpen,
  lang,
  onClose,
  onSuccess,
  onError,
  onResetSent
}: AuthModalProps) {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const t = (key: string, params?: Record<string, string | number>) => getTranslation(lang, key, params);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      onError('Please enter both email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        onSuccess(email.trim(), true);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        onSuccess(email.trim(), false);
      }
      setEmail('');
      setPassword('');
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      onError(getFriendlyErrorMessage(err));
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      const res = await signInWithPopup(auth, provider);
      onSuccess(res.user.email || 'user', true);
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setIsSubmitting(false);
      onError(getFriendlyErrorMessage(err));
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      onError(t('enterEmailFirst'));
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email.trim());
      onResetSent();
    } catch (err: any) {
      onError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[190] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 250 }}
          className="bg-white w-full max-w-sm rounded-[32px] p-6 sm:p-8 shadow-2xl relative text-slate-900 border border-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Heading */}
          <div className="mb-6">
            <h2 className="text-xl font-black text-slate-900 mb-1">
              {t(isLogin ? 'authWelcome' : 'authGetStarted')}
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              {t(isLogin ? 'authLoginSub' : 'authSignUpSub')}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-sans"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-700 block">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[16px] sm:text-xs outline-none focus:bg-white focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-sans"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            {isLogin && (
              <div className="flex justify-end pt-0.5">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] text-green-700 hover:text-green-800 font-bold cursor-pointer"
                >
                  {t('forgotPassword')}
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-black py-3.5 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all shadow-md active:scale-98 cursor-pointer flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                t(isLogin ? 'login' : 'signUp')
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-4">
            <div className="flex-1 h-px bg-slate-100" />
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">or</span>
            <div className="flex-1 h-px bg-slate-100" />
          </div>

          {/* Google Sign In */}
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={isSubmitting}
            className="w-full border border-slate-200 hover:bg-slate-50 py-3 rounded-xl text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-2.5 active:scale-98 cursor-pointer"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            <span>{t('googleSignIn')}</span>
          </button>

          {/* Toggle Switch */}
          <div className="mt-5 text-center">
            <button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="text-green-700 text-xs font-bold hover:underline cursor-pointer"
            >
              {t(isLogin ? 'newHere' : 'alreadyAccount')}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
