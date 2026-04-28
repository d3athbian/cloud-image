# Especificación Técnica: CloudImage DevTools UI

Esta especificación es el documento maestro para implementar el panel de DevTools de `carbon-image`. Define la arquitectura, estructura, estado y layout necesarios para replicar el diseño proporcionado utilizando **Tailwind CSS v4**.

## 0. 🛠️ CONFIGURACIÓN INICIAL Y HERRAMIENTAS (TAILWIND v4)

**Objetivo:** Instalar y configurar Tailwind CSS v4 como motor principal de estilos, reemplazando el uso de CSS Vanilla o CSS Modules.

**Tareas de Configuración (Fase 0):**
1. Verificar que `@tailwindcss/vite` y `tailwindcss` (versión 4.x) estén instalados en `packages/cloud`.
2. Integrar el plugin `@tailwindcss/vite` en el archivo `vite.config.ts` de la librería (en caso de no estarlo).
3. Crear un archivo `styles/devtools.css` importando Tailwind mediante la directiva `@import "tailwindcss";`.
4. **Design Tokens en Tailwind v4:** Usar la nueva directiva `@theme` en el archivo CSS principal para inyectar los colores y variables específicas del DevTools como utilidades nativas de Tailwind (ej. `bg-dt-bg-base`, `text-dt-text-primary`). Esto reemplaza la necesidad de crear archivos de configuración separados.

---

## 1. 🧩 ARQUITECTURA DE COMPONENTES

El sistema se compone de un layout estricto dividido en zonas funcionales. 

```text
DebuggerTool (Root - Provider & Portal logic)
├── DevToolsLayout (Maneja el grid layout con Tailwind)
│   ├── Topbar
│   │   ├── Brand & Version
│   │   ├── StatusIndicators (Online, Circuit, SW, Worker)
│   │   └── WindowActions (Popout, Settings, Close)
│   ├── MainContent
│   │   ├── NavigationTabs (Cache, Network, Performance, State)
│   │   └── TabView (Dynamic render basado en tab activa)
│   │       └── CacheTab
│   │           ├── StatsOverview (Widgets de métricas top)
│   │           ├── Toolbar (Search, Filters, Action buttons)
│   │           └── CacheGrid (Virtualizado)
│   │               └── CacheCard (Item de la grilla)
│   ├── SidePanel (Right)
│   │   ├── ImageDetails (Muestra datos del item seleccionado)
│   │   └── LoggerPanel (Logs en tiempo real con filtro)
│   └── BottomPanel
│       ├── StateViewer (JSON trees de Jotai atoms)
│       └── QuickActions (Botones globales de control)
```

**Responsabilidades:**
- `DevToolsLayout`: Maneja el grid structure (CSS Grid vía utilidades de Tailwind). No tiene lógica de negocio.
- `CacheGrid`: Contenedor virtualizado. Recibe array de IDs y renderiza `CacheCard`.
- `CacheCard`: Componente presentacional. Memorizado.
- `ImageDetails`: Observa el átomo de item seleccionado y muestra la info completa.

---

## 2. 📁 ESTRUCTURA DE PROYECTO

```text
packages/cloud/src/debugger/
├── index.ts               # Exportaciones públicas
├── components/            # Componentes UI (Sin estado acoplado idealmente)
│   ├── layout/            # DevToolsLayout, Topbar, Sidebar
│   ├── cache/             # CacheGrid, CacheCard, StatsOverview
│   ├── logger/            # LoggerPanel, LogEntry
│   ├── state/             # StateViewer (Jotai JSON view)
│   └── shared/            # Button, Badge, JsonView
├── hooks/                 # Lógica de negocio encapsulada
│   ├── useCacheData.ts
│   ├── useLogger.ts
│   └── useDevToolsLayout.ts
├── store/                 # Atoms específicos de la DevTools
│   ├── devtools-atoms.ts  # UI state (tab activa, panel open, item seleccionado)
│   └── logger-atoms.ts    # Historial de logs
├── types/                 # Interfaces locales
│   └── devtools.types.ts
└── styles/                # Tailwind v4 configuration
    └── devtools.css       # @import "tailwindcss" y @theme tokens
```

