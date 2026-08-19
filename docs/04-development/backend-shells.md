# Shells backend de TrazActivo v1.1

## Alcance

FND-003 entrega tres aplicaciones NestJS independientes:

- `apps/data-api`: shell del Data Plane con `GET /health` técnico;
- `apps/control-api`: shell del Control Plane con `GET /health` técnico;
- `apps/worker`: application context standalone sin jobs, consumidores ni mensajería funcional.

No incorpora Prisma, bases de datos, `ClientResolver`, `ClientContext`, autenticación, OpenAPI de
negocio, endpoints funcionales, Service Bus, `AssetItem` ni reglas contables.

## Separación y capas

Data API y Control API tienen módulos, bootstrap, configuración y procesos distintos. Sus
controllers sólo traducen HTTP hacia el servicio técnico de application y no importan domain o
infrastructure. Los límites `domain` quedan documentados pero vacíos de invariantes hasta sus Work
Packages propietarias.

El worker mantiene únicamente un timer idle técnico para conservar vivo el application context.
No existe handler, envelope, suscripción, cola ni procesamiento funcional. Una WP futura deberá
incorporar contexto explícito antes de habilitar consumidores.

Las aplicaciones no se importan entre sí ni comparten módulos internos. La duplicación mínima del
ciclo de shutdown y validación local es intencional hasta que una WP autorizada defina un package
compartido con responsabilidad y consumidores claros.

## Configuración local

| Aplicación  | Variable opcional         | Valor por defecto | Validación         |
| ----------- | ------------------------- | ----------------- | ------------------ |
| data-api    | `DATA_API_PORT`           | 3100              | entero 1024-65535  |
| control-api | `CONTROL_API_PORT`        | 3101              | entero 1024-65535  |
| worker      | `WORKER_IDLE_INTERVAL_MS` | 60000             | entero 1000-300000 |

Las aplicaciones enlazan las APIs a `127.0.0.1`. Una entrada inválida produce un código estable
sin reflejar el valor recibido. Los registros de startup/shutdown se construyen con una allowlist:
aplicación, evento, plano/modo, host, puerto y señal. No serializan `process.env`, errores, stacks,
secretos ni connection strings.

## Ejecución independiente

```text
npm run dev --workspace apps/data-api
npm run dev --workspace apps/control-api
npm run dev --workspace apps/worker
```

Builds independientes:

```text
npm run build --workspace apps/data-api
npm run build --workspace apps/control-api
npm run build --workspace apps/worker
```

Health local:

```text
GET http://127.0.0.1:3100/health
GET http://127.0.0.1:3101/health
```

Las respuestas sólo contienen `service`, `plane`, `status` y `version`. El health no consulta ni
simula una Client DB.

## Shutdown

Cada proceso registra `SIGINT` y `SIGTERM`. Las APIs cierran el servidor HTTP mediante
`app.close()`; el worker ejecuta sus hooks NestJS y libera el timer idle. El cierre es idempotente y
los fallos se registran con un evento estable sin incluir la excepción.

## Controles

- Unit tests ejecutan controller/service, configuración, health HTTP real y cierre idempotente.
- Architecture tests rechazan imports app→app, Prisma en los shells o health, controllers que
  salten application, configuración sensible en health y consumidores worker sin contexto.
- `passWithNoTests` permanece deshabilitado; los workspaces ejecutan suites reales.
