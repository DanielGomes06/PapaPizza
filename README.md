# Papa Pizza Delivery — Jacutinga, MG

Site de delivery + painel administrativo, em HTML/CSS/JS puro (sem build step — basta abrir `index.html` ou hospedar em qualquer servidor estático).

## Estrutura de arquivos

```
papa-pizza/
├── index.html   → estrutura da loja (cliente) e do painel admin
├── styles.css   → design system completo (tokens de cor/tipografia + componentes)
├── app.js       → toda a lógica: cardápio, carrinho, checkout, admin CRUD, pedidos
└── README.md    → este arquivo
```

## Como rodar

Basta abrir `index.html` no navegador. Para simular um ambiente de produção (recomendado, evita bloqueios de alguns navegadores):

```bash
cd papa-pizza
python3 -m http.server 8080
# depois acesse http://localhost:8080
```

## O que já funciona (sem backend)

- Cardápio com 4 itens pré-carregados (1 salgada obrigatória "Pizza Calabresa Especial", 1 doce, 1 bebida, 1 promocional) e filtros por categoria.
- Modal de customização (tamanho Brotinho/Grande, borda recheada, observações, quantidade).
- Carrinho lateral com cálculo dinâmico de subtotal, taxa de entrega e total.
- Checkout em 4 etapas (Dados → Entrega → Pagamento → Confirmação), com campo de troco para pagamento em dinheiro e "QR Code" ilustrativo para PIX.
- Botão para reenviar o resumo do pedido pelo WhatsApp (`wa.me`) já formatado.
- Painel Admin (`Acesso Admin` no header): dashboard com vendas do dia, cadastro de novas pizzas (que aparecem automaticamente no cardápio da loja) e gerenciamento de status dos pedidos.
- Indicador "Aberto agora / Fechado" calculado com base no horário real do dispositivo (terça a domingo, 18h–23h30).
- Dados persistidos em `localStorage` do navegador (cardápio e pedidos), só para fins de demonstração.

## Pontos de integração (para produção)

Procure no código pelos comentários em destaque:

- `🔌 CONEXÃO COM BANCO DE DADOS AQUI` — em `app.js`: carregar cardápio (`db.loadMenu`), salvar pedido (`confirmOrder`), cadastrar pizza (`handlePizzaFormSubmit`) e atualizar status do pedido (`updateOrderStatus`). Troque as chamadas de `localStorage` por chamadas reais ao Supabase, Firebase ou uma API própria em Node.js.
- `💳 API DE PAGAMENTO AQUI` — em `renderOrderReview()`, no momento em que o pagamento é PIX: gere a cobrança real via Mercado Pago ou Asaas e substitua o QR Code ilustrativo (`.pix-qr`) pela imagem/base64 retornada pela API. Configure também o webhook de confirmação de pagamento.
- `📲 API DO WHATSAPP AQUI` — em `buildWhatsappLink()`: já funciona com um link direto `wa.me`, mas pode ser trocado pela WhatsApp Business Cloud API para automações (confirmação automática, atualização de status).

Antes de publicar, atualize `STORE.whatsapp` em `app.js` com o número real da Papa Pizza (formato: código do país + DDD + número, só dígitos).

## Gerando o .zip do projeto

Se quiser gerar o `.zip` novamente a partir dos arquivos-fonte (por exemplo, depois de editar algo), rode este script Python na pasta que contém `index.html`, `styles.css` e `app.js`:

```python
import zipfile
import os

files = ["index.html", "styles.css", "app.js", "README.md"]
with zipfile.ZipFile("papa-pizza-delivery.zip", "w", zipfile.ZIP_DEFLATED) as zf:
    for f in files:
        if os.path.exists(f):
            zf.write(f)

print("Zip gerado: papa-pizza-delivery.zip")
```

Ou, via terminal (Linux/Mac):

```bash
zip -r papa-pizza-delivery.zip index.html styles.css app.js README.md
```
