// status.js - homepage server status checker (moved from inline script)

async function checkServerStatus() {
  try {
    const response = await fetch("/api/test");
    const data = await response.json();

    if (data.success) {
      document.getElementById("serverStatus").textContent = "Running";
      document.getElementById("dbStatus").textContent = "Connected";
      document.getElementById("apiStatus").textContent = "Working";
      console.log("Server Response:", data);
    } else {
      throw new Error("Server returned error");
    }
  } catch (error) {
    document.getElementById("serverStatus").textContent = "Error";
    document.getElementById("serverStatus").classList.add("pending");
    document.getElementById("dbStatus").textContent = "Error";
    document.getElementById("dbStatus").classList.add("pending");
    document.getElementById("apiStatus").textContent = "Error";
    document.getElementById("apiStatus").classList.add("pending");
    console.error("Server Error:", error);
  }
}

window.addEventListener("load", checkServerStatus);
