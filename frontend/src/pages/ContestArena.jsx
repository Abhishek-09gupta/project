import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api';
import { Award, Trophy, Timer, Flame, CheckCircle, ArrowRight, ShieldAlert } from 'lucide-react';

export default function ContestArena() {
  const { id: contestId } = useParams();
  const navigate = useNavigate();
  const [contest, setContest] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Periodically refresh current time and leaderboard
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Poll leaderboard every 10 seconds for real-time standings
  useEffect(() => {
    let boardPoll = null;
    if (contest && getContestState() === 'live') {
      boardPoll = setInterval(() => loadLeaderboard(), 10000);
    }
    return () => {
      if (boardPoll) clearInterval(boardPoll);
    };
  }, [contest]);

  const loadLeaderboard = async () => {
    try {
      const data = await api.contests.getLeaderboard(contestId);
      setLeaderboard(data);
    } catch (err) {
      console.error('Error fetching contest leaderboard:', err);
    }
  };

  useEffect(() => {
    async function loadContestData() {
      try {
        setLoading(true);
        const contestData = await api.contests.getById(contestId);
        setContest(contestData);
        
        // Fetch all problems and filter those associated with this contest
        const allProblems = await api.problems.getAll();
        const contestProblemIds = contestData.problems || [];
        const contestFilteredProblems = allProblems.filter(p => contestProblemIds.includes(p.id));
        setProblems(contestFilteredProblems);

        // Load leaderboard
        const boardData = await api.contests.getLeaderboard(contestId);
        setLeaderboard(boardData);
      } catch (err) {
        console.error('Error loading contest details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadContestData();
  }, [contestId]);

  const getContestState = () => {
    if (!contest) return 'loading';
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);

    if (currentTime < start) return 'upcoming';
    if (currentTime >= start && currentTime <= end) return 'live';
    return 'completed';
  };

  const formatCountdown = () => {
    if (!contest) return '';
    const state = getContestState();
    const target = state === 'upcoming' ? new Date(contest.startTime) : new Date(contest.endTime);
    
    const diff = target.getTime() - currentTime.getTime();
    if (diff <= 0) return '00:00:00';

    const secs = Math.floor(diff / 1000) % 60;
    const mins = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(mins)}m`;
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(screen-4rem)] bg-[#080c14] text-white">
        <div className="w-10 h-10 border-t-2 border-indigo-500 border-r-2 border-r-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  if (!contest) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-white">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-heading">Contest Event Not Found</h2>
        <p className="text-gray-400 mt-2">Check the ID or return to list.</p>
        <button onClick={() => navigate('/contests')} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-500">
          Back to Contests
        </button>
      </div>
    );
  }

  const state = getContestState();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-white font-sans space-y-8">
      
      {/* Contest Branding & Info Row */}
      <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/5 blur-3xl rounded-full" />
        
        <div>
          <div className="flex items-center space-x-2.5 mb-2">
            <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
              state === 'live' ? 'text-rose-400 bg-rose-400/10 border-rose-500/20' :
              state === 'upcoming' ? 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20' :
              'text-emerald-400 bg-emerald-400/10 border-emerald-500/20'
            }`}>
              {state === 'live' && <span className="w-1.5 h-1.5 bg-rose-500 rounded-full inline-block animate-ping mr-1.5" />}
              {state}
            </span>
            <span className="text-xs text-gray-500">Event Portal</span>
          </div>

          <h1 className="text-2xl md:text-3xl font-extrabold font-heading text-white tracking-tight">{contest.title}</h1>
          <p className="text-gray-400 text-xs mt-1 md:max-w-2xl">{contest.description || 'No description provided.'}</p>
        </div>

        {/* Countdown card */}
        {state !== 'completed' && (
          <div className="bg-[#05080f] border border-white/5 px-6 py-4 rounded-xl flex items-center space-x-3.5 shadow-inner flex-shrink-0">
            <Timer className={`w-6 h-6 ${state === 'live' ? 'text-rose-400 animate-pulse' : 'text-indigo-400'}`} />
            <div>
              <span className="text-[9px] text-gray-500 uppercase tracking-wider block font-semibold">
                {state === 'upcoming' ? 'Contest starts in' : 'Remaining Time'}
              </span>
              <span className="text-xl font-bold font-mono tracking-wide text-white">
                {formatCountdown()}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid: Left problems lists, Right live standings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Problems List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-bold font-heading flex items-center space-x-2">
            <Award className="w-5 h-5 text-indigo-400" />
            <span>Challenge Set</span>
          </h2>

          {state === 'upcoming' ? (
            <div className="glass-card rounded-2xl p-12 text-center border border-white/5 flex flex-col items-center">
              <Timer className="w-12 h-12 text-indigo-400 animate-pulse mb-3" />
              <h3 className="font-bold text-white text-base">Contest Lock Active</h3>
              <p className="text-xs text-gray-400 mt-2 max-w-sm">
                Problems will unlock automatically once the countdown expires. Prepare your environment!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {problems.length === 0 ? (
                <p className="text-sm text-gray-500">No problems have been added to this contest yet.</p>
              ) : (
                problems.map((prob) => {
                  let diffColor = 'text-emerald-400 bg-emerald-400/5 border-emerald-500/10';
                  if (prob.difficulty.toLowerCase() === 'medium') diffColor = 'text-amber-400 bg-amber-400/5 border-amber-500/10';
                  else if (prob.difficulty.toLowerCase() === 'hard') diffColor = 'text-rose-400 bg-rose-400/5 border-rose-500/10';

                  return (
                    <div
                      key={prob.id}
                      className="glass-card-interactive p-4 rounded-xl border border-white/5 flex items-center justify-between hover:bg-[#05080f]/40 transition-all group"
                    >
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${diffColor}`}>
                            {prob.difficulty}
                          </span>
                          <h4 className="font-semibold text-white text-sm group-hover:text-indigo-400 transition-colors">
                            {prob.title}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {prob.companyTags && prob.companyTags.map(tag => (
                            <span key={tag} className="text-[9px] bg-white/5 px-1 py-0.5 rounded text-gray-500 font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link
                        to={`/problems/${prob.id}`}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg flex items-center space-x-1 shadow-sm transition-all"
                      >
                        <span>Code</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Live Contest Standings */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold font-heading flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-indigo-400" />
            <span>Leaderboard</span>
          </h2>

          <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
            <div className="bg-white/[0.01] px-4 py-3 border-b border-white/5 flex justify-between items-center text-xs font-bold uppercase tracking-wider text-gray-500">
              <span>Competitor</span>
              <span>Score</span>
            </div>
            
            {leaderboard.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-8">No scores recorded yet. Solved problems grant 100 points.</p>
            ) : (
              <div className="divide-y divide-white/5 text-xs max-h-96 overflow-y-auto scrollbar-thin">
                {leaderboard.map((row, idx) => (
                  <div key={row.userId} className="flex justify-between items-center px-4 py-3 hover:bg-white/[0.01] transition-colors">
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <span className="font-mono font-bold text-gray-500 w-4">{idx + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-indigo-600/30 flex items-center justify-center font-bold text-[10px] text-indigo-300 uppercase select-none flex-shrink-0">
                        {row.username.charAt(0)}
                      </div>
                      <span className="font-semibold text-white truncate max-w-[120px]">{row.username}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="text-[10px] text-gray-500">{row.solvedCount} solved</span>
                      <span className="font-bold text-indigo-400 font-mono">{row.score} pts</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
