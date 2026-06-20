import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'online_judge_super_secret_key';

export const authController = {
  async register(req, res) {
    try {
      const { username, email, password } = req.body;

      if (!username || !email || !password) {
        return res.status(400).json({ message: 'All fields are required.' });
      }

      // Check if user already exists
      const existingUser = await db.users.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists.' });
      }

      const existingUsername = await db.users.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: 'Username is already taken.' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = await db.users.create({
        username,
        email,
        password: hashedPassword,
        score: 0,
        streak: 0,
        solvedCount: 0,
        solvedProblems: [],
        lastSubmissionDate: null
      });

      // Sign JWT
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      // Omit password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        token,
        user: userWithoutPassword
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ message: 'Server error during registration.' });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
      }

      // Find user
      const user = await db.users.findOne({ email });
      if (!user) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Invalid credentials.' });
      }

      // Check if streak is broken (if last submission was more than 1 day ago)
      let streak = user.streak || 0;
      if (user.lastSubmissionDate && streak > 0) {
        const lastDate = user.lastSubmissionDate.split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const lastDateTime = new Date(lastDate).getTime();
        const todayTime = new Date(todayStr).getTime();
        const diffDays = Math.round((todayTime - lastDateTime) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          // Streak broken
          streak = 0;
          await db.users.update({ id: user.id }, { $set: { streak: 0 } });
        }
      }

      // Sign JWT
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

      const { password: _, ...userWithoutPassword } = user;
      userWithoutPassword.streak = streak;

      res.json({
        token,
        user: userWithoutPassword
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ message: 'Server error during login.' });
    }
  },

  async getProfile(req, res) {
    try {
      const user = await db.users.findOne({ id: req.user.id });
      if (!user) {
        return res.status(404).json({ message: 'User not found.' });
      }

      // Check if streak is broken
      let streak = user.streak || 0;
      if (user.lastSubmissionDate && streak > 0) {
        const lastDate = user.lastSubmissionDate.split('T')[0];
        const todayStr = new Date().toISOString().split('T')[0];
        const lastDateTime = new Date(lastDate).getTime();
        const todayTime = new Date(todayStr).getTime();
        const diffDays = Math.round((todayTime - lastDateTime) / (1000 * 60 * 60 * 24));
        
        if (diffDays > 1) {
          streak = 0;
          await db.users.update({ id: user.id }, { $set: { streak: 0 } });
        }
      }

      const { password: _, ...userWithoutPassword } = user;
      userWithoutPassword.streak = streak;

      // Get user submissions
      const submissions = await db.submissions.find({ userId: req.user.id });

      res.json({
        user: userWithoutPassword,
        submissions: submissions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      });
    } catch (err) {
      console.error('Profile fetch error:', err);
      res.status(500).json({ message: 'Server error fetching profile.' });
    }
  },

  async getLeaderboard(req, res) {
    try {
      const users = await db.users.find({});
      
      // Sort users by score descending, then solved count, then username
      const sortedUsers = users
        .map(({ password: _, ...u }) => u)
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          if (b.solvedCount !== a.solvedCount) return b.solvedCount - a.solvedCount;
          return a.username.localeCompare(b.username);
        });

      res.json(sortedUsers);
    } catch (err) {
      console.error('Leaderboard error:', err);
      res.status(500).json({ message: 'Server error fetching leaderboard.' });
    }
  }
};
