import { useState, useEffect,  } from "react";

// const API = "http://localhost:5000/api";

const mockAnalyze = (username) =>
  new Promise((res) =>
    setTimeout(() => {
      const seed = username.split("").reduce((a, c, i) => a + c.charCodeAt(0) * (i + 1), 0);
      const rng = (n) => { let x = Math.sin(seed + n) * 10000; return x - Math.floor(x); };
      const profiles = ["high", "medium", "low", "mixed_high", "mixed_low"];
      const profile = profiles[Math.floor(rng(1) * 5)];
      const emotionSets = {
        high: ["sadness","fear","sadness","fear","anger","sadness","fear","disgust","sadness","fear"],
        medium: ["sadness","anger","neutral","fear","disgust","joy","sadness","neutral","anger","neutral"],
        low: ["joy","neutral","joy","surprise","joy","neutral","joy","joy","surprise","neutral"],
        mixed_high: ["sadness","fear","anger","sadness","neutral","fear","disgust","sadness","joy","fear"],
        mixed_low: ["joy","neutral","sadness","neutral","joy","anger","neutral","joy","surprise","neutral"],
      };
      const emotions = emotionSets[profile];
      const texts = [
        "I've been feeling completely hopeless for weeks, nothing matters anymore",
        "Had a genuinely good day today, felt present and happy for once",
        "My heart won't stop racing even when nothing is happening",
        "Best month of my life honestly, everything is clicking",
        "Working 14 hour days for months, completely running on empty",
        "Grief hits me in waves, one moment okay then devastated",
        "My mental health routine is working, feeling balanced",
        "The nightmares came back again, woke up shaking",
        "Laughed until I cried with friends, life feels so full",
        "I feel like I'm drowning and nobody can see it",
      ];
      const concernEmotions = new Set(["sadness","fear","anger","disgust"]);
      const concern_count = emotions.filter(e => concernEmotions.has(e)).length;
      const risk_level = concern_count >= 6 ? "High" : concern_count >= 3 ? "Medium" : "Low";
      res({
        username, source: "mock",
        comments_analyzed: 10,
        risk_level,
        concern_score: Math.round((concern_count / 10) * 100),
        results: emotions.map((label, i) => ({
          text: texts[i],
          label,
          score: Math.round(60 + rng(i + 10) * 35),
        })),
      });
    }, 2500)
  );

const RISK_COLORS = {
  High:   { bg: "#ff3b5c", glow: "rgba(255,59,92,0.35)",   text: "#ff3b5c",   soft: "rgba(255,59,92,0.1)"   },
  Medium: { bg: "#ffaa00", glow: "rgba(255,170,0,0.35)",   text: "#ffaa00",   soft: "rgba(255,170,0,0.1)"   },
  Low:    { bg: "#00e5a0", glow: "rgba(0,229,160,0.35)",   text: "#00e5a0",   soft: "rgba(0,229,160,0.1)"   },
};
const EMOTION_COLORS = {
  sadness:  "#6c8eff", fear: "#ff6b6b", anger: "#ff9f43",
  disgust:  "#a29bfe", joy: "#00e5a0", neutral: "#74b9ff", surprise: "#fd79a8",
};
const EMOTION_ICONS = {
  sadness:"😢", fear:"😨", anger:"😠", disgust:"🤢", joy:"😊", neutral:"😐", surprise:"😲"
};
const CONCERN_EMOTIONS = new Set(["sadness","fear","anger","disgust"]);

const HELPLINES = [
  { name: "iCall", number: "9152987821", desc: "TISS Mental Health Helpline" },
  { name: "Vandrevala Foundation", number: "1860-2662-345", desc: "24/7 Free Support" },
  { name: "AASRA", number: "9820466627", desc: "Crisis Intervention" },
  { name: "Snehi", number: "044-24640050", desc: "Emotional Support" },
];

