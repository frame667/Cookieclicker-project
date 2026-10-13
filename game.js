let cookies = 0;
let clickPower = 1;
let globalMultiplier = 1;
let buyAmount = 1;

const countElement = document.getElementById("count");
const cookieElement = document.getElementById("cookie");
const perSecondElement = document.getElementById("persecond");
const overviewElement = document.getElementById("overview");


// ---------- GETALLEN WEERGEVEN ----------

const suffixes = ["", "K", "M", "B", "T"];

function formatNumber(number) {
    let index = 0;

    while (number >= 1000 && index < suffixes.length - 1) {
        number /= 1000;
        index++;
    }

    if (index === 0) {
        return Number.isInteger(number) ? number.toString() : number.toFixed(1);
    }

    return number.toFixed(2) + suffixes[index];
}


function updateCount() {
    countElement.textContent = "cookies: " + formatNumber(cookies);
}


function showFloatingNumber(event) {
    const popup = document.createElement("span");
    popup.className = "floating-number";
    popup.textContent = "+" + formatNumber(clickPower);
    popup.style.left = event.clientX + "px";
    popup.style.top = event.clientY + "px";

    document.body.appendChild(popup);

    popup.addEventListener("animationend", () => {
        popup.remove();
    });
}


function increasecount(event) {
    cookies += clickPower;
    updateCount();
    updateShopButtons();
    showFloatingNumber(event);
    saveGame();
}

cookieElement.addEventListener("click", increasecount);

class ShopItem {

    constructor(name, cost, cookiespersecond, button) {
        this.name = name;
        this.cost = cost;
        this.cookiespersecond = cookiespersecond;
        this.amount = 0;
        this.multiplier = 1;
        this.button = button;

        this.amountElement = this.button.querySelector(".amount");
        this.costElement = this.button.querySelector(".cost");

        this.refresh();

        this.button.addEventListener("click", () => {
            this.buy();
        });

        this.button.addEventListener("animationend", () => {
            this.button.classList.remove("purchased");
        });
    }

    // totaalprijs van "hoeveelheid" eenheden achter elkaar,
    // met de prijsstijging van 25% na elke aankoop
    getTotalCost(hoeveelheid) {
        let total = 0;
        let price = this.cost;

        for (let i = 0; i < hoeveelheid; i++) {
            total += price;
            price = Math.ceil(price * 1.25);
        }

        return total;
    }

    buy() {
        const totalCost = this.getTotalCost(buyAmount);

        if (cookies >= totalCost) {
            cookies -= totalCost;
            this.amount += buyAmount;

            for (let i = 0; i < buyAmount; i++) {
                this.cost = Math.ceil(this.cost * 1.25);
            }

            updateCount();
            this.refresh();
            updatePerSecond();
            updateOverview();
            this.playPurchaseEffect();
            saveGame();
        }
    }

    playPurchaseEffect() {
        this.button.classList.remove("purchased");
        void this.button.offsetWidth;
        this.button.classList.add("purchased");
    }

    refresh() {
        this.amountElement.textContent = "aantal: " + this.amount;
        this.costElement.textContent = "🍪" + formatNumber(this.getTotalCost(buyAmount));
        this.updateButton();
    }

    updateButton() {
        this.button.disabled = cookies < this.getTotalCost(buyAmount);
    }
}


const buildings = [
    new ShopItem("cursor", 10, 0.1, document.getElementById("cursor")),
    new ShopItem("oma", 50, 1, document.getElementById("oma")),
    new ShopItem("fabriek", 100, 3, document.getElementById("fabriek")),
    new ShopItem("molen", 500, 8, document.getElementById("molen")),
    new ShopItem("boerderij", 1100, 15, document.getElementById("boerderij")),
    new ShopItem("mijn", 5000, 60, document.getElementById("mijn")),
    new ShopItem("bank", 20000, 200, document.getElementById("bank")),
    new ShopItem("tempel", 100000, 800, document.getElementById("tempel"))
];


function getBuilding(name) {
    return buildings.find(building => building.name === name);
}

const modeButtons = document.querySelectorAll(".buy-mode button");

for (const modeButton of modeButtons) {
    modeButton.addEventListener("click", () => {
        buyAmount = Number(modeButton.dataset.amount);

        for (const other of modeButtons) {
            other.classList.toggle("active", other === modeButton);
        }

        for (const building of buildings) {
            building.refresh();
        }
    });
}


// ---------- UPGRADES ----------

class Upgrade {

    constructor(name, cost, button) {
        this.name = name;
        this.cost = cost;
        this.button = button;
        this.costElement = this.button.querySelector(".cost");
        this.bought = false;

        this.refresh();

        this.button.addEventListener("click", () => {
            this.buy();
        });
    }

