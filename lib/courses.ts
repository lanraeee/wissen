import { cache } from 'react'
import { getSiteContent } from './site-content'
import { DEFAULT_COURSES, type Course } from './courseData'

// react's cache() dedupes calls within a single request/render pass (e.g.
// generateMetadata + the page component both calling getCourses() only
// hits the DB once); getSiteContent's unstable_cache persists that result
// across requests until an admin save calls revalidateTag.
export const getCourses = cache(async (): Promise<Course[]> => {
  const val = await getSiteContent<Course[]>('courses')
  return val && val.length > 0 ? val : DEFAULT_COURSES
})

export async function getCourse(id: string): Promise<Course | undefined> {
  const courses = await getCourses()
  return courses.find(c => c.id === id)
}
