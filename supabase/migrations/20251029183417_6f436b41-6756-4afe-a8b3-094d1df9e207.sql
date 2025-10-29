-- Delete old news articles with HTML in summary
DELETE FROM news_articles 
WHERE summary LIKE '%<img%' 
   OR summary LIKE '%<p%' 
   OR summary LIKE '%<div%'
   OR summary LIKE '%style=%';