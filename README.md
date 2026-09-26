# Papa Pizza Delivery — Jacutinga, MG

Site de delivery + painel administrativo, em HTML/CSS/JS puro (sem build step, sem framework — só ES Modules nativos do navegador).

## Como rodar

Como o JavaScript usa `import`/`export` (ES Modules), o navegador **exige** que o site seja servido por HTTP — abrir `index.html` direto com duplo clique (`file://`) não funciona para os módulos. Use um servidor local simples:

```bash
cd papa-pizza
python3 -m http.server 8080
# depois acesse http://localhost:8080
```

## Arquitetura

O projeto segue separação de responsabilidades em camadas, como um projeto profissional de front-end sem framework:

```
papa-pizza/
├── index.html
├── README.md
├── css/
│   ├── tokens.css        → cores, tipografia, espaçamento (design tokens)
│   ├── base.css           → reset, tipografia base, botões
│   ├── layout.css         → header, hero, sobre/contato, rodapé
│   ├── menu.css            → filtros e cards de pizza
│   ├── toast.css           → notificações flutuantes
│   ├── modals.css          → customização, checkout e confirmação
│   ├── cart.css             → carrinho lateral (drawer)
│   ├── admin.css            → painel administrativo
│   └── responsive.css       → media queries (carregado por último)
└── js/
    ├── config.js               → configuração institucional da loja (única fonte de verdade)
    ├── data/
    │   └── menu-seed.js        → cardápio inicial (só usado na primeira carga)
    ├── services/                → tudo que um dia vira integração externa
    │   ├── database.js          → 🔌 persistência (hoje localStorage, amanhã API real)
    │   └── whatsapp.js          → 📲 formatação e link do WhatsApp
    ├── state/
    │   └── store.js             → estado central da aplicação (única fonte de verdade em memória)
    ├── utils/                   → funções puras e genéricas, sem regra de negócio
    │   ├── dom.js                → atalhos de querySelector
    │   ├── format.js             → moeda, geração de ID
    │   ├── events.js             → mini barramento de eventos (pub/sub)
    │   └── toast.js              → notificações
    ├── features/                → funcionalidades da loja (cliente)
    │   ├── store-status.js       → aberto/fechado
    │   ├── menu.js                → renderização do cardápio + filtros
    │   ├── customize-modal.js     → tamanho, borda, observações
    │   ├── cart.js                 → carrinho + modo entrega/retirada
    │   └── checkout.js             → wizard de 4 etapas + 💳 ponto de pagamento
    ├── admin/                    → painel administrativo, isolado do resto
    │   ├── navigation.js           → alternância cliente ⇄ admin
    │   ├── dashboard.js             → vendas do dia e ranking
    │   ├── menu-crud.js             → cadastro/edição/remoção de pizzas
    │   └── orders.js                → gestão de pedidos recebidos
    └── main.js                   → ponto de entrada — inicializa todos os módulos
```

### Por que essa divisão

- **`config.js` e `data/`** guardam só dados fixos — nada de lógica. Trocar o número de WhatsApp ou o cardápio inicial não exige mexer em nenhuma outra parte do código.
- **`services/`** isola tudo que hoje é simulado (localStorage, link `wa.me`) mas amanhã vira uma chamada de API de verdade. É o único lugar que muda quando o backend entrar em produção — o resto do app não sabe (nem precisa saber) como os dados são persistidos.
- **`state/store.js`** é a única fonte de verdade dos dados em memória (cardápio, carrinho, pedidos). Todo módulo lê e escreve nesse mesmo objeto, evitando telas dessincronizadas.
- **`features/`** contém a experiência do cliente, um arquivo por responsabilidade (cada um faz uma coisa só).
- **`admin/`** é tratado como um subsistema à parte. Ele não importa os módulos de `features/` diretamente — ao invés disso, escuta eventos (`menu:updated`, `order:created`) emitidos pelo mini barramento em `utils/events.js`. Isso significa que o carrinho e o checkout do cliente **não sabem que o admin existe**, e vice-versa: você poderia remover o admin inteiro sem quebrar a loja, ou remover a loja sem quebrar o admin.
- **`main.js`** é o único arquivo que conhece todos os módulos. Ele só os inicializa, na ordem — nenhuma lógica de negócio mora ali.

