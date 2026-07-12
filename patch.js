window.trades = [];
window.tradeId = 1;
window.livePriceTimer = null;
window.currentAssetSymbol = "BTCUSD"; // Internal state variable tracking

// 1. GLOBAL SWITCH TAB NAVIGATION LOGIC
window.switchTab = function(tabId) {
    console.log("Switching structural viewport to module layout panel: " + tabId);
    
    // Toggle navigation button highlight classes
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const matchedNav = document.getElementById('nav-' + tabId);
    if(matchedNav) matchedNav.classList.add('active');
    
    // Toggle main workspace display grid panes
    document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
    const matchedPanel = document.getElementById('panel-' + tabId);
    if(matchedPanel) matchedPanel.classList.add('active');
};

// 2. GLOBAL ASSET SWITCHER ENGINE LOGIC
window.sw = function(symbol, fallbackPrice, label) {
    window.currentAssetSymbol = symbol;
    console.log("Asset configuration channel swapped to: " + symbol);
    
    // Scanners capture inputs securely after verification mount
    const assetInput = document.getElementById('c-as') || document.getElementById('input-asset');
    const priceInput = document.getElementById('e-pr') || document.getElementById('input-price');
    const priceHeader = document.getElementById('t-pr') || document.getElementById('header-price-display');
    const labelHeader = document.getElementById('t-lbl') || document.querySelector('.stat-lbl');

    if (assetInput) assetInput.value = symbol;
    if (priceInput) priceInput.value = fallbackPrice;
    if (priceHeader) priceHeader.innerText = '$' + fallbackPrice.toLocaleString(undefined, {minimumFractionDigits: 2});
    if (labelHeader) labelHeader.innerText = label;
    
    // Adjust top layout toggle selections
    document.querySelectorAll('.asset-btn, .tab-btn').forEach(btn => btn.classList.remove('active'));
    
    if (symbol === 'XAUUSD') { const b = document.getElementById('b-gold') || document.getElementById('tab-XAUUSD'); if(b) b.classList.add('active'); }
    if (symbol === 'BTCUSD') { const b = document.getElementById('b-btc') || document.getElementById('tab-BTCUSD'); if(b) b.classList.add('active'); }
    if (symbol === 'USOUSD') { const b = document.getElementById('b-oil') || document.getElementById('tab-USOUSD'); if(b) b.classList.add('active'); }

    // Relaunch loop ticker to calculate new streams immediately
    window.startLivePriceFeed(symbol);
};

// 3. TRANSACTION TRADE PROCESSING CALCULATION CORE
window.ex = function(actionType) {
    const assetInput = document.getElementById('c-as') || document.getElementById('input-asset');
    const priceInput = document.getElementById('e-pr') || document.getElementById('input-price');
    const sizeInput = document.getElementById('e-sz') || document.getElementById('input-volume');
    
    const feeInput = document.getElementById('fee-pct') || document.getElementById('input-fee');
    const taxInput = document.getElementById('tax-pct') || document.getElementById('input-tax');

    const asset = assetInput ? assetInput.value : window.currentAssetSymbol;
    const price = priceInput ? parseFloat(priceInput.value) : 96420;
    const volume = sizeInput ? parseFloat(sizeInput.value) : 0.5088;
    const feePct = feeInput ? parseFloat(feeInput.value) : 0.1588;
    const taxPct = taxInput ? parseFloat(taxInput.value) : 20.0099;

    if (isNaN(price) || isNaN(volume) || volume <= 0) {
        alert("Please input valid price and volume parameters.");
        return;
    }

    const rawTotal = price * volume;
    const feesPaid = rawTotal * (feePct / 100);
    const adjustedTotal = actionType === 'BUY' ? (rawTotal + feesPaid) : (rawTotal - feesPaid);
    const timestamp = new Date().toLocaleTimeString();

    const newTrade = {
        id: window.tradeId++,
        time: timestamp,
        asset: asset,
        action: actionType,
        price: price.toFixed(2),
        size: volume.toFixed(4),
        rawTotal: rawTotal.toFixed(2),
        feesPaid: feesPaid.toFixed(2),
        taxPct: taxPct.toFixed(4),
        adjustedTotal: adjustedTotal.toFixed(2)
    };

    window.trades.push(newTrade);
    window.renderTables();
};

