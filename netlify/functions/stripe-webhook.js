// ============================================================
//  Netlify Function — stripe-webhook.js
//  Emplacement : /netlify/functions/stripe-webhook.js
//
//  Variables d'environnement à ajouter dans Netlify :
//  STRIPE_SECRET_KEY      → Stripe > Développeurs > Clés API > Clé secrète
//  STRIPE_WEBHOOK_SECRET  → Stripe > Développeurs > Webhooks > Signing secret
//  BREVO_API_KEY          → Brevo > Paramètres > Clés API
// ============================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {

  // ── 1. Vérifier la signature Stripe ──
  const sig = event.headers['stripe-signature'];
  let stripeEvent;

  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Signature invalide :', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // ── 2. Écouter uniquement le paiement confirmé ──
  if (stripeEvent.type !== 'checkout.session.completed') {
    return { statusCode: 200, body: 'Événement ignoré' };
  }

  const session  = stripeEvent.data.object;
  const email    = session.customer_details?.email || '';
  const fullName = session.customer_details?.name  || '';
  const prenom   = fullName.split(' ')[0] || 'toi';

  if (!email) {
    console.error('Pas d\'email trouvé');
    return { statusCode: 200, body: 'Pas d\'email' };
  }

  // ── 3. Envoyer l'email via Brevo ──
  const emailBody = {
    sender: {
      name:  'Charlotte — Iridescence',
      email: 'charlotte@formation-iridescence.fr'
    },
    to: [{ email, name: fullName }],
    subject: `✦ Bienvenue dans Iridescence, ${prenom} !`,
    htmlContent: `
<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f7f5ff;font-family:'Helvetica Neue',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f7f5ff;padding:40px 16px;">
<tr><td align="center">
<table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 8px 40px rgba(123,108,255,.1);">

  <!-- HEADER -->
  <tr>
    <td style="background:linear-gradient(135deg,#7B6CFF,#FF6BE8);padding:36px 40px;text-align:center;">
      <p style="margin:0;font-size:13px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:rgba(255,255,255,.75);">✦ Formation</p>
      <h1 style="margin:8px 0 0;font-size:28px;font-weight:800;color:#ffffff;letter-spacing:-.03em;font-style:italic;font-family:Georgia,serif;">Iridescence</h1>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:40px 40px 32px;">

      <p style="margin:0 0 20px;font-size:16px;color:#1a1730;line-height:1.7;">Bonjour <strong>${prenom}</strong>,</p>

      <p style="margin:0 0 16px;font-size:15px;color:#3d3a5c;line-height:1.8;">
        Ton paiement a bien été reçu et je suis tellement heureuse de t'accueillir dans Iridescence. Tu viens de franchir une étape importante et je suis là pour t'accompagner à chaque module.
      </p>

      <!-- CONNEXION -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0ff;border-radius:16px;border-left:4px solid #7B6CFF;margin:24px 0;">
        <tr>
          <td style="padding:24px 28px;">
            <p style="margin:0 0 14px;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7B6CFF;">✦ Tes informations de connexion</p>
            <p style="margin:0 0 8px;font-size:14px;color:#3d3a5c;">
              <strong style="color:#1a1730;">Site :</strong>
              <a href="https://www.formation-iridescence.fr" style="color:#7B6CFF;text-decoration:none;">www.formation-iridescence.fr</a>
            </p>
            <p style="margin:0;font-size:14px;color:#3d3a5c;">
              <strong style="color:#1a1730;">Ton code d'accès de formation :</strong>
              <span style="font-family:monospace;font-size:15px;font-weight:800;color:#7B6CFF;background:#ede9ff;padding:3px 10px;border-radius:6px;margin-left:6px;">IRIS2025</span>
            </p>
            <p style="margin:10px 0 0;font-size:12px;color:#6e6d85;font-style:italic;">Dès ta première connexion, la plateforme te demandera de créer ton propre mot de passe personnel.</p>
          </td>
        </tr>
      </table>

      <!-- ÉTAPES -->
      <p style="margin:0 0 14px;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:#7B6CFF;">✦ Les prochaines étapes</p>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;">
        <tr><td style="padding:6px 0;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(123,108,255,.12);border-radius:10px;text-align:center;vertical-align:middle;font-size:13px;font-weight:800;color:#7B6CFF;">1</td>
            <td style="padding-left:12px;font-size:14px;color:#3d3a5c;line-height:1.6;">Rends-toi sur www.formation-iridescence.fr</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(123,108,255,.12);border-radius:10px;text-align:center;vertical-align:middle;font-size:13px;font-weight:800;color:#7B6CFF;">2</td>
            <td style="padding-left:12px;font-size:14px;color:#3d3a5c;line-height:1.6;">Va dans l'onglet "Crée un compte" avec ton email et ton propre mot de passe. Dans la case "Code d'accès formation" rentre le code ci-dessus</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(123,108,255,.12);border-radius:10px;text-align:center;vertical-align:middle;font-size:13px;font-weight:800;color:#7B6CFF;">3</td>
            <td style="padding-left:12px;font-size:14px;color:#3d3a5c;line-height:1.6;">Ta demande d'accès m'est transmise et je la valide personnellement sous 24h</td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:6px 0;">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="width:32px;height:32px;background:rgba(123,108,255,.12);border-radius:10px;text-align:center;vertical-align:middle;font-size:13px;font-weight:800;color:#7B6CFF;">4</td>
            <td style="padding-left:12px;font-size:14px;color:#3d3a5c;line-height:1.6;">Dès validation, tu accèdes à l'intégralité de la formation et tu peux commencer le Module 1</td>
          </tr></table>
        </td></tr>
      </table>

      <!-- CONSEIL -->
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fff8;border-radius:16px;margin:0 0 24px;">
        <tr>
          <td style="padding:20px 24px;font-size:14px;color:#0a6b54;line-height:1.7;">
            📓 <strong>Un conseil de Charlotte :</strong> prends un carnet dédié à la formation. À chaque fin de module, on a un rendez-vous ensemble pour faire le point.
          </td>
        </tr>
      </table>

      <p style="margin:0 0 16px;font-size:15px;color:#3d3a5c;line-height:1.8;">En attendant, si tu as la moindre question n'hésite pas à me contacter :</p>

      <p style="margin:0 0 8px;">
        <a href="mailto:charlotte@formation-iridescence.fr" style="font-size:14px;font-weight:600;color:#7B6CFF;text-decoration:none;">✉️ charlotte@formation-iridescence.fr</a>
      </p>
      <p style="margin:0 0 28px;">
        <a href="https://wa.me/33613067034" style="font-size:14px;font-weight:600;color:#128C7E;text-decoration:none;">💬 WhatsApp : +33 6 13 06 70 34</a>
      </p>

      <p style="margin:0;font-size:15px;color:#3d3a5c;line-height:1.8;">À très vite,<br><strong style="color:#1a1730;">Charlotte 🌈</strong></p>

    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="padding:20px 40px;border-top:1px solid #ede9ff;text-align:center;">
      <p style="margin:0;font-size:11px;color:#b8b5d0;">
        ✦ Iridescence · © 2025 Charlotte Minet · Tous droits réservés<br>
        <a href="mailto:charlotte@formation-iridescence.fr" style="color:#b8b5d0;">charlotte@formation-iridescence.fr</a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`
  };

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept':       'application/json',
        'api-key':      process.env.BREVO_API_KEY,
        'content-type': 'application/json',
      },
      body: JSON.stringify(emailBody),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error('Erreur Brevo :', err);
      return { statusCode: 500, body: 'Erreur envoi email' };
    }

    console.log(`Email envoyé à ${email}`);
    return { statusCode: 200, body: 'OK' };

  } catch (err) {
    console.error('Erreur :', err);
    return { statusCode: 500, body: 'Erreur serveur' };
  }
};
