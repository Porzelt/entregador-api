// Executa antes de qualquer import: aponta os testes e2e para um banco separado.
require('dotenv').config();
process.env.DB_NAME = process.env.E2E_DB_NAME || 'entregador_test';
process.env.JWT_SECRET = 'segredo-falso-de-teste';
process.env.DEMO_COURIER_EMAIL = 'teste@example.com';
process.env.DEMO_COURIER_PASSWORD = 'senha-falsa-de-teste';
