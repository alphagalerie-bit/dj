# Alpha Galerie Creator · estúdio para DJs

Página de vendas para DJs em Perdizes, SP: treino com Pioneer, videoset com painel LED, pacote fundador de 10 horas e aulas de DJ.

## Onde mexer

- **`config.js`**: preços (Pix e cartão), WhatsApp, Instagram e Pixel da Meta. Mudou aqui, muda na página e no Mercado Pago.
- **`index.html`**: textos da página.
- **`img/`**: fotos. Trocar um arquivo pelo mesmo nome troca a foto.

## Pagamento (Mercado Pago)

Os botões com `data-oferta="treino|videoset|pacote"` abrem a janela de pagamento (`assets/checkout.js`).
`api/checkout.js` é uma função da Vercel que cria o checkout, com o preço calculado a partir do `config.js`.

Variável de ambiente na Vercel: `MP_ACCESS_TOKEN` (Access Token de produção do Mercado Pago).
Sem ela, o botão de pagar leva o cliente para o WhatsApp.
