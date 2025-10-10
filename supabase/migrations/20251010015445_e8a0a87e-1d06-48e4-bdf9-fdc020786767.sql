-- Atualizar as datas dos artigos de notícias para serem dos últimos 3 dias
UPDATE news_articles 
SET published_at = NOW() - (random() * INTERVAL '72 hours')
WHERE published_at < NOW() - INTERVAL '7 days';

-- Garantir que sempre haverá notícias recentes
UPDATE news_articles 
SET published_at = CASE 
  WHEN id IN (SELECT id FROM news_articles ORDER BY published_at DESC LIMIT 6) 
  THEN NOW() - (random() * INTERVAL '24 hours')
  ELSE published_at
END;