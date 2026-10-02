// Show Sub-services
function showSubServices(service) {
    const subServices = document.getElementById("sub-services");
    const subTitle = document.getElementById("sub-title");
    subServices.classList.remove("hidden");
  
    if (service === "design") {
      subTitle.textContent = "Mehandhi Design Sub-Services";
    }
    
    document.querySelector(".service-container").style.display = "none";
  }
  
  // Go Back to Main Services
  function goBack() {
    document.getElementById("sub-services").classList.add("hidden");
    document.querySelector(".service-container").style.display = "flex";
  }
  
  // Redirect to Booking page for Sub-services
  function goToBooking(serviceType) {
    let bookingUrl = "";
  
    switch (serviceType) {
      case 'bridal':
        bookingUrl = "bridal-booking.html"; // Link to the bridal mehndi booking page
        break;
      case 'party':
        bookingUrl = "party-booking.html"; // Link to the party mehndi booking page
        break;
      case 'simple':
        bookingUrl = "simple-booking.html"; // Link to the simple mehndi booking page
        break;
      case 'arabic':
        bookingUrl = "arabic-booking.html"; // Link to the arabic mehndi booking page
        break;
      default:
        bookingUrl = "services.html"; // Fallback to services page if no service found
    }
  
    window.location.href = bookingUrl; // Redirect to the appropriate booking page
  }
  