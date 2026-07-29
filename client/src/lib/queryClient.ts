import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
let csrfTokenPromise: Promise<string> | undefined;

async function getCsrfToken(forceRefresh = false): Promise<string> {
  if (forceRefresh) {
    csrfTokenPromise = undefined;
  }

  csrfTokenPromise ??= fetch("/auth/csrf-token", {
    credentials: "include",
    cache: "no-store",
  })
    .then(async (response) => {
      await throwIfResNotOk(response);
      const body: unknown = await response.json();
      if (
        !body ||
        typeof body !== "object" ||
        !("csrfToken" in body) ||
        typeof body.csrfToken !== "string"
      ) {
        throw new Error("The server returned an invalid CSRF token");
      }
      return body.csrfToken;
    })
    .catch((error) => {
      csrfTokenPromise = undefined;
      throw error;
    });

  return csrfTokenPromise;
}

export async function csrfFetch(
  input: RequestInfo | URL,
  init: RequestInit = {},
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  if (SAFE_METHODS.has(method)) {
    return fetch(input, { ...init, credentials: "include" });
  }

  const send = async (forceRefresh: boolean) => {
    const headers = new Headers(init.headers);
    headers.set("X-CSRF-Token", await getCsrfToken(forceRefresh));
    return fetch(input, {
      ...init,
      method,
      headers,
      credentials: "include",
    });
  };

  let response = await send(false);
  if (
    response.status === 403 &&
    response.headers.get("X-CSRF-Error") === "invalid-token"
  ) {
    response = await send(true);
  }
  return response;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const res = await csrfFetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const res = await fetch(queryKey.join("/") as string, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 0, // Always fetch fresh data
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