---

## 3. 🔌 MODELOS DE DATOS (TypeScript)

```typescript
// types/devtools.types.ts

export interface CacheItemMetadata {
  url: string;
  key: string;
  size: number;          // Bytes
  mimeType: string;
  cachedAt: number;      // Epoch ms
  accessedAt: number;    // Epoch ms
  accessCount: number;
  ttl: number;           // Ms (total TTL configurado)
  expiresIn: number;     // Ms restantes
  lruScore: number;      // Float 0.0 - 1.0
  status: 'active' | 'expired' | 'evicted' | 'pinned';
  source: 'sw' | 'idb' | 'memory';
}

export interface NetworkState {
  online: boolean;
  rtt: number | null;    // Ms
  downlink: number | null; // Mbps
  effectiveType: string | null;
  circuitState: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
}

export interface PerformanceMetrics {
  workerStatus: 'Idle' | 'Active' | 'Terminated';
  decodeTimeMs: number;
  swStatus: 'Active' | 'Installing' | 'Error';
}

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface LogEntry {
  id: string;
  timestamp: number;     // Epoch ms
  level: LogLevel;
  message: string;
  context?: string;      // URL o ID truncado
}

export interface DevToolsUIState {
  isOpen: boolean;
  activeTab: 'cache' | 'network' | 'performance' | 'state';
  selectedItemUrl: string | null;
  logsFilter: LogLevel | 'ALL';
}
```

---

## 4. 📐 SISTEMA DE LAYOUT Y COMPONENTES (TAILWIND v4)

El layout debe ser construido utilizando clases utilitarias de Tailwind CSS v4. Evitar CSS custom.

**Estructura Base del Layout (Computable):**
```tsx
// DevToolsLayout.tsx Wrapper
<div className="grid grid-cols-[1fr_350px] grid-rows-[48px_1fr_250px] h-screen w-full overflow-hidden bg-dt-bg-base text-dt-text-primary text-sm font-dt-sans">
  
  {/* Topbar: Ocupa ambas columnas en la primera fila */}
  <header className="col-span-2 row-start-1 bg-dt-bg-panel border-b border-dt-border flex items-center justify-between px-4">
    {/* Izquierda: Logo (Nube azul) + "CloudImage DevTools" + Pill de versión "v0.3.1" (borde sutil, texto gris) */}
    {/* Centro: Indicadores flex gap-4 text-xs. 
        - "Online" (Punto verde + texto blanco)
        - "Circuit: CLOSED" (texto verde)
        - "SW: Active" (texto verde)
        - "Worker: Idle" (texto gris) */}
    {/* Derecha: Iconos gris tenue hover:blanco (Popout, Settings, Close) */}
  </header>
  
  {/* Main Content: Fluye en la columna izquierda, fila del medio */}
  <main className="col-start-1 row-start-2 flex flex-col overflow-hidden relative border-r border-dt-border">
    {/* Navigation Tabs: "Cache", "Network", "Performance", "State". 
        Cache activa: Borde inferior azul, texto azul, icono de caja. Inactivas: Texto gris tenue. */}
    
    {/* StatsOverview: Fila superior dentro de Cache. Flex row, gap-4, p-4.
        Cajas (bg-dt-bg-panel, border-dt-border, rounded-md, p-3, min-w-[120px]):
        1. Cache Items: "128" (texto blanco grande) + icono stack.
        2. Cache Size: "46.2 MB" (texto blanco grande) + icono copy.
        3. Hit Rate: "87.3%" (texto verde dt-success grande).
        4. Evictions: "24" (texto naranja dt-warning grande).
        5. TTL Expired: "12" (texto blanco grande).
        6. Pinned: "5" (texto púrpura grande). */}
        
    {/* Toolbar: Debajo de stats. Flex row justify-between px-4 pb-4.
        - Izquierda: Input "Search by url or key..." (bg-dt-bg-card, icono lupa). Dropdowns "Status (All)" y "Sort: LRU Score".
        - Derecha: Botón "Clear Cache" (borde rojo, texto rojo tenue, icono basurero), Botón "Force GC" (borde azul, texto azul, rayo). */}
        
    {/* Contenido fluido con scroll local para la Grilla */}
  </main>
  
  {/* Sidebar (Right): Ocupa la columna derecha, abarca fila del medio y de abajo */}
  <aside className="col-start-2 row-start-2 row-span-2 grid grid-rows-[55%_45%] bg-dt-bg-panel">
    {/* Image Details (Arriba) */}
    {/* Logger Panel (Abajo) */}
  </aside>
  
  {/* Bottom Panel: Columna izquierda, fila de abajo */}
  <footer className="col-start-1 row-start-3 border-t border-dt-border bg-dt-bg-panel grid grid-cols-[1fr_300px]">
    {/* StateViewer (Jotai Atoms) y QuickActions */}
  </footer>
  
</div>
```

