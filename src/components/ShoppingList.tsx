import { useState, useRef, useMemo, type FormEvent, type KeyboardEvent } from 'react';
import { useApp } from '../context/AppContext';

export function ShoppingList() {
  const { items, addItem, toggleItem, deleteItem, toggleRecurring, finishShopping, undo, undoStack } = useApp();
  const [newItem, setNewItem] = useState('');
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ itemId: string; x: number; y: number } | null>(null);
  const [showFinishUndo, setShowFinishUndo] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const pendingItems = useMemo(() =>
    items.filter(i => !i.completed), [items]);

  const completedItems = useMemo(() =>
    items.filter(i => i.completed), [items]);

  const handleSubmit = async (e: FormEvent, recurring = false) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    await addItem(newItem, recurring);
    setNewItem('');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit(e as unknown as FormEvent, false);
    }
  };

  const handleToggle = async (itemId: string) => {
    setTogglingId(itemId);
    setTimeout(async () => {
      await toggleItem(itemId);
      setTogglingId(null);
    }, 300);
  };

  // Long press para mostrar menu contextual
  const handleLongPress = (itemId: string, e: React.TouchEvent | React.MouseEvent) => {
    // Capturar coordenadas AHORA (React recicla el evento despues)
    const x = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const y = 'touches' in e ? e.touches[0].clientY : e.clientY;

    longPressTimer.current = setTimeout(() => {
      setContextMenu({ itemId, x, y });
    }, 500);
  };

  const handleContextMenu = (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    // Clic derecho: abrir menu inmediatamente (sin esperar 500ms)
    setContextMenu({ itemId, x: e.clientX, y: e.clientY });
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = async (itemId: string) => {
    await deleteItem(itemId);
    setContextMenu(null);
  };

  const handleRemoveRecurring = async (itemId: string) => {
    await toggleRecurring(itemId);
    setContextMenu(null);
  };

  const handleFinishShopping = async () => {
    await finishShopping();
    setShowFinishUndo(true);
  };

  const handleUndoFinish = async () => {
    await undo();
    setShowFinishUndo(false);
  };

  const item = contextMenu ? items.find(i => i.id === contextMenu.itemId) : null;

  return (
    <div className="shopping-list" onClick={() => setContextMenu(null)}>
      <form onSubmit={(e) => handleSubmit(e, false)} className="add-item-form">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Anadir item..."
          className="input add-item-input"
          autoComplete="off"
        />
        <button
          type="button"
          className="btn btn-recurring"
          disabled={!newItem.trim()}
          onClick={(e) => handleSubmit(e as unknown as FormEvent, true)}
          title="Anadir como recurrente"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="23 4 23 10 17 10"/>
            <polyline points="1 20 1 14 7 14"/>
            <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
          </svg>
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-add"
          disabled={!newItem.trim()}
        >
          +
        </button>
      </form>

      {items.length === 0 && !showFinishUndo ? (
        <div className="empty-list">
          <div className="empty-list-icon">🛒</div>
          <p>Tu lista esta vacia</p>
          <span>Escribe algo arriba y pulsa Enter</span>
        </div>
      ) : (
        <>
          {/* Items pendientes */}
          {pendingItems.length > 0 && (
            <ul className="items-list">
              {pendingItems.map(item => (
                <li
                  key={item.id}
                  className={`item ${togglingId === item.id ? 'toggling' : ''}`}
                  onTouchStart={(e) => handleLongPress(item.id, e)}
                  onTouchEnd={handleTouchEnd}
                  onTouchCancel={handleTouchEnd}
                  onContextMenu={(e) => handleContextMenu(item.id, e)}
                >
                  <button
                    className="item-checkbox"
                    onClick={() => handleToggle(item.id)}
                    aria-label={`Marcar ${item.name} como completado`}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                    </svg>
                  </button>
                  <span className="item-name">{item.name}</span>
                  {item.recurring && <span className="item-recurring-badge" title="Recurrente">↻</span>}
                </li>
              ))}
            </ul>
          )}

          {/* Items completados */}
          {completedItems.length > 0 && (
            <>
              <div className="completed-section">
                <span className="completed-label">Comprado ({completedItems.length})</span>
              </div>
              <ul className="items-list items-completed">
                {completedItems.map(item => (
                  <li
                    key={item.id}
                    className={`item item-done ${togglingId === item.id ? 'toggling' : ''}`}
                    onTouchStart={(e) => handleLongPress(item.id, e)}
                    onTouchEnd={handleTouchEnd}
                    onTouchCancel={handleTouchEnd}
                    onContextMenu={(e) => handleContextMenu(item.id, e)}
                  >
                    <button
                      className="item-checkbox checked"
                      onClick={() => handleToggle(item.id)}
                      aria-label={`Desmarcar ${item.name}`}
                    >
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="8 12 11 15 16 9" className="check-mark"/>
                      </svg>
                    </button>
                    <span className="item-name">{item.name}</span>
                    {item.recurring && <span className="item-recurring-badge" title="Recurrente">↻</span>}
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Boton terminar compra */}
          {items.length > 0 && (
            <button
              className="btn btn-finish-shopping"
              onClick={handleFinishShopping}
            >
              Terminar compra
            </button>
          )}
        </>
      )}

      {/* Boton undo despues de terminar compra */}
      {showFinishUndo && undoStack.length > 0 && undoStack[undoStack.length - 1].type === 'finish_shopping' && (
        <div className="finish-undo-bar">
          <span>Compra terminada</span>
          <button className="btn btn-undo-finish" onClick={handleUndoFinish}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"/>
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
            </svg>
            Deshacer
          </button>
        </div>
      )}

      {/* Menu contextual (long press) */}
      {contextMenu && (
        <div
          className="context-menu-overlay"
          onClick={() => setContextMenu(null)}
        >
          <div
            className="context-menu"
            style={{
              top: Math.min(contextMenu.y, window.innerHeight - 140),
              left: Math.min(contextMenu.x, window.innerWidth - 200)
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="context-menu-item danger"
              onClick={() => handleDelete(contextMenu.itemId)}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
              Eliminar
            </button>
            {item?.recurring && (
              <button
                className="context-menu-item"
                onClick={() => handleRemoveRecurring(contextMenu.itemId)}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
                Quitar recurrencia
              </button>
            )}
            {!item?.recurring && (
              <button
                className="context-menu-item"
                onClick={() => { toggleRecurring(contextMenu.itemId); setContextMenu(null); }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="23 4 23 10 17 10"/>
                  <polyline points="1 20 1 14 7 14"/>
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/>
                </svg>
                Hacer recurrente
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
