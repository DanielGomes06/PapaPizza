/**
 * data/menu-seed.js
 * Dados iniciais do cardápio, usados apenas na primeira carga
 * (quando ainda não existe nada salvo no armazenamento).
 *
 * 🔌 Em produção, isso deixa de existir: o cardápio inicial passa a
 * vir do banco de dados real (ver js/services/database.js).
 */

export const MENU_SEED = [
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
