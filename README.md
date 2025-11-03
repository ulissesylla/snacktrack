# SnackTrack - Sistema de Gerenciamento de Estoque

O SnackTrack é um sistema completo de gerenciamento de estoque desenvolvido com Node.js/Express e MySQL, projetado para facilitar o controle de produtos, movimentações de estoque, locais de armazenamento e alertas de níveis de estoque.

## 📋 Descrição do Projeto

O SnackTrack oferece uma solução robusta para gerenciar inventários de snacks e produtos, com funcionalidades como:

- Cadastro e gerenciamento de produtos
- Controle de locais de armazenamento
- Registro de movimentações de estoque (entradas e saídas)
- Dashboard com estatísticas e relatórios
- Sistema de autenticação e autorização
- Alertas de estoque baixo
- Interface web intuitiva

## 🛠️ Tecnologias Utilizadas

- **Backend**: Node.js com Express
- **Banco de Dados**: MySQL
- **Frontend**: HTML, CSS, JavaScript
- **Autenticação**: Sessões com express-session
- **Criptografia**: bcrypt para senhas
- **Testes**: Jest para testes automatizados

## 🚀 Requisitos

Antes de instalar o projeto, certifique-se de ter instalado:

- [Node.js](https://nodejs.org/) (versão 14 ou superior)
- [MySQL](https://www.mysql.com/) (versão 8 ou superior)

## 📦 Instalação

1. Clone este repositório:

```bash
git clone https://github.com/seu-usuario/snacktrack.git
cd snacktrack
```

2. Instale as dependências:

```bash
npm install
```

3. Configure o banco de dados MySQL:

   - Crie um banco de dados chamado `snacktrack`
   - Execute os scripts de criação de tabelas (em database/schema.sql)

4. Configure as variáveis de ambiente (veja abaixo)

5. Inicie o servidor:

```bash
npm start
```

## ⚙️ Configuração de Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```
# Banco de dados
DB_HOST=localhost
DB_USER=seu_usuario
DB_PASSWORD=sua_senha
DB_NAME=snacktrack
DB_PORT=3306

# App
PORT=3000

SESSION_SECRET=SuaSenhaSecretaAqui
```

## 📖 Uso

Após iniciar o servidor, acesse a aplicação em `http://localhost:3000`.

A aplicação inclui:

- Sistema de login e autenticação
- Dashboard com estatísticas de estoque
- Cadastro de produtos, locais e movimentações
- Visualização de histórico de movimentações
- Funcionalidades de entrada e saída de estoque

## 🧪 Testes

Para executar os testes automatizados:

```bash
# Executar todos os testes
npm test

# Executar testes em modo watch
npm run test:watch

# Gerar relatório de cobertura
npm run test:coverage
```

## 🔧 Modo de Desenvolvimento

Durante o desenvolvimento, utilize o nodemon para reiniciar automaticamente o servidor ao salvar alterações:

```bash
npm run dev
```

## 📁 Estrutura do Projeto

```
snacktrack/
├── config/           # Configurações (banco de dados, sessões)
├── controllers/      # Lógica de negócios
├── data/            # Camada de acesso a dados
├── middleware/      # Middleware personalizado
├── models/          # Modelos do banco de dados
├── public/          # Arquivos estáticos (CSS, JS, imagens)
├── routes/          # Definições de rotas
├── server.js        # Arquivo principal do servidor
└── package.json     # Dependências e scripts
```
