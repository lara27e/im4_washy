// ==========================================
// 1. INITIALISIERUNG & USER-DATEN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const savedEmail = localStorage.getItem('userEmail') || "deine-familie@email.com";
  const savedId = localStorage.getItem('userId') || "12345";

  if (document.getElementById('userEmail')) {
      document.getElementById('userEmail').innerText = savedEmail;
  }
  if (document.getElementById('userId')) {
      document.getElementById('userId').innerText = savedId;
  }

  setTimeout(() => {
      setWashPercentage(85); 
  }, 800);
});

// ==========================================
// 2. KREISDIAGRAMM LOGIK
// ==========================================
function setWashPercentage(percent) {
  const circle = document.getElementById('progressCircle');
  const percentText = document.getElementById('percentageValue');
  const descPercentText = document.getElementById('desc-percentage');
  
  if (!circle || !percentText) return;

  const circumference = 2 * Math.PI * 45;
  const validatedPercent = Math.min(Math.max(percent, 0), 100);
  const offset = circumference - (validatedPercent / 100 * circumference);
  
  circle.style.strokeDashoffset = offset;
  
  let currentDisplay = 0;
  const duration = 1000;
  const stepTime = Math.max(10, Math.floor(duration / (validatedPercent || 1)));
  
  const interval = setInterval(() => {
      if (currentDisplay >= validatedPercent) {
          percentText.innerText = validatedPercent;
          if (descPercentText) descPercentText.innerText = validatedPercent;
          clearInterval(interval);
      } else {
          currentDisplay++;
          percentText.innerText = currentDisplay;
          if (descPercentText) descPercentText.innerText = currentDisplay;
      }
  }, stepTime);
}

// ==========================================
// 3. FAMILIEN-VERWALTUNG (ADD / EDIT / DELETE)
// ==========================================
let selectedAnimalEmoji = "";
let selectedColorClass = "pink"; // Standardfarbe
let currentEditCard = null; 

/**
 * Steuert die Auswahl der Rolle (Kind/Erwachsener)
 */
function selectRole(element, roleValue) {
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    const ageInput = document.getElementById('newMemberAge');
    if (ageInput) ageInput.value = roleValue;
}

/**
 * Steuert die Auswahl der Hintergrundfarbe
 */
function selectColor(element, colorName) {
    // Alle Markierungen im Modal entfernen
    document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
    // Gewählte Farbe markieren
    element.classList.add('selected');
    // Wert für die Speicherung setzen
    selectedColorClass = colorName;
    const colorInput = document.getElementById('newMemberColor');
    if (colorInput) colorInput.value = colorName;
}

// Modal zum HINZUFÜGEN öffnen
function openAddMemberModal() {
  currentEditCard = null;
  selectedAnimalEmoji = "";
  
  document.getElementById('modalTitle').innerText = "Neues Mitglied";
  document.getElementById('deleteBtn').classList.add('hidden');
  document.getElementById('newMemberName').value = "";
  
  // Standard-Rolle: Kind
  const firstRoleBtn = document.querySelectorAll('.role-btn')[0];
  if (firstRoleBtn) selectRole(firstRoleBtn, 'Kind');
  
  // Standard-Farbe: Pink
  const firstColorBtn = document.querySelector('.color-option.pink');
  if (firstColorBtn) selectColor(firstColorBtn, 'pink');
  
  document.querySelectorAll('.animal-option').forEach(opt => opt.classList.remove('selected'));
  document.getElementById('addMemberModal').classList.remove('hidden');
}

// Modal zum BEARBEITEN öffnen
function openEditModal(btnElement) {
  currentEditCard = btnElement.closest('.member-card');
  
  const currentName = currentEditCard.querySelector('.member-name').innerText;
  const currentRole = currentEditCard.querySelector('.member-sub').innerText;
  const currentEmoji = currentEditCard.querySelector('.avatar-emoji').innerText;

  // Aktuelle Farbe der Karte erkennen
  const colorClasses = ["pink", "yellow", "blue", "green", "purple"];
  const currentColor = colorClasses.find(c => currentEditCard.classList.contains(c)) || "pink";

  document.getElementById('modalTitle').innerText = "Mitglied bearbeiten";
  document.getElementById('newMemberName').value = currentName;
  document.getElementById('deleteBtn').classList.remove('hidden');
  
  // Rolle vorselektieren
  document.querySelectorAll('.role-btn').forEach(btn => {
      if (btn.innerText === currentRole) selectRole(btn, currentRole);
  });

  // Farbe vorselektieren
  const colorBtn = document.querySelector(`.color-option.${currentColor}`);
  if (colorBtn) selectColor(colorBtn, currentColor);

  // Emoji vorselektieren
  selectedAnimalEmoji = currentEmoji;
  document.querySelectorAll('.animal-option').forEach(opt => {
      if (opt.querySelector('span').innerText === currentEmoji) {
          opt.classList.add('selected');
      } else {
          opt.classList.remove('selected');
      }
  });

  document.getElementById('addMemberModal').classList.remove('hidden');
}

