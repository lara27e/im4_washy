// ==========================================
// 1. INITIALISIERUNG & USER-DATEN
// ==========================================
document.addEventListener('DOMContentLoaded', async () => {
  
  try {
    const response = await fetch("api/protected.php");
    if (response.ok) {
      const userData = await response.json();
      if (document.getElementById('userEmail')) document.getElementById('userEmail').innerText = userData.email;
      if (document.getElementById('userId'))    document.getElementById('userId').innerText = userData.user_id;
      localStorage.setItem('userEmail', userData.email);
      localStorage.setItem('userId', userData.user_id);
    }
  } catch (error) {
    console.error("Fehler beim Laden der Session-Daten:", error);
    const backupEmail = localStorage.getItem('userEmail') || "nicht angemeldet";
    const backupId    = localStorage.getItem('userId') || "---";
    if (document.getElementById('userEmail')) document.getElementById('userEmail').innerText = backupEmail;
    if (document.getElementById('userId'))    document.getElementById('userId').innerText = backupId;
  }

  await loadFamilyMembers();
  initAwardsAndRanking();
  setTimeout(() => { setWashPercentage(85); }, 800);
});

// ==========================================
// 2. DATENBANK-SCHNITTSTELLE (LOAD & SAVE)
// ==========================================

async function loadFamilyMembers() {
  try {
    const response = await fetch("api/family_manager.php");
    if (!response.ok) throw new Error("Server-Antwort nicht okay");
    const members = await response.json();
    const familyList = document.getElementById('familyList');
    if (familyList && Array.isArray(members)) {
      familyList.innerHTML = "";
      members.forEach(m => addNewFamilyCard(m.name, m.role, m.emoji, m.color));
    }
  } catch (error) {
    console.error("Fehler beim Laden der Familienmitglieder:", error);
  }
}

async function saveMember() {
  const nameInput  = document.getElementById('newMemberName');
  const roleInput  = document.getElementById('newMemberAge');
  const colorInput = document.getElementById('newMemberColor');

  const name  = nameInput.value.trim();
  const role  = roleInput.value || "Kind";
  const color = colorInput.value || "pink";

  if (!name || !selectedAnimalEmoji) {
    alert("Bitte Name eingeben und Tier wählen!");
    return;
  }

  const memberData = { name, role, color, emoji: selectedAnimalEmoji };

  try {
    const response = await fetch("api/family_manager.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData)
    });

    if (!response.ok) throw new Error("Ungültige Server-Antwort");
    const result = await response.json();

    if (result.status === "success") {
      // Karte zur Liste hinzufügen
      addNewFamilyCard(name, role, selectedAnimalEmoji, color);
      closeAddMemberModal();

      // Nur bei neuen Kindern (nicht beim Bearbeiten) Bracelet-Popup zeigen
      if (!currentEditCard) {
        openBraceletModal(name);
      }
    } else {
      alert("Datenbank-Fehler: " + result.message);
    }
  } catch (error) {
    console.error("Fetch-Fehler:", error);
    alert("Verbindung zum Server fehlgeschlagen!");
  }
}

// ==========================================
// 3. BRACELET-REGISTRIERUNGS-POPUP
// ==========================================

let braceletPollInterval = null;
let braceletCountdown    = null;
let braceletSecondsLeft  = 30;

