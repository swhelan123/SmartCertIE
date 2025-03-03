function fetchSubscriptionDetails() {
    // Replace with your API endpoint to get subscription details
    fetch('/get-subscription-details', { method: 'GET' })
      .then(res => res.json())
      .then(data => {
        document.getElementById('startDate').textContent = data.startDate;
        document.getElementById('nextBillingDate').textContent = data.nextBillingDate;
        document.getElementById('paymentMethod').textContent = data.paymentMethod;
        // Set the modal's access-until date
        document.getElementById('accessUntil').textContent = data.nextBillingDate;
        // Optionally, you can hide the cancel button if the subscription is not active
        if (!data.isActive) {
          document.getElementById('cancelSubscriptionBtn').classList.add('hidden');
        }
      })
      .catch(err => console.error('Error fetching subscription details:', err));
  }
  
  document.addEventListener('DOMContentLoaded', fetchSubscriptionDetails);
  