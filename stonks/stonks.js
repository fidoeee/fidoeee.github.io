let c = document.getElementById("canvas");
let ctx = c.getContext('2d');

let prices = [];
let price = Math.random() * 200 + 100;
let speed = 100;
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

// Button definitions adjusted slightly for better text fitting
const down = { x: 870, y: 350, width: 40, height: 50, color: 'red' };
const up = { x: 920, y: 350, width: 40, height: 50, color: 'green' };
const Bet = { x: 970, y: 350, width: 45, height: 50, color: 'grey' };
const withdrawl = { x: 1025, y: 350, width: 60, height: 50, color: 'white' };
const buy = { x: 870, y: 200, width: 100, height: 50, color: 'yellow' };
const sell = { x: 985, y: 200, width: 100, height: 50, color: 'orange' };

const keys = {};
window.addEventListener('keydown', (e) => { keys[e.key] = true; });
window.addEventListener('keyup', (e) => { keys[e.key] = false; });

const key = {};
window.addEventListener('keydown', (e) => {
  key[e.key] = true;
  setTimeout(function() { key[e.key] = false; }, 50);
});

function write(x, y, text, size, color, align) {
  ctx.fillStyle = color;
  ctx.font = size + 'px sans-serif';
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-1, 1);
  ctx.rotate(Math.PI);
  ctx.textAlign = align;
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

function getMousePos(canvas, event) {
  let rect = c.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: (event.clientY - rect.bottom) * -1,
  };
}

function isInside(pos, rect) {
  return pos.x > rect.x && pos.x < rect.x + rect.width && pos.y < rect.y + rect.height && pos.y > rect.y;
}

