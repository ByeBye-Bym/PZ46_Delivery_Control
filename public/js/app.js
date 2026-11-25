const list = document.querySelector("#parcel-list");
const status = document.querySelector("#status");
const summary = document.querySelector("#summary");
const scenario = document.querySelector("#scenario");
const loadButton = document.querySelector("#load-button");
const cancelButton = document.querySelector("#cancel-button");
let activeController = null;
let serial = 0;
function setStatus(message, kind = "info") {
  status.textContent = message;
  status.dataset.kind = kind;
}
function renderParcels(items) {
  // TODO 1: выведите карточки доставок через createElement/textContent.
  // Пустой массив должен отображаться сообщением, а не ошибкой.
  list.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Доставок нет";
    list.append(empty);
    summary.textContent = "Всего доставок: 0";
    return;
  }

  items.forEach((parcel) => {
    const card = document.createElement("article");
    card.className = "item";

    const title = document.createElement("h3");
    title.textContent = parcel.id;

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = parcel.recipient + " · " + parcel.destination;

    const state = document.createElement("span");
    state.className = "chip";
    state.textContent = parcel.state;

    card.append(title, meta, state);
    list.append(card);
  });

  summary.textContent = "Всего доставок: " + items.length;
}
async function loadParcels() {
  // TODO 2: для каждого запроса создайте новый AbortController, signal и таймер 2500 мс.
  // При новом запросе отменяйте предыдущий; serial поможет игнорировать устаревший ответ.
  if (activeController) {
    activeController.abort();
  }

  const controller = new AbortController();
  activeController = controller;
  serial += 1;
  const attempt = serial;
  let timedOut = false;

  const timerId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 2500);

  loadButton.disabled = true;
  cancelButton.disabled = false;
  setStatus("Запрос отправлен...", "loading");

  // TODO 3: различайте HTTP 503 (response.ok === false), ошибку JSON.parse/response.json(),
  // AbortError (вручную или по тайм-ауту), сетевые ошибки.
  // TODO 4: используйте try/catch/finally, очищайте таймер и возвращайте состояние кнопок.
  try {
    const response = await fetch("/api/parcels?mode=" + scenario.value, {
      signal: controller.signal,
    });

    if (attempt !== serial) return;

    if (!response.ok) {
      setStatus("Сервер вернул ошибку HTTP " + response.status, "error");
      return;
    }

    let data;

    try {
      data = await response.json();
    } catch (error) {
      setStatus("Ответ сервера не является корректным JSON", "error");
      return;
    }

    if (attempt !== serial) return;

    if (!Array.isArray(data.items)) {
      setStatus("В ответе нет массива доставок", "error");
      return;
    }

    renderParcels(data.items);
    setStatus("Данные получены.", "success");
  } catch (error) {
    if (attempt !== serial) return;

    if (error.name === "AbortError") {
      if (timedOut) {
        setStatus("Превышено время ожидания ответа", "error");
      } else {
        setStatus("Запрос отменён пользователем", "error");
      }
    } else {
      setStatus("Сетевая ошибка: " + error.message, "error");
    }
  } finally {
    clearTimeout(timerId);

    if (attempt === serial) {
      activeController = null;
      loadButton.disabled = false;
      cancelButton.disabled = true;
    }
  }
}
loadButton.addEventListener("click", loadParcels);
cancelButton.addEventListener("click", () => {
  // TODO 5: отмените текущий запрос через activeController.abort().
  if (activeController) {
    activeController.abort();
  }
});
