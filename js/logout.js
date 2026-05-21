// logout.js
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById("logoutBtn");

  // Sicherheits-Check: Nur ausführen, wenn der Button auf der Seite gefunden wird
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async (e) => {
      // Standard-Verhalten des Buttons verhindern
      e.preventDefault();

      try {
        const response = await fetch("api/logout.php", {
          method: "GET",
          credentials: "include",
        });

        const result = await response.json();

        if (result.status === "success") {
          // Nach erfolgreichem Logout zur Login-Seite weiterleiten
          window.location.href = "login.html";
        } else {
          console.error("Logout failed");
          alert("Logout fehlgeschlagen. Bitte erneut versuchen.");
        }
      } catch (error) {
        console.error("Logout error:", error);
        alert("Beim Logout ist etwas schiefgelaufen!");
      }
    });
  }
});