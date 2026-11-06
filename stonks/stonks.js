let c = document.getElementById("canvas");
let ctx = c.getContext('2d');

// Canvas dimensions and high-DPI resolution scaling
let canvasWidth = 1200;
let canvasHeight = 600;

function fixResolution() {
  const dpr = window.devicePixelRatio || 1;
  canvasWidth = window.innerWidth;
  canvasHeight = window.innerHeight;

  c.width = canvasWidth * dpr;
  c.height = canvasHeight * dpr;

  ctx.resetTransform();
  ctx.scale(dpr, dpr);
}

fixResolution();
window.addEventListener('resize', fixResolution);

let prices = [];
let price = Math.random() * 200 + 100;
let baseSpeed = 100;
let speedMultiplier = 1;
let speed = baseSpeed * speedMultiplier;
let time = 0;
let scrollX = 0;
let scrollY = 100;
let zoom = 1;
let mode = 0;
let trend = 2;
let instability = 2;
let money = 500;
let multiplier = 0;
let bet = 0;
let betPrice = 0;
let timeLeftH = 250;
let timeLeftL = 50;
let timeLeft = undefined;
let diff = 5;
let betCost = 50;
let debt = 'no';
let debtTimer = undefined;
let inL = 5;
let inH = 20;
let stocks = 0;
let cpr = 0;
let tH = 2.1;
let tL = 1.9;

// --- Menu UI Button Definitions (Anchored to panel) ---
const down = { x: 870, y: 350, width: 45, height: 45, color: 'red' };
const up = { x: 925, y: 350, width: 45, height: 45, color: 'green' };
const Bet = { x: 980, y: 350, width: 50, height: 45, color: 'grey' };
const withdrawl = { x: 1040, y: 350, width: 75, height: 45, color: 'white' };
const buy = { x: 870, y: 200, width: 110, height: 45, color: 'yellow' };
const sell = { x: 995, y: 200, width: 110, height: 45, color: 'orange' };

// Speed Selection Buttons
const speedBtn05 = { x: 870, y: 140, width: 50, height: 30, speedVal: 0.5 };
const speedBtn1 = { x: 930, y: 140, width: 50, height: 30, speedVal: 1.0 };
const speedBtn2 = { x: 990, y: 140, width: 50, height: 30, speedVal: 2.0 };
const speedBtn5 = { x: 1050, y: 140, width: 50, height: 30, speedVal: 5.0 };

const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

const key = {};
window.addEventListener('keydown', (e) => {
  key[e.key] = true;
  setTimeout(() => { key[e.key] = false; }, 50);
});

// Helper: Mouse wheel zoom ONLY on the chart section (left side)
c.addEventListener('wheel', (e) => {
  let pos = getMousePos(c, e);
  if (pos.x < 850) {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoom /= 1.1; // Zoom In
    } else {
      zoom *= 1.1; // Zoom Out
    }
    zoom = Math.max(0.01, Math.min(zoom, 10));
  }
}, { passive: false });

function write(x, y, text, size, color, align) {
  ctx.fillStyle = color;
  ctx.font = `${size}px sans-serif`;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
}

function getMousePos(canvas, event) {
  let rect = canvas.getBoundingClientRect();
  let scaleX = canvasWidth / rect.width;
  let scaleY = canvasHeight / rect.height;
  return {
    x: (event.clientX - rect.left) * scaleX,
    y: (event.clientY - rect.top) * scaleY
  };
}

function isInside(pos, rect) {
  return pos.x >= rect.x && pos.x <= rect.x + rect.width && pos.y >= rect.y && pos.y <= rect.y + rect.height;
}

// Convert stock price to Canvas Y coordinate (Higher price = higher on screen)
function priceToY(p) {
  return (canvasHeight / 2) - (p - scrollY) / zoom;
}

