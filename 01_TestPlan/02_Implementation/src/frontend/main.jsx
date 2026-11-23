import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error || "Something went wrong. Please try again.");
  return result;
}

function App() {
  const [issueKey, setIssueKey] = useState("");
  const [provider, setProvider] = useState("ollama");
  const [busy, setBusy] = useState("");
  const [message, setMessage] = useState(null);
  const [result, setResult] = useState(null);
  const [configuration, setConfiguration] = useState(null);

  useEffect(() => {
    apiRequest("/api/status")
      .then(setConfiguration)
      .catch(() => setConfiguration({ jiraConfigured: false, groqConfigured: false }));
  }, []);

  async function runAction(action, task) {
    setBusy(action);
    setMessage(null);
    try {
      await task();
    } catch (error) {
      setMessage({ kind: "error", text: error.message });
    } finally {
      setBusy("");
    }
  }

  function generatePlan(event) {
    event.preventDefault();
    setResult(null);
    runAction("generate", async () => {
      const generated = await apiRequest("/api/generate", {
        method: "POST",
        body: JSON.stringify({ issueKey, provider }),
      });
      setResult(generated);
      setMessage({ kind: "success", text: `Test plan generated from ${generated.issueKey}.` });
    });
  }

  function testJira() {
    runAction("jira", async () => {
      await apiRequest("/api/test/jira", { method: "POST", body: "{}" });
      setMessage({ kind: "success", text: "Jira connection is working." });
    });
  }

  function testLlm() {
    runAction("llm", async () => {
      await apiRequest("/api/test/llm", {
        method: "POST",
        body: JSON.stringify({ provider }),
      });
      setMessage({ kind: "success", text: `${provider === "groq" ? "Groq" : "Ollama"} connection is working.` });
    });
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="TestPlan home">
          <span className="brand-mark">T</span>
          <span>test<span className="brand-accent">plan</span></span>
        </a>
        <div className="topbar-note"><span className="status-dot" /> Jira test plan workspace</div>
      </header>

      <div className="workspace">
        <section className="panel main-panel" aria-labelledby="main-heading">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">YOUR WORKSPACE</p>
              <h1 id="main-heading">Main page</h1>
              <p className="heading-copy">Turn a Jira ticket into a thoughtful test plan.</p>
            </div>
            <span className="step-badge">01</span>
          </div>

          <div className={`output-card${result ? " has-result" : ""}`} aria-live="polite">
            {busy === "generate" ? (
              <div className="empty-state">
                <span className="loader" />
                <strong>Building your test plan</strong>
                <span>Reading the ticket and preparing scenarios…</span>
              </div>
            ) : result ? (
              <div className="plan-content">
                <div className="plan-title">
                  <div>
                    <span className="eyebrow">GENERATED TEST PLAN</span>
                    <h2>{result.issueKey} <span className="plan-divider">/</span> {result.summary}</h2>
                  </div>
                  <button className="copy-button" type="button" onClick={() => navigator.clipboard.writeText(result.plan)}>Copy plan</button>
                </div>
                <pre>{result.plan}</pre>
              </div>
            ) : (
              <div className="empty-state">
                <div className="sparkle" aria-hidden="true">✳</div>
                <strong>Reply with Test Plan</strong>
                <span>Your generated plan will appear here.</span>
              </div>
            )}
          </div>

          <form className="ticket-form" onSubmit={generatePlan}>
            <label htmlFor="issue-key">Jira ticket</label>
            <div className="input-row">
              <span className="ticket-icon" aria-hidden="true">↗</span>
              <input
                autoComplete="off"
                id="issue-key"
                onChange={(event) => setIssueKey(event.target.value)}
                placeholder="Enter a ticket key, e.g. QA-123"
                value={issueKey}
              />
              <button className="primary-button" disabled={Boolean(busy)} type="submit">
                {busy === "generate" ? "Generating…" : "Generate plan"}
                {busy !== "generate" && <span aria-hidden="true">→</span>}
              </button>
            </div>
            <p className="form-hint">Only the ticket key is needed. Your Jira credentials stay on this server.</p>
          </form>

          {message && <div className={`notice ${message.kind}`} role="status">{message.text}</div>}
        </section>

        <aside className="panel settings-panel" aria-labelledby="settings-heading">
          <div className="panel-heading settings-heading">
            <div>
              <p className="eyebrow">CONNECTIONS</p>
              <h1 id="settings-heading">Settings</h1>
              <p className="heading-copy">Your integrations, in one place.</p>
            </div>
            <span className="settings-icon" aria-hidden="true">⚙</span>
          </div>

          <section className="settings-card">
            <div className="card-title-row">
              <span className="integration-icon jira-icon">J</span>
              <div>
                <h2>Jira connection</h2>
                <p>Ticket source</p>
              </div>
              <span className={`connection-dot ${configuration?.jiraConfigured ? "configured" : ""}`} />
            </div>
            <div className="config-lines">
              <span><span className="config-label">URL</span> {configuration?.jiraConfigured ? "Loaded from .env" : "Not configured"}</span>
              <span><span className="config-label">Email</span> {configuration?.jiraConfigured ? "Loaded from .env" : "Not configured"}</span>
              <span><span className="config-label">Token</span> {configuration?.jiraConfigured ? "••••••••••••" : "Not configured"}</span>
            </div>
            <button className="secondary-button" disabled={Boolean(busy) || !configuration?.jiraConfigured} onClick={testJira} type="button">
              {busy === "jira" ? "Testing connection…" : "Test Jira connection"}
              {busy !== "jira" && <span aria-hidden="true">→</span>}
            </button>
          </section>

          <section className="settings-card llm-card">
            <div className="card-title-row">
              <span className="integration-icon ai-icon">✳</span>
              <div>
                <h2>LLM configuration</h2>
                <p>Choose your test-plan writer</p>
              </div>
            </div>
            <label className={`provider-option${provider === "ollama" ? " selected" : ""}`}>
              <input checked={provider === "ollama"} name="provider" onChange={() => setProvider("ollama")} type="radio" />
              <span className="radio-mark" />
              <span className="provider-details">
                <span className="provider-name">Ollama <span className="local-tag">LOCAL</span></span>
                <span className="provider-description">Run a model on this machine</span>
              </span>
            </label>
            <label className={`provider-option${provider === "groq" ? " selected" : ""}`}>
              <input checked={provider === "groq"} name="provider" onChange={() => setProvider("groq")} type="radio" />
              <span className="radio-mark" />
              <span className="provider-details">
                <span className="provider-name">Groq.com <span className="external-icon" aria-hidden="true">↗</span></span>
                <span className="provider-description">API key {configuration?.groqConfigured ? "loaded from .env" : "not configured"}</span>
              </span>
            </label>
            <button className="secondary-button llm-button" disabled={Boolean(busy)} onClick={testLlm} type="button">
              {busy === "llm" ? "Testing model…" : `Test ${provider === "groq" ? "Groq" : "local"} LLM`}
              {busy !== "llm" && <span aria-hidden="true">→</span>}
            </button>
            <p className="security-note"><span aria-hidden="true">⌑</span> API keys are read securely from .env</p>
          </section>

          <div className="settings-footnote">
            <span className="shield-icon" aria-hidden="true">✓</span>
            <span><strong>Private by design</strong><br />Credentials never leave the backend.</span>
          </div>
        </aside>
      </div>
      <footer className="footer"><span>TESTPLAN WORKSPACE</span><span>Made for clearer, more confident QA.</span></footer>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
