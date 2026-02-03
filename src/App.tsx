import { useState, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import { useApp } from './context/AppContext';
import { Auth } from './components/Auth';
import { ListSelector } from './components/ListSelector';
import { CreateList } from './components/CreateList';
import { ListHeader } from './components/ListHeader';
import { ShoppingList } from './components/ShoppingList';
import { ListSettings } from './components/ListSettings';
import './App.css';

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const { activeListId, selectList, joinListByCode } = useApp();
  const [showCreateList, setShowCreateList] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [joinMessage, setJoinMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Manejar codigo de invitacion en URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');

    if (joinCode && user) {
      // Limpiar URL
      window.history.replaceState({}, '', window.location.pathname);

      // Unirse a la lista
      joinListByCode(joinCode).then(result => {
        if (result.success) {
          setJoinMessage({ type: 'success', text: 'Te has unido a la lista!' });
        } else {
          setJoinMessage({ type: 'error', text: result.error ?? 'Error al unirse' });
        }
        setTimeout(() => setJoinMessage(null), 3000);
      });
    }
  }, [user, joinListByCode]);

  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="app">
      {joinMessage && (
        <div className={`toast toast-${joinMessage.type}`}>
          {joinMessage.text}
        </div>
      )}

      {!activeListId ? (
        <ListSelector onCreateNew={() => setShowCreateList(true)} />
      ) : (
        <div className="list-view">
          <ListHeader
            onBack={() => selectList(null)}
            onOpenSettings={() => setShowSettings(true)}
          />
          <ShoppingList />
        </div>
      )}

      {showCreateList && (
        <CreateList onClose={() => setShowCreateList(false)} />
      )}

      {showSettings && (
        <ListSettings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
