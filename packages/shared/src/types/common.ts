/**
 * shared 전용 공용 API 응답 타입
 * apps/desktop/types/index.ts의 ApiResponse와는 독립적으로 정의함(순환 참조 방지)
 */
export interface ApiResponse<T> {
  data: T
  message: string
  success: true
}

export interface ApiErrorResponse {
  code: string
  message: string
  success: false
}
