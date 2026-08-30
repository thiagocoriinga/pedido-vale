/**
 * =========================================================================
 * PEDIDOVALE MASTER ENGINE • GESTÃO MULTI-LOJAS & FATURAMENTO
 * Identidade visual e motor de alta conversão inspirado no São José Burguer
 * =========================================================================
 */

const SUPERADMIN_CONFIG_KEY = 'SUPERADMIN_PLATFORM_CONFIG';
const SUPERADMIN_TENANTS_KEY = 'SUPERADMIN_TENANTS_DATA';
const SUPERADMIN_AUTH_KEY = 'SUPERADMIN_AUTHENTICATED';

// Configuração Padrão da Plataforma PedidoVale
const DEFAULT_PLATFORM_CONFIG = {
  platformName: "PedidoVale • Multi-Delivery",
  adminMasterPassword: "admin",
  pixKey: "99991040222",
  pixBeneficiary: "Thiago Siqueira / PedidoVale",
  defaultTrialDays: 7
};

// Lojas Iniciais Padrão (Inicia limpo para novas empresas cadastradas)
const INITIAL_TENANTS = [];

let TENANTS = [];
let PLATFORM_CONFIG = DEFAULT_PLATFORM_CONFIG;

// Inicialização
function initSuperAdmin() {
  loadPlatformConfig();
  loadTenants();
  checkAuth();
}

function loadPlatformConfig() {
  try {
    const saved = localStorage.getItem(SUPERADMIN_CONFIG_KEY);
    if (saved) {
      PLATFORM_CONFIG = { ...DEFAULT_PLATFORM_CONFIG, ...JSON.parse(saved) };
    }
  } catch (e) {}
}

function savePlatformConfig() {
  localStorage.setItem(SUPERADMIN_CONFIG_KEY, JSON.stringify(PLATFORM_CONFIG));
}

function loadTenants() {
  try {
    const saved = localStorage.getItem(SUPERADMIN_TENANTS_KEY);
    if (saved) {
      TENANTS = JSON.parse(saved);
    } else {
      TENANTS = [...INITIAL_TENANTS];
      saveTenantsToStorage();
    }
  } catch (e) {
    TENANTS = [...INITIAL_TENANTS];
  }

  // Tentar sincronizar da nuvem Supabase
  if (window.supabase && window.supabaseClient) {
    window.supabaseClient
      .from('tenants')
      .select('*')
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) {
          TENANTS = data;
          saveTenantsToStorage();
          renderSuperAdminDashboard();
        }
      })
      .catch(() => {});
  }
}

function saveTenantsToStorage() {
  localStorage.setItem(SUPERADMIN_TENANTS_KEY, JSON.stringify(TENANTS));
}

// -------------------------------------------------------------------------
// AUTENTICAÇÃO DO SUPER ADMIN
// -------------------------------------------------------------------------
function checkAuth() {
  const isAuth = sessionStorage.getItem(SUPERADMIN_AUTH_KEY) === 'true';
  const loginScreen = document.getElementById('superadmin-login-screen');
  const mainLayout = document.getElementById('superadmin-main-layout');

  if (isAuth) {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (mainLayout) mainLayout.classList.remove('hidden');
    renderSuperAdminDashboard();
  } else {
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (mainLayout) mainLayout.classList.add('hidden');
  }
}

function handleSuperAdminLogin(e) {
  e.preventDefault();
  const pass = document.getElementById('superadmin-password-input').value;

  if (pass === PLATFORM_CONFIG.adminMasterPassword) {
    sessionStorage.setItem(SUPERADMIN_AUTH_KEY, 'true');
    checkAuth();
    showSuperToast('👑 Bem-vindo ao Super Admin PedidoVale!');
  } else {
    alert('Senha incorreta! A senha padrão é: admin');
  }
}

function handleSuperAdminLogout() {
  sessionStorage.removeItem(SUPERADMIN_AUTH_KEY);
  checkAuth();
}

