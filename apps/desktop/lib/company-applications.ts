import {
  companyApplicationToRowPayload,
  normalizeCompanyName,
  rowToCompanyApplication,
  type CompanyApplication,
  type CompanyApplicationRow,
} from "@app/shared"

import { supabase } from "@/lib/supabase"

type CompanyApplicationInput = Pick<
  CompanyApplication,
  "companyName" | "position" | "applyUrl" | "appliedAt" | "status" | "memo" | "sourceJobPostingId"
>

/** company_applications 테이블에서 로그인한 사용자의 전체 지원 내역을 최신순으로 조회한다 (RLS로 소유자 데이터만 반환) */
export async function fetchCompanyApplications(): Promise<CompanyApplication[]> {
  const { data, error } = await supabase
    .from("company_applications")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data as CompanyApplicationRow[]).map(rowToCompanyApplication)
}

/** 새 지원 내역을 생성한다 (user_id는 현재 로그인 세션에서, company_key는 기업명 정규화로 획득) */
export async function createCompanyApplication(input: CompanyApplicationInput): Promise<CompanyApplication> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error("로그인이 필요합니다")

  const payload = {
    ...companyApplicationToRowPayload(input),
    user_id: userData.user.id,
    company_key: normalizeCompanyName(input.companyName),
  }

  const { data, error } = await supabase.from("company_applications").insert(payload).select().single()

  if (error) throw new Error(error.message)

  return rowToCompanyApplication(data as CompanyApplicationRow)
}

/** 지원 내역을 부분 수정한다 (기업명이 변경되면 company_key도 함께 재계산) */
export async function updateCompanyApplication(
  id: string,
  patch: Partial<CompanyApplicationInput>
): Promise<CompanyApplication> {
  const payload = {
    ...companyApplicationToRowPayload(patch),
    ...(patch.companyName !== undefined ? { company_key: normalizeCompanyName(patch.companyName) } : {}),
  }

  const { data, error } = await supabase
    .from("company_applications")
    .update(payload)
    .eq("id", id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return rowToCompanyApplication(data as CompanyApplicationRow)
}

/** 지원 내역을 삭제한다 */
export async function deleteCompanyApplication(id: string): Promise<void> {
  const { error } = await supabase.from("company_applications").delete().eq("id", id)

  if (error) throw new Error(error.message)
}
