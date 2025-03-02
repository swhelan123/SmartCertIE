document.addEventListener("DOMContentLoaded", () => {
    const dustButton = document.getElementById("dustButton");
  
    // On button click, trigger dust animation & redirect after 1s
    dustButton.addEventListener("click", () => {
      dustButton.classList.add("dust"); // add the animation class
      setTimeout(() => {
        // Redirect to the main page after 1 second
        window.location.href = "index.html";
      }, 1000);
    });
  });
  