// 4. DATA LOG WINDOW GENERATOR MARKUP MAPS
window.renderTables = function() {
    const liveBody = document.getElementById('t-body') || document.getElementById('tape-rows');
    const vaultBody = document.getElementById('l-body');
    if (!liveBody) return;
    
    liveBody.innerHTML = '';
    if (vaultBody) vaultBody.innerHTML = '';

    window.trades.forEach(t => {
        const actionColor = t.action === 'BUY' ? 'var(--accent-green)' : 'var(--accent-red)';
        liveBody.innerHTML += `<tr><td style="padding: 10px 0; color: #9ca3af;">${t.time}</td><td style="padding: 10px 0; color: #f3f4f6;">${t.asset}</td><td style="padding: 10px 0; color:${actionColor}; font-weight:bold;">${t.action}</td><td style="padding: 10px 0; color: #f3f4f6;">$${parseFloat(t.price).toLocaleString()}</td><td style="padding: 10px 0; color: #9ca3af;">${t.size}</td></tr>`;
        if (vaultBody) {
            vaultBody.innerHTML += `<tr><td style="padding: 10px 0; color: #9ca3af;">#${t.id}</td><td style="padding: 10px 0; color: #f3f4f6;">${t.asset}</td><td style="padding: 10px 0; color:${actionColor}; font-weight:bold;">${t.action}</td><td style="padding: 10px 0; color: #f3f4f6;">$${parseFloat(t.rawTotal).toLocaleString()}</td><td style="padding: 10px 0; color: #9ca3af;">$${t.feesPaid}</td><td style="padding: 10px 0; color: #9ca3af;">${t.taxPct}%</td><td style="padding: 10px 0; color:var(--gold); font-weight:bold;">$${parseFloat(t.adjustedTotal).toLocaleString()}</td></tr>`;
        }
    });
};

// 5. RELIABLE BACKEND SYNC LOOPS PIPELINE
window.startLivePriceFeed = function(symbol) {
    if (window.livePriceTimer) {
        clearInterval(window.livePriceTimer);
    }

    let tickerPair = "BTCUSDT"; 
    if (symbol === "XAUUSD") tickerPair = "PAXGUSDT"; 
    if (symbol === "USOUSD") tickerPair = "USDCUSDT"; 

    async function fetchLatestPriceTick() {
        try {
            // Using a standard high-availability CORS-unlocked pricing endpoint pool
            const response = await fetch(`https://binance.com{tickerPair}`);
            const data = await response.json();
            const livePrice = parseFloat(data.price);

            if (!isNaN(livePrice)) {
                // Safely update inputs only if they are confirmed present inside the DOM layout
                const priceInput = document.getElementById('e-pr') || document.getElementById('input-price');
                if (priceInput) priceInput.value = livePrice.toFixed(2);

                const priceHeader = document.getElementById('t-pr') || document.getElementById('header-price-display');
                if (priceHeader) {
                    priceHeader.innerText = '$' + livePrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                    });
                }
            }
        } catch (e) {
            console.warn("Live data mapping refresh delay caught: ", e);
        }
    }

    fetchLatestPriceTick();
    window.livePriceTimer = setInterval(fetchLatestPriceTick, 2000); // Polls every 2 seconds safely
};

// CRITICAL BYPASS: This block locks execution threads until layout structures finish loading [2]
window.onload = function() {
    console.log("TapeLedger Engine: UI structures confirmed live. Activating loops.");
    window.startLivePriceFeed("BTCUSD");
};
