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

    // 2. Carregar dados específicos da loja
    const savedConfig = localStorage.getItem(getStoreKey('CONFIG'));
    if (savedConfig) STORE_DATA = { ...STORE_DATA, ...JSON.parse(savedConfig) };

    const savedCats = localStorage.getItem(getStoreKey('CATEGORIES'));
    if (savedCats) {
      CATEGORIES = JSON.parse(savedCats);
    } else {
      CATEGORIES = [];
    }

    const savedProds = localStorage.getItem(getStoreKey('PRODUCTS'));
    if (savedProds) {
      PRODUCTS = JSON.parse(savedProds);
    } else {
      PRODUCTS = [];
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
// GERENCIADOR DE CARDÁPIO
// -------------------------------------------------------------------------
function renderCategorySelects() {
  const sel = document.getElementById('prod-category');
  if (!sel) return;
  if (CATEGORIES.length === 0) {
    sel.innerHTML = '<option value="">-- Crie uma categoria primeiro --</option>';
    return;
  }
  sel.innerHTML = CATEGORIES.map(c => `<option value="${c.id}">${c.icon || '📁'} ${c.name}</option>`).join('');
}

function renderCategoryAccordionList() {
  const container = document.getElementById('category-accordion-container');
  if (!container) return;

  const search = (document.getElementById('menu-quick-search')?.value || '').toLowerCase().trim();
  
  // Atualizar stats
  const statsEl = document.getElementById('menu-stats');
  const statCats = document.getElementById('stat-categories');
  const statProds = document.getElementById('stat-products');
  const guideBanner = document.getElementById('menu-guide-banner');

  const totalProds = PRODUCTS.length;
  const totalCats = CATEGORIES.length;

  if (statsEl) {
    if (totalCats > 0) {
      statsEl.classList.remove('hidden');
      statsEl.classList.add('flex');
      if (statCats) statCats.textContent = `${totalCats} categoria${totalCats !== 1 ? 's' : ''}`;
      if (statProds) statProds.textContent = `${totalProds} produto${totalProds !== 1 ? 's' : ''}`;
    } else {
      statsEl.classList.add('hidden');
    }
  }

  // Mostrar guia quando vazio
  if (guideBanner) {
    if (totalCats === 0) {
      guideBanner.classList.remove('hidden');
    } else {
      guideBanner.classList.add('hidden');
    }
  }

  if (CATEGORIES.length === 0) {
    container.innerHTML = `
      <div class="p-10 text-center bg-[#120D0A] border border-brand-darkBorder border-dashed rounded-3xl space-y-4">
        <div class="text-5xl">🍽️</div>
        <div>
          <h3 class="font-bold text-base text-white mb-1">Seu cardápio está vazio</h3>
          <p class="text-xs text-stone-400 max-w-xs mx-auto">Comece criando uma categoria para organizar seus produtos. Ex: Lanches, Pizzas, Bebidas...</p>
        </div>
        <button onclick="openCreateCategoryModal()"
          class="mx-auto px-6 py-3 rounded-2xl bg-brand-orange hover:bg-brand-orangeHover text-white font-bold text-sm shadow-orange-glow active:scale-95 transition-all flex items-center gap-2 w-fit">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
          Criar Primeira Categoria
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = CATEGORIES.map(cat => {
    const allProds = PRODUCTS.filter(p => p.category_id === cat.id);
    const filteredProds = search
      ? allProds.filter(p => p.name.toLowerCase().includes(search) || (p.description && p.description.toLowerCase().includes(search)))
      : allProds;

    const isVisible = cat.visible !== false;
    const prodCount = allProds.length;

    return `
      <div class="bg-[#0F0B08] border border-[#29211C] rounded-2xl overflow-hidden shadow-lg transition-all" id="cat-block-${cat.id}">
        
        <!-- Cabeçalho da Categoria -->
        <div class="flex items-center justify-between px-4 py-3 bg-black/30 border-b border-[#29211C]">
          <div class="flex items-center gap-3">
            <span class="text-xl w-8 h-8 flex items-center justify-center bg-white/5 rounded-xl">${cat.icon || '📁'}</span>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-sm text-white">${cat.name}</span>
                <span class="px-2 py-0.5 rounded-full bg-white/10 text-stone-400 text-[10px] font-bold">${prodCount} ${prodCount === 1 ? 'item' : 'itens'}</span>
                ${!isVisible ? '<span class="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">👁 Oculta</span>' : ''}
              </div>
              ${cat.desc ? `<p class="text-[11px] text-stone-500 mt-0.5 line-clamp-1">${cat.desc}</p>` : ''}
            </div>
          </div>

          <div class="flex items-center gap-1.5">
            <button onclick="openEditCategoryModal('${cat.id}')" 
              class="p-2 rounded-lg bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white text-xs transition-colors" 
              title="Editar categoria">✏️</button>
            <button onclick="deleteCategory('${cat.id}')" 
              class="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs transition-colors" 
              title="Excluir categoria">🗑️</button>
          </div>
        </div>

        <!-- Lista de Produtos -->
        <div class="p-3 space-y-2">
          ${filteredProds.length > 0 
            ? filteredProds.map(prod => renderProductCard(prod)).join('')
            : `<div class="py-5 text-center text-stone-500 text-xs">
                <span class="text-2xl block mb-1">📭</span>
                <span>Nenhum produto ainda nesta categoria.</span>
               </div>`
          }

          <!-- Botão Adicionar Produto na Categoria -->
          <button onclick="openCreateProductModal('${cat.id}')"
            class="w-full mt-1 py-2.5 rounded-xl border border-dashed border-emerald-500/30 hover:border-emerald-400/60 bg-emerald-600/5 hover:bg-emerald-600/10 text-emerald-400 hover:text-emerald-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.99]">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path d="M12 5v14M5 12h14"/></svg>
            <span>Adicionar produto em "${cat.name}"</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function renderProductCard(p) {
  const isPaused = p.status === 'paused';
  const displayPrice = p.promo_price ? p.promo_price : p.price;
  const hasPromo = !!p.promo_price;

  const badges = [];
  if (p.featured) badges.push('<span class="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[9px] font-bold">⭐ Destaque</span>');
  if (p.popular) badges.push('<span class="px-1.5 py-0.5 rounded-md bg-orange-500/20 text-orange-400 text-[9px] font-bold">🔥 Popular</span>');
  if (p.is_new) badges.push('<span class="px-1.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[9px] font-bold">✨ Novo</span>');

  return `
    <div class="flex items-center gap-3 p-3 rounded-xl border ${isPaused ? 'border-white/5 bg-black/20 opacity-50' : 'border-white/8 bg-white/[0.02] hover:border-white/15'} transition-all group">
      <!-- Foto -->
      <div class="w-14 h-14 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center">
        ${p.image 
          ? `<img src="${p.image}" alt="${p.name}" class="w-full h-full object-cover" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex'" /><span class="hidden w-full h-full items-center justify-center text-2xl">🍽️</span>`
          : '<span class="text-2xl">🍽️</span>'
        }
      </div>

      <!-- Info -->
      <div class="flex-1 min-w-0">
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="font-bold text-xs text-white truncate">${p.name}</span>
          ${badges.join('')}
        </div>
        <p class="text-[11px] text-stone-500 mt-0.5 line-clamp-1">${p.description || ''}</p>
        <div class="flex items-baseline gap-1.5 mt-1">
          <span class="font-bold text-xs ${hasPromo ? 'text-emerald-400' : 'text-amber-400'}">${formatCurrency(displayPrice)}</span>
          ${hasPromo ? `<span class="text-[10px] text-stone-600 line-through">${formatCurrency(p.price)}</span>` : ''}
        </div>
      </div>

      <!-- Ações -->
      <div class="flex items-center gap-1 shrink-0 opacity-60 group-hover:opacity-100 transition-opacity">
        <button onclick="toggleProductStatus('${p.id}')" 
          class="p-1.5 rounded-lg ${isPaused ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 text-stone-400 hover:bg-white/15'} text-[11px] transition-colors" 
          title="${isPaused ? 'Ativar produto' : 'Pausar produto'}">
          ${isPaused ? '▶' : '⏸'}
        </button>
        <button onclick="openEditProductModal('${p.id}')" 
          class="p-1.5 rounded-lg bg-brand-orange/10 hover:bg-brand-orange text-brand-orange hover:text-white text-[11px] transition-colors" 
          title="Editar produto">✏️</button>
        <button onclick="deleteProduct('${p.id}')" 
          class="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-[11px] transition-colors" 
          title="Excluir produto">🗑️</button>
      </div>
    </div>
  `;
}

// -------------------------------------------------------------------------
// TOAST NOTIFICATIONS (GLOBAL & ROBUSTO)
// -------------------------------------------------------------------------
function showToast(msg, type = 'info') {
  console.log("[PedidoVale Toast]:", msg);
  let toastContainer = document.getElementById('admin-toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'admin-toast-container';
    toastContainer.className = 'fixed bottom-6 right-6 z-[99999] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'pointer-events-auto bg-[#18120E]/95 border border-brand-orange/40 text-white text-xs font-semibold px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 transform translate-y-4 opacity-0 transition-all duration-300';
  toast.innerHTML = `
    <span class="text-base shrink-0">🔔</span>
    <span class="flex-1 text-stone-200 leading-snug">${msg}</span>
  `;

  toastContainer.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.remove('translate-y-4', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');
  });

  setTimeout(() => {
    toast.classList.remove('translate-y-0', 'opacity-100');
    toast.classList.add('translate-y-4', 'opacity-0');
    setTimeout(() => toast.remove(), 350);
  }, 3200);
}

// -------------------------------------------------------------------------
// MODAL CATEGORIA
// -------------------------------------------------------------------------
function openCreateCategoryModal() {
  currentEditingCategoryId = null;
  const titleEl = document.getElementById('modal-category-title');
  const nameEl = document.getElementById('cat-name');
  const iconEl = document.getElementById('cat-icon');
  const descEl = document.getElementById('cat-desc');
  const visibleEl = document.getElementById('cat-visible-switch');
  
  if (titleEl) titleEl.innerText = 'Nova Categoria';
  if (nameEl) nameEl.value = '';
  if (iconEl) iconEl.value = '';
  if (descEl) descEl.value = '';
  if (visibleEl) visibleEl.checked = true;
  
  document.getElementById('category-modal')?.classList.remove('hidden');
  setTimeout(() => nameEl?.focus(), 100);
}

function openEditCategoryModal(id) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return;

  currentEditingCategoryId = id;
  document.getElementById('modal-category-title').innerText = 'Editar Categoria';
  document.getElementById('cat-name').value = cat.name || '';
  document.getElementById('cat-icon').value = cat.icon || '';
  document.getElementById('cat-desc').value = cat.desc || '';
  document.getElementById('cat-visible-switch').checked = cat.visible !== false;
  document.getElementById('category-modal')?.classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('category-modal')?.classList.add('hidden');
}

function saveCategoryForm(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();

  try {
    const nameEl = document.getElementById('cat-name');
    const name = nameEl ? nameEl.value.trim() : '';

    if (!name) {
      showToast('⚠️ Por favor, informe o Nome da categoria!');
      if (nameEl) {
        nameEl.classList.add('border-rose-500');
        nameEl.focus();
        setTimeout(() => nameEl.classList.remove('border-rose-500'), 2000);
      }
      return false;
    }

    const icon = document.getElementById('cat-icon')?.value.trim() || '📁';
    const desc = document.getElementById('cat-desc')?.value.trim() || '';
    const visible = document.getElementById('cat-visible-switch')?.checked ?? true;

    if (currentEditingCategoryId) {
      const idx = CATEGORIES.findIndex(c => c.id === currentEditingCategoryId);
      if (idx !== -1) {
        CATEGORIES[idx] = { ...CATEGORIES[idx], name, icon, desc, visible };
        showToast(`✅ Categoria "${name}" atualizada com sucesso!`);
      }
    } else {
      CATEGORIES.push({ id: `cat-${Date.now()}`, name, icon, desc, visible });
      showToast(`📂 Categoria "${name}" criada com sucesso!`);
    }

    saveCategories();
    renderCategorySelects();
    renderCategoryAccordionList();
    closeCategoryModal();
  } catch (err) {
    console.error("Erro ao salvar categoria:", err);
    showToast("Erro ao salvar categoria: " + err.message);
  }
  return false;
}

function toggleCategoryVisibility(id) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return;
  cat.visible = !cat.visible;
  saveCategories();
  renderCategoryAccordionList();
  showToast(cat.visible ? `🟢 "${cat.name}" visível no cardápio.` : `⏸️ "${cat.name}" oculta.`);
}

function deleteCategory(id) {
  const cat = CATEGORIES.find(c => c.id === id);
  if (!cat) return;

  const prodsInCat = PRODUCTS.filter(p => p.category_id === id).length;
  const msg = prodsInCat > 0
    ? `Excluir a categoria "${cat.name}"? Os ${prodsInCat} produto(s) dela ficarão sem categoria.`
    : `Excluir a categoria "${cat.name}"?`;

  if (confirm(msg)) {
    CATEGORIES = CATEGORIES.filter(c => c.id !== id);
    saveCategories();
    renderCategorySelects();
    renderCategoryAccordionList();
    showToast('🗑️ Categoria removida.');
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
    prod.extras.forEach(extra => addProductExtraRow(extra.name, extra.price, extra.image || ''));
  } else if (prod.optionGroups && prod.optionGroups.length > 0) {
    // Converter de optionGroups se existir
    prod.optionGroups.forEach(grp => {
      if (grp.options) {
        grp.options.forEach(opt => addProductExtraRow(opt.name, opt.price, opt.image || ''));
      }
    });
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

function addProductExtraRow(name = '', price = '', image = '') {
  const container = document.getElementById('product-extras-container');
  const div = document.createElement('div');
  div.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 extra-row bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 transition-all";
  
  const uniqueId = `extra-img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  div.innerHTML = `
    <div class="flex items-center gap-2 flex-1">
      <div class="relative w-10 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center group cursor-pointer" onclick="document.getElementById('${uniqueId}-file').click()">
        <img src="${image}" class="w-full h-full object-cover extra-img-preview ${image ? '' : 'hidden'}" onerror="this.classList.add('hidden')" />
        <span class="text-xs text-white/50 ${image ? 'hidden' : ''} extra-img-icon">📷</span>
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white transition-opacity font-bold">Foto</div>
      </div>
      <input type="file" id="${uniqueId}-file" accept="image/*" class="hidden" onchange="handleExtraImageUpload(event, this)" />

      <input type="text" placeholder="Nome do Opcional (ex: Bacon Extra, Queijo...)" value="${name}" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white extra-name focus:outline-none focus:border-brand-orange" />
    </div>

    <div class="flex items-center gap-2">
      <div class="relative w-28">
        <span class="absolute left-2.5 top-2 text-[10px] text-stone-500 font-mono">R$</span>
        <input type="number" step="0.5" placeholder="0.00" value="${price}" class="w-full bg-white/5 border border-white/10 rounded-xl pl-7 pr-2.5 py-2 text-xs text-amber-400 font-bold extra-price focus:outline-none focus:border-brand-orange" />
      </div>

      <input type="hidden" value="${image}" class="extra-image-data" />
      
      <input type="url" placeholder="URL da foto (opcional)" value="${image && image.startsWith('http') ? image : ''}" oninput="handleExtraImageUrl(this)" class="hidden sm:block w-36 bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-[11px] text-white/70 extra-image-url focus:outline-none focus:border-brand-orange" />

      <button type="button" onclick="this.closest('.extra-row').remove()" class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs transition-colors shrink-0" title="Remover Opcional">✕</button>
    </div>
  `;
  container.appendChild(div);
}

function handleExtraImageUpload(e, inputEl) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const maxDim = 300;
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

      const compressed = canvas.toDataURL('image/jpeg', 0.75);
      const row = inputEl.closest('.extra-row');
      if (row) {
        const preview = row.querySelector('.extra-img-preview');
        const icon = row.querySelector('.extra-img-icon');
        const hiddenData = row.querySelector('.extra-image-data');
        const urlInput = row.querySelector('.extra-image-url');

        if (preview) {
          preview.src = compressed;
          preview.classList.remove('hidden');
        }
        if (icon) icon.classList.add('hidden');
        if (hiddenData) hiddenData.value = compressed;
        if (urlInput) urlInput.value = '';
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function handleExtraImageUrl(inputEl) {
  const url = inputEl.value.trim();
  const row = inputEl.closest('.extra-row');
  if (row) {
    const preview = row.querySelector('.extra-img-preview');
    const icon = row.querySelector('.extra-img-icon');
    const hiddenData = row.querySelector('.extra-image-data');

    if (url) {
      if (preview) {
        preview.src = url;
        preview.classList.remove('hidden');
      }
      if (icon) icon.classList.add('hidden');
      if (hiddenData) hiddenData.value = url;
    } else {
      if (preview) {
        preview.src = '';
        preview.classList.add('hidden');
      }
      if (icon) icon.classList.remove('hidden');
      if (hiddenData) hiddenData.value = '';
    }
  }
}

function saveProductForm(e) {
  if (e && e.preventDefault) e.preventDefault();
  if (e && e.stopPropagation) e.stopPropagation();

  // ---- Coletar Campos ----
  const nameInput = document.getElementById('prod-name');
  const priceInput = document.getElementById('prod-price');
  const catSelect = document.getElementById('prod-category');

  const name = nameInput ? nameInput.value.trim() : '';
  const priceRaw = priceInput ? priceInput.value.trim() : '';
  const price = parseFloat(priceRaw);

  // Limpar erros anteriores
  [nameInput, priceInput].forEach(el => {
    if (el) el.classList.remove('border-rose-500', 'bg-rose-500/10');
  });

  // ---- Validação ----
  if (!name) {
    showToast('⚠️ Informe o nome do produto!');
    if (nameInput) {
      nameInput.classList.add('border-rose-500', 'bg-rose-500/10');
      nameInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      nameInput.focus();
    }
    return false;
  }

  if (priceRaw === '' || isNaN(price) || price < 0) {
    showToast('⚠️ Informe o preço do produto!');
    if (priceInput) {
      priceInput.classList.add('border-rose-500', 'bg-rose-500/10');
      priceInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
      priceInput.focus();
    }
    return false;
  }

  // ---- Categoria ----
  let category_id = catSelect ? catSelect.value : '';
  if (!category_id) {
    if (CATEGORIES.length > 0) {
      category_id = CATEGORIES[0].id;
    } else {
      showToast('⚠️ Crie uma categoria primeiro!');
      closeProductModal();
      openCreateCategoryModal();
      return false;
    }
  }

  // ---- Preço Promo ----
  const promoPriceRaw = document.getElementById('prod-promo-price')?.value.trim() || '';
  const promo_price = promoPriceRaw !== '' && parseFloat(promoPriceRaw) > 0 
    ? parseFloat(promoPriceRaw) 
    : null;

  // ---- Outros campos ----
  const description = document.getElementById('prod-desc')?.value.trim() || '';
  const isAvailable = document.getElementById('prod-available-switch')?.checked ?? true;
  const status = isAvailable ? 'active' : 'paused';
  const featured = document.getElementById('prod-featured-switch')?.checked ?? false;
  const is_new = document.getElementById('prod-new-switch')?.checked ?? false;
  const popular = document.getElementById('prod-popular-switch')?.checked ?? false;

  // ---- Opcionais ----
  const extras = [];
  document.querySelectorAll('#product-extras-container .extra-row').forEach(row => {
    const extraName = row.querySelector('.extra-name')?.value.trim();
    if (!extraName) return;
    const extraPrice = parseFloat(row.querySelector('.extra-price')?.value) || 0;
    const extraImage = row.querySelector('.extra-image-data')?.value || '';
    extras.push({ name: extraName, price: extraPrice, image: extraImage });
  });

  // ---- Salvar ----
  if (currentEditingProductId) {
    const idx = PRODUCTS.findIndex(p => p.id === currentEditingProductId);
    if (idx !== -1) {
      PRODUCTS[idx] = {
        ...PRODUCTS[idx],
        name, category_id, price, promo_price, description,
        image: currentUploadedProductImage || PRODUCTS[idx].image || '',
        status, featured, is_new, popular, extras,
        updated_at: new Date().toISOString()
      };
      showToast(`✅ "${name}" atualizado!`);
    }
  } else {
    PRODUCTS.push({
      id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      name, category_id, price, promo_price, description,
      image: currentUploadedProductImage || '',
      status, featured, is_new, popular, extras,
      created_at: new Date().toISOString()
    });
    showToast(`🚀 "${name}" adicionado ao cardápio!`);
  }

  saveProducts();
  closeProductModal();
  renderCategoryAccordionList();
  renderStoreTopbar();
  return false;
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

  // Capa e Cor do Topo
  const coverPreview = document.getElementById('store-cover-preview');
  const coverPlaceholder = document.getElementById('store-cover-placeholder');
  const btnRemoveCover = document.getElementById('btn-remove-cover');
  const bannerColorEl = document.getElementById('store-banner-color');

  if (bannerColorEl) bannerColorEl.value = STORE_DATA.bannerColor || '#dc2626';

  if (STORE_DATA.coverBanner) {
    if (coverPreview) {
      coverPreview.src = STORE_DATA.coverBanner;
      coverPreview.classList.remove('hidden');
    }
    if (coverPlaceholder) coverPlaceholder.classList.add('hidden');
    if (btnRemoveCover) btnRemoveCover.classList.remove('hidden');
  } else {
    if (coverPreview) {
      coverPreview.src = '';
      coverPreview.classList.add('hidden');
    }
    if (coverPlaceholder) coverPlaceholder.classList.remove('hidden');
    if (btnRemoveCover) btnRemoveCover.classList.add('hidden');
  }

  // Renderizar Banners Promocionais
  renderPromoBannerRows();
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

function handleStoreCoverUpload(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(e) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_W = 1000;
      const MAX_H = 450;
      let width = img.width;
      let height = img.height;

      if (width > MAX_W) {
        height = Math.round((height * MAX_W) / width);
        width = MAX_W;
      }
      if (height > MAX_H) {
        width = Math.round((width * MAX_H) / height);
        height = MAX_H;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      STORE_DATA.coverBanner = compressedDataUrl;

      const preview = document.getElementById('store-cover-preview');
      const placeholder = document.getElementById('store-cover-placeholder');
      const btnRemove = document.getElementById('btn-remove-cover');

      if (preview) {
        preview.src = compressedDataUrl;
        preview.classList.remove('hidden');
      }
      if (placeholder) placeholder.classList.add('hidden');
      if (btnRemove) btnRemove.classList.remove('hidden');

      showToast("🖼️ Foto de Capa enviada com sucesso!");
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function removeStoreCover() {
  STORE_DATA.coverBanner = "";
  const preview = document.getElementById('store-cover-preview');
  const placeholder = document.getElementById('store-cover-placeholder');
  const btnRemove = document.getElementById('btn-remove-cover');
  const fileInput = document.getElementById('store-cover-file-input');

  if (preview) {
    preview.src = "";
    preview.classList.add('hidden');
  }
  if (placeholder) placeholder.classList.remove('hidden');
  if (btnRemove) btnRemove.classList.add('hidden');
  if (fileInput) fileInput.value = "";

  showToast("Foto de capa removida. O cardápio usará a cor de fundo.");
}

function addPromoBannerRow(title = '', image = '', url = '') {
  const container = document.getElementById('promo-banners-container');
  if (!container) return;

  const div = document.createElement('div');
  div.className = "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 promo-banner-row bg-white/[0.03] border border-white/10 rounded-2xl p-2.5 transition-all";
  const uniqueId = `promo-banner-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;

  div.innerHTML = `
    <div class="flex items-center gap-2 flex-1">
      <div class="relative w-14 h-10 rounded-xl overflow-hidden bg-black/40 border border-white/10 shrink-0 flex items-center justify-center group cursor-pointer" onclick="document.getElementById('${uniqueId}-file').click()">
        <img src="${image}" class="w-full h-full object-cover banner-img-preview ${image ? '' : 'hidden'}" onerror="this.classList.add('hidden')" />
        <span class="text-xs text-white/50 ${image ? 'hidden' : ''} banner-img-icon">🖼️</span>
        <div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white transition-opacity font-bold">Foto</div>
      </div>
      <input type="file" id="${uniqueId}-file" accept="image/*" class="hidden" onchange="handlePromoBannerUpload(event, this)" />

      <input type="text" placeholder="Título / Oferta (ex: Combo Smash por R$ 29,90)" value="${title}" class="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white banner-title focus:outline-none focus:border-brand-orange" />
    </div>

    <div class="flex items-center gap-2">
      <input type="hidden" value="${image}" class="banner-image-data" />
      <input type="url" placeholder="Ou URL da Foto" value="${image && image.startsWith('http') ? image : ''}" oninput="handlePromoBannerUrl(this)" class="hidden sm:block w-36 bg-white/5 border border-white/10 rounded-xl px-2.5 py-2 text-[11px] text-white/70 banner-image-url focus:outline-none focus:border-brand-orange" />
      <button type="button" onclick="this.closest('.promo-banner-row').remove()" class="p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs transition-colors shrink-0" title="Remover Banner">✕</button>
    </div>
  `;
  container.appendChild(div);
}

function handlePromoBannerUpload(e, inputEl) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const MAX_W = 800;
      let width = img.width;
      let height = img.height;
      if (width > MAX_W) {
        height = Math.round((height * MAX_W) / width);
        width = MAX_W;
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      const compressed = canvas.toDataURL('image/jpeg', 0.85);
      const row = inputEl.closest('.promo-banner-row');
      if (row) {
        const preview = row.querySelector('.banner-img-preview');
        const icon = row.querySelector('.banner-img-icon');
        const hiddenData = row.querySelector('.banner-image-data');
        if (preview) { preview.src = compressed; preview.classList.remove('hidden'); }
        if (icon) icon.classList.add('hidden');
        if (hiddenData) hiddenData.value = compressed;
      }
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function handlePromoBannerUrl(inputEl) {
  const url = inputEl.value.trim();
  const row = inputEl.closest('.promo-banner-row');
  if (row) {
    const preview = row.querySelector('.banner-img-preview');
    const icon = row.querySelector('.banner-img-icon');
    const hiddenData = row.querySelector('.banner-image-data');
    if (url) {
      if (preview) { preview.src = url; preview.classList.remove('hidden'); }
      if (icon) icon.classList.add('hidden');
      if (hiddenData) hiddenData.value = url;
    } else {
      if (preview) { preview.src = ''; preview.classList.add('hidden'); }
      if (icon) icon.classList.remove('hidden');
      if (hiddenData) hiddenData.value = '';
    }
  }
}

function renderPromoBannerRows() {
  const container = document.getElementById('promo-banners-container');
  if (!container) return;
  container.innerHTML = '';
  const banners = STORE_DATA.promoBanners || [];
  banners.forEach(b => addPromoBannerRow(b.title || '', b.image || '', b.url || ''));
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

  const colorEl = document.getElementById('store-banner-color');
  if (colorEl) STORE_DATA.bannerColor = colorEl.value;

  // Coletar Banners Promocionais
  const bannerRows = document.querySelectorAll('#promo-banners-container .promo-banner-row');
  const promoBanners = [];
  bannerRows.forEach(row => {
    const title = row.querySelector('.banner-title')?.value.trim() || '';
    const image = row.querySelector('.banner-image-data')?.value || row.querySelector('.banner-image-url')?.value || '';
    if (image || title) {
      promoBanners.push({ id: `banner-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, title, image });
    }
  });
  STORE_DATA.promoBanners = promoBanners;

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
  showToast("⚙️ Dados, capa e banners do restaurante atualizados!");
}

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

// -------------------------------------------------------------------------
// GESTÃO GLOBAL DE OPCIONAIS E ADICIONAIS (COM FOTOS)
// -------------------------------------------------------------------------
let currentGlobalOptImage = '';

function openOptionalsModal() {
  currentGlobalOptImage = '';
  document.getElementById('global-opt-name').value = '';
  document.getElementById('global-opt-price').value = '';
  document.getElementById('global-opt-url').value = '';
  
  const preview = document.getElementById('global-opt-img-preview');
  const icon = document.getElementById('global-opt-img-icon');
  if (preview) { preview.src = ''; preview.classList.add('hidden'); }
  if (icon) icon.classList.remove('hidden');

  renderGlobalOptionalsList();
  document.getElementById('optionals-modal').classList.remove('hidden');
}

function closeOptionalsModal() {
  document.getElementById('optionals-modal').classList.add('hidden');
}

function handleGlobalOptUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function(event) {
    const img = new Image();
    img.onload = function() {
      const maxDim = 300;
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

      currentGlobalOptImage = canvas.toDataURL('image/jpeg', 0.75);
      const preview = document.getElementById('global-opt-img-preview');
      const icon = document.getElementById('global-opt-img-icon');
      if (preview) {
        preview.src = currentGlobalOptImage;
        preview.classList.remove('hidden');
      }
      if (icon) icon.classList.add('hidden');
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);
}

function handleGlobalOptUrl(url) {
  currentGlobalOptImage = url.trim();
  const preview = document.getElementById('global-opt-img-preview');
  const icon = document.getElementById('global-opt-img-icon');
  if (url) {
    if (preview) { preview.src = url; preview.classList.remove('hidden'); }
    if (icon) icon.classList.add('hidden');
  } else {
    if (preview) { preview.src = ''; preview.classList.add('hidden'); }
    if (icon) icon.classList.remove('hidden');
  }
}

function saveGlobalOptional() {
  const name = document.getElementById('global-opt-name').value.trim();
  const priceVal = document.getElementById('global-opt-price').value.trim();
  const price = parseFloat(priceVal) || 0;

  if (!name) {
    showToast("⚠️ Informe o nome do adicional!");
    return;
  }

  let additionals = [];
  try {
    const saved = localStorage.getItem(getStoreKey('ADICIONAIS'));
    if (saved) additionals = JSON.parse(saved);
  } catch (e) {}

  additionals.push({
    id: `add-${Date.now()}`,
    title: name,
    price: price,
    image: currentGlobalOptImage || ''
  });

  localStorage.setItem(getStoreKey('ADICIONAIS'), JSON.stringify(additionals));

  // Resetar campos
  document.getElementById('global-opt-name').value = '';
  document.getElementById('global-opt-price').value = '';
  document.getElementById('global-opt-url').value = '';
  currentGlobalOptImage = '';
  const preview = document.getElementById('global-opt-img-preview');
  const icon = document.getElementById('global-opt-img-icon');
  if (preview) { preview.src = ''; preview.classList.add('hidden'); }
  if (icon) icon.classList.remove('hidden');

  renderGlobalOptionalsList();
  showToast(`✅ Adicional "${name}" salvo com sucesso!`);
}

function renderGlobalOptionalsList() {
  const container = document.getElementById('global-optionals-list');
  if (!container) return;

  let additionals = [];
  try {
    const saved = localStorage.getItem(getStoreKey('ADICIONAIS'));
    if (saved) additionals = JSON.parse(saved);
  } catch (e) {}

  if (additionals.length === 0) {
    container.innerHTML = `<div class="p-3 text-stone-500 text-xs text-center border border-dashed border-white/10 rounded-xl">Nenhum adicional cadastrado ainda.</div>`;
    return;
  }

  container.innerHTML = additionals.map(add => {
    const formattedPrice = add.price > 0 ? `R$ ${add.price.toFixed(2).replace('.', ',')}` : 'Grátis';
    const imgHtml = add.image 
      ? `<img src="${add.image}" class="w-full h-full object-cover" />`
      : `<span class="text-xs">✨</span>`;

    return `
      <div class="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl hover:border-white/20 transition-all">
        <div class="flex items-center gap-2.5">
          <div class="w-8 h-8 rounded-lg overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center shrink-0">
            ${imgHtml}
          </div>
          <div>
            <span class="font-bold text-white text-xs block">${add.title}</span>
            <span class="text-[11px] text-amber-400 font-semibold font-mono">${formattedPrice}</span>
          </div>
        </div>
        <button type="button" onclick="deleteGlobalOptional('${add.id}')" class="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs transition-colors" title="Excluir">✕</button>
      </div>
    `;
  }).join('');
}

function deleteGlobalOptional(id) {
  let additionals = [];
  try {
    const saved = localStorage.getItem(getStoreKey('ADICIONAIS'));
    if (saved) additionals = JSON.parse(saved);
  } catch (e) {}

  additionals = additionals.filter(a => a.id !== id);
  localStorage.setItem(getStoreKey('ADICIONAIS'), JSON.stringify(additionals));
  renderGlobalOptionalsList();
  showToast("Adicional removido!");
}

// -------------------------------------------------------------------------
// GESTÃO DE SABORES E VARIAÇÕES
// -------------------------------------------------------------------------
function openFlavorsModal() {
  document.getElementById('new-flavor-name').value = '';
  renderFlavorsList();
  document.getElementById('flavors-modal').classList.remove('hidden');
}

function closeFlavorsModal() {
  document.getElementById('flavors-modal').classList.add('hidden');
}

function addNewFlavor() {
  const name = document.getElementById('new-flavor-name').value.trim();
  if (!name) {
    showToast("⚠️ Digite o nome do sabor!");
    return;
  }

  let flavors = [];
  try {
    const saved = localStorage.getItem(getStoreKey('FLAVORS'));
    if (saved) flavors = JSON.parse(saved);
  } catch (e) {}

  flavors.push({ id: `flv-${Date.now()}`, name: name });
  localStorage.setItem(getStoreKey('FLAVORS'), JSON.stringify(flavors));
  document.getElementById('new-flavor-name').value = '';
  renderFlavorsList();
  showToast(`✅ Sabor "${name}" adicionado!`);
}

function renderFlavorsList() {
  const container = document.getElementById('flavors-list-container');
  if (!container) return;

  let flavors = [];
  try {
    const saved = localStorage.getItem(getStoreKey('FLAVORS'));
    if (saved) flavors = JSON.parse(saved);
  } catch (e) {}

  if (flavors.length === 0) {
    container.innerHTML = `<div class="p-3 text-stone-500 text-xs text-center border border-dashed border-white/10 rounded-xl">Nenhum sabor cadastrado ainda.</div>`;
    return;
  }

  container.innerHTML = flavors.map(f => `
    <div class="flex items-center justify-between p-2.5 bg-white/5 border border-white/10 rounded-xl">
      <span class="text-xs font-semibold text-white">🍨 ${f.name}</span>
      <button type="button" onclick="deleteFlavor('${f.id}')" class="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 text-xs">✕</button>
    </div>
  `).join('');
}

function deleteFlavor(id) {
  let flavors = [];
  try {
    const saved = localStorage.getItem(getStoreKey('FLAVORS'));
    if (saved) flavors = JSON.parse(saved);
  } catch (e) {}

  flavors = flavors.filter(f => f.id !== id);
  localStorage.setItem(getStoreKey('FLAVORS'), JSON.stringify(flavors));
  renderFlavorsList();
  showToast("Sabor removido!");
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
