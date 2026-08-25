"use client"

import { useRouter } from "next/navigation"
import { LogOut, Settings, User } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

/** 실제 인증 연동 전까지 사용하는 목업 유저 정보 */
const MOCK_USER = {
  name: "김민영",
  email: "minyoung.kim@example.com",
  avatarUrl: undefined as string | undefined,
}

function getInitial(name: string) {
  return name.slice(0, 1)
}

/** 사이드바 하단에 노출되는 유저 프로필 (아바타 + 이름/이메일 + 드롭다운 메뉴) */
function UserProfile() {
  const router = useRouter()

  function handleLogout() {
    router.push("/login")
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex w-full items-center gap-2 rounded-md p-2 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          <AvatarImage src={MOCK_USER.avatarUrl} alt={MOCK_USER.name} />
          <AvatarFallback>{getInitial(MOCK_USER.name)}</AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-medium">{MOCK_USER.name}</span>
          <span className="truncate text-xs text-muted-foreground">
            {MOCK_USER.email}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>내 계정</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <User />
          프로필
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => router.push("/settings")}>
          <Settings />
          설정
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          로그아웃
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export { UserProfile }
