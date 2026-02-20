import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Wallet, LogOut, Eye, EyeOff, TrendingUp, ShieldCheck, CreditCard } from "lucide-react";
import confetti from "canvas-confetti";

interface DashboardProps {
  onLogout: () => void;
}

export default function Dashboard({ onLogout }: DashboardProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showBalance, setShowBalance] = useState(false);

  const checkBalance = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/balance");
      const data = await res.json();
      if (res.ok) {
        setBalance(data.balance);
        setShowBalance(true);
        // Party popper effect!
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#34d399', '#6ee7b7', '#ffffff']
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    onLogout();
  };

  return (
    <div className="max-w-6xl mx-auto p-6 md:p-12">
      <header className="flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <ShieldCheck className="text-zinc-950 w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">KodBank</h1>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-white/5 rounded-xl hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Balance Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] -mr-32 -mt-32 rounded-full group-hover:bg-emerald-500/10 transition-colors duration-500" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-zinc-500 mb-4">
              <Wallet className="w-4 h-4" />
              <span className="text-sm font-medium uppercase tracking-widest">Total Balance</span>
            </div>

            <div className="flex flex-col gap-6">
              <div className="h-20 flex items-center">
                <AnimatePresence mode="wait">
                  {showBalance ? (
                    <motion.div
                      key="balance"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      className="text-6xl md:text-7xl font-bold tracking-tighter text-white"
                    >
                      ${balance?.toLocaleString()}
                      <span className="text-2xl text-zinc-500 ml-2">USD</span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="hidden"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-6xl md:text-7xl font-bold tracking-tighter text-zinc-800"
                    >
                      $ ••••••••
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <button
                onClick={checkBalance}
                disabled={loading}
                className="flex items-center gap-3 bg-emerald-500 hover:bg-emerald-400 text-zinc-950 px-8 py-4 rounded-2xl font-bold transition-all transform active:scale-95 shadow-xl shadow-emerald-500/20 disabled:opacity-50"
              >
                {showBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <span>{loading ? "Verifying..." : showBalance ? "Hide Balance" : "Check Balance"}</span>
              </button>
            </div>

            {showBalance && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl inline-block"
              >
                <p className="text-emerald-500 font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Your balance is: ${balance?.toLocaleString()}
                </p>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Quick Actions / Stats */}
        <div className="space-y-6">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-zinc-900/50 backdrop-blur-xl border border-white/10 p-6 rounded-3xl"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                <CreditCard className="text-emerald-500 w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">Virtual Card</h3>
                <p className="text-xs text-zinc-500">Active & Secure</p>
              </div>
            </div>
            <div className="bg-zinc-800/50 p-4 rounded-xl border border-white/5">
              <p className="text-zinc-500 text-[10px] uppercase tracking-widest mb-1">Card Number</p>
              <p className="font-mono tracking-widest text-sm">•••• •••• •••• 4291</p>
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-emerald-500 p-6 rounded-3xl text-zinc-950"
          >
            <h3 className="font-bold text-xl mb-2">Premium Savings</h3>
            <p className="text-zinc-900/70 text-sm mb-4">Earn up to 4.5% APY on your savings account.</p>
            <button className="w-full bg-zinc-950 text-white py-2 rounded-xl text-sm font-bold hover:bg-zinc-900 transition-colors">
              Learn More
            </button>
          </motion.div>
        </div>
      </main>

      <footer className="mt-24 pt-8 border-t border-white/5 text-center text-zinc-600 text-sm">
        <p>&copy; 2024 KodBank International. All rights reserved.</p>
      </footer>
    </div>
  );
}
