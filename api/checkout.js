/* Cria o pagamento no Mercado Pago e devolve o link do checkout.
   A credencial fica SÓ na variável de ambiente MP_ACCESS_TOKEN da Vercel.
   O preço sai do config.js aqui no servidor, nunca do navegador. */
const CONFIG = require("../config.js");

const MP = "https://api.mercadopago.com";
const PAY_TYPES = ["credit_card", "debit_card", "bank_transfer", "ticket", "atm"];
/* Pix é "bank_transfer" no Mercado Pago */
const PERMITIDO = { pix: ["bank_transfer"], cartao: ["credit_card", "debit_card"] };

function siteUrl(req) {
  if (process.env.SITE_URL) return process.env.SITE_URL.replace(/\/$/, "");
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  return "https://" + host;
}

/* Data de hoje em São Paulo, no formato ano-mês-dia */
function hojeSP() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
}

function limpa(v, max) {
  return String(v || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
}

async function mp(path, body, token, chave) {
  const r = await fetch(MP + path, {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json",
      "X-Idempotency-Key": chave
    },
    body: JSON.stringify(body)
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const err = new Error("mercadopago " + r.status + ": " + (data.message || "erro"));
    err.status = r.status;
    throw err;
  }
  return data;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ erro: "use POST" });
  }
  const token = process.env.MP_ACCESS_TOKEN;
  if (!token) return res.status(503).json({ erro: "pagamento não configurado" });

  let b;
  try { b = typeof req.body === "string" ? JSON.parse(req.body || "{}") : (req.body || {}); }
  catch (e) { return res.status(400).json({ erro: "pedido inválido" }); }
  const oferta = CONFIG.OFERTAS.find(o => o.id === b.oferta);
  const pay = b.pay === "cartao" ? "cartao" : "pix";
  if (!oferta) return res.status(400).json({ erro: "oferta inválida" });

  const nome = limpa(b.nome, 80);
  const email = limpa(b.email, 120);
  const wpp = limpa(b.wpp, 30);
  const quando = limpa(b.data, 120);
  if (!nome) return res.status(400).json({ erro: "nome obrigatório" });

  let titulo = CONFIG.NOME + " · " + oferta.nome;
  let show = null;
  if (oferta.id === "show") {
    show = CONFIG.SHOWS.find(s => s.id === b.show);
    if (!show || !show.disponivel) return res.status(400).json({ erro: "data indisponível" });
    if (show.data && show.data <= hojeSP()) return res.status(400).json({ erro: "data encerrada" });
    titulo += " · " + show.artista + " " + show.dia.replace(/^.*· /, "") + " · " + show.horario;
  }

  const total = oferta[pay];
  const valor = Math.round(total * (oferta.sinal || 1));
  const ref = ["studio", oferta.id, show ? show.id : "-", pay, Date.now().toString(36)].join("|");
  const base = siteUrl(req);
  const volta = base + (oferta.pagina || "/") + "?pagamento={st}&oferta=" + oferta.id + (show ? "&show=" + show.id : "");
  const metadata = {
    origem: "alpha-studio-site", oferta: oferta.id, show: show ? show.id : "",
    forma: pay, nome, whatsapp: wpp, quando, total
  };

  try {
    /* Social Club no cartão: assinatura que renova sozinha a cada N meses */
    if (oferta.assinatura && pay === "cartao") {
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
        return res.status(400).json({ erro: "e-mail obrigatório para a assinatura" });
      }
      const sub = await mp("/preapproval", {
        reason: CONFIG.NOME + " · " + oferta.nome + " (trimestral)",
        external_reference: ref,
        payer_email: email,
        back_url: volta.replace("{st}", "assinatura"),
        status: "pending",
        auto_recurring: {
          frequency: oferta.assinatura.meses,
          frequency_type: "months",
          transaction_amount: valor,
          currency_id: "BRL"
        }
      }, token, ref);
      return res.status(200).json({ url: sub.init_point, tipo: "assinatura" });
    }

    const pref = await mp("/checkout/preferences", {
      items: [{
        id: oferta.id,
        title: titulo,
        description: oferta.sinal < 1 ? "Sinal de " + Math.round(oferta.sinal * 100) + "% da reserva" : oferta.uso,
        category_id: "services",
        quantity: 1,
        currency_id: "BRL",
        unit_price: valor
      }],
      payer: Object.assign({ name: nome }, email ? { email } : {}),
      external_reference: ref,
      metadata,
      statement_descriptor: CONFIG.DESCRITOR || "ALPHAHOUSE",
      back_urls: {
        success: volta.replace("{st}", "aprovado"),
        pending: volta.replace("{st}", "pendente"),
        failure: volta.replace("{st}", "falhou")
      },
      auto_return: "approved",
      payment_methods: {
        excluded_payment_types: PAY_TYPES.filter(t => PERMITIDO[pay].indexOf(t) < 0).map(id => ({ id })),
        installments: 1
      }
    }, token, ref);
    return res.status(200).json({ url: pref.init_point, tipo: "pagamento" });
  } catch (e) {
    console.error(e.message);
    return res.status(502).json({ erro: "não foi possível criar o pagamento" });
  }
};
