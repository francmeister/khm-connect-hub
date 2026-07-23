
-- Public read on covers
CREATE POLICY "covers public read" ON storage.objects FOR SELECT TO anon, authenticated
  USING (bucket_id = 'newsletter-covers');
CREATE POLICY "covers admin write" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'newsletter-covers' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'newsletter-covers' AND public.has_role(auth.uid(),'admin'));

-- PDFs: admin-only via storage; public reads happen through signed URLs
CREATE POLICY "pdfs admin all" ON storage.objects FOR ALL TO authenticated
  USING (bucket_id = 'newsletter-pdfs' AND public.has_role(auth.uid(),'admin'))
  WITH CHECK (bucket_id = 'newsletter-pdfs' AND public.has_role(auth.uid(),'admin'));
