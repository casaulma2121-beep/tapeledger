 window.trades = [];
window.tradeId = 1;

// Global tracking structure for our live network data feed
window.activeWsConnection = null;

window.switchTab = function(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + tabId).classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
    document.getElementById('panel-' + tabId).classList.add('active');
};

window.sw = function(symbol, fallbackPrice, label) {
    document.getElementById('c-as').value = symbol;
    document.getElementById('e-pr').value = fallbackPrice;
    document.getElementById('t-pr').innerText = '$' + fallbackPrice.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('t-lbl').innerText = label;
    document.querySelectorAll('.asset-btn').forEach(btn => btn.classList.remove('active'));
    
    // Toggle design highlight markers safely matching elements
    const goldBtn = document.getElementById('b-gold');
    const btcBtn = document.getElementById('b-btc');
    const oilBtn = document.getElementById('b-oil');
    
    if(symbol === 'XAUUSD' && goldBtn) goldBtn.classList.add('active');
    if(symbol === 'BTCUSD' && btcBtn) btcBtn.classList.add('active');
    if(symbol === 'USOUSD' && oilBtn) oilBtn.classList.add('active');

    // Instantly recalibrate our network data thread to stream the newly selected asset
    window.connectLivePriceFeed(symbol);
};

window.ex = function(actionType) {
    const asset = document.getElementById('c-as').value;
    const price = parseFloat(document.getElementById('e-pr').value);
    const volume = parseFloat(document.getElementById('e-sz').value);
    const feePct = parseFloat(document.getElementById('fee-pct').value);
    const taxPct = parseFloat(document.getElementById('tax-pct').value);

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

window.renderTables = function() {
    const liveBody = document.getElementById('t-body');
    const vaultBody = document.getElementById('l-body');
    if (!liveBody || !vaultBody) return;
    
    liveBody.innerHTML = '';
    vaultBody.innerHTML = '';

    window.trades.forEach(t => {
        const actionColor = t.action === 'BUY' ? 'var(--green)' : 'var(--red)';
        liveBody.innerHTML += `<tr><td>${t.time}</td><td>${t.asset}</td><td style="color:${actionColor}; font-weight:bold;">${t.action}</td><td>$${t.price}</td><td>${t.size}</td></tr>`;
        vaultBody.innerHTML += `<tr><td>#${t.id}</td><td>${t.asset}</td><td>${t.action}</td><td>$${t.rawTotal}</td><td>$${t.feesPaid}</td><td>${t.taxPct}%</td><td style="color:var(--gold);">$${t.adjustedTotal}</td></tr>`;
    });
};

// NEW LOGIC MODULE: Manages direct streaming network data connections
window.connectLivePriceFeed = function(symbol) {
    // If a network connection is already running from a previous tab, close it clean first
    if (window.activeWsConnection) {
        window.activeWsConnection.close();
    }

    // Convert internal database asset markers to matching public streaming targets
    let streamTicker = "btcusdt"; // Default
    if (symbol === "XAUUSD") streamTicker = "paxgusdt"; // Streams PAX Gold (token backed 1:1 by real gold bullion bars)
    if (symbol === "USOUSD") streamTicker = "wtiusdt";  // Streams Crude Oil proxy tracks

    console.log(`Piping live market data via channel: wss://://binance.com{streamTicker}@ticker`);
    
    // Boot open the raw binary streaming connection pipeline directly to the server infrastructure
    window.activeWsConnection = new WebSocket(`wss://://binance.com{streamTicker}@ticker`);

    // Parse streaming data frames immediately as they clear the pipeline wire
    window.activeWsConnection.onmessage = function(event) {
        const marketData = JSON.parse(event.data);
        const livePrice = parseFloat(marketData.c); // 'c' represents the true latest close price index tick
        
        if (!isNaN(livePrice)) {
            // Update the form numbers so your BUY/SELL calculations use the live price instantly
            const priceInput = document.getElementById('e-pr');
            if (priceInput) priceInput.value = livePrice.toFixed(2);

            // Update your dashboard's large gold top-right metrics title indicator banner text
            const priceHeader = document.getElementById('t-pr');
            if (priceHeader) {
                priceHeader.innerText = '$' + livePrice.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                });
            }
        }
    };

    window.activeWsConnection.onerror = function(err) {
        console.error("Live streaming connection network state warning caught: ", err);
    };
};

// Auto-boot your streaming ticker channel system as soon as the file drops into memory
document.addEventListener("DOMContentLoaded", function() {
    window.connectLivePriceFeed("BTCUSD");
});

console.log("ENGINE OVERRIDE ACTIVE - LIVE WEBSOCKET DATA STREAM CHANNELS MOUNTED");
