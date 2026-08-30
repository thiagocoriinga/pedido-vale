/**
 * =========================================================================
 * GERENCIADOR DE CARDÁPIO COMPLETO • PEDIDOVALE
 * Acordeão de Categorias, Produtos com Fotos, Opcionais e Visualização em Tempo Real
 * =========================================================================
 */

// Chaves de armazenamento dinâmicas por loja
const urlParams = new URLSearchParams(window.location.search);
const CURRENT_STORE_SLUG = urlParams.get('store') || sessionStorage.getItem('CURRENT_LOGGED_STORE') || 'demo';
const getStoreKey = (key) => `STORE_${CURRENT_STORE_SLUG}_${key}`;

// Estado da Loja
let STORE_DATA = {
  name: "Meu Estabelecimento",
  slug: CURRENT_STORE_SLUG,
  isOpen: true,
  whatsapp: "",
  address: "",
  hours: "Segunda a Domingo das 18h às 23h30",
  deliveryFee: 5.00,
  deliveryTime: "30 - 45 min",
  minOrder: 0.00,
  allowPickup: true,
  pixKey: "",
  pixType: "phone",
  pixName: "",
  acceptPix: true,
  acceptCard: true,
  acceptCash: true,
  trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

// Categorias Iniciais
let CATEGORIES = [
  { id: "cat-combos", name: "COMBO", icon: "🔥", desc: "Combos especiais com hambúrguer, batata e refrigerante", visible: true },
  { id: "cat-burgers", name: "Hambúrgueres Artesanais", icon: "🍔", desc: "Smash burgers e artesanais preparados na hora", visible: true },
  { id: "cat-bebidas", name: "Bebidas & Refrigerantes", icon: "🥤", desc: "Sucos, refrigerantes em lata e águas", visible: true }
];

// Produtos Iniciais (Começa com exemplo editável ou vazio)
let PRODUCTS = [];

// Pedidos em Andamento
let ORDERS = [];

// Variáveis de controle de edição
let currentEditingProductId = null;
let currentEditingCategoryId = null;
let currentUploadedProductImage = "";

// -------------------------------------------------------------------------
// INICIALIZAÇÃO DO PAINEL DO RESTAURANTE
// -------------------------------------------------------------------------
function initStoreAdmin() {
  loadStoreData();
  // Garante que as categorias iniciais fiquem salvas no LocalStorage para o cardápio público
  if (!localStorage.getItem(getStoreKey('CATEGORIES'))) {
    saveCategories();
  }
  if (!localStorage.getItem(getStoreKey('CONFIG'))) {
    saveStoreConfig();
  }
  renderStoreTopbar();
  renderTrialInfo();
  renderCategorySelects();
  renderCategoryAccordionList();
  renderOrdersKanban();
  populateSettingsInputs();
}

function getSampleMenuData() {
  return [
    {
      id: "prod-1",
      name: "Combo Smash Duplo Turbinado 🔥",
      price: 34.90,
      originalPrice: 38.90,
      categoryId: "cat-combos",
      description: "1x Smash Bacon Duplo (2 carnes 90g, queijo cheddar e bacon) + 1x Batata Rústica Individual + 1x Coca-Cola Lata 350ml + Molho Especial da Casa.",
      image: "https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?auto=format&fit=crop&w=600&q=80",
      available: true,
      badge: "Mais Vendido",
      optionGroups: [
        {
          id: "opt-refri",
          name: "Escolha seu Refrigerante",
          min: 1,
          max: 1,
          options: [
            { id: "r1", name: "Coca-Cola Original 350ml", price: 0 },
            { id: "r2", name: "Coca-Cola Sem Açúcar 350ml", price: 0 },
            { id: "r3", name: "Guaraná Antarctica 350ml", price: 0 },
            { id: "r4", name: "Fanta Laranja 350ml", price: 0 }
          ]
        },
        {
          id: "opt-ponto",
          name: "Ponto da Carne",
          min: 1,
          max: 1,
          options: [
            { id: "p1", name: "Ao Ponto (Rosadinho e Suculento)", price: 0 },
            { id: "p2", name: "Bem Passado", price: 0 }
          ]
        }
      ]
    },
    {
      id: "prod-2",
      name: "Combo Família Burger Show (4 Pessoas)",
      price: 98.00,
      originalPrice: 110.00,
      categoryId: "cat-combos",
      description: "4x Burgers Artesanais com Queijo Cheddar + 2x Porções Grandes de Batata Frita Crocante + 1x Coca-Cola 2 Litros.",
      image: "https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80",
      available: true,
      badge: "Super Promoção",
      optionGroups: []
    },
    {
      id: "prod-3",
      name: "Combo Individual Smash Bacon",
      price: 29.90,
      originalPrice: 32.90,
      categoryId: "cat-combos",
      description: "1x Smash Burger com Bacon Crocante + 1x Batata Frita Pequena + 1x Refrigerante Lata 350ml.",
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-4",
      name: "Smash Bacon Clássico 👑",
      price: 26.90,
      originalPrice: 0,
      categoryId: "cat-burgers",
      description: "Pão brioche selado na manteiga, 2x smash bovinos 90g com crostinha crocante, queijo cheddar derretido, fatias generosas de bacon e maionese artesanal da casa.",
      image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80",
      available: true,
      badge: "Favorito da Casa",
      optionGroups: [
        {
          id: "opt-adds",
          name: "Adicionais Especiais",
          min: 0,
          max: 3,
          options: [
            { id: "a1", name: "Bacon Crocante Extra (+4 fatias)", price: 4.50 },
            { id: "a2", name: "Cheddar Cremoso Extra", price: 3.50 },
            { id: "a3", name: "Cebola Caramelizada", price: 3.00 },
            { id: "a4", name: "Ovo Frito na Manteiga", price: 2.50 }
          ]
        }
      ]
    },
    {
      id: "prod-5",
      name: "Monster Cheddar Melt",
      price: 34.00,
      originalPrice: 0,
      categoryId: "cat-burgers",
      description: "Pão australiano fofinho, 2x carnes artesanais de 150g, cebola salteada na manteiga e uma verdadeira piscina de creme de queijo cheddar.",
      image: "https://images.unsplash.com/photo-1565299507177-b0ac66763828?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-6",
      name: "Chicken Crispy Crocante",
      price: 24.50,
      originalPrice: 0,
      categoryId: "cat-burgers",
      description: "Pão brioche, sobrecoxa de frango desossada e empanada super suculenta, alface americana fresca, picles agridoce e maionese verde de ervas.",
      image: "https://images.unsplash.com/photo-1625813506062-0aeb1d7a094b?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-7",
      name: "Smash Salada Gourmet",
      price: 25.00,
      originalPrice: 0,
      categoryId: "cat-burgers",
      description: "Pão brioche, 2x smash 90g, queijo prato derretido, rodelas de tomate maduro, alface crocante e molho especial da casa.",
      image: "https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-8",
      name: "Batata Rústica com Alecrim & Páprica",
      price: 18.90,
      originalPrice: 0,
      categoryId: "cat-porcoes",
      description: "Batatas rústicas cortadas à mão com casca, temperadas com alecrim fresco e páprica defumada. Acompanha pote de maionese de alho.",
      image: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-9",
      name: "Batata Suprema com Cheddar & Bacon 🍟",
      price: 28.00,
      originalPrice: 0,
      categoryId: "cat-porcoes",
      description: "Porção grande (400g) de batata frita sequinha coberta com molho cremoso de queijo cheddar quente e muita farofa de bacon crocante.",
      image: "https://images.unsplash.com/photo-1630384060421-cb20d0e0649d?auto=format&fit=crop&w=600&q=80",
      available: true,
      badge: "Serve 2 Pessoas",
      optionGroups: []
    },
    {
      id: "prod-10",
      name: "Onion Rings Crocantes (12 unid)",
      price: 22.00,
      originalPrice: 0,
      categoryId: "cat-porcoes",
      description: "Anéis de cebola dourados e ultra crocantes. Acompanha pote de molho barbecue defumado.",
      image: "https://images.unsplash.com/photo-1639024471285-05c28591bd01?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-11",
      name: "Coca-Cola Original 350ml",
      price: 6.00,
      originalPrice: 0,
      categoryId: "cat-bebidas",
      description: "Lata 350ml trincando de gelada.",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-12",
      name: "Guaraná Antarctica 350ml",
      price: 6.00,
      originalPrice: 0,
      categoryId: "cat-bebidas",
      description: "Lata 350ml gelada.",
      image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-13",
      name: "Suco Natural de Laranja 500ml",
      price: 10.00,
      originalPrice: 0,
      categoryId: "cat-bebidas",
      description: "Suco 100% natural espremido na hora com laranjas selecionadas, sem conservantes.",
      image: "https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-14",
      name: "Milkshake Ninho com Nutella 400ml 🍨",
      price: 18.00,
      originalPrice: 0,
      categoryId: "cat-sobremesas",
      description: "Sorvete artesanal batido com leite Ninho, borda generosa de Nutella pura na taça e chantilly no topo.",
      image: "https://images.unsplash.com/photo-1572490122747-3968b75cc699?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    },
    {
      id: "prod-15",
      name: "Brownie de Chocolate com Sorvete",
      price: 16.00,
      originalPrice: 0,
      categoryId: "cat-sobremesas",
      description: "Brownie de chocolate meio amargo servido quentinho acompanhado de 1 bola de sorvete de creme e calda de chocolate.",
      image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
      available: true,
      optionGroups: []
    }
  ];
}

function importSampleMenu() {
  CATEGORIES = [
    { id: "cat-combos", name: "COMBO", icon: "🔥", desc: "Combos especiais com hambúrguer, batata e refrigerante", visible: true },
    { id: "cat-burgers", name: "HAMBÚRGUERES ARTESANAIS", icon: "🍔", desc: "Smash burgers e artesanais preparados na hora", visible: true },
    { id: "cat-porcoes", name: "PORÇÕES & ENTRADAS", icon: "🍟", desc: "Batatas rústicas, anéis de cebola e petiscos crocantes", visible: true },
    { id: "cat-bebidas", name: "BEBIDAS & REFRIGERANTES", icon: "🥤", desc: "Sucos, refrigerantes em lata e cervejas", visible: true },
    { id: "cat-sobremesas", name: "SOBREMESAS", icon: "🍨", desc: "Milkshakes e brownies especiais", visible: true }
  ];
  saveCategories();

  PRODUCTS = getSampleMenuData();
  saveProducts();

  if (CURRENT_STORE_SLUG === 'demo-burger' || !STORE_DATA.name || STORE_DATA.name === 'Meu Estabelecimento') {
    STORE_DATA.name = "Rei do Burger & Smash 🍔";
    STORE_DATA.whatsapp = "11999999999";
    STORE_DATA.address = "São Paulo - SP";
    STORE_DATA.pixKey = "11999999999";
    STORE_DATA.pixName = "Rei do Burger";
    saveStoreConfig();
  }

  renderStoreTopbar();
  renderCategorySelects();
  renderCategoryAccordionList();
  showToast("✅ Catálogo completo de exemplo carregado com sucesso!");
}

function loadStoreData() {
  try {
    // 1. Tentar sincronizar do Super Admin Tenants
    const SUPERADMIN_TENANTS_KEY = 'SUPERADMIN_TENANTS_DATA';
    const savedTenants = localStorage.getItem(SUPERADMIN_TENANTS_KEY);
    if (savedTenants) {
      const tenants = JSON.parse(savedTenants);
      const foundTenant = tenants.find(t => t.slug === CURRENT_STORE_SLUG);
      if (foundTenant) {
        STORE_DATA.name = foundTenant.name || STORE_DATA.name;
        STORE_DATA.whatsapp = foundTenant.owner_phone || STORE_DATA.whatsapp;
        STORE_DATA.address = foundTenant.city || STORE_DATA.address;
        STORE_DATA.pixName = foundTenant.owner_name || STORE_DATA.pixName;
        STORE_DATA.pixKey = foundTenant.owner_phone || STORE_DATA.pixKey;
        if (foundTenant.trial_ends_at) STORE_DATA.trialEndsAt = foundTenant.trial_ends_at;
      }
    }

    if (CURRENT_STORE_SLUG === 'demo-burger') {
      STORE_DATA.name = STORE_DATA.name || "Rei do Burger & Smash 🍔";
      STORE_DATA.whatsapp = STORE_DATA.whatsapp || "11999999999";
      STORE_DATA.address = STORE_DATA.address || "São Paulo - SP";
      STORE_DATA.pixKey = STORE_DATA.pixKey || "11999999999";
      STORE_DATA.pixName = STORE_DATA.pixName || "Rei do Burger";
    }

    // 2. Carregar dados específicos da loja
    const savedConfig = localStorage.getItem(getStoreKey('CONFIG'));
    if (savedConfig) STORE_DATA = { ...STORE_DATA, ...JSON.parse(savedConfig) };

    const savedCats = localStorage.getItem(getStoreKey('CATEGORIES'));
    if (savedCats && JSON.parse(savedCats).length > 0) {
      CATEGORIES = JSON.parse(savedCats);
    } else {
      CATEGORIES = [
        { id: "cat-combos", name: "COMBO", icon: "🔥", desc: "Combos especiais com hambúrguer, batata e refrigerante", visible: true },
        { id: "cat-burgers", name: "HAMBÚRGUERES ARTESANAIS", icon: "🍔", desc: "Smash burgers e artesanais preparados na hora", visible: true },
        { id: "cat-porcoes", name: "PORÇÕES & ENTRADAS", icon: "🍟", desc: "Batatas rústicas, anéis de cebola e petiscos crocantes", visible: true },
        { id: "cat-bebidas", name: "BEBIDAS & REFRIGERANTES", icon: "🥤", desc: "Sucos, refrigerantes em lata e cervejas", visible: true },
        { id: "cat-sobremesas", name: "SOBREMESAS", icon: "🍨", desc: "Milkshakes e brownies especiais", visible: true }
      ];
      saveCategories();
    }

    const savedProds = localStorage.getItem(getStoreKey('PRODUCTS'));
    if (savedProds && JSON.parse(savedProds).length > 0) {
      PRODUCTS = JSON.parse(savedProds);
    } else {
      // Se estiver vazio, popula automaticamente os 15 itens
      PRODUCTS = getSampleMenuData();
      saveProducts();
    }

    const savedOrders = localStorage.getItem(getStoreKey('ORDERS'));
    if (savedOrders) ORDERS = JSON.parse(savedOrders);
  } catch (e) {}
}


function saveStoreConfig() {
  try {
    localStorage.setItem(getStoreKey('CONFIG'), JSON.stringify(STORE_DATA));
  } catch (e) {}
}

function saveProducts() {
  try {
    localStorage.setItem(getStoreKey('PRODUCTS'), JSON.stringify(PRODUCTS));
  } catch (e) {
    console.warn("Storage warning:", e);
    // Se o storage estiver quase cheio, salva versão compactada
    try {
      const lightweight = PRODUCTS.map(p => ({
        ...p,
        image: (p.image && p.image.length > 250000) ? '' : p.image
      }));
      localStorage.setItem(getStoreKey('PRODUCTS'), JSON.stringify(lightweight));
    } catch (err) {}
  }
}

function saveCategories() {
  try {
    localStorage.setItem(getStoreKey('CATEGORIES'), JSON.stringify(CATEGORIES));
  } catch (e) {}
}

function saveOrders() {
  try {
    localStorage.setItem(getStoreKey('ORDERS'), JSON.stringify(ORDERS));
  } catch (e) {}
}

// -------------------------------------------------------------------------
// TOPBAR & HEADER
// -------------------------------------------------------------------------
function renderStoreTopbar() {
  const nameEl = document.getElementById('topbar-store-name');
  const dashNameEl = document.getElementById('dash-store-name');
  const slugEl = document.getElementById('topbar-store-slug');
  const shareLinkInput = document.getElementById('share-link-input');
  const viewMenuBtn = document.getElementById('topbar-view-menu-btn');
  const custMenuBtn = document.getElementById('btn-view-customer-menu');
  const prodsCountEl = document.getElementById('dash-products-count');

  const domain = (window.location.hostname || 'pedidovale.com.br').replace(/^www\./, '');
  const cleanLink = `${domain}/${STORE_DATA.slug}`;
  const directMenuUrl = `${window.location.origin}/index-sj.html?store=${STORE_DATA.slug}`;

  if (nameEl) nameEl.innerText = (STORE_DATA.name || "MEU ESTABELECIMENTO").toUpperCase();
  if (dashNameEl) dashNameEl.innerText = (STORE_DATA.name || "MEU ESTABELECIMENTO").toUpperCase();
  if (slugEl) slugEl.innerText = cleanLink;
  if (shareLinkInput) shareLinkInput.innerText = cleanLink;
  if (viewMenuBtn) viewMenuBtn.href = directMenuUrl;
  if (custMenuBtn) custMenuBtn.href = directMenuUrl;
  if (prodsCountEl) prodsCountEl.innerText = `${PRODUCTS.length} ${PRODUCTS.length === 1 ? 'Produto cadastrado' : 'Produtos cadastrados'}`;

  // Atualiza sidebar footer com info da loja
  const sideNameEl = document.getElementById('sidebar-store-name');
  const sideLinkEl = document.getElementById('sidebar-store-link');
  if (sideNameEl) sideNameEl.textContent = STORE_DATA.name || 'Minha Loja';
  if (sideLinkEl) sideLinkEl.textContent = cleanLink;

  updateSwitchOrdersButton();
}


function renderTrialInfo() {
  const trialDaysEl = document.getElementById('trial-days-left');
  if (!trialDaysEl) return;

  if (STORE_DATA.trialEndsAt) {
    const end = new Date(STORE_DATA.trialEndsAt);
    const now = new Date();
    const diffDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    trialDaysEl.innerText = `${diffDays} ${diffDays === 1 ? 'dia restante' : 'dias restantes'}`;
  }
}

function updateSwitchOrdersButton() {
  const btn = document.getElementById('switch-orders-btn');
  if (!btn) return;

  if (STORE_DATA.isOpen) {
    btn.className = "px-3.5 py-1 rounded-full text-xs font-bold transition-all bg-emerald-500 text-white shadow-lg";
    btn.innerText = "Sim";
  } else {
    btn.className = "px-3.5 py-1 rounded-full text-xs font-bold transition-all bg-rose-500 text-white shadow-lg";
    btn.innerText = "Não";
  }
}

function toggleStoreOpenStatus() {
  STORE_DATA.isOpen = !STORE_DATA.isOpen;
  saveStoreConfig();
  updateSwitchOrdersButton();
  showToast(STORE_DATA.isOpen ? "🟢 Loja aberta para receber pedidos!" : "🔴 Loja pausada (não aceita pedidos).");
}

function copyStoreMenuLink() {
  const domain = (window.location.hostname || 'pedidovale.com.br').replace(/^www\./, '');
  const cleanUrl = `https://${domain}/${STORE_DATA.slug}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(cleanUrl).then(() => {
      showToast("🔗 Link oficial copiado: " + cleanUrl);
    });
  } else {
    showToast(`Link: ${cleanUrl}`);
  }
}

function shareOnWhatsApp() {
  const domain = (window.location.hostname || 'pedidovale.com.br').replace(/^www\./, '');
  const cleanUrl = `https://${domain}/${STORE_DATA.slug}`;
  const storeName = STORE_DATA.name || 'nosso cardápio';
  const text = encodeURIComponent(`Olá! Acesse o cardápio oficial de *${storeName.toUpperCase()}* e faça seu pedido online:\n👉 ${cleanUrl}`);
  window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
}

// -------------------------------------------------------------------------
// GERENCIADOR DE CARDÁPIO EM ACORDEÃO (IMAGEM 1 & 2 DE REFERÊNCIA)
// -------------------------------------------------------------------------
function renderCategorySelects() {
  const modalSelect = document.getElementById('prod-category');
  if (modalSelect) {
    modalSelect.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.icon || '📁'} ${c.name}</option>`).join('');
  }
}

function renderCategoryAccordionList() {
  const container = document.getElementById('category-accordion-container');
  if (!container) return;

  const search = (document.getElementById('menu-quick-search')?.value || '').toLowerCase();

  if (CATEGORIES.length === 0) {
    container.innerHTML = `
      <div class="p-12 text-center bg-[#120D0A]/95 border border-brand-darkBorder rounded-3xl text-brand-textMuted text-xs space-y-3">
        <div class="w-12 h-12 rounded-2xl bg-white/5 mx-auto flex items-center justify-center text-2xl">📁</div>
        <h3 class="font-bold text-sm text-stone-200">Cardápio vazio</h3>
        <p>Comece criando categorias para organizar seus produtos.</p>
        <button onclick="openCreateCategoryModal()" class="px-5 py-2.5 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs shadow-orange-glow active:scale-95 transition-all">
          + Criar primeira categoria
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = CATEGORIES.map(cat => {
    const prods = PRODUCTS.filter(p => p.category_id === cat.id);
    const filteredProds = search 
      ? prods.filter(p => p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search)))
      : prods;

    const isVisible = cat.visible !== false;

    return `
      <!-- CARD DE CATEGORIA / ACORDEÃO -->
      <div class="bg-[#120D0A]/95 border border-brand-darkBorder rounded-3xl overflow-hidden shadow-card-dark transition-all">
        
        <!-- CABEÇALHO DA CATEGORIA (REFERÊNCIA IMAGEM 1) -->
        <div class="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-black/40 border-b border-brand-darkBorder/60">
          
          <div class="flex items-center gap-3">
            <span class="text-xl">${cat.icon || '📁'}</span>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-bold text-sm sm:text-base text-white tracking-wide">${cat.name.toUpperCase()}</h3>
                <span class="px-2 py-0.5 rounded-full bg-white/10 text-stone-300 text-[10px] font-bold">
                  ${prods.length} ${prods.length === 1 ? 'item' : 'itens'}
                </span>
              </div>
              ${cat.desc ? `<p class="text-xs text-brand-textMuted mt-0.5 line-clamp-1">${cat.desc}</p>` : ''}
            </div>
          </div>

          <!-- AÇÕES DA CATEGORIA -->
          <div class="flex items-center gap-2 self-end sm:self-center">
            <!-- Switch Visibilidade -->
            <label class="flex items-center gap-1.5 cursor-pointer text-[11px] text-stone-400 font-medium mr-2" title="Visível no cardápio público">
              <input type="checkbox" onchange="toggleCategoryVisibility('${cat.id}')" ${isVisible ? 'checked' : ''} class="w-4 h-4 rounded accent-brand-orange cursor-pointer" />
              <span class="${isVisible ? 'text-emerald-400 font-bold' : 'text-stone-500'}">${isVisible ? 'Visível' : 'Oculta'}</span>
            </label>

            <button onclick="openEditCategoryModal('${cat.id}')" class="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white border border-white/10 text-xs transition-colors" title="Editar Categoria">
              ✏️
            </button>
            <button onclick="deleteCategory('${cat.id}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors" title="Excluir Categoria">
              🗑️
            </button>
          </div>
        </div>

        <!-- CONTEÚDO / LISTA DE PRODUTOS DENTRO DA CATEGORIA -->
        <div class="p-4 sm:p-5 space-y-3">
          
          ${filteredProds.length === 0 ? `
            <div class="p-6 text-center text-brand-textMuted text-xs font-medium">
              Nenhum produto nesta categoria.
            </div>
          ` : `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              ${filteredProds.map(prod => renderProductCard(prod)).join('')}
            </div>
          `}

          <!-- BOTÃO ADICIONAR PRODUTO NA CATEGORIA (REFERÊNCIA IMAGEM 1) -->
          <button onclick="openCreateProductModal('${cat.id}')" class="w-full py-3 rounded-2xl bg-emerald-600/15 hover:bg-emerald-600/25 border border-emerald-500/30 text-emerald-400 hover:text-emerald-300 font-bold text-xs flex items-center justify-center gap-2 transition-all mt-2">
            <span>+</span>
            <span>Adicionar produto</span>
          </button>
        </div>

      </div>
    `;
  }).join('');
}