// Radar Chart SVG
function RadarChart({ emotions }) {
  const size = 200, cx = 100, cy = 100, r = 75;
  const keys = Object.keys(EMOTION_COLORS);
  const n = keys.length;
  const counts = {};
  keys.forEach(k => counts[k] = 0);
  emotions.forEach(e => { if (counts[e] !== undefined) counts[e]++; });
  const max = 10;
  const points = keys.map((k, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const val = (counts[k] / max) * r;
    return { x: cx + val * Math.cos(angle), y: cy + val * Math.sin(angle), label: k, count: counts[k], angle };
  });
  const polygon = points.map(p => `${p.x},${p.y}`).join(" ");
  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", maxWidth: "220px" }}>
      {/* Grid */}
      {gridLevels.map(level => {
        const gpts = keys.map((_, i) => {
          const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
          return `${cx + r * level * Math.cos(angle)},${cy + r * level * Math.sin(angle)}`;
        }).join(" ");
        return <polygon key={level} points={gpts} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}
      {/* Axes */}
      {keys.map((_, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        return <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(angle)} y2={cy + r * Math.sin(angle)} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
      })}
      {/* Data */}
      <polygon points={polygon} fill="rgba(123,94,167,0.25)" stroke="#7b5ea7" strokeWidth="1.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="3" fill={EMOTION_COLORS[p.label]} />
      ))}
      {/* Labels */}
      {points.map((p, i) => {
        const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
        const lx = cx + (r + 16) * Math.cos(angle);
        const ly = cy + (r + 16) * Math.sin(angle);
        return (
          <text key={i} x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
            fontSize="9" fill={EMOTION_COLORS[p.label]}>
            {EMOTION_ICONS[p.label]} {p.label}
          </text>
        );
      })}
    </svg>
  );
}

// Animated score ring
function ScoreRing({ score, color, size = 120 }) {
  const r = 45, circ = 2 * Math.PI * r;
  const [displayed, setDisplayed] = useState(0);
  useEffect(() => {
    let start = null;
    const animate = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / 1000, 1);
      setDisplayed(Math.round(progress * score));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [score]);
  const offset = circ - (displayed / 100) * circ;
  return (
    <svg width={size} height={size} viewBox="0 0 120 120">
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
      <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 60 60)"
        style={{ transition: "stroke-dashoffset 0.05s linear", filter: `drop-shadow(0 0 6px ${color})` }} />
      <text x="60" y="55" textAnchor="middle" fill="#fff" fontSize="22" fontWeight="800">{displayed}</text>
      <text x="60" y="72" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">concern%</text>
    </svg>
  );
}

// Bar chart for emotion distribution
function EmotionBars({ results }) {
  const counts = {};
  Object.keys(EMOTION_COLORS).forEach(k => counts[k] = 0);
  results.forEach(r => { if (counts[r.label] !== undefined) counts[r.label]++; });
  const max = Math.max(...Object.values(counts), 1);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {Object.entries(counts).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([emotion, count]) => (
        <div key={emotion} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "13px", minWidth: "70px", color: EMOTION_COLORS[emotion] }}>
            {EMOTION_ICONS[emotion]} {emotion}
          </span>
          <div style={{ flex: 1, height: "8px", background: "rgba(255,255,255,0.05)", borderRadius: "4px", overflow: "hidden" }}>
            <div style={{
              height: "100%", borderRadius: "4px",
              width: `${(count / max) * 100}%`,
              background: EMOTION_COLORS[emotion],
              boxShadow: `0 0 8px ${EMOTION_COLORS[emotion]}`,
              transition: "width 0.8s ease",
            }} />
          </div>
          <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.4)", minWidth: "20px" }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