function closeAddMemberModal() {
  document.getElementById('addMemberModal').classList.add('hidden');
}

function selectAnimal(element, emoji) {
  document.querySelectorAll('.animal-option').forEach(opt => opt.classList.remove('selected'));
  element.classList.add('selected');
  selectedAnimalEmoji = emoji;
}

// Speichern (erkennt ob Neu oder Bearbeiten)
function saveMember() {
  const name = document.getElementById('newMemberName').value;
  const role = document.getElementById('newMemberAge').value || "Kind";
  const color = document.getElementById('newMemberColor').value || "pink";
  
  if (!name || !selectedAnimalEmoji) {
      alert("Bitte Name eingeben und Tier wählen!");
      return;
  }

  if (currentEditCard) {
      // MODUS: BEARBEITEN
      currentEditCard.querySelector('.member-name').innerText = name;
      currentEditCard.querySelector('.member-sub').innerText = role;
      currentEditCard.querySelector('.avatar-emoji').innerText = selectedAnimalEmoji;
      
      // Farbkassen aktualisieren
      currentEditCard.classList.remove("pink", "yellow", "blue", "green", "purple");
      currentEditCard.classList.add(color);
  } else {
      // MODUS: NEU HINZUFÜGEN
      addNewFamilyCard(name, role, selectedAnimalEmoji, color);
  }

  closeAddMemberModal();
}

function deleteMember() {
  if (currentEditCard && confirm("Dieses Mitglied wirklich löschen?")) {
      currentEditCard.remove();
      closeAddMemberModal();
  }
}

function addNewFamilyCard(name, role, emoji, color) {
  const familyList = document.getElementById('familyList');
  const newCard = document.createElement('div');
  
  // Gewählte Farbe als Klasse setzen
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
// 4. AWARDS / RANKING / FAMILIEN-ERFOLGE
// ==========================================
document.addEventListener("DOMContentLoaded", () => {

  const awardsData = [
    { name: "Fabienne", percent: 85, soap: 70, emoji: "🐢" },
    { name: "Lara", percent: 92, soap: 95, emoji: "🐬" },
    { name: "Sheryn", percent: 70, soap: 60, emoji: "🦭" }
  ];

  const rankingDiv = document.getElementById("familyRanking");

  if (rankingDiv) {
    rankingDiv.innerHTML = "";

    awardsData
      .sort((a, b) => b.percent - a.percent)
      .forEach((child, index) => {
        let icon = "📈";
        if (index === 0) icon = "🏆";
        if (index === 1) icon = "⭐";

        const item = document.createElement("button");
        item.type = "button";
        item.className = "ranking-button";
        item.innerHTML = `${icon} ${index + 1}. ${child.name} — ${child.percent}% richtig Hände gewaschen`;

        item.addEventListener("click", () => {
          const modal = document.getElementById("childDetailModal");
          const detailName = document.getElementById("detailName");
          const detailAvatar = document.getElementById("detailAvatar");
          const detailMotivation = document.getElementById("detailMotivation");
          const detailPercent = document.getElementById("detailPercent");

          if (!modal || !detailName || !detailAvatar || !detailMotivation || !detailPercent) {
            console.error("Detailbereich fehlt im HTML");
            return;
          }

          modal.classList.remove("hidden");
          modal.style.display = "block";

          detailName.innerText = child.name;
          detailAvatar.innerText = child.emoji;
          detailMotivation.innerText = `Du machst das super, ${child.name}!`;
          detailPercent.innerText = `${child.percent}% richtig Hände gewaschen`;
        });

        rankingDiv.appendChild(item);
      });
  }

  const totalWashCount = document.getElementById("totalWashCount");
  const soapRate = document.getElementById("soapRate");
  const weeklySuccess = document.getElementById("weeklySuccess");

  if (totalWashCount && soapRate && weeklySuccess) {
    const totalPercent = awardsData.reduce((sum, child) => sum + child.percent, 0);
    const totalSoap = awardsData.reduce((sum, child) => sum + child.soap, 0);

    totalWashCount.innerText = totalPercent;
    soapRate.innerText = Math.round(totalSoap / awardsData.length) + "%";
    weeklySuccess.innerText = Math.round(totalPercent / awardsData.length) + "%";
  }

  const observations = [
    {
      title: "Lara wäscht sehr häufig die Hände",
      tip: "Super Gewohnheit! Weiter so!"
    },
    {
      title: "Fabienne vergisst manchmal die Seife",
      tip: "Vielleicht eine kleine Erinnerung am Waschbecken?"
    },
    {
      title: "Sheryn braucht noch etwas Unterstützung",
      tip: "Gemeinsames Händewaschen kann helfen"
    }
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

  const todayBtn = document.getElementById("todayBtn");
  const weekBtn = document.getElementById("weekBtn");
  const todayView = document.getElementById("todayView");
  const weekView = document.getElementById("weekView");

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

});