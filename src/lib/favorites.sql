-- Add likes column to standards table
alter table standards add column if not exists likes integer default 0;

-- Update the trigger to handle standards
create or replace function update_likes_count()
returns trigger as $$
declare
    item_table text;
begin
    case new.item_type
        when 'post' then item_table := 'posts';
        when 'manual' then item_table := 'manuals';
        when 'standard' then item_table := 'standards';
        else return new;
    end case;

    execute format('
        update %I
        set likes = (
            select count(*)
            from favorites
            where item_id = $1
            and item_type = $2
        )
        where id = $1
    ', item_table)
    using new.item_id, new.item_type;

    return new;
end;
$$ language plpgsql security definer;

-- Create trigger for favorites
drop trigger if exists update_likes_count_trigger on favorites;
create trigger update_likes_count_trigger
    after insert or delete on favorites
    for each row
    execute function update_likes_count();