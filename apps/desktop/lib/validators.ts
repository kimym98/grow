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
