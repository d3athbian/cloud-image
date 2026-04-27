import { CloudProvider, ErrorBoundary } from '@cloudimage/cloud';
import { DebuggerTool } from '@cloudimage/cloud/debugger';
import { ImageGrid } from './components/ImageGrid';
import { STATIC_IMAGES } from './types/images';
import './styles/app.css';

function AppContent() {
  return (
    <div className="demo-container">
      <header className="demo-header">
        <h1>CLOUD Image Cache</h1>
        <p>Intelligent image caching for modern web apps</p>
      </header>

      <main className="demo-main">
        <ImageGrid images={STATIC_IMAGES} />
      </main>

      <DebuggerTool />
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <CloudProvider devtools={true}>
        <AppContent />
      </CloudProvider>
    </ErrorBoundary>
  );
}

export default App;
