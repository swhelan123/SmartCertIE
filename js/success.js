document.addEventListener("DOMContentLoaded", () => {
const dustButton = document.getElementById("dustButton");

dustButton.addEventListener("click", () => {
    // Call the confetti function
    confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 }
    });
    
    // ... then do other stuff, like redirect ...
    setTimeout(() => {
    window.location.href = "index.html";
    }, 1500);
});
});
