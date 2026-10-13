/* ============================================================
   CONFIG DA PÁGINA DE DJs — preços, contatos e medição.
   Lido pela página (index.html) e pela função de pagamento
   (api/checkout.js). Mude aqui e vale nos dois.
   ============================================================ */
(function (root) {
  var CONFIG = {
    NOME: "Alpha Galerie Creator",  /* aparece no Mercado Pago e no WhatsApp */
    WPP: "5511926441522",           /* WhatsApp de atendimento */
    INSTAGRAM: { dj: "alpha_space_sp", fundador: "lleomaster" },

    /* Pixel da Meta (só o número). Vazio = desligado. */
    META_PIXEL: "",

    /* Preços com a taxa do Mercado Pago embutida: pix (0,99%) e cartão à vista (4,98%). */
    OFERTAS: [
      { id: "treino", nome: "Treino", pagina: "/",
        uso: "2 horas na área de ensaio com Pioneer CDJ-200 + DJM-600",
        pix: 150, cartao: 158, sinal: 1,
        nota: "2 horas · o horário é confirmado no WhatsApp" },
      { id: "videoset", nome: "Videoset", pagina: "/",
        uso: "2 horas com painel LED 3×3 m, iluminação e som",
        pix: 300, cartao: 316, sinal: 1,
        nota: "2 horas · o horário é confirmado no WhatsApp" },
      { id: "pacote", nome: "Pacote fundador 10 h", pagina: "/",
        uso: "10 horas de Videoset com painel LED · blocos de 2 h",
        pix: 1000, cartao: 1045, sinal: 1,
        nota: "10 horas de Videoset para usar em até 90 dias · R$ 100 por hora" }
    ]
  };

  if (typeof module !== "undefined" && module.exports) module.exports = CONFIG;
  else root.ALPHA_CONFIG = CONFIG;
})(this);
