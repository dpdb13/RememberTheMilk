-- =====================================================
-- SETUP DE BASE DE DATOS PARA REMEMBER THE MILK
-- Ejecutar en Supabase SQL Editor
-- =====================================================

-- 1. TABLA: shopping_lists (listas de compra)
CREATE TABLE IF NOT EXISTS shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🛒',
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. TABLA: list_shared_users (usuarios invitados a listas)
CREATE TABLE IF NOT EXISTS list_shared_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(list_id, user_id)
);

-- 3. TABLA: list_items (items de la lista)
CREATE TABLE IF NOT EXISTS list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES shopping_lists(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  added_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- INDICES para mejor rendimiento
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_shopping_lists_created_by ON shopping_lists(created_by);
CREATE INDEX IF NOT EXISTS idx_shopping_lists_invite_code ON shopping_lists(invite_code);
CREATE INDEX IF NOT EXISTS idx_list_shared_users_user_id ON list_shared_users(user_id);
CREATE INDEX IF NOT EXISTS idx_list_shared_users_list_id ON list_shared_users(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_completed ON list_items(list_id, completed);

-- =====================================================
-- HABILITAR RLS (Row Level Security)
-- =====================================================

ALTER TABLE shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_shared_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FUNCION auxiliar para verificar acceso a lista
-- =====================================================

CREATE OR REPLACE FUNCTION user_has_list_access(list_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM shopping_lists WHERE id = list_uuid AND created_by = auth.uid()
  ) OR EXISTS (
    SELECT 1 FROM list_shared_users WHERE list_id = list_uuid AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- POLITICAS RLS para shopping_lists
-- =====================================================

-- Ver: propias o compartidas conmigo
CREATE POLICY "Users can view own lists"
  ON shopping_lists FOR SELECT
  USING (created_by = auth.uid());

CREATE POLICY "Users can view shared lists"
  ON shopping_lists FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM list_shared_users
      WHERE list_shared_users.list_id = shopping_lists.id
      AND list_shared_users.user_id = auth.uid()
    )
  );

-- Crear: cualquier usuario autenticado
CREATE POLICY "Users can create lists"
  ON shopping_lists FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Actualizar: solo el creador
CREATE POLICY "Users can update own lists"
  ON shopping_lists FOR UPDATE
  USING (created_by = auth.uid());

-- Eliminar: solo el creador
CREATE POLICY "Users can delete own lists"
  ON shopping_lists FOR DELETE
  USING (created_by = auth.uid());

-- =====================================================
-- POLITICAS RLS para list_shared_users
-- =====================================================

-- Ver: si tengo acceso a la lista
CREATE POLICY "Users can view shared users of accessible lists"
  ON list_shared_users FOR SELECT
  USING (user_has_list_access(list_id));

-- Crear: solo el creador de la lista puede invitar
CREATE POLICY "List owners can add shared users"
  ON list_shared_users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_shared_users.list_id
      AND shopping_lists.created_by = auth.uid()
    )
    OR user_id = auth.uid()  -- O el usuario se une a si mismo via invite
  );

-- Eliminar: el creador de la lista puede eliminar
CREATE POLICY "List owners can remove shared users"
  ON list_shared_users FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM shopping_lists
      WHERE shopping_lists.id = list_shared_users.list_id
      AND shopping_lists.created_by = auth.uid()
    )
  );

-- =====================================================
-- POLITICAS RLS para list_items
-- =====================================================

-- Ver: si tengo acceso a la lista
CREATE POLICY "Users can view items of accessible lists"
  ON list_items FOR SELECT
  USING (user_has_list_access(list_id));

-- Crear: si tengo acceso a la lista
CREATE POLICY "Users can add items to accessible lists"
  ON list_items FOR INSERT
  WITH CHECK (user_has_list_access(list_id) AND added_by = auth.uid());

-- Actualizar: si tengo acceso a la lista
CREATE POLICY "Users can update items in accessible lists"
  ON list_items FOR UPDATE
  USING (user_has_list_access(list_id));

-- Eliminar: si tengo acceso a la lista
CREATE POLICY "Users can delete items in accessible lists"
  ON list_items FOR DELETE
  USING (user_has_list_access(list_id));

-- =====================================================
-- HABILITAR REALTIME para list_items
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE list_items;

-- =====================================================
-- LISTO! Las tablas estan configuradas
-- =====================================================
