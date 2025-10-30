-- Clean CDATA tags from existing news article URLs
UPDATE news_articles 
SET source_url = REGEXP_REPLACE(source_url, '<!\[CDATA\[(.*?)\]\]>', '\1', 'g')
WHERE source_url LIKE '%CDATA%';