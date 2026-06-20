import { db } from '../db.js';

export const discussionController = {
  // Get all discussions for a specific problem
  async getDiscussionsByProblem(req, res) {
    try {
      const { problemId } = req.params;
      const discussions = await db.discussions.find({ problemId });
      
      // Sort discussions chronologically (newest first)
      const sorted = discussions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      res.json(sorted);
    } catch (err) {
      console.error('Fetch discussions error:', err);
      res.status(500).json({ message: 'Server error fetching discussions.' });
    }
  },

  // Post a discussion comment
  async createDiscussion(req, res) {
    try {
      const { problemId, comment } = req.body;
      const userId = req.user.id;
      const username = req.user.username;

      if (!problemId || !comment) {
        return res.status(400).json({ message: 'ProblemId and comment are required.' });
      }

      // Check if problem exists
      const problem = await db.problems.findOne({ id: problemId });
      if (!problem) {
        return res.status(404).json({ message: 'Problem not found.' });
      }

      const disc = await db.discussions.create({
        problemId,
        userId,
        username,
        comment
      });

      res.status(201).json(disc);
    } catch (err) {
      console.error('Create discussion error:', err);
      res.status(500).json({ message: 'Server error posting comment.' });
    }
  }
};
