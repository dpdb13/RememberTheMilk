import { useState } from 'react';
import { useApp } from '../context/AppContext';

interface Props {
  onBack: () => void;
  onOpenSettings: () => void;
}

export function ListHeader({ onBack, onOpenSettings }: Props) {
  const { activeList, undoStack, undo, generateInviteLink } = useApp();
  const [showCopied, setShowCopied] = useState(false);

  if (!activeList) return null;

  const handleShare = async () => {
    const link = generateInviteLink(activeList.id);

    if (navigator.share) {
      try {
        await navigator.share({
          title: activeList.name,
          text: `Unete a mi lista "${activeList.name}"`,
          url: link
        });
      } catch {
        // Usuario cancelo o error
        copyToClipboard(link);
      }
    } else {
      copyToClipboard(link);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    } catch {
      // Fallback para navegadores sin clipboard API
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setShowCopied(true);
      setTimeout(() => setShowCopied(false), 2000);
    }
  };

  return (
    <header className="list-header">
      <button className="btn-icon" onClick={onBack} title="Volver">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <div className="list-header-title">
        <span className="list-header-icon">{activeList.icon}</span>
        <h1>{activeList.name}</h1>
      </div>

      <div className="list-header-actions">
        {undoStack.length > 0 && undoStack[undoStack.length - 1].type === 'complete_item' && (
          <button className="btn-icon" onClick={undo} title="Deshacer">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 7v6h6"/>
              <path d="M3 13a9 9 0 1 0 3-7.7L3 7"/>
            </svg>
          </button>
        )}

        <button className="btn-icon" onClick={handleShare} title="Compartir">
          {showCopied ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--success-color)" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16 6 12 2 8 6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          )}
        </button>

        <button className="btn-icon" onClick={onOpenSettings} title="Ajustes">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
      </div>
    </header>
  );
}
