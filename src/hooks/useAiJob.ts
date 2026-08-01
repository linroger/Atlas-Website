import { trpc } from "@/providers/trpc";

export type AiJobState = "idle" | "queued" | "running" | "done" | "failed";

/**
 * Polls an async AI job (film render / banner / narration / DNA art)
 * until it settles. Returns status + result url.
 */
export function useAiJob(jobId: number | null) {
  const query = trpc.ai.jobStatus.useQuery(
    { jobId: jobId ?? 0 },
    {
      enabled: jobId != null,
      refetchInterval: (q) => {
        const status = q.state.data?.status;
        if (status === "done" || status === "failed") return false;
        return 4000;
      },
    },
  );

  if (jobId == null) {
    return { status: "idle" as const, url: null, error: null };
  }
  if (!query.data) {
    return {
      status: "queued" as const,
      url: null,
      error: query.isError
        ? "Job status is temporarily unavailable; polling the original job will continue"
        : null,
    };
  }
  return {
    status: query.data.status as AiJobState,
    url: query.data.result?.url ?? null,
    error:
      query.data.error ??
      (query.isError
        ? "Job status is temporarily unavailable; polling the original job will continue"
        : null),
  };
}
