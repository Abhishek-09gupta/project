import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  BarChart3, Plus, Trash2, Calendar, FileText, Settings, 
  Users, Activity, CheckCircle, ShieldAlert, Edit3 
} from 'lucide-react';

export default function AdminAnalytics() {
  const { user } = useAuth();
  
  // Analytics State
  const [stats, setStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [activeTab, setActiveTab] = useState('analytics'); // analytics | problems | contests
  
  // Create/Edit Problem States
  const [editingProblemId, setEditingProblemId] = useState(null);
  const [problemForm, setProblemForm] = useState({
    title: '',
    description: '',
    difficulty: 'Easy',
    companyTags: '',
    timeLimit: 2,
    memoryLimit: 256,
    inputFormat: '',
    outputFormat: '',
    constraints: '',
    sampleInput1: '',
    sampleOutput1: '',
    sampleInput2: '',
    sampleOutput2: '',
    hiddenInput1: '',
    hiddenOutput1: '',
    hiddenInput2: '',
    hiddenOutput2: '',
  });

  // Create Contest States
  const [contestForm, setContestForm] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    selectedProblems: []
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const analyticsData = await api.problems.getAnalytics();
      setStats(analyticsData);

      const problemsList = await api.problems.getAll();
      setProblems(problemsList);
    } catch (err) {
      console.error('Error loading admin console data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Submit problem (Create / Update)
  const handleProblemSubmit = async (e) => {
    e.preventDefault();

    // Map form inputs to database structure
    const sampleTestCases = [];
    if (problemForm.sampleInput1 || problemForm.sampleOutput1) {
      sampleTestCases.push({ input: problemForm.sampleInput1, output: problemForm.sampleOutput1 });
    }
    if (problemForm.sampleInput2 || problemForm.sampleOutput2) {
      sampleTestCases.push({ input: problemForm.sampleInput2, output: problemForm.sampleOutput2 });
    }

    const hiddenTestCases = [];
    if (problemForm.hiddenInput1 || problemForm.hiddenOutput1) {
      hiddenTestCases.push({ input: problemForm.hiddenInput1, output: problemForm.hiddenOutput1 });
    }
    if (problemForm.hiddenInput2 || problemForm.hiddenOutput2) {
      hiddenTestCases.push({ input: problemForm.hiddenInput2, output: problemForm.hiddenOutput2 });
    }

    const payload = {
      title: problemForm.title,
      description: problemForm.description,
      difficulty: problemForm.difficulty,
      companyTags: problemForm.companyTags.split(',').map(tag => tag.trim()).filter(Boolean),
      timeLimit: parseFloat(problemForm.timeLimit),
      memoryLimit: parseInt(problemForm.memoryLimit),
      inputFormat: problemForm.inputFormat,
      outputFormat: problemForm.outputFormat,
      constraints: problemForm.constraints,
      sampleTestCases,
      hiddenTestCases
    };

    try {
      if (editingProblemId) {
        await api.problems.update(editingProblemId, payload);
        alert('Problem updated successfully.');
      } else {
        await api.problems.create(payload);
        alert('Problem created successfully.');
      }
      
      // Reset form
      resetProblemForm();
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save problem.');
    }
  };

  const handleEditProblem = (prob) => {
    setEditingProblemId(prob.id);
    setProblemForm({
      title: prob.title,
      description: prob.description,
      difficulty: prob.difficulty,
      companyTags: (prob.companyTags || []).join(', '),
      timeLimit: prob.timeLimit || 2,
      memoryLimit: prob.memoryLimit || 256,
      inputFormat: prob.inputFormat || '',
      outputFormat: prob.outputFormat || '',
      constraints: prob.constraints || '',
      sampleInput1: prob.sampleTestCases?.[0]?.input || '',
      sampleOutput1: prob.sampleTestCases?.[0]?.output || '',
      sampleInput2: prob.sampleTestCases?.[1]?.input || '',
      sampleOutput2: prob.sampleTestCases?.[1]?.output || '',
      hiddenInput1: prob.hiddenTestCases?.[0]?.input || '',
      hiddenOutput1: prob.hiddenTestCases?.[0]?.output || '',
      hiddenInput2: prob.hiddenTestCases?.[1]?.input || '',
      hiddenOutput2: prob.hiddenTestCases?.[1]?.output || '',
    });
    setActiveTab('problems');
  };

  const handleDeleteProblem = async (probId) => {
    if (window.confirm('Are you sure you want to delete this problem? This action is irreversible.')) {
      try {
        await api.problems.delete(probId);
        alert('Problem deleted successfully.');
        await loadData();
      } catch (err) {
        alert(err.message || 'Failed to delete problem.');
      }
    }
  };

  const resetProblemForm = () => {
    setEditingProblemId(null);
    setProblemForm({
      title: '',
      description: '',
      difficulty: 'Easy',
      companyTags: '',
      timeLimit: 2,
      memoryLimit: 256,
      inputFormat: '',
      outputFormat: '',
      constraints: '',
      sampleInput1: '',
      sampleOutput1: '',
      sampleInput2: '',
      sampleOutput2: '',
      hiddenInput1: '',
      hiddenOutput1: '',
      hiddenInput2: '',
      hiddenOutput2: '',
    });
  };

  // Submit contest
  const handleContestSubmit = async (e) => {
    e.preventDefault();
    if (contestForm.selectedProblems.length === 0) {
      alert('Please select at least one problem for the contest.');
      return;
    }

    const payload = {
      title: contestForm.title,
      description: contestForm.description,
      startTime: new Date(contestForm.startTime).toISOString(),
      endTime: new Date(contestForm.endTime).toISOString(),
      problemIds: contestForm.selectedProblems
    };

    try {
      await api.contests.create(payload);
      alert('Contest created successfully.');
      
      // Reset form
      setContestForm({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        selectedProblems: []
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create contest.');
    }
  };

  const toggleProblemSelection = (probId) => {
    setContestForm(prev => {
      const selected = [...prev.selectedProblems];
      const idx = selected.indexOf(probId);
      if (idx === -1) selected.push(probId);
      else selected.splice(idx, 1);
      return { ...prev, selectedProblems: selected };
    });
  };

  // Math Helpers for Custom SVG Line Chart
  const renderWeeklyActivityChart = () => {
    if (!stats || !stats.weeklyActivity || Object.keys(stats.weeklyActivity).length === 0) {
      return <div className="text-gray-500 text-xs py-8 text-center">No activity recorded this week.</div>;
    }

    const data = Object.entries(stats.weeklyActivity)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-7); // Last 7 days

    const width = 500;
    const height = 180;
    const padding = 30;

    const counts = data.map(d => d.count);
    const maxVal = Math.max(...counts, 5);
    const minVal = 0;

    const points = data.map((d, index) => {
      const x = padding + (index / (data.length - 1 || 1)) * (width - 2 * padding);
      const y = height - padding - ((d.count - minVal) / (maxVal - minVal)) * (height - 2 * padding);
      return { x, y, date: d.date, count: d.count };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Fill path to close the shape for gradient rendering
    const fillPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

    return (
      <div className="relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
          {/* Gradient definition */}
          <defs>
            <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="rgba(255,255,255,0.03)" />
          <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="rgba(255,255,255,0.03)" />
          <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="rgba(255,255,255,0.1)" />

          {/* Paths */}
          {points.length > 0 && (
            <>
              <path d={fillPath} fill="url(#chartGlow)" />
              <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" />
            </>
          )}

          {/* Circles at data points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="4" fill="#080c14" stroke="#6366f1" strokeWidth="2" />
              <circle cx={p.x} cy={p.y} r="8" fill="#6366f1" className="opacity-0 hover:opacity-20 transition-opacity" />
              <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#a5b4fc" className="text-[10px] font-bold font-mono opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                {p.count}
              </text>
            </g>
          ))}

          {/* Axis Labels */}
          {points.map((p, idx) => {
            const dateStr = p.date.substring(5); // MM-DD
            return (
              <text key={idx} x={p.x} y={height - 10} textAnchor="middle" fill="#4b5563" className="text-[9px] font-mono">
                {dateStr}
              </text>
            );
          })}
        </svg>
      </div>
    );
  };

  // Math Helpers for Custom SVG Donut Chart
  const renderDifficultyDonut = () => {
    if (!stats || !stats.difficultyDistribution) return null;

    const { easy = 0, medium = 0, hard = 0 } = stats.difficultyDistribution;
    const total = easy + medium + hard;
    if (total === 0) return <div className="text-gray-500 text-xs py-8 text-center">No problems.</div>;

    const r = 50;
    const circ = 2 * Math.PI * r; // 314.159

    const easyPct = (easy / total) * 100;
    const medPct = (medium / total) * 100;
    const hardPct = (hard / total) * 100;

    const easyDash = (easyPct * circ) / 100;
    const medDash = (medPct * circ) / 100;
    const hardDash = (hardPct * circ) / 100;

    return (
      <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
        <div className="relative w-36 h-36">
          <svg viewBox="0 0 120 120" className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle cx="60" cy="60" r={r} fill="transparent" stroke="rgba(255,255,255,0.03)" strokeWidth="12" />
            
            {/* Easy section */}
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="transparent"
              stroke="#10b981"
              strokeWidth="12"
              strokeDasharray={circ}
              strokeDashoffset={circ - easyDash}
              strokeLinecap="round"
            />
            {/* Medium section */}
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="transparent"
              stroke="#f59e0b"
              strokeWidth="12"
              strokeDasharray={circ}
              strokeDashoffset={circ - medDash}
              transform={`rotate(${(easyPct * 360) / 100} 60 60)`}
              strokeLinecap="round"
            />
            {/* Hard section */}
            <circle
              cx="60"
              cy="60"
              r={r}
              fill="transparent"
              stroke="#ef4444"
              strokeWidth="12"
              strokeDasharray={circ}
              strokeDashoffset={circ - hardDash}
              transform={`rotate(${((easyPct + medPct) * 360) / 100} 60 60)`}
              strokeLinecap="round"
            />
          </svg>
          {/* Inner stats count */}
          <div className="absolute inset-0 flex flex-col items-center justify-center font-sans">
            <span className="text-xl font-extrabold text-white leading-none">{total}</span>
            <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wider mt-1">Total Set</span>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-xs font-sans min-w-[120px]">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-emerald-500 mr-2" />
              <span className="text-gray-400">Easy</span>
            </div>
            <span className="font-bold font-mono text-white">{easy}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-amber-500 mr-2" />
              <span className="text-gray-400">Medium</span>
            </div>
            <span className="font-bold font-mono text-white">{medium}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-rose-500 mr-2" />
              <span className="text-gray-400">Hard</span>
            </div>
            <span className="font-bold font-mono text-white">{hard}</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(screen-4rem)] bg-[#080c14] text-white">
        <div className="w-10 h-10 border-t-2 border-indigo-500 border-r-2 border-r-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 min-h-screen text-white font-sans space-y-8">
      
      {/* Header and navigation tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold font-heading bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
            Admin Panel Console
          </h1>
          <p className="text-gray-400 text-sm mt-1">Platform analytics and management operations</p>
        </div>

        {/* Tab selection */}
        <div className="flex items-center space-x-1.5 bg-white/[0.01] border border-white/5 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'analytics' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 inline mr-1" />
            Analytics
          </button>
          <button
            onClick={() => setActiveTab('problems')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'problems' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5 inline mr-1" />
            Problems Manager
          </button>
          <button
            onClick={() => setActiveTab('contests')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'contests' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5 inline mr-1" />
            Contest Builder
          </button>
        </div>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && stats && (
        <div className="space-y-8">
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <Users className="w-5 h-5 text-indigo-400 mb-3" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Coders</span>
              <span className="block text-2xl font-extrabold text-white mt-1 leading-tight">{stats.totalUsers}</span>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <FileText className="w-5 h-5 text-indigo-400 mb-3" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Total Problems</span>
              <span className="block text-2xl font-extrabold text-white mt-1 leading-tight">{stats.totalProblems}</span>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <Activity className="w-5 h-5 text-indigo-400 mb-3" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Submissions</span>
              <span className="block text-2xl font-extrabold text-white mt-1 leading-tight">{stats.submissions?.total || 0}</span>
            </div>
            <div className="glass-card rounded-2xl p-5 border border-white/5">
              <CheckCircle className="w-5 h-5 text-emerald-400 mb-3" />
              <span className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold">Suite Pass Rate</span>
              <span className="block text-2xl font-extrabold text-emerald-400 mt-1 leading-tight">{stats.submissions?.passRate || 0}%</span>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Chart 1: Difficulty Donut */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">Difficulty Distribution</h3>
              {renderDifficultyDonut()}
            </div>

            {/* Chart 2: Submissions Activity Timeline */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">7-Day Submission Rates</h3>
              {renderWeeklyActivityChart()}
            </div>

            {/* Chart 3: Languages Bar Chart */}
            <div className="glass-card rounded-2xl p-6 border border-white/5 space-y-4 lg:col-span-2">
              <h3 className="text-sm font-extrabold text-white uppercase tracking-wider mb-4">Submission Language Split</h3>
              <div className="space-y-4 font-sans text-xs">
                {Object.entries(stats.topLanguages || {}).map(([lang, count]) => {
                  const total = Object.values(stats.topLanguages || {}).reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return (
                    <div key={lang} className="space-y-1">
                      <div className="flex justify-between font-semibold">
                        <span className="capitalize text-gray-300 font-mono">{lang === 'cpp' ? 'C++' : lang}</span>
                        <span className="text-gray-400">{count} runs ({pct}%)</span>
                      </div>
                      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROBLEMS MANAGER */}
      {activeTab === 'problems' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Problem Form */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-white/5 space-y-6">
            <h3 className="text-lg font-bold font-heading">
              {editingProblemId ? 'Edit Problem Details' : 'Create New Problem'}
            </h3>

            <form onSubmit={problemForm.title ? handleProblemSubmit : (e) => e.preventDefault()} className="space-y-5">
              {/* Row 1: Title & Difficulty */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Problem Title</label>
                  <input
                    type="text"
                    value={problemForm.title}
                    onChange={(e) => setProblemForm({...problemForm, title: e.target.value})}
                    placeholder="e.g. Add Two Numbers"
                    className="w-full glass-input p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Difficulty</label>
                  <select
                    value={problemForm.difficulty}
                    onChange={(e) => setProblemForm({...problemForm, difficulty: e.target.value})}
                    className="w-full glass-input p-2 text-sm bg-[#0d121e]"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Company Tags, Limits */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Company Tags (Comma sep.)</label>
                  <input
                    type="text"
                    value={problemForm.companyTags}
                    onChange={(e) => setProblemForm({...problemForm, companyTags: e.target.value})}
                    placeholder="Google, Amazon"
                    className="w-full glass-input p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Time Limit (Seconds)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={problemForm.timeLimit}
                    onChange={(e) => setProblemForm({...problemForm, timeLimit: e.target.value})}
                    className="w-full glass-input p-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Memory Limit (MB)</label>
                  <input
                    type="number"
                    value={problemForm.memoryLimit}
                    onChange={(e) => setProblemForm({...problemForm, memoryLimit: e.target.value})}
                    className="w-full glass-input p-2 text-sm"
                    required
                  />
                </div>
              </div>

              {/* Row 3: Description */}
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Problem Description</label>
                <textarea
                  value={problemForm.description}
                  onChange={(e) => setProblemForm({...problemForm, description: e.target.value})}
                  placeholder="Describe the problem challenge using clear details and markdown templates..."
                  rows="5"
                  className="w-full glass-input p-3 text-sm"
                  required
                />
              </div>

              {/* Formats and constraints */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Input Format</label>
                  <textarea
                    value={problemForm.inputFormat}
                    onChange={(e) => setProblemForm({...problemForm, inputFormat: e.target.value})}
                    rows="2"
                    className="w-full glass-input p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Output Format</label>
                  <textarea
                    value={problemForm.outputFormat}
                    onChange={(e) => setProblemForm({...problemForm, outputFormat: e.target.value})}
                    rows="2"
                    className="w-full glass-input p-2 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Constraints</label>
                  <textarea
                    value={problemForm.constraints}
                    onChange={(e) => setProblemForm({...problemForm, constraints: e.target.value})}
                    rows="2"
                    className="w-full glass-input p-2 text-xs"
                  />
                </div>
              </div>

              {/* Test Cases Accordion grids */}
              <div className="border-t border-white/5 pt-4 space-y-4">
                <h4 className="text-xs font-bold uppercase text-gray-400 tracking-wider">Test Suite Cases</h4>
                
                <div className="grid grid-cols-2 gap-4">
                  {/* Sample 1 */}
                  <div className="bg-[#05080f]/40 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold mb-2">Sample Case 1</span>
                    <textarea
                      placeholder="Input"
                      value={problemForm.sampleInput1}
                      onChange={(e) => setProblemForm({...problemForm, sampleInput1: e.target.value})}
                      className="w-full glass-input p-2 text-xs font-mono mb-2"
                      rows="2"
                    />
                    <textarea
                      placeholder="Expected Output"
                      value={problemForm.sampleOutput1}
                      onChange={(e) => setProblemForm({...problemForm, sampleOutput1: e.target.value})}
                      className="w-full glass-input p-2 text-xs font-mono"
                      rows="2"
                    />
                  </div>

                  {/* Sample 2 */}
                  <div className="bg-[#05080f]/40 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold mb-2">Sample Case 2</span>
                    <textarea
                      placeholder="Input"
                      value={problemForm.sampleInput2}
                      onChange={(e) => setProblemForm({...problemForm, sampleInput2: e.target.value})}
                      className="w-full glass-input p-2 text-xs font-mono mb-2"
                      rows="2"
                    />
                    <textarea
                      placeholder="Expected Output"
                      value={problemForm.sampleOutput2}
                      onChange={(e) => setProblemForm({...problemForm, sampleOutput2: e.target.value})}
                      className="w-full glass-input p-2 text-xs font-mono"
                      rows="2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Hidden 1 */}
                  <div className="bg-[#05080f]/40 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold mb-2">Hidden Case 1</span>
                    <textarea
                      placeholder="Input"
                      value={problemForm.hiddenInput1}
                      onChange={(e) => setProblemForm({...problemForm, hiddenInput1: e.target.value})}
                      className="w-full glass-input p-2 text-xs font-mono mb-2"
                      rows="2"
                    />
                    <textarea
                      placeholder="Expected Output"
                      value={problemForm.hiddenOutput1}
                      onChange={(e) => setProblemForm({...problemForm, hiddenOutput1: e.target.value})}
                      className="w-full glass-input p-2 text-xs font-mono"
                      rows="2"
                    />
                  </div>

                  {/* Hidden 2 */}
                  <div className="bg-[#05080f]/40 p-3 rounded-xl border border-white/5">
                    <span className="text-[10px] text-gray-500 block uppercase font-bold mb-2">Hidden Case 2</span>
                    <textarea
                      placeholder="Input"
                      value={problemForm.hiddenInput2}
                      onChange={(e) => setProblemForm({...problemForm, hiddenInput2: e.target.value})}
                      className="w-full glass-input p-2 text-xs font-mono mb-2"
                      rows="2"
                    />
                    <textarea
                      placeholder="Expected Output"
                      value={problemForm.hiddenOutput2}
                      onChange={(e) => setProblemForm({...problemForm, hiddenOutput2: e.target.value})}
                      className="w-full glass-input p-2 text-xs font-mono"
                      rows="2"
                    />
                  </div>
                </div>
              </div>

              {/* Actions footer */}
              <div className="flex justify-end space-x-3 pt-4 border-t border-white/5">
                {editingProblemId && (
                  <button
                    type="button"
                    onClick={resetProblemForm}
                    className="px-4 py-2 border border-white/10 hover:bg-white/5 text-xs font-semibold rounded-lg"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={!problemForm.title}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg shadow-md"
                >
                  {editingProblemId ? 'Update Problem' : 'Create Problem'}
                </button>
              </div>
            </form>
          </div>

          {/* Right: Existing Problems list */}
          <div className="glass-card rounded-2xl p-6 border border-white/5 flex flex-col h-[650px]">
            <h3 className="text-lg font-bold font-heading mb-4">Platform Problems</h3>
            <div className="flex-grow overflow-y-auto space-y-3 scrollbar-thin">
              {problems.map((prob) => (
                <div key={prob.id} className="bg-[#05080f]/40 border border-white/5 p-3 rounded-xl flex items-center justify-between">
                  <div className="min-w-0 pr-2">
                    <h4 className="font-semibold text-white text-xs truncate">{prob.title}</h4>
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider font-semibold">{prob.difficulty}</span>
                  </div>
                  
                  <div className="flex items-center space-x-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleEditProblem(prob)}
                      className="p-1.5 hover:bg-white/5 text-indigo-400 hover:text-indigo-300 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteProblem(prob.id)}
                      className="p-1.5 hover:bg-white/5 text-rose-400 hover:text-rose-300 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONTEST BUILDER */}
      {activeTab === 'contests' && (
        <div className="glass-card rounded-2xl p-6 border border-white/5 max-w-4xl mx-auto space-y-6">
          <h3 className="text-lg font-bold font-heading flex items-center space-x-2">
            <Plus className="w-5 h-5 text-indigo-400" />
            <span>Schedule New Contest</span>
          </h3>

          <form onSubmit={contestForm.title ? handleContestSubmit : (e) => e.preventDefault()} className="space-y-5">
            {/* Contest Title */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Contest Title</label>
              <input
                type="text"
                value={contestForm.title}
                onChange={(e) => setContestForm({...contestForm, title: e.target.value})}
                placeholder="e.g. Weekly Hackathon - Division 1"
                className="w-full glass-input p-2 text-sm"
                required
              />
            </div>

            {/* Contest Description */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Description</label>
              <textarea
                value={contestForm.description}
                onChange={(e) => setContestForm({...contestForm, description: e.target.value})}
                placeholder="Describe rules, grading constraints, or guidelines..."
                rows="3"
                className="w-full glass-input p-3 text-sm"
              />
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={contestForm.startTime}
                  onChange={(e) => setContestForm({...contestForm, startTime: e.target.value})}
                  className="w-full glass-input p-2 text-sm bg-[#0d121e]"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">End Date & Time</label>
                <input
                  type="datetime-local"
                  value={contestForm.endTime}
                  onChange={(e) => setContestForm({...contestForm, endTime: e.target.value})}
                  className="w-full glass-input p-2 text-sm bg-[#0d121e]"
                  required
                />
              </div>
            </div>

            {/* Problem Selection checklist */}
            <div className="space-y-2">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">Select Problems (Min 1)</label>
              
              <div className="border border-white/5 bg-[#05080f]/40 p-4 rounded-xl max-h-52 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 gap-3 scrollbar-thin">
                {problems.map((prob) => {
                  const isChecked = contestForm.selectedProblems.includes(prob.id);
                  return (
                    <label
                      key={prob.id}
                      className={`flex items-center space-x-2.5 p-2 rounded-lg border transition-all cursor-pointer select-none text-xs ${
                        isChecked 
                          ? 'border-indigo-500/30 bg-indigo-500/5 text-indigo-400' 
                          : 'border-white/5 hover:bg-white/[0.02] text-gray-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleProblemSelection(prob.id)}
                        className="rounded border-white/10 text-indigo-600 focus:ring-indigo-500 bg-transparent"
                      />
                      <span className="truncate">{prob.title}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={!contestForm.title || contestForm.selectedProblems.length === 0}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg shadow-md disabled:opacity-50"
              >
                Schedule Contest
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
