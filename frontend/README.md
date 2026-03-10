# GestorTool Frontend

Projeto frontend baseado em React 18 + Vite + TypeScript, com integração Keycloak e Material UI (MUI v5).

Comandos iniciais:

```bash
# na pasta frontend
npm install
npm run dev
```

Dependências chave configuradas:
- react, react-dom, react-router-dom
- @mui/material, @mui/icons-material, @emotion/react, @emotion/styled
- keycloak-js
- axios
- jwt-decode

Configuração Keycloak esperada (para desenvolvimento):
- realm: `white-label`
- clientId: `web-client`
- url: `http://localhost:8080`
- fluxo: standard flow, PKCE habilitado

Arquivos principais:
- `src/auth/keycloak.ts` - instancia Keycloak
- `src/auth/AuthProvider.tsx` - provê contexto de autenticação
- `src/routes/ProtectedRoute.tsx` - protege rotas privadas
- `src/services/api.ts` - axios com interceptor para Authorization
- `src/components/Layout.tsx` - AppBar + Drawer base com MUI
- `src/pages/Dashboard.tsx` - tela de dashboard exibindo username/email/tenant_id
