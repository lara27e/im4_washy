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
});

// ==========================================
// 2. DATENBANK-SCHNITTSTELLE (LOAD, SAVE & DELETE)
// ==========================================

async function loadFamilyMembers() {
  try {
    const response = await fetch("api/family_manager.php");
    if (!response.ok) throw new Error("Server-Antwort nicht okay");
    
    const data = await response.json();
    const members = data.members || [];
    const activities = data.activities || [];

    const familyList = document.getElementById('familyList');
    if (familyList) {
      familyList.innerHTML = "";
      members.forEach(m => addNewFamilyCard(m));
      initAwardsAndRanking(members);
    }

    renderLiveActivities(activities);

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
  const isEdit = currentEditCard !== null;
  
  if (isEdit) {
    memberData.id = currentEditCard.getAttribute('data-id');
  }

  try {
    const response = await fetch("api/family_manager.php", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(memberData)
    });

    if (!response.ok) throw new Error("Ungültige Server-Antwort");
    const result = await response.json();

    if (result.status === "success") {
      if (isEdit) {
        currentEditCard.className = `member-card ${color}`;
        currentEditCard.querySelector('.member-name').innerText = name;
        currentEditCard.querySelector('.member-sub').innerText = role;
        currentEditCard.querySelector('.avatar-emoji').innerText = selectedAnimalEmoji;
        currentEditCard = null;
      } else {
        const newMemberStats = {
          id: result.id, name: name, role: role, emoji: selectedAnimalEmoji, color: color,
          heute_erfolg: 0, heute_gesamt: 0, woche_erfolg: 0, woche_gesamt: 0, vergessen_woche: 0
        };
        addNewFamilyCard(newMemberStats);
        
        if (role === "Kind") {
          openBraceletModal(result.id, name);
        }
      }
      closeAddMemberModal();
      loadFamilyMembers(); 
    } else {
      alert("Datenbank-Fehler: " + result.message);
    }
  } catch (error) {
    console.error("Fetch-Fehler:", error);
    alert("Verbindung zum Server fehlgeschlagen!");
  }
}

async function deleteMember() {
  if (!currentEditCard) return;

  const memberId   = currentEditCard.getAttribute('data-id');
  const memberName = currentEditCard.querySelector('.member-name').innerText;

  if (!confirm(`Möchtest du ${memberName} wirklich löschen? Alle Statistiken gehen verloren.`)) {
    return;
  }

  try {
    const response = await fetch("api/family_manager.php", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: memberId })
    });

    if (!response.ok) throw new Error("Server-Fehler beim Löschen");
    const result = await response.json();

    if (result.status === "success") {
      currentEditCard.remove();
      currentEditCard = null;
      
      const braceletModal = document.getElementById('braceletModal');
      if (braceletModal && !braceletModal.classList.contains('hidden')) {
        const modalKindName = document.getElementById('braceletKindName').innerText;
        if (modalKindName === memberName) {
          closeBraceletModal();
        }
      }
      closeAddMemberModal();
      loadFamilyMembers(); 
    } else {
      alert("Fehler beim Löschen: " + result.message);
    }
  } catch (error) {
    console.error("Lösch-Fehler:", error);
    alert("Verbindung zum Server fehlgeschlagen!");
  }
}

// ==========================================
// 3. BRACELET-REGISTRIERUNGS-POPUP
// ==========================================

let braceletPollInterval = null;
let braceletCountdown    = null;
let braceletSecondsLeft  = 30;
let pendingKindId        = null; 

