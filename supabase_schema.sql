-- Create the bookmarks table
CREATE TABLE bookmarks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    url TEXT NOT NULL,
    title TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id);

-- Create an index for faster queries on user_id
CREATE INDEX bookmarks_user_id_idx ON bookmarks(user_id);

-- Enable Realtime for the bookmarks table
ALTER PUBLICATION supabase_realtime ADD TABLE bookmarks;
