class Building {
  constructor(name, baseCost, cps) {
    this.name = name;
    this.baseCost = baseCost;
    this.cps = cps;
    this.amount = 0;
  }

  costFor(amount) {
    return Math.ceil(this.baseCost * Math.pow(1.15, amount));
  }

  get cost() {
    return this.costFor(this.amount);
  }

  costForQuantity(quantity) {
    let total = 0;
    for (let i = 0; i < quantity; i++) {
      total += this.costFor(this.amount + i);
    }
    return total;
  }

  buy(game, quantity = 1) {
    const totalCost = this.costForQuantity(quantity);
    if (game.cookies >= totalCost) {
      game.cookies -= totalCost;
      this.amount += quantity;
      game.updateDisplay();
    }
  }
}

class Game {
  constructor() {
    this.cookies = 0;
    this.cookiesPerClick = 1;
    this.buyQuantity = 1;
    this.buildings = [
      new Building("Cursor", 15, 1),
      new Building("Oma", 100, 5)
    ];

    this.startAutoIncome();
  }

  formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k";
    return Math.floor(num).toString();
  }

  click() {
    this.cookies += this.cookiesPerClick;
    this.updateDisplay();
    this.showClickPopup();
  }

  showClickPopup() {
    const cookieButton = document.getElementById("cookie");
    const popup = document.createElement("span");
    popup.className = "click-popup";
    popup.textContent = `+${this.cookiesPerClick}`;

    const offsetX = (Math.random() - 0.5) * 60;
    popup.style.left = `calc(50% + ${offsetX}px)`;

    cookieButton.parentElement.appendChild(popup);

    popup.addEventListener("animationend", () => popup.remove());
  }

  getTotalCps() {
    return this.buildings.reduce((sum, b) => sum + b.cps * b.amount, 0);
  }

  startAutoIncome() {
    setInterval(() => {
      const cps = this.getTotalCps();
      if (cps > 0) {
        this.cookies += cps;
        this.updateDisplay();
        this.showAutoIncomeEffect(cps);
      }
    }, 1000);
  }

  showAutoIncomeEffect(cps) {
    const cpsElement = document.getElementById("cps-display");
    cpsElement.classList.remove("cps-pulse");
    void cpsElement.offsetWidth;
    cpsElement.classList.add("cps-pulse");

    const cookieWrapper = document.querySelector(".cookie-wrapper");
    const popup = document.createElement("span");
    popup.className = "auto-popup";
    popup.textContent = `+${cps.toFixed(1)}`;
    popup.style.left = `calc(50% + ${(Math.random() - 0.5) * 40}px)`;

    cookieWrapper.appendChild(popup);
    popup.addEventListener("animationend", () => popup.remove());
  }

  setBuyQuantity(quantity) {
    this.buyQuantity = quantity;
    this.updateDisplay();
  }

  updateDisplay() {
    document.getElementById("cookie-count").textContent = this.formatNumber(this.cookies);
    document.getElementById("cps-display").textContent = this.getTotalCps().toFixed(1);
    this.renderQuantitySelector();
    this.renderShop();
  }

  renderQuantitySelector() {
    const container = document.getElementById("quantity-selector");
    container.innerHTML = "";

    [1, 10, 20].forEach((qty) => {
      const button = document.createElement("button");
      button.className = "qty-button";
      button.textContent = `x${qty}`;
      if (this.buyQuantity === qty) {
        button.classList.add("qty-active");
      }
      button.addEventListener("click", () => this.setBuyQuantity(qty));
      container.appendChild(button);
    });
  }

  renderShop() {
    const shop = document.getElementById("shop");
    shop.innerHTML = "";

    this.buildings.forEach((building) => {
      const quantity = this.buyQuantity;
      const totalCost = building.costForQuantity(quantity);
      const canAfford = this.cookies >= totalCost;

      const item = document.createElement("div");
      item.className = "shop-item";

      const info = document.createElement("div");
      info.className = "shop-item-info";
      info.innerHTML = `
        <strong>${building.name}</strong>
        <span>Aantal: ${building.amount}</span>
        <span>+${building.cps} cookies/sec per stuk</span>
      `;

      const button = document.createElement("button");
      button.className = "buy-button";
      button.textContent = `Koop x${quantity} voor ${totalCost} cookies`;
      button.disabled = !canAfford;
      button.addEventListener("click", () => {
        building.buy(this, quantity);
      });

      item.appendChild(info);
      item.appendChild(button);
      shop.appendChild(item);
    });
  }
}

const game = new Game();

document.getElementById("cookie").addEventListener("click", () => {
  game.click();
});

game.updateDisplay();