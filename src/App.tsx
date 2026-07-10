import { useEffect, useState, useRef } from 'react';
import { Excalidraw } from '@excalidraw/excalidraw';
import { nanoid } from 'nanoid';

// Simple debounce implementation
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}

function CanvasList({ onSelect }: { onSelect: (id: string | null) => void }) {
  const [canvasIds, setCanvasIds] = useState<string[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('canvas-list');
    if (saved) {
      setCanvasIds(JSON.parse(saved));
    }
  }, []);

  const createNew = () => {
    const newId = nanoid(8);
    const updated = [...new Set([newId, ...canvasIds])].slice(0, 100);
    setCanvasIds(updated);
    localStorage.setItem('canvas-list', JSON.stringify(updated));
    onSelect(newId);
  };

  const deleteCanvas = (id: string) => {
    const updated = canvasIds.filter((cid: string) => cid !== id);
    setCanvasIds(updated);
    localStorage.setItem('canvas-list', JSON.stringify(updated));
    localStorage.removeItem(`canvas:${id}`);
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      <h1>📐 My Canvases</h1>
      <button onClick={createNew} style={{ 
        padding: '1rem 2rem', 
        fontSize: '1.2rem', 
        marginBottom: '2rem',
        cursor: 'pointer'
      }}>
        + Create New Canvas
      </button>
      
      {canvasIds.length === 0 ? (
        <p>No canvases yet. Create one!</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {canvasIds.map((id: string) => (
            <li key={id} style={{ 
              padding: '1rem', 
              margin: '0.5rem 0', 
              border: '1px solid #ddd',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span>Canvas <code>{id}</code></span>
              <div>
                <button onClick={() => onSelect(id)} style={{ marginRight: '0.5rem', cursor: 'pointer' }}>
                  Open
                </button>
                <button onClick={() => deleteCanvas(id)} style={{ cursor: 'pointer' }}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'list' | 'editor'>('list');
  const [canvasId, setCanvasId] = useState<string | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const saveCanvasRef = useRef<((data: any) => void) | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('id');
    
    if (id) {
      setCanvasId(id);
      loadCanvas(id);
      setView('editor');
    }
  }, []);

  const openCanvas = (id: string | null) => {
    if (id) {
      setCanvasId(id);
      loadCanvas(id);
      setView('editor');
    }
  };

  const goHome = () => {
    setCanvasId(null);
    setInitialData(null);
    window.history.pushState({}, '', '/');
    setView('list');
  };

  const loadCanvas = (id: string) => {
    const saved = localStorage.getItem(`canvas:${id}`);
    if (saved) {
      setInitialData(JSON.parse(saved));
    } else {
      setInitialData({ elements: [], appState: { theme: 'light' } });
    }
  };

  const saveCanvas = (data: { elements: any[]; appState: any }) => {
    if (!canvasId) return;
    localStorage.setItem(`canvas:${canvasId}`, JSON.stringify(data));
    
    // Update canvas list
    const saved = localStorage.getItem('canvas-list');
    const list = saved ? JSON.parse(saved) : [];
    if (!list.includes(canvasId)) {
      localStorage.setItem('canvas-list', JSON.stringify([canvasId, ...list]));
    }
  };

  // Initialize debounced save
  useEffect(() => {
    saveCanvasRef.current = debounce(saveCanvas, 1000);
  }, [canvasId]);

  // Render based on view
  if (view === 'list') {
    return <CanvasList onSelect={openCanvas} />;
  }

  if (!initialData || !canvasId) {
    return <div style={{ padding: '2rem' }}>Loading...</div>;
  }

  return (
    <div style={{ height: '100vh', width: '100vw' }}>
      <div style={{ 
        position: 'absolute', 
        top: '10px', 
        left: '10px', 
        zIndex: 1000 
      }}>
        <button onClick={goHome} style={{ 
          padding: '0.5rem 1rem',
          cursor: 'pointer',
          background: '#fff',
          border: '1px solid #ddd',
          borderRadius: '4px'
        }}>
          ← Back to Canvases
        </button>
      </div>
      <Excalidraw
        initialData={initialData}
        onChange={saveCanvasRef.current}
        theme="light"
      />
    </div>
  );
}