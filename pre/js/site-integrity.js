/*
 * site-integrity.js · tracker PASSIVO de clonadores.
 *
 * Detecta quando o site esta sendo servido de um dominio que NAO e o nosso
 * (= alguem clonou e republicou). NAO bloqueia, NAO redireciona, NAO atrapalha
 * trafego nenhum. Apenas dispara um beacon pra https://celestino.cloud/api/integrity-report
 * registrando onde a copia esta rodando (hostname, URL completa, referrer, UA).
 *
 * Como funciona:
 *   - JS carrega na pagina (inclusive na clone, ja que o cloner copia o HTML inteiro)
 *   - Verifica location.hostname contra ALLOWED_HOSTS
 *   - Se nao bate (= rodando em dominio alheio), beacon
 *   - Beacon usa navigator.sendBeacon (fire-and-forget, nao bloqueia load)
 *
 * Pra checar quem clonou: tail -f server/cloner-reports.jsonl
 */
(function () {
  'use strict';

  var ALLOWED_HOSTS = [
    'celestino.cloud',
    'www.celestino.cloud',
    'type.celestino.cloud',
    'localhost',
    '127.0.0.1',
  ];
  // Tambem libera IPs de rede local (192.168.*, 10.*, 172.16-31.*)
  var LOCAL_IP_RE = /^(192\.168\.|10\.|172\.(1[6-9]|2[0-9]|3[01])\.)/;
  var REPORT_URL = 'https://celestino.cloud/api/integrity-report';

  try {
    var host = location.hostname || '';
    if (ALLOWED_HOSTS.indexOf(host) !== -1) return;
    if (LOCAL_IP_RE.test(host)) return;

    // Dominio nao permitido: e clone. Dispara beacon UMA VEZ por sessao.
    if (sessionStorage.getItem('__integ_sent') === '1') return;
    try { sessionStorage.setItem('__integ_sent', '1'); } catch (e) {}

    var payload = JSON.stringify({
      host: host,
      url: location.href.slice(0, 500),
      ref: (document.referrer || '').slice(0, 500),
      ua: (navigator.userAgent || '').slice(0, 500),
      lang: (navigator.language || '').slice(0, 20),
      screen: (screen.width || 0) + 'x' + (screen.height || 0),
      tz: (Intl.DateTimeFormat().resolvedOptions().timeZone || '').slice(0, 60),
      t: Date.now(),
    });

    var sent = false;
    try {
      if (navigator.sendBeacon) {
        var blob = new Blob([payload], { type: 'application/json' });
        sent = navigator.sendBeacon(REPORT_URL, blob);
      }
    } catch (e) {}

    if (!sent) {
      try {
        fetch(REPORT_URL, {
          method: 'POST',
          body: payload,
          headers: { 'Content-Type': 'application/json' },
          keepalive: true,
          mode: 'no-cors',
        });
      } catch (e) {}
    }
  } catch (e) {}
})();
