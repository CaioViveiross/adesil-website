ALTER TABLE public.contact_messages
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'new'
    CHECK (status IN ('new', 'read', 'archived'));

CREATE INDEX IF NOT EXISTS idx_contact_messages_status
  ON public.contact_messages (status);
