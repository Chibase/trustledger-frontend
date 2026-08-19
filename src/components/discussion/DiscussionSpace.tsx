"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { PLANS, type PlanId } from "@/config/plans";
import {
  addDiscussionCalendarItem,
  addDiscussionResponse,
  canCreateDiscussionEngagement,
  closeDiscussionThread,
  createDiscussionThread,
  formatDiscussionStamp,
  listDiscussionsForSubject,
  readSessionPlanId,
} from "@/lib/discussionStore";
import { useToast } from "@/components/ui/Toast";
import {
  DISCUSSION_KIND_LABELS,
  DISCUSSION_KINDS,
  DISCUSSION_STATUS_LABELS,
  type DiscussionKind,
  type DiscussionSubjectRef,
  type DiscussionThread,
} from "@/types/discussion";

type DiscussionSpaceProps = {
  subject: DiscussionSubjectRef;
  /** Display name for the current viewer / responder. */
  authorName?: string;
  authorRole?: string;
  /** Workspace plan — stamped on each thread for audit. */
  planId?: PlanId | null;
  /** Compact layout for presentation chrome. */
  compact?: boolean;
};

function toLocalInputValue(d = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(value: string): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/**
 * Discussion / feedback space for report and issue viewers.
 * Captures given/responded stamps and optional meeting calendar items on every plan.
 */
export function DiscussionSpace({
  subject,
  authorName = "Viewer",
  authorRole,
  planId = null,
  compact = false,
}: DiscussionSpaceProps) {
  const { pushToast } = useToast();
  const [threads, setThreads] = useState<DiscussionThread[]>([]);
  const [kind, setKind] = useState<DiscussionKind>("feedback");
  const [body, setBody] = useState("");
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingAt, setMeetingAt] = useState(toLocalInputValue());
  const [meetingLocation, setMeetingLocation] = useState("");
  const [createEngagement, setCreateEngagement] = useState(true);
  const [replyByThread, setReplyByThread] = useState<Record<string, string>>(
    {},
  );
  const [scheduleByThread, setScheduleByThread] = useState<
    Record<string, { title: string; at: string; location: string }>
  >({});
  const [error, setError] = useState<string | null>(null);

  const resolvedPlan = planId || readSessionPlanId();
  const canCreateEngagement = canCreateDiscussionEngagement(resolvedPlan);

  function refresh() {
    setThreads(
      listDiscussionsForSubject(subject.subjectType, subject.subjectId),
    );
  }

  useEffect(() => {
    const frame = requestAnimationFrame(() => refresh());
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- subject ids only
  }, [subject.subjectType, subject.subjectId]);

  function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (body.trim().length < 4) {
      setError("Add a short note (at least a few words).");
      return;
    }
    if (kind === "meeting_request" && !meetingAt) {
      setError("Choose a date and time for the proposed meeting.");
      return;
    }
    createDiscussionThread({
      subject,
      kind,
      body,
      authorName,
      authorRole,
      planId: resolvedPlan,
      calendar:
        kind === "meeting_request"
          ? {
              title: meetingTitle || `Meeting · ${subject.subjectTitle}`,
              startsAt: localInputToIso(meetingAt),
              location: meetingLocation,
              kind: "meeting",
              notes: body,
              createEngagement: createEngagement && canCreateEngagement,
            }
          : undefined,
    });
    setBody("");
    setMeetingTitle("");
    setMeetingLocation("");
    setKind("feedback");
    refresh();
    pushToast(
      kind === "meeting_request"
        ? "Meeting request saved with calendar stamp"
        : "Feedback recorded",
      "success",
    );
  }

  function handleReply(threadId: string) {
    const text = (replyByThread[threadId] || "").trim();
    if (text.length < 2) {
      pushToast("Write a short response first", "error");
      return;
    }
    addDiscussionResponse({
      threadId,
      body: text,
      authorName,
      authorRole,
    });
    setReplyByThread((prev) => ({ ...prev, [threadId]: "" }));
    refresh();
    pushToast("Response stamped", "success");
  }

  function handleSchedule(threadId: string) {
    const draft = scheduleByThread[threadId];
    if (!draft?.at) {
      pushToast("Choose a meeting date and time", "error");
      return;
    }
    addDiscussionCalendarItem({
      threadId,
      title: draft.title || `Follow-up · ${subject.subjectTitle}`,
      startsAt: localInputToIso(draft.at),
      location: draft.location,
      kind: "meeting",
      createEngagement: createEngagement && canCreateEngagement,
      authorName,
    });
    setScheduleByThread((prev) => {
      const next = { ...prev };
      delete next[threadId];
      return next;
    });
    refresh();
    pushToast("Calendar item captured", "success");
  }

  return (
    <section
      className={`space-y-4 border-t border-tl-line print:hidden ${
        compact ? "pt-4" : "rounded-lg border border-tl-line bg-tl-surface p-4"
      }`}
      aria-label="Discussion and feedback"
    >
      <div>
        <h2
          className={`font-semibold text-tl-ink ${compact ? "text-base" : "text-lg"}`}
        >
          Discussion &amp; feedback
        </h2>
        <p className="mt-1 text-xs text-tl-ink-muted">
          Viewers can leave feedback, request information, or propose a meeting.
          Each note stores the date and time it was given and when it was
          responded to
          {resolvedPlan ? (
            <>
              {" "}
              · plan stamp:{" "}
              <span className="font-medium text-tl-ink">
                {PLANS[resolvedPlan].name}
              </span>
            </>
          ) : null}
          .
        </p>
      </div>

      <form onSubmit={handleCreate} className="space-y-3 text-tl-ink">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs">
            <span className="mb-1 block font-medium">Type</span>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as DiscussionKind)}
              className="w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink"
            >
              {DISCUSSION_KINDS.map((k) => (
                <option key={k} value={k}>
                  {DISCUSSION_KIND_LABELS[k]}
                </option>
              ))}
            </select>
          </label>
          {kind === "meeting_request" ? (
            <label className="block text-xs">
              <span className="mb-1 block font-medium">Proposed date &amp; time</span>
              <input
                type="datetime-local"
                required
                value={meetingAt}
                onChange={(e) => setMeetingAt(e.target.value)}
                className="w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink"
              />
            </label>
          ) : (
            <div className="hidden sm:block" aria-hidden />
          )}
        </div>

        {kind === "meeting_request" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="mb-1 block font-medium">Meeting title</span>
              <input
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="e.g. Site clarification meeting"
                className="w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink placeholder:text-tl-ink-muted"
              />
            </label>
            <label className="block text-xs">
              <span className="mb-1 block font-medium">Venue / link</span>
              <input
                value={meetingLocation}
                onChange={(e) => setMeetingLocation(e.target.value)}
                placeholder="Optional"
                className="w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink placeholder:text-tl-ink-muted"
              />
            </label>
            {canCreateEngagement ? (
              <label className="flex items-center gap-2 text-xs sm:col-span-2">
                <input
                  type="checkbox"
                  checked={createEngagement}
                  onChange={(e) => setCreateEngagement(e.target.checked)}
                />
                <span>
                  Also create a draft Engagement (Project+).{" "}
                  <Link
                    href="/app/engagements"
                    className="text-tl-trust-ink underline"
                  >
                    Open engagements
                  </Link>
                </span>
              </label>
            ) : (
              <p className="text-[0.65rem] text-tl-ink-muted sm:col-span-2">
                Calendar stamp is saved on every plan. Draft Engagements unlock
                on Project / Institutional.
              </p>
            )}
          </div>
        ) : null}

        <label className="block text-xs">
          <span className="mb-1 block font-medium">Your note</span>
          <textarea
            required
            rows={compact ? 3 : 4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={
              kind === "info_request"
                ? "What information do you need?"
                : kind === "meeting_request"
                  ? "Why should we meet, and what should we cover?"
                  : "Share feedback on this report or case…"
            }
            className="w-full rounded-md border border-tl-line bg-tl-paper px-3 py-2 text-sm text-tl-ink placeholder:text-tl-ink-muted"
          />
        </label>
        {error ? (
          <p className="text-sm text-tl-danger" role="alert">
            {error}
          </p>
        ) : null}
        <button
          type="submit"
          className="rounded-md bg-tl-trust px-4 py-2 text-sm font-medium text-white hover:bg-tl-trust-ink"
        >
          {kind === "meeting_request"
            ? "Submit meeting request"
            : kind === "info_request"
              ? "Send request"
              : "Submit feedback"}
        </button>
      </form>

      {threads.length === 0 ? (
        <p className="text-sm text-tl-ink-muted">
          No discussion yet on this {subject.subjectType}.
        </p>
      ) : (
        <ul className="space-y-4">
          {threads.map((thread) => (
            <li
              key={thread.id}
              className="rounded-md border border-tl-line bg-tl-paper px-3 py-3"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="text-sm font-medium text-tl-ink">
                  {DISCUSSION_KIND_LABELS[thread.kind]}
                  <span className="ml-2 text-xs font-normal text-tl-ink-muted">
                    {DISCUSSION_STATUS_LABELS[thread.status]}
                    {thread.planId ? ` · ${PLANS[thread.planId].name}` : ""}
                  </span>
                </p>
                {thread.status !== "closed" ? (
                  <button
                    type="button"
                    className="text-xs text-tl-ink-muted underline hover:text-tl-ink"
                    onClick={() => {
                      closeDiscussionThread(thread.id);
                      refresh();
                    }}
                  >
                    Close
                  </button>
                ) : null}
              </div>
              <p className="mt-1 text-[0.7rem] text-tl-ink-muted">
                Given {formatDiscussionStamp(thread.givenAt)}
                {" · "}
                Responded{" "}
                {thread.respondedAt
                  ? formatDiscussionStamp(thread.respondedAt)
                  : "pending"}
              </p>

              <ul className="mt-3 space-y-2 border-t border-tl-line/80 pt-2">
                {thread.messages.map((msg) => (
                  <li key={msg.id} className="text-sm">
                    <p className="font-medium text-tl-ink">
                      {msg.isResponse ? "Response · " : ""}
                      {msg.authorName}
                      <span className="ml-2 text-[0.65rem] font-normal text-tl-ink-muted">
                        {formatDiscussionStamp(msg.givenAt)}
                        {msg.respondedAt
                          ? ` → replied ${formatDiscussionStamp(msg.respondedAt)}`
                          : ""}
                      </span>
                    </p>
                    <p className="mt-0.5 whitespace-pre-wrap text-tl-ink-muted">
                      {msg.body}
                    </p>
                  </li>
                ))}
              </ul>

              {thread.calendarItems.length ? (
                <div className="mt-3 border-t border-tl-line/80 pt-2">
                  <p className="text-xs font-medium uppercase tracking-wide text-tl-ink-muted">
                    Calendar
                  </p>
                  <ul className="mt-1 space-y-1 text-sm">
                    {thread.calendarItems.map((item) => (
                      <li key={item.id}>
                        <span className="font-medium text-tl-ink">
                          {item.title}
                        </span>
                        <span className="text-tl-ink-muted">
                          {" "}
                          · {formatDiscussionStamp(item.startsAt)}
                          {item.location ? ` · ${item.location}` : ""}
                          {item.engagementId ? (
                            <>
                              {" · "}
                              <Link
                                href={`/app/engagements/${item.engagementId}`}
                                className="text-tl-trust-ink underline"
                              >
                                Engagement
                              </Link>
                            </>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {thread.status !== "closed" ? (
                <div className="mt-3 space-y-2 border-t border-tl-line/80 pt-3">
                  <label className="block text-xs">
                    <span className="mb-1 block font-medium">Respond</span>
                    <textarea
                      rows={2}
                      value={replyByThread[thread.id] || ""}
                      onChange={(e) =>
                        setReplyByThread((prev) => ({
                          ...prev,
                          [thread.id]: e.target.value,
                        }))
                      }
                      placeholder="Reply — date and time are stamped automatically"
                      className="w-full rounded-md border border-tl-line bg-tl-surface px-3 py-2 text-sm"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => handleReply(thread.id)}
                      className="rounded-md bg-tl-trust px-3 py-1.5 text-xs font-medium text-white hover:bg-tl-trust-ink"
                    >
                      Stamp response
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setScheduleByThread((prev) => ({
                          ...prev,
                          [thread.id]: prev[thread.id] || {
                            title: "",
                            at: toLocalInputValue(),
                            location: "",
                          },
                        }))
                      }
                      className="rounded-md border border-tl-line bg-tl-surface px-3 py-1.5 text-xs font-medium hover:border-tl-trust/40"
                    >
                      Add calendar item
                    </button>
                  </div>
                  {scheduleByThread[thread.id] ? (
                    <div className="grid gap-2 rounded-md border border-dashed border-tl-line bg-tl-surface p-3 sm:grid-cols-2">
                      <label className="block text-xs sm:col-span-2">
                        <span className="mb-1 block font-medium">Title</span>
                        <input
                          value={scheduleByThread[thread.id].title}
                          onChange={(e) =>
                            setScheduleByThread((prev) => ({
                              ...prev,
                              [thread.id]: {
                                ...prev[thread.id],
                                title: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-md border border-tl-line px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        <span className="mb-1 block font-medium">
                          Date &amp; time
                        </span>
                        <input
                          type="datetime-local"
                          value={scheduleByThread[thread.id].at}
                          onChange={(e) =>
                            setScheduleByThread((prev) => ({
                              ...prev,
                              [thread.id]: {
                                ...prev[thread.id],
                                at: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-md border border-tl-line px-2 py-1.5 text-sm"
                        />
                      </label>
                      <label className="block text-xs">
                        <span className="mb-1 block font-medium">Venue</span>
                        <input
                          value={scheduleByThread[thread.id].location}
                          onChange={(e) =>
                            setScheduleByThread((prev) => ({
                              ...prev,
                              [thread.id]: {
                                ...prev[thread.id],
                                location: e.target.value,
                              },
                            }))
                          }
                          className="w-full rounded-md border border-tl-line px-2 py-1.5 text-sm"
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => handleSchedule(thread.id)}
                        className="rounded-md bg-tl-trust px-3 py-1.5 text-xs font-medium text-white hover:bg-tl-trust-ink sm:col-span-2"
                      >
                        Save calendar item
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
