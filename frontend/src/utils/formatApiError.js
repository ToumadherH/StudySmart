/**
 * Normalize Axios / API errors into a consistent shape for UI.
 */
export const ERROR_KIND = {
  NETWORK: "network",
  VALIDATION: "validation",
  AUTH: "auth",
  PERMISSION: "permission",
  NOT_FOUND: "not_found",
  SERVER: "server",
  UNKNOWN: "unknown",
};

function asText(value) {
  if (value == null) return "";
  if (Array.isArray(value)) {
    return value.map((v) => (typeof v === "string" ? v : JSON.stringify(v))).join(" ");
  }
  if (typeof value === "object") {
    return Object.entries(value)
      .map(([k, v]) => `${k}: ${asText(v)}`)
      .join(" ");
  }
  return String(value);
}

function extractPrimaryMessage(data) {
  if (data == null) return null;
  if (typeof data === "string") return data;
  if (typeof data !== "object") return null;
  if (data.detail != null) return asText(data.detail);
  if (Array.isArray(data.non_field_errors) && data.non_field_errors.length) {
    return asText(data.non_field_errors);
  }
  if (data.error != null) return asText(data.error);
  return null;
}

/**
 * Turn DRF-style field errors into { fieldKey: "readable string" }
 */
export function normalizeFieldErrors(data) {
  if (!data || typeof data !== "object") return {};
  const skip = new Set(["detail", "non_field_errors"]);
  const out = {};
  for (const [key, val] of Object.entries(data)) {
    if (skip.has(key)) continue;
    const text = asText(val).trim();
    if (text) out[key] = text;
  }
  return out;
}

/**
 * @param {unknown} error - Typically an Axios error
 * @param {{ loginAttempt?: boolean, fallbackMessage?: string }} options
 */
export function formatApiError(error, options = {}) {
  const { loginAttempt = false, fallbackMessage = "Something went wrong. Please try again." } =
    options;

  const err = error;

  if (!err || typeof err !== "object") {
    return {
      kind: ERROR_KIND.UNKNOWN,
      summary: "Unexpected error",
      message: fallbackMessage,
    };
  }

  if (!err.response) {
    if (err.code === "ECONNABORTED") {
      return {
        kind: ERROR_KIND.NETWORK,
        summary: "Request timed out",
        message:
          "The server took too long to respond. Check your connection and try again.",
      };
    }
    return {
      kind: ERROR_KIND.NETWORK,
      summary: "Cannot reach server",
      message:
        "No response from the server. Make sure the backend is running (e.g. http://127.0.0.1:8000), then refresh this page.",
    };
  }

  const status = err.response.status;
  const data = err.response.data;
  const primary = extractPrimaryMessage(data);

  if (status === 401) {
    if (loginAttempt) {
      return {
        kind: ERROR_KIND.AUTH,
        summary: "Sign-in failed",
        message:
          "Incorrect username or password, or this account does not exist. Check your credentials and try again.",
      };
    }
    return {
      kind: ERROR_KIND.AUTH,
      summary: "Session expired",
      message: primary || "You need to sign in again to continue.",
    };
  }

  if (status === 403) {
    return {
      kind: ERROR_KIND.PERMISSION,
      summary: "Access denied",
      message:
        primary ||
        "You do not have permission to do this. If you are logged in as another user, sign out and try again.",
    };
  }

  if (status === 404) {
    return {
      kind: ERROR_KIND.NOT_FOUND,
      summary: "Not found",
      message:
        primary ||
        "The requested item or address was not found. It may have been removed or the link is outdated.",
    };
  }

  if (status === 400) {
    return {
      kind: ERROR_KIND.VALIDATION,
      summary: "Invalid data",
      message:
        primary ||
        "The server could not accept this data. Check the highlighted fields or your input.",
    };
  }

  if (status >= 500) {
    return {
      kind: ERROR_KIND.SERVER,
      summary: "Server problem",
      message:
        primary ||
        "Something went wrong on the server. Please wait a moment and try again.",
    };
  }

  return {
    kind: ERROR_KIND.UNKNOWN,
    summary: `Error (${status})`,
    message: primary || fallbackMessage,
  };
}
