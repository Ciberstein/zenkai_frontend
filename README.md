# Zenkai — Frontend

SPA de la plataforma de streaming de anime. React 19 + Vite, Redux Toolkit,
Tailwind 4 y MUI, contra la API de `zenkai_backend`.

## Arranque

```bash
npm install
cp .env.example .env   # VITE_API_URL apuntando al backend
npm run dev
```

## Estructura

```
index.html
vite.config.js
hooks/               Hooks reutilizables (debounce, scroll infinito, movil)
i18n/                Configuracion de i18next + lang/{es,en,ja}.json
public/              Estaticos servidos tal cual
src/
  main.jsx           Providers (redux, auth, admin) y montaje
  App.jsx            Tema MUI + tabla de rutas
  api/               Instancia de axios (refresh automatico) y prefijos
  config/            Configuraciones sueltas de librerias
  context/           Contextos globales: sesion y permisos de admin
  routes/            Rutas protegidas (User, Private, Admin)
  services/          Llamadas puntuales que no viven en el store
  store/             configureStore + slices/ (uno por recurso)
  utils/             Helpers puros
  components/
    layouts/         Marcos de pagina: User, Watch, Admin
    shared/          Piezas transversales (Navbar, AnimeCard, Rail, ...)
    pages/           Una carpeta por pagina con su XPage.jsx y partials/
      index.jsx      Barril unico que consume App.jsx
```

Cada pagina sigue el mismo patron: `XPage.jsx` orquesta (thunks + estado) y
los `partials/` solo pintan.

## Notas

- **Sesion por cookies httpOnly.** `src/api/axios.js` reintenta una vez tras
  refrescar el token y encola las peticiones que caen durante ese refresco.
- **Rutas publicas.** El catalogo se navega sin sesion (`Protected.User`);
  solo biblioteca y ajustes exigen login (`Protected.Private`).
- **Filtros en la URL.** Catalogo, busqueda y temporadas leen y escriben los
  query params, asi cualquier vista es compartible.
