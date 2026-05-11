//const myID = await checkAuth();
//console.log(myID);

async function loadProfile() {
    try {
        const response = await fetch("api/profil.php", {
            credentials: "include",
    });
        const result = await response.text();
        console.log("Profile data:", result);
    }   catch (error) {
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

    try {
      const response = await fetch("api/profilUpdate.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({vorname, nachname}),
      });
      const result = await response.text();
      console.log("Update response:", result);
/*
      if (result.status === "success") {
        alert("Profil updated successfully!");
        window.location.href = "login.html";
      } else {
        alert(result.message || "Registration failed.");
      } */
    } 

       catch (error) {
      console.error("Error:", error);
      alert("Something went wrong!");
    }
  });
