async function checkAuth() {
  try {
    const response = await fetch("/api/protected.php", {
      credentials: "include",
    });

    if (response.status === 401) {
      window.location.href = "/login.html";
      return false;
    }

    const result = await response.json();

    // Display user data in the protected content div
    document.getElementById("userEmail").textContent = result.email;
    document.getElementById("userId").textContent = result.user_id;

    return true;
  } catch (error) {
    console.error("Auth check failed:", error);
    window.location.href = "/login.html";
    return false;
  }
}

// Check auth when page loads
window.addEventListener("load", checkAuth);

/**
 * Aktualisiert das Diagramm
 * @param {number} current - Anzahl der aktuellen Waschvorgänge
 * @param {number} total - Ziel-Anzahl (z.B. 100)
 */
function setWashProgress(current, total) {
  const circle = document.getElementById('progressCircle');
  const countText = document.getElementById('currentCount');
  const goalText = document.getElementById('totalGoal');
  
  // Umfang des Kreises (r=45 -> 2 * PI * 45 = ca. 283)
  const circumference = 2 * Math.PI * 45;
  
  // Prozent berechnen
  const percent = (current / total) * 100;
  // Offset berechnen (wieviel vom Umfang weggenommen wird)
  const offset = circumference - (percent / 100 * circumference);
  
  // Werte im HTML setzen
  circle.style.strokeDashoffset = offset;
  countText.innerText = current;
  goalText.innerText = total;
}

// Beispiel-Aufruf (Das machst du später mit deinen Datenbank-Werten)
// Wenn die Seite geladen wird, zeige z.B. 75 von 100 an:
window.addEventListener('load', () => {
  setTimeout(() => {
      setWashProgress(75, 100); 
  }, 500); // Kleine Verzögerung für den Wow-Effekt beim Laden
});
