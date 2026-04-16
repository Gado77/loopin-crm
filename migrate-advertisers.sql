-- Script de Migração: Importar Advertisers do Loopin.tv para o CRM
-- Execute este SQL no Supabase do CRM (dhchsescvdhrvpeysjsw)

-- 1. Adicionar coluna contact_name se não existir
ALTER TABLE clients ADD COLUMN IF NOT EXISTS contact_name TEXT;

-- 2. Importar dados dos advertisers (usando os IDs originais)
INSERT INTO clients (id, name, email, phone, segment, contact_name, status, created_at)
VALUES 
  ('0b1327ea-e44d-45c1-aa4a-ef373a3d3977', 'keven abreu', 'none@gmail.com', '86 98115-6952', 'engenheiro civil', 'keven', 'active', '2026-02-26T19:19:25.99773+00:00'),
  ('de1993c3-f65a-4063-896f-b814f490de4e', 'hallan hs', 'hallansb@gmail.com', '89988074240', 'loja', 'hs', 'active', '2026-03-03T18:31:35.14419+00:00'),
  ('fa1498ed-a2e8-43e9-aa97-d6c64e15296c', 'loopin tv', 'loopintv@gmail.com', '11961640497', 'tv indoor', 'vitor', 'active', '2025-12-08T01:05:17.296427+00:00'),
  ('895746d9-e0fc-4ceb-9672-f3f33233d38e', 'Edvaldo', 'edvaldocliente1@gmail.com', '99999999999', 'Mercado', 'Edvaldo Supermercado', 'active', '2026-03-11T07:21:12.168847+00:00'),
  ('31044d95-8e3a-4e35-94f6-6a0b234800e4', 'Hinove Digital', 'hinovedigitaal@gmail.com', '89981486496', 'marketing', 'Hinove', 'active', '2026-03-11T14:24:24.592999+00:00'),
  ('91251fe8-ef8c-4880-a808-62c1fd640fb4', 'Beto Ferreira', 'beto@authentic.com', '99999999999', 'Academia', 'Beto', 'active', '2026-03-17T17:43:35.91002+00:00'),
  ('07a8e163-e7b2-4c6c-9df8-d271ec67c972', 'Dedé cabelo', 'dede@gmail.com', '89988083899', 'loja', 'dede', 'active', '2026-03-23T19:19:32.740946+00:00'),
  ('4b537a2b-eb26-48d6-87bf-0b404e740ad7', 'Geziel Marcenato', 'geziel@gmail.com', '+55 89 8804-7600', 'Marcenato', 'Geziel', 'active', '2026-04-13T00:17:48.237662+00:00')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  segment = EXCLUDED.segment,
  contact_name = EXCLUDED.contact_name;