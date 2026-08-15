import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="p-6 flex flex-col items-center justify-center h-full gap-4">
      <h1 className="text-xl font-semibold">페이지를 찾을 수 없습니다</h1>
      <Link href="/">
        <Button>대시보드로 이동</Button>
      </Link>
    </div>
  )
}