---

## 5. 🖼 ESPECIFICACIÓN ULTRA-DETALLADA DEL CACHE GRID

- **Sistema Grid:** Utilizar clases de Tailwind: `<div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4 p-4 overflow-y-auto">`.
- **Virtualización:** Obligatoria. Las cards tienen tamaño fijo.
- **Estructura Interna de Cada CacheCard (Visual idéntico a la imagen):**
  - Contenedor principal: `rounded-md border border-dt-border bg-dt-bg-card overflow-hidden flex flex-col relative hover:border-dt-border-hover cursor-pointer`.
  - `thumbnail-container`: Altura fija (ej. `h-32`), `bg-black relative group`. Imagen con `object-cover`.
  - `lru-badge`: Dentro del thumbnail. `absolute top-2 left-2 px-1.5 py-0.5 bg-black/80 border border-dt-border rounded text-[10px] text-dt-success font-dt-mono` (Ej: "LRU: 0.98").
  - `copy-icon`: `absolute top-2 right-2 text-white/50 opacity-0 group-hover:opacity-100`.
  - `meta-container`: Debajo de la imagen. `p-3 flex flex-col gap-1`.
    - `url`: `text-xs text-dt-text-primary truncate` (Ej: "https://picsum.photos/id/10...").
    - `stats-row`: `text-[10px] text-dt-text-secondary font-dt-mono flex items-center gap-2`. (Ej: "256 KB • hit: 18 • ttl: 32s"). El separador es un bullet point (`•`).
  - `status-badge`: Si la imagen tiene estado especial (Expired, Pinned, Evicted), aparece un texto `text-[10px] font-bold` alineado a la derecha en la parte inferior de la card.
    - Expired: Naranja (`text-dt-warning`).
    - Pinned: Púrpura (`text-purple-400`).
    - Evicted: Rojo (`text-dt-error`).

---

## 6. ⚙️ COMPORTAMIENTO FUNCIONAL

- **Selección:** Click en `CacheCard` despacha `setSelectedItemUrl(url)`. Esto fuerza un re-render del componente `ImageDetails` en el Right Panel. La tab no cambia.
- **Tabs:** El cambio de tabs oculta el grid y muestra otros componentes usando condicionales (`activeTab === 'cache' && <CacheGrid/>`). El estado del DOM de las pestañas inactivas se destruye, pero el scroll/estado debe estar guardado en Jotai.
- **Logs:** Los logs nuevos se apilan abajo. Si `logsContainer.scrollHeight - logsContainer.scrollTop === logsContainer.clientHeight` (está en el fondo), hace auto-scroll. Límite de 500 logs, array rotativo (FIFO).
- **Formatos:**
  - Size: `(bytes / 1024 / 1024).toFixed(2) + ' MB'`
  - URL en listado: Se muestra solo hostname + últimos 15 chars del pathname (`truncate` utility clasess de Tailwind para ayudar).

---

## 7. 🧠 ESTADO GLOBAL (Jotai Atoms)

```typescript
// UI Atoms
export const devToolsOpenAtom = atom<boolean>(false);
export const activeTabAtom = atom<'cache' | 'network' | 'performance' | 'state'>('cache');
export const selectedItemUrlAtom = atom<string | null>(null);

// Logs
export const logsAtom = atom<LogEntry[]>([]);
export const logsFilterAtom = atom<LogLevel | 'ALL'>('ALL');
export const filteredLogsAtom = atom((get) => {
  const filter = get(logsFilterAtom);
  const logs = get(logsAtom);
  if (filter === 'ALL') return logs;
  return logs.filter(l => l.level === filter);
});

// Sync from Engine (Estos ya existen pero se consumen aquí)
// cacheAtom, cacheStatsAtom, networkAtom, memoryAtom
```

