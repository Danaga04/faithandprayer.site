(() => {
    const ASSET_VERSION = '20260420';
    const CARD_BACK_SIZE = { width: 200, height: 301 };
    const CARD_FRONT_SIZE = { width: 640, height: 960 };
    const TOTAL_CARDS = 6;

    const withVersion = (path) => `${path}${path.includes('?') ? '&' : '?'}v=${ASSET_VERSION}`;
    const cardImages = [
        {
            key: 'wheel_of_fortune',
            label: 'Wheel of Fortune',
            message: "You've been spinning in the same loop for too long. The wheel just turned for you.",
            src: withVersion('../../global_images/cards/wheel_of_fortune2_opt.webp')
        },
        {
            key: 'tower',
            label: 'The Tower',
            message: "Something false in your life has to fall before what's yours can arrive. It's already breaking.",
            src: withVersion('../../global_images/cards/tower2_opt.webp')
        },
        {
            key: 'magician',
            label: 'The Magician',
            message: "There is a power inside you that was sealed off. It just woke up.",
            src: withVersion('../../global_images/cards/magician2_opt.webp')
        }
    ];

    const cardBackImage = withVersion('../../global_images/cards/card_back.webp');
    const maxSelections = cardImages.length;
    const storageKey = `pretest_state_${window.location.pathname.replace(/\//g, '_')}`;
    // Destino da VSL · pretest10 manda 100% do trafego pra vsltest (split vsl/v2 removido)
    const VSL_TARGET = '../vsltest/';

    const cardsContainer = document.getElementById('cardsContainer');
    const selectionText = document.getElementById('selectionText');
    const resultPanel = document.getElementById('resultPanel');
    const ctaLink = document.getElementById('ctaLink');
    const cardMessages = document.getElementById('cardMessages');
    const progressSegments = [
        document.getElementById('progressSeg1'),
        document.getElementById('progressSeg2'),
        document.getElementById('progressSeg3')
    ];

    if (!cardsContainer || !selectionText || !resultPanel || !ctaLink || !cardMessages) {
        return;
    }

    const initialSelectionText = selectionText.textContent.trim();
    const fallbackCtaHref = ctaLink.getAttribute('href') || ctaLink.href;
    const ctaBaseHref = getSplitCtaHref(fallbackCtaHref);
    const shuffledImages = shuffleArray(cardImages);
    const trackingParams = getTrackingParams();
    const imageMap = cardImages.reduce((map, image) => {
        map[image.key] = image;
        return map;
    }, {});
    const cards = [];

    let selectedCards = 0;
    let prefetchedDestination = '';

    createCards();
    restoreState();
    updateStatus();
    syncCtaHref();
    propagateCurrentParams();
    trackPageStepView();
    warmCardImages();

    cardsContainer.addEventListener('click', handleCardSelection);
    ctaLink.addEventListener('click', handleCtaClick);

    function getSplitCtaHref(fallbackHref) {
        // Trilho Stripe: ?funil=stripe faz a pressel mandar pra VSL do funil Stripe
        // (/en/stripe/vsltest/) em vez do CenterPag. Sem o parametro, nada muda —
        // o CenterPag continua 100% intacto. Permite anunciar /en/?funil=stripe e
        // testar o trilho Stripe completo, passando pela pressel.
        const params = new URLSearchParams(window.location.search);
        if ((params.get('funil') || '').toLowerCase() === 'stripe') {
            return '../stripe/vsltest/';
        }
        return VSL_TARGET || fallbackHref;
    }

    function getTrackingParams() {
        const params = new URLSearchParams(window.location.search);

        return {
            utm_source: params.get('utm_source') || '',
            utm_medium: params.get('utm_medium') || '',
            utm_campaign: params.get('utm_campaign') || '',
            utm_term: params.get('utm_term') || '',
            utm_content: params.get('utm_content') || '',
            pressel: params.get('pressel') || 'pretest10'
        };
    }

    function propagateCurrentParams() {
        if (window.UTMManager && typeof window.UTMManager.propagateCurrentParams === 'function') {
            window.UTMManager.propagateCurrentParams();
        }
    }

    function _generateEventId() {
        return (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
            ? crypto.randomUUID()
            : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0;
                return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
            });
    }

    function _queueCapiEvent(eventName, data, isCustom) {
        window.__capiQueue = window.__capiQueue || [];
        window.__capiQueue.push({
            event_name: eventName,
            event_id: _generateEventId(),
            event_source_url: window.location.href,
            event_time: Math.floor(Date.now() / 1000),
            custom_data: data,
            fire_pixel: true,
            is_custom: isCustom
        });
    }

    function trackMeta(eventName, extraData) {
        var data = Object.assign({
            content_name: 'en_pretest10',
            content_category: 'presell_step',
            page_path: window.location.pathname
        }, trackingParams, extraData || {});

        if (window.CAPITracker && typeof window.CAPITracker.track === 'function') {
            window.CAPITracker.track(eventName, data);
        } else if (typeof window.fbq === 'function') {
            window.fbq('track', eventName, data);
        } else {
            _queueCapiEvent(eventName, data, false);
        }
    }

    function trackMetaCustom(eventName, extraData) {
        var data = Object.assign({
            content_name: 'en_pretest10',
            content_category: 'presell_step',
            page_path: window.location.pathname
        }, trackingParams, extraData || {});

        if (window.CAPITracker && typeof window.CAPITracker.trackCustom === 'function') {
            window.CAPITracker.trackCustom(eventName, data);
        } else if (typeof window.fbq === 'function') {
            window.fbq('trackCustom', eventName, data);
        } else {
            _queueCapiEvent(eventName, data, true);
        }
    }

    function trackPageStepView() {
        trackMeta('ViewContent', {
            content_type: 'tarot_card_selection'
        });
    }

    function shuffleArray(items) {
        const cloned = [...items];

        for (let index = cloned.length - 1; index > 0; index -= 1) {
            const randomIndex = Math.floor(Math.random() * (index + 1));
            [cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]];
        }

        return cloned;
    }

    function createImage(source, alt, dimensions) {
        const image = document.createElement('img');
        image.src = source;
        image.alt = alt;
        image.width = dimensions.width;
        image.height = dimensions.height;
        image.decoding = 'async';
        return image;
    }

    function createCards() {
        const fragment = document.createDocumentFragment();

        for (let index = 0; index < TOTAL_CARDS; index += 1) {
            const card = document.createElement('button');
            card.type = 'button';
            card.className = 'card';
            card.setAttribute('aria-label', `Reveal card ${index + 1}`);
            card.dataset.position = String(index);

            const cardInner = document.createElement('div');
            cardInner.className = 'card-inner';

            const cardFront = document.createElement('div');
            cardFront.className = 'card-face card-front';

            const cardBack = document.createElement('div');
            cardBack.className = 'card-face card-back';

            const backImage = createImage(cardBackImage, 'Back of tarot card', CARD_BACK_SIZE);
            backImage.fetchPriority = 'high';
            cardBack.appendChild(backImage);

            const cardLabel = document.createElement('span');
            cardLabel.className = 'card-label';
            cardLabel.textContent = 'Tap';

            cardInner.append(cardFront, cardBack);
            card.append(cardInner, cardLabel);
            fragment.appendChild(card);

            cards.push({
                button: card,
                front: cardFront
            });
        }

        cardsContainer.appendChild(fragment);
    }

    function saveState() {
        const selections = cards
            .map(({ button }) => button)
            .filter((card) => card.classList.contains('is-revealed'))
            .map((card) => ({
                position: Number(card.dataset.position),
                cardKey: card.dataset.cardKey,
                selectionIndex: Number(card.dataset.selectionIndex)
            }));

        try {
            localStorage.setItem(storageKey, JSON.stringify({
                selections,
                shuffleOrder: shuffledImages.map((image) => image.key),
                complete: selectedCards === maxSelections
            }));
        } catch (error) {
            // Ignore storage quota and privacy mode errors.
        }
    }

    function restoreState() {
        let savedState;

        try {
            const rawState = localStorage.getItem(storageKey);
            if (!rawState) {
                return;
            }

            savedState = JSON.parse(rawState);
        } catch (error) {
            return;
        }

        if (!savedState || !Array.isArray(savedState.selections) || !savedState.selections.length) {
            return;
        }

        if (Array.isArray(savedState.shuffleOrder) && savedState.shuffleOrder.length === shuffledImages.length) {
            const restoredOrder = savedState.shuffleOrder
                .map((key) => imageMap[key])
                .filter(Boolean);

            if (restoredOrder.length === shuffledImages.length) {
                shuffledImages.splice(0, shuffledImages.length, ...restoredOrder);
            }
        }

        savedState.selections
            .slice()
            .sort((leftSelection, rightSelection) => leftSelection.selectionIndex - rightSelection.selectionIndex)
            .forEach((selection) => {
                const cardState = cards[selection.position];
                const imageData = imageMap[selection.cardKey];

                if (!cardState || !imageData) {
                    return;
                }

                revealCardUI(cardState, imageData, selection.selectionIndex);
                appendCardMessage(imageData, true);
                updateProgress(selection.selectionIndex + 1);
                selectedCards += 1;
            });

        if (savedState.complete && selectedCards === maxSelections) {
            finalizeSelection(false);
        }
    }

    function warmCardImages() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (connection && (connection.saveData || /2g/.test(connection.effectiveType || ''))) {
            return;
        }

        const warm = () => {
            cardImages.forEach((imageData) => {
                const image = new Image();
                image.decoding = 'async';
                image.src = imageData.src;

                if (typeof image.decode === 'function') {
                    image.decode().catch(() => {});
                }
            });
        };

        if ('requestIdleCallback' in window) {
            window.requestIdleCallback(warm, { timeout: 1200 });
            return;
        }

        window.setTimeout(warm, 180);
    }

    function handleCardSelection(event) {
        const card = event.target.closest('.card');

        if (!card || !cardsContainer.contains(card)) {
            return;
        }

        revealCard(card);
    }

    function revealCard(card) {
        if (card.disabled || card.classList.contains('is-revealed') || selectedCards >= maxSelections) {
            return;
        }

        const imageData = shuffledImages[selectedCards];
        const cardState = cards[Number(card.dataset.position)];

        if (!imageData || !cardState) {
            return;
        }

        revealCardUI(cardState, imageData, selectedCards);
        selectedCards += 1;

        appendCardMessage(imageData, false);
        updateProgress(selectedCards);

        saveState();
        updateStatus();

        if (selectedCards === maxSelections) {
            finalizeSelection(true);
        }
    }

    function revealCardUI(cardState, imageData, selectionIndex) {
        const frontImage = createImage(imageData.src, 'Revealed tarot card', CARD_FRONT_SIZE);
        frontImage.fetchPriority = 'high';
        cardState.front.replaceChildren(frontImage);

        cardState.button.classList.add('is-revealed');
        cardState.button.dataset.cardKey = imageData.key;
        cardState.button.dataset.selectionIndex = String(selectionIndex);
        cardState.button.disabled = true;
    }

    function appendCardMessage(imageData, instant) {
        if (!cardMessages || !imageData) {
            return;
        }

        const node = document.createElement('p');
        node.className = 'card-message';
        node.dataset.cardKey = imageData.key;

        const label = document.createElement('strong');
        label.textContent = imageData.label || '';

        node.appendChild(label);
        node.appendChild(document.createTextNode(imageData.message || ''));

        cardMessages.appendChild(node);

        if (instant) {
            node.classList.add('is-visible');
            return;
        }

        window.requestAnimationFrame(() => {
            window.requestAnimationFrame(() => {
                node.classList.add('is-visible');
            });
        });
    }

    function updateProgress(filledCount) {
        progressSegments.forEach((segment, index) => {
            if (!segment) return;
            segment.classList.toggle('active', index < filledCount);
        });

        const container = progressSegments[0] && progressSegments[0].parentElement;
        if (container) {
            container.setAttribute('aria-valuenow', String(Math.min(filledCount, maxSelections)));
        }
    }

    function disableRemainingCards() {
        cards.forEach(({ button }) => {
            if (button.classList.contains('is-revealed')) {
                return;
            }

            button.disabled = true;
            button.classList.add('is-inactive', 'is-hidden-card');
            button.setAttribute('aria-hidden', 'true');
        });
    }

    function showFinalSpread() {
        const revealedCards = cards
            .map(({ button }) => button)
            .filter((card) => card.classList.contains('is-revealed'));
        const towerCard = revealedCards.find((card) => card.dataset.cardKey === 'tower') || null;
        const sideCards = revealedCards
            .filter((card) => card !== towerCard)
            .sort((leftCard, rightCard) => Number(leftCard.dataset.selectionIndex) - Number(rightCard.dataset.selectionIndex));
        const orderedCards = towerCard
            ? [sideCards[0], towerCard, sideCards[1]].filter(Boolean)
            : [...revealedCards].sort((leftCard, rightCard) => Number(leftCard.dataset.selectionIndex) - Number(rightCard.dataset.selectionIndex));

        cardsContainer.classList.add('is-complete');

        orderedCards.forEach((card, index) => {
            card.classList.add('is-selected-spread');
            card.style.order = String(index + 1);
        });

        if (towerCard) {
            towerCard.classList.add('is-tower-card');
        }
    }

    function finalizeSelection(shouldTrackCompletion) {
        disableRemainingCards();
        showFinalSpread();
        resultPanel.classList.remove('is-hidden');
        syncCtaHref();
        maybePrefetchDestination();

        if (shouldTrackCompletion) {
            window.setTimeout(scrollToCta, 320);
            propagateCurrentParams();
        }
    }

    function updateStatus() {
        if (selectedCards === 0) {
            selectionText.textContent = initialSelectionText;
            return;
        }

        if (selectedCards < maxSelections) {
            const remainingCards = maxSelections - selectedCards;
            selectionText.textContent = `Tap ${remainingCards} more card${remainingCards > 1 ? 's' : ''}.`;
            return;
        }

        selectionText.textContent = 'Your spread is complete.';
    }

    function buildTargetUrl() {
        const targetUrl = new URL(ctaBaseHref, window.location.href);
        const currentParams = new URLSearchParams(window.location.search);

        currentParams.forEach((value, key) => {
            if (!targetUrl.searchParams.has(key)) {
                targetUrl.searchParams.set(key, value);
            }
        });

        return targetUrl;
    }

    function syncCtaHref() {
        ctaLink.href = buildTargetUrl().toString();
    }

    function maybePrefetchDestination() {
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;

        if (connection && (connection.saveData || /2g/.test(connection.effectiveType || ''))) {
            return;
        }

        const targetUrl = buildTargetUrl().toString();

        if (prefetchedDestination === targetUrl) {
            return;
        }

        prefetchedDestination = targetUrl;

        const prefetchLink = document.createElement('link');
        prefetchLink.rel = 'prefetch';
        prefetchLink.as = 'document';
        prefetchLink.href = targetUrl;
        prefetchLink.dataset.prefetch = 'pretest-vsl';
        document.head.appendChild(prefetchLink);
    }

    function scrollToCta() {
        const prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        window.requestAnimationFrame(() => {
            ctaLink.scrollIntoView(prefersReducedMotion ? {
                block: 'center'
            } : {
                behavior: 'smooth',
                block: 'center'
            });
        });
    }

    function handleCtaClick(event) {
        event.preventDefault();

        const targetUrl = buildTargetUrl();

        trackMetaCustom('PresellAdvance', {
            destination_path: targetUrl.pathname,
            cards_selected: selectedCards,
            target_step: 'vsl'
        });

        if (window.parent !== window) {
            try {
                window.parent.location.href = targetUrl.toString();
                return;
            } catch (error) {
                // Fall back to same-frame navigation when the parent cannot be redirected.
            }
        }

        window.location.href = targetUrl.toString();
    }
})();
