import { cache } from 'react'
import sql from './db'
import { DEFAULT_COURSES, type Course } from './courseData'

// react's cache() dedupes calls within a single request/render pass (e.g.
// generateMetadata + the page component both calling getCourses() only
// hits the DB once), without any extra plumbing at call sites.
export const getCourses = cache(async (): Promise<Course[]> => {
  try {
    const rows = await sql`SELECT value FROM site_content WHERE key = 'courses'`
    const val = rows[0]?.value as Course[] | undefined
    if (val && val.length > 0) return val
  } catch {
    // fall through to defaults if the DB is unreachable
  }
  return DEFAULT_COURSES
})

export async function getCourse(id: string): Promise<Course | undefined> {
  const courses = await getCourses()
  return courses.find(c => c.id === id)
}
