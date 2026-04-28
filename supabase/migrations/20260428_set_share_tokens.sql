-- Share tokens table
CREATE TABLE IF NOT EXISTS public.set_share_tokens (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  set_id      uuid NOT NULL REFERENCES public.study_sets(id) ON DELETE CASCADE,
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token       text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(18), 'base64url'),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Anyone authenticated can read tokens (to look up by token value)
ALTER TABLE public.set_share_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can manage their share tokens"
  ON public.set_share_tokens FOR ALL
  USING (auth.uid() = created_by)
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Authenticated users can read tokens"
  ON public.set_share_tokens FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Track origin of copied sets
ALTER TABLE public.study_sets
  ADD COLUMN IF NOT EXISTS source_set_id uuid REFERENCES public.study_sets(id) ON DELETE SET NULL;
