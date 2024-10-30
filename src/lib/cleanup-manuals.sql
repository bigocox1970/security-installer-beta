-- First, delete all records from the manuals table
delete from public.manuals;

-- Reset the sequence if exists
do $$ 
begin
  if exists (
    select 1 from information_schema.sequences 
    where sequence_name = 'manuals_id_seq'
  ) then
    alter sequence manuals_id_seq restart with 1;
  end if;
end $$;

-- Delete all files from the storage bucket
delete from storage.objects where bucket_id = 'manuals';