function openBraceletModal(kindId, kindName) {
  braceletSecondsLeft = 30;
  pendingKindId = kindId; 
  
  document.getElementById('braceletKindName').innerText = kindName;
  document.getElementById('braceletStatus').innerText   = "Warte auf Chip...";
  document.getElementById('braceletCountdown').innerText = braceletSecondsLeft + "s";
  document.getElementById('braceletModal').classList.remove('hidden');
  document.getElementById('braceletIcon').innerText = "📡";
  document.getElementById('braceletModal').querySelector('.bracelet-modal-box').className = 'bracelet-modal-box waiting';

  braceletCountdown = setInterval(() => {
    braceletSecondsLeft--;
    document.getElementById('braceletCountdown').innerText = braceletSecondsLeft + "s";
    if (braceletSecondsLeft <= 0) {
      clearInterval(braceletCountdown);
    }
  }, 1000);

  braceletPollInterval = setInterval(async () => {
    try {
      const response = await fetch("api/family_manager.php");
      if (!response.ok) return;
      const data = await response.json();
      const members = data.members || [];

      const currentKid = members.find(m => m.id == pendingKindId);

      if (currentKid && currentKid.bracelet !== null && currentKid.bracelet !== "") {
        clearInterval(braceletPollInterval);
        clearInterval(braceletCountdown);
        showBraceletSuccess();
      }
    } catch (e) {
      console.error("Bracelet-Poll Fehler:", e);
    }
  }, 2000);

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
  pendingKindId = null; 
  setTimeout(() => closeBraceletModal(), 2500);
}

async function showBraceletTimeout() {
  document.getElementById('braceletIcon').innerText    = "⏱️";
  document.getElementById('braceletStatus').innerText  = "Zeit abgelaufen. Kind wird wieder gelöscht.";
  document.getElementById('braceletCountdown').innerText = "";
  document.getElementById('braceletModal').querySelector('.bracelet-modal-box').className = 'bracelet-modal-box timeout';
  
  if (pendingKindId) {
    try {
      const response = await fetch("api/family_manager.php", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: pendingKindId })
      });
      
      if (response.ok) {
        const cardToRemove = document.querySelector(`[data-id="${pendingKindId}"]`);
        if (cardToRemove) cardToRemove.remove();
      }
    } catch (error) {
      console.error("Fehler beim automatischen Löschen nach Timeout:", error);
    }
    pendingKindId = null; 
  }

  setTimeout(() => closeBraceletModal(), 3500);
}

