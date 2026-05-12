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
let currentEditCard = null; 

/**
 * Steuert die Auswahl der Rolle (Kind/Erwachsener) über die Buttons
 */
function selectRole(element, roleValue) {
    // Optisches Feedback: Alle Buttons zurücksetzen, gewählten markieren
    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('selected'));
    element.classList.add('selected');
    
    // Den Wert im versteckten Input für die Speicherung ablegen
    const ageInput = document.getElementById('newMemberAge');
    if (ageInput) ageInput.value = roleValue;
}

// Modal zum HINZUFÜGEN öffnen
function openAddMemberModal() {
  currentEditCard = null;
  selectedAnimalEmoji = "";
  
  document.getElementById('modalTitle').innerText = "Neues Mitglied";
  document.getElementById('deleteBtn').classList.add('hidden');
  document.getElementById('newMemberName').value = "";
  
  // Standard-Rolle auf "Kind" setzen und ersten Button markieren
  const firstRoleBtn = document.querySelectorAll('.role-btn')[0];
  if (firstRoleBtn) selectRole(firstRoleBtn, 'Kind');
  
  document.querySelectorAll('.animal-option').forEach(opt => opt.classList.remove('selected'));
  document.getElementById('addMemberModal').classList.remove('hidden');
}

// Modal zum BEARBEITEN öffnen
function openEditModal(btnElement) {
  currentEditCard = btnElement.closest('.member-card');
  
  const currentName = currentEditCard.querySelector('.member-name').innerText;
  const currentRole = currentEditCard.querySelector('.member-sub').innerText; // "Kind" oder "Erwachsener"
  const currentEmoji = currentEditCard.querySelector('.avatar-emoji').innerText;

  document.getElementById('modalTitle').innerText = "Mitglied bearbeiten";
  document.getElementById('newMemberName').value = currentName;
  document.getElementById('deleteBtn').classList.remove('hidden');
  
  // Den passenden Rollen-Button vorselektieren
  document.querySelectorAll('.role-btn').forEach(btn => {
      if (btn.innerText === currentRole) {
          selectRole(btn, currentRole);
      }
  });

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
  // Wert kommt jetzt aus dem versteckten Input, der durch selectRole gesetzt wird
  const role = document.getElementById('newMemberAge').value || "Kind";
  
  if (!name || !selectedAnimalEmoji) {
      alert("Bitte Name eingeben und Tier wählen!");
      return;
  }

  if (currentEditCard) {
      // MODUS: BEARBEITEN
      currentEditCard.querySelector('.member-name').innerText = name;
      currentEditCard.querySelector('.member-sub').innerText = role;
      currentEditCard.querySelector('.avatar-emoji').innerText = selectedAnimalEmoji;
  } else {
      // MODUS: NEU HINZUFÜGEN
      addNewFamilyCard(name, role, selectedAnimalEmoji);
  }

  closeAddMemberModal();
}

function deleteMember() {
  if (currentEditCard && confirm("Dieses Mitglied wirklich löschen?")) {
      currentEditCard.remove();
      closeAddMemberModal();
  }
}

function addNewFamilyCard(name, role, emoji) {
  const familyList = document.getElementById('familyList');
  const newCard = document.createElement('div');
  
  // Standard-Farbe (kannst du später auch dynamisch machen)
  newCard.className = "member-card yellow"; 
  
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