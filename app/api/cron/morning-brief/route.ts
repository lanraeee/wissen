import { NextRequest, NextResponse } from 'next/server'
import { log } from '@/lib/logger'
import { generateMorningBrief } from '@/lib/agents/runner'

/**
 * Daily morning brief for Operations Lead.
 * Called at 03:00 UTC by GitHub Actions nightly-crons.yml
 */
export async function POST(request: NextRequest) {
  // Verify cron secret. Guard against an unset/empty CRON_SECRET so an empty
  // `Bearer ` token can never authorize the request (this project has been
  // bitten by env vars that were present but empty — see docs/AZURE_DEPLOYMENT.md).
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret || request.headers.get('authorization') !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const brief = await generateMorningBrief()

    log.info('morning-brief', 'Generated', {
      queue_total: brief.queue_total,
      agents_with_pending: brief.agent_summaries.filter(s => s.pending_approvals > 0).length,
    })

    // TODO: Post brief to Operations Lead (via email, Slack, or dashboard)
    // For now, just return it for logging
    return NextResponse.json({
      ok: true,
      brief,
      message: 'Morning brief generated',
    })
  } catch (err) {
    log.error('morning-brief', err)
    return NextResponse.json(
      { error: 'Failed to generate brief', details: String(err) },
      { status: 500 }
    )
  }
}
