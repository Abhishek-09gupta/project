import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { useAuth } from '../context/AuthContext';
import { api } from '../utils/api';
import { 
  Play, Send, Brain, Sparkles, MessageSquare, History, FileText, 
  Terminal, ShieldAlert, CheckCircle, AlertCircle, X, ChevronRight, HelpCircle 
} from 'lucide-react';

export default function ProblemArena() {
  const { id: problemId } = useParams();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();

  // Load problem details
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Code Editor states
  const [language, setLanguage] = useState('python');
  const [code, setCode] = useState('');
  
  // Layout tabs
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  
  // Console Drawer states
  const [customInput, setCustomInput] = useState('');
  const [consoleResult, setConsoleResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitVerdict, setSubmitVerdict] = useState(null);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [activeConsoleTab, setActiveConsoleTab] = useState('input');

  // Discussions state
  const [discussions, setDiscussions] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [postingComment, setPostingComment] = useState(false);

  // Submissions state
  const [submissionsHistory, setSubmissionsHistory] = useState([]);

  // AI assistant state
  const [aiHint, setAiHint] = useState('');
  const [requestingHint, setRequestingHint] = useState(false);
  const [aiComplexity, setAiComplexity] = useState(null);
  const [requestingComplexity, setRequestingComplexity] = useState(false);

  // Poll reference for cleanups
  const pollIntervalRef = useRef(null);

  // Load problem statement
  useEffect(() => {
    async function loadProblem() {
      try {
        setLoading(true);
        const data = await api.problems.getById(problemId);
        setProblem(data);
        
        // Load initial template code based on default language
        if (data.templateCode && data.templateCode.python) {
          setCode(data.templateCode.python);
        } else {
          setCode('# Write your Python code here\n');
        }
      } catch (err) {
        console.error('Error loading problem details:', err);
      } finally {
        setLoading(false);
      }
    }
    loadProblem();
    
    // Cleanup polling interval if open
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [problemId]);

  // Load discussions or submissions when changing tabs
  useEffect(() => {
    if (activeLeftTab === 'discussion') {
      loadDiscussions();
    } else if (activeLeftTab === 'submissions') {
      loadSubmissionsHistory();
    }
  }, [activeLeftTab]);

  const loadDiscussions = async () => {
    try {
      const data = await api.discussions.getByProblem(problemId);
      setDiscussions(data);
    } catch (err) {
      console.error('Error loading discussions:', err);
    }
  };

  const loadSubmissionsHistory = async () => {
    try {
      const data = await api.submissions.getAll({ problemId, userId: user.id });
      setSubmissionsHistory(data);
    } catch (err) {
      console.error('Error loading submissions history:', err);
    }
  };

  // Switch languages and load template
  const handleLanguageChange = (lang) => {
    setLanguage(lang);
    if (problem && problem.templateCode && problem.templateCode[lang]) {
      setCode(problem.templateCode[lang]);
    } else {
      setCode(
        lang === 'cpp' 
          ? '// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    return 0;\n}'
          : lang === 'java'
          ? '// Keep the class public as Solution\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n    }\n}'
          : '# Write your Python code here\n'
      );
    }
  };

  // Run code against a single sample / custom test case
  const handleRunCode = async () => {
    setIsRunning(true);
    setConsoleOpen(true);
    setActiveConsoleTab('result');
    setConsoleResult({ verdict: 'Running...', output: 'Executing environment run...' });
    
    try {
      const result = await api.submissions.run(problemId, language, code, customInput);
      setConsoleResult(result);
    } catch (err) {
      setConsoleResult({
        verdict: 'Runtime Error',
        errorMessage: err.message || 'Execution request failed.'
      });
    } finally {
      setIsRunning(false);
    }
  };

  // Submit code for complete test suite grading (asynchronous polling)
  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    setConsoleOpen(true);
    setActiveConsoleTab('result');
    setSubmitVerdict('Pending');
    setConsoleResult({ verdict: 'Queueing...', output: 'Sending job to evaluation queue...' });

    try {
      const queueResponse = await api.submissions.submit(problemId, language, code);
      const submissionId = queueResponse.submissionId;

      // Start polling status
      pollIntervalRef.current = setInterval(async () => {
        try {
          const subDetails = await api.submissions.getById(submissionId);
          
          if (subDetails.verdict === 'Pending' || subDetails.verdict === 'Processing') {
            setSubmitVerdict(subDetails.verdict);
            setConsoleResult({ verdict: subDetails.verdict, output: 'Evaluating test suite...' });
          } else {
            // Processing complete
            clearInterval(pollIntervalRef.current);
            setSubmitVerdict(subDetails.verdict);
            setConsoleResult({
              verdict: subDetails.verdict,
              time: subDetails.time,
              memory: subDetails.memory,
              errorMessage: subDetails.errorMessage,
              output: subDetails.verdict === 'Accepted' ? 'All test cases passed successfully!' : subDetails.errorMessage
            });
            setIsSubmitting(false);
            
            // Refresh stats to fetch score/streaks
            await refreshProfile();
            
            // Reload submission list if currently active
            if (activeLeftTab === 'submissions') loadSubmissionsHistory();
          }
        } catch (err) {
          clearInterval(pollIntervalRef.current);
          setConsoleResult({ verdict: 'Error', errorMessage: 'Status query failed: ' + err.message });
          setIsSubmitting(false);
        }
      }, 1000);

    } catch (err) {
      setConsoleResult({
        verdict: 'Runtime Error',
        errorMessage: err.message || 'Submission queue request failed.'
      });
      setIsSubmitting(false);
    }
  };

  // Submit new comment
  const handlePostComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setPostingComment(true);
    try {
      await api.discussions.create(problemId, newComment);
      setNewComment('');
      await loadDiscussions();
    } catch (err) {
      console.error('Error posting comment:', err);
    } finally {
      setPostingComment(false);
    }
  };

  // AI Hint Trigger
  const handleGetAIHint = async () => {
    setRequestingHint(true);
    setAiHint('');
    try {
      const data = await api.submissions.getAIHint(problemId, language, code);
      setAiHint(data.hint);
    } catch (err) {
      setAiHint('AI Hint system is currently busy. Please try again in a few moments.');
    } finally {
      setRequestingHint(false);
    }
  };

  // AI Complexity Trigger
  const handleGetAIComplexity = async () => {
    setRequestingComplexity(true);
    setAiComplexity(null);
    try {
      const data = await api.submissions.getAIComplexity(problemId, language, code);
      setAiComplexity(data);
    } catch (err) {
      setAiComplexity({
        timeComplexity: 'Unable to analyze',
        timeExplanation: 'Error communicating with AI services.',
        spaceComplexity: 'N/A'
      });
    } finally {
      setRequestingComplexity(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[calc(screen-4rem)] bg-[#080c14] text-white">
        <div className="w-10 h-10 border-t-2 border-indigo-500 border-r-2 border-r-transparent animate-spin rounded-full"></div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-white">
        <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold font-heading">Problem Not Found</h2>
        <p className="text-gray-400 mt-2">The problem ID might be incorrect or removed.</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-4 py-2 bg-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-500">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] bg-[#080c14] text-white grid grid-cols-1 lg:grid-cols-2 overflow-hidden font-sans border-t border-white/5">
      {/* LEFT PANE: DESCRIPTION, DISCUSSION, SUBMISSIONS, AI ASSISTANT */}
      <div className="flex flex-col h-full border-r border-white/5 bg-[#0b0f19]">
        {/* Left Pane Headers */}
        <div className="flex items-center space-x-1 border-b border-white/5 bg-white/[0.01] px-4 h-12 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveLeftTab('description')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeLeftTab === 'description' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Description</span>
          </button>
          <button
            onClick={() => setActiveLeftTab('discussion')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeLeftTab === 'discussion' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Discussion</span>
          </button>
          <button
            onClick={() => setActiveLeftTab('submissions')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeLeftTab === 'submissions' ? 'bg-indigo-600/10 border border-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Submissions</span>
          </button>
          <button
            onClick={() => setActiveLeftTab('ai')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeLeftTab === 'ai' ? 'bg-indigo-600/15 border border-indigo-500/30 text-indigo-300 shadow-[0_0_15px_rgba(99,102,241,0.08)]' : 'text-indigo-400/80 hover:text-white'
            }`}
          >
            <Brain className="w-3.5 h-3.5 fill-indigo-400/10" />
            <span>AI Assistant</span>
          </button>
        </div>

        {/* Tab Content Box */}
        <div className="flex-grow overflow-y-auto p-6 scrollbar-thin">
          
          {/* TAB 1: PROBLEM DESCRIPTION */}
          {activeLeftTab === 'description' && (
            <div className="space-y-6">
              <div>
                <h1 className="text-2xl font-bold font-heading tracking-tight">{problem.title}</h1>
                <div className="flex items-center space-x-3 mt-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                    problem.difficulty.toLowerCase() === 'easy' ? 'text-emerald-400 bg-emerald-400/10 border-emerald-500/20' :
                    problem.difficulty.toLowerCase() === 'medium' ? 'text-amber-400 bg-amber-400/10 border-amber-500/20' :
                    'text-rose-400 bg-rose-400/10 border-rose-500/20'
                  }`}>
                    {problem.difficulty}
                  </span>
                  
                  {problem.companyTags && problem.companyTags.map(tag => (
                    <span key={tag} className="text-[10px] font-semibold bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-gray-400">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Description Body */}
              <div className="text-gray-300 text-sm leading-relaxed whitespace-pre-wrap font-sans border-t border-white/5 pt-4">
                {problem.description}
              </div>

              {/* Input Format */}
              {problem.inputFormat && (
                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Input Format</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{problem.inputFormat}</p>
                </div>
              )}

              {/* Output Format */}
              {problem.outputFormat && (
                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Output Format</h3>
                  <p className="text-gray-300 text-sm leading-relaxed">{problem.outputFormat}</p>
                </div>
              )}

              {/* Constraints */}
              {problem.constraints && (
                <div className="border-t border-white/5 pt-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">Constraints</h3>
                  <pre className="bg-[#05080f] p-3 rounded-xl border border-white/5 text-gray-300 text-xs font-mono whitespace-pre-wrap">
                    {problem.constraints}
                  </pre>
                </div>
              )}

              {/* Sample Test Cases */}
              {problem.sampleTestCases && problem.sampleTestCases.length > 0 && (
                <div className="border-t border-white/5 pt-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400">Sample Cases</h3>
                  {problem.sampleTestCases.map((tc, index) => (
                    <div key={index} className="bg-[#05080f] rounded-xl border border-white/5 overflow-hidden">
                      <div className="bg-white/[0.02] px-4 py-2 border-b border-white/5 flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-400">Sample Case {index + 1}</span>
                        <button 
                          onClick={() => {
                            setCustomInput(tc.input);
                            setActiveConsoleTab('input');
                            setConsoleOpen(true);
                          }}
                          className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold uppercase tracking-wider"
                        >
                          Use Input
                        </button>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-4 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-sans font-semibold mb-1">Input</span>
                          <pre className="text-gray-300 whitespace-pre-wrap">{tc.input}</pre>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-sans font-semibold mb-1">Output</span>
                          <pre className="text-gray-300 whitespace-pre-wrap">{tc.output}</pre>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: DISCUSSION */}
          {activeLeftTab === 'discussion' && (
            <div className="space-y-6">
              <h2 className="text-lg font-bold font-heading">Comments & Discussion</h2>

              {/* Input for new comment */}
              <form onSubmit={handlePostComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share details, ask questions, or provide hints..."
                  rows="3"
                  className="w-full glass-input p-3 text-sm"
                  required
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={postingComment || !newComment.trim()}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-md"
                  >
                    <span>Post Comment</span>
                  </button>
                </div>
              </form>

              {/* Discussions List */}
              <div className="space-y-4 border-t border-white/5 pt-6">
                {discussions.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-6">No discussions yet. Be the first to start the thread!</p>
                ) : (
                  discussions.map((disc) => (
                    <div key={disc.id} className="bg-[#05080f]/40 border border-white/5 p-4 rounded-xl relative">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-600/40 flex items-center justify-center text-xs text-indigo-300 uppercase font-bold select-none">
                            {disc.username.charAt(0)}
                          </div>
                          <span className="text-xs font-semibold text-gray-300">{disc.username}</span>
                        </div>
                        <span className="text-[10px] text-gray-500">
                          {new Date(disc.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                        </span>
                      </div>
                      <p className="text-gray-300 text-xs leading-relaxed whitespace-pre-wrap">{disc.comment}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SUBMISSIONS HISTORY */}
          {activeLeftTab === 'submissions' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold font-heading mb-4">Your Past Submissions</h2>
              
              {submissionsHistory.length === 0 ? (
                <p className="text-sm text-gray-500 text-center py-6">No submissions recorded for this problem yet.</p>
              ) : (
                <div className="space-y-3">
                  {submissionsHistory.map((sub) => {
                    let verdictColor = 'text-gray-400 bg-gray-400/5 border-gray-400/10';
                    if (sub.verdict === 'Accepted') verdictColor = 'text-emerald-400 bg-emerald-400/5 border-emerald-500/10';
                    else if (sub.verdict === 'Wrong Answer') verdictColor = 'text-rose-400 bg-rose-400/5 border-rose-500/10';
                    else if (sub.verdict === 'Compile Error' || sub.verdict === 'Runtime Error') verdictColor = 'text-amber-400 bg-amber-400/5 border-amber-500/10';
                    
                    return (
                      <div key={sub.id} className="bg-[#05080f]/40 border border-white/5 p-4 rounded-xl flex items-center justify-between hover:bg-[#05080f]/80 transition-colors">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${verdictColor}`}>
                              {sub.verdict}
                            </span>
                            <span className="text-xs text-gray-400 font-mono capitalize">({sub.language})</span>
                          </div>
                          <div className="text-[10px] text-gray-500 mt-1.5">
                            {new Date(sub.createdAt).toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                          </div>
                        </div>

                        <div className="text-right flex items-center space-x-4">
                          <div className="font-mono text-xs text-gray-400 space-y-0.5">
                            <span className="block">{sub.time || 0} ms</span>
                            <span className="block text-[10px] text-gray-500">{sub.memory || 0} MB</span>
                          </div>
                          <button
                            onClick={() => {
                              if (window.confirm('Do you want to load this submitted code into your editor? Any unsaved edits will be replaced.')) {
                                setCode(sub.code);
                                setLanguage(sub.language);
                              }
                            }}
                            className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                          >
                            Load Code
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: AI ASSISTANT */}
          {activeLeftTab === 'ai' && (
            <div className="space-y-6">
              <div className="flex items-center space-x-2 text-indigo-400 border-b border-indigo-500/20 pb-3">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h2 className="text-base font-extrabold font-heading text-white">Gemini AI Assistant</h2>
              </div>
              <p className="text-xs text-gray-400 leading-relaxed">
                Utilize AI models to gain architectural insights, identify logic leaks, or view complexity forecasts without giving away the direct answers.
              </p>

              {/* Option Cards */}
              <div className="grid grid-cols-2 gap-4 pt-2">
                {/* 1. Complexity */}
                <button
                  onClick={handleGetAIComplexity}
                  disabled={requestingComplexity}
                  className="glass-card-interactive p-4 rounded-xl text-left border border-white/5 bg-[#05080f]/40 relative overflow-hidden group cursor-pointer"
                >
                  <div className="w-7 h-7 bg-indigo-500/10 rounded-lg flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform mb-3">
                    <Brain className="w-4 h-4 text-indigo-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Complexity</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Analyze runtime / spatial limits</p>
                </button>

                {/* 2. Hint */}
                <button
                  onClick={handleGetAIHint}
                  disabled={requestingHint}
                  className="glass-card-interactive p-4 rounded-xl text-left border border-white/5 bg-[#05080f]/40 relative overflow-hidden group cursor-pointer"
                >
                  <div className="w-7 h-7 bg-purple-500/10 rounded-lg flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform mb-3">
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  </div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Get Hint</h4>
                  <p className="text-[10px] text-gray-500 mt-1">Guiding steps without code dumps</p>
                </button>
              </div>

              {/* AI Content Display Boxes */}
              
              {/* Complexity result */}
              {(requestingComplexity || aiComplexity) && (
                <div className="bg-[#05080f] rounded-xl border border-white/5 p-4 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Complexity Analysis</span>
                    {requestingComplexity && (
                      <div className="w-3.5 h-3.5 border-t-2 border-indigo-400 rounded-full animate-spin"></div>
                    )}
                  </div>

                  {aiComplexity && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center">
                          <span className="text-[10px] text-gray-500 block uppercase font-semibold">Time Complexity</span>
                          <span className="text-sm font-mono font-bold text-indigo-400">{aiComplexity.timeComplexity}</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 p-2 rounded-lg text-center">
                          <span className="text-[10px] text-gray-500 block uppercase font-semibold">Space Complexity</span>
                          <span className="text-sm font-mono font-bold text-purple-400">{aiComplexity.spaceComplexity}</span>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <span className="text-gray-400 font-semibold block">Time Explanation:</span>
                          <p className="text-gray-300 leading-relaxed mt-0.5">{aiComplexity.timeExplanation}</p>
                        </div>
                        {aiComplexity.spaceExplanation && (
                          <div className="pt-2 border-t border-white/5">
                            <span className="text-gray-400 font-semibold block">Space Explanation:</span>
                            <p className="text-gray-300 leading-relaxed mt-0.5">{aiComplexity.spaceExplanation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Hint result */}
              {(requestingHint || aiHint) && (
                <div className="bg-[#05080f] rounded-xl border border-white/5 p-4 space-y-2 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Helpful Hint</span>
                    {requestingHint && (
                      <div className="w-3.5 h-3.5 border-t-2 border-purple-400 rounded-full animate-spin"></div>
                    )}
                  </div>
                  {aiHint && (
                    <p className="text-gray-300 text-xs leading-relaxed font-sans bg-white/[0.01] border border-white/5 p-3 rounded-lg border-l-2 border-l-purple-500">
                      {aiHint}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* RIGHT PANE: CODE EDITOR & OUTPUT CONSOLE */}
      <div className="flex flex-col h-full bg-[#080c14] relative">
        
        {/* Editor Settings Toolbar */}
        <div className="flex items-center justify-between border-b border-white/5 bg-[#0b0f19] px-4 h-12">
          {/* Language Selector */}
          <div className="flex items-center space-x-2">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="glass-input px-2.5 py-1 text-xs bg-[#0d121e] cursor-pointer"
            >
              <option value="python">Python 3</option>
              <option value="cpp">C++ 17</option>
              <option value="java">Java 11</option>
            </select>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center space-x-2">
            {/* Run Button */}
            <button
              onClick={handleRunCode}
              disabled={isRunning || isSubmitting}
              className="px-3.5 py-1 bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold rounded-lg flex items-center space-x-1 transition-all disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 text-indigo-400 fill-indigo-400/25" />
              <span>Run Code</span>
            </button>

            {/* Submit Button */}
            <button
              onClick={handleSubmitCode}
              disabled={isRunning || isSubmitting}
              className="px-3.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold rounded-lg flex items-center space-x-1.5 transition-all shadow-md shadow-indigo-600/10 disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5 text-white" />
              <span>Submit</span>
            </button>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-grow relative h-[45%]">
          <Editor
            height="100%"
            language={language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : 'python'}
            theme="vs-dark"
            value={code}
            onChange={(val) => setCode(val || '')}
            options={{
              fontSize: 14,
              fontFamily: "'Fira Code', 'Courier New', monospace",
              minimap: { enabled: false },
              automaticLayout: true,
              scrollbar: {
                vertical: 'visible',
                horizontal: 'visible',
                verticalScrollbarSize: 8,
                horizontalScrollbarSize: 8
              },
              cursorBlinking: 'smooth',
              cursorSmoothCaretAnimation: 'on',
              lineHeight: 20,
              padding: { top: 12, bottom: 12 }
            }}
          />
        </div>

        {/* Console Drawer Panel */}
        <div className={`border-t border-white/5 bg-[#0b0f19] flex flex-col transition-all duration-300 ${
          consoleOpen ? 'h-[40%]' : 'h-10'
        }`}>
          {/* Console Header Tabs */}
          <div className="flex items-center justify-between px-4 h-10 border-b border-white/5 bg-white/[0.01]">
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  setConsoleOpen(true);
                  setActiveConsoleTab('input');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  consoleOpen && activeConsoleTab === 'input' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5" />
                <span>Testcase Input</span>
              </button>
              <button
                onClick={() => {
                  setConsoleOpen(true);
                  setActiveConsoleTab('result');
                }}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  consoleOpen && activeConsoleTab === 'result' ? 'bg-white/5 text-white' : 'text-gray-400 hover:text-white'
                }`}
              >
                <span>Result Console</span>
              </button>
            </div>
            
            {/* Toggle Drawer Button */}
            <button
              onClick={() => setConsoleOpen(!consoleOpen)}
              className="text-xs text-gray-500 hover:text-white font-medium"
            >
              {consoleOpen ? 'Hide Drawer' : 'Show Drawer'}
            </button>
          </div>

          {/* Console Content Box */}
          {consoleOpen && (
            <div className="flex-grow overflow-y-auto p-4 scrollbar-thin">
              {/* CASE 1: INPUT BOX */}
              {activeConsoleTab === 'input' && (
                <div className="h-full flex flex-col">
                  <span className="text-[10px] text-gray-500 block uppercase font-semibold mb-2">Custom Input (Standard Input)</span>
                  <textarea
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    placeholder="Provide standard inputs here (one per line)..."
                    className="w-full flex-grow glass-input p-3 text-xs font-mono resize-none bg-[#05080f]/50"
                  />
                </div>
              )}

              {/* CASE 2: RESULT BOX */}
              {activeConsoleTab === 'result' && (
                <div className="space-y-4 font-mono text-xs">
                  {consoleResult ? (
                    <div>
                      {/* Verdict Banner */}
                      <div className="flex items-center space-x-2.5 mb-3 bg-[#05080f] border border-white/5 p-3 rounded-xl">
                        {consoleResult.verdict === 'Accepted' ? (
                          <CheckCircle className="w-5 h-5 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.2)]" />
                        ) : consoleResult.verdict === 'Running...' || consoleResult.verdict === 'Queueing...' || consoleResult.verdict === 'Processing' ? (
                          <div className="w-5 h-5 border-t-2 border-indigo-400 rounded-full animate-spin"></div>
                        ) : (
                          <AlertCircle className="w-5 h-5 text-rose-500" />
                        )}
                        <div>
                          <div className="font-sans font-bold text-white text-sm">
                            {consoleResult.verdict}
                          </div>
                          {/* Display limits if completed */}
                          {(consoleResult.time !== undefined || consoleResult.memory !== undefined) && (
                            <div className="text-[10px] text-gray-500 mt-0.5">
                              Execution completed in {consoleResult.time || 0} ms | RAM usage: {consoleResult.memory || 0} MB
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Execution Details / Output / Error logs */}
                      <div className="space-y-3">
                        {/* Error logs */}
                        {consoleResult.errorMessage && (
                          <div className="bg-rose-500/5 border border-rose-500/10 p-3 rounded-xl">
                            <span className="text-[10px] text-rose-400 block font-sans font-bold uppercase tracking-wider mb-1">Diagnostic Output</span>
                            <pre className="text-rose-300 whitespace-pre-wrap font-mono leading-relaxed">{consoleResult.errorMessage}</pre>
                          </div>
                        )}

                        {/* Standard Output */}
                        {consoleResult.output !== undefined && !consoleResult.errorMessage && (
                          <div className="bg-[#05080f] border border-white/5 p-3 rounded-xl">
                            <span className="text-[10px] text-gray-500 block font-sans font-bold uppercase tracking-wider mb-1">Console Output</span>
                            <pre className="text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">{consoleResult.output || '(No stdout text returned)'}</pre>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-8 text-gray-500">
                      <HelpCircle className="w-8 h-8 text-gray-600 mb-2" />
                      <p>Run or Submit code to view test case diagnostics.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
