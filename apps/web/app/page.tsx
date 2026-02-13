"use client";

import { useEffect, useMemo, useState } from "react";
import { StoryLines, linesSchema } from "@ai-pl/shared";

type Complex = { id: string; developerName: string; name: string };
type RoomType = { id: string; label: string };
type StoryVariant = {
  id: string;
  templateKey: string;
  previewPngUrl: string;
  finalPngUrl: string | null;
  linesJson: StoryLines;
};

type Generation = {
  id: string;
  status: "QUEUED" | "PROCESSING" | "DONE" | "FAILED";
  variants: StoryVariant[];
  error?: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

async function api<T>(path: string, options?: RequestInit, token?: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options?.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `HTTP ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export default function Page() {
  const [token, setToken] = useState<string>("");
  const [complexes, setComplexes] = useState<Complex[]>([]);
  const [roomTypes, setRoomTypes] = useState<RoomType[]>([]);
  const [complexId, setComplexId] = useState("");
  const [roomTypeId, setRoomTypeId] = useState("");
  const [offerText, setOfferText] = useState("Installment without down payment and comfortable monthly fee");
  const [generation, setGeneration] = useState<Generation | null>(null);
  const [limit, setLimit] = useState<{ used: number; total: number; remaining: number; plan: string } | null>(null);
  const [history, setHistory] = useState<StoryVariant[]>([]);
  const [selectedStory, setSelectedStory] = useState<StoryVariant | null>(null);
  const [linesDraft, setLinesDraft] = useState<StoryLines | null>(null);
  const [error, setError] = useState("");
  const [telegramId, setTelegramId] = useState("");

  useEffect(() => {
    const stored = localStorage.getItem("ai_pl_token");
    if (stored) setToken(stored);
  }, []);

  useEffect(() => {
    if (!token) return;
    void loadInitial(token);
  }, [token]);

  useEffect(() => {
    if (!token || !complexId) return;
    void api<RoomType[]>(`/complexes/${complexId}/room-types`, undefined, token).then((data) => {
      setRoomTypes(data);
      setRoomTypeId(data[0]?.id || "");
    });
  }, [token, complexId]);

  useEffect(() => {
    if (!token || !generation?.id) return;
    if (generation.status === "DONE" || generation.status === "FAILED") return;

    const timer = setInterval(async () => {
      const next = await api<Generation>(`/generations/${generation.id}`, undefined, token);
      setGeneration(next);
      if (next.status === "DONE") {
        setHistory(await api<StoryVariant[]>("/stories", undefined, token));
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [token, generation?.id, generation?.status]);

  const canGenerate = useMemo(() => {
    if (!token) return false;
    if (!complexId || !roomTypeId) return false;
    if (offerText.trim().length < 20) return false;
    return true;
  }, [token, complexId, roomTypeId, offerText]);

  async function loadInitial(authToken: string) {
    try {
      const [complexData, limits, stories] = await Promise.all([
        api<Complex[]>("/complexes", undefined, authToken),
        api<{ used: number; total: number; remaining: number; plan: string }>("/limits/today", undefined, authToken),
        api<StoryVariant[]>("/stories", undefined, authToken),
      ]);
      setComplexes(complexData);
      setComplexId(complexData[0]?.id || "");
      setLimit(limits);
      setHistory(stories);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load initial data");
    }
  }

  async function mockLogin(role: "USER" | "ADMIN" = "USER") {
    try {
      const payload = await api<{ accessToken: string }>("/auth/mock-login", {
        method: "POST",
        body: JSON.stringify({ email: "user@ai-pl.local", role }),
      });
      localStorage.setItem("ai_pl_token", payload.accessToken);
      setToken(payload.accessToken);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Login failed");
    }
  }

  async function createGeneration() {
    try {
      setError("");
      const created = await api<Generation>(
        "/generations",
        {
          method: "POST",
          body: JSON.stringify({ complexId, roomTypeId, offerText }),
        },
        token,
      );
      setGeneration(created);
      setSelectedStory(null);
      setLinesDraft(null);
      setLimit(await api("/limits/today", undefined, token));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    }
  }

  function openEditor(story: StoryVariant) {
    setSelectedStory(story);
    setLinesDraft(story.linesJson);
  }

  async function saveLines() {
    if (!selectedStory || !linesDraft) return;
    try {
      linesSchema.parse(linesDraft);
      await api(
        `/stories/${selectedStory.id}/lines`,
        { method: "PATCH", body: JSON.stringify({ lines: linesDraft }) },
        token,
      );
      await api(`/stories/${selectedStory.id}/render`, { method: "POST" }, token);
      const refreshed = await api<Generation>(`/generations/${generation?.id}`, undefined, token);
      setGeneration(refreshed);
      setHistory(await api<StoryVariant[]>("/stories", undefined, token));
      const updated = refreshed.variants.find((v) => v.id === selectedStory.id);
      if (updated) {
        setSelectedStory(updated);
      }
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function sendTelegram(storyId: string) {
    try {
      await api(
        `/stories/${storyId}/send-telegram`,
        { method: "POST", body: JSON.stringify({ telegramId, caption: "Story from AI PL" }) },
        token,
      );
      alert("Sent to Telegram");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Telegram send failed");
    }
  }

  async function createPayment() {
    try {
      const payment = await api<{ confirmationUrl: string }>("/billing/create-payment", { method: "POST" }, token);
      window.open(payment.confirmationUrl, "_blank");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Payment create failed");
    }
  }

  return (
    <main className="container">
      <section className="panel">
        <h2>Story Generator</h2>
        {!token ? (
          <div className="field">
            <button onClick={() => mockLogin("USER")}>Login as USER</button>
            <button onClick={() => mockLogin("ADMIN")}>Login as ADMIN</button>
          </div>
        ) : null}

        {limit ? (
          <p className="status">
            Plan: {limit.plan}. Used: {limit.used}. Remaining: {limit.total === -1 ? "unlimited" : limit.remaining}
          </p>
        ) : null}
        {limit?.plan !== "PRO" && token ? <button onClick={createPayment}>Upgrade to PRO (1500 RUB)</button> : null}

        <label className="field">
          Complex
          <select value={complexId} onChange={(e) => setComplexId(e.target.value)}>
            {complexes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.developerName} / {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Room type
          <select value={roomTypeId} onChange={(e) => setRoomTypeId(e.target.value)}>
            {roomTypes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.label}
              </option>
            ))}
          </select>
        </label>

        <label className="field">
          Offer
          <textarea rows={5} value={offerText} onChange={(e) => setOfferText(e.target.value)} />
        </label>

        <label className="field">
          Telegram ID
          <input value={telegramId} onChange={(e) => setTelegramId(e.target.value)} placeholder="123456789" />
        </label>

        <button disabled={!canGenerate} onClick={createGeneration}>
          Generate stories
        </button>

        {error ? <p className="status">Error: {error}</p> : null}
      </section>

      <section className="panel">
        {!generation && <p>Your generated stories will appear here.</p>}
        {generation && generation.status !== "DONE" && generation.status !== "FAILED" && (
          <p>Generating stories, this can take up to one minute...</p>
        )}
        {generation?.status === "FAILED" && <p>Generation failed: {generation.error}</p>}

        {generation?.status === "DONE" && (
          <>
            <div className="story-grid">
              {generation.variants.map((variant) => (
                <article className="card" key={variant.id}>
                  <img src={`${API_URL}${variant.finalPngUrl || variant.previewPngUrl}`} alt={variant.templateKey} />
                  <div className="card-actions">
                    <button onClick={() => openEditor(variant)}>Edit</button>
                    <a href={`${API_URL}${variant.finalPngUrl || variant.previewPngUrl}`} download target="_blank" rel="noreferrer">
                      <button>Download</button>
                    </a>
                    <button onClick={() => sendTelegram(variant.id)}>Telegram</button>
                  </div>
                </article>
              ))}
            </div>

            {selectedStory && linesDraft && (
              <div className="editor">
                <h3>Line editor: {selectedStory.templateKey}</h3>
                <label className="field">
                  headline
                  <input
                    value={linesDraft.headline}
                    onChange={(e) => setLinesDraft({ ...linesDraft, headline: e.target.value })}
                  />
                </label>
                <label className="field">
                  subheadline
                  <input
                    value={linesDraft.subheadline}
                    onChange={(e) => setLinesDraft({ ...linesDraft, subheadline: e.target.value })}
                  />
                </label>
                <div className="row">
                  {linesDraft.bullets.map((bullet, idx) => (
                    <label className="field" key={idx}>
                      bullet {idx + 1}
                      <input
                        value={bullet}
                        onChange={(e) => {
                          const next = [...linesDraft.bullets] as StoryLines["bullets"];
                          next[idx] = e.target.value;
                          setLinesDraft({ ...linesDraft, bullets: next });
                        }}
                      />
                    </label>
                  ))}
                </div>
                <label className="field">
                  cta
                  <input value={linesDraft.cta} onChange={(e) => setLinesDraft({ ...linesDraft, cta: e.target.value })} />
                </label>
                <label className="field">
                  footnote
                  <input
                    value={linesDraft.footnote}
                    onChange={(e) => setLinesDraft({ ...linesDraft, footnote: e.target.value })}
                  />
                </label>
                <div className="row">
                  <label className="field">
                    priceLine
                    <input
                      value={linesDraft.priceLine}
                      onChange={(e) => setLinesDraft({ ...linesDraft, priceLine: e.target.value })}
                    />
                  </label>
                  <label className="field">
                    deadlineLine
                    <input
                      value={linesDraft.deadlineLine}
                      onChange={(e) => setLinesDraft({ ...linesDraft, deadlineLine: e.target.value })}
                    />
                  </label>
                </div>
                <button onClick={saveLines}>Save and rerender</button>
              </div>
            )}
          </>
        )}

        {history.length > 0 && (
          <div className="editor">
            <h3>Recent stories (last 20)</h3>
            {history.slice(0, 20).map((story) => (
              <p className="status" key={story.id}>
                {story.templateKey} - {story.id}
              </p>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
