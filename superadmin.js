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

// Lojas Demo para apresentação de beta — dados fictícios completos e profissionais
const INITIAL_TENANTS = [
  {
    id: "tenant-demo-001",
    slug: "rei-combo",
    name: "Rei Combo • Smash Burgers",
    segment: "Hamburgueria",
    city: "Pedreiras - MA",
    owner_name: "Thiago Coringa de Siqueira",
    owner_phone: "5599991040222",
    password: "reicmb2024",
    plan: "vip",
    monthly_fee: 189.00,
    status: "active",
    due_day: 10,
    pixKey: "5599991040222",
    notes: "Loja principal do dono da plataforma. Conta VIP.",
    created_at: "2026-07-01T12:00:00.000Z"
  },
  {
    id: "tenant-demo-002",
    slug: "bella-pizza",
    name: "Bella Pizza & Massas",
    segment: "Pizzaria",
    city: "São Luís - MA",
    owner_name: "Maria Fernanda Costa",
    owner_phone: "5598987654321",
    password: "bellapizza2024",
    plan: "pro",
    monthly_fee: 119.00,
    status: "active",
    due_day: 15,
    pixKey: "98.765.432/0001-99",
    notes: "Melhor pizzaria artesanal de São Luís. Paga em dia.",
    created_at: "2026-07-15T09:00:00.000Z"
  },
  {
    id: "tenant-demo-003",
    slug: "acai-do-norte",
    name: "Açaí do Norte Premium",
    segment: "Açaí",
    city: "Imperatriz - MA",
    owner_name: "Carlos Eduardo Moraes",
    owner_phone: "5599881234567",
    password: "acainorte2024",
    plan: "pro",
    monthly_fee: 119.00,
    status: "trial",
    due_day: 20,
    pixKey: "5599881234567",
    notes: "Novo cliente. Em período de teste de 7 dias.",
    created_at: "2026-08-28T14:00:00.000Z",
    trial_ends_at: "2026-09-04T14:00:00.000Z"
  },
  {
    id: "tenant-demo-004",
    slug: "sushi-zen",
    name: "Sushi Zen • Gastronomia Japonesa",
    segment: "Sushi",
    city: "Teresina - PI",
    owner_name: "Ana Koyama",
    owner_phone: "5586991234567",
    password: "sushizen2024",
    plan: "vip",
    monthly_fee: 189.00,
    status: "active",
    due_day: 5,
    pixKey: "ana.koyama@sushizen.com.br",
    notes: "Conta VIP. Quer integração com iFood.",
    created_at: "2026-06-10T08:00:00.000Z"
  },
  {
    id: "tenant-demo-005",
    slug: "marmita-da-dora",
    name: "Marmita da Dora • Comida Caseira",
    segment: "Marmitaria",
    city: "Caxias - MA",
    owner_name: "Teodora Alves de Sousa",
    owner_phone: "5599971112233",
    password: "dora2024",
    plan: "basic",
    monthly_fee: 79.00,
    status: "blocked",
    due_day: 8,
    pixKey: "5599971112233",
    notes: "Bloqueada por 2 meses de inadimplência. Aguardando regularização.",
    created_at: "2026-05-20T10:00:00.000Z"
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
      const savedTenants = JSON.parse(saved);
      // Mesclar: manter dados do usuário, adicionar demos que não existam ainda
      const existingSlugs = new Set(savedTenants.map(t => t.slug));
      const missingDemos = INITIAL_TENANTS.filter(d => !existingSlugs.has(d.slug));
      TENANTS = [...savedTenants, ...missingDemos];
      if (missingDemos.length > 0) {
        saveTenantsToStorage();
        // Inicializar dados das lojas demo que ainda não existem
        missingDemos.forEach(t => initDemoStoreData(t));
      }
    } else {
      TENANTS = [...INITIAL_TENANTS];
      saveTenantsToStorage();
      // Inicializar dados de todas as lojas demo
      INITIAL_TENANTS.forEach(t => initDemoStoreData(t));
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
// INICIALIZAR DADOS COMPLETOS DE LOJAS DEMO (Cardápio fictício profissional)
// -------------------------------------------------------------------------
function initDemoStoreData(tenant) {
  const slug = tenant.slug;

  // Config da loja
  if (!localStorage.getItem(`STORE_${slug}_CONFIG`)) {
    const configs = {
      'rei-combo': {
        name: "Rei Combo • Smash Burgers",
        slug: 'rei-combo',
        segment: 'Hamburgueria',
        isOpen: true,
        whatsapp: '5599991040222',
        address: 'Rua das Hamburguerias, 42 • Centro • Pedreiras - MA',
        hours: 'Segunda a Domingo das 18h às 23h30',
        deliveryFee: 5.00,
        deliveryTime: '25 - 40 min',
        minOrder: 20.00,
        allowPickup: true,
        pixKey: '5599991040222',
        pixType: 'phone',
        pixName: 'Thiago Siqueira',
        acceptPix: true,
        acceptCard: true,
        acceptCash: true,
        tagline: 'O melhor smash burger do Maranhão',
        bannerColor: '#dc2626',
        coverBanner: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=1200&q=80'
      },
      'bella-pizza': {
        name: 'Bella Pizza & Massas',
        slug: 'bella-pizza',
        segment: 'Pizzaria',
        isOpen: true,
        whatsapp: '5598987654321',
        address: 'Av. Getúlio Vargas, 1500 • Cohama • São Luís - MA',
        hours: 'Terça a Domingo das 19h às 23h',
        deliveryFee: 7.00,
        deliveryTime: '40 - 60 min',
        minOrder: 35.00,
        allowPickup: true,
        pixKey: '98.765.432/0001-99',
        pixType: 'cnpj',
        pixName: 'Bella Pizza LTDA',
        acceptPix: true,
        acceptCard: true,
        acceptCash: false,
        tagline: 'Pizza artesanal com massa de fermentação natural',
        bannerColor: '#c2410c',
        coverBanner: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=1200&q=80'
      },
      'acai-do-norte': {
        name: 'Açaí do Norte Premium',
        slug: 'acai-do-norte',
        segment: 'Açaí',
        isOpen: true,
        whatsapp: '5599881234567',
        address: 'Rua Cônego João Paulo, 88 • Centro • Imperatriz - MA',
        hours: 'Todos os dias das 14h às 22h',
        deliveryFee: 4.00,
        deliveryTime: '20 - 35 min',
        minOrder: 15.00,
        allowPickup: true,
        pixKey: '5599881234567',
        pixType: 'phone',
        pixName: 'Carlos Eduardo Moraes',
        acceptPix: true,
        acceptCard: true,
        acceptCash: true,
        tagline: 'Açaí premium do norte com 30+ complementos',
        bannerColor: '#7e22ce',
        coverBanner: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=1200&q=80'
      },
      'sushi-zen': {
        name: 'Sushi Zen • Gastronomia Japonesa',
        slug: 'sushi-zen',
        segment: 'Sushi',
        isOpen: true,
        whatsapp: '5586991234567',
        address: 'Av. Jóquei Clube, 277 • Horto • Teresina - PI',
        hours: 'Quarta a Segunda das 19h às 23h30',
        deliveryFee: 10.00,
        deliveryTime: '45 - 65 min',
        minOrder: 60.00,
        allowPickup: true,
        pixKey: 'ana.koyama@sushizen.com.br',
        pixType: 'email',
        pixName: 'Ana Koyama',
        acceptPix: true,
        acceptCard: true,
        acceptCash: false,
        tagline: 'Autêntica gastronomia japonesa no coração do Piauí',
        bannerColor: '#0f172a',
        coverBanner: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=1200&q=80'
      },
      'marmita-da-dora': {
        name: 'Marmita da Dora • Comida Caseira',
        slug: 'marmita-da-dora',
        segment: 'Marmitaria',
        isOpen: false,
        whatsapp: '5599971112233',
        address: 'Rua do Pará, 190 • Deodara • Caxias - MA',
        hours: 'Segunda a Sábado das 11h às 14h',
        deliveryFee: 3.00,
        deliveryTime: '30 - 50 min',
        minOrder: 12.00,
        allowPickup: true,
        pixKey: '5599971112233',
        pixType: 'phone',
        pixName: 'Teodora Alves',
        acceptPix: true,
        acceptCard: false,
        acceptCash: true,
        tagline: 'Marmita caseira com amor e muito sabor',
        bannerColor: '#065f46',
        coverBanner: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=1200&q=80'
      }
    };
    const config = configs[slug];
    if (config) {
      localStorage.setItem(`STORE_${slug}_CONFIG`, JSON.stringify(config));
    }
  }

  // Categorias da loja
  if (!localStorage.getItem(`STORE_${slug}_CATEGORIES`)) {
    const catsBySlug = {
      'rei-combo': [
        { id: 'cat-combos', name: 'COMBOS ESPECIAIS', icon: '🔥', desc: 'Combos exclusivos do Rei Combo', visible: true },
        { id: 'cat-smash', name: 'SMASH BURGERS', icon: '🍔', desc: 'Burgers artesanais na chapa quente', visible: true },
        { id: 'cat-porcoes', name: 'PORÇÕES & FRITAS', icon: '🍟', desc: 'Batatas, anéis e porções crocantes', visible: true },
        { id: 'cat-bebidas', name: 'BEBIDAS', icon: '🥤', desc: 'Refrigerantes, sucos e milkshakes', visible: true }
      ],
      'bella-pizza': [
        { id: 'cat-trad', name: 'PIZZAS TRADICIONAIS', icon: '🍕', desc: 'Sabores clássicos que nunca saem de moda', visible: true },
        { id: 'cat-prem', name: 'PIZZAS PREMIUM', icon: '⭐', desc: 'Ingredientes nobres e receitas exclusivas', visible: true },
        { id: 'cat-massa', name: 'MASSAS & RISOTOS', icon: '🍝', desc: 'Massas artesanais direto da Itália', visible: true },
        { id: 'cat-beb', name: 'BEBIDAS', icon: '🍷', desc: 'Vinhos, cervejas e refrigerantes', visible: true }
      ],
      'acai-do-norte': [
        { id: 'cat-tigelas', name: 'TIGELAS PREMIUM', icon: '🫙', desc: 'Açaí batido na hora nas tigelas exclusivas', visible: true },
        { id: 'cat-copo', name: 'COPO DO NORTE', icon: '🍹', desc: 'Porções no copo com 20+ opções de topping', visible: true },
        { id: 'cat-acomp', name: 'ACOMPANHAMENTOS', icon: '🍌', desc: 'Complementos para montar seu açaí dos sonhos', visible: true }
      ],
      'sushi-zen': [
        { id: 'cat-rolls', name: 'HOT ROLLS & URAMAKIS', icon: '🌀', desc: 'Rolinhos crocantes e recheios cremosos', visible: true },
        { id: 'cat-sashimi', name: 'SASHIMIS & NIGIRIS', icon: '🐟', desc: 'Fatias premium de salmão, atum e peixe branco', visible: true },
        { id: 'cat-combos', name: 'COMBOS FAMÍLIA', icon: '🎋', desc: 'Combos perfeitos para 2, 4 ou 6 pessoas', visible: true }
      ],
      'marmita-da-dora': [
        { id: 'cat-mar', name: 'MARMITAS EXECUTIVAS', icon: '🍱', desc: 'Marmita completa com arroz, feijão e proteína', visible: true },
        { id: 'cat-fit', name: 'LINHA FIT', icon: '🥗', desc: 'Opções saudáveis com menos calorias', visible: true },
        { id: 'cat-sobr', name: 'SOBREMESAS', icon: '🍮', desc: 'Pudim, mousse e doces da casa', visible: true }
      ]
    };
    const cats = catsBySlug[slug];
    if (cats) {
      localStorage.setItem(`STORE_${slug}_CATEGORIES`, JSON.stringify(cats));
    }
  }

  // Produtos da loja
  if (!localStorage.getItem(`STORE_${slug}_PRODUCTS`)) {
    const prodsBySlug = {
      'rei-combo': [
        { id: 'p1', name: 'Combo Rei Total', category_id: 'cat-combos', price: 59.90, promo_price: 52.90, description: '2x Smash Burgers duplos com cheddar artesanal + Batata Frita G + 2x Coca-Cola 350ml. O combo mais pedido do Rei Combo!', status: 'active', featured: true, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80', extras: [{name:'Batata Extra G', price:9.90},{name:'Sobremesa Cookie', price:7.90}] },
        { id: 'p2', name: 'Combo Rei Solo', category_id: 'cat-combos', price: 34.90, promo_price: 29.90, description: '1x Smash Burger clássico + Batata Frita M + 1x Refri 350ml. Perfeito para uma refeição completa.', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1596097635121-14b38e50c3eb?w=600&q=80', extras: [{name:'Adicionar Bacon Crispy', price:5.00}] },
        { id: 'p3', name: 'Smash Duplo Cheddar Bacon', category_id: 'cat-smash', price: 32.90, promo_price: null, description: '2x smash 90g na chapa super quente com cascata de cheddar derretido, tiras grossas de bacon e onion rings crocante.', status: 'active', featured: true, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600&q=80', extras: [{name:'Bacon Extra', price:5.00},{name:'Ovo Estrelado', price:3.00}] },
        { id: 'p4', name: 'Smash Monster Triplo', category_id: 'cat-smash', price: 45.90, promo_price: 39.90, description: 'MONSTRUOSO! 3x smash burgers 90g, tripla camada de cheddar, molho especial da casa, alface americana e tomate fresco.', status: 'active', featured: false, is_new: true, popular: false, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=600&q=80', extras: [] },
        { id: 'p5', name: 'Batata Frita G + Molho', category_id: 'cat-porcoes', price: 18.90, promo_price: null, description: 'Porção grande de batata frita crocante por fora e macia por dentro, acompanha 2 molhos à escolha (ketchup, maionese, bbq, mostarda honey).', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=600&q=80', extras: [] },
        { id: 'p6', name: 'Coca-Cola 350ml Gelada', category_id: 'cat-bebidas', price: 7.00, promo_price: null, description: 'Lata 350ml trincando de gelada.', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=600&q=80', extras: [] },
        { id: 'p7', name: 'Milkshake Nutella', category_id: 'cat-bebidas', price: 19.90, promo_price: null, description: 'Milkshake cremoso de Nutella com chantilly e raspas de chocolate belga. Irresistível!', status: 'active', featured: false, is_new: true, popular: true, image: 'https://images.unsplash.com/photo-1572490122747-3a5c8d11be57?w=600&q=80', extras: [] }
      ],
      'bella-pizza': [
        { id: 'p1', name: 'Pizza Margherita Artesanal', category_id: 'cat-trad', price: 49.90, promo_price: null, description: 'Molho de tomate San Marzano, mozzarella de búfala, manjericão fresco e fio de azeite extra virgem. Clássico italiano.', status: 'active', featured: true, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600&q=80', extras: [{name:'Borda Recheada Catupiry', price:10.00}] },
        { id: 'p2', name: 'Pizza Calabresa Especial', category_id: 'cat-trad', price: 52.90, promo_price: 45.90, description: 'Calabresa fatiada grossa com cebola roxa caramelizada, azeitonas pretas e orégano artesanal.', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?w=600&q=80', extras: [] },
        { id: 'p3', name: 'Pizza Trufada de Cogumelos', category_id: 'cat-prem', price: 79.90, promo_price: null, description: 'Mix de cogumelos frescos (shiitake, portobello, champignon), creme de trufa negra importada e parmesão ralado na hora.', status: 'active', featured: true, is_new: false, popular: false, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80', extras: [] },
        { id: 'p4', name: 'Espaguete alla Carbonara', category_id: 'cat-massa', price: 58.90, promo_price: null, description: 'Espaguete 100% grano duro, pancetta italiana dourada, gema de ovos caipira, parmesão DOP e pimenta-do-reino moída na hora.', status: 'active', featured: false, is_new: true, popular: true, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=600&q=80', extras: [] },
        { id: 'p5', name: 'Vinho Casa Valduga Rosé', category_id: 'cat-beb', price: 89.90, promo_price: null, description: 'Garrafa 750ml. Fresco e frutado, combinação perfeita com nossas pizzas.', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&q=80', extras: [] }
      ],
      'acai-do-norte': [
        { id: 'p1', name: 'Tigela Norte Grande 600ml', category_id: 'cat-tigelas', price: 28.90, promo_price: 24.90, description: 'Açaí premium batido com banana, granola crocante, leite condensado, mel e sua escolha de 3 toppings extras.', status: 'active', featured: true, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=600&q=80', extras: [{name:'Topping Extra', price:3.00},{name:'Chantilly', price:4.00}] },
        { id: 'p2', name: 'Copo Festa 400ml', category_id: 'cat-copo', price: 18.90, promo_price: null, description: 'Açaí batido no copo com granola, banana e mel. Vai embora rápido!', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1560741792-b16b64b48e5f?w=600&q=80', extras: [] },
        { id: 'p3', name: 'Pacote Granola Artesanal 300g', category_id: 'cat-acomp', price: 12.90, promo_price: null, description: 'Granola artesanal com aveia, mel, coco e sementes de girassol tostadas. Feita diariamente na nossa cozinha.', status: 'active', featured: false, is_new: true, popular: false, image: 'https://images.unsplash.com/photo-1505253716362-afaea1d3d1af?w=600&q=80', extras: [] }
      ],
      'sushi-zen': [
        { id: 'p1', name: 'Hot Roll Salmão Crispy 10un', category_id: 'cat-rolls', price: 49.90, promo_price: null, description: '10 unidades de hot roll de salmão, cream cheese, pepino empanados e fritos em óleo de girassol, servidos com molho tarê e mayo de limão.', status: 'active', featured: true, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1617196034183-421b4040ed20?w=600&q=80', extras: [] },
        { id: 'p2', name: 'Uramaki Philadelphia 8un', category_id: 'cat-rolls', price: 42.90, promo_price: null, description: 'Arroz temperado por fora, salmão, cream cheese e pepino. Finalizado com furikake e lâminas de salmão por cima.', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=600&q=80', extras: [] },
        { id: 'p3', name: 'Combo Zen Family (50 peças)', category_id: 'cat-combos', price: 189.90, promo_price: 169.90, description: 'Mix completo de 50 peças: hot rolls, sashimis de salmão, nigiris e uramakis variados. Acompanha 2 sopas missô.', status: 'active', featured: true, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=600&q=80', extras: [] }
      ],
      'marmita-da-dora': [
        { id: 'p1', name: 'Marmita Executiva da Dora', category_id: 'cat-mar', price: 19.90, promo_price: null, description: 'Arroz branco, feijão temperado, proteína do dia (frango/carne/peixe), macarrão, salada e suco de fruta.', status: 'active', featured: true, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80', extras: [{name:'Proteína Dupla', price:5.00}] },
        { id: 'p2', name: 'Marmita Fit Light', category_id: 'cat-fit', price: 22.90, promo_price: null, description: 'Arroz integral, quinoa, frango grelhado, legumes no vapor e salada verde. Sem fritura e sem glúten.', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80', extras: [] },
        { id: 'p3', name: 'Pudim de Leite Condensado', category_id: 'cat-sobr', price: 8.90, promo_price: null, description: 'Pudim caseiro da Dora, receita de família há 30 anos. Cremoso, com caramelo dourado.', status: 'active', featured: false, is_new: false, popular: true, image: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&q=80', extras: [] }
      ]
    };
    const prods = prodsBySlug[slug];
    if (prods) {
      localStorage.setItem(`STORE_${slug}_PRODUCTS`, JSON.stringify(prods));
    }
  }
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

function getStoreOpenStatus(slug) {
  try {
    const saved = localStorage.getItem(`STORE_${slug}_CONFIG`);
    if (saved) {
      const cfg = JSON.parse(saved);
      return cfg.isOpen !== false;
    }
  } catch(e) {}
  return true;
}

function toggleStoreOpenFromSuper(slug) {
  try {
    const key = `STORE_${slug}_CONFIG`;
    const saved = localStorage.getItem(key);
    let cfg = saved ? JSON.parse(saved) : { slug: slug };
    cfg.isOpen = !(cfg.isOpen !== false);
    localStorage.setItem(key, JSON.stringify(cfg));
    
    // Broadcast para cardápio e painel
    try {
      const channel = new BroadcastChannel('store_orders_channel');
      channel.postMessage({ type: 'STORE_STATUS_CHANGED', store: slug, isOpen: cfg.isOpen });
    } catch(e) {}

    renderSuperAdminDashboard();
    showSuperToast(cfg.isOpen ? `🟢 Loja /${slug} ABERTA para pedidos online!` : `🔴 Loja /${slug} FECHADA para novos pedidos!`);
  } catch(e) {}
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

    const isStoreOpen = getStoreOpenStatus(t.slug);
    const openBadge = isStoreOpen
      ? `<button onclick="toggleStoreOpenFromSuper('${t.slug}')" class="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all" title="Clique para fechar a loja"><span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Aberta</button>`
      : `<button onclick="toggleStoreOpenFromSuper('${t.slug}')" class="px-2 py-0.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 hover:bg-rose-500/30 text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer transition-all" title="Clique para abrir a loja">🔴 Fechada</button>`;

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
        <td class="p-4 space-y-1">
          <div>${statusBadge}</div>
          <div>${openBadge}</div>
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
