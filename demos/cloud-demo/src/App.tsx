import { CloudProvider, ErrorBoundary, DebuggerTool } from '@cloudimage/cloud';
import '@cloudimage/cloud/debugger';
import { ImageGrid } from './components/ImageGrid';
import { STATIC_IMAGES } from './types/images';
import './styles/global.css';
import styles from './App.module.css';

function AppContent() {
  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>CLOUD Image Cache</h1>
        <p>Intelligent image caching for modern web apps</p>
      </header>

      <main className={styles.main}>
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