function renderProductCard(p) {
  const isPaused = p.status === 'paused';

  // Badges
  let badgesHtml = '';
  if (p.featured) badgesHtml += '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">⭐ Destaque</span> ';
  if (p.popular) badgesHtml += '<span class="px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange text-[9px] font-bold">🔥 Popular</span> ';
  if (p.is_new) badgesHtml += '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">✨ Novo</span> ';

  // Imagem
  const imageHtml = p.image 
    ? `<img src="${p.image}" alt="${p.name}" class="w-16 h-16 rounded-xl object-cover border border-white/10 shrink-0 bg-black/40" />`
    : `<div class="w-16 h-16 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl shrink-0">🍽️</div>`;

  return `
    <div class="bg-black/50 border ${isPaused ? 'border-white/5 opacity-60' : 'border-white/10 hover:border-brand-orange/40'} rounded-2xl p-3.5 flex items-start justify-between gap-3 transition-all">
      <div class="flex items-start gap-3 flex-1">
        ${imageHtml}
        <div class="space-y-0.5 flex-1">
          <div class="flex items-center gap-1.5 flex-wrap">
            <h4 class="font-bold text-xs text-white leading-tight">${p.name}</h4>
            ${badgesHtml}
          </div>
          <p class="text-[11px] text-brand-textMuted line-clamp-1">${p.description || 'Sem descrição.'}</p>
          <div class="flex items-baseline gap-1.5 pt-0.5">
            <span class="font-bold text-xs text-amber-400">${formatCurrency(p.promo_price || p.price)}</span>
            ${p.promo_price ? `<span class="text-[10px] text-stone-500 line-through">${formatCurrency(p.price)}</span>` : ''}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-1 shrink-0">
        <button onclick="toggleProductStatus('${p.id}')" class="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] text-stone-300" title="${isPaused ? 'Ativar' : 'Pausar'}">
          ${isPaused ? '▶️' : '⏸️'}
        </button>
        <button onclick="openEditProductModal('${p.id}')" class="p-1.5 rounded-lg bg-brand-orange/20 hover:bg-brand-orange text-brand-orange hover:text-white text-[11px] font-bold" title="Editar">
          ✏️
        </button>
        <button onclick="deleteProduct('${p.id}')" class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px]" title="Excluir">
          🗑️
        </button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------------------
// MODAL CATEGORIA (IMAGEM 2 REFERÊNCIA)
// -------------------------------------------------------------------------
function openCreateCategoryModal() {
  currentEditingCategoryId = null;
  document.getElementById('modal-category-title').innerText = "Nova Categoria";
  document.getElementById('form-category').reset();
  document.getElementById('cat-visible-switch').checked = true;
  document.getElementById('category-modal').classList.remove('hidden');
}

function openEditCategoryModal(id) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return;

  currentEditingCategoryId = id;
  document.getElementById('modal-category-title').innerText = "Editar Categoria";
  document.getElementById('cat-name').value = cat.name || '';
  document.getElementById('cat-icon').value = cat.icon || '';
  document.getElementById('cat-desc').value = cat.desc || '';
  document.getElementById('cat-visible-switch').checked = cat.visible !== false;
  document.getElementById('category-modal').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.add('hidden');
}

function saveCategoryForm(e) {
  e.preventDefault();

  const name = document.getElementById('cat-name').value.trim();
  const icon = document.getElementById('cat-icon').value.trim() || '📁';
  const desc = document.getElementById('cat-desc').value.trim();
  const visible = document.getElementById('cat-visible-switch').checked;

  if (currentEditingCategoryId) {
    const idx = CATEGORIES.findIndex(c => c.id === currentEditingCategoryId);
    if (idx !== -1) {
      CATEGORIES[idx] = { ...CATEGORIES[idx], name, icon, desc, visible };
      showToast(`✅ Categoria "${name}" atualizada!`);
    }
  } else {
    const newCat = {
      id: `cat-${Date.now()}`,
      name,
      icon,
      desc,
      visible
    };
    CATEGORIES.push(newCat);
    showToast(`📂 Categoria "${name}" criada com sucesso!`);
  }

  saveCategories();
  renderCategorySelects();
  renderCategoryAccordionList();
  closeCategoryModal();
}

function toggleCategoryVisibility(id) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return;

  cat.visible = cat.visible === false ? true : false;
  saveCategories();
  renderCategoryAccordionList();
  showToast(cat.visible ? `🟢 Categoria "${cat.name}" visível no cardápio.` : `⏸️ Categoria "${cat.name}" oculta.`);
}

function deleteCategory(id) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return;

  if (confirm(`Deseja excluir a categoria "${cat.name}"?`)) {
    CATEGORIES = CATEGORIES.filter(c => c.id !== id);
    saveCategories();
    renderCategorySelects();
    renderCategoryAccordionList();
    showToast("🗑️ Categoria removida.");
  }
}

// -------------------------------------------------------------------------
// MODAL / TELA PRODUTO (IMAGENS 3, 4 & 5 REFERÊNCIA)
// -------------------------------------------------------------------------
function openCreateProductModal(defaultCategoryId = '') {
  currentEditingProductId = null;
  currentUploadedProductImage = '';
  showImagePreview('');

  document.getElementById('modal-product-title').innerText = "Novo Produto";
  document.getElementById('form-product').reset();
  document.getElementById('product-extras-container').innerHTML = '';
  document.getElementById('prod-available-switch').checked = true;
  document.getElementById('btn-delete-current-product').classList.add('hidden');

  if (defaultCategoryId) {
    document.getElementById('prod-category').value = defaultCategoryId;
  }

  document.getElementById('product-modal').classList.remove('hidden');
}

function openEditProductModal(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return;

  currentEditingProductId = id;
  currentUploadedProductImage = prod.image || '';
  showImagePreview(currentUploadedProductImage);

  document.getElementById('modal-product-title').innerText = `Editar: ${prod.name}`;
  document.getElementById('prod-name').value = prod.name || '';
  document.getElementById('prod-desc').value = prod.description || '';
  document.getElementById('prod-category').value = prod.category_id || (CATEGORIES[0]?.id || '');
  document.getElementById('prod-price').value = prod.price || '';
  document.getElementById('prod-promo-price').value = prod.promo_price || '';
  document.getElementById('prod-image-url').value = prod.image && prod.image.startsWith('http') ? prod.image : '';

  document.getElementById('prod-available-switch').checked = prod.status !== 'paused';
  document.getElementById('prod-featured-switch').checked = !!prod.featured;
  document.getElementById('prod-new-switch').checked = !!prod.is_new;
  document.getElementById('prod-popular-switch').checked = !!prod.popular;

  // Carregar Extras
  const extrasContainer = document.getElementById('product-extras-container');
  extrasContainer.innerHTML = '';
  if (prod.extras && prod.extras.length > 0) {
    prod.extras.forEach(extra => addProductExtraRow(extra.name, extra.price));
  }

  document.getElementById('btn-delete-current-product').classList.remove('hidden');
  document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

function deleteCurrentEditingProduct() {
  if (currentEditingProductId) {
    deleteProduct(currentEditingProductId);
    closeProductModal();
  }
}

function handleProductImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      // Redimensionar e comprimir imagem para manter o localStorage super leve (< 40KB)
      const maxDim = 500;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > maxDim) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        }
      } else {
        if (height > maxDim) {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      currentUploadedProductImage = canvas.toDataURL('image/jpeg', 0.75);
      showImagePreview(currentUploadedProductImage);
      const urlInput = document.getElementById('prod-image-url');
      if (urlInput) urlInput.value = '';
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function handleProductImageUrl(url) {
  if (url) {
    currentUploadedProductImage = url.trim();
    showImagePreview(currentUploadedProductImage);
  }
}

function showImagePreview(src) {
  const imgEl = document.getElementById('prod-image-preview');
  const placeholder = document.getElementById('image-upload-placeholder');
  const badgeEl = document.getElementById('badge-principal-photo');

  if (imgEl && placeholder) {
    if (src) {
      imgEl.src = src;
      imgEl.classList.remove('hidden');
      placeholder.classList.add('hidden');
      if (badgeEl) badgeEl.classList.remove('hidden');
    } else {
      imgEl.src = '';
      imgEl.classList.add('hidden');
      placeholder.classList.remove('hidden');
      if (badgeEl) badgeEl.classList.add('hidden');
    }
  }
}

function addProductExtraRow(name = '', price = '') {
  const container = document.getElementById('product-extras-container');
  const div = document.createElement('div');
  div.className = "flex items-center gap-2 extra-row";
  div.innerHTML = `
    <input type="text" placeholder="Nome do Opcional (ex: Bacon Extra)" value="${name}" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white extra-name" />
    <input type="number" step="0.5" placeholder="Preço (R$)" value="${price}" class="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold extra-price" />
    <button type="button" onclick="this.parentElement.remove()" class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs">✕</button>
  `;
  container.appendChild(div);
}

function saveProductForm(e) {
  if (e && e.preventDefault) e.preventDefault();

  const nameInput = document.getElementById('prod-name');
  const priceInput = document.getElementById('prod-price');
  const catSelect = document.getElementById('prod-category');

  const name = nameInput ? nameInput.value.trim() : '';
  const priceVal = priceInput ? priceInput.value.trim() : '';
  const price = parseFloat(priceVal);

  // Limpar estilos de erro anteriores
  if (nameInput) nameInput.classList.remove('border-rose-500', 'bg-rose-500/10');
  if (priceInput) priceInput.classList.remove('border-rose-500', 'bg-rose-500/10');

  // Validação explícita com foco e scroll automático
  if (!name) {
    showToast("⚠️ Por favor, informe o Nome do produto!");
    if (nameInput) {
      nameInput.classList.add('border-rose-500', 'bg-rose-500/10');
      nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInput.focus();
    }
    return;
  }

  if (isNaN(price) || price < 0 || priceVal === '') {
    showToast("⚠️ Por favor, informe o Preço do produto!");
    if (priceInput) {
      priceInput.classList.add('border-rose-500', 'bg-rose-500/10');
      priceInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      priceInput.focus();
    }
    return;
  }

  let category_id = catSelect ? catSelect.value : '';
  if (!category_id && CATEGORIES.length > 0) {
    category_id = CATEGORIES[0].id;
  } else if (!category_id) {
    const defaultCat = { id: `cat-${Date.now()}`, name: "COMBO", icon: "🔥", desc: "Combos e ofertas especiais", visible: true };
    CATEGORIES.push(defaultCat);
    saveCategories();
    renderCategorySelects();
    category_id = defaultCat.id;
  }

  const promo_price_val = document.getElementById('prod-promo-price')?.value;
  const promo_price = promo_price_val ? parseFloat(promo_price_val) : null;
  const description = document.getElementById('prod-desc')?.value.trim() || '';
  
  const isAvailable = document.getElementById('prod-available-switch')?.checked ?? true;
  const status = isAvailable ? 'active' : 'paused';
  const featured = document.getElementById('prod-featured-switch')?.checked ?? false;
  const is_new = document.getElementById('prod-new-switch')?.checked ?? false;
  const popular = document.getElementById('prod-popular-switch')?.checked ?? false;

  // Extrair opcionais
  const extraRows = document.querySelectorAll('#product-extras-container .extra-row');
  const extras = [];
  extraRows.forEach(row => {
    const extraName = row.querySelector('.extra-name')?.value.trim();
    const extraPrice = parseFloat(row.querySelector('.extra-price')?.value) || 0;
    if (extraName) extras.push({ name: extraName, price: extraPrice });
  });

  if (currentEditingProductId) {
    const idx = PRODUCTS.findIndex(p => p.id === currentEditingProductId);
    if (idx !== -1) {
      PRODUCTS[idx] = {
        ...PRODUCTS[idx],
        name,
        category_id,
        price,
        promo_price,
        description,
        image: currentUploadedProductImage || PRODUCTS[idx].image || '',
        status,
        featured,
        is_new,
        popular,
        extras
      };
      showToast(`✅ Produto "${name}" atualizado com sucesso!`);
    }
  } else {
    const newProd = {
      id: `prod-${Date.now()}`,
      name,
      category_id,
      price,
      promo_price,
      description,
      image: currentUploadedProductImage || '',
      status,
      featured,
      is_new,
      popular,
      extras
    };
    PRODUCTS.push(newProd);
    showToast(`🚀 Produto "${name}" cadastrado com sucesso!`);
  }

  saveProducts();
  closeProductModal();
  renderCategoryAccordionList();
  renderStoreTopbar();
}

function toggleProductStatus(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return;

  prod.status = prod.status === 'paused' ? 'active' : 'paused';
  saveProducts();
  renderCategoryAccordionList();
  showToast(prod.status === 'paused' ? `⏸️ "${prod.name}" pausado no cardápio.` : `🟢 "${prod.name}" ativado.`);
}

function deleteProduct(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return;

  if (confirm(`Excluir permanentemente "${prod.name}"?`)) {
    PRODUCTS = PRODUCTS.filter(p => p.id !== id);
    saveProducts();
    renderCategoryAccordionList();
    renderStoreTopbar();
    showToast("🗑️ Produto excluído.");
  }
}

// Carregar Cardápio Exemplo
function importSampleMenu() {
  if (confirm("Carregar produtos de demonstração para testar seu cardápio?")) {
    PRODUCTS = [
      {
        id: "prod-sample-1",
        name: "Combo Burguer Monster + Batata + Refri",
        category_id: "cat-combos",
        price: 44.90,
        promo_price: 39.90,
        description: "1x Smash Monster duplo com cheddar e bacon, 1x batata frita crocante individual e 1x Coca-Cola lata.",
        status: "active",
        featured: true,
        is_new: false,
        popular: true,
        image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80",
        extras: [{ name: "Maionese Especial Extra", price: 4.00 }]
      },
      {
        id: "prod-sample-2",
        name: "X-Bacon Especial Artesanal",
        category_id: "cat-burgers",
        price: 32.00,
        promo_price: null,
        description: "Pão brioche, 2x smash burger 90g, muito queijo cheddar derretido e tiras crocantes de bacon.",
        status: "active",
        featured: false,
        is_new: true,
        popular: true,
        image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80",
        extras: [{ name: "Queijo Dobrado", price: 5.00 }]
      },
      {
        id: "prod-sample-3",
        name: "Coca-Cola Original 350ml",
        category_id: "cat-bebidas",
        price: 6.50,
        promo_price: null,
        description: "Lata 350ml gelada.",
        status: "active",
        featured: false,
        is_new: false,
        popular: false,
        image: "https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80",
        extras: []
      }
    ];

    saveProducts();
    renderCategoryAccordionList();
    renderStoreTopbar();
    showToast("📥 Cardápio de exemplo importado!");
  }
}

function openOptionalsModal() {
  showToast("⚙️ Opcionais vinculados diretamente em cada produto.");
}

function openFlavorsModal() {
  showToast("🍨 Sabores configuráveis no modal de edição do produto.");
}

// -------------------------------------------------------------------------
// GESTOR DE PEDIDOS AO VIVO (KANBAN)
// -------------------------------------------------------------------------
function renderOrdersKanban() {
  const colNew = document.getElementById('orders-column-new');
  const colPrep = document.getElementById('orders-column-prep');
  const colDelivery = document.getElementById('orders-column-delivery');
  const badgeCount = document.getElementById('badge-orders-count');

  if (!colNew || !colPrep || !colDelivery) return;

  const newOrders = ORDERS.filter(o => o.status === 'new');
  const prepOrders = ORDERS.filter(o => o.status === 'prep');
  const deliveryOrders = ORDERS.filter(o => o.status === 'delivery' || o.status === 'done');

  document.getElementById('count-new-orders').innerText = newOrders.length;
  document.getElementById('count-prep-orders').innerText = prepOrders.length;
  document.getElementById('count-delivery-orders').innerText = deliveryOrders.length;
  if (badgeCount) badgeCount.innerText = newOrders.length;

  colNew.innerHTML = newOrders.map(o => renderOrderCard(o, 'prep', 'Aceitar & Preparar ➔')).join('') || '<div class="text-xs text-stone-500 p-6 text-center">Nenhum pedido novo no momento.</div>';
  colPrep.innerHTML = prepOrders.map(o => renderOrderCard(o, 'delivery', 'Despachar Entrega 🛵')).join('') || '<div class="text-xs text-stone-500 p-6 text-center">Nenhum pedido na cozinha.</div>';
  colDelivery.innerHTML = deliveryOrders.map(o => renderOrderCard(o, 'done', 'Finalizar Pedido ✅')).join('') || '<div class="text-xs text-stone-500 p-6 text-center">Nenhum pedido em rota.</div>';
}

function renderOrderCard(o, nextStatus, nextLabel) {
  return `
    <div class="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
      <div class="flex items-center justify-between pb-2 border-b border-white/5">
        <span class="font-bold text-sm text-brand-orange">${o.id}</span>
        <span class="text-[10px] text-stone-400 font-medium">${o.time}</span>
      </div>

      <div>
        <div class="font-bold text-white text-xs">${o.customer_name}</div>
        <div class="text-xs text-stone-300">${o.items}</div>
        <div class="text-[11px] text-stone-400 mt-1">📍 ${o.address}</div>
      </div>

      <div class="flex items-center justify-between pt-1 text-xs">
        <span class="font-bold text-amber-400">${formatCurrency(o.total)}</span>
        <span class="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] text-stone-300">${o.payment_method}</span>
      </div>

      <div class="flex items-center gap-1.5 pt-1">
        <a href="https://wa.me/${cleanPhone(o.customer_phone)}" target="_blank" class="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs" title="Conversar no WhatsApp">
          💬
        </a>
        <button onclick="advanceOrderStatus('${o.id}', '${nextStatus}')" class="flex-1 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-xs tracking-wide transition-all">
          ${nextLabel}
        </button>
      </div>
    </div>
  `;
}

function advanceOrderStatus(orderId, newStatus) {
  const order = ORDERS.find(o => o.id === orderId);
  if (!order) return;

  if (newStatus === 'done') {
    ORDERS = ORDERS.filter(o => o.id !== orderId);
    showToast(`✅ Pedido ${order.id} concluído!`);
  } else {
    order.status = newStatus;
    showToast(`🔄 Pedido ${order.id} avançado para a próxima etapa!`);
  }

  saveOrders();
  renderOrdersKanban();
}

function clearCompletedOrders() {
  ORDERS = ORDERS.filter(o => o.status !== 'done');
  saveOrders();
  renderOrdersKanban();
  showToast("Pedidos concluídos limpos.");
}

// -------------------------------------------------------------------------
// CONFIGURAÇÕES GERAIS / ENTREGA / PAGAMENTOS
// -------------------------------------------------------------------------
function populateSettingsInputs() {
  // Entrega
  const feeEl = document.getElementById('setting-delivery-fee');
  const timeEl = document.getElementById('setting-delivery-time');
  const minOrderEl = document.getElementById('setting-min-order');
  const pickupEl = document.getElementById('setting-allow-pickup');

  if (feeEl) feeEl.value = STORE_DATA.deliveryFee || 5.00;
  if (timeEl) timeEl.value = STORE_DATA.deliveryTime || '30 - 45 min';
  if (minOrderEl) minOrderEl.value = STORE_DATA.minOrder || 0;
  if (pickupEl) pickupEl.value = String(STORE_DATA.allowPickup);

  // Pagamento
  const pixKeyEl = document.getElementById('store-pix-key');
  const pixTypeEl = document.getElementById('store-pix-type');
  const pixNameEl = document.getElementById('store-pix-name');

  if (pixKeyEl) pixKeyEl.value = STORE_DATA.pixKey || '';
  if (pixTypeEl) pixTypeEl.value = STORE_DATA.pixType || 'phone';
  if (pixNameEl) pixNameEl.value = STORE_DATA.pixName || '';

  // Dados Gerais
  const storeNameEl = document.getElementById('store-name-input');
  const storeTaglineEl = document.getElementById('store-tagline-input');
  const storeZapEl = document.getElementById('store-whatsapp-input');
  const storeAddrEl = document.getElementById('store-address-input');
  const storeHoursEl = document.getElementById('store-hours-input');
  const logoPreview = document.getElementById('store-logo-preview');
  const logoPlaceholder = document.getElementById('store-logo-placeholder');
  const btnRemoveLogo = document.getElementById('btn-remove-logo');

  if (storeNameEl) storeNameEl.value = STORE_DATA.name || '';
  if (storeTaglineEl) storeTaglineEl.value = STORE_DATA.tagline || '';
  if (storeZapEl) storeZapEl.value = STORE_DATA.whatsapp || '';
  if (storeAddrEl) storeAddrEl.value = STORE_DATA.address || '';
  if (storeHoursEl) storeHoursEl.value = STORE_DATA.hours || '';

  if (STORE_DATA.logo) {
    if (logoPreview) {
      logoPreview.src = STORE_DATA.logo;
      logoPreview.classList.remove('hidden');
    }
    if (logoPlaceholder) logoPlaceholder.classList.add('hidden');
    if (btnRemoveLogo) btnRemoveLogo.classList.remove('hidden');
  } else {
    if (logoPreview) {
      logoPreview.src = '';
      logoPreview.classList.add('hidden');
    }
    if (logoPlaceholder) logoPlaceholder.classList.remove('hidden');
    if (btnRemoveLogo) btnRemoveLogo.classList.add('hidden');
  }
}

function handleStoreLogoUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_SIZE = 350;
      let width = img.width;
      let height = img.height;

      if (width > height) {
        if (width > MAX_SIZE) {
          height = Math.round((height * MAX_SIZE) / width);
          width = MAX_SIZE;
        }
      } else {
        if (height > MAX_SIZE) {
          width = Math.round((width * MAX_SIZE) / height);
          height = MAX_SIZE;
        }
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      STORE_DATA.logo = compressedDataUrl;

      const preview = document.getElementById('store-logo-preview');
      const placeholder = document.getElementById('store-logo-placeholder');
      const btnRemove = document.getElementById('btn-remove-logo');

      if (preview) {
        preview.src = compressedDataUrl;
        preview.classList.remove('hidden');
      }
      if (placeholder) placeholder.classList.add('hidden');
      if (btnRemove) btnRemove.classList.remove('hidden');

      showToast("🖼️ Logomarca carregada com sucesso!");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeStoreLogo() {
  STORE_DATA.logo = "";
  const preview = document.getElementById('store-logo-preview');
  const placeholder = document.getElementById('store-logo-placeholder');
  const btnRemove = document.getElementById('btn-remove-logo');
  const fileInput = document.getElementById('store-logo-file-input');

  if (preview) {
    preview.src = "";
    preview.classList.add('hidden');
  }
  if (placeholder) placeholder.classList.remove('hidden');
  if (btnRemove) btnRemove.classList.add('hidden');
  if (fileInput) fileInput.value = "";

  showToast("🗑️ Logomarca removida.");
}

function saveDeliverySettingsForm(e) {
  e.preventDefault();
  STORE_DATA.deliveryFee = parseFloat(document.getElementById('setting-delivery-fee').value) || 0;
  STORE_DATA.deliveryTime = document.getElementById('setting-delivery-time').value.trim();
  STORE_DATA.minOrder = parseFloat(document.getElementById('setting-min-order').value) || 0;
  STORE_DATA.allowPickup = document.getElementById('setting-allow-pickup').value === 'true';

  saveStoreConfig();
  showToast("🛵 Configurações de entrega salvas com sucesso!");
}

function savePaymentSettingsForm(e) {
  e.preventDefault();
  STORE_DATA.pixKey = document.getElementById('store-pix-key').value.trim();
  STORE_DATA.pixType = document.getElementById('store-pix-type').value;
  STORE_DATA.pixName = document.getElementById('store-pix-name').value.trim();
  STORE_DATA.acceptPix = document.getElementById('pay-accept-pix').checked;
  STORE_DATA.acceptCard = document.getElementById('pay-accept-card').checked;
  STORE_DATA.acceptCash = document.getElementById('pay-accept-cash').checked;

  saveStoreConfig();
  showToast("🔑 Dados de pagamento e chave PIX salvos com sucesso!");
}

function saveStoreGeneralSettingsForm(e) {
  e.preventDefault();
  STORE_DATA.name = document.getElementById('store-name-input').value.trim();
  const taglineEl = document.getElementById('store-tagline-input');
  if (taglineEl) STORE_DATA.tagline = taglineEl.value.trim();
  STORE_DATA.whatsapp = document.getElementById('store-whatsapp-input').value.trim();
  STORE_DATA.address = document.getElementById('store-address-input').value.trim();
  STORE_DATA.hours = document.getElementById('store-hours-input').value.trim();

  saveStoreConfig();

  // Sincronizar também no Super Admin Tenants se existir
  try {
    const SUPERADMIN_TENANTS_KEY = 'SUPERADMIN_TENANTS_DATA';
    const savedTenants = localStorage.getItem(SUPERADMIN_TENANTS_KEY);
    if (savedTenants) {
      const tenants = JSON.parse(savedTenants);
      const idx = tenants.findIndex(t => t.slug === STORE_DATA.slug);
      if (idx !== -1) {
        tenants[idx].name = STORE_DATA.name;
        tenants[idx].owner_phone = STORE_DATA.whatsapp;
        tenants[idx].city = STORE_DATA.address;
        localStorage.setItem(SUPERADMIN_TENANTS_KEY, JSON.stringify(tenants));
      }
    }
  } catch (err) {}

  renderStoreTopbar();
  showToast("⚙️ Dados e Logomarca do restaurante atualizados!");
}

function logoutStoreAdmin() {
  sessionStorage.removeItem('CURRENT_LOGGED_STORE');
  window.location.href = 'login.html';
}

// -------------------------------------------------------------------------
// MÓDULO 1: PDV BALCÃO EXPRESS (PONTO DE VENDA)
// -------------------------------------------------------------------------
let PDV_CART = [];
let PDV_ACTIVE_CAT = "all";

function renderPdvCategories() {
  const bar = document.getElementById('pdv-categories-bar');
  if (!bar) return;

  let html = `
    <button onclick="filterPdvCategory('all')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${PDV_ACTIVE_CAT === 'all' ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-stone-300 hover:bg-white/10'}">
      Todos
    </button>
  `;

  CATEGORIES.forEach(c => {
    const isAct = PDV_ACTIVE_CAT === c.id;
    html += `
      <button onclick="filterPdvCategory('${c.id}')" class="px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${isAct ? 'bg-amber-500 text-black shadow-md' : 'bg-white/5 text-stone-300 hover:bg-white/10'}">
        ${c.icon || '📁'} ${c.name}
      </button>
    `;
  });

  bar.innerHTML = html;
}

function filterPdvCategory(catId) {
  PDV_ACTIVE_CAT = catId;
  renderPdvCategories();
  renderPdvProducts();
}

function renderPdvProducts() {
  const grid = document.getElementById('pdv-products-grid');
  const searchInput = document.getElementById('pdv-search-input');
  if (!grid) return;

  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';

  let prods = PRODUCTS.filter(p => p.status !== 'paused');
  if (PDV_ACTIVE_CAT !== 'all') {
    prods = prods.filter(p => p.category_id === PDV_ACTIVE_CAT);
  }
  if (query) {
    prods = prods.filter(p => (p.name || '').toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query));
  }

  if (prods.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-stone-500">Nenhum produto encontrado.</div>`;
    return;
  }

  grid.innerHTML = prods.map(p => {
    const price = parseFloat(p.promo_price || p.price) || 0;
    return `
      <div onclick="addPdvItem('${p.id}')" class="bg-[#18120E] border border-white/10 hover:border-amber-500/50 rounded-2xl p-3 cursor-pointer group active:scale-95 transition-all shadow-md flex flex-col justify-between space-y-2">
        <div class="flex items-center gap-2.5">
          ${p.image ? `<img src="${p.image}" class="w-10 h-10 rounded-xl object-cover shrink-0" />` : `<div class="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-lg shrink-0">🍔</div>`}
          <div class="flex-1 min-w-0">
            <h4 class="font-bold text-xs text-white truncate group-hover:text-amber-400 transition-colors">${p.name}</h4>
            <span class="text-xs font-bold text-amber-400 block">${formatCurrency(price)}</span>
          </div>
        </div>
        <button class="w-full py-1 rounded-xl bg-white/5 group-hover:bg-amber-500 group-hover:text-black text-[10px] font-bold text-stone-300 transition-all flex items-center justify-center gap-1">
          <span>+ Adicionar</span>
        </button>
      </div>
    `;
  }).join('');
}

