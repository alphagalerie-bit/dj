/* Reserva e pagamento da página de DJs.
   Botões com data-oferta="treino|videoset|pacote" abrem a janela de pagamento.
   O pagamento é criado em /api/checkout (Mercado Pago); se falhar, segue pelo WhatsApp. */
(function () {
  var CFG = window.ALPHA_CONFIG;
  var WPP = CFG.WPP;
  var BRL = function (n) { return "R$ " + n.toLocaleString("pt-BR"); };
  var PAY_NOME = { pix: "Pix", cartao: "Cartão à vista" };
  var state = { oferta: null, pay: "pix" };
  /* Textos vindos do config: <span data-cfg="SESSOES"></span> */
  document.querySelectorAll("[data-cfg]").forEach(function (el) { if (CFG[el.getAttribute("data-cfg")]) el.textContent = CFG[el.getAttribute("data-cfg")]; });
  var achar = function (id) { return CFG.OFERTAS.find(function (o) { return o.id === id; }); };

  /* ====== PIXEL DA META (liga só com CFG.META_PIXEL) ====== */
  function track(evento, dados) { if (window.fbq) window.fbq("track", evento, dados || {}); }
  if (CFG.META_PIXEL) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); };
      if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0;
      t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", CFG.META_PIXEL);
    track("PageView");
  }

  /* ====== WHATSAPP ====== */
  function linkWpp(msg) { return "https://wa.me/" + WPP + "?text=" + encodeURIComponent(msg); }
  document.querySelectorAll("[data-wpp]").forEach(function (a) {
    a.href = linkWpp(a.getAttribute("data-wpp")); a.target = "_blank"; a.rel = "noopener";
  });
  document.querySelectorAll("[data-ig]").forEach(function (a) {
    var h = CFG.INSTAGRAM[a.getAttribute("data-ig")]; if (!h) return;
    a.href = "https://www.instagram.com/" + h + "/"; a.textContent = "@" + h; a.target = "_blank"; a.rel = "noopener";
  });
  (function () {
    var a = document.createElement("a");
    a.className = "wa-float"; a.target = "_blank"; a.rel = "noopener";
    a.href = linkWpp("Olá! Vim pela página do " + CFG.NOME + " e quero saber mais.");
    a.title = "Atendimento das " + CFG.ATENDIMENTO;
    a.setAttribute("aria-label", "Falar no WhatsApp");
    a.innerHTML = '<svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M16 3C8.8 3 3 8.7 3 15.8c0 2.5.7 4.9 2 7L3 29l6.4-2c2 1.1 4.3 1.7 6.6 1.7 7.2 0 13-5.7 13-12.8S23.2 3 16 3zm0 23.4c-2.1 0-4.1-.6-5.9-1.7l-.4-.3-3.8 1.2 1.2-3.7-.3-.4a10.4 10.4 0 0 1-1.7-5.7C5.1 9.9 10 5.2 16 5.2s10.9 4.7 10.9 10.6S22 26.4 16 26.4zm6-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1-1.9-.9-3.1-1.7-4.4-3.8-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.5l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.8.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.3 3.1c.2.2 2.2 3.3 5.3 4.6 2 .8 2.7.9 3.7.8.6-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.7-.5z"/></svg>';
    document.body.appendChild(a);
  })();
  document.addEventListener("click", function (e) {
    if (e.target.closest('a[href^="https://wa.me/"]')) track("Contact");
  });

  /* ====== JANELA DE PAGAMENTO ====== */
  var modal = document.createElement("div");
  modal.className = "pay-modal"; modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true");
  modal.setAttribute("aria-hidden", "true");
  modal.innerHTML =
    '<div class="pay-sheet">' +
      '<div class="pay-top"><h3 class="serif" id="pmTitulo">Reservar</h3><button class="pay-x" type="button" aria-label="Fechar">&times;</button></div>' +
      '<p class="pay-uso" id="pmUso"></p>' +
      '<div class="pay-field"><span class="pay-lbl">Pagamento</span><div class="pay-opts">' +
        '<button type="button" data-pay="pix">Pix</button><button type="button" data-pay="cartao">Cartão à vista</button></div></div>' +
      '<div class="pay-field"><label class="pay-lbl" for="pmNome">Seu nome ou nome artístico</label><input id="pmNome" type="text" autocomplete="name" placeholder="Como te chamam"></div>' +
      '<div class="pay-field"><label class="pay-lbl" for="pmWpp">Seu WhatsApp</label><input id="pmWpp" type="tel" autocomplete="tel" placeholder="(11) 9...."></div>' +
      '<div class="pay-field"><label class="pay-lbl" for="pmEmail">Seu e-mail</label><input id="pmEmail" type="email" autocomplete="email" placeholder="voce@email.com"></div>' +
      '<div class="pay-field"><label class="pay-lbl" for="pmData">Dia e horário (sessões das ' + CFG.SESSOES + ')</label><input id="pmData" type="text" placeholder="Ex: sexta às 20h"></div>' +
      '<div class="pay-total"><span>Total</span><strong id="pmTotal"></strong></div>' +
      '<p class="pay-nota" id="pmNota"></p>' +
      '<button type="button" class="btn-gold pay-go" id="pmPagar">Pagar no Mercado Pago</button>' +
      '<button type="button" class="pay-alt" id="pmWppBtn">Prefiro fechar pelo WhatsApp</button>' +
      '<p class="pay-fine">Pagamento seguro pelo Mercado Pago. Se não houver o horário que você quer, devolvemos 100%.</p>' +
    '</div>';
  document.body.appendChild(modal);
  var $ = function (id) { return document.getElementById(id); };

  function refresh() {
    var o = achar(state.oferta); if (!o) return;
    $("pmTitulo").textContent = o.nome;
    $("pmUso").textContent = o.uso;
    $("pmTotal").textContent = BRL(o[state.pay]);
    $("pmNota").textContent = o.nota || "";
    modal.querySelectorAll("[data-pay]").forEach(function (b) { b.classList.toggle("on", b.getAttribute("data-pay") === state.pay); });
  }
  var ultimoFoco = null;
  function abrir(id) {
    state.oferta = id; refresh(); ultimoFoco = document.activeElement;
    modal.classList.add("show"); modal.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden"; modal.querySelector(".pay-x").focus();
    var o = achar(id); track("ViewContent", { content_name: o.nome, value: o.pix, currency: "BRL" });
  }
  function fechar() {
    modal.classList.remove("show"); modal.setAttribute("aria-hidden", "true");
    document.body.style.overflow = ""; if (ultimoFoco) ultimoFoco.focus();
  }
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-oferta]");
    if (t) { e.preventDefault(); abrir(t.getAttribute("data-oferta")); return; }
    if ((t = e.target.closest(".pay-modal [data-pay]"))) { state.pay = t.getAttribute("data-pay"); refresh(); }
  });
  modal.querySelector(".pay-x").addEventListener("click", fechar);
  modal.addEventListener("click", function (e) { if (e.target === modal) fechar(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && modal.classList.contains("show")) fechar(); });

  function campos() {
    return { nome: $("pmNome").value.trim(), wpp: $("pmWpp").value.trim(), email: $("pmEmail").value.trim(), data: $("pmData").value.trim() };
  }
  function viaWhatsApp() {
    var f = campos(), o = achar(state.oferta);
    if (!f.nome) { alert("Coloca seu nome pra gente saber quem é."); return; }
    var L = ["Olá! Quero garantir *" + o.nome + "* no " + CFG.NOME + ".", "", "Nome: " + f.nome];
    if (f.wpp) L.push("Meu WhatsApp: " + f.wpp);
    if (f.data) L.push("Dia e horário: " + f.data);
    L.push("Pagamento: " + PAY_NOME[state.pay], "Valor: " + BRL(o[state.pay]), "", "Pode confirmar e me mandar o Pix?");
    track("Contact");
    window.open(linkWpp(L.join("\n")), "_blank");
  }
  $("pmWppBtn").addEventListener("click", viaWhatsApp);
  $("pmPagar").addEventListener("click", function () {
    var btn = this, f = campos(), o = achar(state.oferta);
    if (!f.nome) { alert("Coloca seu nome pra gente saber quem é."); return; }
    btn.disabled = true; btn.textContent = "Abrindo o Mercado Pago...";
    track("InitiateCheckout", { content_name: o.nome, value: o[state.pay], currency: "BRL" });
    fetch("/api/checkout", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ oferta: o.id, pay: state.pay, nome: f.nome, email: f.email, wpp: f.wpp, data: f.data })
    }).then(function (r) { return r.json().then(function (d) { return { ok: r.ok, d: d }; }); })
      .then(function (x) { if (x.ok && x.d.url) { window.location.href = x.d.url; return; } throw new Error(x.d && x.d.erro); })
      .catch(function () {
        btn.disabled = false; btn.textContent = "Pagar no Mercado Pago";
        alert("Não conseguimos abrir o Mercado Pago agora. Vamos fechar pelo WhatsApp.");
        viaWhatsApp();
      });
  });

  /* ====== VOLTA DO MERCADO PAGO: ?pagamento=aprovado|pendente|falhou ====== */
  (function () {
    var q = new URLSearchParams(location.search), st = q.get("pagamento"), o = achar(q.get("oferta"));
    if (!st || !o) return;
    var txt = {
      aprovado: ["Pagamento aprovado!", "Chama a gente no WhatsApp para agendar o seu horário."],
      pendente: ["Pagamento em análise.", "Assim que o Mercado Pago aprovar, a gente confirma no WhatsApp."],
      falhou: ["O pagamento não foi concluído.", "Você pode tentar de novo ou fechar com a gente pelo WhatsApp."]
    }[st];
    if (!txt) return;
    if (st === "aprovado") track("Purchase", { content_name: o.nome, value: o.pix, currency: "BRL" });
    var msg = "Olá! " + (st === "falhou" ? "Tive um problema ao pagar " : "Acabei de pagar ") + o.nome + " no site do " + CFG.NOME + ". Quero agendar o meu horário.";
    var bar = document.createElement("div");
    bar.className = "paid-bar";
    bar.innerHTML = '<div><b>' + txt[0] + '</b> ' + txt[1] + '</div><a class="btn-gold" target="_blank" rel="noopener" href="' + linkWpp(msg) + '">Falar no WhatsApp</a>';
    document.body.insertBefore(bar, document.body.firstChild);
    history.replaceState(null, "", location.pathname);
  })();
})();
