import axios from "axios";

interface ApiErrorBody {
  message?: string;
  errors?: { msg?: string }[];
}

/** One place that turns any thrown value into a message a person can act on. */
export function getErrorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  if (axios.isAxiosError(err)) {
    if (err.code === "ECONNABORTED") return "The server took too long to respond. Please try again.";
    if (!err.response) return "Can't reach the server. Check your connection and try again.";
    const data = err.response.data as ApiErrorBody | undefined;
    const first = data?.errors?.[0]?.msg;
    if (first) return first;
    if (data?.message) return data.message;
    if (err.response.status === 403) return "You don't have permission to do that.";
    if (err.response.status === 404) return "We couldn't find that.";
    return fallback;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}
