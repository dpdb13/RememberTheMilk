import { createContext, useContext, useEffect, useState, useMemo, useCallback, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import type { ShoppingList, ListItem, UndoAction } from '../types';

interface AppContextType {
  lists: ShoppingList[];
  activeListId: string | null;
  activeList: ShoppingList | null;
  items: ListItem[];
  loading: boolean;
  undoStack: UndoAction[];

  createList: (name: string, icon: string) => Promise<void>;
  deleteList: (listId: string) => Promise<void>;
  updateList: (listId: string, name: string, icon: string) => Promise<void>;
  selectList: (listId: string | null) => void;
  generateInviteLink: (listId: string) => string;
  joinListByCode: (code: string) => Promise<{ success: boolean; error?: string }>;

  addItem: (name: string, recurring?: boolean) => Promise<void>;
  toggleItem: (itemId: string) => Promise<void>;
  deleteItem: (itemId: string) => Promise<void>;
  toggleRecurring: (itemId: string) => Promise<void>;
  finishShopping: () => Promise<void>;
  undo: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [items, setItems] = useState<ListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [undoStack, setUndoStack] = useState<UndoAction[]>([]);

  const activeList = useMemo(() =>
    lists.find(l => l.id === activeListId) ?? null,
    [lists, activeListId]
  );

  // Cargar listas del usuario
  useEffect(() => {
    if (!user) {
      setLists([]);
      setActiveListId(null);
      setItems([]);
      setLoading(false);
      return;
    }

    const loadLists = async () => {
      setLoading(true);

      const { data: ownLists } = await supabase
        .from('shopping_lists')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: true });

      const { data: sharedListIds } = await supabase
        .from('list_shared_users')
        .select('list_id')
        .eq('user_id', user.id);

      let sharedLists: ShoppingList[] = [];
      if (sharedListIds && sharedListIds.length > 0) {
        const ids = sharedListIds.map(s => s.list_id);
        const { data } = await supabase
          .from('shopping_lists')
          .select('*')
          .in('id', ids)
          .order('created_at', { ascending: true });
        sharedLists = data ?? [];
      }

      const allLists = [...(ownLists ?? []), ...sharedLists];
      setLists(allLists);

      if (allLists.length === 0) {
        const { data, error } = await supabase
          .from('shopping_lists')
          .insert({
            name: 'Lista de la compra',
            icon: '🛒',
            created_by: user.id,
            invite_code: generateInviteCode()
          })
          .select()
          .single();

        if (!error && data) {
          setLists([data]);
        }
      }

      setLoading(false);
    };

    loadLists();
  }, [user]);

  // Cargar items de la lista activa + realtime
  useEffect(() => {
    if (!activeListId) {
      setItems([]);
      return;
    }

    const loadItems = async () => {
      const { data } = await supabase
        .from('list_items')
        .select('*')
        .eq('list_id', activeListId)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });

      setItems(data ?? []);
    };

    loadItems();

    const channel = supabase
      .channel(`items-${activeListId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'list_items',
          filter: `list_id=eq.${activeListId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newItem = payload.new as ListItem;
            // Insertar respetando el orden: pendientes primero, completados al final
            setItems(prev => {
              if (newItem.completed) {
                return [...prev, newItem];
              }
              // Buscar donde empiezan los completados para insertar antes
              const firstCompletedIndex = prev.findIndex(i => i.completed);
              if (firstCompletedIndex === -1) {
                return [newItem, ...prev];
              }
              const copy = [...prev];
              copy.splice(firstCompletedIndex, 0, newItem);
              return copy;
            });
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as ListItem;
            setItems(prev => {
              const withoutOld = prev.filter(i => i.id !== updated.id);
              // Reinsertar en la posicion correcta segun su estado
              if (updated.completed) {
                return [...withoutOld, updated];
              }
              const firstCompletedIndex = withoutOld.findIndex(i => i.completed);
              if (firstCompletedIndex === -1) {
                return [updated, ...withoutOld];
              }
              const copy = [...withoutOld];
              copy.splice(firstCompletedIndex, 0, updated);
              return copy;
            });
          } else if (payload.eventType === 'DELETE') {
            setItems(prev => prev.filter(i => i.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeListId]);

  // Limpiar undo stack al cambiar de lista
  useEffect(() => {
    setUndoStack([]);
  }, [activeListId]);

  const createList = useCallback(async (name: string, icon: string) => {
    if (!user) return;

    const { data, error } = await supabase
      .from('shopping_lists')
      .insert({
        name,
        icon,
        created_by: user.id,
        invite_code: generateInviteCode()
      })
      .select()
      .single();

    if (!error && data) {
      setLists(prev => [...prev, data]);
    }
  }, [user]);

  const deleteList = useCallback(async (listId: string) => {
    const { error } = await supabase
      .from('shopping_lists')
      .delete()
      .eq('id', listId);

    if (!error) {
      setLists(prev => prev.filter(l => l.id !== listId));
      setActiveListId(prev => prev === listId ? null : prev);
    }
  }, []);

  const updateList = useCallback(async (listId: string, name: string, icon: string) => {
    const { error } = await supabase
      .from('shopping_lists')
      .update({ name, icon })
      .eq('id', listId);

    if (!error) {
      setLists(prev => prev.map(l =>
        l.id === listId ? { ...l, name, icon } : l
      ));
    }
  }, []);

  const selectList = useCallback((listId: string | null) => {
    setActiveListId(listId);
  }, []);

  const generateInviteLink = useCallback((listId: string) => {
    const list = lists.find(l => l.id === listId);
    if (!list) return '';
    return `${window.location.origin}/RememberTheMilk/?join=${list.invite_code}`;
  }, [lists]);

  const joinListByCode = useCallback(async (code: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'No has iniciado sesion' };

    const { data: list, error: findError } = await supabase
      .from('shopping_lists')
      .select('*')
      .eq('invite_code', code)
      .single();

    if (findError || !list) {
      return { success: false, error: 'Codigo de invitacion no valido' };
    }

    if (list.created_by === user.id) {
      return { success: false, error: 'Ya eres el creador de esta lista' };
    }

    const { data: existing } = await supabase
      .from('list_shared_users')
      .select('id')
      .eq('list_id', list.id)
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return { success: false, error: 'Ya tienes acceso a esta lista' };
    }

    const { error: joinError } = await supabase
      .from('list_shared_users')
      .insert({
        list_id: list.id,
        user_id: user.id
      });

    if (joinError) {
      return { success: false, error: 'Error al unirse a la lista' };
    }

    setLists(prev => [...prev, list]);
    return { success: true };
  }, [user]);

  const addItem = useCallback(async (name: string, recurring = false) => {
    if (!user || !activeListId) return;

    await supabase
      .from('list_items')
      .insert({
        list_id: activeListId,
        name: name.trim(),
        completed: false,
        recurring,
        added_by: user.id
      });
  }, [user, activeListId]);

  const toggleItem = useCallback(async (itemId: string) => {
    if (!user) return;

    setItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (!item) return prev;

      const newCompleted = !item.completed;

      if (newCompleted) {
        setUndoStack(s => [...s, { type: 'complete_item', item }]);
      }

      // Actualizar optimistamente en la UI
      supabase
        .from('list_items')
        .update({
          completed: newCompleted,
          completed_by: newCompleted ? user.id : null,
          completed_at: newCompleted ? new Date().toISOString() : null
        })
        .eq('id', itemId)
        .then();

      return prev;
    });
  }, [user]);

  const deleteItem = useCallback(async (itemId: string) => {
    await supabase
      .from('list_items')
      .delete()
      .eq('id', itemId);
  }, []);

  const toggleRecurring = useCallback(async (itemId: string) => {
    setItems(prev => {
      const item = prev.find(i => i.id === itemId);
      if (!item) return prev;

      supabase
        .from('list_items')
        .update({ recurring: !item.recurring })
        .eq('id', itemId)
        .then();

      return prev;
    });
  }, []);

  const finishShopping = useCallback(async () => {
    if (!user || !activeListId) return;

    setUndoStack([{ type: 'finish_shopping', items: [...items] }]);

    // Borrar items NO recurrentes
    await supabase
      .from('list_items')
      .delete()
      .eq('list_id', activeListId)
      .eq('recurring', false);

    // Items recurrentes: desmarcar para que vuelvan
    await supabase
      .from('list_items')
      .update({
        completed: false,
        completed_by: null,
        completed_at: null
      })
      .eq('list_id', activeListId)
      .eq('recurring', true);
  }, [user, activeListId, items]);

  const undo = useCallback(async () => {
    if (undoStack.length === 0) return;

    const lastAction = undoStack[undoStack.length - 1];

    if (lastAction.type === 'complete_item' && lastAction.item) {
      await supabase
        .from('list_items')
        .update({
          completed: false,
          completed_by: null,
          completed_at: null
        })
        .eq('id', lastAction.item.id);
    } else if (lastAction.type === 'finish_shopping' && lastAction.items) {
      const nonRecurringItems = lastAction.items.filter(i => !i.recurring);
      if (nonRecurringItems.length > 0) {
        const toInsert = nonRecurringItems.map(i => ({
          list_id: i.list_id,
          name: i.name,
          completed: i.completed,
          recurring: i.recurring,
          added_by: i.added_by,
          completed_by: i.completed_by,
          completed_at: i.completed_at
        }));
        await supabase.from('list_items').insert(toInsert);
      }

      // Restaurar estado previo de recurrentes
      const recurringCompleted = lastAction.items.filter(i => i.recurring && i.completed);
      if (recurringCompleted.length > 0) {
        for (const item of recurringCompleted) {
          await supabase
            .from('list_items')
            .update({
              completed: true,
              completed_by: item.completed_by,
              completed_at: item.completed_at
            })
            .eq('id', item.id);
        }
      }
    }

    setUndoStack(prev => prev.slice(0, -1));
  }, [undoStack]);

  const value = useMemo(() => ({
    lists,
    activeListId,
    activeList,
    items,
    loading,
    undoStack,
    createList,
    deleteList,
    updateList,
    selectList,
    generateInviteLink,
    joinListByCode,
    addItem,
    toggleItem,
    deleteItem,
    toggleRecurring,
    finishShopping,
    undo
  }), [
    lists, activeListId, activeList, items, loading, undoStack,
    createList, deleteList, updateList, selectList,
    generateInviteLink, joinListByCode,
    addItem, toggleItem, deleteItem, toggleRecurring, finishShopping, undo
  ]);

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}
