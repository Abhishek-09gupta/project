import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Calendar, Users, Award, PlayCircle, Eye, Loader, CheckCircle } from 'lucide-react';

export default function Contests() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [contests, setContests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [registeringId, setRegisteringId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Periodically update current time to trigger accurate countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadContests = async () => {
    try {
      setLoading(true);
      const data = await api.contests.getAll();
      setContests(data);
    } catch (err) {
      console.error('Error fetching contests:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContests();
  }, []);

  const handleRegister = async (contestId) => {
    setRegisteringId(contestId);
    try {
      await api.contests.register(contestId);
      alert('Registration successful! Best of luck in the contest.');
      await loadContests();
    } catch (err) {
      alert(err.message || 'Contest registration failed.');
    } finally {
      setRegisteringId(null);
    }
  };

  // Status computation helpers
  const getContestStatus = (contest) => {
    const start = new Date(contest.startTime);
    const end = new Date(contest.endTime);
    
    if (currentTime < start) return { type: 'upcoming', label: 'Upcoming', start, end };
    if (currentTime >= start && currentTime <= end) return { type: 'live', label: 'Live Now', start, end };
    return { type: 'completed', label: 'Completed', start, end };
  };

  // Format time remaining/countdown
  const formatCountdown = (targetDate) => {
    const diff = targetDate.getTime() - currentTime.getTime();
    if (diff <= 0) return '00:00:00';

    const secs = Math.floor(diff / 1000) % 60;
    const mins = Math.floor(diff / (1000 * 60)) % 60;
    const hours = Math.floor(diff / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const pad = (n) => String(n).padStart(2, '0');

    if (days > 0) return `${days}d ${pad(hours)}h ${pad(mins)}m`;
    return `${pad(hours)}:${pad(mins)}:${pad(secs)}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-white font-sans">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-extrabold font-heading bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent flex items-center space-x-2">
          <Award className="w-8 h-8 text-indigo-400" />
          <span>Competitive Contests</span>
        </h1>
        <p className="text-gray-400 text-sm mt-2">Test your speed and logic in time-boxed coding tournaments</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-t-2 border-indigo-500 border-r-2 border-r-transparent animate-spin rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contests.length === 0 ? (
            <div className="col-span-full py-16 text-center text-gray-500">
              <Calendar className="w-10 h-10 mx-auto text-gray-600 mb-2" />
              <p>No contest events scheduled at the moment.</p>
            </div>
          ) : (
            contests.map((contest) => {
              const status = getContestStatus(contest);
              const isRegistered = contest.participants && contest.participants.includes(user.id);
              const problemsCount = contest.problems ? contest.problems.length : 0;
              const participantsCount = contest.participants ? contest.participants.length : 0;

              // Style badges by status
              let badgeColor = 'text-gray-400 bg-gray-400/10 border-gray-400/20';
              let borderHighlight = 'border-white/5';
              let countdownLabel = '';
              let targetTime = null;

              if (status.type === 'live') {
                badgeColor = 'text-rose-400 bg-rose-400/10 border-rose-500/20';
                borderHighlight = 'border-rose-500/30 shadow-[0_0_20px_rgba(239,68,68,0.05)]';
                countdownLabel = 'Ending in:';
                targetTime = status.end;
              } else if (status.type === 'upcoming') {
                badgeColor = 'text-indigo-400 bg-indigo-400/10 border-indigo-500/20';
                borderHighlight = 'border-indigo-500/25';
                countdownLabel = 'Starts in:';
                targetTime = status.start;
              } else if (status.type === 'completed') {
                badgeColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
              }

              return (
                <div
                  key={contest.id}
                  className={`glass-card rounded-2xl p-6 border flex flex-col justify-between transition-all duration-300 ${borderHighlight}`}
                >
                  <div>
                    {/* Header: Status badge & Clock */}
                    <div className="flex justify-between items-center mb-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${badgeColor}`}>
                        {status.type === 'live' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping mr-1.5"></span>
                        )}
                        {status.label}
                      </span>

                      {/* Countdown Timer */}
                      {targetTime && (
                        <div className="text-[11px] font-mono font-semibold text-gray-400">
                          {countdownLabel} <span className="text-white">{formatCountdown(targetTime)}</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Desc */}
                    <h3 className="text-lg font-bold text-white font-heading truncate mb-2">{contest.title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed line-clamp-3 mb-6">{contest.description || 'No description provided.'}</p>
                  </div>

                  {/* Metadata Stats */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 border-t border-b border-white/5 py-3 text-xs text-gray-400">
                      <div className="flex items-center space-x-1.5">
                        <Users className="w-4 h-4 text-indigo-400" />
                        <span>{participantsCount} Registered</span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <Award className="w-4 h-4 text-indigo-400" />
                        <span>{problemsCount} Problems</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="w-full">
                      {status.type === 'completed' ? (
                        <button
                          onClick={() => navigate(`/contests/${contest.id}`)}
                          className="w-full px-4 py-2 bg-white/5 hover:bg-white/10 text-xs font-semibold rounded-xl border border-white/10 flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                          <span>View Standings</span>
                        </button>
                      ) : status.type === 'upcoming' && !isRegistered ? (
                        <button
                          onClick={() => handleRegister(contest.id)}
                          disabled={registeringId === contest.id}
                          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                        >
                          {registeringId === contest.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              <span>Register Now</span>
                            </>
                          )}
                        </button>
                      ) : status.type === 'upcoming' && isRegistered ? (
                        <div className="w-full text-center py-2 border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-xs font-bold rounded-xl flex items-center justify-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Registered</span>
                        </div>
                      ) : status.type === 'live' && !isRegistered ? (
                        <button
                          onClick={() => handleRegister(contest.id)}
                          disabled={registeringId === contest.id}
                          className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-indigo-600/10 cursor-pointer"
                        >
                          {registeringId === contest.id ? (
                            <Loader className="w-4 h-4 animate-spin" />
                          ) : (
                            <span>Register & Enter</span>
                          )}
                        </button>
                      ) : (
                        // Live and registered
                        <button
                          onClick={() => navigate(`/contests/${contest.id}`)}
                          className="w-full px-4 py-2 bg-rose-600 hover:bg-rose-500 text-xs font-semibold rounded-xl flex items-center justify-center space-x-1.5 transition-all shadow-md shadow-rose-600/10 cursor-pointer"
                        >
                          <PlayCircle className="w-4 h-4" />
                          <span>Enter Arena</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
