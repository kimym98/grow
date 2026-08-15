interface JobDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold">공고 상세: {id}</h1>
      <p className="text-muted-foreground mt-2">
        공고 상세 정보가 여기에 표시됩니다.
      </p>
    </div>
  )
}
