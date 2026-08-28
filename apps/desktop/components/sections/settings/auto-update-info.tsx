import { RefreshCw } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** 자동 업데이트 안내 카드. 별도 ON/OFF 토글 없이 앱 시작 시 항상 확인하며, 서명 관련 제약을 사용자에게 알린다 */
function AutoUpdateInfo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5">
          <RefreshCw className="size-4 text-primary" />
          자동 업데이트
        </CardTitle>
      </CardHeader>

      <CardContent>
        <p className="text-sm text-muted-foreground">
          앱을 시작할 때마다 새 버전이 있는지 자동으로 확인하고 다운로드합니다. 다운로드가 완료되면 앱을
          재시작할 때 새 버전이 적용됩니다.
        </p>
      </CardContent>
    </Card>
  )
}

export { AutoUpdateInfo }
