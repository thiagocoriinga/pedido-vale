/**
 * =========================================================================
 * RESTAURANT OWNER OS • MOTOR DE GESTÃO DE CARDÁPIO COM FOTOS
 * Baseado nas referências da plataforma KiCardápio com o visual São José
 * =========================================================================
 */

// Chaves de armazenamento
const getStoreKey = (key) => `STORE_${CURRENT_STORE_SLUG}_${key}`;

// Loja Atual
const urlParams = new URLSearchParams(window.location.search);
const CURRENT_STORE_SLUG = urlParams.get('store') || sessionStorage.getItem('CURRENT_LOGGED_STORE') || 'sao-jose';

// Estado da Loja
let STORE_DATA = {
  name: "São José Burguer",
  slug: CURRENT_STORE_SLUG,
  isOpen: true,
  whatsapp: "5599991040222",
  address: "Rua Principal, 1500 - Centro",
  hours: "Terça a Domingo das 18h30 às 23h45",
  deliveryFee: 6.00,
  deliveryTime: "35 - 50 min",
  minOrder: 20.00,
  allowPickup: true,
  pixKey: "99991040222",
  pixType: "phone",
  pixName: "Thiago Siqueira / São José Burguer",
  acceptPix: true,
  acceptCard: true,
  acceptCash: true,
  trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
};

// Categorias
let CATEGORIES = [
  { id: "cat-burgers", name: "Hambúrgueres Artesanais", icon: "🍔" },
  { id: "cat-combos", name: "Combos Especiais", icon: "🔥" },
  { id: "cat-porcoes", name: "Porções & Batatas", icon: "🍟" },
  { id: "cat-bebidas", name: "Bebidas & Refrigerantes", icon: "🥤" },
  { id: "cat-sobremesas", name: "Sobremesas & Shakes", icon: "🍰" }
];

// Produtos com Imagens
let PRODUCTS = [
  {
    id: "prod-001",
    name: "São José Bacon Monster",
    image: "",
    category_id: "cat-burgers",
    price: 38.90,
    promo_price: 34.90,
    description: "Pão brioche selado na manteiga, 2x smash de 90g, muito bacon crocante, queijo cheddar derretido e molho da casa.",
    status: "active",
    featured: true,
    is_new: false,
    popular: true,
    extras: [
      { name: "Bacon Extra", price: 6.00 },
      { name: "Queijo Cheddar Dobrado", price: 5.00 },
      { name: "Carne Extra 90g", price: 8.00 }
    ]
  },
  {
    id: "prod-002",
    name: "Clássico Cheeseburger Duplo",
    image: "",
    category_id: "cat-burgers",
    price: 29.90,
    promo_price: null,
    description: "Pão artesanal tostado, 2x carnes smash suculentas, queijo prato duplo derretido e maionese verde artesanal.",
    status: "active",
    featured: false,
    is_new: true,
    popular: false,
    extras: [
      { name: "Molho Especial à Parte", price: 4.00 }
    ]
  },
  {
    id: "prod-003",
    name: "Batata Rústica com Cheddar & Bacon",
    image: "",
    category_id: "cat-porcoes",
    price: 24.50,
    promo_price: null,
    description: "350g de batatas rústicas douradas e crocantes, cobertas com blend de queijo cheddar cremoso e farofa de bacon.",
    status: "active",
    featured: true,
    is_new: false,
    popular: true,
    extras: []
  },
  {
    id: "prod-004",
    name: "Coca-Cola Original 350ml Lata",
    image: "",
    category_id: "cat-bebidas",
    price: 6.50,
    promo_price: null,
    description: "Lata 350ml bem gelada.",
    status: "active",
    featured: false,
    is_new: false,
    popular: false,
    extras: []
  }
];

