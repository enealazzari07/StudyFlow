-- Usage tracking for free plan limits
-- scan_month: "YYYY-MM" string, used to reset counter each month
-- scan_count_month: number of AI doc scans used in the current month

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS scan_month TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS scan_count_month INTEGER DEFAULT 0;
