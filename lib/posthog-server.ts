import { PostHog } from 'posthog-node'

export function getPostHogClient(): PostHog {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN

  if (!token) {
    if (process.env.NODE_ENV === 'development') {
      console.error(
        'NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, ' +
          'this causes events to be silently missed. ' +
          'This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured'
      )
    }
  }

  const client = new PostHog(token ?? '', {
    host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // Short-lived handlers: flush immediately so events are not dropped
    flushAt: 1,
    flushInterval: 0,
  })

  return client
}
