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