---

## 8. 🔄 HOOKS Y CONTRATOS

```typescript
export function useLogger() {
  const [logs, setLogs] = useAtom(logsAtom);
  
  const addLog = useCallback((level: LogLevel, message: string, context?: string) => {
    setLogs(prev => {
      const newLog = { id: crypto.randomUUID(), timestamp: Date.now(), level, message, context };
      const updated = [...prev, newLog];
      if (updated.length > 500) return updated.slice(updated.length - 500);
      return updated;
    });
  }, [setLogs]);

  const clearLogs = () => setLogs([]);
  
  return { logs, addLog, clearLogs };
}

export function useCacheExplorer() {
  // Hook para interactuar con el SW/IDB directamente y leer thumbnails.
  // getPaginatedItems(offset, limit) -> Promise<CacheItemMetadata[]>
}
```

---

## 9. 📜 ESPECIFICACIÓN VISUAL DE PANELES Y LOGS (SIDEBAR & BOTTOM)

**Panel Derecho (Right Sidebar):**
1. **Image Details (Mitad superior):**
   - Header: Título "Image Details" con icono 'X' para cerrar a la derecha.
   - Contenido: Imagen preview grande (width full, aspect ratio natural, max-height 200px) con borde tenue.
   - Lista de Propiedades: Grid 2 columnas o lista con texto gris para labels y blanco para valores.
     - URL: `https://picsum.photos/id...`
     - Key: `* img:7f2d...`
     - Size: `256 KB`
     - Type: `image/jpeg`
     - TTL: `32s (exp in 18s)` (18s en naranja)
     - LRU Score: `0.98`
     - Access Count / Created At / Last Accessed.
   - Action Bar (Abajo): Flex row gap-2. Botones ghost/outline con iconos: Preview (ojo), Refetch (refresh), Delete (borde rojo, texto rojo), Pin (borde púrpura, texto púrpura).

2. **Logger Panel (Mitad inferior):**
   - Header: Título "Logger".
   - Filtros: Botones rectangulares compactos: `All` (bg azul activo), `Info`, `Warn`, `Error`, y un botón separado a la derecha `X Clear`.
   - Tabla de Logs:
     - Sin headers de columna visibles, puro contenido de filas.
     - Filas con padding mínimo, texto muy pequeño (`text-[10px] font-dt-mono`).
     - Columnas: Time (gris `10:15:44.123`), Level Tag (INFO azul, WARN naranja bg tenue, ERROR rojo bg tenue), Message (blanco), Context (gris oscuro truncado alineado a la derecha).

**Panel Inferior (Bottom Panel):**
1. **State Viewer (Izquierda):**
   - Header: "State (Jotai Atoms)" + Punto verde "Live" + Icono expandir a la derecha.
   - Grid interno de 4 columnas iguales para los átomos (`cacheAtom`, `networkAtom`, `memoryAtom`, `cacheStatsAtom`).
   - Cada caja: Título blanco, etiqueta "JS" tenue arriba a la derecha, botón de copiar.
   - Contenido: Código JSON formateado con syntax highlighting básico (llaves grises, keys blancas, strings verdes/naranjas). Footer "Updated: 2s ago".

2. **Quick Actions (Derecha):**
   - Header: "Quick Actions".
   - Grid 2x2 gap-2 para botones principales (fondo `bg-dt-bg-card` hover más claro):
     - Disable Cache (icono pause)
     - Simulate Offline (icono wifi slash)
     - Clear All (icono basurero, este botón tiene borde y texto con opacidad roja hover)
     - Export Snapshot (icono download)
   - Footer inferior: Punto verde + "Engine exposed as window.__CLOUD_ENGINE__".

---

## 10. 🚀 PLAN DE IMPLEMENTACIÓN POR FASES

