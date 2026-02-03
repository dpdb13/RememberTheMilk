# RememberTheMilk - Lista de la Compra

## Descripcion
App para crear y gestionar listas de la compra, compartirlas con otros usuarios.

## Stack Tecnico
- **Frontend:** React + TypeScript + Vite
- **Backend:** Supabase (PostgreSQL + Auth)
- **Hosting:** GitHub Pages (pendiente)
- **PWA:** Service Worker + manifest.json

## URLs
- **App local:** http://localhost:5173
- **App (pendiente deploy):** https://dpdb13.github.io/RememberTheMilk/
- **Repo:** (por crear)
- **Supabase:** https://onlrrhgehdbqctgsvhel.supabase.co (proyecto dedicado)

## Estructura del proyecto
```
src/
  components/
    Auth.tsx          - Login/registro/reset password
    ListSelector.tsx  - Lista de listas del usuario
    CreateList.tsx    - Modal para crear nueva lista
    ListHeader.tsx    - Cabecera con volver, undo, compartir, ajustes
    ShoppingList.tsx  - Items de la lista + input para anadir
    ListSettings.tsx  - Modal de ajustes (nombre, icono, eliminar)
  context/
    AuthContext.tsx   - Estado de autenticacion
    AppContext.tsx    - Estado de la app (listas, items, undo)
  lib/
    supabase.ts       - Cliente de Supabase
  types.ts            - Tipos TypeScript
public/
  manifest.json       - Manifest PWA
  sw.js               - Service Worker
  icon-*.png          - Iconos PWA
```

## Base de datos (Supabase)
Tablas a crear:
- `shopping_lists` - Listas de compra
- `list_shared_users` - Usuarios invitados a listas
- `list_items` - Items de cada lista

## Comandos utiles
```bash
npm run dev      # Servidor de desarrollo
npm run build    # Compilar para produccion
npm run deploy   # Desplegar a GitHub Pages
```

## Funcionalidades
- Login/registro con email
- Al registrarse se crea automaticamente "Lista de la compra"
- Crear multiples listas con nombre e icono
- Anadir items rapidamente (Enter)
- Marcar items como completados (se tachan y desaparecen)
- Boton undo para recuperar el ultimo item completado
- Compartir listas mediante enlace de invitacion
- Ajustes de lista (nombre, icono, eliminar)

## Paleta de colores
- Primary: #10B981 (verde)
- Background: #0D0D12 / #1A1A24
- Success: #10B981
- Danger: #FF6B6B

## Historial de sesiones

### 28 Enero 2026
- Proyecto creado desde cero
- Copiada arquitectura de Splitly (ExpensesApp)
- Creados todos los componentes basicos
- Pendiente: crear tablas en Supabase, generar iconos, probar