Esse desacoplamento por eventos é o mesmo princípio usado em arquiteturas maiores (ex: microsserviços conversando por fila de mensagens, ou componentes React conversando por Context/Redux): módulos não se conhecem diretamente, só concordam em um "idioma" comum de eventos.

## O que já funciona (sem backend)

- Cardápio com 4 itens pré-carregados (1 salgada obrigatória "Pizza Calabresa Especial", 1 doce, 1 bebida, 1 promocional) e filtros por categoria.
- Modal de customização (tamanho Brotinho/Grande, borda recheada, observações, quantidade).
- Carrinho lateral com cálculo dinâmico de subtotal, taxa de entrega e total.
- Checkout em 4 etapas (Dados → Entrega → Pagamento → Confirmação), com campo de troco para dinheiro e "QR Code" ilustrativo para PIX.
- Botão para reenviar o resumo do pedido pelo WhatsApp (`wa.me`) já formatado.
- Painel Admin (`Acesso Admin` no header): dashboard com vendas do dia, cadastro de novas pizzas (que aparecem automaticamente no cardápio da loja) e gerenciamento de status dos pedidos.
- Indicador "Aberto agora / Fechado" calculado com base no horário real do dispositivo (terça a domingo, 18h–23h30).
- Dados persistidos em `localStorage` do navegador (cardápio e pedidos), só para fins de demonstração.

> ⚠️ **Importante:** o botão "Admin" hoje não tem senha nem login — qualquer pessoa que acessar o site consegue entrar no painel. Antes de usar com clientes reais, adicione alguma proteção (senha simples, ou idealmente login de verdade com backend).

## Pontos de integração (para produção)

Procure no código pelos comentários em destaque:

- **`🔌 CONEXÃO COM BANCO DE DADOS AQUI`** — todo em `js/services/database.js` (carregar/salvar cardápio e pedidos), além dos pontos de uso em `js/features/checkout.js` (salvar pedido), `js/admin/menu-crud.js` (cadastrar pizza) e `js/admin/orders.js` (atualizar status). Troque as chamadas de `localStorage` por chamadas reais ao Supabase, Firebase ou uma API própria em Node.js.
- **`💳 API DE PAGAMENTO AQUI`** — em `js/features/checkout.js`, na função que monta a revisão do pedido: gere a cobrança PIX real via Mercado Pago ou Asaas e substitua o QR Code ilustrativo pela imagem/base64 retornada pela API. Configure também o webhook de confirmação de pagamento.
- **`📲 API DO WHATSAPP AQUI`** — em `js/services/whatsapp.js`: já funciona com um link direto `wa.me`, mas pode ser trocado pela WhatsApp Business Cloud API para automações (confirmação automática, atualização de status).

Antes de publicar, atualize `STORE.whatsapp` em `js/config.js` com o número real da Papa Pizza (formato: código do país + DDD + número, só dígitos).

## Gerando o .zip do projeto

Se quiser gerar o `.zip` novamente depois de editar algo, rode na raiz do projeto (onde está o `index.html`):

```bash
zip -r papa-pizza-delivery.zip index.html css js README.md
```

Ou em Python:

```python
import zipfile, os

with zipfile.ZipFile("papa-pizza-delivery.zip", "w", zipfile.ZIP_DEFLATED) as zf:
    for root, _, files in os.walk("."):
        for f in files:
            path = os.path.join(root, f)
            zf.write(path, os.path.relpath(path, "."))

print("Zip gerado: papa-pizza-delivery.zip")
```
