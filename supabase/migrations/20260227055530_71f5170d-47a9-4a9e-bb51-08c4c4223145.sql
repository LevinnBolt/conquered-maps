
-- Add unique constraint on progress for upsert to work properly
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'progress_user_room_chapter_unique'
  ) THEN
    ALTER TABLE public.progress ADD CONSTRAINT progress_user_room_chapter_unique UNIQUE (user_id, room_id, chapter_number);
  END IF;
END $$;
