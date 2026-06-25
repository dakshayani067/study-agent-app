'use client';

import { useState, useRef, useEffect } from 'react';
import { Navbar } from './components/navbar';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  subject?: string;
  concept?: string;
  isComplete?: boolean;
}

interface DetectConceptResponse {
  subject: string;
  concept: string;
}

interface SaveModalState {
  isOpen: boolean;
  messageId: string;
  subject: string;
  concept: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [saveModal, setSaveModal] = useState<SaveModalState>({
    isOpen: false,
    messageId: '',
    subject: '',
    concept: '',
  });
  const [formData, setFormData] = useState({
    masteryLevel: 'Developing',
    overviewGist: '',
    deepDiveGist: '',
    strongAreas: '',
    weakAreas: '',
    nextSteps: '',
    notes: '',
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    const userMessageId = Date.now().toString();

    // Add user message to chat
    setMessages((prev) => [
      ...prev,
      {
        id: userMessageId,
        role: 'user',
        content: userMessage,
      },
    ]);

    setInput('');
    setIsLoading(true);

    try {
      // Step 1: Detect concept
      const detectResponse = await fetch('/api/detect-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage }),
      });

      const detected = (await detectResponse.json()) as DetectConceptResponse;
      const { subject, concept } = detected;

      const assistantMessageId = (Date.now() + 1).toString();

      // Step 2: Call chat API with streaming
      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage,
          subject: subject || '',
          concept: concept || '',
        }),
      });

      if (!chatResponse.ok) {
        throw new Error('Chat API error');
      }

      // Add assistant message placeholder
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          subject: subject || undefined,
          concept: concept || undefined,
          isComplete: false,
        },
      ]);

      // Stream response
      const reader = chatResponse.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });

          setMessages((prev) => {
            const updated = [...prev];
            const msgIndex = updated.findIndex(
              (m) => m.id === assistantMessageId
            );
            if (msgIndex >= 0) {
              updated[msgIndex].content += chunk;
            }
            return updated;
          });
        }
      }

      // Mark message as complete
      setMessages((prev) => {
        const updated = [...prev];
        const msgIndex = updated.findIndex(
          (m) => m.id === assistantMessageId
        );
        if (msgIndex >= 0) {
          updated[msgIndex].isComplete = true;
        }
        return updated;
      });
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Sorry, there was an error processing your request.',
          isComplete: true,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const openSaveModal = (messageId: string, subject: string, concept: string) => {
    setSaveModal({ isOpen: true, messageId, subject, concept });
    setFormData({
      masteryLevel: 'Developing',
      overviewGist: '',
      deepDiveGist: '',
      strongAreas: '',
      weakAreas: '',
      nextSteps: '',
      notes: '',
    });
  };

  const closeSaveModal = () => {
    setSaveModal({ isOpen: false, messageId: '', subject: '', concept: '' });
  };

  const handleSaveProgress = async () => {
    try {
      const payload = {
        subject: saveModal.subject,
        concept: saveModal.concept,
        masteryLevel: formData.masteryLevel,
        overviewGist: formData.overviewGist,
        deepDiveGist: formData.deepDiveGist
          .split('\n')
          .filter((s) => s.trim()),
        strongAreas: formData.strongAreas.split('\n').filter((s) => s.trim()),
        weakAreas: formData.weakAreas.split('\n').filter((s) => s.trim()),
        nextSteps: formData.nextSteps.split('\n').filter((s) => s.trim()),
        notes: formData.notes || undefined,
      };

      const response = await fetch('/api/save-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        closeSaveModal();
        alert('Progress saved successfully!');
      } else {
        alert('Failed to save progress');
      }
    } catch (error) {
      console.error('Save error:', error);
      alert('Error saving progress');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="rounded-3xl bg-slate-900/90 border border-slate-800 shadow-2xl shadow-slate-950/30 p-6 mb-6 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-3xl font-semibold text-white">Study smarter with a coach-like AI tutor</p>
              <p className="mt-2 text-slate-300 max-w-2xl">
                Ask a question, get a concept-aware response, and save your progress as you study.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <span className="rounded-full bg-slate-800 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">Concept-aware</span>
              <span className="rounded-full bg-slate-800 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">Streaming chat</span>
              <span className="rounded-full bg-slate-800 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">Save progress</span>
              <span className="rounded-full bg-slate-800 px-4 py-2 text-xs uppercase tracking-[0.24em] text-slate-300">Study tips</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto rounded-[2rem] border border-slate-800 bg-slate-950/80 shadow-xl shadow-slate-950/20 p-5" style={{ minHeight: '60vh' }}>
          {messages.length === 0 && (
            <div className="h-full flex items-center justify-center text-slate-400">
              <div className="text-center">
                <p className="text-2xl font-semibold mb-2">Start a study session</p>
                <p className="text-sm max-w-xl mx-auto">Ask a question about any subject and get a clear, concept-aware explanation with an encouraging tone.</p>
              </div>
            </div>
          )}

        {messages.map((message) => (
          <div key={message.id} className="group">
            {message.role === 'user' ? (
              <div className="flex justify-end">
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-500 to-cyan-400 px-5 py-4 text-white shadow-[0_18px_60px_-30px_rgba(56,189,248,0.85)] max-w-2xl break-words">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(255,255,255,0.25),_transparent_40%)] opacity-40 pointer-events-none" />
                  <p className="relative text-sm leading-7">{message.content}</p>
                  <span className="mt-3 inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-white/80">You</span>
                </div>
              </div>
            ) : (
              <div className="flex justify-start">
                <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 px-5 py-4 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.9)] max-w-2xl">
                  <div className="absolute -right-8 top-4 h-24 w-24 rounded-full bg-slate-700/70 blur-2xl" />
                  <div className="relative">
                    {(message.subject || message.concept) && (
                      <div className="mb-3 flex flex-wrap gap-2">
                        {message.subject && (
                          <span className="rounded-full bg-emerald-600/15 px-3 py-1 text-xs text-emerald-300">
                            {message.subject}
                          </span>
                        )}
                        {message.concept && (
                          <span className="rounded-full bg-sky-600/15 px-3 py-1 text-xs text-sky-300">
                            {message.concept}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="text-slate-100 break-words whitespace-pre-wrap text-sm leading-7">
                      {message.content || 'Thinking...'}
                    </div>
                    <span className="mt-4 inline-flex rounded-full bg-slate-800 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-slate-300">
                      AI Tutor
                    </span>
                  </div>

                  {message.isComplete && message.subject && message.concept && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          openSaveModal(
                            message.id,
                            message.subject!,
                            message.concept!
                          )
                        }
                        className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1 rounded-full transition"
                      >
                        💾 Save progress
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/95 px-5 py-4 shadow-[0_18px_60px_-30px_rgba(15,23,42,0.9)] max-w-2xl animate-pulse">
              <div className="space-y-3">
                <div className="h-3 w-48 rounded-full bg-slate-700" />
                <div className="h-3 w-32 rounded-full bg-slate-700" />
                <div className="h-3 w-40 rounded-full bg-slate-700" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-6">
        <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-4 shadow-2xl shadow-slate-950/20 backdrop-blur-sm">
          <form onSubmit={handleSendMessage} className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Ask something you're curious about
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400">
                  💬
                </span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Explain exponential growth in physics..."
                  disabled={isLoading}
                  className="w-full bg-slate-950 border border-slate-800 rounded-3xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="inline-flex shrink-0 items-center justify-center rounded-3xl bg-gradient-to-r from-cyan-500 to-blue-500 px-6 py-4 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-50"
            >
              Send
            </button>
          </form>
          <p className="mt-3 text-xs text-slate-500">
            Tip: keep questions specific to get clearer examples, analogies, and structured explanations.
          </p>
        </div>
      </div>

      {/* Save Progress Modal */}
      {saveModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950/95 p-6 shadow-2xl shadow-slate-950/40">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Save Progress
                </h2>
                <p className="text-slate-400">{saveModal.concept} · {saveModal.subject}</p>
              </div>
              <button
                onClick={closeSaveModal}
                className="rounded-full bg-slate-800 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 mt-6">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Mastery Level
                </label>
                <select
                  value={formData.masteryLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      masteryLevel: e.target.value,
                    })
                  }
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white"
                >
                  <option>Introduced</option>
                  <option>Developing</option>
                  <option>Proficient</option>
                  <option>Strong</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Overview Gist
                </label>
                <textarea
                  value={formData.overviewGist}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      overviewGist: e.target.value,
                    })
                  }
                  placeholder="Brief summary of the concept..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Deep Dive Points (one per line)
                </label>
                <textarea
                  value={formData.deepDiveGist}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      deepDiveGist: e.target.value,
                    })
                  }
                  placeholder="Key points to explore deeper..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Strong Areas (one per line)
                </label>
                <textarea
                  value={formData.strongAreas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      strongAreas: e.target.value,
                    })
                  }
                  placeholder="What you're doing well..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Weak Areas (one per line)
                </label>
                <textarea
                  value={formData.weakAreas}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      weakAreas: e.target.value,
                    })
                  }
                  placeholder="Areas that need improvement..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Next Steps (one per line)
                </label>
                <textarea
                  value={formData.nextSteps}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      nextSteps: e.target.value,
                    })
                  }
                  placeholder="What to study next..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      notes: e.target.value,
                    })
                  }
                  placeholder="Any other observations..."
                  className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm"
                  rows={2}
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={closeSaveModal}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProgress}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded font-medium transition"
              >
                Save Progress
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