// -------------------------------------------------------------------------
// DASHBOARD & MÉTRICAS (MRR, LOJAS ATIVAS, TRIAL)
// -------------------------------------------------------------------------
function renderSuperAdminDashboard() {
  const totalTenants = TENANTS.length;
  const activeTenants = TENANTS.filter(t => t.status === 'active').length;
  const trialTenants = TENANTS.filter(t => t.status === 'trial').length;
  const blockedTenants = TENANTS.filter(t => t.status === 'blocked').length;

  // MRR (Faturamento Recorrente Mensal das lojas ativas)
  const mrr = TENANTS
    .filter(t => t.status === 'active' || t.status === 'trial')
    .reduce((sum, t) => sum + (parseFloat(t.monthly_fee) || 0), 0);

  // Preencher elementos de tela
  const kpiMrr = document.getElementById('kpi-mrr');
  const kpiActive = document.getElementById('kpi-active-stores');
  const kpiTrial = document.getElementById('kpi-trial-stores');
  const kpiBlocked = document.getElementById('kpi-blocked-stores');
  const summaryPix = document.getElementById('summary-pix-key');

  if (kpiMrr) kpiMrr.innerText = formatCurrency(mrr);
  if (kpiActive) kpiActive.innerText = `${activeTenants} lojas`;
  if (kpiTrial) kpiTrial.innerText = `${trialTenants} em teste`;
  if (kpiBlocked) kpiBlocked.innerText = `${blockedTenants} bloqueadas`;
  if (summaryPix) summaryPix.innerText = PLATFORM_CONFIG.pixKey || 'Não configurada';

  // Renderizar componentes
  renderDashboardGrid();
  renderTenantsTable();
  renderFinancialTable();
  populateSettingsForm();
}