    buy() {
        if (this.bought || cookies < this.cost) {
            return;
        }

        cookies -= this.cost;
        this.activate();

        updateCount();
        updatePerSecond();
        updateOverview();
        updateShopButtons();
        saveGame();
    }

    activate() {
        this.bought = true;
        this.apply();
        this.refresh();
    }

    apply() {
        // elke soort upgrade vult dit zelf in
    }

    refresh() {
        this.costElement.textContent = "🍪" + formatNumber(this.cost);
        this.button.disabled = this.bought || cookies < this.cost;

        if (this.bought) {
            this.button.classList.add("bought");
        }
    }
}


class ClickUpgrade extends Upgrade {

    constructor(name, cost, button, multiplier) {
        super(name, cost, button);
        this.multiplier = multiplier;
    }

    apply() {
        clickPower *= this.multiplier;
    }
}


class BuildingUpgrade extends Upgrade {

    constructor(name, cost, button, building, multiplier) {
        super(name, cost, button);
        this.building = building;
        this.multiplier = multiplier;
    }

    apply() {
        this.building.multiplier *= this.multiplier;
    }
}


class GlobalUpgrade extends Upgrade {

    constructor(name, cost, button, multiplier) {
        super(name, cost, button);
        this.multiplier = multiplier;
    }

    apply() {
        globalMultiplier *= this.multiplier;
    }
}


const upgrades = [
    new ClickUpgrade("sterkere vinger", 100, document.getElementById("upgrade-klik"), 2),
    new BuildingUpgrade("dubbele cursors", 250, document.getElementById("upgrade-cursor"), getBuilding("cursor"), 2),
    new BuildingUpgrade("gelukkige oma's", 1000, document.getElementById("upgrade-oma"), getBuilding("oma"), 2),
    new BuildingUpgrade("turbo fabrieken", 2500, document.getElementById("upgrade-fabriek"), getBuilding("fabriek"), 2),
    new GlobalUpgrade("cookie-boost", 25000, document.getElementById("upgrade-boost"), 1.5)
];


// ---------- BEREKENINGEN ----------

function getPerSecond() {
    const total = buildings.reduce((sum, building) => {
        return sum + building.amount * building.cookiespersecond * building.multiplier;
    }, 0);

    return total * globalMultiplier;
}


function updatePerSecond() {
    perSecondElement.textContent =
        "per seconde: " + formatNumber(getPerSecond()) + " cookies";
}


function addOverviewLine(text) {
    const line = document.createElement("p");
    line.textContent = text;
    overviewElement.appendChild(line);
}


function updateOverview() {
    overviewElement.innerHTML = "";

    for (const building of buildings) {
        if (building.amount > 0) {
            const perSecond = building.amount
                * building.cookiespersecond
                * building.multiplier
                * globalMultiplier;

            addOverviewLine(
                building.name + " x" + building.amount +
                " (" + formatNumber(perSecond) + "/sec)"
            );
        }
    }

    for (const upgrade of upgrades) {
        if (upgrade.bought) {
            addOverviewLine("⭐ " + upgrade.name);
        }
    }

    if (overviewElement.children.length === 0) {
        addOverviewLine("nog niets gekocht");
    }
}


function updateShopButtons() {
    for (const building of buildings) {
        building.updateButton();
    }

    for (const upgrade of upgrades) {
        upgrade.refresh();
    }
}


function generatecookies() {
    cookies += getPerSecond();
    cookies = Math.round(cookies * 10) / 10;

    updateCount();
    updateShopButtons();
    saveGame();
}


// ---------- OPSLAAN ----------

function saveGame() {
    const gameData = {
        cookies: cookies,
        buildings: buildings.map(building => ({
            name: building.name,
            amount: building.amount,
            cost: building.cost
        })),
        upgrades: upgrades
            .filter(upgrade => upgrade.bought)
            .map(upgrade => upgrade.name)
    };

    localStorage.setItem("cookieClickerSave", JSON.stringify(gameData));
}


function loadGame() {
    const savedGame = localStorage.getItem("cookieClickerSave");

    if (savedGame === null) {
        return;
    }

    const gameData = JSON.parse(savedGame);

    cookies = Number(gameData.cookies) || 0;
    updateCount();

    for (const saved of gameData.buildings || []) {
        const building = getBuilding(saved.name);

        if (building) {
            building.amount = Number(saved.amount) || 0;
            building.cost = Number(saved.cost) || building.cost;
            building.refresh();
        }
    }

    for (const name of gameData.upgrades || []) {
        const upgrade = upgrades.find(u => u.name === name);

        if (upgrade) {
            upgrade.activate();
        }
    }
}


loadGame();
updateCount();
updateShopButtons();
updatePerSecond();
updateOverview();

setInterval(generatecookies, 1000);