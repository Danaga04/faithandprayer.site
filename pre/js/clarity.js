// Microsoft Clarity - loaded on idle to avoid competing with LCP
(function () {
    var load = function () {
        (function (c, l, a, r, i, t, y) {
            c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
            t = l.createElement(r); t.async = 1; t.src = "https://www.clarity.ms/tag/" + i;
            y = l.getElementsByTagName(r)[0]; y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "vk5j4hi2fa");
    };
    if ('requestIdleCallback' in window) {
        requestIdleCallback(load, { timeout: 3000 });
    } else {
        setTimeout(load, 1500);
    }
})();
