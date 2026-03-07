CREATE OR REPLACE FUNCTION public.send_welcome_message_on_subscribe()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _conv_id uuid;
  _welcome_msg text;
  _p1 uuid;
  _p2 uuid;
BEGIN
  IF NEW.creator_id < NEW.subscriber_id THEN
    _p1 := NEW.creator_id;
    _p2 := NEW.subscriber_id;
  ELSE
    _p1 := NEW.subscriber_id;
    _p2 := NEW.creator_id;
  END IF;

  SELECT id INTO _conv_id FROM conversations
    WHERE participant_1 = _p1 AND participant_2 = _p2;

  IF _conv_id IS NULL THEN
    INSERT INTO conversations (participant_1, participant_2)
    VALUES (_p1, _p2)
    RETURNING id INTO _conv_id;
  END IF;

  SELECT COALESCE(welcome_message, 'Seja muito bem-vindo(a)! Vamos conversar? 😏🔥')
  INTO _welcome_msg FROM profiles WHERE id = NEW.creator_id;

  INSERT INTO messages (conversation_id, sender_id, content)
  VALUES (_conv_id, NEW.creator_id, _welcome_msg);

  UPDATE conversations SET last_message_at = now() WHERE id = _conv_id;

  RETURN NEW;
END;
$function$;