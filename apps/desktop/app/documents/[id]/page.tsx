interface DocumentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">문서 상세: {id}</h1>
      <p className="text-muted-foreground mt-2">
        첨삭 결과와 버전 히스토리가 여기에 표시됩니다.
      </p>
    </div>
  )
}
