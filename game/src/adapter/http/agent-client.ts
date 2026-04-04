const LOAD_TIMEOUT_MS = 120_000;

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

/** A2A load body requires `domain`; derive from ENS name (`alice.eth` → `https://alice.local`). */
function domainFromEnsName(name: string): string {
  return `https://${name.slice(0, -".eth".length)}.local`;
}

export interface PostAgentLoadParams {
  name: string;
  strategy: string;
}

/**
 * `POST {baseUrl}/message/send` with `phase: "load"` (same contract as ai/ agent server).
 */
export async function postAgentLoad(
  baseUrl: string,
  params: PostAgentLoadParams,
): Promise<void> {
  const url = `${normalizeBaseUrl(baseUrl)}/message/send`;
  const body = {
    phase: "load" as const,
    name: params.name,
    domain: domainFromEnsName(params.name),
    strategy: params.strategy,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(LOAD_TIMEOUT_MS),
  });

  const text = await res.text();
  let parsed: unknown;
  try {
    parsed = text.length > 0 ? JSON.parse(text) : null;
  } catch {
    throw new Error(
      `Agent load at ${url}: ${res.status} non-JSON body: ${text.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    const err =
      parsed !== null &&
      typeof parsed === "object" &&
      "error" in parsed &&
      typeof (parsed as { error: unknown }).error === "string"
        ? (parsed as { error: string }).error
        : text;
    throw new Error(`Agent load failed (${res.status}): ${err}`);
  }

  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "error" in parsed &&
    typeof (parsed as { error: unknown }).error === "string"
  ) {
    throw new Error(`Agent load error: ${(parsed as { error: string }).error}`);
  }
}
