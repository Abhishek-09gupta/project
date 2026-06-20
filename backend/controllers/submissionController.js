import { db } from '../db.js';
import { submissionQueue } from '../queue.js';
import { judge } from '../judge.js';
import { aiService } from '../ai.js';

export const submissionController = {
  // Submit code for grading (Asynchronous)
  async submitCode(req, res) {
    try {
      const { problemId, language, code } = req.body;

      if (!problemId || !language || !code) {
        return res.status(400).json({ message: 'ProblemId, language, and code are required.' });
      }

      // 1. Fetch problem
      const problem = await db.problems.findOne({ id: problemId });
      if (!problem) {
        return res.status(404).json({ message: 'Problem not found.' });
      }

      // 2. Create database submission entry
      const submission = await db.submissions.create({
        userId: req.user.id,
        username: req.user.username,
        problemId,
        problemTitle: problem.title,
        language,
        code,
        verdict: 'Pending',
        time: 0,
        memory: 0,
        errorMessage: ''
      });

      // 3. Queue job
      submissionQueue.addJob(submission.id);

      res.status(202).json({
        message: 'Submission queued successfully.',
        submissionId: submission.id
      });
    } catch (err) {
      console.error('Submit code error:', err);
      res.status(500).json({ message: 'Server error processing submission.' });
    }
  },

  // Run code against custom or sample inputs (Synchronous)
  async runCode(req, res) {
    try {
      const { problemId, language, code, customInput } = req.body;

      if (!problemId || !language || !code) {
        return res.status(400).json({ message: 'ProblemId, language, and code are required.' });
      }

      // 1. Fetch problem
      const problem = await db.problems.findOne({ id: problemId });
      if (!problem) {
        return res.status(404).json({ message: 'Problem not found.' });
      }

      // 2. Setup a mock problem with just one test case (either custom or first sample case)
      let testInput = customInput;
      let expectedOutput = '';
      
      if (testInput === undefined || testInput === null) {
        const sampleCase = problem.sampleTestCases[0] || { input: '', output: '' };
        testInput = sampleCase.input;
        expectedOutput = sampleCase.output;
      }

      const mockProblem = {
        ...problem,
        sampleTestCases: [{ input: testInput, output: expectedOutput }],
        hiddenTestCases: [] // Strip hidden test cases for visual execution runs
      };

      const mockSubmission = { language, code };

      // 3. Run the judge synchronously
      const result = await judge.evaluate(mockSubmission, mockProblem);

      res.json({
        verdict: result.verdict,
        time: result.time,
        memory: result.memory,
        errorMessage: result.errorMessage,
        output: result.errorMessage && result.verdict !== 'Wrong Answer' ? '' : result.errorMessage.includes('Actual:') ? result.errorMessage.split('Actual:')[1].trim() : 'Execution completed.'
      });
    } catch (err) {
      console.error('Run code error:', err);
      res.status(500).json({ message: 'Server error executing code.' });
    }
  },

  // Get all submissions with optional filters
  async getAllSubmissions(req, res) {
    try {
      const { problemId, userId, language } = req.query;
      const query = {};
      
      if (problemId) query.problemId = problemId;
      if (userId) query.userId = userId;
      if (language) query.language = language;

      const submissions = await db.submissions.find(query);
      
      // Sort newest first
      const sorted = submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(sorted);
    } catch (err) {
      console.error('Fetch submissions error:', err);
      res.status(500).json({ message: 'Server error fetching submissions.' });
    }
  },

  // Get specific submission details
  async getSubmissionById(req, res) {
    try {
      const submission = await db.submissions.findOne({ id: req.params.id });
      if (!submission) {
        return res.status(404).json({ message: 'Submission not found.' });
      }

      // Only allow owner or admin to read code
      const isOwner = req.user && req.user.id === submission.userId;
      const isAdmin = req.user && (req.user.username.toLowerCase() === 'admin' || req.user.email === 'admin@codejudge.com');

      if (!isOwner && !isAdmin) {
        // Obfuscate code for other users
        const obfuscated = { ...submission, code: '// Source code is private' };
        return res.json(obfuscated);
      }

      res.json(submission);
    } catch (err) {
      console.error('Fetch submission details error:', err);
      res.status(500).json({ message: 'Server error fetching submission details.' });
    }
  },

  // Get AI Hint (Requires auth)
  async getAIHint(req, res) {
    try {
      const { problemId, language, code } = req.body;

      if (!problemId || !code) {
        return res.status(400).json({ message: 'ProblemId and code are required.' });
      }

      const problem = await db.problems.findOne({ id: problemId });
      if (!problem) {
        return res.status(404).json({ message: 'Problem not found.' });
      }

      const hint = await aiService.getHint(problem.title, problem.description, code, language || 'python');
      res.json({ hint });
    } catch (err) {
      console.error('AI hint generation error:', err);
      res.status(500).json({ message: 'Server error generating AI hint.' });
    }
  },

  // Get AI Complexity Analysis (Requires auth)
  async getAIComplexity(req, res) {
    try {
      const { problemId, language, code } = req.body;

      if (!problemId || !code) {
        return res.status(400).json({ message: 'ProblemId and code are required.' });
      }

      const problem = await db.problems.findOne({ id: problemId });
      if (!problem) {
        return res.status(404).json({ message: 'Problem not found.' });
      }

      const analysis = await aiService.getComplexity(problem.title, code, language || 'python');
      res.json(analysis);
    } catch (err) {
      console.error('AI complexity analysis error:', err);
      res.status(500).json({ message: 'Server error analyzing code complexity.' });
    }
  }
};
