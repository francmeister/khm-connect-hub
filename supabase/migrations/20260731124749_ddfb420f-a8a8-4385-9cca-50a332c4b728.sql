ALTER TABLE public.newsletters
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE OR REPLACE FUNCTION public.tg_newsletters_search_vector()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $fn$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.edition_number, '')), 'A') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW.keywords, '{}'::text[]), ' ')), 'B') ||
    setweight(to_tsvector('english', array_to_string(coalesce(NEW.categories, '{}'::text[]), ' ')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.tech_spotlight_title, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.tech_spotlight_description, '')), 'D');
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS newsletters_search_vector_tg ON public.newsletters;
CREATE TRIGGER newsletters_search_vector_tg
  BEFORE INSERT OR UPDATE ON public.newsletters
  FOR EACH ROW EXECUTE FUNCTION public.tg_newsletters_search_vector();

UPDATE public.newsletters SET updated_at = updated_at;

CREATE INDEX IF NOT EXISTS newsletters_search_vector_idx
  ON public.newsletters USING gin (search_vector);

CREATE OR REPLACE FUNCTION public.search_published_newsletters(_query text)
RETURNS SETOF public.newsletters
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT n.*
  FROM public.newsletters n
  WHERE n.status = 'published'
    AND (
      coalesce(btrim(_query), '') = ''
      OR n.search_vector @@ websearch_to_tsquery('english', _query)
    )
  ORDER BY
    CASE WHEN coalesce(btrim(_query), '') = '' THEN 0
         ELSE ts_rank(n.search_vector, websearch_to_tsquery('english', _query)) END DESC,
    n.publication_date DESC;
$$;

GRANT EXECUTE ON FUNCTION public.search_published_newsletters(text) TO anon, authenticated;