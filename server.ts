import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize GoogleGenAI client lazily or safely
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please set it in Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Request parser
app.use(express.json());

// API Endpoints
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", time: new Date().toISOString() });
});

// 1. Intelligent Prioritization
app.post("/api/prioritize", async (req, res) => {
  try {
    const ai = getAiClient();
    const { tasks, profile } = req.body;

    if (!tasks || !Array.isArray(tasks)) {
      res.status(400).json({ error: "Invalid or missing tasks array." });
      return;
    }

    const prompt = `
You are 'The Last-Minute Life Saver' prioritization engine.
Analyze these tasks for a user with the role of "${profile || 'professional'}".
Analyze each task based on:
1. Urgency (due date proximity, current time is ${new Date().toLocaleString()})
2. Estimated effort (hours needed vs. time remaining)
3. High Impact (High vs. Medium vs. Low)

Rank and score each task with a priorityScore from 0 to 100 (where 100 is absolute highest priority / emergency) and provide a firm, empathetic priorityExplanation for why this is ranked this way, and what immediate action is required.

Tasks to analyze:
${JSON.stringify(tasks, null, 2)}

Return a JSON object matching this schema:
{
  "prioritizedTasks": [
    {
      "id": "original_task_id",
      "priorityScore": number,
      "priorityExplanation": "brief firm explanation of urgency and impact"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            prioritizedTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  priorityScore: { type: Type.INTEGER },
                  priorityExplanation: { type: Type.STRING }
                },
                required: ["id", "priorityScore", "priorityExplanation"]
              }
            }
          },
          required: ["prioritizedTasks"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Prioritization error:", error);
    res.status(500).json({ error: error.message || "Failed to prioritize tasks." });
  }
});

// 2. Task Breakdown (Micro-scheduling)
app.post("/api/breakdown", async (req, res) => {
  try {
    const ai = getAiClient();
    const { task, startTime } = req.body;

    if (!task) {
      res.status(400).json({ error: "Missing task details." });
      return;
    }

    const start = startTime || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const prompt = `
You are 'The Last-Minute Life Saver' task strategist.
Break down this large or overwhelming task into 15 to 30-minute micro-tasks. 
Suggest highly specific, bite-sized sequential sprints.
Suggest concrete times starting around "${start}".
Provide clear descriptions for what to do in each micro-task, reducing user's activation energy.

Task details:
Title: ${task.title}
Description: ${task.description}
Due Date: ${task.dueDate}
Estimated Effort: ${task.estimatedEffort} hours
Impact: ${task.impact}
User Profile: ${task.profile}

Return a JSON object with this schema:
{
  "microTasks": [
    {
      "title": "Bite-sized sprint name",
      "duration": number (15 to 30),
      "timeBlock": "e.g. 09:00 AM - 09:20 AM",
      "description": "highly specific actionable instruction"
    }
  ]
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            microTasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  duration: { type: Type.INTEGER },
                  timeBlock: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["title", "duration", "timeBlock", "description"]
              }
            }
          },
          required: ["microTasks"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Breakdown error:", error);
    res.status(500).json({ error: error.message || "Failed to break down task." });
  }
});

// 3. Proactive Execution (Generate Starting Assets)
app.post("/api/generate-asset", async (req, res) => {
  try {
    const ai = getAiClient();
    const { task, assetType } = req.body;

    if (!task || !assetType) {
      res.status(400).json({ error: "Missing task details or assetType." });
      return;
    }

    const prompt = `
You are 'The Last-Minute Life Saver' proactive ghostwriter and developer.
Your mission is to reduce user activation energy by starting their work FOR them.
Instead of giving placeholders, write REAL, ready-to-use content.
Draft a high-quality starting asset of type "${assetType}" for this task:

Task: ${task.title}
Description: ${task.description}
Profile Context: ${task.profile}

Asset Types guidelines:
- "email_draft": Draft a professional, clear outreach, update, or submission email.
- "outline": Create a structured, deeply comprehensive document or essay outline.
- "research": Research key facts, summarize definitions, or pull reference material relevant to the task.
- "structure": Brainstorm a concrete step-by-step project directory structural plan or layout strategy.
- "code": Generate fully-fledged, clean boilerplate code or script to automate/kickstart this.
- "talking_points": Draft high-impact presentation slides bullet points or meeting speaking notes.

Return a JSON object with this schema:
{
  "title": "A highly relevant title (e.g., 'Draft: Project Proposal Email')",
  "content": "Fully-realized Markdown content (no generic placeholders like '[Your Name Here]'). Make it complete, helpful, and immediately copyable."
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING }
          },
          required: ["title", "content"]
        }
      }
    });

    res.json(JSON.parse(response.text || "{}"));
  } catch (error: any) {
    console.error("Asset generation error:", error);
    res.status(500).json({ error: error.message || "Failed to generate starting asset." });
  }
});

// 4. Empathetic and Firm AI Chat Companion
app.post("/api/chat", async (req, res) => {
  try {
    const ai = getAiClient();
    const { messages, activeTask, activeMicroTask, profile } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Missing messages history." });
      return;
    }

    const conversationHistory = messages.map((m: any) => `${m.sender === 'user' ? 'User' : 'Companion'}: ${m.text}`).join("\n");

    const activeTaskContext = activeTask ? `
Active Task the user is working on:
- Title: ${activeTask.title}
- Description: ${activeTask.description}
- Due Date: ${activeTask.dueDate}
- Profile: ${profile || 'General'}
` : "No active task selected yet. Ask them what they are feeling anxious or overwhelmed about, and help them add or select a task right now!";

    const activeMicroTaskContext = activeMicroTask ? `
Active Micro-task currently running:
- Title: ${activeMicroTask.title}
- Duration: ${activeMicroTask.duration} minutes
- Goal: ${activeMicroTask.description}
` : "";

    const systemInstruction = `
You are 'The Last-Minute Life Saver' - an ultra-proactive, firm but deeply empathetic AI productivity companion.
Your core mission is to help the user complete their tasks before deadlines are missed.

Your rules of engagement:
1. Empathize with the user's stress, but remain firm about getting started. DO NOT let them procrastinate.
2. Reduce activation energy. Do the heavy lifting! If they seem stuck, offer to outline, research, write a draft, or generate a prompt immediately.
3. Be concise and conversational, ideal for a voice/sound snippet read-out or a quick focus widget.
4. CRITICAL: Always end your response with a SINGLE clear, next-best action question or prompt to drive immediate momentum.

Context:
${activeTaskContext}
${activeMicroTaskContext}
`;

    const prompt = `
Here is the chat conversation history:
${conversationHistory}

Reply to the user's latest message in accordance with your guidelines. Focus intensely on momentum and the "Next Best Action".
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.8
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Chat error:", error);
    res.status(500).json({ error: error.message || "Failed to communicate with companion." });
  }
});

// Mount Vite middleware
async function setupVite() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`The Last-Minute Life Saver server is running on http://0.0.0.0:${PORT}`);
  });
}

setupVite().catch((err) => {
  console.error("Vite server setup failed:", err);
});