function draw() {
  speed = baseSpeed * speedMultiplier;
  ctx.clearRect(0, 0, canvasWidth, canvasHeight);

  // Stock price generator
  let intTime = Math.floor(time);
  while (prices.length <= intTime + 10) {
    let v = instability;
    let m = Math.random() * 75;
    if (prices.length < m && price > Math.random() * 10 + 10) {
      price += (Math.random() * v) - v / trend;
    } else {
      price += (Math.random() * v) - v / 2;
    }
    if (price < 0) price = 0;
    prices.push(price);
  }

  cpr = Math.floor(time);

  if (mode === 0) {
    time += speed / 1000;
    scrollX += (time - 50 - scrollX) / 5;
    scrollY += (prices[cpr] - scrollY) / 50;
    if (scrollY < 0) scrollY = 0;
  } else if (mode === 1) {
    if (keys['w']) scrollY += 3 * zoom;
    if (keys['s']) scrollY -= 3 * zoom;
    if (keys['a']) scrollX -= 3 * zoom;
    if (scrollX < time && keys['d']) scrollX += 3 * zoom;
    if (scrollY < 0) scrollY = 1;
  }

  if (keys['z']) zoom *= 1.01;
  if (keys['c']) zoom /= 1.01;
  if (keys['v']) zoom = 1;
  if (keys['q']) baseSpeed /= 1.01;
  if (keys['e']) baseSpeed *= 1.01;
  if (key['r']) baseSpeed = (baseSpeed !== 0) ? 0 : 100;

  if (key['x']) {
    if (mode === 0) {
      mode = 1;
    } else {
      scrollX += (time - 50 - scrollX) / 1.5;
      mode = 0;
    }
  }

  if (keys['f']) {
    prices.splice(intTime, prices.length - intTime);
  }

  // --- Draw Stock Chart Line ---
  ctx.beginPath();
  let limit = Math.min(intTime, prices.length - 1);
  let started = false;

  for (let i = 0; i <= limit; i++) {
    let px = 428 - (scrollX - i) / zoom;
    let py = priceToY(prices[i]);

    if (!started) {
      ctx.moveTo(px, py);
      started = true;
    } else {
      ctx.lineTo(px, py);
    }
  }

  ctx.lineWidth = 2;
  ctx.strokeStyle = '#00ff66';
  ctx.stroke();

  // --- Screen Mask Overlays ---
  ctx.fillStyle = '#000000';
  ctx.fillRect(0, 0, 50, canvasHeight); // Left scale background
  if (mode === 0) ctx.fillRect(430, 0, 420, canvasHeight); // Right edge fade
  ctx.fillRect(850, 0, canvasWidth - 850, canvasHeight); // Control panel mask

  // --- Grid Lines & Price Labels (Right Side Up) ---
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.lineTo(50, canvasHeight - 50);
  ctx.moveTo(850, 50);
  ctx.lineTo(850, canvasHeight - 50);

  let step = 1;
  if (zoom < 0.05 && zoom > 0.014) step = Math.floor(zoom * 100) / 100;
  else if (zoom < 0.2) step = Math.floor(zoom * 25) / 25;
  else if (zoom < 0.5) step = Math.floor(zoom * 6) / 6;

  let base = Math.floor(scrollY / 100);
  let range = (zoom >= 2) ? 10 * Math.floor(zoom) : 10;
  let stride = (zoom >= 2) ? Math.ceil(zoom / 2) : (step || 1);

  for (let i = base + range; i > base - range; i -= stride) {
    let val = Math.round(i * 100);
    let yPos = priceToY(val);

    if (yPos > 20 && yPos < canvasHeight - 20) {
      ctx.moveTo(50, yPos);
      ctx.lineTo(850, yPos);
      write(30, yPos + 4, val.toString(), 13, '#ffffff', 'center');
    }
  }
  ctx.stroke();

  // --- Control Panel Background ---
  ctx.fillStyle = '#141619';
  ctx.fillRect(850, 0, canvasWidth - 850, canvasHeight);

  trend = Math.random() * (tH - tL) + tL;
  instability = Math.random() * (inH - inL) + inL;

  if (multiplier === 0) bet = 0;
  let currentPrice = prices[cpr] || price;

  // Information Readout
  write(870, 50, "Stock Price: $" + (Math.floor(currentPrice * 100) / 100), 18, '#ffffff', 'left');

  if (money < 0) {
    write(100, 40, "You are in debt up to $1000", 24, '#ff4444', 'left');
    debt = 'yes';
  }

  if (money < -1000 || (debtTimer !== undefined && Math.floor(debtTimer) <= 0)) {
    alert('Game Over: Excess Debt!');
  }

  if (money >= 0) debtTimer = undefined;

  write(870, 80, "Money: $" + (Math.round(money * 100) / 100), 18, '#4CAF50', 'left');
  write(870, 110, "Stocks owned: " + stocks + " ($" + (Math.floor(stocks * currentPrice * 100) / 100) + ")", 18, '#ffffff', 'left');
  write(870, 140, "Time: " + Math.floor(time) + "s", 18, '#ffffff', 'left');
  write(870, 170, "Bet Fee: $" + Math.floor(betCost), 18, '#ffffff', 'left');

  if (timeLeft !== undefined) {
    let color = timeLeft < 25 ? '#ff4444' : timeLeft < 50 ? 'orange' : 'yellow';
    write(870, 480, "Bet Timer: " + Math.floor(timeLeft) + "s", 16, color, 'left');
  }

  let betted = (bet === 0) ? 'none' : (bet === 1 ? 'UP' : 'DOWN');
  write(870, 300, "Bet: " + betted + " | Multiplier: " + multiplier + "x", 16, '#ffffff', 'left');

  let gain = betPrice === 0 ? 0 : Math.floor(((currentPrice - betPrice) * bet * multiplier) / diff) * diff;
  write(870, 330, "Start: $" + (Math.round(betPrice * 100) / 100) + " | Profit: $" + gain, 16, gain >= 0 ? '#4CAF50' : '#FF5252', 'left');

  // --- Render UI Buttons ---
  drawRectButton(down, "DOWN", 'white');
  drawRectButton(up, "UP", 'white');
  drawRectButton(Bet, "BET", 'white');
  drawRectButton(withdrawl, "CASH OUT", 'black');

  drawRectButton(buy, "BUY STOCK", 'black');
  drawRectButton(sell, "SELL STOCK", 'black');

  // Speed selector buttons
  write(870, 420, "Speed Multiplier:", 14, '#cccccc', 'left');
  [speedBtn05, speedBtn1, speedBtn2, speedBtn5].forEach(btn => {
    let active = speedMultiplier === btn.speedVal;
    drawRectButton(btn, btn.speedVal + "x", active ? 'yellow' : 'white', active ? '#4444aa' : '#222233');
  });

  if (mode === 0) {
    if (Math.floor(timeLeft) > 0) {
      timeLeft -= speed / 1000;
    } else if (Math.floor(timeLeft) === 0 && betPrice > 0) {
      if (Math.round((currentPrice - betPrice) * bet * multiplier) > 0) {
        money += gain;
        if (money > 0) debtTimer = undefined;
      } else {
        money += Math.floor(((currentPrice - betPrice) * bet * multiplier * 2) / diff) * diff;
      }
      betPrice = 0;
      timeLeft = undefined;
    }
  }

  requestAnimationFrame(draw);
}

