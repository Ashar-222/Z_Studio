REVOKE EXECUTE ON FUNCTION public.consume_research_credit(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.consume_research_credit(uuid) TO service_role;