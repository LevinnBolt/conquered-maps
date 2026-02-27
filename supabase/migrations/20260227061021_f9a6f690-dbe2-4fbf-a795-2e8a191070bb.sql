-- Robust join helper to allow joining by room code without requiring pre-existing room membership
CREATE OR REPLACE FUNCTION public.join_room_with_code(_room_code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_room_id uuid;
  v_user_id uuid;
  v_member_count integer;
  v_color text;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT id
  INTO v_room_id
  FROM public.rooms
  WHERE upper(room_code) = upper(trim(_room_code))
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Room not found';
  END IF;

  SELECT count(*)::int
  INTO v_member_count
  FROM public.room_members
  WHERE room_id = v_room_id;

  v_color := (ARRAY[
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
  ])[((COALESCE(v_member_count, 0) % 8) + 1)];

  BEGIN
    INSERT INTO public.room_members (room_id, user_id, color)
    VALUES (v_room_id, v_user_id, v_color);
  EXCEPTION WHEN unique_violation THEN
    -- User already in room, continue
    NULL;
  END;

  RETURN v_room_id;
END;
$$;

-- Restrict execution to authenticated users
REVOKE ALL ON FUNCTION public.join_room_with_code(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.join_room_with_code(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.join_room_with_code(text) TO authenticated;