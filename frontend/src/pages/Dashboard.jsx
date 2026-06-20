import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { Search, Flame, Trophy, CheckCircle, HelpCircle, Code, ArrowRight } from 'lucide-react';

export default function Dashboard() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering states
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  const [tagFilter, setTagFilter] = useState('all');

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        const fetchedProblems = await api.problems.getAll();
        setProblems(fetchedProblems);
        await refreshProfile(); // Ensure stats are up-to-date
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadDashboardData();
  }, []);

  // Collect unique company tags
  const allCompanyTags = ['all', ...new Set(problems.flatMap(p => p.companyTags || []))];

  // Apply filters
  const filteredProblems = problems.filter((prob) => {
    const matchesSearch = prob.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          prob.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDifficulty = difficultyFilter === 'all' || prob.difficulty.toLowerCase() === difficultyFilter.toLowerCase();
    const matchesTag = tagFilter === 'all' || (prob.companyTags && prob.companyTags.includes(tagFilter));

    return matchesSearch && matchesDifficulty && matchesTag;
  });

  // Calculate difficulty counts for the user progress indicator
  const totalCount = problems.length;
  const solvedCount = user?.solvedCount || 0;
  const solvedPercentage = totalCount > 0 ? Math.round((solvedCount / totalCount) * 100) : 0;

  const easySolved = problems.filter(p => p.difficulty.toLowerCase() === 'easy' && user?.solvedProblems?.includes(p.id)).length;
  const easyTotal = problems.filter(p => p.difficulty.toLowerCase() === 'easy').length;

  const mediumSolved = problems.filter(p => p.difficulty.toLowerCase() === 'medium' && user?.solvedProblems?.includes(p.id)).length;
  const mediumTotal = problems.filter(p => p.difficulty.toLowerCase() === 'medium').length;

  const hardSolved = problems.filter(p => p.difficulty.toLowerCase() === 'hard' && user?.solvedProblems?.includes(p.id)).length;
  const hardTotal = problems.filter(p => p.difficulty.toLowerCase() === 'hard').length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-white font-sans relative">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold font-heading bg-gradient-to-r from-white via-gray-200 to-indigo-300 bg-clip-text text-transparent">
          Code Arena Dashboard
        </h1>
        <p className="text-gray-400 text-sm mt-1">Select a challenge below and start coding.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="w-10 h-10 border-t-2 border-indigo-500 border-r-2 border-r-transparent animate-spin rounded-full"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content Area - Problem List (Span 3) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Filters Bar */}
            <div className="glass-card rounded-2xl p-4 border border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-grow">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  placeholder="Search problems..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full glass-input pl-9 pr-4 py-2 text-sm"
                />
              </div>

              {/* Selection Filter Elements */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Difficulty Filter */}
                <select
                  value={difficultyFilter}
                  onChange={(e) => setDifficultyFilter(e.target.value)}
                  className="glass-input px-3 py-2 text-sm bg-[#0d121e] cursor-pointer"
                >
                  <option value="all">All Difficulties</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>

                {/* Tags Filter */}
                <select
                  value={tagFilter}
                  onChange={(e) => setTagFilter(e.target.value)}
                  className="glass-input px-3 py-2 text-sm bg-[#0d121e] cursor-pointer capitalize"
                >
                  <option value="all">All Company Tags</option>
                  {allCompanyTags.filter(t => t !== 'all').map((tag) => (
                    <option key={tag} value={tag}>
                      {tag}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Problems Grid/Table */}
            <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/5 bg-white/[0.01] text-xs font-semibold uppercase tracking-wider text-gray-400">
                      <th className="py-4 px-6 w-16 text-center">Status</th>
                      <th className="py-4 px-6">Problem Title</th>
                      <th className="py-4 px-6 w-32">Difficulty</th>
                      <th className="py-4 px-6 w-44">Limits</th>
                      <th className="py-4 px-6 w-28 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-sm">
                    {filteredProblems.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-gray-400">
                          <div className="flex flex-col items-center">
                            <HelpCircle className="w-8 h-8 text-gray-500 mb-2" />
                            <p>No problems match the selected filters.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filteredProblems.map((prob) => {
                        const isSolved = user?.solvedProblems?.includes(prob.id);
                        
                        let difficultyColor = 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20';
                        if (prob.difficulty.toLowerCase() === 'medium') {
                          difficultyColor = 'text-amber-400 bg-amber-400/10 border-amber-500/20';
                        } else if (prob.difficulty.toLowerCase() === 'hard') {
                          difficultyColor = 'text-rose-400 bg-rose-400/10 border-rose-500/20';
                        }

                        return (
                          <tr key={prob.id} className="hover:bg-white/[0.01] transition-all group">
                            {/* Solved checkmark */}
                            <td className="py-4 px-6 text-center">
                              {isSolved ? (
                                <CheckCircle className="w-5 h-5 text-emerald-500 inline-block drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />
                              ) : (
                                <span className="inline-block w-5 h-5 rounded-full border border-white/10" />
                              )}
                            </td>

                            {/* Title & Tags */}
                            <td className="py-4 px-6">
                              <div className="font-semibold text-white group-hover:text-indigo-400 transition-colors">
                                {prob.title}
                              </div>
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {prob.companyTags && prob.companyTags.map(tag => (
                                  <span key={tag} className="text-[10px] font-medium bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </td>

                            {/* Difficulty */}
                            <td className="py-4 px-6">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold border ${difficultyColor}`}>
                                {prob.difficulty}
                              </span>
                            </td>

                            {/* Limits */}
                            <td className="py-4 px-6 text-xs text-gray-400 font-mono">
                              {prob.timeLimit || 2}s limit | {prob.memoryLimit || 256}MB RAM
                            </td>

                            {/* Action Button */}
                            <td className="py-4 px-6 text-center">
                              <button
                                onClick={() => navigate(`/problems/${prob.id}`)}
                                className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center space-x-1 w-full ${
                                  isSolved 
                                    ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400'
                                    : 'bg-indigo-600 border-indigo-500 text-white hover:bg-indigo-500 shadow-sm shadow-indigo-600/10 hover:shadow-indigo-500/25 active:scale-[0.98]'
                                }`}
                              >
                                <span>{isSolved ? 'Review' : 'Solve'}</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Sidebar Area - User Profile / Analytics (Span 1) */}
          <div className="space-y-6">
            
            {/* User Stats Card */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-2xl rounded-full" />
              
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-extrabold uppercase text-lg shadow-md shadow-indigo-500/25 select-none">
                  {user?.username?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base leading-tight">{user?.username}</h3>
                  <p className="text-gray-400 text-xs mt-0.5">Global Competitor</p>
                </div>
              </div>

              {/* Streaks & Scores */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-amber-500/5 border border-amber-500/10 p-3 rounded-xl text-center shadow-[0_0_15px_rgba(245,158,11,0.02)]">
                  <Flame className="w-5 h-5 mx-auto text-amber-500 fill-amber-500 animate-pulse mb-1" />
                  <span className="block text-xl font-bold text-white leading-tight">{user?.streak || 0}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Streak Days</span>
                </div>
                <div className="bg-indigo-500/5 border border-indigo-500/10 p-3 rounded-xl text-center shadow-[0_0_15px_rgba(99,102,241,0.02)]">
                  <Trophy className="w-5 h-5 mx-auto text-indigo-400 mb-1" />
                  <span className="block text-xl font-bold text-white leading-tight">{user?.score || 0}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider font-semibold">Rank Points</span>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400 font-medium">Challenges Solved</span>
                  <span className="text-indigo-400 font-bold">{solvedCount} / {totalCount} ({solvedPercentage}%)</span>
                </div>
                
                {/* Visual Progress Bar */}
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                    style={{ width: `${solvedPercentage}%` }}
                  />
                </div>

                {/* Difficulty Breakdown */}
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                    <span className="block text-xs font-semibold text-emerald-400">{easySolved}/{easyTotal}</span>
                    <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Easy</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                    <span className="block text-xs font-semibold text-amber-400">{mediumSolved}/{mediumTotal}</span>
                    <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Medium</span>
                  </div>
                  <div className="bg-white/[0.02] border border-white/5 p-1.5 rounded-lg">
                    <span className="block text-xs font-semibold text-rose-400">{hardSolved}/{hardTotal}</span>
                    <span className="text-[9px] text-gray-500 font-semibold uppercase tracking-wider">Hard</span>
                  </div>
                </div>
              </div>
            </div>

            {/* MOTIVATION / TIP CARD */}
            <div className="glass-card rounded-2xl p-5 border border-white/5 bg-gradient-to-tr from-[#0d121e] to-indigo-950/20">
              <div className="w-8 h-8 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 mb-3">
                <Code className="w-4 h-4" />
              </div>
              <h4 className="text-sm font-semibold text-white">Daily Code Tip</h4>
              <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                When using the AI complexity analyzer, remember that O(1) space is generally preferred. Avoid allocating extra maps or vectors in critical loops if you can solve using binary indicators or two pointers!
              </p>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
