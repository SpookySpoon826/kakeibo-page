const STORAGE_KEY = "kakeiboEntries";

const form = document.querySelector("form");
const entriesBody = document.querySelector("table tbody");
const totalAmount = document.querySelector("#total-amount");
const statusMessage = document.querySelector("#app-status");
const submitButton = form.querySelector('button[type="submit"]');
const yenFormatter = new Intl.NumberFormat("ja-JP");

function isEntry(value) {
  return (
    value !== null &&
    typeof value === "object" &&
    typeof value.date === "string" &&
    typeof value.item === "string" &&
    (value.type === "expense" || value.type === "income") &&
    Number.isSafeInteger(value.amount) &&
    value.amount > 0
  );
}

function loadEntries() {
  const savedEntries = localStorage.getItem(STORAGE_KEY);
  if (savedEntries === null) {
    return [];
  }

  const parsedEntries = JSON.parse(savedEntries);
  if (!Array.isArray(parsedEntries) || !parsedEntries.every(isEntry)) {
    throw new Error("保存データの形式が正しくありません。");
  }

  return parsedEntries;
}

function setStatus(message, state) {
  statusMessage.textContent = message;
  statusMessage.dataset.state = state;
}

function renderEntries(entries) {
  entriesBody.replaceChildren();

  let total = 0;
  for (const entry of entries) {
    const row = document.createElement("tr");
    const values = [
      entry.date,
      entry.item,
      entry.type === "expense" ? "支出" : "収入",
      `${yenFormatter.format(entry.amount)}円`,
    ];

    for (const value of values) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    entriesBody.append(row);

    total += entry.type === "income" ? entry.amount : -entry.amount;
  }

  totalAmount.textContent = `${yenFormatter.format(total)}円`;
}

let entries;
try {
  entries = loadEntries();
  renderEntries(entries);
} catch (error) {
  console.error("家計簿データを読み込めませんでした。", error);
  setStatus("保存データを読み込めませんでした。詳細は開発者ツールを確認してください。", "error");
  submitButton.disabled = true;
}

if (entries) {
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const amount = Number(formData.get("amount"));
    const newEntry = {
      date: formData.get("date"),
      item: formData.get("item").trim(),
      type: formData.get("type"),
      amount,
    };

    if (
      !newEntry.date ||
      !newEntry.item ||
      (newEntry.type !== "expense" && newEntry.type !== "income") ||
      !Number.isSafeInteger(newEntry.amount) ||
      newEntry.amount <= 0
    ) {
      setStatus("入力内容を確認してください。", "error");
      return;
    }

    const updatedEntries = [...entries, newEntry];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
    } catch (error) {
      console.error("家計簿データを保存できませんでした。", error);
      setStatus("データを保存できませんでした。ブラウザーの保存領域を確認してください。", "error");
      return;
    }

    entries = updatedEntries;
    renderEntries(entries);
    form.reset();
    setStatus("データを追加しました。", "success");
  });
}
