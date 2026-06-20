import { GoogleGenAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient = null;
const apiKey = process.env.GEMINI_API_KEY;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({ apiKey });
    console.log('[AI] Gemini AI service initialized successfully with API Key.');
  } catch (err) {
    console.error('[AI] Failed to initialize Gemini client:', err);
  }
} else {
  console.log('[AI] No GEMINI_API_KEY found. Using heuristic-based fallback analyzer.');
}

// Heuristic fallback complexity analysis
function analyzeComplexityLocally(code, language) {
  const codeLower = code.toLowerCase();
  
  // Dynamic heuristics
  let timeComplexity = 'O(N)';
  let timeExplanation = 'The algorithm performs a single linear pass over the input size N.';
  
  let spaceComplexity = 'O(1)';
  let spaceExplanation = 'Only constant auxiliary variables are used; no extra space scaling with input size is allocated.';

  // Time complexity checks
  const nestedLoopPatterns = [
    /for.*for/s,
    /while.*while/s,
    /for.*while/s,
    /while.*for/s
  ];
  
  const hasNestedLoops = nestedLoopPatterns.some(pattern => pattern.test(codeLower));
  
  if (hasNestedLoops) {
    timeComplexity = 'O(N²)';
    timeExplanation = 'Detected nested loops. For each element, the program iterates through the rest of the elements, leading to a quadratic number of operations.';
  } else if (codeLower.includes('binary') || (codeLower.includes('low') && codeLower.includes('high') && codeLower.includes('mid'))) {
    timeComplexity = 'O(log N)';
    timeExplanation = 'Identified binary search divide-and-conquer pattern. The search space is halved in each step.';
  } else if (codeLower.includes('sort') || codeLower.includes('sorted')) {
    timeComplexity = 'O(N log N)';
    timeExplanation = 'The solution performs a sorting operation, which typically requires linearithmic time complexity.';
  } else if (codeLower.includes('dfs') || codeLower.includes('bfs') || codeLower.includes('adj') || codeLower.includes('graph')) {
    timeComplexity = 'O(V + E)';
    timeExplanation = 'Graph traversal detected. The algorithm visits each vertex V and edge E exactly once.';
  } else if (codeLower.includes('dp') || codeLower.includes('memo') || codeLower.includes('cache')) {
    timeComplexity = 'O(N)';
    timeExplanation = 'Dynamic programming with memoization. Computes each state at most once, transforming an exponential problem into linear time.';
  }

  // Space complexity checks
  if (codeLower.includes('map') || codeLower.includes('dict') || codeLower.includes('hash') || codeLower.includes('set') || codeLower.includes('unordered_map') || codeLower.includes('hashmap')) {
    spaceComplexity = 'O(N)';
    spaceExplanation = 'Allocates a hash table (Map/Set/Dictionary) to store keys/frequencies, scaling linearly with unique input elements.';
  } else if (codeLower.includes('arr') || codeLower.includes('list') || codeLower.includes('vector') || codeLower.includes('new int[')) {
    if (!codeLower.includes('result') && !codeLower.includes('ans')) {
      spaceComplexity = 'O(N)';
      spaceExplanation = 'Allocates an auxiliary array or list of size N to store intermediate values.';
    }
  } else if (codeLower.includes('dp') || codeLower.includes('memo') || codeLower.includes('cache')) {
    spaceComplexity = 'O(N)';
    spaceExplanation = 'A memoization table or array is stored to cache sub-problem results.';
  }

  return {
    timeComplexity,
    timeExplanation,
    spaceComplexity,
    spaceExplanation,
    isMock: true
  };
}

// Heuristic fallback hints
function generateHintLocally(problemTitle, problemDesc, userCode, language) {
  const title = problemTitle.toLowerCase();
  const desc = problemDesc.toLowerCase();
  const code = userCode.toLowerCase();

  // Basic hints based on keywords
  if (title.includes('two sum') || desc.includes('target sum')) {
    if (code.includes('map') || code.includes('dict') || code.includes('hashmap')) {
      return "Excellent! You're already using a Map to find the complement. Double check that you are checking if `target - num` exists in the map BEFORE adding the current number to avoid using the same index twice.";
    }
    return "Hint: The brute-force solution takes O(N²) by comparing every pair. You can optimize this to O(N) by using a hash map to keep track of the numbers you have seen so far and their indices. For each number, check if `target - num` is already in the map.";
  }

  if (title.includes('reverse') || desc.includes('reverse')) {
    return "Hint: You can use two pointers starting at the beginning and the end, swapping values and moving them towards each other until they meet.";
  }

  if (desc.includes('duplicate') || desc.includes('unique')) {
    return "Hint: A HashSet or Boolean array is extremely efficient for keeping track of elements you have already visited. Alternatively, sorting the array first places duplicates adjacent to each other.";
  }

  if (desc.includes('sorted array') || desc.includes('binary search')) {
    return "Hint: Since the input is sorted, you should look for a binary search or two-pointer approach to solve it in O(log N) or O(N) time rather than scanning linearly.";
  }

  if (desc.includes('subsequence') || desc.includes('longest') || desc.includes('dp')) {
    return "Hint: This looks like a Dynamic Programming problem. Try to define a state `dp[i]` representing the answer for the subproblem up to index `i`, and find the recurrence relation that builds `dp[i]` from previous values.";
  }

  return "Hint: Try writing down the brute-force approach first. Then, identify redundant calculations. Can you use extra space (like a Hash Map or Set) to cache results, or sorting to simplify the relationships?";
}

export const aiService = {
  async getComplexity(problemTitle, userCode, language) {
    if (aiClient) {
      try {
        const model = aiClient.models.get({ model: 'gemini-1.5-flash' });
        const prompt = `
          Analyze the Time and Space complexity of the following code for the problem "${problemTitle}".
          Code Language: ${language}
          
          Code:
          ${userCode}
          
          Provide the response strictly in the following JSON format:
          {
            "timeComplexity": "O(...)",
            "timeExplanation": "Brief explanation...",
            "spaceComplexity": "O(...)",
            "spaceExplanation": "Brief explanation..."
          }
        `;
        
        const response = await model.generateContent({ contents: prompt });
        const text = response.text;
        // Parse JSON safely
        const startIdx = text.indexOf('{');
        const endIdx = text.lastIndexOf('}') + 1;
        if (startIdx !== -1 && endIdx !== -1) {
          const jsonStr = text.substring(startIdx, endIdx);
          return JSON.parse(jsonStr);
        }
      } catch (err) {
        console.error('[AI] Gemini complexity query failed, falling back:', err);
      }
    }
    
    return analyzeComplexityLocally(userCode, language);
  },

  async getHint(problemTitle, problemDesc, userCode, language) {
    if (aiClient) {
      try {
        const model = aiClient.models.get({ model: 'gemini-1.5-flash' });
        const prompt = `
          The user is trying to solve the problem "${problemTitle}".
          Problem Description: ${problemDesc}
          The user has written the following code (in ${language}):
          ${userCode}
          
          Provide a single helpful hint to guide them towards the correct or optimized solution. 
          Do not give them the final code. Be encouragement-focused. Return a single short paragraph.
        `;
        
        const response = await model.generateContent({ contents: prompt });
        return response.text;
      } catch (err) {
        console.error('[AI] Gemini hint query failed, falling back:', err);
      }
    }
    
    return generateHintLocally(problemTitle, problemDesc, userCode, language);
  }
};