function addPdvItem(prodId) {
  const prod = PRODUCTS.find(p => p.id === prodId);
  if (!prod) return;

  const existing = PDV_CART.find(item => item.id === prodId);
  if (existing) {
    existing.qty += 1;
  } else {
    PDV_CART.push({
      id: prod.id,
      name: prod.name,
      price: parseFloat(prod.promo_price || prod.price) || 0,
      qty: 1
    });
  }

  renderPdvCart();
  showToast(`+1 ${prod.name} adicionado ao caixa`);
}

function updatePdvQty(prodId, delta) {
  const item = PDV_CART.find(i => i.id === prodId);
  if (!item) return;

  item.qty += delta;
  if (item.qty <= 0) {
    PDV_CART = PDV_CART.filter(i => i.id !== prodId);
  }

  renderPdvCart();
}

function renderPdvCart() {
  const container = document.getElementById('pdv-cart-items');
  const countEl = document.getElementById('pdv-items-count');
  const totalEl = document.getElementById('pdv-total-price');

  if (!container) return;

  const totalItems = PDV_CART.reduce((sum, i) => sum + i.qty, 0);
  const totalPrice = PDV_CART.reduce((sum, i) => sum + (i.price * i.qty), 0);

  if (countEl) countEl.innerText = `${totalItems} ${totalItems === 1 ? 'item' : 'itens'}`;
  if (totalEl) totalEl.innerText = formatCurrency(totalPrice);

  if (PDV_CART.length === 0) {
    container.innerHTML = `<div class="text-xs text-stone-500 py-8 text-center">Nenhum item selecionado. Clique nos produtos ao lado para lançar.</div>`;
    return;
  }

  container.innerHTML = PDV_CART.map(item => `
    <div class="bg-black/50 border border-white/5 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs">
      <div class="flex-1 min-w-0">
        <h5 class="font-bold text-white truncate">${item.name}</h5>
        <span class="text-[11px] text-amber-400 font-semibold">${formatCurrency(item.price * item.qty)}</span>
      </div>
      <div class="flex items-center gap-1.5 shrink-0">
        <button onclick="updatePdvQty('${item.id}', -1)" class="w-6 h-6 rounded-lg bg-white/10 hover:bg-white/20 text-white font-bold flex items-center justify-center">-</button>
        <span class="font-bold text-white px-1.5">${item.qty}</span>
        <button onclick="updatePdvQty('${item.id}', 1)" class="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-600 text-black font-bold flex items-center justify-center">+</button>
      </div>
    </div>
  `).join('');
}

