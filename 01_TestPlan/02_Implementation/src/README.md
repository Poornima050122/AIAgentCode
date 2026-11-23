# Jira Test Plan

Run from the project folder: `npm install`, then `npm run dev`. Open http://localhost:5173.

The app code is in this `src` folder. The backend reads Jira and Groq credentials from the parent `.env`; keep the keys private. Ollama requires the local service and `llama3.2` model.

Enter a Jira key, choose Ollama or Groq, and generate a plan from `01_TestPlan/01_Plan/TestPlan_Template.md`. Jira access is read-only.

Groq uses `openai/gpt-oss-120b`; model output can vary. Verified: frontend production build and backend syntax. Live Jira/LLM calls require valid credentials.
