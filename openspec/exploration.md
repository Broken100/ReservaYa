## Exploration: ReservaYa — Estado Actual (Mayo 2026)

### Current State
ReservaYa es una plataforma de reservas para negocios ecuatorianos con frontend React 19 SPA, backend Supabase, y Google OAuth.

**Características Técnicas:**
- **Frontend**: React 19.0.1, Vite 6.2.3, Tailwind CSS 4.1.14, Motion 12.23.24, Lucide React 0.546.0
- **Routing**: React Router DOM 7.14.2 con rutas anidadas y `<Outlet />`
- **Backend**: Supabase (auth Google OAuth, PostgreSQL, RLS, Storage, Realtime)
- **IA**: `@google/genai` 1.29.0 instalado pero **sin uso real** — API key expuesta en bundle frontend
- **i18n**: i18next 26.0.8 (ES + EN, cobertura ~60%)
- **Pagos**: **Simulado** (PaymentPage.tsx usa setTimeout 2s)
- **Testing**: CERO tests — sin framework configurado
- **Build**: Vite con `@vitejs/plugin-react` y `@tailwindcss/vite`

**Estado Funcional:**
- 17 páginas, 43 archivos fuente
- Auth: Google OAuth con roles admin/client, payment_status gating
- Admin Dashboard: Overview, Agenda (day/month/year views), CRUD Services/Professionals/Products, Orders, Clients, Settings, Payment (simulado)
- Client Area: Explore businesses, MyBookings/Orders with ratings, Profile
- Public: Landing page, Booking micro-site per business slug, Contact page (form no funcional)
- 10 migraciones Supabase, 19 políticas RLS, RPC checkout para órdenes

### Affected Areas
- `src/` — 43 archivos: components (6), contexts (1), hooks (10), pages (17), lib (2), i18n (3), types (1)
- `supabase/migrations/` — 10 migraciones con esquema completo
- `vite.config.ts` — Expone GEMINI_API_KEY en el bundle (RIESGO CRÍTICO)
- `package.json` — 14 dependencias, sin testing, sin form validation

### Security Risks (Auditados)
1. **CRÍTICO**: GEMINI_API_KEY expuesta en vite.config.ts → bundle frontend
2. **ALTO**: Pagos simulados — sin procesador real
3. **ALTO**: RPC `checkout` acepta `unit_price` del cliente sin validar contra DB
4. **MEDIO**: `as any` usado extensivamente (supabase queries, form data)
5. **MEDIO**: Sin rate limiting en creación de bookings
6. **MEDIO**: Slugs pueden ser vacíos/duplicados
7. **BAJO**: Storage RLS permite upload a cualquier authenticated user sin validación tipo/tamaño
8. **BAJO**: Sin CSRF tokens custom (Supabase lo maneja)

### Code Quality Issues
- Archivos grandes: BookingPage (667L), AgendaPage (727L), SettingsPage (523L)
- Sin Error Boundary → crash de un componente = pantalla blanca
- Sin form validation library (validaciones manuales con if/alert)
- Sin skeletons (solo spinners genéricos)
- Cobertura i18n parcial — muchos strings hardcodeados en español
- `window.location.reload()` para refrescar estado (patrón frágil)

### Design Patterns
- Custom hooks como data stores (useBookings, useServices, etc.)
- Slide-over panels consistentes (overlay + animación desde derecha)
- Theme tokens centralizados en useTheme.ts
- Nested routes + Outlet para layouts
- Step-based wizard en BookingPage
- Custom events (window.dispatchEvent) para cross-component communication

### Recommendation
Ejecutar plan de mejora en 4 fases secuenciales:
- **Fase A**: Seguridad + Buenas Prácticas (API key, tipado, tests, validación)
- **Fase B**: Rediseño UI/UX (design system, i18n completa, a11y, refactors)
- **Fase C**: Agentes IA + Botones Flotantes (chatbot, asistente de reserva)
- **Fase D**: Diversificación (PayPhone, verticales de negocio, notificaciones)

### Ready for Proposal
**Yes** — El diagnóstico está completo y los riesgos están identificados.