function clearPdvCart() {
  PDV_CART = [];
  renderPdvCart();
  showToast("Comanda do caixa limpa.");
}

function submitPdvOrder() {
  if (PDV_CART.length === 0) {
    alert("Adicione pelo menos 1 item na comanda do caixa.");
    return;
  }

  const custName = (document.getElementById('pdv-customer-name').value || 'Cliente Balcão').trim();
  const orderType = document.getElementById('pdv-order-type').value;
  const payMethod = document.getElementById('pdv-payment-method').value;
  const totalPrice = PDV_CART.reduce((sum, i) => sum + (i.price * i.qty), 0);

  const itemsDesc = PDV_CART.map(i => `${i.qty}x ${i.name}`).join(', ');
  const orderId = `#B${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    id: orderId,
    customer_name: `${custName} (${orderType})`,
    customer_phone: STORE_DATA.whatsapp || '5599991040222',
    address: orderType === 'Entrega' ? 'A entregar' : 'Consumo / Retirada no Local',
    items: itemsDesc,
    total: totalPrice,
    payment_method: payMethod,
    status: 'prep',
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    created_at: Date.now()
  };

  ORDERS.unshift(newOrder);
  saveOrders();
  renderOrdersKanban();
  renderKdsOrders();
  clearPdvCart();
  document.getElementById('pdv-customer-name').value = '';

  showToast(`✅ Pedido ${orderId} lançado e enviado para a Cozinha KDS!`);
}

// -------------------------------------------------------------------------
// MÓDULO 2: MONITOR KDS DE COZINHA (TELA DE PRODUÇÃO)
// -------------------------------------------------------------------------
let KDS_SOUND_ACTIVE = true;

function toggleKdsSound() {
  KDS_SOUND_ACTIVE = !KDS_SOUND_ACTIVE;
  const btn = document.getElementById('kds-sound-btn');
  if (btn) {
    btn.innerHTML = `<span>${KDS_SOUND_ACTIVE ? '🔊' : '🔇'}</span><span>Som: ${KDS_SOUND_ACTIVE ? 'Ativo' : 'Mudo'}</span>`;
  }
  showToast(KDS_SOUND_ACTIVE ? "🔊 Alertas sonoros da cozinha ativados!" : "🔇 Alertas sonoros silenciados.");
}

function renderKdsOrders() {
  const grid = document.getElementById('kds-orders-grid');
  const countEl = document.getElementById('kds-pending-count');
  if (!grid) return;

  const kitchenOrders = ORDERS.filter(o => o.status === 'new' || o.status === 'prep');
  if (countEl) countEl.innerText = `${kitchenOrders.length} na fila`;

  if (kitchenOrders.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center space-y-2">
        <span class="text-4xl block">👨‍🍳</span>
        <h4 class="font-bold text-base text-white">Cozinha 100% em dia!</h4>
        <p class="text-xs text-stone-500">Nenhum pedido aguardando preparo no momento.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = kitchenOrders.map(o => {
    const isNew = o.status === 'new';
    const elapsedMinutes = Math.floor((Date.now() - (o.created_at || Date.now())) / 60000);
    const borderColor = isNew ? 'border-brand-orange/60' : 'border-amber-500/60';
    const badgeColor = isNew ? 'bg-brand-orange text-white' : 'bg-amber-500 text-black';

    return `
      <div class="bg-[#120D0A] border ${borderColor} rounded-3xl p-5 shadow-2xl flex flex-col justify-between space-y-4">
        <div class="space-y-3">
          <div class="flex items-center justify-between pb-2.5 border-b border-white/10">
            <div class="flex items-center gap-2">
              <span class="font-anton text-lg text-white">${o.id}</span>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${badgeColor}">
                ${isNew ? 'NOVO' : 'EM PREPARO'}
              </span>
            </div>
            <span class="text-xs text-amber-400 font-mono font-bold">⏱️ ${elapsedMinutes} min</span>
          </div>

          <div>
            <span class="text-xs text-stone-400 block font-medium">Cliente:</span>
            <h4 class="font-bold text-white text-sm leading-tight">${o.customer_name}</h4>
          </div>

          <div class="p-3 bg-black/60 border border-white/5 rounded-2xl space-y-1.5">
            <span class="text-[10px] font-bold text-stone-400 uppercase tracking-wider block">ITENS DO PEDIDO:</span>
            <p class="font-bold text-xs text-amber-200 leading-relaxed">${o.items}</p>
          </div>
        </div>

        <div class="pt-2">
          <button onclick="advanceOrderStatus('${o.id}', '${isNew ? 'prep' : 'delivery'}')" class="w-full py-3 rounded-2xl ${isNew ? 'bg-amber-500 hover:bg-amber-600 text-black' : 'bg-emerald-500 hover:bg-emerald-600 text-white'} font-anton tracking-wider text-xs shadow-lg active:scale-95 transition-all">
            ${isNew ? '👨‍🍳 INICIAR PREPARO' : '✅ PRONTO P/ DESPACHO 🛵'}
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------------------
// MÓDULO 3: CENTRAL DE CUPONS DE DESCONTO
// -------------------------------------------------------------------------
let COUPONS = [];

function loadCoupons() {
  try {
    const saved = localStorage.getItem(getStoreKey('COUPONS'));
    if (saved) {
      COUPONS = JSON.parse(saved);
    } else {
      COUPONS = [
        { code: "BEMVINDO10", type: "percent", value: 10, min_order: 20, active: true },
        { code: "FRETEGRATIS", type: "free_delivery", value: 0, min_order: 30, active: true }
      ];
      saveCoupons();
    }
  } catch (e) {}
}

function saveCoupons() {
  try {
    localStorage.setItem(getStoreKey('COUPONS'), JSON.stringify(COUPONS));
  } catch (e) {}
}

function renderCouponsList() {
  const container = document.getElementById('coupons-list-container');
  if (!container) return;

  if (COUPONS.length === 0) {
    container.innerHTML = `<div class="py-8 text-center text-xs text-stone-500">Nenhum cupom cadastrado. Clique em "+ Novo Cupom" para criar o primeiro.</div>`;
    return;
  }

  container.innerHTML = COUPONS.map(c => `
    <div class="bg-black/50 border border-white/10 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 flex items-center justify-center text-lg font-bold">
          🎁
        </div>
        <div>
          <div class="flex items-center gap-2">
            <span class="font-mono font-bold text-sm text-amber-400 uppercase">${c.code}</span>
            <span class="px-2 py-0.5 rounded-md text-[10px] font-bold ${c.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-stone-500/20 text-stone-400'}">
              ${c.active ? 'ATIVO' : 'PAUSADO'}
            </span>
          </div>
          <p class="text-xs text-stone-300 mt-0.5">
            ${c.type === 'percent' ? `${c.value}% de desconto` : c.type === 'free_delivery' ? 'Frete Grátis na entrega' : `R$ ${c.value.toFixed(2)} de desconto`} • Pedido mínimo: R$ ${(c.min_order || 0).toFixed(2)}
          </p>
        </div>
      </div>

      <div class="flex items-center gap-2 self-end sm:self-center">
        <button onclick="toggleCouponStatus('${c.code}')" class="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-stone-300 text-xs font-semibold border border-white/10 transition-colors">
          ${c.active ? 'Pausar' : 'Ativar'}
        </button>
        <button onclick="deleteCoupon('${c.code}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors">
          🗑️
        </button>
      </div>
    </div>
  `).join('');
}

function openCreateCouponModal() {
  document.getElementById('coupon-modal').classList.remove('hidden');
}

function closeCouponModal() {
  document.getElementById('coupon-modal').classList.add('hidden');
}

function saveCouponForm(e) {
  e.preventDefault();
  const code = document.getElementById('coupon-code').value.trim().toUpperCase();
  const type = document.getElementById('coupon-type').value;
  const value = parseFloat(document.getElementById('coupon-value').value) || 0;
  const minOrder = parseFloat(document.getElementById('coupon-min-order').value) || 0;

  if (!code) return;

  COUPONS = COUPONS.filter(c => c.code !== code);
  COUPONS.push({
    code: code,
    type: type,
    value: value,
    min_order: minOrder,
    active: true
  });

  saveCoupons();
  renderCouponsList();
  closeCouponModal();
  showToast(`🎁 Cupom ${code} criado com sucesso!`);
}

function toggleCouponStatus(code) {
  const cup = COUPONS.find(c => c.code === code);
  if (cup) {
    cup.active = !cup.active;
    saveCoupons();
    renderCouponsList();
    showToast(cup.active ? `🟢 Cupom ${code} ativado!` : `🔴 Cupom ${code} pausado.`);
  }
}

function deleteCoupon(code) {
  if (confirm(`Deseja excluir o cupom ${code}?`)) {
    COUPONS = COUPONS.filter(c => c.code !== code);
    saveCoupons();
    renderCouponsList();
    showToast(`🗑️ Cupom ${code} excluído.`);
  }
}

// -------------------------------------------------------------------------
// NAVEGAÇÃO DE ABAS
// -------------------------------------------------------------------------
function switchStoreTab(tabName) {
  // Hide all panes
  document.querySelectorAll('.store-tab-pane').forEach(el => el.classList.add('hidden'));

  // Deactivate all nav buttons (sidebar + any old buttons)
  document.querySelectorAll('.store-nav-btn').forEach(btn => {
    btn.classList.remove('active');
    // also handle legacy tailwind classes just in case
    btn.classList.remove('bg-brand-orange', 'text-white', 'shadow-orange-glow');
    btn.classList.add('text-brand-textMuted');
  });

  // Show target pane
  const targetPane = document.getElementById(`store-view-${tabName}`);
  if (targetPane) targetPane.classList.remove('hidden');

  // Activate target sidebar button
  const targetBtn = document.getElementById(`tab-btn-${tabName}`);
  if (targetBtn) {
    targetBtn.classList.add('active');
    targetBtn.classList.remove('text-brand-textMuted');
  }

  // Update topbar title
  const PAGE_TITLES = {
    'dashboard': 'Início — Visão Geral',
    'menu-editor': 'Cardápio Digital',
    'orders': 'Pedidos ao Vivo',
    'pdv': 'PDV Balcão Express',
    'kds': 'Monitor de Cozinha (KDS)',
    'coupons': 'Cupons & Promoções',
    'delivery': 'Taxas & Entrega',
    'payments': 'Chave PIX & Pagamentos',
    'settings': 'Configurações da Loja',
  };
  const titleEl = document.getElementById('topbar-page-title');
  if (titleEl) titleEl.textContent = PAGE_TITLES[tabName] || tabName;

  // Update mobile bottom nav active
  document.querySelectorAll('.mobile-nav-item').forEach(b => b.classList.remove('active'));
  const mBtn = document.getElementById('mnav-' + tabName);
  if (mBtn) mBtn.classList.add('active');

  // Ações específicas de renderização por aba
  if (tabName === 'pdv') {
    renderPdvCategories();
    renderPdvProducts();
    renderPdvCart();
  } else if (tabName === 'kds') {
    renderKdsOrders();
  } else if (tabName === 'coupons') {
    renderCouponsList();
  }
}

function logoutStoreAdmin() {
  if (confirm('Deseja sair do painel?')) {
    sessionStorage.removeItem('CURRENT_LOGGED_STORE');
    window.location.href = 'login.html';
  }
}


function openSubscriptionModal() {
  const msg = encodeURIComponent(`Olá! Gostaria de assinar o plano oficial do PedidoVale para o meu restaurante (${STORE_DATA.name} - ${STORE_DATA.slug}).`);
  window.open(`https://wa.me/5599991040222?text=${msg}`, '_blank');
}

// -------------------------------------------------------------------------
// UTILITÁRIOS
// -------------------------------------------------------------------------
function formatCurrency(val) {
  return (parseFloat(val) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function cleanPhone(phone) {
  return (phone || '').replace(/\D/g, '');
}

function showToast(msg) {
  const toast = document.getElementById('admin-toast');
  const text = document.getElementById('admin-toast-text');
  if (toast && text) {
    text.innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 2800);
  }
}

// -------------------------------------------------------------------------
// INICIALIZAÇÃO DO PAINEL
// -------------------------------------------------------------------------
function initStoreAdmin() {
  loadStoreData();
  loadCoupons();

  if (!localStorage.getItem(getStoreKey('CATEGORIES'))) {
    saveCategories();
  }
  if (!localStorage.getItem(getStoreKey('CONFIG'))) {
    saveStoreConfig();
  }

  renderStoreTopbar();
  renderTrialInfo();
  renderCategorySelects();
  renderCategoryAccordionList();
  renderOrdersKanban();
  renderPdvCategories();
  renderPdvProducts();
  renderKdsOrders();
  renderCouponsList();
  populateSettingsInputs();

  // Atualização periódica do KDS a cada 10 segundos
  setInterval(() => {
    renderKdsOrders();
  }, 10000);
}

document.addEventListener('DOMContentLoaded', initStoreAdmin);
