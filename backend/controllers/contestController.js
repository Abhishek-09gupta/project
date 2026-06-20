import { db } from '../db.js';

export const contestController = {
  // Create contest (Admin only)
  async createContest(req, res) {
    try {
      const { title, description, startTime, endTime, problemIds } = req.body;

      if (!title || !startTime || !endTime) {
        return res.status(400).json({ message: 'Title, startTime, and endTime are required.' });
      }

      const contest = await db.contests.create({
        title,
        description: description || '',
        startTime,
        endTime,
        problems: Array.isArray(problemIds) ? problemIds : [],
        participants: []
      });

      res.status(201).json(contest);
    } catch (err) {
      console.error('Create contest error:', err);
      res.status(500).json({ message: 'Server error creating contest.' });
    }
  },

  // Get all contests
  async getAllContests(req, res) {
    try {
      const contests = await db.contests.find({});
      
      // Sort contests by start date (newest first)
      const sorted = contests.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
      res.json(sorted);
    } catch (err) {
      console.error('Fetch contests error:', err);
      res.status(500).json({ message: 'Server error fetching contests.' });
    }
  },

  // Get contest by ID
  async getContestById(req, res) {
    try {
      const contest = await db.contests.findOne({ id: req.params.id });
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found.' });
      }
      res.json(contest);
    } catch (err) {
      console.error('Fetch contest by id error:', err);
      res.status(500).json({ message: 'Server error fetching contest.' });
    }
  },

  // Register user for a contest
  async registerForContest(req, res) {
    try {
      const contestId = req.params.id;
      const userId = req.user.id;

      const contest = await db.contests.findOne({ id: contestId });
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found.' });
      }

      const participants = Array.isArray(contest.participants) ? contest.participants : [];
      
      if (participants.includes(userId)) {
        return res.status(400).json({ message: 'Already registered for this contest.' });
      }

      const updated = await db.contests.update(
        { id: contestId },
        { $push: { participants: userId } }
      );

      res.json({ message: 'Successfully registered for contest.', contest: updated[0] });
    } catch (err) {
      console.error('Contest registration error:', err);
      res.status(500).json({ message: 'Server error registering for contest.' });
    }
  },

  // Fetch leaderboard for a specific contest
  async getContestLeaderboard(req, res) {
    try {
      const contestId = req.params.id;
      const contest = await db.contests.findOne({ id: contestId });
      if (!contest) {
        return res.status(404).json({ message: 'Contest not found.' });
      }

      // Fetch all submissions made during the contest time frame for the contest problems
      const submissions = await db.submissions.find({
        createdAt: {
          $gt: contest.startTime,
          $lt: contest.endTime
        }
      });

      const contestProblems = contest.problems || [];
      const contestSubmissions = submissions.filter(
        s => contestProblems.includes(s.problemId) && s.verdict === 'Accepted'
      );

      // Compute participant scores (number of solved problems, and time penalties)
      const participantStats = {};
      
      // Initialize with registered participants
      const participants = contest.participants || [];
      const users = await db.users.find({});
      
      participants.forEach(pId => {
        const user = users.find(u => u.id === pId);
        if (user) {
          participantStats[pId] = {
            userId: pId,
            username: user.username,
            solvedCount: 0,
            solvedProblemIds: [],
            score: 0
          };
        }
      });

      // Aggregate solved problems
      contestSubmissions.forEach(sub => {
        if (!participantStats[sub.userId]) {
          // Fallback if user submitted but forgot to register
          const user = users.find(u => u.id === sub.userId);
          participantStats[sub.userId] = {
            userId: sub.userId,
            username: user ? user.username : 'Unknown',
            solvedCount: 0,
            solvedProblemIds: [],
            score: 0
          };
        }

        const stats = participantStats[sub.userId];
        if (!stats.solvedProblemIds.includes(sub.problemId)) {
          stats.solvedProblemIds.push(sub.problemId);
          stats.solvedCount += 1;
          stats.score += 100; // 100 pts per solve in contest
        }
      });

      const leaderboard = Object.values(participantStats).sort((a, b) => b.score - a.score);
      res.json(leaderboard);
    } catch (err) {
      console.error('Contest leaderboard error:', err);
      res.status(500).json({ message: 'Server error fetching contest leaderboard.' });
    }
  }
};
