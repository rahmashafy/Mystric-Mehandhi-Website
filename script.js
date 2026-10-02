document.getElementById('category-select').addEventListener('change', function () {
    const selectedCategory = this.value;
    const imageBoxes = document.querySelectorAll('.image-box');
  
    imageBoxes.forEach((box) => {
      if (selectedCategory === 'all' || box.classList.contains(selectedCategory)) {
        box.classList.add('active'); // Show matching category images
      } else {
        box.classList.remove('active'); // Hide non-matching images
      }
    });
  });