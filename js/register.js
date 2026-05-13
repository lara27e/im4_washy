// register.js
document.getElementById("registerForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  // Alle Daten aus dem Formular holen
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const firstname = document.getElementById("firstname").value.trim();
  const lastname = document.getElementById("lastname").value.trim();
  const serial_number = document.getElementById("serial_number").value.trim();

  try {
      // SCHRITT 1: User registrieren
      const regResponse = await fetch("api/register.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, firstname, lastname }),
      });
      const regResult = await regResponse.json();

      if (regResult.status === "success") {
          const userId = regResult.user_id;

          // SCHRITT 2: Gerät koppeln (mit der neuen user_id)
          const deviceResponse = await fetch("api/register_device.php", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user_id: userId, serial_number: serial_number }),
          });
          const deviceResult = await deviceResponse.json();

          if (deviceResult.status === "success") {
              alert("Registrierung und Kopplung erfolgreich!");
              window.location.href = "login.html";
          } else {
              alert("User erstellt, aber Sensor-Fehler: " + deviceResult.message);
          }
      } else {
          alert("Fehler bei Registrierung: " + regResult.message);
      }
  } catch (error) {
      console.error("Error:", error);
      alert("Etwas ist schiefgelaufen!");
  }
});