function draw() {
  ctx.clearRect(0, 0, c.width, c.height);

  let intTime = Math.floor(time);
  while (prices.length <= intTime + 100) {
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

  if (mode == 0) {
    time += speed / 1000;
    intTime = Math.floor(time);
    cpr = Math.max(0, Math.floor(time - 49));
    scrollX += (time - 50 - scrollX) / 5;

    if (time > 49) {
      scrollY += (prices[cpr] - scrollY) / 50;
      if (scrollY < 0) scrollY = 0;
    } else {
      scrollY += (prices[intTime] - scrollY) / 50;
      if (scrollY < 0) scrollY = 1;
    }
  } else if (mode == 1) {
    if (keys['w']) scrollY += 3 * zoom;
    if (keys['s']) scrollY -= 3 * zoom;
    if (keys['a']) scrollX -= 3 * zoom;
    if (scrollX < time && keys['d']) scrollX += 3 * zoom;
    if (scrollY < 0) scrollY = 1;
  }

  if (keys['z']) zoom *= 1.01;
  if (keys['c']) zoom /= 1.01;
  if (keys['v']) zoom = 1;
  if (keys['q']) speed /= 1.01;
  if (keys['e']) speed *= 1.01;
  if (key['r']) speed = (speed !== 0) ? 0 : 100;

  if (key['x']) {
    if (mode == 0) {
      mode = 1;
    } else {
      scrollX += (time - 50 - scrollX) / 1.5;
      mode = 0;
    }
  }

  if (keys['f']) {
    prices.splice(intTime, prices.length - intTime);
  }

  // Draw chart line
  ctx.beginPath();
  ctx.moveTo(600, prices[intTime] || 0);

  let limit = (mode == 0) ? intTime : Math.max(0, intTime - 49);
  for (let i = 0; i < limit; i++) {
    ctx.lineTo(428 - (scrollX - i) / zoom, 300 + (prices[i] - scrollY) / zoom);
  }

  ctx.lineWidth = 1;
  ctx.strokeStyle = 'green';
  ctx.stroke();

  // Overlay regions
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, 49.4, 600);
  if (mode == 0) ctx.fillRect(430, 0, 500, 600);
  ctx.fillRect(850, 0, 300, 600);

  // Grid lines & labels
  ctx.strokeStyle = 'white';
  ctx.lineWidth = 0.5;
  ctx.fillStyle = 'white';
  ctx.beginPath();
  ctx.moveTo(50, 500);
  ctx.lineTo(50, 100);
  ctx.moveTo(800, 500);
  ctx.lineTo(800, 100);

  let step = 1;
  if (zoom < 0.05 && zoom > 0.014) step = Math.floor(zoom * 100) / 100;
  else if (zoom < 0.2) step = Math.floor(zoom * 25) / 25;
  else if (zoom < 0.5) step = Math.floor(zoom * 6) / 6;

  let base = Math.floor(scrollY / 100);
  let range = (zoom >= 2) ? 10 * Math.floor(zoom) : 10;
  let stride = (zoom >= 2) ? Math.ceil(zoom / 2) : (step || 1);

  for (let i = base + range; i > base - range; i -= stride) {
    let yPos = 300 + (Math.round(i * 100) - scrollY) / zoom;
    ctx.moveTo(50, yPos);
    ctx.lineTo(800, yPos);
    write(30, yPos - 5, Math.round(i * 100), 15, 'white', 'center');
  }
  ctx.stroke();

  // Control panel sidebar
  ctx.beginPath();
  ctx.fillStyle = '#151515';
  ctx.fillRect(850, 0, 450, 600);

  trend = Math.random() * (tH - tL) + tL;
  instability = Math.random() * (inH - inL) + inL;

  if (multiplier == 0) bet = 0;

  let currentPrice = prices[cpr] || 0;

  if (time > 49) {
    write(870, 550, "Stock Price: " + (Math.floor(currentPrice * 100) / 100), 20, 'white', 'left');
  } else {
    write(870, 550, "Stock Price: ", 20, 'white', 'left');
  }

  if (money < 0) {
    write(100, 560, "You are now in debt of up to $1000", 40, 'white', 'left');
    debt = 'yes';
  }

  if (money < -1000 || (debtTimer !== undefined && Math.floor(debtTimer) <= 0)) {
    alert('You went into too much debt due to gambling');
    alert('Game over');
  }

  if (money >= 0) debtTimer = undefined;

  write(870, 520, "Money: $" + (Math.round(money * 100) / 100), 20, 'white', 'left');

  if (time > 49) {
    write(870, 490, "Stocks owned: " + stocks + " ($" + (Math.floor(stocks * currentPrice * 100) / 100) + ")", 20, 'white', 'left');
  } else {
    write(870, 490, "Stocks owned: " + stocks + " ($0)", 20, 'white', 'left');
  }

  write(870, 460, "Time: " + Math.floor(time), 20, 'white', 'left');
  write(870, 430, "Bet fee: " + Math.floor(betCost), 20, 'white', 'left');

  if (timeLeft !== undefined) {
    let color = 'white';
    if (timeLeft < 25) color = 'red';
    else if (timeLeft < 50) color = 'orange';
    else if (timeLeft < 100) color = 'yellow';
    else if (timeLeft < 200) color = 'green';
    write(870, 140, "Time left on bet: " + Math.floor(timeLeft), 20, color, 'left');
  }

  if (debtTimer !== undefined) {
    let color = 'white';
    if (debtTimer < 100) color = 'red';
    else if (debtTimer < 200) color = 'orange';
    else if (debtTimer < 400) color = 'yellow';
    else if (debtTimer < 600) color = 'green';
    write(870, 110, "Time left to pay back debt: " + Math.floor(debtTimer), 20, color, 'left');
  }

  let betted = (bet == 0) ? 'none' : (bet == 1 ? 'up' : 'down');
  write(870, 300, "Bet: " + betted + ", Multiplier: " + multiplier, 20, 'white', 'left');

  if (betPrice == 0) {
    write(870, 270, "Bet start: " + (Math.round(betPrice * 100) / 100) + ", Money gain: 0", 20, 'white', 'left');
  } else {
    let gain = Math.floor(((currentPrice - betPrice) * bet * multiplier) / diff) * diff;
    write(870, 270, "Bet start: " + (Math.round(betPrice * 100) / 100) + ", Money gain: " + gain, 20, 'white', 'left');
  }

  // Draw buttons
  ctx.fillStyle = down.color;
  ctx.fillRect(down.x, down.y, down.width, down.height);

  ctx.fillStyle = up.color;
  ctx.fillRect(up.x, up.y, up.width, up.height);

  ctx.fillStyle = Bet.color;
  ctx.fillRect(Bet.x, Bet.y, Bet.width, Bet.height);

  ctx.fillStyle = withdrawl.color;
  ctx.fillRect(withdrawl.x, withdrawl.y, withdrawl.width, withdrawl.height);

  ctx.fillStyle = buy.color;
  ctx.fillRect(buy.x, buy.y, buy.width, buy.height);

  ctx.fillStyle = sell.color;
  ctx.fillRect(sell.x, sell.y, sell.width, sell.height);

  // Render text labels on buttons
  write(down.x + down.width / 2, down.y + 18, "DOWN", 10, 'white', 'center');
  write(up.x + up.width / 2, up.y + 18, "UP", 10, 'white', 'center');
  write(Bet.x + Bet.width / 2, Bet.y + 18, "BET", 11, 'white', 'center');
  write(withdrawl.x + withdrawl.width / 2, withdrawl.y + 18, "CASH OUT", 9, 'black', 'center');

  write(buy.x + buy.width / 2, buy.y + 18, "BUY STOCK", 13, 'black', 'center');
  write(sell.x + sell.width / 2, sell.y + 18, "SELL STOCK", 13, 'black', 'center');

  if (mode == 0) {
    if (Math.floor(timeLeft) > 0) {
      timeLeft -= speed / 1000;
    } else if (Math.floor(timeLeft) == 0 && betPrice > 0) {
      if (Math.round((currentPrice - betPrice) * bet * multiplier) > 0) {
        money += Math.floor(((currentPrice - betPrice) * bet * multiplier) / diff) * diff;
        if (money > 0) debtTimer = undefined;
      } else {
        money += Math.floor(((currentPrice - betPrice) * bet * multiplier * 2) / diff) * diff;
      }
      betPrice = 0;
      timeLeft = undefined;
      if (money < 0 && money > -1000) {
        debt = 'yes';
        debtTimer = Math.random() * (700 - 400) + 400;
      }
    } else if (Math.floor(timeLeft) == 0) {
      timeLeft = undefined;
    }

    if (Math.floor(debtTimer) > 0) {
      debtTimer -= speed / 1000;
    }
  }

  requestAnimationFrame(draw);
}

