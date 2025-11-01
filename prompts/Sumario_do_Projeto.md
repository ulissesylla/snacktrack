### **Sumário do Projeto (Revisado com Padrões da Lista)**

#### **Módulo 0: Estrutura, Conexão e Padrões de UI**

* **Objetivo:** Configurar o scaffolding do projeto, a conexão com o BD e o layout visual principal.  
* **Camada de Apresentação (Frontend):**  
  * Criar a estrutura HTML/CSS/JS.  
  * **Padrão de UI:** Implementar o layout principal (shell) com o menu **"Top-Level Navigation"** (Menu Superior).  
  * **Padrão de UI:** Criar a função/componente JS para **"Breadcrumbs"** (ex: `Home > ...`), que será usado nos próximos módulos.  
* **Camada de Negócio (Backend \- Node.js/Express):**  
  * Configurar o servidor Express básico.  
  * Definir a arquitetura de pastas (ex: `/routes`, `/services`, `/data`).  
* **Camada de Dados (Backend \- Node.js):**  
  * Criar o módulo de conexão com o MySQL.  
  * **Padrão GoF (Singleton):** Aplicar o padrão `Singleton` a este módulo de conexão. Isso garante que todo o aplicativo use uma única instância (ou pool) de conexão com o MySQL, economizando recursos.

#### **Módulo 1: Gestão de Acesso (Usuários e Login)**

* **Objetivo:** Implementar autenticação e autorização.  
* **Frontend:**  
  * Criar telas de Login e de Cadastro/Listagem de Usuários.  
  * Integrar as telas ao "Top-Level Navigation".  
  * Implementar "Breadcrumbs" (ex: `Home > Usuários`).  
* **Backend:**  
  * Criar `routes` (rotas), `services` (lógica) e `data` (SQL) para Usuários.  
  * Implementar a lógica de autenticação (ex: JWT ou sessões).  
  * **Padrão GoF (Proxy):** Implementar um *Middleware de Autorização* no Express. Este middleware agirá como um **Protection Proxy**.  
    * **Como funciona:** Ele irá interceptar requisições às rotas (ex: `POST /usuarios`).  
    * **Regra:** O proxy verificará se o usuário logado tem o cargo de "Gerente". Se não tiver, ele bloqueia a requisição *antes* que ela chegue ao `usuarioService`.  
    * **Benefício:** Mantém a lógica de segurança limpa e separada da lógica de negócio.

#### **Módulo 2: Entidades Base (Locais e Produtos)**

* **Objetivo:** Permitir o cadastro de locais de estoque e dos produtos.  
* **Frontend:**  
  * Criar telas de CRUD (Listar, Criar, Editar) para "Locais" e "Produtos".  
  * Adicionar links no "Top-Level Navigation".  
  * Implementar "Breadcrumbs" (ex: `Home > Produtos > Novo`).  
* **Backend:**  
  * Criar `routes`, `services` e `data` (SQL) para Locais e Produtos.  
  * **Padrão GoF (Proxy):** Reutilizar o middleware (Proxy) do Módulo 1 para proteger as rotas de Produtos e Locais, garantindo que apenas usuários logados (ex: "Colaborador" ou "Gerente") possam acessá-las.

#### **Módulo 3: Movimentação de Estoque (O Núcleo do MVP)**

* **Objetivo:** Implementar a lógica central de entrada, saída e transferência de estoque.  
* **Frontend:**  
  * Criar as telas para "Registrar Entrada", "Registrar Saída (Consumo)" e "Registrar Transferência entre Locais".  
  * Adicionar link "Movimentações" no "Top-Level Navigation".  
* **Backend:**  
  * Criar `routes`, `services` e `data` (SQL) para Movimentações.  
  * Criar o `estoqueService.js`. Este será o serviço mais importante, com os métodos:  
    1. `registrarEntrada(produtoId, localId, quantidade)`  
    2. `registrarSaida(produtoId, localId, quantidade)`  
    3. `transferir(produtoId, localOrigemId, localDestinoId, quantidade)`  
  * Esta camada de serviço é o "cérebro" que garante que o estoque seja atualizado corretamente.

#### **Módulo 4: Consultas e Visibilidade (Dashboard)**

* **Objetivo:** Mostrar os dados de forma útil para o usuário.  
* **Frontend:**  
  * Implementar a tela principal ("Dashboard") que cumpre o requisito de "Monitoramento em Tempo Real" (ex: uma tabela com o estoque atual de cada produto por local).  
  * Implementar uma tela de "Histórico de Movimentações".  
* **Backend:**  
  * Criar `routes` e `services` para o Dashboard (ex: `dashboardService.js`).  
  * Implementar na camada de dados (`data`) as consultas SQL de agregação (com `SUM` e `GROUP BY`) necessárias para calcular o estoque atual.

#### **Módulo 5: Funcionalidades Avançadas (Alertas e Projeções)**

* **Objetivo:** Implementar os alertas de estoque mínimo/validade e as projeções.  
* **Frontend:**  
  * Implementar componentes visuais na UI (ex: um ícone de "sino" no "Top-Level Navigation") para exibir os alertas.  
* **Backend:**  
  * **Lógica Simplificada (Sem Padrões):** Para manter a complexidade baixa (como você pediu), *não* usaremos o padrão `Observer` (que não estava na sua lista).  
  * Em vez disso, faremos uma chamada direta:  
    1. Criar um `alertaService.js`.  
    2. Modificar o `estoqueService` (do Módulo 3): Após `registrarSaida()`, ele chamará diretamente `alertaService.verificarEstoqueMinimo(produtoId)`.  
  * Isso gera um pequeno acoplamento, mas é *muito* mais simples de implementar e mais rápido de desenvolver, o que é ideal para o seu prazo.  
  * Implementar a lógica de Projeções (baseada no histórico de saídas).

