// The charity's four objects, word for word from clause 2.1 of the constitution
// (docs/foundation-cio/03_Constitution_DRAFT.md). The About page shows them
// verbatim from here. lib/charitable-objects.test.ts fails if this list drifts
// from the constitution, so change the constitution first, then this file.

export interface CharitableObject {
  /** The bold lead of the clause, exactly as the constitution words it. */
  title: string
  /** The rest of the clause, verbatim, including its leading space and closing punctuation. */
  rest: string
}

export const CHARITABLE_OBJECTS: readonly CharitableObject[] = [
  {
    title: 'The advancement of education',
    rest: ' for youth in Nigeria, Africa, and diaspora communities, particularly through the provision of practical career guidance, skills training, mentorship programmes, and global exposure designed to bridge the gap between academic knowledge and real-world professional readiness;',
  },
  {
    title: 'The relief of poverty and promotion of economic independence',
    rest: ' for young African and diaspora youth through equipping them with practical career skills, professional networks, and global opportunities that enable employment, entrepreneurship, and sustainable livelihoods;',
  },
  {
    title: 'The advancement of community development and social mobility',
    rest: ' for youth by fostering networks of professional mentorship, peer support, and international connection that empower sustainable personal and community development;',
  },
  {
    title: 'The conduct of research and publication of evidence',
    rest: ' on youth economic independence, skills development, employment outcomes, and the future of work across Nigeria, Africa, and diaspora communities, to advance public understanding and inform policy and practice in youth development.',
  },
]