function showBraceletError(message) {
  clearInterval(braceletPollInterval);
  clearInterval(braceletCountdown);
  document.getElementById('braceletIcon').innerText    = "❌";
  document.getElementById('braceletStatus').innerText  = message || "Fehler beim Verbinden.";
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

function addNewFamilyCard(m) {
  const familyList = document.getElementById('familyList');
  if (!familyList) return;
  const newCard = document.createElement('div');
  newCard.className = `member-card ${m.color}`;
  newCard.setAttribute('data-id', m.id);
  
  newCard.innerHTML = `
    <div class="member-header">
      <div class="member-avatar"><span class="avatar-emoji">${m.emoji}</span></div>
      <div class="member-meta">
        <h3 class="member-name">${m.name}</h3>
        <p class="member-sub">${m.role}</p>
      </div>
      <div class="edit-btn" onclick="openEditModal(this)">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#888" stroke-width="2">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
      </div>
    </div>
    <div class="member-stats">
      <div class="stat-item"><strong>${m.heute_erfolg}/${m.heute_gesamt}</strong><p>Heute</p></div>
      <div class="stat-item"><strong>${m.woche_gesamt}</strong><p>Woche</p></div>
      <div class="stat-item"><strong>${m.vergessen_woche}</strong><p>Vergessen</p></div>
    </div>
  `;
  familyList.appendChild(newCard);
}

// ==========================================
// 5. KREISDIAGRAMM & AWARDS / OBSERVATIONS
// ==========================================

function initAwardsAndRanking(members) {
  if (!members || !Array.isArray(members)) return;

  const kinderDaten = members
    .filter(m => m.role === "Kind")
    .map(k => {
      const gesamtWoche = parseInt(k.woche_gesamt) || 0;
      const erfolgWoche = parseInt(k.woche_erfolg) || 0;
      const prozentWoche = gesamtWoche > 0 ? Math.round((erfolgWoche / gesamtWoche) * 100) : 0;
      
      return {
        id: k.id,
        name: k.name,
        percent: prozentWoche,
        emoji: k.emoji,
        heute_erfolg: k.heute_erfolg || 0,
        heute_gesamt: k.heute_gesamt || 0,
        woche_erfolg: erfolgWoche,
        woche_gesamt: gesamtWoche,
        lifetime_erfolg: k.lifetime_erfolg || 0,
        lifetime_gesamt: k.lifetime_gesamt || 0
      };
    });

  kinderDaten.sort((a, b) => b.percent - a.percent);

  // 1. RANGLISTE AKTUALISIEREN
  const rankingDiv = document.getElementById("familyRanking");
  if (rankingDiv) {
    rankingDiv.innerHTML = "";
    
    if (kinderDaten.length === 0) {
      rankingDiv.innerHTML = "<p style='color:#888;'>Noch keine Daten für diese Woche.</p>";
    } else {
      kinderDaten.forEach((child, index) => {
        const icon = index === 0 ? "🏆" : (index === 1 ? "⭐" : "📈");
        const item = document.createElement("button");
        item.className = "ranking-button";
        item.innerHTML = `${icon} ${index + 1}. ${child.emoji} ${child.name} — ${child.percent}%`;
        item.onclick = () => openChildDetailModal(child);
        rankingDiv.appendChild(item);
      });
    }
  }

  // 2. DASHBOARD KREIS AKTUALISIEREN
  let totalHeuteGesamt = 0;
  let totalHeuteErfolg = 0;
  
  // 3. VARIABLEN FÜR FAMILIEN-ERFOLGE (Awards Tab)
  let familyLifetimeGesamt = 0;
  let familyLifetimeSeife = 0;
  let familyWocheGesamt = 0;
  let familyWocheErfolg = 0;

  members.forEach(m => {
    // Für den Dashboard-Kreis
    totalHeuteGesamt += parseInt(m.heute_gesamt) || 0;
    totalHeuteErfolg += parseInt(m.heute_erfolg) || 0;
    
    // Für die Familien-Erfolge (nur Kinder)
    if (m.role === "Kind") {
      familyLifetimeGesamt += parseInt(m.lifetime_gesamt) || 0;
      familyLifetimeSeife += parseInt(m.lifetime_seife) || 0;
      familyWocheGesamt += parseInt(m.woche_gesamt) || 0;
      familyWocheErfolg += parseInt(m.woche_erfolg) || 0;
    }
  });

  // Kreis-Animation berechnen
  const gesamtProzent = totalHeuteGesamt > 0 ? Math.round((totalHeuteErfolg / totalHeuteGesamt) * 100) : 0;
  const percentageValue = document.getElementById('percentageValue');
  const descPercentage = document.getElementById('desc-percentage');
  
  if (percentageValue) percentageValue.innerText = gesamtProzent;
  if (descPercentage) descPercentage.innerText = gesamtProzent;

  const progressCircle = document.getElementById('progressCircle');
  if (progressCircle) {
    const radius = progressCircle.r.baseVal.value;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (gesamtProzent / 100) * circumference;
    progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    progressCircle.style.strokeDashoffset = offset;
  }
  
  // 4. FAMILIEN-ERFOLGE INS HTML SCHREIBEN
  const soapRate = familyLifetimeGesamt > 0 ? Math.round((familyLifetimeSeife / familyLifetimeGesamt) * 100) : 0;
  const weeklySuccess = familyWocheGesamt > 0 ? Math.round((familyWocheErfolg / familyWocheGesamt) * 100) : 0;
  
  const totalWashEl = document.getElementById('totalWashCount');
  const soapRateEl = document.getElementById('soapRate');
  const weeklySuccessEl = document.getElementById('weeklySuccess');
  
  if (totalWashEl) totalWashEl.innerText = familyLifetimeGesamt;
  if (soapRateEl) soapRateEl.innerText = soapRate + "%";
  if (weeklySuccessEl) weeklySuccessEl.innerText = weeklySuccess + "%";
}

function openChildDetailModal(child) {
  const modal = document.getElementById("childDetailModal");
  if (!modal) return;

  document.getElementById("detailName").innerText = child.name;
  document.getElementById("detailAvatar").innerText = child.emoji;
  document.getElementById("detailMotivation").innerText = `Tolle Arbeit, ${child.name}! ✨`;

  const heuteProzent = child.heute_gesamt > 0 ? Math.round((child.heute_erfolg / child.heute_gesamt) * 100) : 0;
  
  document.getElementById("todayView").innerHTML = `
    <div class="detail-stat-box" style="text-align: center; padding: 15px;">
      <h3 style="font-size: 1.4em; color: #2563eb;">Heute: ${heuteProzent}% richtig</h3>
      <p style="margin-top: 8px; color: #555;">Erfolgreich: <strong>${child.heute_erfolg}</strong> von ${child.heute_gesamt} Versuchen</p>
    </div>
  `;

  document.getElementById("weekView").innerHTML = `
    <div class="week-box" style="background: #f0fdf4; border-left: 4px solid #22c55e; padding: 15px; margin-bottom: 12px; border-radius: 8px;">
      <strong style="color: #166534; font-size: 1.1em;">📊 Diese Woche:</strong><br>
      <span style="display:inline-block; margin-top:5px;">
        Erfolgsquote: <strong>${child.percent}%</strong><br>
        Bisher <strong>${child.woche_erfolg}x</strong> fehlerfrei (von ${child.woche_gesamt} Versuchen).
      </span>
    </div>
    
    <div class="week-box" style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; border-radius: 8px;">
      <strong style="color: #1e40af; font-size: 1.1em;">👑 Lifetime-Statistik:</strong><br>
      <span style="display:inline-block; margin-top:5px;">
        Erfolgreiche Waschtage: <strong style="color: #1d4ed8; font-size: 1.15em;">${child.lifetime_erfolg}x</strong><br>
        Gesamte Versuche seit Registrierung: ${child.lifetime_gesamt}
      </span>
    </div>
  `;

  modal.classList.remove("hidden");

  modal.onclick = (e) => {
    if (e.target === modal) {
      modal.classList.add("hidden");
    }
  };
}

// ==========================================
// 6. LIVE AKTIVITÄTEN
// ==========================================

function renderLiveActivities(activities) {
  const list = document.getElementById('activitiesList');
  if (!list) return;
  list.innerHTML = "";

  if (activities.length === 0) {
    list.innerHTML = "<p style='color:#888; text-align:center; padding:10px;'>Noch keine Aktivitäten.</p>";
    return;
  }

  activities.forEach(act => {
    const timeText = timeAgo(act.time);
    const isSuccess = parseInt(act.erfolg) === 1;
    
    const text = isSuccess ? "hat die Hände korrekt gewaschen" : "hat das Händewaschen nicht richtig beendet";
    const iconBg = isSuccess ? "#dcfce7" : "#fee2e2"; 

    list.innerHTML += `
      <div class="activity-item">
        <div class="activity-icon" style="background-color: ${iconBg};">${act.emoji}</div>
        <div class="activity-info">
          <p class="activity-fulltext"><strong>${act.name}</strong> ${text}</p>
        </div>
        <div class="activity-time">${timeText}</div>
      </div>
    `;
  });
}

function timeAgo(dateString) {
  const date = new Date(dateString.replace(/-/g, "/"));
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return "gerade eben";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `vor ${diffInMinutes} Min`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `vor ${diffInHours} Std`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) return "gestern";
  return `vor ${diffInDays} Tagen`;
}

document.addEventListener("DOMContentLoaded", () => {
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
});