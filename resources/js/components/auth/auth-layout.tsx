import { ReactNode, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Shield, Zap, Users, Lock } from 'lucide-react'

interface AuthLayoutProps {
  children: ReactNode
  title?: string
}

export function AuthLayout({ children, title }: AuthLayoutProps) {
  const [scamBlocks, setScamBlocks] = useState(14203)

  // Animate scam blocks counter
  useEffect(() => {
    const interval = setInterval(() => {
      setScamBlocks(prev => prev + Math.floor(Math.random() * 3))
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Left Side - Crypto Banner */}
      <div className="hidden md:flex md:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 via-blue-900 to-slate-900">
          {/* Animated particles */}
          <div className="absolute inset-0">
            <motion.div
              className="absolute top-1/4 left-1/4 w-2 h-2 bg-emerald-400 rounded-full"
              animate={{
                y: [0, -20, 0],
                opacity: [0.5, 1, 0.5]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />
            <motion.div
              className="absolute top-1/3 right-1/3 w-1 h-1 bg-blue-400 rounded-full"
              animate={{
                y: [0, 15, 0],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1
              }}
            />
            <motion.div
              className="absolute bottom-1/4 left-1/3 w-1.5 h-1.5 bg-emerald-300 rounded-full"
              animate={{
                x: [0, 25, 0],
                opacity: [0.4, 0.9, 0.4]
              }}
              transition={{
                duration: 5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5
              }}
            />
          </div>

          <div className="relative z-10 flex flex-col items-center justify-center h-full p-8 text-center">
            {/* $GTRUST Logo */}
            <motion.div
              className="mb-8"
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center shadow-2xl">
                <span className="text-2xl font-bold text-white">$GTRUST</span>
              </div>
            </motion.div>

            {/* Headline */}
            <motion.h1
              className="text-4xl md:text-5xl font-bold text-white mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Your Money.<br />
              <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
                Your Rules. No Scams.
              </span>
            </motion.h1>

            {/* Stats */}
            <motion.div
              className="mb-8 space-y-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              <div className="text-xl text-slate-300">
                1.2M Nigerians protected · ₦18B in safe trades
              </div>
              <div className="text-2xl font-bold text-emerald-400">
                {scamBlocks.toLocaleString()} scams blocked today
              </div>
            </motion.div>

            {/* Trust Elements */}
            <motion.div
              className="space-y-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              <div className="flex items-center justify-center space-x-2 text-emerald-400">
                <Shield className="w-5 h-5" />
                <span className="font-semibold">AI Scam Coach · Hausa · USSD Ready</span>
              </div>

              <div className="flex items-center justify-center space-x-6 text-slate-400">
                <div className="flex items-center space-x-1">
                  <Lock className="w-4 h-4" />
                  <span>Bank-grade Security</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>Community Driven</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Zap className="w-4 h-4" />
                  <span>Lightning Fast</span>
                </div>
              </div>
            </motion.div>

            {/* Illustration */}
            <motion.div
              className="mt-12 opacity-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              transition={{ duration: 1, delay: 1 }}
            >
              <svg width="200" height="120" viewBox="0 0 200 120" className="text-emerald-400">
                {/* Simplified isometric padlock made of keke wheels */}
                <g transform="translate(100,60)">
                  {/* Base */}
                  <ellipse cx="0" cy="20" rx="25" ry="8" fill="currentColor" opacity="0.3"/>
                  {/* Shackle */}
                  <rect x="-3" y="-15" width="6" height="20" rx="3" fill="currentColor"/>
                  <rect x="-8" y="-18" width="16" height="6" rx="3" fill="currentColor"/>
                  {/* Keke wheel elements */}
                  <circle cx="-15" cy="15" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="15" cy="15" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
                  <circle cx="-15" cy="15" r="3" fill="currentColor"/>
                  <circle cx="15" cy="15" r="3" fill="currentColor"/>
                </g>
              </svg>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-6 md:p-10 bg-slate-900">
        <div className="w-full max-w-md mx-auto">
          {title && (
            <motion.div
              className="text-center mb-8"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="text-3xl font-bold text-white">{title}</h1>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