// Pedidos em Andamento
let ORDERS = [
  {
    id: "PED-1042",
    customer_name: "Marcos Vinicius",
    customer_phone: "5599988112233",
    items: "1x São José Bacon Monster + 1x Coca-Cola Lata",
    total: 45.40,
    payment_method: "PIX",
    delivery_type: "Delivery",
    address: "Rua das Flores, 120 - Apto 302",
    status: "new",
    time: "Há 4 minutos"
  },
  {
    id: "PED-1041",
    customer_name: "Camila Ribeiro",
    customer_phone: "5599977445566",
    items: "2x Clássico Cheeseburger + 1x Batata Rústica",
    total: 84.30,
    payment_method: "Cartão na Entrega",
    delivery_type: "Delivery",
    address: "Av. Brasil, 450",
    status: "prep",
    time: "Há 18 minutos"
  }
];

// Variável temporária de imagem do produto em edição
let currentUploadedProductImage = "";

// -------------------------------------------------------------------------
// INICIALIZAÇÃO DO PAINEL DO RESTAURANTE
// -------------------------------------------------------------------------
function initStoreAdmin() {
  loadStoreData();
  renderStoreTopbar();
  renderTrialInfo();
  renderCategorySelects();
  renderProductsList();
  renderCategoriesList();
  renderOrdersKanban();
  populateSettingsInputs();
}

function loadStoreData() {
  try {
    const savedConfig = localStorage.getItem(getStoreKey('CONFIG'));
    if (savedConfig) STORE_DATA = { ...STORE_DATA, ...JSON.parse(savedConfig) };

    const savedCats = localStorage.getItem(getStoreKey('CATEGORIES'));
    if (savedCats) CATEGORIES = JSON.parse(savedCats);

    const savedProds = localStorage.getItem(getStoreKey('PRODUCTS'));
    if (savedProds) PRODUCTS = JSON.parse(savedProds);

    const savedOrders = localStorage.getItem(getStoreKey('ORDERS'));
    if (savedOrders) ORDERS = JSON.parse(savedOrders);
  } catch (e) {}
}

function saveStoreConfig() {
  localStorage.setItem(getStoreKey('CONFIG'), JSON.stringify(STORE_DATA));
}

function saveProducts() {
  localStorage.setItem(getStoreKey('PRODUCTS'), JSON.stringify(PRODUCTS));
}

function saveCategories() {
  localStorage.setItem(getStoreKey('CATEGORIES'), JSON.stringify(CATEGORIES));
}

function saveOrders() {
  localStorage.setItem(getStoreKey('ORDERS'), JSON.stringify(ORDERS));
}

// -------------------------------------------------------------------------
// TOPBAR & TRIAL BANNER
// -------------------------------------------------------------------------
function renderStoreTopbar() {
  const nameEl = document.getElementById('topbar-store-name');
  const dashNameEl = document.getElementById('dash-store-name');
  const slugEl = document.getElementById('topbar-store-slug');
  const shareLinkInput = document.getElementById('share-link-input');
  const viewMenuBtn = document.getElementById('topbar-view-menu-btn');
  const prodsCountEl = document.getElementById('dash-products-count');

  const menuUrl = `${window.location.origin}/index-sj.html?store=${STORE_DATA.slug}`;

  if (nameEl) nameEl.innerText = STORE_DATA.name.toUpperCase();
  if (dashNameEl) dashNameEl.innerText = STORE_DATA.name.toUpperCase();
  if (slugEl) slugEl.innerText = `pedidovale.com.br/${STORE_DATA.slug}`;
  if (shareLinkInput) shareLinkInput.innerText = menuUrl;
  if (viewMenuBtn) viewMenuBtn.href = menuUrl;
  if (prodsCountEl) prodsCountEl.innerText = `${PRODUCTS.length} Produtos cadastrados`;

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
  const url = `${window.location.origin}/index-sj.html?store=${STORE_DATA.slug}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast("🔗 Link do cardápio copiado com sucesso!");
    });
  } else {
    showToast(`Link: ${url}`);
  }
}

function shareOnWhatsApp() {
  const url = `${window.location.origin}/index-sj.html?store=${STORE_DATA.slug}`;
  const text = encodeURIComponent(`Olá! Faça seu pedido direto no nosso cardápio online: ${url}`);
  window.open(`https://wa.me/?text=${text}`, '_blank');
}

