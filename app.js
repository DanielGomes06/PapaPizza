/* =========================================================================
   PAPA PIZZA DELIVERY — app.js
   Estado da aplicação em memória + localStorage (simulação de persistência).
   Pontos de integração com serviços reais estão marcados com comentários
   em destaque: 🔌 BANCO DE DADOS · 💳 PAGAMENTO · 📲 WHATSAPP
   ========================================================================= */

(function () {
  "use strict";

  /* ---------------------------------------------------------------------
     CONFIGURAÇÃO GERAL DA LOJA
  --------------------------------------------------------------------- */
  const STORE = {
    nome: "Papa Pizza Delivery",
    cidade: "Jacutinga, MG",
    cep: "37590-000",
    // 📲 Número real do WhatsApp Business da loja (formato internacional, só dígitos)
    whatsapp: "5535999990000",
    horario: { abre: 18 * 60, fecha: 23 * 60 + 30 }, // em minutos desde 00:00
    diasFuncionamento: [0, 2, 3, 4, 5, 6], // 0=domingo ... 6=sábado (1=segunda fechado)
    taxaEntrega: 6.0,
  };

  const CATEGORY_LABEL = {
    salgadas: "Salgada",
    doces: "Doce",
    bebidas: "Bebida",
    promocionais: "Promocional",
  };

  /* ---------------------------------------------------------------------
     CARDÁPIO — dados iniciais (pré-carregados)
     🔌 CONEXÃO COM BANCO DE DADOS AQUI
     Em produção, substitua MENU_SEED por uma chamada real, ex:
       const res = await fetch('/api/pizzas');
       const MENU = await res.json();
     (Supabase: supabase.from('pizzas').select('*').eq('status','ativo'))
  --------------------------------------------------------------------- */
  const MENU_SEED = [
    {
      id: "pz-calabresa",
      nome: "Pizza Calabresa Especial",
      categoria: "salgadas",
      ingredientes: "Molho caseiro, muçarela, calabresa fatiada, cebola roxa e orégano",
      precoBrotinho: 39.9,
      precoGrande: 59.9,
      imagem: "https://images.unsplash.com/photo-1628840042765-356cda07504e?q=80&w=800&auto=format&fit=crop",
      tag: "Mais pedida",
      status: "ativo",
      vendas: 0,
    },
    {
      id: "pz-portuguesa",
      nome: "Pizza Portuguesa",
      categoria: "promocionais",
      ingredientes: "Molho, muçarela, presunto, ovos, cebola, pimentão e azeitona",
      precoBrotinho: 42.9,
      precoGrande: 62.9,
      imagem: "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?q=80&w=800&auto=format&fit=crop",
      tag: "Oferta de terça",
      status: "ativo",
      vendas: 0,
    },
    {
      id: "pz-chocolate",
      nome: "Pizza Chocolate com Morango",
      categoria: "doces",
      ingredientes: "Massa doce, chocolate ao leite derretido e morangos frescos fatiados",
      precoBrotinho: 34.9,
      precoGrande: 49.9,
      imagem: "https://images.unsplash.com/photo-1552767059-ce182ead6c1b?q=80&w=800&auto=format&fit=crop",
      tag: "",
      status: "ativo",
      vendas: 0,
    },
    {
      id: "bb-refri",
      nome: "Refrigerante Lata 350ml",
      categoria: "bebidas",
      ingredientes: "Coca-Cola, Guaraná ou Fanta — geladinho",
      precoBrotinho: 6.0,
      precoGrande: 6.0,
      imagem: "https://images.unsplash.com/photo-1554866585-cd94860890b7?q=80&w=800&auto=format&fit=crop",
      tag: "",
      status: "ativo",
      vendas: 0,
    },
  ];

  const SIZES = {
    padrao: [
      { id: "brotinho", label: "Brotinho · 4 fatias", key: "precoBrotinho" },
      { id: "grande", label: "Grande · 8 fatias", key: "precoGrande" },
    ],
  };

  /* ---------------------------------------------------------------------
     PERSISTÊNCIA LOCAL (simulação — troque pelo backend real)
  --------------------------------------------------------------------- */
  const db = {
    loadMenu() {
      try {
        const raw = localStorage.getItem("papapizza_menu");
        return raw ? JSON.parse(raw) : structuredClone(MENU_SEED);
      } catch (e) {
        return structuredClone(MENU_SEED);
      }
    },
    saveMenu(menu) {
      localStorage.setItem("papapizza_menu", JSON.stringify(menu));
    },
    loadOrders() {
      try {
        const raw = localStorage.getItem("papapizza_orders");
        return raw ? JSON.parse(raw) : [];
      } catch (e) {
        return [];
      }
    },
    saveOrders(orders) {
      localStorage.setItem("papapizza_orders", JSON.stringify(orders));
    },
  };

  /* ---------------------------------------------------------------------
     ESTADO DA APLICAÇÃO
  --------------------------------------------------------------------- */
  const state = {
    menu: db.loadMenu(),
    orders: db.loadOrders(),
    cart: [],
    filter: "todas",
    mode: "delivery", // 'delivery' | 'pickup'
    customize: {
      pizza: null,
      size: null,
      crust: { name: "Sem borda", price: 0 },
      qty: 1,
      notes: "",
    },
    checkoutStep: 1,
    payment: null,
  };

  const money = (v) => "R$ " + v.toFixed(2).replace(".", ",");
  const uid = (p = "id") => p + "-" + Math.random().toString(36).slice(2, 9);

  /* ---------------------------------------------------------------------
     DOM SHORTCUTS
  --------------------------------------------------------------------- */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* =======================================================================
     STATUS DE FUNCIONAMENTO (aberto / fechado)
  ======================================================================= */
  function updateStoreStatus() {
    const now = new Date();
    const day = now.getDay();
    const minutes = now.getHours() * 60 + now.getMinutes();
    const isOpenDay = STORE.diasFuncionamento.includes(day);
    const isOpenHour = minutes >= STORE.horario.abre && minutes <= STORE.horario.fecha;
    const isOpen = isOpenDay && isOpenHour;

    const pill = $("#statusPill");
    const label = $("#statusLabel");
    pill.classList.toggle("is-open", isOpen);
    pill.classList.toggle("is-closed", !isOpen);
    label.textContent = isOpen ? "Aberto agora" : "Fechado no momento";
    return isOpen;
  }

  /* =======================================================================
     TOASTS
  ======================================================================= */
  function toast(message, type = "success") {
    const container = $("#toastContainer");
    const el = document.createElement("div");
    el.className = "toast " + type;
    el.textContent = message;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 220);
    }, 2600);
  }

  /* =======================================================================
     RENDER — CARDÁPIO
  ======================================================================= */
  function renderMenu() {
    const grid = $("#menuGrid");
    const items = state.menu.filter((p) => {
      if (p.status !== "ativo") return false;
      if (state.filter === "todas") return true;
      return p.categoria === state.filter;
    });

    if (items.length === 0) {
      grid.innerHTML = '<p class="menu-empty">Nenhum item nessa categoria por enquanto.</p>';
      return;
    }

    grid.innerHTML = items
      .map((p) => {
        const isDrink = p.categoria === "bebidas";
        const priceLabel = isDrink ? money(p.precoGrande) : money(p.precoBrotinho);
        return `
        <article class="pizza-card" data-id="${p.id}">
          <div class="pizza-media">
            <img src="${p.imagem}" alt="${p.nome}" loading="lazy">
            ${p.tag ? `<span class="pizza-tag">${p.tag}</span>` : ""}
          </div>
          <div class="pizza-body">
            <h3>${p.nome}</h3>
            <p class="pizza-ingredients">${p.ingredientes}</p>
            <div class="pizza-footer">
              <div class="pizza-price">
                <span class="from">${isDrink ? "unidade" : "a partir de"}</span>
                <span class="value">${priceLabel}</span>
              </div>
              <button class="add-btn" data-add="${p.id}" aria-label="Adicionar ${p.nome}">+</button>
            </div>
          </div>
        </article>`;
      })
      .join("");
  }

  /* =======================================================================
     MODAL DE CUSTOMIZAÇÃO
  ======================================================================= */
  function openCustomize(pizzaId) {
    const pizza = state.menu.find((p) => p.id === pizzaId);
    if (!pizza) return;

    state.customize = {
      pizza,
      size: pizza.categoria === "bebidas" ? { id: "unico", label: "Unidade", key: "precoGrande" } : SIZES.padrao[1],
      crust: { name: "Sem borda", price: 0 },
      qty: 1,
      notes: "",
    };

    $("#customizeImg").src = pizza.imagem;
    $("#customizeImg").alt = pizza.nome;
    $("#customizeTitle").textContent = pizza.nome;
    $("#customizeIngredients").textContent = pizza.ingredientes;
    $("#qtyValue").textContent = "1";
    $("#customizeNotes").value = "";

    const isDrink = pizza.categoria === "bebidas";
    $("#sizeGroup").hidden = isDrink;
    $("#crustGroup").hidden = isDrink;

    if (!isDrink) {
      $("#sizeChips").innerHTML = SIZES.padrao
        .map(
          (s) => `<button class="chip ${s.id === state.customize.size.id ? "is-active" : ""}" data-size="${s.id}">
            ${s.label} <small>${money(pizza[s.key])}</small>
          </button>`
        )
        .join("");
    }

    $$("#crustChips .chip").forEach((c) => c.classList.remove("is-active"));
    $$("#crustChips .chip")[0].classList.add("is-active");

    updateCustomizePrice();
    $("#customizeOverlay").classList.add("is-open");
  }

  function updateCustomizePrice() {
    const { pizza, size, crust, qty } = state.customize;
    if (!pizza) return;
    const base = pizza[size.key];
    const unit = base + crust.price;
    $("#customizePrice").textContent = money(unit * qty);
  }

  function closeCustomize() {
    $("#customizeOverlay").classList.remove("is-open");
  }

  /* =======================================================================
     CARRINHO
  ======================================================================= */
  function addToCart() {
    const { pizza, size, crust, qty, notes } = state.customize;
    const unitPrice = pizza[size.key] + crust.price;

    state.cart.push({
      cartId: uid("cart"),
      pizzaId: pizza.id,
      nome: pizza.nome,
      imagem: pizza.imagem,
      sizeLabel: size.label,
      crustName: crust.name,
      notes: notes.trim(),
      qty,
      unitPrice,
    });

    renderCart();
    closeCustomize();
    bumpCartIcon();
    toast(`${pizza.nome} adicionada ao pedido!`);
  }

  function removeFromCart(cartId) {
    state.cart = state.cart.filter((i) => i.cartId !== cartId);
    renderCart();
  }

  function bumpCartIcon() {
    const btn = $("#cartBtn");
    btn.classList.remove("bump");
    void btn.offsetWidth;
    btn.classList.add("bump");
  }

  function cartTotals() {
    const subtotal = state.cart.reduce((sum, i) => sum + i.unitPrice * i.qty, 0);
    const fee = state.mode === "delivery" && state.cart.length ? STORE.taxaEntrega : 0;
    return { subtotal, fee, total: subtotal + fee };
  }

  function renderCart() {
    const count = state.cart.reduce((s, i) => s + i.qty, 0);
    $("#cartBadge").textContent = count;

    const itemsWrap = $("#cartItems");
    const empty = $("#cartEmpty");
    const summary = $("#cartSummary");

    if (state.cart.length === 0) {
      itemsWrap.innerHTML = "";
      empty.style.display = "flex";
      summary.style.display = "none";
      return;
    }
    empty.style.display = "none";
    summary.style.display = "block";

    itemsWrap.innerHTML = state.cart
      .map((i) => {
        const details = [i.sizeLabel, i.crustName !== "Sem borda" ? "Borda " + i.crustName : null, i.notes || null]
          .filter(Boolean)
          .join(" · ");
        return `
        <div class="cart-item">
          <img src="${i.imagem}" alt="${i.nome}">
          <div class="cart-item-info">
            <h4>${i.qty}x ${i.nome}</h4>
            <p class="cart-item-meta">${details}</p>
            <div class="cart-item-row">
              <span class="cart-item-price">${money(i.unitPrice * i.qty)}</span>
              <button class="cart-item-remove" data-remove="${i.cartId}">Remover</button>
            </div>
          </div>
        </div>`;
      })
      .join("");

    const { subtotal, fee, total } = cartTotals();
    $("#cartSubtotal").textContent = money(subtotal);
    $("#deliveryFeeLabel").textContent = state.mode === "delivery" ? "Taxa de entrega (Jacutinga)" : "Retirada no balcão";
    $("#cartDeliveryFee").textContent = money(fee);
    $("#cartTotal").textContent = money(total);
  }

  function openCart() {
    $("#cartOverlay").classList.add("is-open");
  }
  function closeCart() {
    $("#cartOverlay").classList.remove("is-open");
  }

  /* =======================================================================
     MODO: ENTREGA x RETIRADA
  ======================================================================= */
  function setMode(mode) {
    state.mode = mode;
    $$(".mode-btn").forEach((b) => {
      const active = b.dataset.mode === mode;
      b.classList.toggle("is-active", active);
      b.setAttribute("aria-selected", active);
    });
    renderCart();
  }

  /* =======================================================================
     CHECKOUT — WIZARD DE 4 ETAPAS
  ======================================================================= */
  function openCheckout() {
    if (state.cart.length === 0) return;
    closeCart();
    state.checkoutStep = 1;
    state.payment = null;
    goToStep(1);

    $("#pickupNotice").hidden = state.mode !== "pickup";
    $("#deliveryFields").hidden = state.mode === "pickup";

    $("#checkoutOverlay").classList.add("is-open");
  }

  function closeCheckoutModal() {
    $("#checkoutOverlay").classList.remove("is-open");
  }

  function goToStep(n) {
    state.checkoutStep = n;
    $$(".checkout-step").forEach((p) => p.classList.toggle("is-active", Number(p.dataset.stepPanel) === n));
    $$(".step").forEach((s) => {
      const num = Number(s.dataset.step);
      s.classList.toggle("is-active", num === n);
      s.classList.toggle("is-done", num < n);
    });
    if (n === 4) renderOrderReview();
  }

  function validateStep1() {
    const name = $("#custName").value.trim();
    const phone = $("#custPhone").value.trim();
    if (!name || !phone) {
      toast("Preencha nome e telefone para continuar.", "error");
      return false;
    }
    return true;
  }

  function validateStep2() {
    if (state.mode === "pickup") return true;
    const street = $("#custStreet").value.trim();
    const number = $("#custNumber").value.trim();
    const neighborhood = $("#custNeighborhood").value.trim();
    if (!street || !number || !neighborhood) {
      toast("Preencha o endereço completo para continuar.", "error");
      return false;
    }
    return true;
  }

  function selectPayment(method) {
    state.payment = method;
    $$(".payment-chip").forEach((c) => c.classList.toggle("is-active", c.dataset.payment === method));
    $("#changeForField").hidden = method !== "dinheiro";
    $("#pixNotice").hidden = method !== "pix";
  }

  function renderOrderReview() {
    const { subtotal, fee, total } = cartTotals();
    const lines = state.cart
      .map((i) => `<div class="review-line"><span>${i.qty}x ${i.nome} (${i.sizeLabel})</span><span>${money(i.unitPrice * i.qty)}</span></div>`)
      .join("");
    const paymentLabel = { pix: "PIX", cartao: "Cartão na entrega", dinheiro: "Dinheiro" }[state.payment] || "—";

    $("#orderReview").innerHTML = `
      ${lines}
      <div class="review-line"><span>Taxa de entrega</span><span>${money(fee)}</span></div>
      <div class="review-line review-total"><span>Total</span><span>${money(total)}</span></div>
      <div class="review-line"><span>Pagamento</span><span>${paymentLabel}</span></div>
      <div class="review-line"><span>Recebimento</span><span>${state.mode === "delivery" ? "Entrega em Jacutinga" : "Retirada no balcão"}</span></div>
    `;

    $("#pixBox").hidden = state.payment !== "pix";
    if (state.payment === "pix") {
      // 💳 API DE PAGAMENTO AQUI
      // Gerar cobrança PIX real (Mercado Pago / Asaas) e exibir o QR Code retornado:
      //   const cobranca = await fetch('/api/pagamentos/pix', { method: 'POST', body: JSON.stringify({ valor: total, pedidoId }) });
      //   const { qrCodeBase64, copiaECola } = await cobranca.json();
      // Configure também o webhook de confirmação de pagamento no backend.
    }
  }

  function confirmOrder() {
    const { subtotal, fee, total } = cartTotals();
    const order = {
      id: "PP" + Date.now().toString().slice(-6),
      createdAt: new Date().toISOString(),
      cliente: { nome: $("#custName").value.trim(), telefone: $("#custPhone").value.trim() },
      modo: state.mode,
      endereco:
        state.mode === "delivery"
          ? {
              rua: $("#custStreet").value.trim(),
              numero: $("#custNumber").value.trim(),
              bairro: $("#custNeighborhood").value.trim(),
              referencia: $("#custRef").value.trim(),
            }
          : null,
      pagamento: state.payment,
      trocoPara: state.payment === "dinheiro" ? $("#changeFor").value : null,
      itens: state.cart.map((i) => ({ ...i })),
      subtotal,
      taxaEntrega: fee,
      total,
      status: "Pendente",
    };

    // 🔌 CONEXÃO COM BANCO DE DADOS AQUI
    // Persistir o pedido de verdade, ex:
    //   await fetch('/api/pedidos', { method: 'POST', body: JSON.stringify(order) });
    // (Supabase: supabase.from('pedidos').insert(order))
    state.orders.unshift(order);
    db.saveOrders(state.orders);

    // Atualiza contagem de vendas por pizza (para o ranking do dashboard)
    order.itens.forEach((i) => {
      const p = state.menu.find((m) => m.id === i.pizzaId);
      if (p) p.vendas = (p.vendas || 0) + i.qty;
    });
    db.saveMenu(state.menu);

    closeCheckoutModal();
    showSuccess(order);

    state.cart = [];
    renderCart();
    renderAdminDashboard();
    renderAdminOrders();
  }

  function showSuccess(order) {
    $("#successOrderId").textContent = "#" + order.id;
    $("#successWhatsappBtn").href = buildWhatsappLink(order);
    $("#successOverlay").classList.add("is-open");
  }

  function closeSuccess() {
    $("#successOverlay").classList.remove("is-open");
  }

  /* =======================================================================
     📲 INTEGRAÇÃO COM WHATSAPP
     Monta a mensagem de resumo do pedido e abre o WhatsApp Business da loja.
  ======================================================================= */
  function buildWhatsappLink(order) {
    const itemsText = order.itens.map((i) => `• ${i.qty}x ${i.nome} (${i.sizeLabel}${i.crustName !== "Sem borda" ? ", borda " + i.crustName : ""})`).join("\n");
    const enderecoText =
      order.modo === "delivery" && order.endereco
        ? `Endereço: ${order.endereco.rua}, ${order.endereco.numero} - ${order.endereco.bairro}${order.endereco.referencia ? " (Ref: " + order.endereco.referencia + ")" : ""}, Jacutinga - MG`
        : "Retirada no balcão - Centro, Jacutinga - MG";

    const message = [
      `Olá, Papa Pizza! 🍕 Segue meu pedido *#${order.id}*:`,
      "",
      itemsText,
      "",
      `Subtotal: ${money(order.subtotal)}`,
      `Taxa de entrega: ${money(order.taxaEntrega)}`,
      `Total: ${money(order.total)}`,
      `Pagamento: ${order.pagamento}`,
      "",
      `Nome: ${order.cliente.nome}`,
      `Telefone: ${order.cliente.telefone}`,
      enderecoText,
    ].join("\n");

    // 📲 API DO WHATSAPP AQUI — link direto wa.me (funciona sem backend).
    // Para automações avançadas (confirmação automática, status do pedido),
    // integre a WhatsApp Business Cloud API em um webhook no backend.
    return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(message)}`;
  }

  /* =======================================================================
     ADMIN — DASHBOARD
  ======================================================================= */
  function renderAdminDashboard() {
    const today = new Date().toDateString();
    const todayOrders = state.orders.filter((o) => new Date(o.createdAt).toDateString() === today);
    const sales = todayOrders.reduce((s, o) => s + o.total, 0);
    const avg = todayOrders.length ? sales / todayOrders.length : 0;

    $("#statSales").textContent = money(sales);
    $("#statOrders").textContent = todayOrders.length;
    $("#statAvg").textContent = money(avg);

    const ranked = [...state.menu].filter((p) => p.vendas > 0).sort((a, b) => b.vendas - a.vendas).slice(0, 5);
    $("#rankList").innerHTML = ranked.length
      ? ranked.map((p) => `<li>${p.nome} <span class="rank-count">— ${p.vendas} vendida${p.vendas > 1 ? "s" : ""}</span></li>`).join("")
      : '<li class="muted">Ainda sem vendas registradas.</li>';
  }

  /* =======================================================================
     ADMIN — CRUD DE CARDÁPIO
  ======================================================================= */
  function renderAdminMenuTable() {
    const body = $("#menuTableBody");
    body.innerHTML = state.menu
      .map(
        (p) => `
      <tr data-row="${p.id}">
        <td>${p.nome}</td>
        <td>${CATEGORY_LABEL[p.categoria] || p.categoria}</td>
        <td>${money(p.precoBrotinho)}</td>
        <td>${money(p.precoGrande)}</td>
        <td><span class="badge ${p.status}">${p.status === "ativo" ? "Ativo" : "Inativo"}</span></td>
        <td>
          <button class="icon-link-btn" data-toggle="${p.id}">${p.status === "ativo" ? "Desativar" : "Ativar"}</button>
          &nbsp;·&nbsp;
          <button class="icon-link-btn" data-delete="${p.id}">Excluir</button>
        </td>
      </tr>`
      )
      .join("");
  }

  function handlePizzaFormSubmit(e) {
    e.preventDefault();
    const form = e.target;
    const data = new FormData(form);

    const novaPizza = {
      id: uid("pz"),
      nome: data.get("nome").trim(),
      categoria: data.get("categoria"),
      ingredientes: data.get("ingredientes").trim(),
      precoBrotinho: parseFloat(data.get("precoBrotinho")),
      precoGrande: parseFloat(data.get("precoGrande")),
      imagem: data.get("imagem").trim(),
      tag: data.get("tag").trim(),
      status: data.get("status"),
      vendas: 0,
    };

    // 🔌 CONEXÃO COM BANCO DE DADOS AQUI
    // Persistir a nova pizza no backend, ex:
    //   await fetch('/api/pizzas', { method: 'POST', body: JSON.stringify(novaPizza) });
    // (Supabase: supabase.from('pizzas').insert(novaPizza))
    state.menu.unshift(novaPizza);
    db.saveMenu(state.menu);

    // Atualiza o cardápio da loja automaticamente (gerenciamento de estado)
    renderMenu();
    renderAdminMenuTable();
    renderAdminDashboard();

    form.reset();
    toast(`"${novaPizza.nome}" publicada no cardápio!`);
  }

  function toggleMenuItemStatus(id) {
    const p = state.menu.find((m) => m.id === id);
    if (!p) return;
    p.status = p.status === "ativo" ? "inativo" : "ativo";
    db.saveMenu(state.menu);
    renderMenu();
    renderAdminMenuTable();
  }

  function deleteMenuItem(id) {
    state.menu = state.menu.filter((m) => m.id !== id);
    db.saveMenu(state.menu);
    renderMenu();
    renderAdminMenuTable();
    toast("Item removido do cardápio.");
  }

  /* =======================================================================
     ADMIN — PEDIDOS
  ======================================================================= */
  const ORDER_STATUSES = ["Pendente", "Em Preparo", "Saiu para Entrega", "Concluído"];

  function renderAdminOrders() {
    const body = $("#ordersTableBody");
    $("#emptyOrders").style.display = state.orders.length ? "none" : "block";

    body.innerHTML = state.orders
      .map((o) => {
        const itemsSummary = o.itens.map((i) => `${i.qty}x ${i.nome}`).join(", ");
        return `
        <tr>
          <td>#${o.id}</td>
          <td>${o.cliente.nome}</td>
          <td>${itemsSummary}</td>
          <td>${money(o.total)}</td>
          <td><span class="badge ${statusClass(o.status)}">${o.status}</span></td>
          <td>
            <select class="status-select" data-order="${o.id}">
              ${ORDER_STATUSES.map((s) => `<option value="${s}" ${s === o.status ? "selected" : ""}>${s}</option>`).join("")}
            </select>
          </td>
        </tr>`;
      })
      .join("");
  }

  function statusClass(status) {
    return { Pendente: "pendente", "Em Preparo": "preparo", "Saiu para Entrega": "entrega", Concluído: "concluido" }[status] || "pendente";
  }

  function updateOrderStatus(orderId, status) {
    const order = state.orders.find((o) => o.id === orderId);
    if (!order) return;
    order.status = status;
    // 🔌 CONEXÃO COM BANCO DE DADOS AQUI — persistir mudança de status do pedido
    db.saveOrders(state.orders);
    renderAdminOrders();
    toast(`Pedido #${orderId} atualizado para "${status}".`);
  }

  /* =======================================================================
     NAVEGAÇÃO: CLIENTE ⇄ ADMIN
  ======================================================================= */
  function enterAdmin() {
    $("#clientView").hidden = true;
    $("#adminView").hidden = false;
    renderAdminDashboard();
    renderAdminMenuTable();
    renderAdminOrders();
    window.scrollTo(0, 0);
  }

  function exitAdmin() {
    $("#adminView").hidden = true;
    $("#clientView").hidden = false;
    window.scrollTo(0, 0);
  }

  function switchAdminPanel(panelId) {
    $$(".admin-nav-btn").forEach((b) => b.classList.toggle("is-active", b.dataset.panel === panelId));
    $$(".admin-panel").forEach((p) => p.classList.toggle("is-active", p.id === "panel-" + panelId));
  }

  /* =======================================================================
     EVENTOS
  ======================================================================= */
  function bindEvents() {
    // Filtros do cardápio
    $("#filters").addEventListener("click", (e) => {
      const btn = e.target.closest(".filter-chip");
      if (!btn) return;
      $$(".filter-chip").forEach((c) => c.classList.remove("is-active"));
      btn.classList.add("is-active");
      state.filter = btn.dataset.filter;
      renderMenu();
    });

    // Adicionar pizza (abre customização)
    $("#menuGrid").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-add]");
      if (!btn) return;
      openCustomize(btn.dataset.add);
    });

    // Customização: fechar
    $("#closeCustomize").addEventListener("click", closeCustomize);
    $("#customizeOverlay").addEventListener("click", (e) => {
      if (e.target.id === "customizeOverlay") closeCustomize();
    });

    // Customização: tamanho
    $("#sizeChips").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      $$("#sizeChips .chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      state.customize.size = SIZES.padrao.find((s) => s.id === chip.dataset.size);
      updateCustomizePrice();
    });

    // Customização: borda
    $("#crustChips").addEventListener("click", (e) => {
      const chip = e.target.closest(".chip");
      if (!chip) return;
      $$("#crustChips .chip").forEach((c) => c.classList.remove("is-active"));
      chip.classList.add("is-active");
      state.customize.crust = { name: chip.dataset.crust, price: parseFloat(chip.dataset.price) };
      updateCustomizePrice();
    });

    // Customização: observações
    $("#customizeNotes").addEventListener("input", (e) => {
      state.customize.notes = e.target.value;
    });

    // Customização: quantidade
    $("#qtyMinus").addEventListener("click", () => {
      state.customize.qty = Math.max(1, state.customize.qty - 1);
      $("#qtyValue").textContent = state.customize.qty;
      updateCustomizePrice();
    });
    $("#qtyPlus").addEventListener("click", () => {
      state.customize.qty = Math.min(20, state.customize.qty + 1);
      $("#qtyValue").textContent = state.customize.qty;
      updateCustomizePrice();
    });

    $("#confirmAddBtn").addEventListener("click", addToCart);

    // Carrinho
    $("#cartBtn").addEventListener("click", openCart);
    $("#closeCart").addEventListener("click", closeCart);
    $("#cartOverlay").addEventListener("click", (e) => {
      if (e.target.id === "cartOverlay") closeCart();
    });
    $("#cartItems").addEventListener("click", (e) => {
      const btn = e.target.closest("[data-remove]");
      if (!btn) return;
      removeFromCart(btn.dataset.remove);
    });
    $("#checkoutBtn").addEventListener("click", openCheckout);

    // Modo entrega/retirada
    $("#modeSwitch").addEventListener("click", (e) => {
      const btn = e.target.closest(".mode-btn");
      if (!btn) return;
      setMode(btn.dataset.mode);
    });

    // Checkout: navegação
    $("#toStep2").addEventListener("click", () => validateStep1() && goToStep(2));
    $("#toStep3").addEventListener("click", () => validateStep2() && goToStep(3));
    $("#toStep4").addEventListener("click", () => {
      if (!state.payment) {
        toast("Escolha uma forma de pagamento.", "error");
        return;
      }
      goToStep(4);
    });
    $$("[data-back]").forEach((b) => b.addEventListener("click", () => goToStep(Number(b.dataset.back))));

    $("#closeCheckout").addEventListener("click", closeCheckoutModal);
    $("#checkoutOverlay").addEventListener("click", (e) => {
      if (e.target.id === "checkoutOverlay") closeCheckoutModal();
    });

    $("#paymentOptions").addEventListener("click", (e) => {
      const chip = e.target.closest(".payment-chip");
      if (!chip) return;
      selectPayment(chip.dataset.payment);
    });

    $("#confirmOrderBtn").addEventListener("click", confirmOrder);

    // Sucesso
    $("#closeSuccessBtn").addEventListener("click", closeSuccess);
    $("#successOverlay").addEventListener("click", (e) => {
      if (e.target.id === "successOverlay") closeSuccess();
    });

    // Admin: entrar / sair
    $("#adminEntryBtn").addEventListener("click", enterAdmin);
    $("#adminExitBtn").addEventListener("click", exitAdmin);
    $("#adminNav").addEventListener("click", (e) => {
      const btn = e.target.closest(".admin-nav-btn");
      if (!btn) return;
      switchAdminPanel(btn.dataset.panel);
    });

    // Admin: CRUD cardápio
    $("#pizzaForm").addEventListener("submit", handlePizzaFormSubmit);
    $("#menuTableBody").addEventListener("click", (e) => {
      const toggleBtn = e.target.closest("[data-toggle]");
      const deleteBtn = e.target.closest("[data-delete]");
      if (toggleBtn) toggleMenuItemStatus(toggleBtn.dataset.toggle);
      if (deleteBtn) deleteMenuItem(deleteBtn.dataset.delete);
    });

    // Admin: pedidos
    $("#ordersTableBody").addEventListener("change", (e) => {
      const select = e.target.closest("[data-order]");
      if (!select) return;
      updateOrderStatus(select.dataset.order, select.value);
    });

    // Contato WhatsApp genérico
    $("#whatsappContactBtn").href = `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent("Olá, Papa Pizza! Gostaria de fazer um pedido.")}`;
  }

  /* =======================================================================
     INIT
  ======================================================================= */
  function init() {
    $("#footerYear").textContent = new Date().getFullYear();
    updateStoreStatus();
    setInterval(updateStoreStatus, 60000);

    renderMenu();
    renderCart();
    bindEvents();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
