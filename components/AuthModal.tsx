'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { login } = useAuth();

  const handleLogin = () => {
    login();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-md glass p-8 md:p-10 border border-white/10"
          >
            <button
              onClick={onClose}
              className="absolute top-6 right-6 text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-8">
              <Lock className="text-accent" size={32} />
            </div>

            <h2 className="text-3xl font-display font-bold uppercase tracking-tighter mb-2">Welcome Back</h2>
            <p className="text-white/40 text-xs uppercase tracking-[0.2em] mb-8">Access the Diecast Vault</p>

            <div className="space-y-4">
              <button
                onClick={handleLogin}
                className="w-full bg-white text-black py-4 font-display font-bold uppercase tracking-wider hover:bg-accent hover:text-white transition-all flex items-center justify-center gap-3"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
                Sign In
              </button>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase tracking-widest">
                  <span className="bg-[#050505] px-4 text-white/20">Secure Access</span>
                </div>
              </div>

              <p className="text-[10px] text-center text-white/20 uppercase tracking-widest leading-relaxed">
                By continuing, you agree to our <br />
                <span className="text-white/40">Terms of Service</span> and <span className="text-white/40">Privacy Policy</span>
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
