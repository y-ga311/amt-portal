-- 既存のnoticeテーブルに添付ファイル用のカラムを追加
ALTER TABLE notice
ADD COLUMN image_url TEXT,
ADD COLUMN pdf_url TEXT,
ADD COLUMN file_type VARCHAR(10) CHECK (file_type IN ('image', 'pdf', NULL));

-- カラムにコメントを追加
COMMENT ON COLUMN notice.image_url IS '画像ファイルのURL（JPG, PNG等）';
COMMENT ON COLUMN notice.pdf_url IS 'PDFファイルのURL';
COMMENT ON COLUMN notice.file_type IS '添付ファイルの種類（image: 画像, pdf: PDF）';

-- サンプルデータを更新（既存のデータはそのまま）
INSERT INTO notice (title, content, target_type, target_class, file_type, image_url, pdf_url)
VALUES 
  ('画像付きお知らせサンプル', 'これは画像付きのお知らせのサンプルです。', 'all', 'all', 'image', 'https://example.com/images/sample.jpg', NULL),
  ('PDF付きお知らせサンプル', 'これはPDF付きのお知らせのサンプルです。', 'all', 'all', 'pdf', NULL, 'https://example.com/pdfs/sample.pdf'); 