function drawRectButton(btn, text, textColor = 'white', bgColor = null) {
  ctx.fillStyle = bgColor || btn.color;
  ctx.fillRect(btn.x, btn.y, btn.width, btn.height);
  write(btn.x + btn.width / 2, btn.y + btn.height / 2 + 4, text, 12, textColor, 'center');
}

function gameClicks() {
  c.addEventListener('click', function(evt) {
    let mousePos = getMousePos(c, evt);
    let currentPrice = prices[cpr] || price;

    // Speed button clicks
    [speedBtn05, speedBtn1, speedBtn2, speedBtn5].forEach(btn => {
      if (isInside(mousePos, btn)) {
        speedMultiplier = btn.speedVal;
      }
    });

    if (betPrice === 0) {
      if (isInside(mousePos, down)) {
        if (bet === -1 || bet === 0) { multiplier += 1; bet = -1; }
        else multiplier -= 1;
      }
      if (isInside(mousePos, up)) {
        if (bet === 1 || bet === 0) { multiplier += 1; bet = 1; }
        else multiplier -= 1;
      }
    }
    if (isInside(mousePos, Bet)) {
      if (betPrice === 0 && multiplier > 0) {
        betPrice = currentPrice;
        timeLeft = Math.random() * (timeLeftH - timeLeftL) + timeLeftL;
        money -= betCost;
        betCost *= 1.2;
      }
    }
    if (isInside(mousePos, withdrawl)) {
      if (bet !== 0 && betPrice !== 0) {
        let gain = Math.floor(((currentPrice - betPrice) * bet * multiplier) / diff) * diff;
        money += gain;
        betPrice = 0;
        timeLeft = undefined;
        if (money > 0) { debtTimer = undefined; debt = 'no'; }
      }
    }
    if (isInside(mousePos, buy)) {
      if (currentPrice > 0) {
        if (keys['Shift']) {
          let count = Math.floor(money / currentPrice);
          stocks += count;
          money -= count * currentPrice;
        } else {
          stocks += 1;
          money -= currentPrice;
        }
      }
    }
    if (isInside(mousePos, sell)) {
      if (stocks > 0) {
        if (keys['Shift']) {
          money += currentPrice * stocks;
          stocks = 0;
        } else {
          stocks -= 1;
          money += currentPrice;
        }
      }
    }
  }, false);
}

draw();
gameClicks();
