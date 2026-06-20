import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './db.js';
import { authMiddleware, adminMiddleware } from './middleware/auth.js';
import { authController } from './controllers/authController.js';
import { problemController } from './controllers/problemController.js';
import { submissionController } from './controllers/submissionController.js';
import { contestController } from './controllers/contestController.js';
import { discussionController } from './controllers/discussionController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes definition
// 1. Auth routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', authMiddleware, authController.getProfile);
app.get('/api/auth/leaderboard', authController.getLeaderboard);

// 2. Problem routes
app.get('/api/problems', problemController.getAllProblems);
app.get('/api/problems/analytics', authMiddleware, adminMiddleware, problemController.getAnalytics);
app.get('/api/problems/:id', problemController.getProblemById);
app.post('/api/problems', authMiddleware, adminMiddleware, problemController.createProblem);
app.put('/api/problems/:id', authMiddleware, adminMiddleware, problemController.updateProblem);
app.delete('/api/problems/:id', authMiddleware, adminMiddleware, problemController.deleteProblem);

// 3. Submission routes
app.post('/api/submissions', authMiddleware, submissionController.submitCode);
app.post('/api/submissions/run', authMiddleware, submissionController.runCode);
app.get('/api/submissions', submissionController.getAllSubmissions);
app.get('/api/submissions/:id', authMiddleware, submissionController.getSubmissionById);
app.post('/api/submissions/ai-hint', authMiddleware, submissionController.getAIHint);
app.post('/api/submissions/ai-complexity', authMiddleware, submissionController.getAIComplexity);

// 4. Contest routes
app.get('/api/contests', contestController.getAllContests);
app.get('/api/contests/:id', contestController.getContestById);
app.post('/api/contests', authMiddleware, adminMiddleware, contestController.createContest);
app.post('/api/contests/:id/register', authMiddleware, contestController.registerForContest);
app.get('/api/contests/:id/leaderboard', contestController.getContestLeaderboard);

// 5. Discussion routes
app.get('/api/discussions/:problemId', discussionController.getDiscussionsByProblem);
app.post('/api/discussions', authMiddleware, discussionController.createDiscussion);

// Base route
app.get('/', (req, res) => {
  res.send('Online Judge API Server is running.');
});

