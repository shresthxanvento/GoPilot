'use client';

import { useEffect, useState } from 'react';
import { ShieldAlert, Activity, CheckCircle2, XCircle, Terminal, Cpu, HardDrive } from 'lucide-react';

type PendingFix = { id: number; command: string; status: string; };
type HealthStats = { cpu_usage: number; memory_usage: number; };

export default function ControlRoom() {
  const [fixes, setFixes] = useState<PendingFix[]>([]);
  const [history, setHistory] = useState<PendingFix[]>([]);
  const [stats, setStats] = useState({ approved: 0, rejected: 0 });
  const [health, setHealth] = useState<HealthStats>({ cpu_usage: 0, memory_usage: 0 });

  const fetchData = async () => {
    const dbRes = await fetch('/api/approvals');
    const dbData = await dbRes.json();
    if (dbData.pending) {
      setFixes(dbData.pending);
      setHistory(dbData.history);
      setStats({ approved: dbData.approvedCount, rejected: dbData.rejectedCount });
    }
    const healthRes = await fetch('/api/health');
    if (healthRes.ok) {
      const healthData = await healthRes.json();
      setHealth(healthData);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: number, action: 'APPROVED' | 'REJECTED') => {
    await fetch('/api/approvals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    fetchData(); // Instantly refresh
  };

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-gray-100 p-8 font-mono selection:bg-blue-500/30">
      <div className="max-w-7xl mx-auto">
        
        <header className="mb-10 border-b border-gray-800 pb-6">
          <div className="flex items-center gap-3">
            <Activity className="w-8 h-8 text-blue-500" />
            <h1 className="text-4xl font-extrabold bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
              Healer Control Room
            </h1>
          </div>
          <p className="text-gray-400 mt-2 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            AI-Driven Autonomous Infrastructure Monitoring
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-gray-200">
                <ShieldAlert className="w-5 h-5 text-yellow-500" /> Pending AI Interventions
              </h2>
              
              {fixes.length === 0 ? (
                <div className="bg-gray-900/50 border border-green-500/20 text-green-400 p-8 rounded-xl text-center flex flex-col items-center justify-center shadow-inner">
                  <CheckCircle2 className="w-12 h-12 mb-3 opacity-50" />
                  <p className="text-lg">System is stable. No pending actions required.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {fixes.map((fix) => (
                    <div key={fix.id} className="bg-gray-900 border border-red-500/30 p-6 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.1)] relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                      <div className="flex justify-between items-start mb-4 pl-2">
                        <div>
                          <h3 className="text-red-400 font-semibold text-lg uppercase tracking-wider">Anomaly Detected</h3>
                          <p className="text-gray-400 text-sm mt-1">Proposed resolution pipeline:</p>
                        </div>
                        <span className="bg-yellow-500/10 text-yellow-500 text-xs px-3 py-1 rounded border border-yellow-500/20 animate-pulse">
                          AWAITING AUTHORIZATION
                        </span>
                      </div>
                      
                      <div className="bg-black/80 p-4 rounded-lg text-green-400 mb-6 font-mono text-sm border border-gray-800 flex items-center gap-3">
                        <Terminal className="w-4 h-4 text-gray-500" />
                        <code>{fix.command}</code>
                      </div>

                      <div className="flex gap-4 pl-2">
                        <button 
                          onClick={() => handleAction(fix.id, 'APPROVED')}
                          className="flex-1 bg-green-600/90 hover:bg-green-500 text-white py-2.5 rounded-lg transition-all font-semibold shadow-lg shadow-green-900/20 flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Execute Fix
                        </button>
                        <button 
                          onClick={() => handleAction(fix.id, 'REJECTED')}
                          className="flex-1 bg-gray-800 hover:bg-red-900/40 text-red-400 border border-red-900/50 py-2.5 rounded-lg transition-all font-semibold flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* History Section */}
            <section>
              <h2 className="text-lg font-semibold mb-4 text-gray-400">Recent Activity</h2>
              <div className="bg-gray-900/30 border border-gray-800 rounded-xl overflow-hidden">
                {history.length === 0 ? (
                  <p className="text-gray-600 p-6 text-center text-sm">No recent activity.</p>
                ) : (
                  <ul className="divide-y divide-gray-800">
                    {history.map((item) => (
                      <li key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-800/20 transition-colors">
                        <div className="flex items-center gap-3">
                          {item.status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                          <code className="text-xs text-gray-300 bg-black/50 px-2 py-1 rounded border border-gray-800">{item.command}</code>
                        </div>
                        <span className={`text-xs font-bold ${item.status === 'APPROVED' ? 'text-green-500' : 'text-red-500'}`}>
                          {item.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: TELEMETRY & STATS */}
          <div className="space-y-6">
            
            {/* Live Telemetry */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-gray-400 text-sm font-bold uppercase tracking-widest mb-6 border-b border-gray-800 pb-2">Live Telemetry</h2>
              
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="flex items-center gap-2 text-gray-300"><Cpu className="w-4 h-4 text-blue-400" /> CPU Load</span>
                  <span className="text-blue-400 font-bold">{health.cpu_usage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-950 rounded-full h-2.5 border border-gray-800 overflow-hidden">
                  <div className="bg-blue-500 h-2.5 transition-all duration-1000 ease-out" style={{ width: `${Math.min(health.cpu_usage, 100)}%` }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="flex items-center gap-2 text-gray-300"><HardDrive className="w-4 h-4 text-purple-400" /> Memory Usage</span>
                  <span className="text-purple-400 font-bold">{health.memory_usage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-950 rounded-full h-2.5 border border-gray-800 overflow-hidden">
                  <div className="bg-purple-500 h-2.5 transition-all duration-1000 ease-out" style={{ width: `${Math.min(health.memory_usage, 100)}%` }}></div>
                </div>
              </div>
            </div>

            {/* Lifetime Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-green-500/5 group-hover:bg-green-500/10 transition-colors"></div>
                <span className="text-4xl font-black text-green-500 mb-1">{stats.approved}</span>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Executed</span>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-red-500/5 group-hover:bg-red-500/10 transition-colors"></div>
                <span className="text-4xl font-black text-red-500 mb-1">{stats.rejected}</span>
                <span className="text-xs text-gray-500 font-bold uppercase tracking-wider">Blocked</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}