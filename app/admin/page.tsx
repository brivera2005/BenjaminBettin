'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Flame, TrendingUp, Lock, ShieldCheck, Zap, Bell } from 'lucide-react';

export default function Home() {
  const [bets, setBets] = useState<any[]>([]);
  const [isVIP, setIsVIP] = useState(false); // Toggle this to TRUE to see the picks unlocked

  useEffect(() => {
    const fetchBets = async () => {
      const { data } = await supabase
        .from('bets')
        .select('*')
        .order('created_at', { ascending: false });
      if (data) setBets(data);
    };
    fetchBets();

    const channel = supabase
      .channel('realtime-bets')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bets' }, 
      (payload) => {
        setBets((prev) => [payload.new, ...prev]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-[#39FF14] selection:text-black">
      
      {/* GLOW DECORATION */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-64 bg-[#39FF14]/10 blur-[120px] pointer-events-none" />

      {/* HEADER */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-black/60 border-b border-white/5 px-6 py-4">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Zap className="text-[#39FF14] fill-[#39FF14] w-6 h-6" />
            <h1 className="text-2xl font-black uppercase tracking-tighter italic">
              Benjamin<span className="text-[#39FF14]">.Bettin'</span>
            </h1>
          </div>
          <button 
            onClick={() => setIsVIP(!isVIP)}
            className="text-[10px] font-bold border border-white/10 px-3 py-1 rounded-full hover:bg-white hover:text-black transition-all uppercase tracking-widest"
          >
            {isVIP ? 'VIP Access Active' : 'Member Login'}
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6 space-y-8">
        
        {/* HERO STATS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-[#111] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <TrendingUp size={64} className="text-[#39FF14]" />
            </div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Total Profit</p>
            <h3 className="text-4xl font-black text-white">+84.2 <span className="text-[#39FF14] text-lg">Units</span></h3>
          </div>
          
          <div className="bg-[#111] border border-white/5 p-6 rounded-3xl relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Flame size={64} className="text-orange-500" />
            </div>
            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest mb-1">Win Streak</p>
            <h3 className="text-4xl font-black text-white">7 <span className="text-orange-500 text-lg uppercase">Straight</span></h3>
          </div>

          <div className="bg-[#39FF14] p-6 rounded-3xl flex flex-col justify-center shadow-[0_0_30px_rgba(57,255,20,0.2)]">
            <p className="text-black font-bold text-xs uppercase tracking-widest mb-1">System Status</p>
            <h3 className="text-2xl font-black text-black uppercase leading-none">The Board is Live</h3>
          </div>
        </section>

        {/* THE BOARD */}
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2 px-2">
            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#39FF14]" /> The Daily Slate
            </h2>
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">March 2026</span>
          </div>

          {bets.length === 0 ? (
             <div className="text-center py-20 bg-[#111] rounded-3xl border border-dashed border-white/10">
                <p className="text-gray-500 font-bold uppercase tracking-widest">Scanning the market for value...</p>
             </div>
          ) : (
            bets.map((bet) => (
              <div key={bet.id} className="group relative overflow-hidden rounded-3xl border border-white/5 bg-[#111] transition-all hover:border-[#39FF14]/30">
                
                {/* VIP OVERLAY */}
                {!isVIP && (
                  <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="text-[#39FF14] mb-3 w-8 h-8" />
                    <h4 className="font-black uppercase text-xl mb-1 tracking-tighter">Locked VIP Content</h4>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-4">Subscription Required</p>
                    <button className="bg-white text-black font-black px-8 py-3 rounded-full uppercase tracking-tighter hover:bg-[#39FF14] transition-colors">
                      Unlock Full Board
                    </button>
                  </div>
                )}

                {/* CONTENT */}
                <div className={`p-8 ${!isVIP ? 'blur-sm opacity-30 select-none' : ''}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <span className="bg-[#39FF14]/10 text-[#39FF14] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-[#39FF14]/20 mr-3">
                        {bet.sport}
                      </span>
                      <span className="text-gray-500 text-xs font-bold uppercase tracking-widest">
                        {new Date(bet.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} EST
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[#39FF14]">
                      <ShieldCheck size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Verified</span>
                    </div>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-400 mb-2 uppercase tracking-tight">{bet.matchup}</h3>
                  <div className="flex items-end justify-between">
                    <div className="text-5xl md:text-6xl font-black italic tracking-tighter text-white">
                      {bet.pick} <span className="text-[#39FF14] text-3xl md:text-4xl not-italic ml-2">{bet.odds}</span>
                    </div>
                    <div className="text-right">
                      <div className="bg-white/5 rounded-2xl px-6 py-4 border border-white/5">
                        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-1 leading-none">Risk</p>
                        <p className="text-white font-black text-3xl leading-none italic">{bet.units}U</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="max-w-5xl mx-auto p-12 text-center">
         <p className="text-gray-600 text-[10px] font-bold uppercase tracking-[0.2em]">
           Benjamin Bettin' © 2026 | Bet Responsibly
         </p>
      </footer>
    </div>
  );
}