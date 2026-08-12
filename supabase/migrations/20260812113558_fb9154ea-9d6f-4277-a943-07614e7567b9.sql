
CREATE POLICY "property images readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'property-images');
CREATE POLICY "admin uploads property images" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'property-images' AND public.is_admin());
CREATE POLICY "admin updates property images" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'property-images' AND public.is_admin());
CREATE POLICY "admin deletes property images" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'property-images' AND public.is_admin());

CREATE POLICY "avatars readable" ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');
CREATE POLICY "own avatar write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own avatar update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "own avatar delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
