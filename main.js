window.addEventListener("load", () => {
  if (window.alt1) {
    alt1.identifyAppUrl("appconfig.json");
    console.log("Archaeology Assistant loaded successfully within Alt1.");
  } else {
    document.getElementById("app").innerHTML = `
      <h1>Archaeology Assistant</h1>
      <p>Note: This app is designed for use inside Alt1 Toolkit.</p>
    `;
  }
});
