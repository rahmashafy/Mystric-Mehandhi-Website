let cart = [];
let total = 0;


function addToCart(productName, price) {
    cart.push({ name: productName, price: price });
    updateCartCount();
    updateCartTotal();
}


function updateCartCount() {
    document.getElementById('cart-count').innerText = cart.length;
}


function updateCartTotal() {
    total = cart.reduce((sum, product) => sum + product.price, 0);
    document.getElementById('cart-total').innerText = total.toFixed(2);
}


function viewCart() {
    const cartItems = document.getElementById('cart-items');
    cartItems.innerHTML = '';

    cart.forEach((item, index) => {
        const li = document.createElement('li');
        li.innerHTML = `${item.name} - Rs.${item.price} <button onclick="removeFromCart(${index})">Remove</button>`;
        cartItems.appendChild(li);
    });

    document.getElementById('cart-modal').style.display = 'flex';
}


function removeFromCart(index) {
    cart.splice(index, 1);
    updateCartCount();
    updateCartTotal();
    viewCart(); 
}


function closeCart() {
    document.getElementById('cart-modal').style.display = 'none';
}

