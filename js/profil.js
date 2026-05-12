async function loadProfile() {
    try {
        const response = await fetch("api/profil.php", {
            credentials: "include",
        });

        const result = await response.json();

        if (result.status === "success") {
            document.getElementById("vorname").value = result.vorname || "";
            document.getElementById("nachname").value = result.nachname || "";
            document.getElementById("email").value = result.email || "";
        }

    } catch (error) {
        console.error("Error loading profile:", error);
    }
}

loadProfile();

document
  .getElementById("profilForm")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const vorname = document.getElementById("vorname").value.trim();
    const nachname = document.getElementById("nachname").value.trim();
    const email = document.getElementById("email").value.trim();
    const oldPassword = document.getElementById("oldPassword").value;
    const newPassword = document.getElementById("newPassword").value;

    try {
      const response = await fetch("api/profilUpdate.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
            vorname,
            nachname,
            email,
            oldPassword,
            newPassword
        }),
      });

      const result = await response.json();

      if (result.status === "success") {
        alert("Profil erfolgreich aktualisiert!");
      } else {
        alert(result.message || "Fehler beim Update.");
      }

    } catch (error) {
      console.error("Error:", error);
      alert("Etwas ist schiefgelaufen.");
    }
});


const togglePassword = document.getElementById("togglePassword");
const passwordBox = document.getElementById("passwordBox");

togglePassword.addEventListener("click", function () {
    passwordBox.classList.toggle("hidden");
});