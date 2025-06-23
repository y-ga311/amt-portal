-- ストレージバケットの作成（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'notice-attachments') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('notice-attachments', 'notice-attachments', true);
  END IF;
END $$;

-- 既存のポリシーを削除（存在する場合）
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;

-- ストレージポリシーの設定
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING (bucket_id = 'notice-attachments');

CREATE POLICY "Authenticated users can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'notice-attachments'
  AND auth.role() = 'authenticated'
); 