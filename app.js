/* =========================================================
   TELEGRAM INIT
   ========================================================= */
const tg = window.Telegram.WebApp;
tg.expand();

const userId = tg.initDataUnsafe?.user?.id || "guest";
const STORAGE_KEY = `entries_${userId}`;

/* =========================================================
   ELEMENTS
   ========================================================= */
const amountLabel = document.getElementById("amountLabel");

const drinkButtons = document.querySelectorAll(".drink-btn");
const drinkDescription = document.getElementById("drinkDescription");

const calendarGrid = document.getElementById("calendarGrid");
const monthTitle = document.getElementById("monthTitle");

const moodChartCtx = document.getElementById("moodChart");

const insightCard = document.getElementById("insightCard");
const nextInsightBtn = document.querySelector("#insights .btn-main");

const unitsVisual = document.getElementById("unitsVisual");
const unitsCountEl = document.getElementById("unitsCount");

/* =========================================================
   DATA
   ========================================================= */
let data = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

/* =========================================================
   DRINK CONFIG
   ========================================================= */
let selectedDrink = "Jäger-style";

const drinkInfo = {
  "Jäger-style": {
    label: "🥃 Стопки",
    icon: "🥃",
    text: "🦌 Травяной ликёр на основе сложной смеси из десятков растений, корней и специй. Обладает плотным, горьковато-сладким вкусом и насыщенным ароматом трав. Чаще всего употребляется сильно охлаждённым, небольшими стопками. Из-за высокой крепости и интенсивного вкуса быстро создаёт ощущение тепла и расслабления, но при этом легко переходит грань, если пить слишком быстро."
  },
  "Водка": {
    label: "🥃 Стопки",
    icon: "🥃",
    text: "🍸 Крепкий прозрачный алкоголь с нейтральным вкусом, который почти не маскирует содержание спирта. Часто пьётся залпом, поэтому эффект наступает быстро и может быть резким. Не содержит сахара и ароматизаторов, но из-за высокой крепости сильнее нагружает организм. Обычно употребляется небольшими стопками, особенно чувствительна к темпу и количеству."
  },
  "Лимончелла": {
    label: "🥃 Стопки",
    icon: "🥃",
    text: "🍋 Сладкий лимонный ликёр с ярким цитрусовым ароматом. Традиционно подаётся охлаждённым и часто употребляется после еды. Благодаря сладости и мягкому вкусу пьётся легко, из-за чего можно недооценить крепость. Создаёт ощущение лёгкости и расслабления, но при большом количестве может быстро утомлять."
  },
  "Соджа": {
    label: "🍶 Чашки",
    icon: "🍶",
    text: "🍶 Корейский алкогольный напиток на основе риса или зерна. Имеет мягкий вкус и относительно низкую крепость по сравнению с крепкими напитками, однако пьётся небольшими порциями и часто в компании, что может привести к незаметному увеличению количества. Восприятие опьянения обычно приходит постепенно, с задержкой."
  },
  "Вино": {
    label: "🍷 Бокалы",
    icon: "🍷",
    text: "🍷 Алкогольный напиток из винограда с широким спектром вкусов — от сухих и кислых до сладких и насыщенных. Чаще всего употребляется медленно, из бокалов, что позволяет лучше контролировать темп. В умеренных количествах воспринимается мягче, однако при регулярном употреблении также влияет на сон и самочувствие."
  },
  "Пиво": {
    label: "🍺 Кружки",
    icon: "🍺",
    text: "🍺 Слабоалкогольный напиток на основе солода и хмеля. Из-за низкой крепости создаёт ощущение лёгкости, но обычно употребляется в больших объёмах. Может давать значительную нагрузку за счёт количества выпитого, а также влияет на сон и восстановление, особенно при вечернем употреблении."
  }
};

/* =========================================================
   DRINK SELECTION
   ========================================================= */
drinkButtons.forEach(btn => {
  btn.onclick = () => {
    drinkButtons.forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    selectedDrink = btn.dataset.drink;

    drinkDescription.textContent = drinkInfo[selectedDrink].text;
    amountLabel.textContent = drinkInfo[selectedDrink].label;

    resetUnits();
  };
});

/* =========================================================
   UNITS (STOPKI / BOKALY / KRUZHKI)
   ========================================================= */
let units = 0;
const MAX_UNITS = 16;

function renderUnits() {
  unitsVisual.innerHTML = "";
  const icon = drinkInfo[selectedDrink].icon;

  for (let i = 0; i < MAX_UNITS; i++) {
    const span = document.createElement("span");
    span.className = "unit-glass" + (i < units ? " active" : "");
    span.textContent = icon;
    unitsVisual.appendChild(span);
  }

  unitsCountEl.textContent = units;
}

