-- Check current role
select id, email, role, raw_user_meta_data
from auth.users 
where email = 'chris.cox@perimetersecurity.co.uk';

-- Check users table
select id, email, role
from public.users
where email = 'chris.cox@perimetersecurity.co.uk';