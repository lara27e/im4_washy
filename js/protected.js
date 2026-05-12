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