// -------------------------------------------------------------------------
// GESTÃO DE PRODUTOS COM UPLOAD DE IMAGENS
// -------------------------------------------------------------------------
function renderCategorySelects() {
  const filterSelect = document.getElementById('product-category-filter');
  const modalSelect = document.getElementById('prod-category');

  if (filterSelect) {
    filterSelect.innerHTML = `<option value="all">Todas as Categorias (${CATEGORIES.length})</option>` + 
      CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  }

  if (modalSelect) {
    modalSelect.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('');
  }
}

function renderProductsList() {
  const container = document.getElementById('products-list-container');
  if (!container) return;

  const search = (document.getElementById('product-search-input')?.value || '').toLowerCase();
  const catFilter = document.getElementById('product-category-filter')?.value || 'all';
  const statusFilter = document.getElementById('product-status-filter')?.value || 'all';

  const filtered = PRODUCTS.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search));
    const matchesCat = catFilter === 'all' || p.category_id === catFilter;
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesCat && matchesStatus;
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full p-10 text-center bg-[#120D0A]/90 border border-brand-darkBorder rounded-3xl text-brand-textMuted text-xs font-poppins">
        Nenhum produto encontrado. Clique em "+ Novo Produto" para cadastrar itens com fotos!
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(p => {
    const cat = CATEGORIES.find(c => c.id === p.category_id);
    const catName = cat ? `${cat.icon} ${cat.name}` : 'Geral';
    const isPaused = p.status === 'paused';

    // Tags
    let badgesHtml = '';
    if (p.featured) badgesHtml += '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[9px] font-bold">⭐ Destaque</span> ';
    if (p.popular) badgesHtml += '<span class="px-2 py-0.5 rounded-full bg-brand-orange/20 text-brand-orange text-[9px] font-bold">🔥 Popular</span> ';
    if (p.is_new) badgesHtml += '<span class="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">✨ Novo</span> ';

    // Imagem
    const imageHtml = p.image 
      ? `<img src="${p.image}" alt="${p.name}" class="w-20 h-20 rounded-2xl object-cover border border-white/10 shrink-0" />`
      : `<div class="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-3xl shrink-0">🍔</div>`;

    return `
      <div class="bg-[#120D0A]/95 border ${isPaused ? 'border-white/5 opacity-70' : 'border-brand-darkBorder hover:border-brand-orange/40'} rounded-3xl p-5 shadow-card-dark flex flex-col justify-between space-y-4 transition-all">
        
        <div class="flex items-start gap-3.5">
          ${imageHtml}
          
          <div class="flex-1 space-y-1">
            <span class="text-[10px] font-semibold text-brand-orange uppercase tracking-wider block">${catName}</span>
            <h3 class="font-anton text-base text-white tracking-wide leading-tight">${p.name}</h3>
            
            <p class="text-xs text-brand-textMuted line-clamp-2 leading-relaxed font-poppins">
              ${p.description || 'Sem descrição.'}
            </p>

            ${badgesHtml ? `<div class="pt-1 flex flex-wrap gap-1">${badgesHtml}</div>` : ''}
          </div>
        </div>

        ${p.extras && p.extras.length > 0 ? `
          <div class="flex flex-wrap gap-1 bg-black/40 p-2.5 rounded-xl border border-white/5">
            <span class="text-[9px] text-brand-textMuted w-full block font-semibold uppercase">Opcionais:</span>
            ${p.extras.map(e => `<span class="px-2 py-0.5 rounded-md bg-white/5 text-[10px] text-stone-300 font-poppins">+ ${e.name} (${formatCurrency(e.price)})</span>`).join('')}
          </div>
        ` : ''}

        <div class="pt-3 border-t border-brand-darkBorder/60 flex items-center justify-between">
          <div class="flex items-baseline gap-2">
            <span class="font-anton text-lg text-amber-400 tracking-wide">
              ${formatCurrency(p.promo_price || p.price)}
            </span>
            ${p.promo_price ? `<span class="text-xs text-stone-500 line-through font-poppins">${formatCurrency(p.price)}</span>` : ''}
          </div>

          <div class="flex items-center gap-1.5">
            <button onclick="toggleProductStatus('${p.id}')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs transition-colors" title="${isPaused ? 'Ativar no Cardápio' : 'Pausar (Esgotado)'}">
              ${isPaused ? '▶️' : '⏸️'}
            </button>
            <button onclick="openEditProductModal('${p.id}')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 text-xs transition-colors" title="Editar Produto">
              ✏️
            </button>
            <button onclick="deleteProduct('${p.id}')" class="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors" title="Excluir Produto">
              🗑️
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// Upload & Preview de Imagem
function handleProductImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    currentUploadedProductImage = event.target.result;
    showImagePreview(currentUploadedProductImage);
    document.getElementById('prod-image-url').value = '';
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
  if (imgEl && placeholder) {
    if (src) {
      imgEl.src = src;
      imgEl.classList.remove('hidden');
      placeholder.classList.add('hidden');
    } else {
      imgEl.src = '';
      imgEl.classList.add('hidden');
      placeholder.classList.remove('hidden');
    }
  }
}

// Modal Produto
let currentEditingProductId = null;

function openCreateProductModal() {
  currentEditingProductId = null;
  currentUploadedProductImage = '';
  showImagePreview('');
  
  document.getElementById('modal-product-title').innerText = "NOVO PRODUTO";
  document.getElementById('form-product').reset();
  document.getElementById('product-extras-container').innerHTML = '';
  document.getElementById('prod-available-switch').checked = true;
  document.getElementById('product-modal').classList.remove('hidden');
}

function openEditProductModal(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return;

  currentEditingProductId = id;
  currentUploadedProductImage = prod.image || '';
  showImagePreview(currentUploadedProductImage);

  document.getElementById('modal-product-title').innerText = `EDITAR: ${prod.name.toUpperCase()}`;
  document.getElementById('prod-name').value = prod.name || '';
  document.getElementById('prod-category').value = prod.category_id || (CATEGORIES[0]?.id || '');
  document.getElementById('prod-price').value = prod.price || '';
  document.getElementById('prod-promo-price').value = prod.promo_price || '';
  document.getElementById('prod-desc').value = prod.description || '';
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

  document.getElementById('product-modal').classList.remove('hidden');
}

function closeProductModal() {
  document.getElementById('product-modal').classList.add('hidden');
}

function addProductExtraRow(name = '', price = '') {
  const container = document.getElementById('product-extras-container');
  const div = document.createElement('div');
  div.className = "flex items-center gap-2 extra-row";
  div.innerHTML = `
    <input type="text" placeholder="Nome do Opcional (ex: Bacon Extra)" value="${name}" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white extra-name" required />
    <input type="number" step="0.5" placeholder="Preço (R$)" value="${price}" class="w-24 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-amber-400 font-bold extra-price" required />
    <button type="button" onclick="this.parentElement.remove()" class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs">✕</button>
  `;
  container.appendChild(div);
}

function saveProductForm(e) {
  e.preventDefault();

  const name = document.getElementById('prod-name').value.trim();
  const category_id = document.getElementById('prod-category').value;
  const price = parseFloat(document.getElementById('prod-price').value) || 0;
  const promo_price_val = document.getElementById('prod-promo-price').value;
  const promo_price = promo_price_val ? parseFloat(promo_price_val) : null;
  const description = document.getElementById('prod-desc').value.trim();
  
  const isAvailable = document.getElementById('prod-available-switch').checked;
  const status = isAvailable ? 'active' : 'paused';
  const featured = document.getElementById('prod-featured-switch').checked;
  const is_new = document.getElementById('prod-new-switch').checked;
  const popular = document.getElementById('prod-popular-switch').checked;

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
      image: currentUploadedProductImage,
      status,
      featured,
      is_new,
      popular,
      extras
    };
    PRODUCTS.push(newProd);
    showToast(`🚀 Novo produto "${name}" adicionado ao cardápio!`);
  }

  saveProducts();
  closeProductModal();
  renderProductsList();
  renderStoreTopbar();
}

function toggleProductStatus(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return;

  prod.status = prod.status === 'paused' ? 'active' : 'paused';
  saveProducts();
  renderProductsList();
  showToast(prod.status === 'paused' ? `⏸️ "${prod.name}" pausado no cardápio.` : `🟢 "${prod.name}" ativado.`);
}

function deleteProduct(id) {
  const prod = PRODUCTS.find(p => p.id === id);
  if (!prod) return;

  if (confirm(`Excluir permanentemente "${prod.name}"?`)) {
    PRODUCTS = PRODUCTS.filter(p => p.id !== id);
    saveProducts();
    renderProductsList();
    renderStoreTopbar();
    showToast("🗑️ Produto excluído.");
  }
}

// -------------------------------------------------------------------------
// GESTÃO DE CATEGORIAS
// -------------------------------------------------------------------------
function renderCategoriesList() {
  const container = document.getElementById('categories-list-container');
  if (!container) return;

  container.innerHTML = CATEGORIES.map(c => {
    const totalItems = PRODUCTS.filter(p => p.category_id === c.id).length;

    return `
      <div class="bg-[#120D0A]/95 border border-brand-darkBorder rounded-3xl p-5 shadow-card-dark flex items-center justify-between">
        <div class="flex items-center gap-3">
          <span class="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-2xl">${c.icon || '📁'}</span>
          <div>
            <h4 class="font-anton text-base text-white tracking-wide">${c.name}</h4>
            <span class="text-[11px] text-brand-textMuted">${totalItems} ${totalItems === 1 ? 'produto cadastrado' : 'produtos cadastrados'}</span>
          </div>
        </div>
        <button onclick="deleteCategory('${c.id}')" class="p-2.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors" title="Excluir Categoria">
          🗑️
        </button>
      </div>
    `;
  }).join('');
}

function openCreateCategoryModal() {
  document.getElementById('form-category').reset();
  document.getElementById('category-modal').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('category-modal').classList.add('hidden');
}

function saveCategoryForm(e) {
  e.preventDefault();
  const name = document.getElementById('cat-name').value.trim();
  const icon = document.getElementById('cat-icon').value.trim() || '🍽️';

  const newCat = {
    id: `cat-${Date.now()}`,
    name,
    icon
  };
  CATEGORIES.push(newCat);
  saveCategories();
  renderCategorySelects();
  renderCategoriesList();
  renderProductsList();
  closeCategoryModal();
  showToast(`📂 Categoria "${name}" criada com sucesso!`);
}

function deleteCategory(id) {
  if (confirm("Excluir esta categoria?")) {
    CATEGORIES = CATEGORIES.filter(c => c.id !== id);
    saveCategories();
    renderCategorySelects();
    renderCategoriesList();
    renderProductsList();
    showToast("Categoria removida.");
  }
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

  colNew.innerHTML = newOrders.map(o => renderOrderCard(o, 'prep', 'Aceitar & Preparar ➔')).join('') || '<div class="text-[11px] text-stone-500 p-4 text-center">Nenhum pedido novo.</div>';
  colPrep.innerHTML = prepOrders.map(o => renderOrderCard(o, 'delivery', 'Despachar Entrega 🛵')).join('') || '<div class="text-[11px] text-stone-500 p-4 text-center">Nenhum pedido na cozinha.</div>';
  colDelivery.innerHTML = deliveryOrders.map(o => renderOrderCard(o, 'done', 'Finalizar Pedido ✅')).join('') || '<div class="text-[11px] text-stone-500 p-4 text-center">Nenhum pedido a caminho.</div>';
}

function renderOrderCard(o, nextStatus, nextLabel) {
  return `
    <div class="bg-black/60 border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
      <div class="flex items-center justify-between pb-2 border-b border-white/5">
        <span class="font-anton text-sm text-brand-orange">${o.id}</span>
        <span class="text-[10px] text-stone-400 font-medium">${o.time}</span>
      </div>

      <div>
        <div class="font-bold text-white text-xs">${o.customer_name}</div>
        <div class="text-[11px] text-stone-300 font-poppins">${o.items}</div>
        <div class="text-[10px] text-stone-400 mt-1">📍 ${o.address}</div>
      </div>

      <div class="flex items-center justify-between pt-1 text-xs">
        <span class="font-anton text-amber-400">${formatCurrency(o.total)}</span>
        <span class="px-2 py-0.5 rounded-lg bg-white/5 text-[10px] text-stone-300">${o.payment_method}</span>
      </div>

      <div class="flex items-center gap-1.5 pt-1">
        <a href="https://wa.me/${cleanPhone(o.customer_phone)}" target="_blank" class="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs" title="Conversar no WhatsApp">
          💬
        </a>
        <button onclick="advanceOrderStatus('${o.id}', '${nextStatus}')" class="flex-1 py-2 rounded-xl bg-brand-orange hover:bg-brand-orangeHover text-white font-anton text-xs tracking-wider transition-all">
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

  if (feeEl) feeEl.value = STORE_DATA.deliveryFee || 6.00;
  if (timeEl) timeEl.value = STORE_DATA.deliveryTime || '35 - 50 min';
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
  const storeZapEl = document.getElementById('store-whatsapp-input');
  const storeAddrEl = document.getElementById('store-address-input');
  const storeHoursEl = document.getElementById('store-hours-input');

  if (storeNameEl) storeNameEl.value = STORE_DATA.name || '';
  if (storeZapEl) storeZapEl.value = STORE_DATA.whatsapp || '';
  if (storeAddrEl) storeAddrEl.value = STORE_DATA.address || '';
  if (storeHoursEl) storeHoursEl.value = STORE_DATA.hours || '';
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
  STORE_DATA.whatsapp = document.getElementById('store-whatsapp-input').value.trim();
  STORE_DATA.address = document.getElementById('store-address-input').value.trim();
  STORE_DATA.hours = document.getElementById('store-hours-input').value.trim();

  saveStoreConfig();
  renderStoreTopbar();
  showToast("⚙️ Dados do restaurante atualizados!");
}

// -------------------------------------------------------------------------
// NAVEGAÇÃO DE ABAS
// -------------------------------------------------------------------------
function switchStoreTab(tabName) {
  document.querySelectorAll('.store-tab-pane').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.store-nav-btn').forEach(btn => {
    btn.classList.remove('bg-brand-orange', 'text-white', 'shadow-orange-glow');
    btn.classList.add('text-brand-textMuted');
  });

  const targetPane = document.getElementById(`store-view-${tabName}`);
  const targetBtn = document.getElementById(`tab-btn-${tabName}`);

  if (targetPane) targetPane.classList.remove('hidden');
  if (targetBtn) {
    targetBtn.classList.add('bg-brand-orange', 'text-white', 'shadow-orange-glow');
    targetBtn.classList.remove('text-brand-textMuted');
  }
}

