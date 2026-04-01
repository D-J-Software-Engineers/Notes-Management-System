// ============================================
// SEARCHROOM CONTROLLER
// AI-powered academic research assistant
// Powered by Google Gemini 1.5 Flash (free tier)
// ============================================

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Rate limiting: track per-user request counts
const rateLimitMap = new Map();
const RATE_LIMIT_MAX = 10; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute

function checkRateLimit(userId) {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

// @desc    Query the AI research assistant
// @route   POST /api/searchroom/query
// @access  Private (students)
exports.query = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide a research query." });
    }

    if (message.trim().length > 1000) {
      return res.status(400).json({
        success: false,
        message: "Query is too long. Please keep it under 1000 characters.",
      });
    }

    // Rate limit check
    if (!checkRateLimit(req.user.id)) {
      return res.status(429).json({
        success: false,
        message:
          "Too many requests. Please wait a moment before asking another question.",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        success: false,
        message:
          "AI research assistant is not configured. Please contact the administrator.",
      });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build an academic context from the student's profile
    const userLevel = req.user.level || "secondary school";
    const userClass = req.user.class
      ? `class ${req.user.class.toUpperCase()}`
      : "";
    const userCombination = req.user.combination || "";

    const systemContext = `You are Searchroom, an academic research assistant for a Rwandan secondary school student.
Student profile:
- Level: ${userLevel}${userClass ? ` (${userClass})` : ""}
${userCombination ? `- Combination/Subjects: ${userCombination}` : ""}

Your role:
- Help students understand academic concepts, research topics, and study materials
- Provide clear, curriculum-appropriate explanations tailored to their level
- Encourage critical thinking and deeper learning
- Keep answers educational, accurate, and concise
- You may explain scientific, literary, historical, mathematical, or any academic topics
- Do NOT assist with completing assessments, writing essays for students, or anything academic dishonest
- If a question is off-topic or inappropriate, politely redirect to academic topics

Student's question: ${message.trim()}`;

    const result = await model.generateContent(systemContext);
    const response = result.response;
    const text = response.text();

    res.status(200).json({
      success: true,
      data: {
        reply: text,
        query: message.trim(),
      },
    });
  } catch (error) {
    // Handle Gemini API-specific errors gracefully
    if (error.message && error.message.includes("API_KEY_INVALID")) {
      return res.status(503).json({
        success: false,
        message:
          "AI service configuration error. Please contact the administrator.",
      });
    }
    if (error.message && error.message.includes("quota")) {
      return res.status(503).json({
        success: false,
        message:
          "AI research assistant is temporarily busy. Please try again shortly.",
      });
    }
    next(error);
  }
};
