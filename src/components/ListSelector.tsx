import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

interface Props {
  onCreateNew: () => void;
}

export function ListSelector({ onCreateNew }: Props) {
  const { lists, selectList, deleteList, loading } = useApp();
  const { signOut, user } = useAuth();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouchStart = (listId: string) => {
    longPressTimer.current = setTimeout(() => {
      setDeleteConfirm(listId);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await deleteList(deleteConfirm);
    setDeleteConfirm(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando tus listas...</p>
      </div>
    );
  }

  return (
    <div className="list-selector">
      <div className="list-selector-header">
        <h1>Mis Listas</h1>
        <button onClick={signOut} className="btn-icon btn-logout" title="Cerrar sesion">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>

      {user && (
        <p className="user-email">{user.email}</p>
      )}

      <div className="lists-grid">
        {lists.map(list => (
          <button
            key={list.id}
            className="list-card"
            onClick={() => selectList(list.id)}
            onTouchStart={() => handleTouchStart(list.id)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onContextMenu={(e) => { e.preventDefault(); setDeleteConfirm(list.id); }}
          >
            <span className="list-card-icon">{list.icon}</span>
            <span className="list-card-name">{list.name}</span>
          </button>
        ))}

        <button className="list-card list-card-new" onClick={onCreateNew}>
          <span className="list-card-icon">+</span>
          <span className="list-card-name">Nueva lista</span>
        </button>
      </div>

      {/* Modal confirmar borrado */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal delete-modal" onClick={e => e.stopPropagation()}>
            <div className="delete-modal-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18"/>
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
              </svg>
            </div>
            <p className="delete-modal-text">
              Eliminar <strong>{lists.find(l => l.id === deleteConfirm)?.name}</strong>?
            </p>
            <div className="delete-modal-actions">
              <button
                className="btn btn-secondary delete-modal-btn"
                onClick={() => setDeleteConfirm(null)}
              >
                No
              </button>
              <button
                className="btn btn-danger delete-modal-btn"
                onClick={handleDelete}
              >
                Si
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
