import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Trophy, Flame, Search, Medal, Award } from 'lucide-react';

export default function Leaderboard() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        setLoading(true);
        const data = await api.auth.getLeaderboard();
        setLeaderboard(data);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, []);

  const filteredLeaderboard = leaderboard.filter(u =>
    u.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Split into Top 3 and Others
  const topThree = filteredLeaderboard.slice(0, 3);
  const others = filteredLeaderboard.slice(3);

  // Position placements on podium: [2nd, 1st, 3rd]
  const podiumOrder = [];
  if (topThree[1]) podiumOrder.push({ ...topThree[1], rank: 2 }); // Second
  if (topThree[0]) podiumOrder.push({ ...topThree[0], rank: 1 }); // First
  if (topThree[2]) podiumOrder.push({ ...topThree[2], rank: 3 }); // Third

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-white font-sans">
      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-extrabold font-heading bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent flex items-center justify-center space-x-2">
          <Trophy className="w-8 h-8 text-indigo-400 fill-indigo-400/10 animate-bounce" />
          <span>Global Leaderboard</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">Rankings are updated dynamically based on solved difficulty points</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-t-2 border-indigo-500 border-r-2 border-r-transparent animate-spin rounded-full"></div>
        </div>
      ) : (
        <div className="space-y-12">
          
          {/* PODIUM DISPLAY FOR TOP 3 */}
          {podiumOrder.length > 0 && (
            <div className="flex flex-col md:flex-row items-end justify-center gap-6 md:gap-4 max-w-4xl mx-auto px-4">
              {podiumOrder.map((cardUser) => {
                const isCurrentUser = user && cardUser.id === user.id;
                
                // Card heights and styling based on rank
                let heightClass = 'h-52';
                let borderGlow = 'border-white/5';
                let medalColor = 'text-gray-400';
                let scaleClass = 'scale-95';

                if (cardUser.rank === 1) {
                  heightClass = 'h-64';
                  borderGlow = 'border-indigo-500/30 shadow-[0_0_30px_rgba(99,102,241,0.15)] bg-gradient-to-t from-[#0d121e] to-indigo-950/20';
                  medalColor = 'text-amber-400';
                  scaleClass = 'scale-100 md:-translate-y-2';
                } else if (cardUser.rank === 2) {
                  heightClass = 'h-56';
                  borderGlow = 'border-slate-400/20';
                  medalColor = 'text-slate-300';
                  scaleClass = 'scale-95';
                } else if (cardUser.rank === 3) {
                  heightClass = 'h-48';
                  borderGlow = 'border-amber-700/20';
                  medalColor = 'text-amber-600';
                  scaleClass = 'scale-90';
                }

                return (
                  <div
                    key={cardUser.id}
                    className={`w-full md:w-64 glass-card rounded-2xl p-6 border flex flex-col justify-between items-center text-center transition-all duration-300 ${heightClass} ${borderGlow} ${scaleClass}`}
                  >
                    {/* Medal / Placement indicator */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mb-3 border border-white/10 ${medalColor}`}>
                        {cardUser.rank === 1 ? <Trophy className="w-5 h-5" /> : <Medal className="w-5 h-5" />}
                      </div>
                      
                      <h3 className="font-extrabold text-white text-base leading-tight truncate max-w-[150px]">
                        {cardUser.username}
                      </h3>
                      {isCurrentUser && (
                        <span className="text-[9px] font-bold tracking-wider uppercase text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full mt-1.5 border border-indigo-500/20 animate-pulse">
                          You
                        </span>
                      )}
                    </div>

                    {/* Stats details */}
                    <div className="w-full border-t border-white/5 pt-4 mt-4 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Solved</span>
                        <span className="block font-bold text-white mt-0.5">{cardUser.solvedCount || 0}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase font-semibold">Streak</span>
                        <span className="block font-bold text-amber-400 mt-0.5 flex items-center justify-center">
                          <Flame className="w-3.5 h-3.5 fill-amber-500 mr-0.5 text-amber-500" />
                          {cardUser.streak || 0}d
                        </span>
                      </div>
                    </div>

                    {/* Score value */}
                    <div className="mt-3 bg-white/5 px-4 py-1.5 rounded-xl border border-white/5 w-full flex items-center justify-center space-x-1">
                      <Award className="w-4 h-4 text-indigo-400" />
                      <span className="text-sm font-bold text-indigo-400">{cardUser.score || 0} pts</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FILTER SEARCH BAR & TABLE */}
          <div className="space-y-4 max-w-4xl mx-auto">
            <div className="glass-card rounded-2xl p-4 border border-white/5 flex items-center justify-between">
              <div className="relative w-full max-w-md">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search user ranks..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full glass-input pl-9 pr-4 py-2 text-sm"
                />
              </div>
              <div className="text-xs text-gray-400 hidden sm:block">
                Displaying {filteredLeaderboard.length} of {leaderboard.length} registered coders
              </div>
            </div>

            {/* Others Ranks Table */}
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="py-4 px-6 w-20 text-center">Rank</th>
                      <th className="py-4 px-6">Username</th>
                      <th className="py-4 px-6 text-center w-36">Solved Challenges</th>
                      <th className="py-4 px-6 text-center w-36">Streak Status</th>
                      <th className="py-4 px-6 text-right w-36">Score Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredLeaderboard.map((rowUser, index) => {
                      const rank = index + 1;
                      const isCurrentUser = user && rowUser.id === user.id;

                      return (
                        <tr
                          key={rowUser.id}
                          className={`transition-colors hover:bg-white/[0.01] ${
                            isCurrentUser ? 'bg-indigo-500/5 hover:bg-indigo-500/10 font-medium' : ''
                          }`}
                        >
                          {/* Rank placement */}
                          <td className="py-4 px-6 text-center font-mono font-bold text-gray-400">
                            {rank === 1 ? (
                              <span className="text-amber-400">1st</span>
                            ) : rank === 2 ? (
                              <span className="text-slate-300">2nd</span>
                            ) : rank === 3 ? (
                              <span className="text-amber-600">3rd</span>
                            ) : (
                              `#${rank}`
                            )}
                          </td>

                          {/* Username */}
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-2.5">
                              <div className="w-7 h-7 rounded-full bg-indigo-600/30 flex items-center justify-center text-xs uppercase font-bold text-indigo-300">
                                {rowUser.username.charAt(0)}
                              </div>
                              <div className="font-semibold text-white">
                                {rowUser.username}
                                {isCurrentUser && (
                                  <span className="ml-2 text-[9px] uppercase tracking-wider font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/20">
                                    You
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Solved challenges */}
                          <td className="py-4 px-6 text-center font-semibold text-gray-300">
                            {rowUser.solvedCount || 0}
                          </td>

                          {/* Streak status */}
                          <td className="py-4 px-6 text-center">
                            <span className="inline-flex items-center text-amber-400 font-semibold">
                              <Flame className="w-4 h-4 fill-amber-500 mr-1 text-amber-500" />
                              {rowUser.streak || 0} Days
                            </span>
                          </td>

                          {/* Score points */}
                          <td className="py-4 px-6 text-right font-bold text-indigo-400 font-mono">
                            {rowUser.score || 0} pts
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
