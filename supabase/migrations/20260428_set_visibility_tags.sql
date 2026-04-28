-- Add visibility and tags to study_sets
ALTER TABLE public.study_sets
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'private'
    CHECK (visibility IN ('private', 'normal', 'public')),
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Index for fast public-set queries
CREATE INDEX IF NOT EXISTS idx_study_sets_visibility ON public.study_sets (visibility);

-- Allow all authenticated users to read public sets
-- (drop old policy first if it exists to avoid conflicts)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'study_sets' AND policyname = 'Public sets readable by all'
  ) THEN
    DROP POLICY "Public sets readable by all" ON public.study_sets;
  END IF;
END $$;

CREATE POLICY "Public sets readable by all"
  ON public.study_sets FOR SELECT
  USING (visibility = 'public' OR auth.uid() = owner_id);