**Fase 0: Integración Tailwind v4**
- **Objetivo:** Preparar el entorno para compilar estilos nativos usando las nuevas directivas CSS.
- **Entregables:** `devtools.css` con variables inyectadas. Comprobación de que las clases impactan el DOM.

**Fase 1: Layout Base y Theming**
- **Objetivo:** Montar el CSS Grid estricto aplicando el sistema de grillas de Tailwind.
- **Entregables:** Contenedor `DevToolsLayout`, Sidebar, Topbar.
- **Validación:** El layout no rompe el contenedor padre, ocupa el 100% disponible (`h-screen w-full`).

**Fase 2: Conexión de Estado Jotai y Tabs**
- **Objetivo:** Lograr navegar entre tabs y vincular los paneles al estado global.
- **Entregables:** `BottomPanel` con visualización JSON (StateViewer) para confirmar que los átomos (ej. `cacheAtom`) tienen datos.
- **Validación:** Los JSON muestran datos reales (o `{}` temporal), cambiar de tab renderiza el string correcto de la vista.

**Fase 3: Logger Panel**
- **Objetivo:** Panel de logs real-time.
- **Entregables:** Interfaz del panel de logs, hook `useLogger`, limitación a 500 ítems, auto-scroll.
- **Validación:** Disparar un intervalo que emita logs de prueba, confirmar scroll y límite en memoria.

**Fase 4: Cache UI y Virtualización**
- **Objetivo:** Construir el grid de imágenes.
- **Entregables:** `CacheGrid`, `CacheCard` (completamente maquetadas con Tailwind), stats cards superiores. 
- **Validación:** Mostrar 200 items dummy sin degradación de fps. La tarjeta seleccionada debe actualizar el panel derecho.

**Fase 5: Integración con Engine/IndexedDB**
- **Objetivo:** Llenar el grid con las miniaturas reales.
- **Entregables:** `useCacheExplorer`, leer blobs de IDB para mostrar URLs objeto temporalmente, integrar los botones "Clear Cache", "Delete".
- **Validación:** Hacer un fetch de la app, abrir el panel y confirmar que la imagen aparece. Borrarla debe sacarla de IDB y actualizar el widget de Items.

---

## 11. 🧪 CRITERIOS DE VALIDACIÓN (TESTABLE)

1. **DOM Boundaries:** El panel completo de DevTools nunca debe sobrepasar el 100vh y no debe causar scroll en la etiqueta `<body>` de la aplicación huésped.
2. **Re-render Rules:** Seleccionar una tarjeta en el `CacheGrid` NO debe causar un render de todo el `CacheGrid`. Solo `CacheCard` (estado visual de 'selected') y `ImageDetails` (receptor) deben actualizarse.
3. **Log Limits:** Emitir 1000 eventos seguidos no debe elevar la memoria RAM por encima del umbral esperado; el array se debe truncar de forma silenciosa y eficiente.

---

## 12. 🎨 DESIGN TOKENS (TAILWIND v4 @theme)

Definiciones base para `styles/devtools.css` usando la directiva de Tailwind v4. Esto creará automáticamente las clases utilitarias (`bg-dt-bg-base`, `text-dt-success`, etc.).

```css
@import "tailwindcss";

@theme {
  /* Colors - Base Theme (Next.js / Vercel Dark Style) */
  --color-dt-bg-base: #000000;
  --color-dt-bg-panel: #0A0A0A;
  --color-dt-bg-card: #111111;
  
  /* Colors - Borders */
  --color-dt-border: #333333;
  --color-dt-border-hover: #444444;
  
  /* Colors - Typography */
  --color-dt-text-primary: #FAFAFA;
  --color-dt-text-secondary: #888888;
  
  /* Colors - Indicators & Badges */
  --color-dt-success: #10B981; /* Emerald */
  --color-dt-warning: #F5A623; /* Next.js Warning */
  --color-dt-error: #FF0000;   /* Vercel Error Red */
  --color-dt-info: #0070F3;    /* Vercel Blue */
  
  /* Typography Variables */
  --font-dt-sans: 'Inter', system-ui, -apple-system, sans-serif;
  --font-dt-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```
