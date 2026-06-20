import { db } from '../db.js';

export const problemController = {
  // Create a problem (Admin only)
  async createProblem(req, res) {
    try {
      const {
        title,
        description,
        inputFormat,
        outputFormat,
        constraints,
        difficulty,
        companyTags,
        timeLimit,
        memoryLimit,
        sampleTestCases,
        hiddenTestCases,
        templateCode
      } = req.body;

      if (!title || !description || !difficulty) {
        return res.status(400).json({ message: 'Title, description, and difficulty are required.' });
      }

      const problem = await db.problems.create({
        title,
        description,
        inputFormat: inputFormat || '',
        outputFormat: outputFormat || '',
        constraints: constraints || '',
        difficulty,
        companyTags: Array.isArray(companyTags) ? companyTags : [],
        timeLimit: parseFloat(timeLimit) || 2, // in seconds
        memoryLimit: parseInt(memoryLimit) || 256, // in MB
        sampleTestCases: sampleTestCases || [],
        hiddenTestCases: hiddenTestCases || [],
        templateCode: templateCode || {
          cpp: '// Write your C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Read input and write output\n    return 0;\n}',
          java: '// Keep the class public as Solution\nimport java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Read input and write output\n    }\n}',
          python: '# Write your Python code here\nimport sys\n\ndef main():\n    # Read input and write output\n    pass\n\nif __name__ == "__main__":\n    main()'
        }
      });

      res.status(201).json(problem);
    } catch (err) {
      console.error('Create problem error:', err);
      res.status(500).json({ message: 'Server error creating problem.' });
    }
  },

  // Get all problems (returns public details, strips hidden test cases)
  async getAllProblems(req, res) {
    try {
      const problems = await db.problems.find({});
      
      // Map problems to omit hidden test cases for security
      const publicProblems = problems.map(({ hiddenTestCases: _, ...p }) => p);
      
      res.json(publicProblems);
    } catch (err) {
      console.error('Fetch problems error:', err);
      res.status(500).json({ message: 'Server error fetching problems.' });
    }
  },

  // Get problem by ID
  async getProblemById(req, res) {
    try {
      const problem = await db.problems.findOne({ id: req.params.id });
      if (!problem) {
        return res.status(404).json({ message: 'Problem not found.' });
      }

      // If user is Admin, we can send hidden test cases, otherwise strip them
      const isAdmin = req.user && (req.user.username.toLowerCase() === 'admin' || req.user.email === 'admin@codejudge.com');
      
      if (!isAdmin) {
        const { hiddenTestCases: _, ...publicProblem } = problem;
        return res.json(publicProblem);
      }

      res.json(problem);
    } catch (err) {
      console.error('Fetch problem by id error:', err);
      res.status(500).json({ message: 'Server error fetching problem details.' });
    }
  },

  // Update a problem (Admin only)
  async updateProblem(req, res) {
    try {
      const problemId = req.params.id;
      const problem = await db.problems.findOne({ id: problemId });
      if (!problem) {
        return res.status(404).json({ message: 'Problem not found.' });
      }

      const updated = await db.problems.update({ id: problemId }, { $set: req.body });
      res.json(updated[0]);
    } catch (err) {
      console.error('Update problem error:', err);
      res.status(500).json({ message: 'Server error updating problem.' });
    }
  },

  // Delete a problem (Admin only)
  async deleteProblem(req, res) {
    try {
      const result = await db.problems.delete({ id: req.params.id });
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'Problem not found.' });
      }
      res.json({ message: 'Problem deleted successfully.' });
    } catch (err) {
      console.error('Delete problem error:', err);
      res.status(500).json({ message: 'Server error deleting problem.' });
    }
  },

  // Get analytics for placement statistics
  async getAnalytics(req, res) {
    try {
      const problems = await db.problems.find({});
      const submissions = await db.submissions.find({});
      const users = await db.users.find({});

      // Submissions counts
      const totalSubmissions = submissions.length;
      const acceptedSubmissions = submissions.filter(s => s.verdict === 'Accepted').length;
      const passRate = totalSubmissions > 0 ? Math.round((acceptedSubmissions / totalSubmissions) * 100) : 0;

      // Problems counts by difficulty
      const easyProblems = problems.filter(p => p.difficulty.toLowerCase() === 'easy').length;
      const mediumProblems = problems.filter(p => p.difficulty.toLowerCase() === 'medium').length;
      const hardProblems = problems.filter(p => p.difficulty.toLowerCase() === 'hard').length;

      // User solved aggregation
      const topLanguages = {};
      submissions.forEach(s => {
        topLanguages[s.language] = (topLanguages[s.language] || 0) + 1;
      });

      // Format weekly submission activity
      const weeklyActivity = {};
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

      submissions.forEach(s => {
        const date = s.createdAt.split('T')[0];
        weeklyActivity[date] = (weeklyActivity[date] || 0) + 1;
      });

      res.json({
        totalUsers: users.length,
        totalProblems: problems.length,
        difficultyDistribution: {
          easy: easyProblems,
          medium: mediumProblems,
          hard: hardProblems
        },
        submissions: {
          total: totalSubmissions,
          accepted: acceptedSubmissions,
          passRate
        },
        topLanguages,
        weeklyActivity
      });
    } catch (err) {
      console.error('Analytics error:', err);
      res.status(500).json({ message: 'Server error fetching analytics.' });
    }
  }
};
