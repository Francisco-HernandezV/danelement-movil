# DanElement Móvil

App móvil (Expo SDK 57 + React Native + TypeScript) del sistema DanElement: catálogo, punto de venta, apartados y panel de administración. Consume la misma API REST que la web con autenticación JWT Bearer.

## Arranque rápido

```bash
npm install
cp .env.example .env      # ajusta EXPO_PUBLIC_API_URL
npx expo start
```

| Comando | Qué hace |
| --- | --- |
| `npm run lint` | ESLint (config de Expo) |
| `npm run typecheck` | Revisión de tipos de TypeScript |
| `npm test` | Todas las pruebas (Jest) |
| `npm run test:unit` | Solo pruebas unitarias (`test/unit`) |
| `npm run test:integration` | Solo pruebas de integración (`test/integration`) |
| `npm run test:ci` | Pruebas con reporte de cobertura (`coverage/`) |

## Arquitectura

MVVM organizado por funcionalidad:

```
src/
├── app/            Rutas (Expo Router). Solo pantallas y layouts.
├── features/<x>/   screens/ (vista) · viewmodels/ (estado y lógica) · components/
├── data/           models/ (tipos del dominio) · repositories/ (acceso a la API)
├── config/         Cliente HTTP, almacenamiento seguro, variables de entorno
└── context/        Estado global (sesión)
test/
├── unit/           Caja blanca: reglas de negocio puras (cobro, apartados)
└── integration/    Repositorio + cliente HTTP con la red simulada
```

## Flujo de trabajo (GitFlow)

```
feature/*  ──PR──▶  develop  ──PR──▶  release  ──PR──▶  main (+ tag vX.Y.Z)
             │                 │                  │
     CI + 1 aprobación   CI + pruebas      CI + AAB firmado
                         completas + APK   para Play Store
```

1. **Crear la rama** desde `develop`: `git switch develop && git pull && git switch -c feature/mi-cambio`.
2. **Commits** con [Conventional Commits](https://www.conventionalcommits.org/es/): `feat(ventas): ...`, `fix(auth): ...`, `test: ...`.
3. **Abrir PR hacia `develop`.** Al abrirlo corren en automático lint, typecheck, pruebas unitarias e integración y el escaneo SAST con Semgrep.
4. **Revisión.** Un compañero revisa el código y lo aprueba. El botón de *merge* solo se habilita cuando el CI está en verde **y** hay una aprobación. Las dos cosas son requisito; el CI no reemplaza la revisión.
5. **`develop` → `release`** cuando hay un grupo de funcionalidades listo. Se repiten las pruebas y se genera un **APK** instalable para las pruebas de caja negra (manuales/E2E) y de regresión.
6. **`release` → `main`** cuando las pruebas en release están bien. Se genera el **AAB** firmado para Google Play, y se crean el tag `vX.Y.Z` y un GitHub Release con las notas de cambios.

Usa títulos de PR como `chore(release): ...` para los PR de develop → release y de release → main.

Nadie hace *push* directo a `develop`, `release` ni `main`: todo entra por Pull Request.

## CI/CD

| Workflow | Cuándo corre | Qué hace |
| --- | --- | --- |
| `ci-validaciones.yml` | Push o PR a `develop`, `release`, `main` | Lint, typecheck, pruebas unitarias + integración (con cobertura), Semgrep SAST |
| `cd-playstore.yml` | Push a `release` o `main` | Repite las pruebas, calcula la versión y compila con EAS: APK (`preview`) en release, AAB (`production`) + tag + GitHub Release en main |

### Versionado automático

Nadie edita la versión a mano. `scripts/siguiente-version.sh` mira los commits desde el último tag `vX.Y.Z`:

| Commits desde el último tag | Ejemplo | Versión |
| --- | --- | --- |
| Alguno con `!` o `BREAKING CHANGE` | `feat(api)!: cambia login` | 1.4.2 → **2.0.0** |
| Algún `feat` | `feat(inventario): matriz` | 1.4.2 → **1.5.0** |
| Solo `fix`, `chore`, etc. | `fix(ventas): cambio` | 1.4.2 → **1.4.3** |

En `release` el APK sale como `1.5.0-rc.<n>` (candidata) y en `main` como `1.5.0` con su tag. El `versionCode` de Android lo incrementa EAS. Por eso el CI exige que el **título del PR** siga Conventional Commits: al hacer *squash*, ese título es el commit que cuenta.

Requisitos del CD: el secreto `EXPO_TOKEN` en GitHub y el proyecto vinculado a EAS (`npx eas-cli@latest init`).
