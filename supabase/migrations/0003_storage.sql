-- Storage: מסמכים מצורפים לבקשות חופשה/מחלה
insert into storage.buckets (id, name, public)
values ('leave-attachments', 'leave-attachments', false)
on conflict (id) do nothing;

create policy leave_attachments_employee_upload on storage.objects for insert
  with check (
    bucket_id = 'leave-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy leave_attachments_read on storage.objects for select
  using (
    bucket_id = 'leave-attachments'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or is_admin()
    )
  );

create policy leave_attachments_employee_delete_own on storage.objects for delete
  using (
    bucket_id = 'leave-attachments'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
