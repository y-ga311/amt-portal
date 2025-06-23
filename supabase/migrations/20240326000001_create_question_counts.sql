-- Create question_counts table
CREATE TABLE IF NOT EXISTS public.question_counts (
    id SERIAL PRIMARY KEY,
    test_name VARCHAR(255) NOT NULL UNIQUE,
    test_date DATE NOT NULL,
    medical_overview INTEGER,
    public_health INTEGER,
    related_laws INTEGER,
    anatomy INTEGER,
    physiology INTEGER,
    pathology INTEGER,
    clinical_medicine_overview INTEGER,
    clinical_medicine_detail INTEGER,
    clinical_medicine_detail_total INTEGER,
    rehabilitation INTEGER,
    oriental_medicine_overview INTEGER,
    meridian_points INTEGER,
    oriental_medicine_clinical INTEGER,
    oriental_medicine_clinical_general INTEGER,
    acupuncture_theory INTEGER,
    moxibustion_theory INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add comments to explain the table and columns
COMMENT ON TABLE public.question_counts IS 'テストごとの問題数テーブル';
COMMENT ON COLUMN public.question_counts.test_name IS 'テスト名';
COMMENT ON COLUMN public.question_counts.test_date IS 'テスト実施日';
COMMENT ON COLUMN public.question_counts.medical_overview IS '医療概論の問題数';
COMMENT ON COLUMN public.question_counts.public_health IS '衛生・公衆衛生学の問題数';
COMMENT ON COLUMN public.question_counts.related_laws IS '関係法規の問題数';
COMMENT ON COLUMN public.question_counts.anatomy IS '解剖学の問題数';
COMMENT ON COLUMN public.question_counts.physiology IS '生理学の問題数';
COMMENT ON COLUMN public.question_counts.pathology IS '病理学の問題数';
COMMENT ON COLUMN public.question_counts.clinical_medicine_overview IS '臨床医学総論の問題数';
COMMENT ON COLUMN public.question_counts.clinical_medicine_detail IS '臨床医学各論の問題数';
COMMENT ON COLUMN public.question_counts.clinical_medicine_detail_total IS '臨床医学各論（総合）の問題数';
COMMENT ON COLUMN public.question_counts.rehabilitation IS 'リハビリテーション医学の問題数';
COMMENT ON COLUMN public.question_counts.oriental_medicine_overview IS '東洋医学概論の問題数';
COMMENT ON COLUMN public.question_counts.meridian_points IS '経絡経穴概論の問題数';
COMMENT ON COLUMN public.question_counts.oriental_medicine_clinical IS '東洋医学臨床論の問題数';
COMMENT ON COLUMN public.question_counts.oriental_medicine_clinical_general IS '東洋医学臨床論（総合）の問題数';
COMMENT ON COLUMN public.question_counts.acupuncture_theory IS 'はり理論の問題数';
COMMENT ON COLUMN public.question_counts.moxibustion_theory IS 'きゅう理論の問題数';

-- Create indexes
CREATE INDEX IF NOT EXISTS question_counts_test_name_idx ON public.question_counts(test_name);
CREATE INDEX IF NOT EXISTS question_counts_test_date_idx ON public.question_counts(test_date);

-- Enable Row Level Security
ALTER TABLE public.question_counts ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all authenticated users to view question counts
CREATE POLICY "Authenticated users can view question counts"
    ON public.question_counts
    FOR SELECT
    TO authenticated
    USING (true); 