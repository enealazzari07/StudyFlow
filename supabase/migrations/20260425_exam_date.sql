-- Add exam_date to study_sets
-- Allows users to optionally set an exam date per learning set
-- The app uses this to calculate a daily study recommendation

alter table public.study_sets
  add column if not exists exam_date date default null;

comment on column public.study_sets.exam_date is
  'Optional exam date. Used to calculate daily card targets (cards/day = unmastered ÷ (days_until_exam - 1), last day = review only).';
