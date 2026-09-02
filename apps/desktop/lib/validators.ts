import { z } from "zod"

export const emailSchema = z.string().email("올바른 이메일을 입력해주세요")

export const passwordSchema = z
  .string()
  .min(8, "비밀번호는 8자 이상이어야 합니다")

export const phoneSchema = z
  .string()
  .regex(/^010-\d{4}-\d{4}$/, "올바른 전화번호 형식입니다 (010-0000-0000)")

export const urlSchema = z.string().url("올바른 URL을 입력해주세요")

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
})

export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "비밀번호가 일치하지 않습니다",
    path: ["confirmPassword"],
  })

export const scheduleCategorySchema = z.enum([
  "interview",
  "deadline",
  "study",
  "etc",
])

export const scheduleFormSchema = z.object({
  title: z.string().min(1, "제목을 입력해주세요"),
  memo: z.string().optional(),
  date: z.string().min(1, "날짜를 선택해주세요"),
  time: z.string().optional(),
  reminderTime: z.string().optional(),
  isRecurring: z.boolean(),
  category: scheduleCategorySchema,
})

export type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

export const llmApiKeyFormSchema = z.object({
  apiKey: z.string().min(10, "올바른 API 키를 입력해주세요"),
})

export type LlmApiKeyFormValues = z.infer<typeof llmApiKeyFormSchema>

export const documentUploadFormSchema = z.object({
  fileName: z.string().min(1, "파일을 선택해주세요"),
  type: z.enum(["resume", "portfolio"]),
  provider: z.enum(["gemini", "anthropic"], { message: "첨삭에 사용할 AI를 선택해주세요" }),
})

export type DocumentUploadFormValues = z.infer<typeof documentUploadFormSchema>

export const companyApplicationStatusSchema = z.enum([
  "준비중",
  "서류제출",
  "서류합격",
  "테스트",
  "면접",
  "최종합격",
  "탈락",
])

export const companyApplicationFormSchema = z.object({
  companyName: z.string().min(1, "기업명을 입력해주세요"),
  position: z.string().optional(),
  applyUrl: z.string().url("올바른 URL을 입력해주세요").optional().or(z.literal("")),
  appliedAt: z.string().optional(),
  status: companyApplicationStatusSchema,
  memo: z.string().optional(),
})

export type CompanyApplicationFormValues = z.infer<typeof companyApplicationFormSchema>

export const coverLetterQuestionFormSchema = z.object({
  questionText: z.string().min(1, "문항을 입력해주세요"),
  charLimit: z.string().optional(),
})

export type CoverLetterQuestionFormValues = z.infer<typeof coverLetterQuestionFormSchema>

export const coverLetterAnswerSchema = z.object({
  answerText: z.string(),
})

export type CoverLetterAnswerFormValues = z.infer<typeof coverLetterAnswerSchema>
