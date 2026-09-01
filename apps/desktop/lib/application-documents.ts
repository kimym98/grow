import {
  applicationDocumentToRowPayload,
  rowToApplicationDocument,
  rowToDocumentReview,
  type ApplicationDocument,
  type ApplicationDocumentRow,
  type DocumentReview,
  type DocumentReviewRow,
} from "@app/shared"

import { supabase } from "@/lib/supabase"

const UNIQUE_VIOLATION_CODE = "23505"

export interface ApplicationDocumentWithReview extends ApplicationDocument {
  documentReview: DocumentReview
}

type ApplicationDocumentJoinedRow = ApplicationDocumentRow & { document_reviews: DocumentReviewRow }

type LinkDocumentInput = Partial<Pick<ApplicationDocument, "submittedAt" | "memo">>

/** 특정 지원 내역에 연결된 제출 서류 전체를 최신순으로 조회한다 (document_reviews 조인, RLS로 소유자 데이터만 반환) */
export async function fetchApplicationDocuments(applicationId: string): Promise<ApplicationDocumentWithReview[]> {
  const { data, error } = await supabase
    .from("application_documents")
    .select("*, document_reviews(*)")
    .eq("application_id", applicationId)
    .order("created_at", { ascending: false })

  if (error) throw new Error(error.message)

  return (data as ApplicationDocumentJoinedRow[]).map((row) => ({
    ...rowToApplicationDocument(row),
    documentReview: rowToDocumentReview(row.document_reviews),
  }))
}

/** 기존 document_reviews 레코드를 지원 내역에 연결한다 (동일 조합 중복 연결 시 명확한 에러 반환) */
export async function linkDocumentToApplication(
  applicationId: string,
  documentReviewId: string,
  input: LinkDocumentInput = {}
): Promise<ApplicationDocument> {
  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error("로그인이 필요합니다")

  const payload = {
    ...applicationDocumentToRowPayload(input),
    user_id: userData.user.id,
    application_id: applicationId,
    document_review_id: documentReviewId,
  }

  const { data, error } = await supabase.from("application_documents").insert(payload).select().single()

  if (error) {
    if (error.code === UNIQUE_VIOLATION_CODE) throw new Error("이미 연결된 서류입니다")
    throw new Error(error.message)
  }

  return rowToApplicationDocument(data as ApplicationDocumentRow)
}

/** 지원 내역과 제출 서류의 연결을 해제한다 (원본 document_reviews/파일은 보존) */
export async function unlinkApplicationDocument(id: string): Promise<void> {
  const { error } = await supabase.from("application_documents").delete().eq("id", id)

  if (error) throw new Error(error.message)
}

/** 제출 서류 PDF 다운로드/미리보기용 signed URL을 발급한다 (60초 유효) */
export async function getApplicationDocumentSignedUrl(userId: string, documentReviewId: string): Promise<string> {
  const objectPath = `${userId}/${documentReviewId}.pdf`

  const { data, error } = await supabase.storage.from("documents").createSignedUrl(objectPath, 60)

  if (error) throw new Error(error.message)

  return data.signedUrl
}
