'use client';
import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, TrendingUp, Lock, Zap, CheckCircle2, XCircle, MinusCircle, LogIn, CreditCard, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, isAfter, parseISO } from 'date-fns';

const ADMIN_EMAIL = 'brivera2005@gmail.com';

const MOCK_BETS = [
  { id: '1', sport: 'NBA', matchup: 'Lakers @ Nuggets', pick: 'Lakers ML', odds: '+140', units: '2', status: 'win', created_at: new Date(Date.now() - 86400000 * 0.5).toISOString() },
  { id: '2', sport: 'NCAAB', matchup: 'Nebraska @ Purdue', pick: 'Nebraska +6.5', odds: '-110', units: '5', status: 'win', created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
  { id: '3', sport: 'NHL', matchup: 'Avs @ Knights', pick: 'Over 6.5', odds: '-120', units: '1.5', status: 'loss', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '4', sport: 'NBA', matchup: 'Celtics @ Bucks', pick: 'Celtics -2.5', odds: '-115', units: '3', status: 'win', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
  { id: '5', sport: 'UFC', matchup: 'Main Event', pick: 'Fighter A by KO', odds: '+200', units: '1', status: 'pending', created_at: new Date().toISOString() },
];

export default function Home() {
  const [bets, setBets] = useState<any[]>(MOCK_BETS);
  const [user, setUser] = useState<{ email: string } | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [timeFilter, setTimeFilter] = useState<'7d' | '30d'>('30d');

  const isGodMode = user?.email === ADMIN_EMAIL;
  const hasAccess = isGodMode || isSubscribed;

  const analytics = useMemo(() => {
    let totalProfit = 0; let wins = 0; let losses = 0; let currentStreak = 0; let streakBroken = false;
    const chartDataMap = new Map(); let runningProfit = 0;

    const filteredBets = bets.filter(b => isAfter(new Date(b.created_at), subDays(new Date(), timeFilter === '7d' ? 7 : 30)));

    [...filteredBets].reverse().forEach(bet => {
      let betProfit = 0; const risk = parseFloat(bet.units); const odds = parseFloat(bet.odds);
      if (bet.status === 'win') {
        betProfit = odds > 0 ? risk * (odds / 100) : risk / (Math.abs(odds) / 100);
        wins++; if (!streakBroken) currentStreak++;
      } else if (bet.status === 'loss') {
        betProfit = -risk; losses++; streakBroken = true;
      }
      totalProfit += betProfit; runningProfit += betProfit;
      const day = format(new Date(bet.created_at), 'MMM dd');
      chartDataMap.set(day, { date: day, profit: parseFloat(runningProfit.toFixed(2)) });
    });

    const betsByDay = filteredBets.reduce((acc, bet) => {
      const day = format(parseISO(bet.created_at), 'EEEE, MMM do');
      if (!acc[day]) acc[day] = [];
      acc[day].push(bet);
      return acc;
    }, {} as Record<string, typeof bets>);

    return { profit: totalProfit.toFixed(2), winRate: wins + losses > 0 ? Math.round((wins / (wins + losses)) * 100) : 0, currentStreak, chartData: Array.from(chartDataMap.values()), betsByDay };
  }, [bets, timeFilter]);

  const handleGoogleLogin = () => setUser({ email: ADMIN_EMAIL });
  const handleStripeCheckout = () => setIsSubscribed(true);

  return (
    <div className="min-h-screen bg-[#050505] text-stone-100 font-sans selection:bg-violet-600/30 overflow-x-hidden">
      
      {/* Cinematic Ambient Background: Royal Purple & Money Green */}
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-violet-900/20 blur-[180px] pointer-events-none rounded-full mix-blend-screen" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-emerald-900/10 blur-[180px] pointer-events-none rounded-full mix-blend-screen" />

      <header className="sticky top-0 z-50 backdrop-blur-2xl bg-[#050505]/60 border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-violet-950 flex items-center justify-center shadow-lg shadow-violet-900/20 border border-violet-500/30">
              {/* This Zap icon is a placeholder until we drop the Ben Franklin image here */}
              <Zap className="text-white w-5 h-5" />
            </div>
            <h1 className="text-2xl font-black tracking-tighter uppercase italic text-stone-100">
              Benjamin<span className="text-violet-500">Bettin'</span>
            </h1>
          </motion.div>
          
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-3">
                {isGodMode && <span className="hidden md:flex items-center gap-1 text-[10px] uppercase tracking-widest text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-full border border-emerald-400/20"><ShieldCheck className="w-3 h-3"/> God Mode</span>}
                <button onClick={() => {setUser(null); setIsSubscribed(false);}} className="text-[11px] font-bold text-stone-400 hover:text-white transition-colors uppercase tracking-widest">
                  Sign Out
                </button>
              </div>
            ) : (
              <button onClick={handleGoogleLogin} className="text-[11px] font-bold bg-white text-black px-5 py-2.5 rounded-full hover:bg-stone-200 transition-all uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-white/10">
                <LogIn className="w-3 h-3" /> Log In
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-12 mt-6 relative z-10">
        
        <motion.section initial="hidden" animate="visible" variants={{ visible: { transition: { staggerChildren: 0.1 } } }} className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { label: 'Net Return', value: `${parseFloat(analytics.profit) > 0 ? '+' : ''}${analytics.profit}u`, color: parseFloat(analytics.profit) >= 0 ? 'text-emerald-400' : 'text-stone-500' },
            { label: 'Strike Rate', value: `${analytics.winRate}%`, color: 'text-stone-100' },
            { label: 'Active Form', value: `${analytics.currentStreak}W`, color: 'text-stone-100' }
          ].map((stat, i) => (
            <motion.div key={i} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} className="bg-stone-900/40 border border-white/5 p-8 rounded-3xl backdrop-blur-md relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150" />
              <p className="text-stone-500 text-[11px] uppercase tracking-widest mb-2 font-bold">{stat.label}</p>
              <h3 className={`text-6xl font-light tracking-tighter ${stat.color}`}>{stat.value}</h3>
            </motion.div>
          ))}
        </motion.section>

        <motion.section initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className="bg-stone-900/40 border border-white/5 rounded-3xl p-8 backdrop-blur-md">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-xl font-black tracking-tight uppercase flex items-center gap-2 text-stone-300">
              <TrendingUp className="w-5 h-5 text-violet-500" /> Performance Ledger
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.chartData}>
                <defs>
                  <linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#57534e" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#57534e" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `${val}u`} />
                <Tooltip contentStyle={{ backgroundColor: '#1c1917', borderColor: '#292524', borderRadius: '12px', color: '#f5f5f4' }} itemStyle={{ color: '#8b5cf6', fontWeight: 'bold' }} />
                <Area type="stepAfter" dataKey="profit" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.section>

        <section className="space-y-8">
          <h2 className="text-2xl font-black tracking-tighter uppercase mb-6 text-stone-400">The Action</h2>
          
          <AnimatePresence>
            {Object.entries(analytics.betsByDay).map(([day, dayBets], dayIndex) => (
              <motion.div key={day} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: dayIndex * 0.1 }} className="space-y-4">
                
                <div className="flex items-center gap-4">
                  <h3 className="text-[11px] font-bold uppercase tracking-widest text-stone-500">{day}</h3>
                  <div className="h-px bg-white/5 flex-grow" />
                </div>

                {dayBets.map((bet: any) => (
                  <motion.div whileHover={{ scale: 1.01 }} key={bet.id} className="group relative overflow-hidden rounded-2xl border border-white/5 bg-stone-900/30 transition-all hover:border-violet-500/30 hover:bg-stone-900/60">
                    
                    {!hasAccess && bet.status === 'pending' && (
                      <div className="absolute inset-0 z-20 backdrop-blur-xl bg-[#050505]/80 flex flex-col items-center justify-center p-6 text-center border-l-4 border-violet-600">
                        <Lock className="text-violet-500 w-8 h-8 mb-4" />
                        <h4 className="font-black tracking-tighter text-2xl text-stone-100 uppercase mb-2">Premium Intel Locked</h4>
                        {user ? (
                           <button onClick={handleStripeCheckout} className="mt-2 text-[12px] uppercase tracking-widest font-bold bg-violet-600 text-white px-8 py-4 rounded-full hover:bg-violet-700 transition-all shadow-lg shadow-violet-900/50 flex items-center gap-2">
                             <CreditCard className="w-4 h-4"/> Unlock with Stripe
                           </button>
                        ) : (
                          <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Sign in to access subscriptions</p>
                        )}
                      </div>
                    )}

                    <div className={`p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 ${!hasAccess && bet.status === 'pending' ? 'blur-md opacity-30 select-none' : ''}`}>
                      <div className="flex items-center gap-6">
                        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl bg-[#050505] border border-white/5 shadow-inner">
                          {/* Green for wins, faded grey for losses so we don't highlight the negative */}
                          {bet.status === 'win' && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                          {bet.status === 'loss' && <XCircle className="w-5 h-5 text-stone-700" />}
                          {bet.status === 'push' && <MinusCircle className="w-5 h-5 text-stone-600" />}
                          {bet.status === 'pending' && <Activity className="w-5 h-5 text-violet-400 animate-pulse" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-stone-500">{bet.sport}</span>
                            {bet.status === 'pending' && <span className="flex items-center gap-1 text-[9px] text-violet-300 font-bold uppercase tracking-widest bg-violet-500/20 px-2 py-0.5 rounded-sm"><Activity className="w-3 h-3"/> Live Action</span>}
                          </div>
                          <h3 className="text-xl font-medium tracking-tight text-stone-200">{bet.matchup}</h3>
                          <div className="text-lg font-bold mt-1 text-stone-400">
                            {bet.pick} <span className="text-emerald-400 ml-2">{bet.odds}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right flex flex-col items-end">
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-1 text-stone-600">Exposure</p>
                        <p className="text-3xl font-light tracking-tighter text-stone-100">{bet.units} <span className="text-lg text-stone-600">u</span></p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ))}
          </AnimatePresence>
        </section>
      </main>
    </div>
  );
}