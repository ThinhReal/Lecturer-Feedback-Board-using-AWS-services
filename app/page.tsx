"use client";

import { useEffect, useState, type FormEvent } from "react";

type FeedbackItem = {
  id: string;
  name: string;
  message: string;
  createdAt: string;
  editedAt?: string;
};

export default function Home() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editMessage, setEditMessage] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadFeedback() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load feedback");
      const data = (await res.json()) as { items: FeedbackItem[] };
      setItems(data.items ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFeedback();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !message.trim()) return;

    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, message }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to submit feedback");
      }
      const data = (await res.json()) as { item: FeedbackItem };
      setItems((prev) => [data.item, ...prev]);
      setName("");
      setMessage("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    setError(null);
    try {
      const res = await fetch(`/api/feedback?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete feedback");
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingId(null);
    }
  }

  function startEdit(item: FeedbackItem) {
    setEditingId(item.id);
    setEditName(item.name);
    setEditMessage(item.message);
    setError(null);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditName("");
    setEditMessage("");
  }

  async function handleSaveEdit(id: string) {
    if (!editName.trim() || !editMessage.trim()) return;

    setSavingEdit(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: editName, message: editMessage }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as {
          error?: string;
        } | null;
        throw new Error(data?.error ?? "Failed to update feedback");
      }
      const data = (await res.json()) as { item: FeedbackItem };
      setItems((prev) =>
        prev.map((item) => (item.id === id ? data.item : item))
      );
      cancelEdit();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingEdit(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-linear-to-b from-slate-50 to-white px-4 py-12 dark:from-zinc-950 dark:to-black sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="text-center sm:text-left">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
            Lecturer Feedback Board
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            Share your thoughts about lectures, courses, and teaching style.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
            Leave feedback
          </h2>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="name"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                maxLength={80}
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="message"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Message
              </label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write your feedback..."
                required
                rows={4}
                maxLength={1000}
                className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
              />
            </div>

            <div className="flex items-center justify-between gap-3">
              {error ? (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {error}
                </p>
              ) : (
                <span />
              )}
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Feedback"}
              </button>
            </div>
          </form>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium text-zinc-900 dark:text-zinc-50">
              All feedback
              {items.length > 0 && (
                <span className="ml-2 text-sm font-normal text-zinc-500">
                  ({items.length})
                </span>
              )}
            </h2>
            <button
              type="button"
              onClick={loadFeedback}
              disabled={loading}
              className="text-sm font-medium text-blue-600 hover:text-blue-700 disabled:opacity-60 dark:text-blue-400 dark:hover:text-blue-300"
            >
              {loading ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {loading && items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              Loading feedback...
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
              No feedback yet. Be the first to leave one!
            </div>
          ) : (
            <ul className="flex flex-col gap-3">
              {items.map((item) => {
                const isEditing = editingId === item.id;
                return (
                  <li
                    key={item.id}
                    className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor={`edit-name-${item.id}`}
                            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
                          >
                            Name
                          </label>
                          <input
                            id={`edit-name-${item.id}`}
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            maxLength={80}
                            className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor={`edit-message-${item.id}`}
                            className="text-xs font-medium text-zinc-600 dark:text-zinc-400"
                          >
                            Message
                          </label>
                          <textarea
                            id={`edit-message-${item.id}`}
                            value={editMessage}
                            onChange={(e) => setEditMessage(e.target.value)}
                            rows={3}
                            maxLength={1000}
                            className="resize-y rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none ring-blue-500/30 transition focus:border-blue-500 focus:ring-4 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-50"
                          />
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            disabled={savingEdit}
                            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(item.id)}
                            disabled={
                              savingEdit ||
                              !editName.trim() ||
                              !editMessage.trim()
                            }
                            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {savingEdit ? "Saving..." : "Save"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <p className="font-medium text-zinc-900 dark:text-zinc-50">
                              {item.name}
                            </p>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">
                              {formatDate(item.createdAt)}
                            </p>
                            {item.editedAt && (
                              <span
                                title={`Edited ${formatDate(item.editedAt)}`}
                                className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                              >
                                Edited
                                <span className="font-normal normal-case tracking-normal text-amber-700/80 dark:text-amber-300/80">
                                  · {formatDate(item.editedAt)}
                                </span>
                              </span>
                            )}
                          </div>
                          <p className="mt-2 whitespace-pre-wrap wrap-break-word text-sm text-zinc-700 dark:text-zinc-300">
                            {item.message}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(item)}
                            aria-label="Edit feedback"
                            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-blue-600 transition hover:border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:hover:border-blue-900/40 dark:hover:bg-blue-950/40"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            disabled={deletingId === item.id}
                            aria-label="Delete feedback"
                            className="rounded-lg border border-transparent px-3 py-1.5 text-xs font-medium text-red-600 transition hover:border-red-200 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60 dark:text-red-400 dark:hover:border-red-900/40 dark:hover:bg-red-950/40"
                          >
                            {deletingId === item.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