function openQrCodeModal() {
  const url = `${window.location.origin}/index-sj.html?store=${STORE_DATA.slug}`;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(url)}`;
  
  const win = window.open("", "_blank", "width=400,height=500");
  win.document.write(`
    <html style="background:#080504;color:white;text-align:center;font-family:sans-serif;padding:30px;">
      <h2 style="color:#FF5E1E;">QR CODE DO SEU CARDÁPIO</h2>
      <p style="font-size:12px;color:#aaa;">Imprima ou coloque nas mesas para os clientes lerem:</p>
      <div style="background:white;padding:15px;display:inline-block;border-radius:20px;margin:20px 0;">
        <img src="${qrUrl}" alt="QR Code" style="display:block;" />
      </div>
      <br />
      <button onclick="window.print()" style="background:#FF5E1E;color:white;border:none;padding:10px 20px;border-radius:12px;cursor:pointer;font-weight:bold;">Imprimir QR Code</button>
    </html>
  `);
}

function openSubscriptionModal() {
  const msg = encodeURIComponent(`Olá! Gostaria de assinar a plataforma PedidoVale para o meu restaurante (${STORE_DATA.name} - ${STORE_DATA.slug}).`);
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

// Inicializar na carga da página
document.addEventListener('DOMContentLoaded', initStoreAdmin);
