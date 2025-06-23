-- Create parent_students table
CREATE TABLE IF NOT EXISTS public.parent_students (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    parent_id TEXT NOT NULL,
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(parent_id, student_id)
);

-- Add RLS policies
ALTER TABLE public.parent_students ENABLE ROW LEVEL SECURITY;

-- Create policy to allow parents to view their own student associations
CREATE POLICY "Parents can view their own student associations"
    ON public.parent_students
    FOR SELECT
    USING (parent_id = auth.uid()::text);

-- Create policy to allow parents to create their own student associations
CREATE POLICY "Parents can create their own student associations"
    ON public.parent_students
    FOR INSERT
    WITH CHECK (parent_id = auth.uid()::text);

-- Create policy to allow parents to update their own student associations
CREATE POLICY "Parents can update their own student associations"
    ON public.parent_students
    FOR UPDATE
    USING (parent_id = auth.uid()::text);

-- Create policy to allow parents to delete their own student associations
CREATE POLICY "Parents can delete their own student associations"
    ON public.parent_students
    FOR DELETE
    USING (parent_id = auth.uid()::text);

-- Create indexes
CREATE INDEX IF NOT EXISTS parent_students_parent_id_idx ON public.parent_students(parent_id);
CREATE INDEX IF NOT EXISTS parent_students_student_id_idx ON public.parent_students(student_id); 