// Tipos para la app de lista de la compra

export interface ShoppingList {
  id: string;
  name: string;
  icon: string;
  created_by: string;
  invite_code: string;
  created_at: string;
}

export interface ListItem {
  id: string;
  list_id: string;
  name: string;
  completed: boolean;
  recurring: boolean;
  added_by: string;
  completed_by: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface ListSharedUser {
  id: string;
  list_id: string;
  user_id: string;
  created_at: string;
}

// Para el historial de undo
export interface UndoAction {
  type: 'complete_item' | 'finish_shopping';
  item?: ListItem;
  items?: ListItem[]; // Para undo de "terminar compra"
}
