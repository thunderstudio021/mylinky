
-- Conversations table
CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_1 uuid NOT NULL,
  participant_2 uuid NOT NULL,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(participant_1, participant_2)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can insert conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (participant_1 = auth.uid() OR participant_2 = auth.uid());

CREATE POLICY "Users can update own conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- Messages table
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  content text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read messages in their conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in their conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages" ON public.messages
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = messages.conversation_id
      AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
    )
  );

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Index for performance
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX idx_conversations_participants ON public.conversations(participant_1, participant_2);

-- Auto welcome message trigger: when a subscription is created, 
-- create a conversation (if not exists) and send a welcome message from the creator
CREATE OR REPLACE FUNCTION public.send_welcome_message_on_subscribe()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _conv_id uuid;
  _creator_name text;
  _p1 uuid;
  _p2 uuid;
BEGIN
  -- Normalize participant order (smaller UUID first)
  IF NEW.creator_id < NEW.subscriber_id THEN
    _p1 := NEW.creator_id;
    _p2 := NEW.subscriber_id;
  ELSE
    _p1 := NEW.subscriber_id;
    _p2 := NEW.creator_id;
  END IF;

  -- Find or create conversation
  SELECT id INTO _conv_id FROM conversations
    WHERE participant_1 = _p1 AND participant_2 = _p2;

  IF _conv_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (_p1, _p2)
    RETURNING id INTO _conv_id;
  END IF;

  -- Get creator name
  SELECT name INTO _creator_name FROM profiles WHERE id = NEW.creator_id;

  -- Send welcome message from creator
  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (_conv_id, NEW.creator_id, 'Seja muito bem-vindo(a)! Vamos conversar? 😏🔥');

  -- Update last_message_at
  UPDATE conversations SET last_message_at = now() WHERE id = _conv_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_subscription_welcome
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.send_welcome_message_on_subscribe();
