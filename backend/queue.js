import { db } from './db.js';
import { judge } from './judge.js';

class SubmissionQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  // Add a submission job to the queue
  async addJob(submissionId) {
    this.queue.push(submissionId);
    console.log(`[Queue] Added submission ${submissionId}. Queue length: ${this.queue.length}`);
    this.triggerProcessing();
  }

  // Trigger processing if not already running
  triggerProcessing() {
    if (this.isProcessing) return;
    this.isProcessing = true;
    this.processNextJob();
  }

  // Process the next job in the queue
  async processNextJob() {
    if (this.queue.length === 0) {
      this.isProcessing = false;
      console.log('[Queue] No more jobs to process.');
      return;
    }

    const submissionId = this.queue.shift();
    console.log(`[Queue] Processing submission ${submissionId}...`);

    try {
      // 1. Fetch submission details
      const submission = await db.submissions.findOne({ id: submissionId });
      if (!submission) {
        console.error(`[Queue] Submission ${submissionId} not found in DB.`);
        this.processNextJob();
        return;
      }

      // Update status to Processing
      await db.submissions.update({ id: submissionId }, { $set: { verdict: 'Processing' } });

      // 2. Fetch problem details
      const problem = await db.problems.findOne({ id: submission.problemId });
      if (!problem) {
        console.error(`[Queue] Problem ${submission.problemId} not found.`);
        await db.submissions.update(
          { id: submissionId },
          { $set: { verdict: 'Runtime Error', errorMessage: 'Problem not found on server.' } }
        );
        this.processNextJob();
        return;
      }

      // 3. Execute code in judge engine
      const result = await judge.evaluate(submission, problem);
      console.log(`[Queue] Result for ${submissionId}:`, result);

      // 4. Update submission in DB
      await db.submissions.update(
        { id: submissionId },
        {
          $set: {
            verdict: result.verdict,
            time: result.time,
            memory: result.memory,
            errorMessage: result.errorMessage || ''
          }
        }
      );

      // 5. Update user profile stats if Accepted
      if (result.verdict === 'Accepted') {
        await this.updateUserStats(submission.userId, submission.problemId, problem.difficulty);
      }
    } catch (error) {
      console.error(`[Queue] Error processing submission ${submissionId}:`, error);
      await db.submissions.update(
        { id: submissionId },
        { $set: { verdict: 'Runtime Error', errorMessage: error.message } }
      );
    }

    // Continue with next job
    this.processNextJob();
  }

  // Update user stats after a successful submission
  async updateUserStats(userId, problemId, difficulty) {
    const user = await db.users.findOne({ id: userId });
    if (!user) return;

    // Check if problem already solved
    const submissions = await db.submissions.find({ userId, problemId, verdict: 'Accepted' });
    const isNewSolve = submissions.length <= 1; // It was just inserted and this is the first success

    const todayStr = new Date().toISOString().split('T')[0];
    let newStreak = user.streak || 0;
    let newScore = user.score || 0;
    
    // Update Streak
    if (user.lastSubmissionDate) {
      const lastDate = user.lastSubmissionDate.split('T')[0];
      if (lastDate === todayStr) {
        // Already submitted today, streak remains the same
      } else {
        const lastDateTime = new Date(lastDate).getTime();
        const todayTime = new Date(todayStr).getTime();
        const diffDays = Math.round((todayTime - lastDateTime) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
    } else {
      newStreak = 1;
    }

    // Update Score and Solved count if first time solving this problem
    let updatedSolvedList = Array.isArray(user.solvedProblems) ? [...user.solvedProblems] : [];
    if (isNewSolve && !updatedSolvedList.includes(problemId)) {
      updatedSolvedList.push(problemId);
      
      // Calculate points based on difficulty
      let points = 10;
      if (difficulty.toLowerCase() === 'medium') points = 20;
      else if (difficulty.toLowerCase() === 'hard') points = 40;
      
      newScore += points;
    }

    await db.users.update(
      { id: userId },
      {
        $set: {
          streak: newStreak,
          score: newScore,
          solvedProblems: updatedSolvedList,
          solvedCount: updatedSolvedList.length,
          lastSubmissionDate: new Date().toISOString()
        }
      }
    );
  }
}

export const submissionQueue = new SubmissionQueue();
