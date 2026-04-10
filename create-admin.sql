-- Script para criar usuário admin (rode depois do schema)

-- Primeiro, verifica se a tabela users existe
SELECT * FROM users WHERE email = 'admin@loopin.com';

-- Se não existir ou quiser resetar, executa:
DELETE FROM users WHERE email = 'admin@loopin.com';

-- O hash abaixo é para senha: admin123
-- Para gerar um novo hash, use: node -e "console.log(require('bcryptjs').hashSync('admin123', 12))"
INSERT INTO users (email, password_hash, name) 
VALUES ('admin@loopin.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.VTtYWPQFQfN6Fe', 'Administrador');