function openBraceletModal(kindName) {
  braceletSecondsLeft = 30;
  document.getElementById('braceletKindName').innerText = kindName;
  document.getElementById('braceletStatus').innerText   = "Warte auf Chip...";
  document.getElementById('braceletCountdown').innerText = braceletSecondsLeft + "s";
  document.getElementById('braceletModal').classList.remove('hidden');
  document.getElementById('braceletIcon').innerText = "📡";
  document.getElementById('braceletModal').querySelector('.bracelet-modal-box').className = 'bracelet-modal-box waiting';

  // Countdown
  braceletCountdown = setInterval(() => {
    braceletSecondsLeft--;
    document.getElementById('braceletCountdown').innerText = braceletSecondsLeft + "s";
    if (braceletSecondsLeft <= 0) {
      clearInterval(braceletCountdown);
    }
  }, 1000);

  // Alle 2 Sek prüfen ob Chip registriert wurde
  braceletPollInterval = setInterval(async () => {
    try {
      const response = await fetch("api/family_manager.php");
      if (!response.ok) return;
      const members = await response.json();

      // Prüfen ob das zuletzt hinzugefügte Kind jetzt ein bracelet hat
      // (register_pending = 0 und bracelet nicht null)
      const newestWithBracelet = members.find(m =>
        m.name === document.getElementById('braceletKindName').innerText &&
        m.bracelet !== null &&
        m.bracelet !== ""
      );

      if (newestWithBracelet) {
        // Erfolg!
        clearInterval(braceletPollInterval);
        clearInterval(braceletCountdown);
        showBraceletSuccess();
      }
    } catch (e) {
      console.error("Bracelet-Poll Fehler:", e);
    }
  }, 2000);

  // Nach 30 Sek automatisch abbrechen
  setTimeout(() => {
    if (document.getElementById('braceletModal').classList.contains('hidden')) return;
    clearInterval(braceletPollInterval);
    clearInterval(braceletCountdown);
    showBraceletTimeout();
  }, 30000);
}

function showBraceletSuccess() {
  document.getElementById('braceletIcon').innerText    = "✅";
  document.getElementById('braceletStatus').innerText  = "Chip erfolgreich verbunden!";
  document.getElementById('braceletCountdown').innerText = "";
  document.getElementById('braceletModal').querySelector('.bracelet-modal-box').className = 'bracelet-modal-box success';
  setTimeout(() => closeBraceletModal(), 2500);
}

function showBraceletTimeout() {
  document.getElementById('braceletIcon').innerText    = "⏱️";
  document.getElementById('braceletStatus').innerText  = "Zeit abgelaufen. Kein Chip erkannt.";
  document.getElementById('braceletCountdown').innerText = "";
  document.getElementById('braceletModal').querySelector('.bracelet-modal-box').className = 'bracelet-modal-box timeout';
}

function showBraceletError(message) {
  clearInterval(braceletPollInterval);
  clearInterval(braceletCountdown);
  document.getElementById('braceletIcon').innerText    = "❌";
  document.getElementById('braceletStatus').innerText  = message || "Dieser Chip ist bereits vergeben. Bitte ein anderes Armband verwenden.";
  document.getElementById('braceletCountdown').innerText = "";
  document.getElementById('braceletModal').querySelector('.bracelet-modal-box').className = 'bracelet-modal-box error';
}

function closeBraceletModal() {
  clearInterval(braceletPollInterval);
  clearInterval(braceletCountdown);
  document.getElementById('braceletModal').classList.add('hidden');
}

// ==========================================
// 4. UI-LOGIK (MODALS & CARDS)
// ==========================================
let selectedAnimalEmoji = "";
let selectedColorClass  = "pink";
let currentEditCard     = null;

function selectRole(element, roleValue) {
  document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
  element.classList.add('selected');
  document.getElementById('newMemberAge').value = roleValue;
}

function selectColor(element, colorName) {
  document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  selectedColorClass = colorName;
  document.getElementById('newMemberColor').value = colorName;
}

function openAddMemberModal() {
  currentEditCard = null;
  selectedAnimalEmoji = "";
  document.getElementById('modalTitle').innerText = "Neues Mitglied";
  document.getElementById('deleteBtn').classList.add('hidden');
  document.getElementById('newMemberName').value = "";
  selectRole(document.querySelectorAll('.role-btn')[0], 'Kind');
  selectColor(document.querySelector('.color-option.pink'), 'pink');
  document.querySelectorAll('.animal-option').forEach(opt => opt.classList.remove('selected'));
  document.getElementById('addMemberModal').classList.remove('hidden');
}