export default function App() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [compareUsername, setCompareUsername] = useState("");
  const [compareResult, setCompareResult] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);
  const [error, setError] = useState("");
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("result");
  const [selfText, setSelfText] = useState("");
  const [selfResult, setSelfResult] = useState(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [dots, setDots] = useState(0);
  const [mode, setMode] = useState("username"); // username | self

  useEffect(() => {
    if (loading || compareLoading || selfLoading) {
      const iv = setInterval(() => setDots(d => (d + 1) % 4), 400);
      return () => clearInterval(iv);
    }
  }, [loading, compareLoading, selfLoading]);

  const analyze = async (uname, setter, loadSetter) => {
    if (!uname.trim()) return;
    loadSetter(true);
    setError("");
    try {
      const data = await mockAnalyze(uname.trim());
      setter(data);
      if (setter === setResult) {
        setHistory(prev => [{ ...data, scanned_at: new Date().toISOString() }, ...prev.slice(0, 9)]);
        setActiveTab("result");
      }
    } catch { setError("Could not analyze. Try again."); }
    loadSetter(false);
  };

  const analyzeSelf = async () => {
    if (!selfText.trim()) return;
    setSelfLoading(true);
    await new Promise(r => setTimeout(r, 1500));
    const fakeResult = await mockAnalyze("selfassess_" + selfText.length);
    setSelfResult(fakeResult);
    setSelfLoading(false);
  };

  const c = result ? RISK_COLORS[result.risk_level] : RISK_COLORS.Low;
  // const cc = compareResult ? RISK_COLORS[compareResult.risk_level] : null;
  const tabs = ["result", "emotions", "breakdown", "compare", "self-check", "history"];

  return (
    <div style={S.root}>
      <div style={S.bgGrid} />
      <div style={S.bgOrb1} /><div style={S.bgOrb2} /><div style={S.bgOrb3} />

      {/* Header */}
      <header style={S.header}>
        <div style={S.headerInner}>
          <div style={S.logo}><span style={S.logoIcon}>◈</span><span style={S.logoText}>MindScan</span></div>
          <div style={S.badge}>AI Mental Health Detection</div>
        </div>
      </header>

      <main style={S.main}>
        {/* Mode Toggle */}
        <div style={S.modeRow}>
          {["username", "self"].map(m => (
            <button key={m} onClick={() => setMode(m)}
              style={{ ...S.modeBtn, ...(mode === m ? S.modeBtnActive : {}) }}>
              {m === "username" ? "🔍 Analyze Username" : "✍️ Self Assessment"}
            </button>
          ))}
        </div>

        {/* Input Card */}
        <div style={S.card}>
          {mode === "username" ? (
            <>
              <div style={S.cardLabel}>BLUESKY / MOCK USERNAME ANALYSIS</div>
              <h1 style={S.cardTitle}>Detect Mental Health Signals</h1>
              <p style={S.cardSub}>Enter a username. Our emotion AI analyzes their last 10 posts to detect mental health indicators.</p>
              <div style={S.inputRow}>
                <div style={S.inputWrapper}>
                  <span style={S.inputPrefix}>@</span>
                  <input style={S.input} value={username}
                    onChange={e => setUsername(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && analyze(username, setResult, setLoading)}
                    placeholder="username or handle.bsky.social" disabled={loading} />
                </div>
                <button style={{ ...S.btn, ...(loading ? S.btnDisabled : {}) }}
                  onClick={() => analyze(username, setResult, setLoading)} disabled={loading || !username.trim()}>
                  {loading ? `Scanning${".".repeat(dots)}` : "Analyze →"}
                </button>
              </div>
              {error && <div style={S.error}>{error}</div>}
            </>
          ) : (
            <>
              <div style={S.cardLabel}>ANONYMOUS SELF ASSESSMENT</div>
              <h1 style={S.cardTitle}>How Are You Feeling?</h1>
              <p style={S.cardSub}>Type freely about your thoughts and feelings. Your text is never stored or shared.</p>
              <textarea style={S.textarea} value={selfText}
                onChange={e => setSelfText(e.target.value)}
                placeholder="Write about how you've been feeling lately... (the more you write, the better the analysis)" rows={5} />
              <button style={{ ...S.btn, marginTop: "12px", ...(selfLoading ? S.btnDisabled : {}) }}
                onClick={analyzeSelf} disabled={selfLoading || selfText.trim().length < 20}>
                {selfLoading ? `Analyzing${".".repeat(dots)}` : "Check My Emotions →"}
              </button>
              {selfResult && (
                <div style={{ marginTop: "20px", padding: "20px", background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                    <ScoreRing score={selfResult.concern_score} color={RISK_COLORS[selfResult.risk_level].bg} size={100} />
                    <div>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.35)", marginBottom: "6px", letterSpacing: "0.1em" }}>YOUR EMOTIONAL STATE</div>
                      <div style={{ fontSize: "28px", fontWeight: "800", color: RISK_COLORS[selfResult.risk_level].text }}>
                        {selfResult.risk_level} Concern
                      </div>
                      <EmotionBars results={selfResult.results} />
                    </div>
                  </div>
                  {selfResult.risk_level === "High" && (
                    <div style={{ marginTop: "16px", padding: "14px", background: "rgba(255,59,92,0.08)", borderRadius: "10px", border: "1px solid rgba(255,59,92,0.2)" }}>
                      <div style={{ color: "#ff3b5c", fontWeight: "700", marginBottom: "8px" }}>💙 You're not alone. Here's some support:</div>
                      {HELPLINES.map(h => (
                        <div key={h.name} style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "4px" }}>
                          <b style={{ color: "rgba(255,255,255,0.8)" }}>{h.name}</b> — {h.number} <span style={{ opacity: 0.5 }}>({h.desc})</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Tabs */}
        {result && (
          <div style={S.tabs}>
            {tabs.map(tab => (
              <button key={tab} style={{ ...S.tab, ...(activeTab === tab ? S.tabActive : {}) }}
                onClick={() => setActiveTab(tab)}>
                {{ result:"Overview", emotions:"Emotions", breakdown:"Comments", compare:"Compare", "self-check":"Self Check", history:"History" }[tab]}
              </button>
            ))}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "result" && result && (
          <div style={S.overviewGrid}>
            {/* Left: Score Ring + Risk */}
            <div style={{ ...S.glassCard, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", boxShadow: `0 0 50px ${c.glow}` }}>
              <ScoreRing score={result.concern_score} color={c.bg} size={130} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.12em", marginBottom: "6px" }}>RISK LEVEL</div>
                <div style={{ fontSize: "36px", fontWeight: "900", color: c.text }}>{result.risk_level}</div>
                <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.35)" }}>u/{result.username}</div>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.2)", marginTop: "4px" }}>via {result.source}</div>
              </div>
            </div>

            {/* Middle: Radar Chart */}
            <div style={{ ...S.glassCard, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
              <div style={S.cardLabel}>EMOTION RADAR</div>
              <RadarChart emotions={result.results.map(r => r.label)} />
            </div>

            {/* Right: Stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Posts Analyzed", value: result.comments_analyzed, suffix: "posts" },
                { label: "Concern Signals", value: result.results.filter(r => CONCERN_EMOTIONS.has(r.label)).length, suffix: "/ 10" },
                { label: "Avg Confidence", value: Math.round(result.results.reduce((a, b) => a + b.score, 0) / result.results.length), suffix: "%" },
                { label: "Dominant Emotion", value: EMOTION_ICONS[result.results.sort((a,b)=>b.score-a.score)[0]?.label] || "—", suffix: result.results[0]?.label || "" },
              ].map(stat => (
                <div key={stat.label} style={S.statCard}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.35)" }}>{stat.label}</div>
                  <div style={{ fontSize: "22px", fontWeight: "800", color: "#fff" }}>
                    {stat.value}<span style={{ fontSize: "13px", fontWeight: "400", color: "rgba(255,255,255,0.3)" }}> {stat.suffix}</span>
                  </div>
                </div>
              ))}

              {result.risk_level === "High" && (
                <div style={S.alertBox}>
                  <div style={{ color: "#ff3b5c", fontWeight: "700", fontSize: "13px", marginBottom: "8px" }}>⚠ High Risk Detected</div>
                  {HELPLINES.slice(0, 2).map(h => (
                    <div key={h.name} style={{ fontSize: "12px", color: "rgba(255,255,255,0.45)", marginBottom: "3px" }}>
                      <b style={{ color: "rgba(255,255,255,0.7)" }}>{h.name}:</b> {h.number}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* EMOTIONS TAB */}
        {activeTab === "emotions" && result && (
          <div style={S.glassCard}>
            <div style={S.cardLabel}>EMOTION DISTRIBUTION ANALYSIS</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "center" }}>
              <div>
                <EmotionBars results={result.results} />
                <div style={{ marginTop: "20px", padding: "14px", background: "rgba(255,255,255,0.03)", borderRadius: "10px" }}>
                  <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)", marginBottom: "10px", letterSpacing: "0.1em" }}>EMOTION LEGEND</div>
                  {Object.entries(EMOTION_COLORS).map(([e, col]) => (
                    <div key={e} style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: col, boxShadow: `0 0 6px ${col}` }} />
                      <span style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)" }}>{EMOTION_ICONS[e]} {e}</span>
                      <span style={{ marginLeft: "auto", fontSize: "11px", padding: "2px 8px", borderRadius: "10px",
                        background: CONCERN_EMOTIONS.has(e) ? "rgba(255,59,92,0.1)" : "rgba(0,229,160,0.1)",
                        color: CONCERN_EMOTIONS.has(e) ? "#ff3b5c" : "#00e5a0" }}>
                        {CONCERN_EMOTIONS.has(e) ? "concern" : "positive"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
                <RadarChart emotions={result.results.map(r => r.label)} />
                <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.25)", textAlign: "center" }}>Emotion intensity radar across all 10 posts</div>
              </div>
            </div>
          </div>
        )}

        {/* BREAKDOWN TAB */}
        {activeTab === "breakdown" && result && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={S.cardLabel}>COMMENT-BY-COMMENT ANALYSIS</div>
            {result.results.map((r, i) => {
              const ec = EMOTION_COLORS[r.label] || "#888";
              const isConcern = CONCERN_EMOTIONS.has(r.label);
              return (
                <div key={i} style={{ ...S.glassCard, padding: "16px 20px", borderLeft: `3px solid ${ec}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                    <span style={{ fontSize: "18px" }}>{EMOTION_ICONS[r.label]}</span>
                    <span style={{ fontSize: "12px", fontWeight: "700", color: ec, letterSpacing: "0.08em" }}>{r.label.toUpperCase()}</span>
                    <span style={{ marginLeft: "auto", fontSize: "11px", padding: "2px 10px", borderRadius: "20px",
                      background: isConcern ? "rgba(255,59,92,0.1)" : "rgba(0,229,160,0.1)",
                      color: isConcern ? "#ff3b5c" : "#00e5a0", border: `1px solid ${isConcern ? "rgba(255,59,92,0.3)" : "rgba(0,229,160,0.3)"}` }}>
                      {r.score}% confidence
                    </span>
                    <span style={{ fontSize: "12px", color: "rgba(255,255,255,0.2)" }}>#{i + 1}</span>
                  </div>
                  <div style={{ fontSize: "14px", color: "rgba(255,255,255,0.55)", fontStyle: "italic", lineHeight: 1.6, marginBottom: "10px" }}>
                    "{r.text}"
                  </div>
                  <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${r.score}%`, background: ec, borderRadius: "2px", boxShadow: `0 0 6px ${ec}` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* COMPARE TAB */}
        {activeTab === "compare" && result && (
          <div>
            <div style={S.cardLabel}>COMPARE TWO USERS SIDE BY SIDE</div>
            <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap" }}>
              <div style={{ ...S.inputWrapper, flex: 1 }}>
                <span style={S.inputPrefix}>@</span>
                <input style={S.input} value={compareUsername}
                  onChange={e => setCompareUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && analyze(compareUsername, setCompareResult, setCompareLoading)}
                  placeholder="second username to compare" />
              </div>
              <button style={{ ...S.btn, ...(compareLoading ? S.btnDisabled : {}) }}
                onClick={() => analyze(compareUsername, setCompareResult, setCompareLoading)}
                disabled={compareLoading || !compareUsername.trim()}>
                {compareLoading ? `Scanning${".".repeat(dots)}` : "Compare →"}
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[{ r: result, label: "User 1" }, { r: compareResult, label: "User 2" }].map(({ r: res, label }) => (
                <div key={label} style={{ ...S.glassCard, ...(res ? { boxShadow: `0 0 30px ${RISK_COLORS[res.risk_level].glow}` } : {}) }}>
                  {res ? (
                    <>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)", marginBottom: "8px" }}>{label}</div>
                      <div style={{ fontSize: "13px", color: "rgba(255,255,255,0.5)", marginBottom: "16px" }}>@{res.username}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                        <ScoreRing score={res.concern_score} color={RISK_COLORS[res.risk_level].bg} size={90} />
                        <div>
                          <div style={{ fontSize: "24px", fontWeight: "800", color: RISK_COLORS[res.risk_level].text }}>{res.risk_level}</div>
                          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>Risk Level</div>
                        </div>
                      </div>
                      <EmotionBars results={res.results} />
                    </>
                  ) : (
                    <div style={{ textAlign: "center", padding: "40px", color: "rgba(255,255,255,0.2)", fontSize: "14px" }}>
                      {label} — Enter a username above
                    </div>
                  )}
                </div>
              ))}
            </div>
            {result && compareResult && (
              <div style={{ ...S.glassCard, marginTop: "16px" }}>
                <div style={S.cardLabel}>COMPARISON SUMMARY</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginTop: "12px" }}>
                  {[
                    { label: "Higher Concern", value: result.concern_score > compareResult.concern_score ? `@${result.username}` : `@${compareResult.username}` },
                    { label: "Score Difference", value: `${Math.abs(result.concern_score - compareResult.concern_score)}%` },
                    { label: "Both Risk Levels", value: `${result.risk_level} vs ${compareResult.risk_level}` },
                  ].map(s => (
                    <div key={s.label} style={S.statCard}>
                      <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.3)" }}>{s.label}</div>
                      <div style={{ fontSize: "16px", fontWeight: "700", color: "#fff", marginTop: "4px" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SELF CHECK TAB */}
        {activeTab === "self-check" && (
          <div style={S.glassCard}>
            <div style={S.cardLabel}>ANONYMOUS SELF ASSESSMENT</div>
            <h2 style={{ fontSize: "22px", fontWeight: "800", color: "#fff", margin: "0 0 8px" }}>How are you feeling?</h2>
            <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "16px" }}>Your text is never stored. This is purely for your own awareness.</p>
            <textarea style={S.textarea} value={selfText} onChange={e => setSelfText(e.target.value)}
              placeholder="Write about how you've been feeling lately..." rows={5} />
            <button style={{ ...S.btn, marginTop: "12px", ...(selfLoading ? S.btnDisabled : {}) }}
              onClick={analyzeSelf} disabled={selfLoading || selfText.trim().length < 20}>
              {selfLoading ? `Analyzing${".".repeat(dots)}` : "Analyze My Feelings →"}
            </button>
            {selfResult && (
              <div style={{ marginTop: "20px" }}>
                <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                  <ScoreRing score={selfResult.concern_score} color={RISK_COLORS[selfResult.risk_level].bg} size={110} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "28px", fontWeight: "800", color: RISK_COLORS[selfResult.risk_level].text, marginBottom: "12px" }}>
                      {selfResult.risk_level} Concern Level
                    </div>
                    <EmotionBars results={selfResult.results} />
                  </div>
                </div>
                {selfResult.risk_level !== "Low" && (
                  <div style={{ ...S.alertBox, marginTop: "16px" }}>
                    <div style={{ color: "#ff3b5c", fontWeight: "700", marginBottom: "10px" }}>💙 You matter. Please reach out:</div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {HELPLINES.map(h => (
                        <div key={h.name} style={{ padding: "10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px" }}>
                          <div style={{ fontWeight: "700", color: "#fff", fontSize: "13px" }}>{h.name}</div>
                          <div style={{ color: "#ff6b6b", fontSize: "13px" }}>{h.number}</div>
                          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px" }}>{h.desc}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {activeTab === "history" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={S.cardLabel}>RECENT SCANS</div>
            {history.length === 0 ? (
              <div style={{ ...S.glassCard, textAlign: "center", color: "rgba(255,255,255,0.2)", padding: "40px" }}>No scans yet</div>
            ) : history.map((h, i) => {
              const hc = RISK_COLORS[h.risk_level];
              return (
                <div key={i} style={{ ...S.glassCard, padding: "14px 20px", display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                  <ScoreRing score={h.concern_score} color={hc.bg} size={50} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "700", color: "#fff" }}>@{h.username}</div>
                    <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.3)" }}>{new Date(h.scanned_at).toLocaleString()}</div>
                  </div>
                  <span style={{ padding: "4px 14px", borderRadius: "20px", fontSize: "12px", fontWeight: "700",
                    background: hc.soft, color: hc.text, border: `1px solid ${hc.bg}` }}>
                    {h.risk_level} Risk
                  </span>
                  <span style={{ fontSize: "20px" }}>{EMOTION_ICONS[h.results?.[0]?.label] || "—"}</span>
                </div>
              );
            })}
          </div>
        )}

        <div style={S.footer}>◈ MindScan · Powered by j-hartmann/emotion-english-distilroberta-base · For awareness only · Not a medical tool</div>
      </main>
    </div>
  );
}

const S = {
  root: { minHeight: "100vh", background: "#080b14", color: "#e8eaf2", fontFamily: "'DM Sans','Segoe UI',sans-serif", position: "relative", overflow: "hidden" },
  bgGrid: { position: "fixed", inset: 0, zIndex: 0, backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none" },
  bgOrb1: { position: "fixed", top: "-200px", right: "-200px", width: "600px", height: "600px", borderRadius: "50%", background: "radial-gradient(circle,rgba(100,60,255,0.1) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 },
  bgOrb2: { position: "fixed", bottom: "-150px", left: "-150px", width: "500px", height: "500px", borderRadius: "50%", background: "radial-gradient(circle,rgba(0,200,150,0.07) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 },
  bgOrb3: { position: "fixed", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "800px", height: "800px", borderRadius: "50%", background: "radial-gradient(circle,rgba(123,94,167,0.04) 0%,transparent 70%)", pointerEvents: "none", zIndex: 0 },
  header: { position: "relative", zIndex: 10, borderBottom: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(20px)", background: "rgba(8,11,20,0.8)" },
  headerInner: { maxWidth: "1000px", margin: "0 auto", padding: "18px 24px", display: "flex", alignItems: "center", justifyContent: "space-between" },
  logo: { display: "flex", alignItems: "center", gap: "10px" },
  logoIcon: { fontSize: "22px", color: "#7b5ea7" },
  logoText: { fontSize: "18px", fontWeight: "700", letterSpacing: "0.05em", color: "#fff" },
  badge: { fontSize: "11px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.08em", textTransform: "uppercase", padding: "4px 12px", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px" },
  main: { position: "relative", zIndex: 10, maxWidth: "1000px", margin: "0 auto", padding: "32px 24px 80px" },
  modeRow: { display: "flex", gap: "8px", marginBottom: "16px" },
  modeBtn: { padding: "10px 20px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: "13px", fontWeight: "600", cursor: "pointer" },
  modeBtnActive: { background: "rgba(123,94,167,0.2)", border: "1px solid rgba(123,94,167,0.5)", color: "#c4a8f0" },
  card: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "20px", padding: "36px", marginBottom: "20px", backdropFilter: "blur(10px)" },
  glassCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: "16px", padding: "24px", backdropFilter: "blur(10px)", marginBottom: "4px" },
  cardLabel: { fontSize: "11px", letterSpacing: "0.15em", color: "#7b5ea7", marginBottom: "10px", fontWeight: "600" },
  cardTitle: { fontSize: "28px", fontWeight: "800", margin: "0 0 10px", color: "#fff" },
  cardSub: { fontSize: "14px", color: "rgba(255,255,255,0.4)", marginBottom: "24px", lineHeight: 1.6 },
  inputRow: { display: "flex", gap: "10px", alignItems: "stretch", flexWrap: "wrap" },
  inputWrapper: { flex: 1, display: "flex", alignItems: "center", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "0 16px", minWidth: "200px" },
  inputPrefix: { color: "rgba(255,255,255,0.3)", fontSize: "16px", marginRight: "4px", fontWeight: "600" },
  input: { flex: 1, background: "transparent", border: "none", outline: "none", color: "#fff", fontSize: "15px", padding: "13px 0", fontFamily: "inherit" },
  textarea: { width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", padding: "14px 16px", color: "#fff", fontSize: "14px", fontFamily: "inherit", outline: "none", resize: "vertical", lineHeight: 1.6, boxSizing: "border-box" },
  btn: { background: "linear-gradient(135deg,#7b5ea7,#4a90d9)", border: "none", borderRadius: "12px", padding: "13px 24px", color: "#fff", fontSize: "14px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" },
  btnDisabled: { opacity: 0.6, cursor: "not-allowed" },
  error: { marginTop: "14px", padding: "12px 16px", background: "rgba(255,59,92,0.1)", border: "1px solid rgba(255,59,92,0.3)", borderRadius: "10px", color: "#ff3b5c", fontSize: "14px" },
  tabs: { display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" },
  tab: { padding: "8px 16px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.35)", fontSize: "12px", fontWeight: "600", cursor: "pointer", letterSpacing: "0.04em" },
  tabActive: { background: "rgba(123,94,167,0.2)", border: "1px solid rgba(123,94,167,0.5)", color: "#c4a8f0" },
  overviewGrid: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px" },
  statCard: { background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "12px", padding: "16px 18px" },
  alertBox: { background: "rgba(255,59,92,0.07)", border: "1px solid rgba(255,59,92,0.2)", borderRadius: "12px", padding: "16px 18px" },
  footer: { marginTop: "60px", textAlign: "center", fontSize: "11px", color: "rgba(255,255,255,0.15)", lineHeight: 1.7 },
};

// import logo from './logo.svg';
// import './App.css';

// function App() {
//   return (
//     <div className="App">
//       <header className="App-header">
//         <img src={logo} className="App-logo" alt="logo" />
//         <p>
//           Edit <code>src/App.js</code> and save to reload.
//         </p>
//         <a
//           className="App-link"
//           href="https://reactjs.org"
//           target="_blank"
//           rel="noopener noreferrer"
//         >
//           Learn React
//         </a>
//       </header>
//     </div>
//   );
// }

// export default App;
