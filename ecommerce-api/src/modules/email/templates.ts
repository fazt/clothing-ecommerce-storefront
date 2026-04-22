export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const APP_NAME = process.env.APP_NAME || "Atelier";
const STORE_URL = process.env.PAYPAL_RETURN_URL?.replace(/\/checkout\/return$/, "") || "http://localhost:3000";

const baseStyles = `
  body, html { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: #111; background: #f4f4f5; }
  .wrap { width: 100%; background: #f4f4f5; padding: 24px 0; }
  .card { max-width: 560px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
  .header { background: #111; color: #fff; padding: 24px; text-align: center; }
  .header h1 { margin: 0; font-size: 22px; letter-spacing: 0.08em; }
  .body { padding: 28px 24px; }
  .body p { margin: 0 0 16px; line-height: 1.5; font-size: 15px; }
  .btn { display: inline-block; background: #111; color: #fff !important; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-weight: 600; }
  .muted { color: #666; font-size: 13px; }
  .table { width: 100%; border-collapse: collapse; margin: 16px 0; }
  .table th, .table td { padding: 10px 12px; border-bottom: 1px solid #eee; text-align: left; font-size: 14px; }
  .table th { background: #fafafa; font-weight: 600; }
  .total { text-align: right; font-size: 16px; font-weight: 700; padding-top: 12px; }
  .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #888; background: #fafafa; }
`;

function shell(title: string, inner: string): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
    <style>${baseStyles}</style>
  </head>
  <body>
    <div class="wrap">
      <div class="card">
        <div class="header"><h1>${APP_NAME.toUpperCase()}</h1></div>
        <div class="body">${inner}</div>
        <div class="footer">© ${new Date().getFullYear()} ${APP_NAME}. Todos los derechos reservados.</div>
      </div>
    </div>
  </body>
</html>`;
}

function escape(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function welcomeEmail(params: {
  name: string | null;
  email: string;
}): EmailTemplate {
  const greeting = params.name ? `Hola ${escape(params.name)}` : "Hola";
  const subject = `Bienvenido a ${APP_NAME}`;
  const html = shell(
    subject,
    `
    <p>${greeting},</p>
    <p>Gracias por crear tu cuenta en <strong>${APP_NAME}</strong>. Estamos felices de tenerte.</p>
    <p>Ya puedes explorar la colección y hacer tu primera compra con tu cuenta <strong>${escape(params.email)}</strong>.</p>
    <p style="text-align:center; margin: 28px 0;"><a href="${STORE_URL}/products" class="btn">Explorar la tienda</a></p>
    <p class="muted">Si no reconoces este registro, puedes ignorar este mensaje.</p>
    `,
  );
  const text = `${greeting},

Gracias por crear tu cuenta en ${APP_NAME}. Tu cuenta: ${params.email}

Visita la tienda: ${STORE_URL}/products

Si no reconoces este registro, ignora este mensaje.`;
  return { subject, html, text };
}

export function passwordResetEmail(params: {
  name: string | null;
  resetUrl: string;
}): EmailTemplate {
  const greeting = params.name ? `Hola ${escape(params.name)}` : "Hola";
  const subject = `Restablece tu contraseña en ${APP_NAME}`;
  const html = shell(
    subject,
    `
    <p>${greeting},</p>
    <p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. Si fuiste tú, haz click en el botón para elegir una nueva.</p>
    <p style="text-align:center; margin: 28px 0;"><a href="${escape(params.resetUrl)}" class="btn">Restablecer contraseña</a></p>
    <p class="muted">Este enlace es válido durante 1 hora. Si no solicitaste cambiar tu contraseña, puedes ignorar este correo — nadie tendrá acceso a tu cuenta sin entrar al link.</p>
    <p class="muted">Si el botón no funciona, copia y pega este enlace en tu navegador:<br/><span style="word-break:break-all">${escape(params.resetUrl)}</span></p>
    `,
  );
  const text = `${greeting},

Solicitaste restablecer la contraseña de tu cuenta en ${APP_NAME}.

Abre este enlace (válido por 1 hora):
${params.resetUrl}

Si no fuiste tú, puedes ignorar este mensaje.`;
  return { subject, html, text };
}

export interface ConfirmationItem {
  name: string;
  quantity: number;
  unitPrice: number;
}

export function orderConfirmationEmail(params: {
  name: string | null;
  orderId: string;
  total: number;
  paymentMethod: string;
  items: ConfirmationItem[];
}): EmailTemplate {
  const greeting = params.name ? `Hola ${escape(params.name)}` : "Hola";
  const shortId = params.orderId.slice(0, 8).toUpperCase();
  const subject = `Confirmación de compra #${shortId} — ${APP_NAME}`;
  const rows = params.items
    .map(
      (i) => `<tr>
        <td>${escape(i.name)}</td>
        <td style="text-align:center">${i.quantity}</td>
        <td style="text-align:right">$${(i.unitPrice * i.quantity).toFixed(2)}</td>
      </tr>`,
    )
    .join("");
  const html = shell(
    subject,
    `
    <p>${greeting},</p>
    <p>¡Gracias por tu compra en <strong>${APP_NAME}</strong>! Hemos recibido tu pago y tu pedido está en preparación.</p>
    <p><strong>Pedido:</strong> #${shortId}<br/><strong>Método de pago:</strong> ${escape(params.paymentMethod)}</p>
    <table class="table">
      <thead><tr><th>Producto</th><th style="text-align:center">Cant.</th><th style="text-align:right">Subtotal</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <p class="total">Total: $${params.total.toFixed(2)}</p>
    <p style="text-align:center; margin: 28px 0;"><a href="${STORE_URL}/dashboard/my-orders" class="btn">Ver mis pedidos</a></p>
    <p class="muted">Te avisaremos cuando tu pedido sea enviado. Si tienes alguna duda, responde a este correo.</p>
    `,
  );
  const itemsText = params.items
    .map(
      (i) => `- ${i.name} x${i.quantity}  $${(i.unitPrice * i.quantity).toFixed(2)}`,
    )
    .join("\n");
  const text = `${greeting},

Gracias por tu compra en ${APP_NAME}.

Pedido #${shortId}
Método de pago: ${params.paymentMethod}

${itemsText}

Total: $${params.total.toFixed(2)}

Ver tus pedidos: ${STORE_URL}/dashboard/my-orders`;
  return { subject, html, text };
}
