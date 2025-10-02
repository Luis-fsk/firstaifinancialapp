-- Add unique constraint to source_url to enable upsert
ALTER TABLE news_articles ADD CONSTRAINT news_articles_source_url_key UNIQUE (source_url);