function changeUnits(delta) {
  units = Math.max(0, Math.min(MAX_UNITS, units + delta));
  renderUnits();
}

function resetUnits() {
  units = 0;
  renderUnits();
}

/* =========================================================
   MOOD
   ========================================================= */
let selectedMood = 3;

document.querySelectorAll(".mood-btn").forEach(btn => {
  btn.onclick = () => {
    document.querySelectorAll(".mood-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    selectedMood = Number(btn.dataset.value);
  };
});

/* =========================================================
   LOCAL DATE
   ========================================================= */
function getLocalDateString() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/* =========================================================
   ADD ENTRY
   ========================================================= */
function addEntry() {
  if (units === 0) return;

  data.push({
    date: selectedCalendarDate || getLocalDateString(),
    drink: selectedDrink,
    units: units,
    mood: selectedMood
  });

  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

  drawCalendar();
  drawMoodChart();
  tg.HapticFeedback.impactOccurred("light");

  resetUnits();
}

/* =========================================================
   TABS
   ========================================================= */
function openTab(id, btn) {
  document.querySelectorAll(".tab-screen").forEach(s => s.classList.add("hidden"));
  document.getElementById(id).classList.remove("hidden");

  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
}

/* =========================================================
   CALENDAR
   ========================================================= */
let currentDate = new Date();
let selectedCalendarDate = null;


function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  drawCalendar();
}

function drawCalendar() {
  calendarGrid.innerHTML = "";

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const today = new Date();

  monthTitle.textContent = currentDate.toLocaleString("ru", {
    month: "long",
    year: "numeric"
  });

  const daysInMonth = new Date(year, month + 1, 0).getDate();

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    const drunk = data.some(e => e.date === dateStr);

    const dayEl = document.createElement("div");
    dayEl.className = `day ${drunk ? "drunk" : "sober"}`;
    dayEl.textContent = d;

    dayEl.onclick = () => {
    document.querySelectorAll(".day")
    .forEach(el => el.classList.remove("selected"));

  dayEl.classList.add("selected");
  selectedCalendarDate = dateStr;
};

calendarGrid.appendChild(dayEl);


    
    

  }
}

/* =========================================================
   MOOD CHART
   ========================================================= */
const moodChart = new Chart(moodChartCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Настроение",
        data: [],
        borderColor: "#6fbf8f",
        tension: 0.4
      },
      {
        label: "Количество",
        data: [],
        borderColor: "#c9a44c",
        tension: 0.4
      }
    ]
  },
  options: {
    scales: {
      y: { min: 0, max: 5 }
    }
  }
});

function drawMoodChart() {
  moodChart.data.labels = data.map(e => e.date.slice(5));
  moodChart.data.datasets[0].data = data.map(e => e.mood);
  moodChart.data.datasets[1].data = data.map(e => e.units);
  moodChart.update();
}

/* =========================================================
   INSIGHTS (NO REPEATS)
   ========================================================= */
const insightsPool = [
  "🍺 Организм перерабатывает около 8–10 г алкоголя в час.",
  "🌙 Алкоголь снижает качество глубокого сна.",
  "🥃 Крепкий алкоголь быстрее влияет на настроение.",
  "💧 Обезвоживание — частая причина плохого самочувствия.",
  "🦌 При низком настроении алкоголь редко помогает расслабиться.",
  "🌲 Несколько трезвых дней подряд улучшают самочувствие.",
  "🍷 Меньше, но реже — переносится легче.",
  "⏰ Алкоголь вечером сильнее влияет на сон."
];

let remainingInsights = [];

function shuffleInsights() {
  remainingInsights = [...insightsPool];
  for (let i = remainingInsights.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [remainingInsights[i], remainingInsights[j]] =
      [remainingInsights[j], remainingInsights[i]];
  }
}

function nextInsight() {
  if (!insightCard) return;

  if (remainingInsights.length === 0) {
    insightCard.innerHTML =
      "🦌 <strong>Лес сказал всё.</strong><br><br>" +
      "Ты прочитал все советы.<br>" +
      "Хочешь начать заново?";

    if (nextInsightBtn) {
      nextInsightBtn.textContent = "Начать заново";
      nextInsightBtn.style.display = "block";
      nextInsightBtn.onclick = () => {
        shuffleInsights();
        nextInsightBtn.textContent = "Дальше →";
        nextInsightBtn.onclick = nextInsight;
        nextInsight();
      };
    }
    return;
  }

  insightCard.textContent = remainingInsights.pop();
}

/* =========================================================
   INIT
   ========================================================= */
shuffleInsights();
nextInsight();
drawCalendar();
drawMoodChart();
renderUnits();
