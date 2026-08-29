-- =========================================================================
-- PLATAFORMA MULTI-TENANT • SCHEMA DE SUPABASE (SUPER ADMIN & MULTI-LOJAS)
-- Criação de tabelas para controle de restaurantes, planos e mensalidades
-- =========================================================================

-- 1. TABELA DE LOJAS / EMPRESAS CADASTRADAS (TENANTS)
CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,                       -- ex: 'sao-jose', 'pizzaria-sabor-real'
  name TEXT NOT NULL,                              -- ex: 'São José Burguer'
  segment TEXT DEFAULT 'Hamburgueria',             -- 'Hamburgueria', 'Pizzaria', 'Açaí', 'Sushi', 'Marmitaria', etc.
  owner_name TEXT NOT NULL,                        -- Nome do dono / responsável
  owner_phone TEXT NOT NULL,                       -- WhatsApp com DDD (ex: '99991040222')
  owner_email TEXT,                                -- E-mail do responsável
  plan TEXT DEFAULT 'pro',                         -- 'trial', 'basic', 'pro', 'vip'
  monthly_fee NUMERIC(10, 2) DEFAULT 119.00,       -- Valor da mensalidade em R$
  status TEXT DEFAULT 'active',                    -- 'active', 'trial', 'blocked', 'canceled'
  due_day INT DEFAULT 10,                          -- Dia de vencimento da mensalidade (1 a 31)
  trial_ends_at TIMESTAMPTZ,                       -- Data de término do teste grátis (se aplicável)
  last_payment_date DATE,                          -- Último mês pago
  custom_domain TEXT,                              -- ex: 'saojoseburguer.com.br' (se contratado)
  config JSONB DEFAULT '{}'::jsonb,                -- Configurações gerais (cores, logo, taxas, pix, horários)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABELA DE HISTÓRICO DE MENSALIDADES E PAGAMENTOS
CREATE TABLE IF NOT EXISTS public.tenant_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
  reference_month TEXT NOT NULL,                   -- ex: '2026-08', '2026-09'
  amount NUMERIC(10, 2) NOT NULL,                  -- Valor pago
  status TEXT DEFAULT 'paid',                      -- 'paid', 'pending', 'overdue'
  payment_method TEXT DEFAULT 'PIX',               -- 'PIX', 'DINHEIRO', 'CARTAO'
  paid_at TIMESTAMPTZ DEFAULT NOW(),
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ÍNDICES DE ALTA PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_tenants_slug ON public.tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON public.tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant ON public.tenant_payments(tenant_id);

-- 4. POLÍTICAS DE ACESSO PÚBLICO (RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso público leitura e escrita de tenants"
  ON public.tenants FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Acesso público leitura e escrita de tenant_payments"
  ON public.tenant_payments FOR ALL
  USING (true)
  WITH CHECK (true);

-- 5. INSERÇÃO DO PRIMEIRO CLIENTE OFICIAL (SÃO JOSÉ BURGUER)
INSERT INTO public.tenants (slug, name, segment, owner_name, owner_phone, plan, monthly_fee, status, due_day)
VALUES (
  'sao-jose',
  'São José Burguer',
  'Hamburgueria Artesanal',
  'Thiago / Responsável',
  '5599991040222',
  'pro',
  119.00,
  'active',
  10
)
ON CONFLICT (slug) DO NOTHING;