function gameClicks() {
  c.addEventListener('click', function(evt) {
    let mousePos = getMousePos(c, evt);
    let currentPrice = prices[cpr] || 0;

    if (betPrice == 0) {
      if (isInside(mousePos, down)) {
        if (bet == -1 || bet == 0) { multiplier += 1; bet = -1; }
        else multiplier -= 1;
      }
      if (isInside(mousePos, up)) {
        if (bet == 1 || bet == 0) { multiplier += 1; bet = 1; }
        else multiplier -= 1;
      }
    }
    if (isInside(mousePos, Bet)) {
      if (betPrice == 0 && time > 49 && multiplier > 0) {
        betPrice = currentPrice;
        timeLeft = Math.random() * (timeLeftH - timeLeftL) + timeLeftL;
        money -= betCost;
        betCost *= 1.2;
      }
    }
    if (isInside(mousePos, withdrawl)) {
      if (bet != 0 && betPrice != 0) {
        money += Math.floor(((currentPrice - betPrice) * bet * multiplier) / diff) * diff;
        betPrice = 0;
        timeLeft = undefined;
        if (money < 0 && money > -1000) debtTimer = Math.random() * (700 - 400) + 400;
        if (money > 0) { debtTimer = undefined; debt = 'no'; }
      }
    }
    if (isInside(mousePos, buy)) {
      if (time > 49 && currentPrice > 0) {
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
      if (time > 49 && stocks > 0) {
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

ctx.translate(0, c.height);
ctx.scale(1, -1);
draw();
gameClicks();
