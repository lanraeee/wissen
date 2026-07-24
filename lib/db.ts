import { neon } from '@neondatabase/serverless'

const url = process.env.WISSENDB_DATABASE_URL ?? process.env.DATABASE_URL
if (!url) throw new Error('Missing WISSENDB_DATABASE_URL env var')

const sql = neon(url)
export default sql
