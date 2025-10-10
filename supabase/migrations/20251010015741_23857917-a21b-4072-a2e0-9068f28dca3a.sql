-- Mover extensão pg_net do schema public para extensions
-- Isso melhora a segurança ao separar extensões do schema público

-- Primeiro, criar o schema extensions se não existir
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover a extensão pg_net para o schema extensions
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Garantir que o schema extensions está no search_path
ALTER DATABASE postgres SET search_path TO public, extensions;