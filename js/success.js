document.addEventListener("DOMContentLoaded", () => {
    const confettiButton = document.getElementById("confettiButton");
  
    confettiButton.addEventListener("click", () => {
      // 1) Confetti
      confetti({
        particleCount: 1000,
        spread: 360,
        origin: { y: 0.5 },
      });
  
      // 3) Redirect after 1.5 seconds
      setTimeout(() => {
        window.location.href = "index.html";
      }, 1500);
    });
  });
  