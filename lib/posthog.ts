import posthog from "posthog-js";

export function trackEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== "undefined") {
    posthog.capture(event, properties);
  }
}

export function identifyUser(
  email: string,
  properties?: Record<string, unknown>
) {
  if (typeof window !== "undefined") {
    posthog.identify(email, properties);
  }
}

export function resetUser() {
  if (typeof window !== "undefined") {
    posthog.reset();
  }
}