// -------------------------------------------------------------------------
// RENDERIZAÇÃO DOS CARDS NO DASHBOARD
// -------------------------------------------------------------------------
function renderDashboardGrid() {
  const grid = document.getElementById('dashboard-tenants-grid');
  if (!grid) return;

  if (TENANTS.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full p-8 text-center bg-[#120D0A] border border-brand-darkBorder rounded-3xl text-brand-textMuted text-xs font-poppins">
        Nenhum restaurante cadastrado ainda. Clique em "+ Nova Empresa" para começar!
      </div>
    `;
    return;
  }

  grid.innerHTML = TENANTS.slice(0, 6).map(t => {
    let statusClass = 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
    let statusText = '🟢 Ativo';
    if (t.status === 'trial') {
      statusClass = 'bg-amber-500/15 border-amber-500/30 text-amber-400';
      statusText = '⏳ Teste 7D';
    } else if (t.status === 'blocked') {
      statusClass = 'bg-rose-500/15 border-rose-500/30 text-rose-400';
      statusText = '🔴 Bloqueado';
    }

    const segmentIcon = getSegmentIcon(t.segment);

    return `
      <div class="bg-[#120D0A]/95 border border-brand-darkBorder hover:border-brand-orange/40 rounded-3xl p-5 shadow-card-dark space-y-4 transition-all group">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-brand-orange/20 to-brand-amber/20 border border-brand-orange/30 flex items-center justify-center text-xl shrink-0">
              ${segmentIcon}
            </div>
            <div>
              <h4 class="font-anton text-base text-white tracking-wide leading-tight group-hover:text-brand-orange transition-colors">${t.name}</h4>
              <div class="text-[11px] text-brand-textMuted">/${t.slug} • <span class="text-stone-400">${t.segment || 'Geral'}</span></div>
            </div>
          </div>
          <span class="px-2.5 py-1 rounded-full border text-[10px] font-bold ${statusClass}">
            ${statusText}
          </span>
        </div>

        <div class="bg-black/40 rounded-2xl p-3 flex items-center justify-between text-xs">
          <div>
            <span class="text-[10px] text-brand-textMuted block font-semibold">MENSALIDADE:</span>
            <span class="font-anton text-white text-sm">${formatCurrency(t.monthly_fee)}/mês</span>
          </div>
          <div class="text-right">
            <span class="text-[10px] text-brand-textMuted block font-semibold">VENCIMENTO:</span>
            <span class="text-stone-300 font-bold text-xs">Todo dia ${t.due_day || 10}</span>
          </div>
        </div>

        <div class="flex items-center gap-2 pt-1">
          <a href="admin.html?store=${t.slug}" target="_blank" class="flex-1 bg-brand-orange hover:bg-brand-orangeHover text-white py-2.5 rounded-xl font-anton text-xs tracking-wider flex items-center justify-center gap-1.5 shadow-orange-glow transition-all">
            <span>⚙️</span>
            <span>GERENCIAR PRODUTOS</span>
          </a>
          <a href="cardapio.html?store=${t.slug}" target="_blank" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-brand-orange border border-brand-orange/30 text-xs transition-all" title="Ver Cardápio do Cliente">
            ↗️
          </a>
          <button onclick="sendWhatsAppBilling('${t.id}')" class="p-2.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500 text-emerald-400 hover:text-white border border-emerald-500/30 text-xs transition-all" title="Cobrar no WhatsApp">
            💬
          </button>
          <button onclick="openEditTenantModal('${t.id}')" class="p-2.5 rounded-xl bg-white/5 hover:bg-white/15 text-stone-300 hover:text-white border border-white/10 text-xs transition-all" title="Editar">
            ✏️
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// -------------------------------------------------------------------------
// GESTÃO DE EMPRESAS / TENANTS (TABELA & CRUD)
// -------------------------------------------------------------------------
function renderTenantsTable() {
  const tbody = document.getElementById('tenants-table-body');
  const search = (document.getElementById('tenant-search-input')?.value || '').toLowerCase();
  const filterSegment = document.getElementById('tenant-filter-segment')?.value || 'all';
  const filterStatus = document.getElementById('tenant-filter-status')?.value || 'all';

  if (!tbody) return;

  const filtered = TENANTS.filter(t => {
    const matchesSearch = t.name.toLowerCase().includes(search) || 
                          t.slug.toLowerCase().includes(search) || 
                          (t.owner_name && t.owner_name.toLowerCase().includes(search)) ||
                          (t.city && t.city.toLowerCase().includes(search)) ||
                          (t.owner_phone && t.owner_phone.includes(search));
    const matchesSegment = filterSegment === 'all' || t.segment === filterSegment;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesSegment && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="p-8 text-center text-brand-textMuted font-poppins text-xs">
          Nenhuma empresa encontrada. Cadastre uma nova loja acima ou aguarde novos cadastros pelo site.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    let statusBadge = '';
    if (t.status === 'active') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">🟢 Ativo (Pago)</span>';
    } else if (t.status === 'trial') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold">⏳ Teste 7 Dias</span>';
    } else if (t.status === 'blocked') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 text-[10px] font-bold">🔴 Bloqueado</span>';
    }

    const planBadge = `<span class="px-2 py-0.5 rounded-full bg-white/10 text-stone-300 uppercase font-anton text-[9px]">${t.plan || 'pro'}</span>`;
    const segmentIcon = getSegmentIcon(t.segment);

    return `
      <tr class="border-b border-white/5 hover:bg-white/5 transition-colors font-poppins text-xs">
        <td class="p-4">
          <div class="flex items-center gap-2.5">
            <span class="text-xl">${segmentIcon}</span>
            <div>
              <div class="font-anton text-sm text-white tracking-wide">${t.name}</div>
              <div class="text-[11px] text-brand-orange font-mono">pedidovale.com.br/${t.slug}</div>
              <div class="text-[10px] text-stone-400 mt-0.5">
                <span>${t.segment || 'Hamburgueria'}</span>
                ${t.city ? ` • <span class="text-stone-300">📍 ${t.city}</span>` : ''}
              </div>
            </div>
          </div>
        </td>
        <td class="p-4">
          <div class="text-white font-bold">${t.owner_name}</div>
          <a href="https://wa.me/${cleanPhone(t.owner_phone)}" target="_blank" class="text-[11px] text-emerald-400 hover:underline flex items-center gap-1 mt-0.5 font-semibold">
            <span>💬 WhatsApp: ${t.owner_phone}</span>
          </a>
          ${t.password ? `<div class="text-[10px] text-amber-300/90 font-mono mt-0.5">🔑 Senha: <span class="bg-black/40 px-1.5 py-0.5 rounded text-amber-400 font-bold select-all">${t.password}</span></div>` : ''}
        </td>
        <td class="p-4">
          <div class="flex items-center gap-2">
            ${planBadge}
            <span class="font-anton text-white text-sm">${formatCurrency(t.monthly_fee)}/mês</span>
          </div>
          <div class="text-[10px] text-stone-400 mt-0.5">Vencimento todo dia ${t.due_day || 10}</div>
        </td>
        <td class="p-4">
          ${statusBadge}
        </td>
        <td class="p-4 text-right space-x-1.5 whitespace-nowrap">
          <a href="admin.html?store=${t.slug}" target="_blank" class="p-2 rounded-xl bg-white/10 hover:bg-brand-orange hover:text-white text-stone-200 text-xs inline-block font-semibold transition-all" title="Acessar Painel do Restaurante">
            ⚙️ Painel
          </a>
          <a href="cardapio.html?store=${t.slug}" target="_blank" class="p-2 rounded-xl bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange text-xs inline-block font-semibold transition-all" title="Ver Cardápio do Cliente">
            🍔 Cardápio
          </a>
          <button onclick="sendWhatsAppBilling('${t.id}')" class="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs transition-all" title="Cobrar / Enviar Pix no WhatsApp">
            💬
          </button>
          <button onclick="toggleTenantStatus('${t.id}')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 text-xs transition-all" title="${t.status === 'blocked' ? 'Desbloquear Loja' : 'Bloquear por Inadimplência'}">
            ${t.status === 'blocked' ? '🔓' : '🔒'}
          </button>
          <button onclick="openEditTenantModal('${t.id}')" class="p-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-xs transition-all font-semibold" title="Editar Tudo da Loja">
            ✏️ Editar
          </button>
          <button onclick="deleteTenant('${t.id}')" class="p-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 text-xs transition-all" title="Excluir Loja">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------------------
// MODAL: CRIAR / EDITAR LOJA COMPLETO
// -------------------------------------------------------------------------
let currentEditingTenantId = null;

function openCreateTenantModal() {
  currentEditingTenantId = null;
  document.getElementById('modal-tenant-title').innerText = "CADASTRAR NOVO RESTAURANTE";
  document.getElementById('form-tenant').reset();
  document.getElementById('tenant-status-select').value = 'active';
  document.getElementById('tenant-fee-input').value = '119.00';
  document.getElementById('tenant-due-day-input').value = '10';

  const modal = document.getElementById('tenant-modal');
  modal.classList.remove('hidden');
}

function openEditTenantModal(id) {
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return;

  currentEditingTenantId = id;
  document.getElementById('modal-tenant-title').innerText = `EDITAR: ${tenant.name.toUpperCase()}`;
  document.getElementById('tenant-name-input').value = tenant.name || '';
  document.getElementById('tenant-slug-input').value = tenant.slug || '';
  document.getElementById('tenant-segment-select').value = tenant.segment || 'Hamburgueria';
  document.getElementById('tenant-city-input').value = tenant.city || '';
  document.getElementById('tenant-owner-name-input').value = tenant.owner_name || '';
  document.getElementById('tenant-owner-phone-input').value = tenant.owner_phone || '';
  document.getElementById('tenant-password-input').value = tenant.password || '';
  document.getElementById('tenant-plan-select').value = tenant.plan || 'pro';
  document.getElementById('tenant-fee-input').value = tenant.monthly_fee || 119;
  document.getElementById('tenant-due-day-input').value = tenant.due_day || 10;
  document.getElementById('tenant-status-select').value = tenant.status || 'active';
  document.getElementById('tenant-pix-key-input').value = tenant.pixKey || tenant.owner_phone || '';
  document.getElementById('tenant-notes-input').value = tenant.notes || '';

  const modal = document.getElementById('tenant-modal');
  modal.classList.remove('hidden');
}

function closeTenantModal() {
  document.getElementById('tenant-modal').classList.add('hidden');
}

function saveTenantForm(e) {
  e.preventDefault();

  const name = document.getElementById('tenant-name-input').value.trim();
  let slug = document.getElementById('tenant-slug-input').value.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '-');
  const segment = document.getElementById('tenant-segment-select').value;
  const city = document.getElementById('tenant-city-input').value.trim();
  const owner_name = document.getElementById('tenant-owner-name-input').value.trim();
  const owner_phone = document.getElementById('tenant-owner-phone-input').value.trim();
  const password = document.getElementById('tenant-password-input').value.trim();
  const plan = document.getElementById('tenant-plan-select').value;
  const monthly_fee = parseFloat(document.getElementById('tenant-fee-input').value) || 0;
  const status = document.getElementById('tenant-status-select').value;
  const due_day = parseInt(document.getElementById('tenant-due-day-input').value) || 10;
  const pixKey = document.getElementById('tenant-pix-key-input').value.trim();
  const notes = document.getElementById('tenant-notes-input').value.trim();

  if (!slug) {
    slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
  }

  if (currentEditingTenantId) {
    const idx = TENANTS.findIndex(t => t.id === currentEditingTenantId);
    if (idx !== -1) {
      TENANTS[idx] = {
        ...TENANTS[idx],
        name, slug, segment, city, owner_name, owner_phone, password, plan, monthly_fee, status, due_day, pixKey, notes,
        updated_at: new Date().toISOString()
      };
      showSuperToast(`✅ Restaurante "${name}" atualizado com sucesso!`);
    }
  } else {
    const newTenant = {
      id: `tenant-${Date.now()}`,
      name, slug, segment, city, owner_name, owner_phone, password, plan, monthly_fee, status, due_day, pixKey, notes,
      created_at: new Date().toISOString()
    };
    TENANTS.push(newTenant);
    showSuperToast(`🚀 Restaurante "${name}" cadastrado com sucesso!`);
  }

  // Sincronizar dados diretamente na chave de configuração da loja
  try {
    const storeConfigKey = `STORE_${slug}_CONFIG`;
    let storeConfig = {};
    const existing = localStorage.getItem(storeConfigKey);
    if (existing) storeConfig = JSON.parse(existing);

    storeConfig.name = name;
    storeConfig.slug = slug;
    storeConfig.segment = segment;
    storeConfig.address = city || storeConfig.address || "Atendimento Online";
    storeConfig.whatsapp = owner_phone;
    storeConfig.pixKey = pixKey || owner_phone;
    storeConfig.pixName = owner_name;
    localStorage.setItem(storeConfigKey, JSON.stringify(storeConfig));
  } catch (err) {}

  saveTenantsToStorage();
  closeTenantModal();
  renderSuperAdminDashboard();
  syncTenantWithSupabase();
}

function toggleTenantStatus(id) {
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return;

  if (tenant.status === 'blocked') {
    tenant.status = 'active';
    showSuperToast(`🟢 Loja "${tenant.name}" desbloqueada com sucesso!`);
  } else {
    tenant.status = 'blocked';
    showSuperToast(`🔒 Loja "${tenant.name}" bloqueada por inadimplência.`);
  }

  saveTenantsToStorage();
  renderSuperAdminDashboard();
  syncTenantWithSupabase();
}

function deleteTenant(id) {
  const tenant = TENANTS.find(t => t.id === id);
  if (!tenant) return;

  if (confirm(`⚠️ Tem certeza que deseja excluir permanentemente o restaurante "${tenant.name}" (/ ${tenant.slug})?\n\nIsso removerá o cadastro e os dados da loja.`)) {
    // Limpar dados locais da loja
    try {
      localStorage.removeItem(`STORE_${tenant.slug}_CONFIG`);
      localStorage.removeItem(`STORE_${tenant.slug}_PRODUCTS`);
      localStorage.removeItem(`STORE_${tenant.slug}_ORDERS`);
      localStorage.removeItem(`STORE_${tenant.slug}_CATEGORIES`);
    } catch (e) {}

    TENANTS = TENANTS.filter(t => t.id !== id);
    saveTenantsToStorage();
    renderSuperAdminDashboard();
    showSuperToast(`🗑️ Restaurante "${tenant.name}" excluído com sucesso.`);
    syncTenantWithSupabase();
  }
}

// -------------------------------------------------------------------------
// SIMULADOR DO APP DO CLIENTE (MOLDURA MOBILE)
// -------------------------------------------------------------------------
function openClientAppSimulator() {
  const modal = document.getElementById('client-simulator-modal');
  if (modal) modal.classList.remove('hidden');
}

function closeClientAppSimulator() {
  const modal = document.getElementById('client-simulator-modal');
  if (modal) modal.classList.add('hidden');
}

// -------------------------------------------------------------------------
// COBRANÇA AUTOMÁTICA VIA WHATSAPP (MENSAGEM COM CHAVE PIX)
// -------------------------------------------------------------------------
function sendWhatsAppBilling(id) {
  const t = TENANTS.find(item => item.id === id);
  if (!t) return;

  const phone = cleanPhone(t.owner_phone);
  const feeFormatted = formatCurrency(t.monthly_fee);
  const dateObj = new Date();
  const currentMonth = dateObj.toLocaleString('pt-BR', { month: 'long' });

  const msg = 
`Olá, *${t.owner_name}* (${t.name})! Tudo bem? 🍔

Aqui é da equipe do *${PLATFORM_CONFIG.platformName}*.
Passando para enviar o lembrete da mensalidade da sua plataforma de pedidos referente ao mês de *${currentMonth}*:

📋 *Plano:* ${t.plan.toUpperCase()}
💰 *Valor:* ${feeFormatted}
📅 *Vencimento:* Todo dia ${t.due_day}

🔑 *Chave PIX:* \`${PLATFORM_CONFIG.pixKey}\`
👤 *Favorecido:* ${PLATFORM_CONFIG.pixBeneficiary}

Assim que realizar o pagamento, basta me enviar o comprovante por aqui para darmos baixa automática.
Qualquer dúvida, estamos à disposição! 🚀`;

  const encoded = encodeURIComponent(msg);
  window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
}

// -------------------------------------------------------------------------
// TABELA FINANCEIRA & MENSALIDADES
// -------------------------------------------------------------------------
function renderFinancialTable() {
  const tbody = document.getElementById('financial-table-body');
  if (!tbody) return;

  tbody.innerHTML = TENANTS.map(t => {
    return `
      <tr class="border-b border-white/5 hover:bg-white/5 transition-colors font-poppins text-xs">
        <td class="p-4">
          <div class="font-bold text-white">${t.name}</div>
          <div class="text-[10px] text-brand-orange">/${t.slug}</div>
        </td>
        <td class="p-4 text-stone-300">${t.owner_name} (${t.owner_phone})</td>
        <td class="p-4 font-anton text-brand-orange text-sm">${formatCurrency(t.monthly_fee)}</td>
        <td class="p-4 text-stone-300 font-semibold">Todo dia ${t.due_day}</td>
        <td class="p-4">
          <span class="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">✓ Em Dia</span>
        </td>
        <td class="p-4 text-right">
          <button onclick="sendWhatsAppBilling('${t.id}')" class="px-3.5 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1.5 ml-auto transition-colors">
            <span>💬 Cobrar no Zap</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------------------
// CONFIGURAÇÕES DA PLATAFORMA
// -------------------------------------------------------------------------
function populateSettingsForm() {
  const nameEl = document.getElementById('setting-platform-name');
  const pixKeyEl = document.getElementById('setting-platform-pix');
  const pixBeneficiaryEl = document.getElementById('setting-platform-beneficiary');

  if (nameEl) nameEl.value = PLATFORM_CONFIG.platformName || '';
  if (pixKeyEl) pixKeyEl.value = PLATFORM_CONFIG.pixKey || '';
  if (pixBeneficiaryEl) pixBeneficiaryEl.value = PLATFORM_CONFIG.pixBeneficiary || '';
}

function savePlatformSettingsForm(e) {
  e.preventDefault();

  PLATFORM_CONFIG.platformName = document.getElementById('setting-platform-name').value.trim();
  PLATFORM_CONFIG.pixKey = document.getElementById('setting-platform-pix').value.trim();
  PLATFORM_CONFIG.pixBeneficiary = document.getElementById('setting-platform-beneficiary').value.trim();

  const newPass = document.getElementById('setting-platform-password').value.trim();
  if (newPass) {
    PLATFORM_CONFIG.adminMasterPassword = newPass;
  }

  savePlatformConfig();
  renderSuperAdminDashboard();
  showSuperToast('⚙️ Configurações da plataforma salvas com sucesso!');
}

function copyMasterPixKey() {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(PLATFORM_CONFIG.pixKey).then(() => {
      showSuperToast('📋 Chave PIX copiada para a área de transferência!');
    });
  } else {
    showSuperToast(`Chave PIX: ${PLATFORM_CONFIG.pixKey}`);
  }
}

// -------------------------------------------------------------------------
// NAVEGAÇÃO DE ABAS
// -------------------------------------------------------------------------
function switchSuperTab(tabName) {
  document.querySelectorAll('.super-tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.super-sidebar-btn').forEach(btn => {
    btn.classList.remove('bg-brand-orange', 'text-white', 'shadow-orange-glow');
    btn.classList.add('text-brand-textMuted');
  });

  const activeView = document.getElementById(`super-view-${tabName}`);
  const activeBtn = document.getElementById(`super-btn-${tabName}`);

  if (activeView) activeView.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-brand-orange', 'text-white', 'shadow-orange-glow');
    activeBtn.classList.remove('text-brand-textMuted');
  }
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

function getSegmentIcon(segment) {
  switch (segment) {
    case 'Hamburgueria': return '🍔';
    case 'Pizzaria': return '🍕';
    case 'Açaí': return '🍧';
    case 'Sushi': return '🍣';
    case 'Marmitaria': return '🍛';
    case 'Doceria': return '🍰';
    default: return '🍽️';
  }
}

function showSuperToast(msg) {
  const toast = document.getElementById('superadmin-toast');
  const text = document.getElementById('superadmin-toast-text');
  if (toast && text) {
    text.innerText = msg;
    toast.classList.remove('translate-y-20', 'opacity-0', 'pointer-events-none');
    toast.classList.add('translate-y-0', 'opacity-100');
    setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-20', 'opacity-0', 'pointer-events-none');
    }, 3000);
  }
}

function syncTenantWithSupabase() {
  if (window.supabase && window.supabaseClient) {
    window.supabaseClient
      .from('tenants')
      .upsert(TENANTS, { onConflict: 'slug' })
      .then(() => console.log('☁️ [SuperAdmin] Lojas sincronizadas com Supabase.'))
      .catch(() => {});
  }
}

// Inicializar na carga
document.addEventListener('DOMContentLoaded', initSuperAdmin);
