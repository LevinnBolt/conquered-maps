
-- Fix room_members SELECT policy (self-referencing causes recursion)
DROP POLICY IF EXISTS "Members viewable by room members" ON public.room_members;
CREATE POLICY "Members viewable by room members" ON public.room_members
FOR SELECT USING (auth.uid() = user_id OR EXISTS (
  SELECT 1 FROM public.room_members rm2
  WHERE rm2.room_id = room_members.room_id AND rm2.user_id = auth.uid()
));

-- Actually, the above still references room_members from within its own policy.
-- We need a security definer function instead.

DROP POLICY IF EXISTS "Members viewable by room members" ON public.room_members;

CREATE OR REPLACE FUNCTION public.is_room_member(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.room_members
    WHERE user_id = _user_id AND room_id = _room_id
  );
$$;

CREATE POLICY "Members viewable by room members" ON public.room_members
FOR SELECT USING (
  auth.uid() = user_id OR public.is_room_member(auth.uid(), room_id)
);

-- Fix rooms SELECT policy
DROP POLICY IF EXISTS "Rooms viewable by members" ON public.rooms;
CREATE POLICY "Rooms viewable by members" ON public.rooms
FOR SELECT USING (
  created_by = auth.uid() OR public.is_room_member(auth.uid(), id)
);

-- Fix progress SELECT policy
DROP POLICY IF EXISTS "Progress viewable by room members" ON public.progress;
CREATE POLICY "Progress viewable by room members" ON public.progress
FOR SELECT USING (
  auth.uid() = user_id OR public.is_room_member(auth.uid(), room_id)
);
