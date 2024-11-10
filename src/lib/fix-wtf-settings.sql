-- First, delete any existing records to start fresh
delete from wtf_settings;

-- Add unique constraint to ensure only one active record
alter table wtf_settings drop constraint if exists wtf_settings_is_active_key;
alter table wtf_settings add constraint wtf_settings_is_active_key unique (is_active) where (is_active = true);

-- Insert a single default record
insert into wtf_settings (
    google_vision_enabled,
    google_vision_api_key,
    custom_api_enabled,
    custom_api_url,
    custom_api_key,
    is_active
) values (
    false,
    null,
    false,
    null,
    null,
    true
);

-- Create function to ensure only one active record
create or replace function ensure_single_active_wtf_settings()
returns trigger as $$
begin
    if NEW.is_active then
        update wtf_settings
        set is_active = false
        where id != NEW.id;
    end if;
    return NEW;
end;
$$ language plpgsql;

-- Create trigger to maintain single active record
drop trigger if exists ensure_single_active_wtf_settings on wtf_settings;
create trigger ensure_single_active_wtf_settings
    before insert or update of is_active on wtf_settings
    for each row
    when (NEW.is_active = true)
    execute function ensure_single_active_wtf_settings();