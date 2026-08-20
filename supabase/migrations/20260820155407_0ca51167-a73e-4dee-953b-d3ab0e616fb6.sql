CREATE TABLE public.user_credits (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  research_credits integer NOT NULL DEFAULT 2,
  research_used integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.user_credits TO authenticated;
GRANT ALL ON public.user_credits TO service_role;
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own credits" ON public.user_credits FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_user_credits_updated_at BEFORE UPDATE ON public.user_credits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.waitlist_signups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL,
  email text NOT NULL DEFAULT '',
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, feature)
);
GRANT SELECT, INSERT ON public.waitlist_signups TO authenticated;
GRANT ALL ON public.waitlist_signups TO service_role;
ALTER TABLE public.waitlist_signups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own waitlist rows" ON public.waitlist_signups FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users join waitlist" ON public.waitlist_signups FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.consume_research_credit(_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE remaining integer;
BEGIN
  INSERT INTO public.user_credits (user_id) VALUES (_user_id)
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE public.user_credits
     SET research_used = research_used + 1
   WHERE user_id = _user_id
     AND research_used < research_credits
  RETURNING research_credits - research_used INTO remaining;

  IF remaining IS NULL THEN
    RETURN -1;
  END IF;
  RETURN remaining;
END;
$$;
GRANT EXECUTE ON FUNCTION public.consume_research_credit(uuid) TO authenticated;