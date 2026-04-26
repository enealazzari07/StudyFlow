-- Add Stripe billing columns to profiles
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS stripe_customer_id     TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS pro_since              TIMESTAMPTZ;

-- plan column default free (in case it doesn't exist yet)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

-- Unique constraints to prevent duplicate Stripe records
CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_customer_id_key
  ON profiles (stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_stripe_subscription_id_key
  ON profiles (stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ─── RLS ────────────────────────────────────────────────────────────────────
-- Enable RLS (idempotent)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile — but CANNOT change billing/plan columns
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    -- Prevent self-promotion to pro
    AND plan           = (SELECT plan           FROM profiles WHERE id = auth.uid())
    AND stripe_customer_id      IS NOT DISTINCT FROM (SELECT stripe_customer_id      FROM profiles WHERE id = auth.uid())
    AND stripe_subscription_id  IS NOT DISTINCT FROM (SELECT stripe_subscription_id  FROM profiles WHERE id = auth.uid())
    AND pro_since               IS NOT DISTINCT FROM (SELECT pro_since               FROM profiles WHERE id = auth.uid())
  );

-- Service role (Edge Functions) bypasses RLS — no additional policy needed.
-- Anon / unauthenticated users: no policy → no access.
