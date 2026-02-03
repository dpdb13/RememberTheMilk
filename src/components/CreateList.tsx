import { useState, type FormEvent } from 'react';
import { useApp } from '../context/AppContext';

const ICONS = ['🛒', '🏠', '🎉', '🍔', '💊', '🐕', '🎁', '✈️', '🏋️', '📚', '🎨', '🌿'];

interface Props {
  onClose: () => void;
}

export function CreateList({ onClose }: Props) {
  const { createList } = useApp();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('🛒');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    await createList(name.trim(), icon);
    setLoading(false);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Nueva Lista</h2>
          <button className="btn-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Nombre de la lista</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej: Compra semanal"
              className="input"
              autoFocus
              required
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
                  onClick={() => setIcon(i)}
                >
                  {i}
                </button>
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Creando...' : 'Crear lista'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
