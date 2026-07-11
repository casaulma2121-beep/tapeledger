window.trades = []; window.tradeId = 1;

window.switchTab = function(tabId) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    document.getElementById('nav-' + tabId).classList.add('active');
    document.querySelectorAll('.tab-panel').forEach(el => el.classList.remove('active'));
    document.getElementById('panel-' + tabId).classList.add('active');
};

window.sw = function(symbol, price, label) {
    document.getElementById('c-as').value = symbol;
    document.getElementById('e-pr').value = price;
    document.getElementById('t-pr').innerText = '$' + price.toLocaleString(undefined, {minimumFractionDigits: 2});
    document.getElementById('t-lbl').innerText = label;
    document.querySelectorAll('.asset-btn').forEach(btn => btn.classList.remove('active'));
    if(symbol === 'XAUUSD') document.getElementById('b-gold').classList.add('active');
    if(symbol === 'BTCUSD') document.getElementById('b-btc').classList.add('active');
    if(symbol === 'USOUSD') document.getElementById('b-oil').classList.add('active');
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

console.log("ENGINE OVERRIDE ACTIVE");
