import { useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';

const ICONS = ['🛒', '🏠', '🎉', '🍔', '💊', '🐕', '🎁', '✈️', '🏋️', '📚', '🎨', '🌿'];

interface Props {
  onClose: () => void;
}

export function ListSettings({ onClose }: Props) {
  const { activeList, updateList, deleteList, selectList } = useApp();
  const { user } = useAuth();
  const [name, setName] = useState(activeList?.name ?? '');
  const [icon, setIcon] = useState(activeList?.icon ?? '🛒');
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (!activeList) return null;

  const isOwner = activeList.created_by === user?.id;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await updateList(activeList.id, name.trim(), icon);
    setLoading(false);
    onClose();
  };

  const handleDelete = async () => {
    setLoading(true);
    await deleteList(activeList.id);
    selectList(null);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Ajustes de la lista</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input"
              required
              disabled={!isOwner}
            />
          </div>

          <div className="form-group">
            <label>Icono</label>
            <div className="icon-grid">
              {ICONS.map(i => (
                <button
                  key={i}
                  type="button"
                  className={`icon-option ${icon === i ? 'active' : ''}`}
                  onClick={() => isOwner && setIcon(i)}
                  disabled={!isOwner}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          {isOwner && (
            <div className="modal-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
                {loading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          )}

          {!isOwner && (
            <p className="settings-note">Solo el creador puede editar la lista</p>
          )}
        </form>

        {isOwner && (
          <div className="danger-zone">
            <h3>Zona peligrosa</h3>
            {!showDeleteConfirm ? (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
              >
                Eliminar lista
              </button>
            ) : (
              <div className="delete-confirm">
                <p>Esto eliminara la lista y todos sus items. Esta accion no se puede deshacer.</p>
                <div className="delete-confirm-actions">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleDelete}
                    disabled={loading}
                  >
                    {loading ? 'Eliminando...' : 'Si, eliminar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
