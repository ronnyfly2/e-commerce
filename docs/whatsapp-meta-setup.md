# Configurar WhatsApp Business Cloud API (Meta)

Guía para conectar un número de WhatsApp a este sistema usando la **WhatsApp Business Platform (Cloud API)** de Meta — es la opción oficial y gratuita (no requiere hosting propio de servidor de WhatsApp, a diferencia de la "On-Premises API" que Meta descontinuó).

## 1. Cuenta de Meta Business

1. Entra a [business.facebook.com](https://business.facebook.com) y crea (o usa) una **Cuenta de Empresa de Meta**.
2. Verifica los datos de la empresa (nombre legal, dirección, teléfono). Sin esto, WhatsApp funciona en modo de prueba con límites muy bajos.

## 2. Crear la App de Meta

1. Ve a [developers.facebook.com/apps](https://developers.facebook.com/apps) → **Crear app** → tipo **"Empresa"**.
2. Dentro de la app, agrega el producto **WhatsApp**.
3. Meta te asigna automáticamente:
   - Un **número de prueba** gratuito (solo puede enviar a hasta 5 números verificados manualmente) — sirve para desarrollo.
   - Un **WhatsApp Business Account ID** (WABA ID) y un **Phone Number ID** — los vas a necesitar como variables de entorno.

## 3. Número de teléfono real (producción)

Cuando quieras usar tu número real de negocio:

1. En el panel de WhatsApp → **Configuración de API** → **Agregar número de teléfono**.
2. El número **no puede estar activo en la app de WhatsApp normal o WhatsApp Business app** al mismo tiempo — hay que migrarlo o usar uno nuevo.
3. Verifica el número por SMS o llamada.
4. Completa el **perfil de negocio** (nombre visible, foto, descripción, categoría, sitio web).

## 4. Tokens de acceso

Hay dos tipos:

| Tipo | Duración | Uso |
|---|---|---|
| Token temporal (desde el panel de la app) | 24 horas | Solo para probar rápido con `curl`/Postman |
| Token de **Usuario del Sistema** (System User) | No expira (hasta que lo revoques) | El que usa el backend en producción |

Para el token permanente:
1. Ve a **Configuración del negocio** → **Usuarios del sistema** → crea un usuario de sistema con rol **Administrador**.
2. Asígnale la app de WhatsApp con permisos `whatsapp_business_messaging` y `whatsapp_business_management`.
3. Genera el token desde ahí — **guárdalo como secreto**, nunca lo subas al repo (va en `.env`, ya está en `.gitignore`).

## 5. Webhook (para recibir mensajes entrantes)

Meta necesita una URL **HTTPS pública** para mandarte los mensajes que te escriben los clientes. En desarrollo local puedes exponer el backend con [ngrok](https://ngrok.com) (`ngrok http 3000`) o similar.

1. En el panel de WhatsApp → **Configuración** → **Webhook** → **Editar**.
2. **URL de callback**: `https://tu-dominio.com/api/v1/whatsapp/webhook` (o la ruta que definamos en el backend).
3. **Token de verificación**: cualquier string secreto que tú definas (ej. `WHATSAPP_WEBHOOK_VERIFY_TOKEN` en `.env`) — Meta hace un `GET` con `hub.verify_token` y el backend debe responder con `hub.challenge` si coincide.
4. **Campos a suscribir**: como mínimo `messages` (mensajes entrantes) y `message_template_status_update` (si vas a usar plantillas).

## 6. Plantillas de mensaje (obligatorias fuera de la ventana de 24h)

WhatsApp solo permite responder **libremente** dentro de las 24 horas después de que el cliente te escribió. Para iniciar una conversación tú (ej. confirmar un pedido, recordatorio) fuera de esa ventana, necesitas una **plantilla aprobada por Meta**:

1. Panel de WhatsApp → **Plantillas de mensajes** → **Crear plantilla**.
2. Define categoría (Marketing, Utilidad, Autenticación), idioma y contenido con variables (`{{1}}`, `{{2}}`...).
3. Meta revisa en 24–48h. Rechazan plantillas que suenen a spam o no coincidan con la categoría declarada.

## 7. Variables de entorno que necesita el backend

Agregar a `backend/.env` (y su ejemplo en `.env.example`):

```
WHATSAPP_PHONE_NUMBER_ID=xxxxxxxxxxxxxxx
WHATSAPP_BUSINESS_ACCOUNT_ID=xxxxxxxxxxxxxxx
WHATSAPP_ACCESS_TOKEN=xxxxxxxxxxxxxxx
WHATSAPP_WEBHOOK_VERIFY_TOKEN=un-string-secreto-que-tu-eliges
WHATSAPP_APP_SECRET=xxxxxxxxxxxxxxx   # para validar la firma de cada webhook (X-Hub-Signature-256)
```

`WHATSAPP_APP_SECRET` está en **Configuración de la app** → **Básico** → **Secreto de la app**. Se usa para verificar que cada request al webhook realmente viene de Meta (firma HMAC-SHA256) — sin esto, cualquiera podría mandar mensajes falsos a tu webhook.

## 8. Probar que funciona (antes de tocar código)

Con el token temporal, prueba enviar un mensaje de texto directo a la Graph API:

```bash
curl -X POST "https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/messages" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "51999999999",
    "type": "text",
    "text": { "body": "Hola, este es un mensaje de prueba" }
  }'
```

Si responde con un `messages[0].id`, el envío funciona. El número destino debe estar en la lista de probadores autorizados si todavía usas el número de prueba gratuito.

## 9. Límites a tener en cuenta

- Número **sin verificar**: 250 destinatarios únicos por 24h.
- El límite sube automáticamente (1K → 10K → 100K → ilimitado) según el volumen de calidad de tus conversaciones — Meta lo evalúa solo, no se pide manualmente.
- Mensajes de plantilla (fuera de ventana de 24h) tienen **costo por conversación** — varía por país. Los mensajes dentro de la ventana de 24h de servicio al cliente son gratis en la mayoría de países desde 2024.

## 10. Qué falta del lado de este proyecto

Esta guía cubre solo la configuración en Meta. La integración real (endpoint de webhook, guardar conversaciones, disparar respuestas automáticas o notificar al equipo) todavía no está implementada en el backend — eso se define aparte según qué tan automático debe ser el bot.
