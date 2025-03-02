document.addEventListener("DOMContentLoaded", () => {
    const explodeButton = document.getElementById("explodeButton");
  
    explodeButton.addEventListener("click", () => {
      // 1) Confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
  
      // 2) Trigger shard animation by adding the 'exploded' class
      explodeButton.classList.add("exploded");
  
      // 3) Redirect after 1.5 seconds
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    });
  });
  