const tg = window.Telegram.WebApp;
tg.expand();

let data = JSON.parse(localStorage.getItem("entries")) || [];

function addEntry() {
  const entry = {
    drink: drink.value,
    amount: +amount.value,
    mood: +mood.value,
    date: new Date().toLocaleDateString()
  };
  data.push(entry);
  localStorage.setItem("entries", JSON.stringify(data));
  drawChart();
}

function drawChart() {
  const moods = data.map(e => e.mood);
  chart.data.labels = moods.map((_, i) => i + 1);
  chart.data.datasets[0].data = moods;
  chart.update();
}

const ctx = document.getElementById("chart");
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [{
      label: "Настроение",
      data: [],
      borderWidth: 2
    }]
  }
});

drawChart();
