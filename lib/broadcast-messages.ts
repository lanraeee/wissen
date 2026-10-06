// Ready-made copy for the Monthly Giving broadcast composer
// (components/admin/GivingManager.tsx). `{{project}}` is replaced
// client-side with the selected donation project's title before the
// message lands in the textarea -- admin can still edit freely afterward.
// Kept here (not in the component) so it's easy to add/edit presets without
// touching the sending logic.
export interface BroadcastPreset {
  key: string
  label: string
  message: string
}

export const BROADCAST_PRESETS: BroadcastPreset[] = [
  {
    key: 'general',
    label: 'General Invitation',
    message: "We're reaching out because we believe you care about what we're building. {{project}} is one of the clearest ways your support turns into real outcomes for young people across Nigeria and the diaspora — and we'd love for you to be part of it.",
  },
  {
    key: 'impact',
    label: 'Impact-Focused',
    message: "Every gift to {{project}} goes directly toward mentorship, training, and opportunities for young people who are ready to work but short on access. We track every outcome closely, and we'd love to show you exactly what your support makes possible.",
  },
  {
    key: 'urgent',
    label: 'Time-Sensitive Appeal',
    message: "{{project}} is open for a limited window, and we're close to what we need to make it happen. If you've been meaning to get involved, now is the moment — every gift between now and our deadline moves us closer.",
  },
  {
    key: 'personal',
    label: 'Personal, From the Team',
    message: "You've already shown you care about this work, and that means a lot to us. We're personally asking you to consider supporting {{project}} — not as a mass appeal, but because we think it's exactly the kind of thing you'd want to be part of.",
  },
  {
    key: 'thank-you',
    label: 'Thank You & Next Ask',
    message: "Thank you for everything you've already done for Wissen-Haus. We're writing because {{project}} is the next step in that same work, and we'd be honoured to have you with us again.",
  },
  {
    key: 'matching',
    label: 'Matching Gift Mention',
    message: "Right now, every gift to {{project}} goes further than usual — we're working with partners to match contributions where we can, which means your support can have an outsized impact. We'd love for you to be part of it.",
  },
]
