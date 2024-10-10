let c = document.getElementById("canvas");
let ctx = c.getContext('2d')
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
let tL = 1.9

const down = {
  x: 900,
  y: 350,
  width: 20,
  height: 50,
  color: 'red',
};

const up = {
  x: 940,
  y: 350,
  width: 20,
  height: 50,
  color: 'green',
};

const Bet = {
  x: 980,
  y: 350,
  width: 20,
  height: 50,
  color: 'grey',
};

const withdrawl = {
  x: 1020,
  y: 350,
  width: 20,
  height: 50,
  color: 'white',
};

const buy = {
  x: 900,
  y: 200,
  width: 100,
  height: 50,
  color: 'yellow',
};

const sell = {
  x: 1020,
  y: 200,
  width: 100,
  height: 50,
  color: 'orange',
};

const keys = {};

window.addEventListener('keydown', (e) => {
  keys[e.key] = true;
});

window.addEventListener('keyup', (e) => {
  keys[e.key] = false;
});

const key = {};

window.addEventListener('keydown', (e) => {
  key[e.key] = true;
  setTimeout(function() {
    key[e.key] = false;
  }, 50)
});

function write(x, y, text, size, color, align) {
  ctx.fillStyle = color
  ctx.font = size + 'px sans-serif'
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(-1, 1)
  ctx.rotate(Math.PI);
  ctx.textAlign = align;
  ctx.fillText(text, 0, 0);
  ctx.translate(-x, -y);
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
  //simulation
  ctx.clearRect(0, 0, c.width, c.height);
  let m = Math.random() * 75;
  for (let i = 0; i < 100; i++) {
    let v = instability;
    if (i < m && price > Math.random() * 10 + 10) {
      price += (Math.random() * v) - v / trend;
    } else {
      price += (Math.random() * v) - v / 2;
    }
    if (price < 0) {
      price = 0
    }
    prices.push(price);
  }
  if (mode == 0) {
    time += speed / 1000;
    cpr = Math.floor(time - 49);
    scrollX += (time - 50 - scrollX) / 5;
    if (time > 49) {
      scrollY += (prices[cpr] - scrollY) / 50;
      if (scrollY < 0) {
        scrollY = 0;
      }
    } else {
      scrollY += (prices[Math.floor(time)] - scrollY) / 50;
      if (scrollY < 0) {
        scrollY = 1;
      }
    }
  } else if (mode == 1) {
    if (keys['w']) {
      scrollY += 3 * zoom;
    }
    if (keys['s']) {
      scrollY -= 3 * zoom;
    }
    if (keys['a']) {
      scrollX -= 3 * zoom;
    }
    if (scrollX < time) {
      if (keys['d']) {
        scrollX += 3 * zoom;
      }
    }
    if (scrollY < 0) {
      scrollY = 1;
    }
  }
  if (keys['z']) {
    zoom *= 1.01;
  }
  if (keys['c']) {
    zoom /= 1.01;
  }
  if (keys['v']) {
    zoom = 1;
  }
  if (keys['q']) {
    speed /= 1.01;
  }
  if (keys['e']) {
    speed *= 1.01;
  }
  if (key['r']) {
    if (speed != 0) {
      speed = 0
    } else if (speed == 0) {
      speed = 100;
    }
  }
  if (key['x']) {
    if (mode == 0) {
      mode = 1;
    } else if (mode == 1) {
      scrollX += (time - 50 - scrollX) / 1.5;
      mode = 0;
    }
  }
  if (keys['f']) {
    prices.splice(time, prices.length - time);
    console.log('ref');
  }
  ctx.moveTo(600, prices[time]);
  if (mode == 0) {
    for (let i = 0; i < time; i++) {
      ctx.lineTo(428 - (scrollX - i) / zoom, 300 + (prices[i] - scrollY) / zoom);
    }
  } else if (mode == 1) {
    for (let i = 0; i < time - 49; i++) {
      ctx.lineTo(428 - (scrollX - i) / zoom, 300 + (prices[i] - scrollY) / zoom);
    }
  }
  ctx.lineWidth = 1;
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'green';
  ctx.stroke();
  ctx.fillRect(0, 0, 49.4, 600);
  if (mode == 0) {
    ctx.fillRect(430, 0, 500, 600);
  }
  ctx.fillRect(800, 0, 300, 600);
  ctx.strokeStyle = 'white'; 
  ctx.lineWidth = 0.5;
  ctx.fillStyle = 'white'
  ctx.beginPath();
  ctx.moveTo(50, 500);
  ctx.lineTo(50, 100);
  ctx.moveTo(800, 500);
  ctx.lineTo(800, 100);
  if (zoom < 0.05) {
    if (zoom > 0.014) {
      for (let i = 5 + Math.floor(scrollY / (100)); i > -5 + Math.floor(scrollY / (100)); i -= Math.floor(zoom * 100) / 100) {
        ctx.moveTo(50, 300 + (Math.round(i * 100) - scrollY) / zoom);
        ctx.lineTo(800, 300 + (Math.round(i * 100) - scrollY) / zoom);
        write(30, (295 + (Math.round(i * 100) - scrollY) / zoom), Math.round(i * 100), 15, 'white', 'center')
      }
    }
  } else if (zoom < 0.2) {
    for (let i = 10 + Math.floor(scrollY / (100)); i > -10 + Math.floor(scrollY / (100)); i -= Math.floor(zoom * 25) / 25) {
      ctx.moveTo(50, 300 + (Math.round(i * 100) - scrollY) / zoom);
      ctx.lineTo(800, 300 + (Math.round(i * 100) - scrollY) / zoom);
      write(30, (295 + (Math.round(i * 100) - scrollY) / zoom), Math.round(i * 100), 15, 'white', 'center')
    }
  } else if (zoom < 0.5) {
    for (let i = 10 + Math.floor(scrollY / (100)); i > -10 + Math.floor(scrollY / (100)); i -= Math.floor(zoom * 6) / 6) {
      ctx.moveTo(50, 300 + (Math.round(i * 100) - scrollY) / zoom);
      ctx.lineTo(800, 300 + (Math.round(i * 100) - scrollY) / zoom);
      write(30, (295 + (Math.round(i * 100) - scrollY) / zoom), Math.round(i * 100), 15, 'white', 'center')
    }
  } else if (zoom < 2) {
    for (let i = 10 + Math.floor(scrollY / (100)); i > -10 + Math.floor(scrollY / (100)); i -= 1) {
      ctx.moveTo(50, 300 + (Math.round(i * 100) - scrollY) / zoom);
      ctx.lineTo(800, 300 + (Math.round(i * 100) - scrollY) / zoom);
      write(30, (295 + (Math.round(i * 100) - scrollY) / zoom), Math.round(i * 100), 15, 'white', 'center')
    }
  } else {
    for (let i = 10 * Math.floor(zoom); i > -10 * Math.floor(zoom); i -= Math.ceil(zoom / 2)) {
      ctx.moveTo(50, 300 + (Math.round(i * 100) - scrollY) / zoom);
      ctx.lineTo(800, 300 + (Math.round(i * 100) - scrollY) / zoom);
      write(30, (295 + (Math.round(i * 100) - scrollY) / zoom), Math.round(i * 100), 15, 'white', 'center');
    }
  }
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = '#151515';
  ctx.fillRect(850, 0, 450, 600);
  trend = Math.random() * (tH - tL) + tL;
  instability = Math.random() * (inH - inL) + inL;

  //game
 if (multiplier == 0) {
  bet = 0;
 }

  if (time > 49) {
    write(870, 550, "Stock Price: " + Math.floor(prices[Math.floor(time) - 49] * 100) / 100, 20, 'white', 'left');
  } else {
    write(870, 550, "Stock Price: ", 20, 'white', 'left');
  }
  
  if (money < 0) {
    write(100, 560, "You are now in debt of up to $1000", 40, 'white', 'left');
    debt == 'yes';
  }
  if (money < -1000 || Math.floor(debtTimer) <= 0) {
    alert('you went into too much debt due to gambling');
    alert('game over');
  }
  
  if (money >= 0) {
    debtTimer = undefined;
  }

  write(870, 520, "Money: $" + Math.round(money * 100) / 100, 20, 'white', 'left');

  if (time > 49) {
    write(870, 490, "Stocks owned: " + stocks + " ($" + Math.floor(stocks * prices[cpr] * 100) / 100 + ")", 20, 'white', 'left');
  } else {
    write(870, 490, "Stocks owned: " + stocks + " ($0)", 20, 'white', 'left');
  }

  write(870, 460, "Time: " + Math.floor(time), 20, 'white', 'left');

  write(870, 430, "Bet fee: " + Math.floor(betCost), 20, 'white', 'left');

  if (timeLeft != undefined) {
    if (timeLeft < 25) {
      write(870, 140, "Time left on bet: " + Math.floor(timeLeft), 20, 'red', 'left');
    } else if (timeLeft < 50) {
      write(870, 140, "Time left on bet: " + Math.floor(timeLeft), 20, 'orange', 'left');
    } else if (timeLeft < 100) {
      write(870, 140, "Time left on bet: " + Math.floor(timeLeft), 20, 'yellow', 'left');
    } else if (timeLeft < 200) {
      write(870, 140, "Time left on bet: " + Math.floor(timeLeft), 20, 'green', 'left');
    } else {
      write(870, 140, "Time left on bet: " + Math.floor(timeLeft), 20, 'white', 'left');
    }
  }

  if (debtTimer != undefined) {
    if (debtTimer < 100) {
      write(870, 110, "Time left to pay back debt: " + Math.floor(debtTimer), 20, 'red', 'left');
    } else if (debtTimer < 200) {
      write(870, 110, "Time left to pay back debt: " + Math.floor(debtTimer), 20, 'orange', 'left');
    } else if (debtTimer < 400) {
      write(870, 110, "Time left to pay back debt: " + Math.floor(debtTimer), 20, 'yellow', 'left');
    } else if (debtTimer < 600) {
      write(870, 110, "Time left to pay back debt: " + Math.floor(debtTimer), 20, 'green', 'left');
    } else {
      write(870, 110, "Time left to pay back debt: " + Math.floor(debtTimer), 20, 'white', 'left');
    }
  }
  
  let betted;
  if (bet == 0) {
    betted = 'none';
  } else if (bet == 1) {
    betted = 'up';
  } else {
    betted = 'down';
  }

  write(870, 300, "Bet: " + betted + ", Multiplier: " + multiplier, 20, 'white', 'left');
  if (betPrice == 0) {
    write(870, 270, "Bet start: " + Math.round(betPrice * 100) / 100 + ", Money gain: 0", 20, 'white', 'left');
  } else {
    write(870, 270, "Bet start: " + Math.round(betPrice * 100) / 100 + ", Money gain: " + Math.floor(((prices[cpr] - betPrice) * bet * multiplier) / diff) * diff , 20, 'white', 'left');
  }

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
  
  if (mode == 0) {
    if (Math.floor(timeLeft) > 0) {
      timeLeft -= speed / 1000;
    } else if (Math.floor(timeLeft) == 0 && betPrice > 0) {
      if (Math.round((prices[cpr] - betPrice) * bet * multiplier) > 0) {
        money += Math.floor(((prices[cpr] - betPrice) * bet * multiplier) / diff) * diff;
        if (money > 0) {
          debtTimer = undefined;
        }
      } else {
        money += Math.floor(((prices[cpr] - betPrice) * bet * multiplier * 2) / diff) * diff;
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

  if (money < 0 && money > -1000) {
    debt = 'yes';
    debtTimer = Math.random() * (700 - 400) + 400;
  }

  if (Math.floor(timeLeft) == 0) {
    timeLeft = undefined;
  }

  if (Math.floor(debtTimer) > 0) {
    debtTimer -= speed / 1000;
  }

  requestAnimationFrame(draw);
}

function gameClicks() {
  c.addEventListener('click', function(evt) {
    let mousePos = getMousePos(c, evt);
    if (betPrice == 0) {
      if (isInside(mousePos, down)) {
        if (bet == -1 || bet == 0) {
          multiplier += 1;
          bet = -1;
        } else {
          multiplier -= 1;
        }
      }
      if (isInside(mousePos, up)) {
        if (bet == 1 || bet == 0) {
          multiplier += 1;
          bet = 1;
        } else {
          multiplier -= 1;
        }
      }
    }
    if (isInside(mousePos, Bet)) {
      if (betPrice == 0 && time > 49 && multiplier > 0) {
        betPrice = prices[cpr]
        timeLeft = Math.random() * (timeLeftH - timeLeftL) + timeLeftL;
        money -= betCost;
        betCost *= 1.2;
      }
    }
    if (isInside(mousePos, withdrawl)) {
      if (bet != 0 && betPrice != 0) {
        money += Math.floor(((prices[cpr] - betPrice) * bet * multiplier) / diff) * diff;
        betPrice = 0;
        timeLeft = undefined;
        if (money < 0 && money > -1000) {
          debtTimer = Math.random() * (700 - 400) + 400;
        }
        if (money > 0) {
          debtTimer = undefined;
          debt = 'no';
        }
      }
    }
    if (isInside(mousePos, buy)) {
      if (time > 49) {
        if (keys['Shift']) {
          stocks += Math.floor(money / prices[cpr]);
          money -= Math.floor(money / prices[cpr]) * prices[cpr];
        } else {
          stocks += 1;
          money -= prices[cpr];
        }
      }
    }
    if (isInside(mousePos, sell)) {
      if (time > 49 && stocks > 0) {
        if (keys['Shift']) {
          money += prices[cpr] * stocks;
          stocks -= stocks;
        } else {
          stocks -= 1;
          money += prices[cpr];
        }
      }
    }
  }, false);
}

ctx.translate(0, c.height);
ctx.scale(1, -1);
draw();
gameClicks();

