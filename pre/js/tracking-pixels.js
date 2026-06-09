(function () {
    'use strict';

    window.CELESTINO_TRACKING = { metaEnabled: false, capiEnabled: false };

    if (Array.isArray(window.__capiQueue)) {
        window.__capiQueue.length = 0;
    } else {
        window.__capiQueue = [];
    }

    if (typeof window.fbq !== 'function' || !window.fbq.__celestinoNoop) {
        var noop = function () { };
        noop.__celestinoNoop = true;
        noop.queue = [];
        noop.loaded = false;
        noop.version = 'noop';
        noop.push = noop;
        window.fbq = noop;
        window._fbq = noop;
    }

    if (!window.CAPITracker || !window.CAPITracker.__celestinoNoop) {
        window.CAPITracker = {
            __celestinoNoop: true,
            track: function () { },
            trackCustom: function () { }
        };
    }
})();
