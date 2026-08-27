import { rowToJobPosting, type JobPosting, type JobPostingRow } from "@app/shared"

import { supabase } from "@/lib/supabase"

/** job_postings 테이블에서 전체 채용 공고를 최신순으로 조회한다 */
export async function fetchJobPostings(): Promise<JobPosting[]> {
  const { data, error } = await supabase
    .from("job_postings")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data as JobPostingRow[]).map(rowToJobPosting)
}
