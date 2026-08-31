-- Task 013에서 생성된 documents 스토리지 버킷을 마이그레이션 파일로 재현한다.
-- db pull(pg_dump 기반)은 storage.buckets가 스키마가 아닌 데이터로 취급되어 캡처하지 못하므로 수동으로 추가한다.
-- RLS 정책(documents_owner_select/insert/delete)은 20260831121434_remote_schema.sql에 이미 포함되어 있어 여기서는 버킷만 생성한다.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documents', 'documents', false, 10485760, array['application/pdf'])
on conflict (id) do nothing;
