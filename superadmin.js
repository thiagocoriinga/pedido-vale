/**
 * =========================================================================
 * SUPER ADMIN ENGINE • GESTÃO MULTI-LOJAS & MENSALIDADES
 * Controle completo de empresas, assinaturas, bloqueios e faturamento.
 * =========================================================================
 */

const SUPERADMIN_CONFIG_KEY = 'SUPERADMIN_PLATFORM_CONFIG';
const SUPERADMIN_TENANTS_KEY = 'SUPERADMIN_TENANTS_DATA';
const SUPERADMIN_AUTH_KEY = 'SUPERADMIN_AUTHENTICATED';

// Configuração Padrão da sua Plataforma
const DEFAULT_PLATFORM_CONFIG = {
  platformName: "Vale Pedidos • Multi-Delivery",
  adminMasterPassword: "admin",
  pixKey: "99991040222",
  pixBeneficiary: "Thiago Silva / Plataforma",
  defaultTrialDays: 7
};

// Lojas Iniciais Padrão (Mock e Semente)
const INITIAL_TENANTS = [
  {
    id: "tenant-sao-jose-001",
    slug: "sao-jose",
    name: "São José Burguer",
    segment: "Hamburgueria",
    owner_name: "Thiago",
    owner_phone: "5599991040222",
    plan: "pro",
    monthly_fee: 119.00,
    status: "active",
    due_day: 10,
    trial_ends_at: null,
    created_at: new Date().toISOString(),
    notes: "Cliente Oficial #01 • Plano Pro Ativo"
  }
];

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
  if (window.SAO_JOSE_SUPABASE && window.SAO_JOSE_SUPABASE.client) {
    window.SAO_JOSE_SUPABASE.client
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
    showSuperToast('👑 Bem-vindo ao Painel Super Admin!');
  } else {
    alert('Senha incorreta!');
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
  // 1. Cálculos de KPIs
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

  if (kpiMrr) kpiMrr.innerText = formatCurrency(mrr);
  if (kpiActive) kpiActive.innerText = `${activeTenants} lojas`;
  if (kpiTrial) kpiTrial.innerText = `${trialTenants} em teste`;
  if (kpiBlocked) kpiBlocked.innerText = `${blockedTenants} bloqueadas`;

  // Renderizar tabelas
  renderTenantsTable();
  renderFinancialTable();
  populateSettingsForm();
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
                          (t.owner_name && t.owner_name.toLowerCase().includes(search));
    const matchesSegment = filterSegment === 'all' || t.segment === filterSegment;
    const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
    return matchesSearch && matchesSegment && matchesStatus;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="p-8 text-center text-stone-400 font-poppins text-xs">
          Nenhuma empresa encontrada com os filtros selecionados.
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
      statusBadge = '<span class="px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-400 text-[10px] font-bold">⏳ Teste Grátis</span>';
    } else if (t.status === 'blocked') {
      statusBadge = '<span class="px-2.5 py-1 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold">🔴 Bloqueado</span>';
    }

    const planBadge = `<span class="px-2 py-0.5 rounded-full bg-white/10 text-stone-300 uppercase font-anton text-[9px]">${t.plan || 'pro'}</span>`;

    return `
      <tr class="border-b border-white/5 hover:bg-white/5 transition-colors font-poppins text-xs">
        <td class="p-4">
          <div class="font-anton text-sm text-white tracking-wide">${t.name}</div>
          <div class="text-[10px] text-brand-orange">/${t.slug} • <span class="text-stone-400">${t.segment || 'Geral'}</span></div>
        </td>
        <td class="p-4">
          <div class="text-white font-medium">${t.owner_name}</div>
          <a href="https://wa.me/${cleanPhone(t.owner_phone)}" target="_blank" class="text-[11px] text-emerald-400 hover:underline flex items-center gap-1">
            <span>📱 ${t.owner_phone}</span>
          </a>
        </td>
        <td class="p-4">
          <div class="flex items-center gap-2">
            ${planBadge}
            <span class="font-bold text-white">${formatCurrency(t.monthly_fee)}/mês</span>
          </div>
          <div class="text-[10px] text-stone-400">Vencimento todo dia ${t.due_day || 10}</div>
        </td>
        <td class="p-4">
          ${statusBadge}
        </td>
        <td class="p-4 text-right space-x-1">
          <button onclick="openEditTenantModal('${t.id}')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 text-xs" title="Editar Loja">
            ✏️
          </button>
          <button onclick="toggleTenantStatus('${t.id}')" class="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-stone-200 text-xs" title="${t.status === 'blocked' ? 'Desbloquear Loja' : 'Bloquear por Inadimplência'}">
            ${t.status === 'blocked' ? '🔓' : '🔒'}
          </button>
          <button onclick="sendWhatsAppBilling('${t.id}')" class="p-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs" title="Cobrar / Enviar Pix no WhatsApp">
            💬
          </button>
          <a href="../index.html" target="_blank" class="p-2 rounded-xl bg-brand-orange/20 hover:bg-brand-orange/30 text-brand-orange text-xs inline-block" title="Ver Cardápio">
            🌐
          </a>
          <button onclick="deleteTenant('${t.id}')" class="p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs" title="Excluir">
            🗑️
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// -------------------------------------------------------------------------
// MODAL: CRIAR / EDITAR LOJA
// -------------------------------------------------------------------------
let currentEditingTenantId = null;

function openCreateTenantModal() {
  currentEditingTenantId = null;
  document.getElementById('modal-tenant-title').innerText = "CADASTRAR NOVA EMPRESA / RESTAURANTE";
  document.getElementById('form-tenant').reset();
  document.getElementById('tenant-status-select').value = 'trial';
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
  document.getElementById('tenant-owner-name-input').value = tenant.owner_name || '';
  document.getElementById('tenant-owner-phone-input').value = tenant.owner_phone || '';
  document.getElementById('tenant-plan-select').value = tenant.plan || 'pro';
  document.getElementById('tenant-fee-input').value = tenant.monthly_fee || 119;
  document.getElementById('tenant-status-select').value = tenant.status || 'active';
  document.getElementById('tenant-due-day-input').value = tenant.due_day || 10;
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
  const owner_name = document.getElementById('tenant-owner-name-input').value.trim();
  const owner_phone = document.getElementById('tenant-owner-phone-input').value.trim();
  const plan = document.getElementById('tenant-plan-select').value;
  const monthly_fee = parseFloat(document.getElementById('tenant-fee-input').value) || 0;
  const status = document.getElementById('tenant-status-select').value;
  const due_day = parseInt(document.getElementById('tenant-due-day-input').value) || 10;
  const notes = document.getElementById('tenant-notes-input').value.trim();

  if (!slug) {
    slug = name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '-');
  }

  if (currentEditingTenantId) {
    // Editar
    const idx = TENANTS.findIndex(t => t.id === currentEditingTenantId);
    if (idx !== -1) {
      TENANTS[idx] = {
        ...TENANTS[idx],
        name, slug, segment, owner_name, owner_phone, plan, monthly_fee, status, due_day, notes,
        updated_at: new Date().toISOString()
      };
      showSuperToast(`✅ Empresa "${name}" atualizada!`);
    }
  } else {
    // Criar Novo
    const newTenant = {
      id: `tenant-${Date.now()}`,
      name, slug, segment, owner_name, owner_phone, plan, monthly_fee, status, due_day, notes,
      created_at: new Date().toISOString()
    };
    TENANTS.push(newTenant);
    showSuperToast(`🚀 Nova empresa "${name}" cadastrada com sucesso!`);
  }

  saveTenantsToStorage();
  closeTenantModal();
  renderSuperAdminDashboard();

  // Sincronizar com Supabase se disponível
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

  if (confirm(`Tem certeza que deseja excluir permanentemente a empresa "${tenant.name}"?`)) {
    TENANTS = TENANTS.filter(t => t.id !== id);
    saveTenantsToStorage();
    renderSuperAdminDashboard();
    showSuperToast('🗑️ Empresa removida.');
    syncTenantWithSupabase();
  }
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
📅 *Vencimento:* Dia ${t.due_day}

🔑 *Chave PIX:* \`${PLATFORM_CONFIG.pixKey}\`
👤 *Favorecido:* ${PLATFORM_CONFIG.pixBeneficiary}

Assim que realizar o pagamento, basta me enviar o comprovante por aqui para darmos baixa. 
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
        <td class="p-4 font-bold text-white">${t.name}</td>
        <td class="p-4 text-stone-300">${t.owner_name} (${t.owner_phone})</td>
        <td class="p-4 font-anton text-brand-orange">${formatCurrency(t.monthly_fee)}</td>
        <td class="p-4 text-stone-300">Todo dia ${t.due_day}</td>
        <td class="p-4">
          <span class="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-[10px]">✓ Em Dia</span>
        </td>
        <td class="p-4 text-right">
          <button onclick="sendWhatsAppBilling('${t.id}')" class="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center gap-1 ml-auto">
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
  showSuperToast('⚙️ Configurações da plataforma salvas com sucesso!');
}

// -------------------------------------------------------------------------
// NAVEGAÇÃO DE ABAS NO SUPER ADMIN
// -------------------------------------------------------------------------
function switchSuperTab(tabName) {
  document.querySelectorAll('.super-tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.super-sidebar-btn').forEach(btn => {
    btn.classList.remove('bg-brand-orange', 'text-white');
    btn.classList.add('text-stone-400');
  });

  const activeView = document.getElementById(`super-view-${tabName}`);
  const activeBtn = document.getElementById(`super-btn-${tabName}`);

  if (activeView) activeView.classList.remove('hidden');
  if (activeBtn) {
    activeBtn.classList.add('bg-brand-orange', 'text-white');
    activeBtn.classList.remove('text-stone-400');
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
    }, 2800);
  }
}

function syncTenantWithSupabase() {
  if (window.SAO_JOSE_SUPABASE && window.SAO_JOSE_SUPABASE.client) {
    window.SAO_JOSE_SUPABASE.client
      .from('tenants')
      .upsert(TENANTS, { onConflict: 'slug' })
      .then(() => console.log('☁️ [SuperAdmin] Lojas sincronizadas com Supabase.'))
      .catch(() => {});
  }
}

// Inicializar na carga
document.addEventListener('DOMContentLoaded', initSuperAdmin);
