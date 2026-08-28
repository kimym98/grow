import { JobDetailPageClient } from "@/components/sections/jobs/job-detail-page-client"

interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params

  return <JobDetailPageClient id={id} />
}

// Electron SPA는 file://out/index.html만 로드하고 이후 전부 client-side 라우팅을 사용하므로
// 실제 정적 페이지 내용은 쓰이지 않는다. output:"export"가 빈 배열을 허용하지 않아 placeholder를 반환한다.
export function generateStaticParams() {
  return [{ id: "placeholder" }]
}
