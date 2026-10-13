# Alpha Galerie Creator · estúdio para DJs

Página de vendas para DJs em Perdizes, SP: treino com Pioneer, estúdio completo com painel LED para gravação e pacote fundador de 10 horas.

## Onde mexer

- **`config.js`**: preços (Pix e cartão), horários, WhatsApp, Instagram, Pixel da Meta, nome na fatura do cartão e texto da barra fixa do celular. Mudou aqui, muda na página e no Mercado Pago.
- **`index.html`**: textos da página.
- **`img/`**: fotos. Trocar um arquivo pelo mesmo nome troca a foto.

## Pagamento (Mercado Pago)

Os botões com `data-oferta="treino|videoset|pacote"` abrem a janela de pagamento (`assets/checkout.js`).
`api/checkout.js` é uma função da Vercel que cria o checkout, com o preço calculado a partir do `config.js`.

Variável de ambiente na Vercel: `MP_ACCESS_TOKEN` (Access Token de produção do Mercado Pago).
Sem ela, o botão de pagar leva o cliente para o WhatsApp.