function openEditModal(btnElement) {
  currentEditCard = btnElement.closest('.member-card');
  const name  = currentEditCard.querySelector('.member-name').innerText;
  const role  = currentEditCard.querySelector('.member-sub').innerText;
  const emoji = currentEditCard.querySelector('.avatar-emoji').innerText;
  const color = ["pink", "yellow", "blue", "green", "purple"].find(c => currentEditCard.classList.contains(c)) || "pink";

  document.getElementById('modalTitle').innerText     = "Mitglied bearbeiten";
  document.getElementById('newMemberName').value      = name;
  document.getElementById('deleteBtn').classList.remove('hidden');

  document.querySelectorAll('.role-btn').forEach(btn => { if (btn.innerText === role) selectRole(btn, role); });
  selectColor(document.querySelector(`.color-option.${color}`), color);

  selectedAnimalEmoji = emoji;
  document.querySelectorAll('.animal-option').forEach(opt => {
    opt.classList.toggle('selected', opt.querySelector('span').innerText === emoji);
  });

  document.getElementById('addMemberModal').classList.remove('hidden');
}

function closeAddMemberModal() { document.getElementById('addMemberModal').classList.add('hidden'); }

function selectAnimal(element, emoji) {
  document.querySelectorAll('.animal-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  selectedAnimalEmoji = emoji;
}

function addNewFamilyCard(name, role, emoji, color) {
  const familyList = document.getElementById('familyList');
  if (!familyList) return;
  const newCard = document.createElement('div');
  newCard.className = `member-card ${color}`;
  newCard.innerHTML = `
    <div class="member-header">
      <div class="member-avatar"><span class="avatar-emoji">${emoji}</span></div>
      <div class="member-meta">
        <h3 class="member-name">${name}</h3>
        <p class="member-sub">${role}</p>
      </div>
      <div class="edit-btn" onclick="openEditModal(this)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
      </div>
    </div>
    <div class="member-stats">
      <div class="stat-item"><strong>0/0</strong><p>Heute</p></div>
      <div class="stat-item"><strong>0</strong><p>Woche</p></div>
      <div class="stat-item"><strong>0</strong><p>Vergessen</p></div>
    </div>
  `;
  familyList.appendChild(newCard);
}

// ==========================================
// 5. KREISDIAGRAMM & AWARDS / OBSERVATIONS
// ==========================================

function initAwardsAndRanking() {
  const awardsData = [
    { name: "Fabienne", percent: 85, soap: 70, emoji: "🐢" },
    { name: "Lara",     percent: 92, soap: 95, emoji: "🐬" },
    { name: "Sheryn",   percent: 70, soap: 60, emoji: "🦭" }
  ];

  const rankingDiv = document.getElementById("familyRanking");
  if (rankingDiv) {
    rankingDiv.innerHTML = "";
    awardsData.sort((a, b) => b.percent - a.percent).forEach((child, index) => {
      const icon = index === 0 ? "🏆" : (index === 1 ? "⭐" : "📈");
      const item = document.createElement("button");
      item.className = "ranking-button";
      item.innerHTML = `${icon} ${index + 1}. ${child.name} — ${child.percent}%`;
      rankingDiv.appendChild(item);
    });
  }

  const observations = [
    { title: "Lara wäscht sehr häufig die Hände",       tip: "Super Gewohnheit! Weiter so!" },
    { title: "Fabienne vergisst manchmal die Seife",    tip: "Vielleicht eine kleine Erinnerung am Waschbecken?" },
    { title: "Sheryn braucht noch etwas Unterstützung", tip: "Gemeinsames Händewaschen kann helfen" }
  ];

  const obsDiv = document.getElementById("observationsList");
  if (obsDiv) {
    obsDiv.innerHTML = "";
    observations.forEach(obs => {
      const box = document.createElement("p");
      box.innerHTML = `<strong>${obs.title}</strong><br><br>💡 Tipp: ${obs.tip}`;
      obsDiv.appendChild(box);
    });
  }

  const todayBtn  = document.getElementById("todayBtn");
  const weekBtn   = document.getElementById("weekBtn");
  const todayView = document.getElementById("todayView");
  const weekView  = document.getElementById("weekView");

  if (todayBtn && weekBtn && todayView && weekView) {
    todayBtn.addEventListener("click", () => {
      todayView.classList.remove("hidden");
      weekView.classList.add("hidden");
      todayBtn.classList.add("active-toggle");
      weekBtn.classList.remove("active-toggle");
    });
    weekBtn.addEventListener("click", () => {
      weekView.classList.remove("hidden");
      todayView.classList.add("hidden");
      weekBtn.classList.add("active-toggle");
      todayBtn.classList.remove("active-toggle");
    });
  }
}