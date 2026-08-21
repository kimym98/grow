import { DocumentsPageClient } from "@/components/sections/documents/documents-page-client"

interface DocumentDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function DocumentDetailPage({
  params,
}: DocumentDetailPageProps) {
  const { id } = await params

  return <DocumentsPageClient initialSelectedId={id} />
}