// Database Seeder Function
async function seedProblems() {
  try {
    const existingProblems = await db.problems.find({});
    if (existingProblems.length > 0) {
      console.log('[Seeder] Database already contains problems. Skipping seeder.');
      return;
    }

    console.log('[Seeder] Seeding initial problems...');

    // 1. Two Sum (Easy)
    await db.problems.create({
      title: 'Two Sum',
      description: 'Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.\n\n### Example 1:\n```\nInput: nums = [2,7,11,15], target = 9\nOutput: 0 1\nExplanation: Because nums[0] + nums[1] == 9, we return 0 1.\n```\n### Example 2:\n```\nInput: nums = [3,2,4], target = 6\nOutput: 1 2\n```',
      inputFormat: 'The first line contains N (number of elements) and target.\nThe second line contains N integers separated by space.',
      outputFormat: 'Output two space-separated integers representing the indices.',
      constraints: '2 <= nums.length <= 10^4\n-10^9 <= nums[i] <= 10^9\n-10^9 <= target <= 10^9',
      difficulty: 'Easy',
      companyTags: ['Google', 'Amazon', 'Adobe', 'Meta'],
      timeLimit: 2,
      memoryLimit: 256,
      sampleTestCases: [
        { input: '4 9\n2 7 11 15', output: '0 1' },
        { input: '3 6\n3 2 4', output: '1 2' }
      ],
      hiddenTestCases: [
        { input: '3 6\n3 3 5', output: '0 1' },
        { input: '5 10\n1 3 5 5 8', output: '2 3' }
      ],
      templateCode: {
        cpp: `#include <iostream>\n#include <vector>\n#include <unordered_map>\nusing namespace std;\n\nint main() {\n    int n, target;\n    if (!(cin >> n >> target)) return 0;\n    vector<int> nums(n);\n    for (int i = 0; i < n; i++) {\n        cin >> nums[i];\n    }\n    \n    unordered_map<int, int> seen;\n    for (int i = 0; i < n; i++) {\n        int complement = target - nums[i];\n        if (seen.count(complement)) {\n            cout << seen[complement] << " " << i << endl;\n            return 0;\n        }\n        seen[nums[i]] = i;\n    }\n    return 0;\n}`,
        java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) {\n            nums[i] = sc.nextInt();\n        }\n        \n        Map<Integer, Integer> seen = new HashMap<>();\n        for (int i = 0; i < n; i++) {\n            int complement = target - nums[i];\n            if (seen.containsKey(complement)) {\n                System.out.println(seen.get(complement) + " " + i);\n                return;\n            }\n            seen.put(nums[i], i);\n        }\n    }\n}`,
        python: `import sys\n\ndef main():\n    input_data = sys.stdin.read().split()\n    if not input_data: return\n    n = int(input_data[0])\n    target = int(input_data[1])\n    nums = [int(x) for x in input_data[2:]]\n    \n    seen = {}\n    for i, num in enumerate(nums):\n        complement = target - num\n        if complement in seen:\n            print(f"{seen[complement]} {i}")\n            return\n        seen[num] = i\n\nif __name__ == "__main__":\n    main()`
      }
    });

    // 2. Reverse a Number (Medium)
    await db.problems.create({
      title: 'Reverse Number',
      description: 'Given a signed 32-bit integer `x`, return `x` with its digits reversed. If reversing `x` causes the value to go outside the signed 32-bit integer range `[-2^31, 2^31 - 1]`, then return 0.\n\n### Example 1:\n```\nInput: 123\nOutput: 321\n```\n### Example 2:\n```\nInput: -123\nOutput: -321\n```\n### Example 3:\n```\nInput: 120\nOutput: 21\n```',
      inputFormat: 'A single 32-bit integer x.',
      outputFormat: 'Print the reversed integer or 0 if it overflows.',
      constraints: '-2^31 <= x <= 2^31 - 1',
      difficulty: 'Medium',
      companyTags: ['Microsoft', 'Bloomberg', 'Apple'],
      timeLimit: 1,
      memoryLimit: 128,
      sampleTestCases: [
        { input: '123', output: '321' },
        { input: '-123', output: '-321' },
        { input: '120', output: '21' }
      ],
      hiddenTestCases: [
        { input: '1534236469', output: '0' },
        { input: '-2147483648', output: '0' },
        { input: '0', output: '0' }
      ],
      templateCode: {
        cpp: `#include <iostream>\nusing namespace std;\n\nint main() {\n    long long x;\n    if (cin >> x) {\n        long long rev = 0;\n        bool isNegative = x < 0;\n        if (isNegative) x = -x;\n        while (x > 0) {\n            rev = rev * 10 + x % 10;\n            x /= 10;\n        }\n        if (isNegative) rev = -rev;\n        if (rev < -2147483648LL || rev > 2147483647LL) {\n            cout << 0 << endl;\n        } else {\n            cout << rev << endl;\n        }\n    }\n    return 0;\n}`,
        java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLong()) {\n            long x = sc.nextLong();\n            long rev = 0;\n            boolean isNegative = x < 0;\n            if (isNegative) x = -x;\n            while (x > 0) {\n                rev = rev * 10 + x % 10;\n                x /= 10;\n            }\n            if (isNegative) rev = -rev;\n            if (rev < Integer.MIN_VALUE || rev > Integer.MAX_VALUE) {\n                System.out.println(0);\n            } else {\n                System.out.println(rev);\n            }\n        }\n    }\n}`,
        python: `import sys\n\ndef main():\n    line = sys.stdin.read().strip()\n    if not line: return\n    x = int(line)\n    sign = -1 if x < 0 else 1\n    x = abs(x)\n    rev = int(str(x)[::-1]) * sign\n    if rev < -2**31 or rev > 2**31 - 1:\n        print(0)\n    else:\n        print(rev)\n\nif __name__ == "__main__":\n    main()`
      }
    });

    // 3. Palindrome Check (Easy)
    await db.problems.create({
      title: 'Palindrome Check',
      description: 'Check if a given string is a palindrome. A string is a palindrome if it reads the same backward as forward. Ignore case sensitivity and non-alphanumeric characters.\n\n### Example 1:\n```\nInput: A man, a plan, a canal: Panama\nOutput: true\n```\n### Example 2:\n```\nInput: race a car\nOutput: false\n```',
      inputFormat: 'A line containing a string S.',
      outputFormat: 'Print "true" if the string is a palindrome, otherwise "false".',
      constraints: '1 <= S.length <= 10^5',
      difficulty: 'Easy',
      companyTags: ['Amazon', 'Facebook', 'Goldman Sachs'],
      timeLimit: 1,
      memoryLimit: 128,
      sampleTestCases: [
        { input: 'A man, a plan, a canal: Panama', output: 'true' },
        { input: 'race a car', output: 'false' }
      ],
      hiddenTestCases: [
        { input: ' ', output: 'true' },
        { input: '0P', output: 'false' },
        { input: 'a.', output: 'true' }
      ],
      templateCode: {
        cpp: `#include <iostream>\n#include <string>\n#include <cctype>\nusing namespace std;\n\nint main() {\n    string s;\n    getline(cin, s);\n    string clean = "";\n    for (char c : s) {\n        if (isalnum(c)) {\n            clean += tolower(c);\n        }\n    }\n    int left = 0, right = clean.length() - 1;\n    while (left < right) {\n        if (clean[left] != clean[right]) {\n            cout << "false" << endl;\n            return 0;\n        }\n        left++;\n        right--;\n    }\n    cout << "true" << endl;\n    return 0;\n}`,
        java: `import java.util.*;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String s = sc.nextLine();\n            StringBuilder sb = new StringBuilder();\n            for (char c : s.toCharArray()) {\n                if (Character.isLetterOrDigit(c)) {\n                    sb.append(Character.toLowerCase(c));\n                }\n            }\n            String clean = sb.toString();\n            int left = 0, right = clean.length() - 1;\n            while (left < right) {\n                if (clean.charAt(left) != clean.charAt(right)) {\n                    System.out.println("false");\n                    return;\n                }\n                left++;\n                right--;\n            }\n            System.out.println("true");\n        }\n    }\n}`,
        python: `import sys\n\ndef main():\n    s = sys.stdin.read().strip()\n    clean = [c.lower() for c in s if c.isalnum()]\n    if clean == clean[::-1]:\n        print("true")\n    else:\n        print("false")\n\nif __name__ == "__main__":\n    main()`
      }
    });

    console.log('[Seeder] Problem database seeded successfully.');
  } catch (err) {
    console.error('[Seeder] Error seeding problems:', err);
  }
}

// Start Server
app.listen(PORT, async () => {
  console.log(`[Server] Running on port ${PORT}...`);
  // Seed the initial data on start
  await seedProblems();
});
