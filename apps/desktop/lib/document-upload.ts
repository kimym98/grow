import { z } from "zod"

import { supabase } from "@/lib/supabase"

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10MiB, supabase/config.toml [storage.buckets.documents]와 동일하게 유지

export const documentFileSchema = z
  .instanceof(File)
  .refine((file) => file.type === "application/pdf" && file.name.toLowerCase().endsWith(".pdf"), {
    message: "PDF 파일만 업로드할 수 있습니다",
  })
  .refine((file) => file.size <= MAX_FILE_SIZE_BYTES, {
    message: "파일 용량은 10MB를 넘을 수 없습니다",
  })

export interface UploadDocumentInput {
  file: File
  title: string
  type: "resume" | "portfolio"
  resumeQuestion?: string
}

/**
 * PDF를 documents 버킷(본인 폴더)에 업로드하고 document_reviews 레코드를 status='pending'으로 생성한다.
 * original_text는 review-document Edge Function이 PDF 텍스트 추출 후 채워 넣으므로 여기서는 빈 문자열로 둔다.
 */
export async function uploadDocument(input: UploadDocumentInput): Promise<{ documentReviewId: string }> {
  documentFileSchema.parse(input.file)

  const { data: userData, error: userError } = await supabase.auth.getUser()
  if (userError) throw new Error(userError.message)
  if (!userData.user) throw new Error("로그인이 필요합니다")

  const userId = userData.user.id
  const documentReviewId = crypto.randomUUID()
  const objectPath = `${userId}/${documentReviewId}.pdf`

  const { error: uploadError } = await supabase.storage.from("documents").upload(objectPath, input.file, {
    contentType: "application/pdf",
    upsert: false,
  })
  if (uploadError) throw new Error(uploadError.message)

  const { error: insertError } = await supabase.from("document_reviews").insert({
    id: documentReviewId,
    user_id: userId,
    title: input.title,
    type: input.type,
    status: "pending",
    version: 1,
    resume_question: input.type === "resume" ? input.resumeQuestion : null,
    original_text: "",
    versions: [],
    comments: [],
  })

  if (insertError) {
    await supabase.storage.from("documents").remove([objectPath])
    throw new Error(insertError.message)
  }

  return { documentReviewId }
}
