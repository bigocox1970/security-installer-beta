-- Add likes column to manuals if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'manuals' 
        AND column_name = 'likes'
    ) THEN
        ALTER TABLE manuals ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add likes column to standards if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'standards' 
        AND column_name = 'likes'
    ) THEN
        ALTER TABLE standards ADD COLUMN likes INTEGER DEFAULT 0;
    END IF;
END $$;
