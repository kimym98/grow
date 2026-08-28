import { create } from "zustand"
import { persist } from "zustand/middleware"

/** 커맨드팔레트/최근항목/즐겨찾기에서 다루는 항목 유형 */
export type RecentFavoriteItemType = "job" | "news" | "document" | "quiz"

export interface RecentFavoriteItem {
  /** `${type}:${id}` 형태의 고유 키 */
  key: string
  type: RecentFavoriteItemType
  id: string
  title: string
  subtitle?: string
  /** 커맨드팔레트에서 클릭 시 이동할 경로 */
  href: string
}

const MAX_RECENT_ITEMS = 10

interface RecentFavoritesState {
  recentItems: RecentFavoriteItem[]
  favoriteItems: RecentFavoriteItem[]
  addRecent: (item: RecentFavoriteItem) => void
  toggleFavorite: (item: RecentFavoriteItem) => void
  isFavorite: (key: string) => boolean
}

/** 최근 조회 항목(유형 무관 통합 최대 MAX_RECENT_ITEMS개)과 즐겨찾기를 localStorage에 보존하는 클라이언트 전역 스토어 */
export const useRecentFavoritesStore = create<RecentFavoritesState>()(
  persist(
    (set, get) => ({
      recentItems: [],
      favoriteItems: [],

      addRecent: (item) =>
        set((state) => ({
          recentItems: [item, ...state.recentItems.filter((existing) => existing.key !== item.key)].slice(
            0,
            MAX_RECENT_ITEMS
          ),
        })),

      toggleFavorite: (item) =>
        set((state) => {
          const exists = state.favoriteItems.some((existing) => existing.key === item.key)
          return {
            favoriteItems: exists
              ? state.favoriteItems.filter((existing) => existing.key !== item.key)
              : [item, ...state.favoriteItems],
          }
        }),

      isFavorite: (key) => get().favoriteItems.some((existing) => existing.key === key),
    }),
    { name: "grow-recent-favorites" }
  )
)
