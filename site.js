(function () {
  const CART_KEY = "mystric-mehandhi-cart";
  const ORDER_KEY = "mystric-mehandhi-orders";
  const BOOKING_KEY = "mystric-mehandhi-bookings";
  const MESSAGE_KEY = "mystric-mehandhi-messages";
  const USER_KEY = "mystric-mehandhi-user";
  const SESSION_KEY = "mystric-mehandhi-session";
  const PROTECTED_PAGES = ["service2.html", "book.html"];
  const LOYALTY_RATE = 0.1;

  const serviceOptions = {
    bridal: [
      { name: "Hands Only", price: 2000 },
      { name: "Hands and Feet", price: 3000 },
      { name: "Full Hands and Feet", price: 10000 },
      { name: "Full Custom Bridal Design", price: 12000 }
    ],
    party: [
      { name: "Minimal Design", price: 500 },
      { name: "Floral Design", price: 800 },
      { name: "Full Hands", price: 1500 },
      { name: "Hands and Feet", price: 2000 }
    ],
    simple: [
      { name: "Single Hand Design", price: 300 },
      { name: "Both Hands Simple", price: 500 },
      { name: "Minimal Hands and Feet", price: 700 }
    ],
    tutorial: [
      { name: "Beginner Cone Control", price: 2500 },
      { name: "Bridal Pattern Workshop", price: 5500 },
      { name: "Natural Henna Mixing Class", price: 3500 }
    ]
  };

  function money(value) {
    return `LKR ${Number(value || 0).toLocaleString("en-LK", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  function readJson(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function currentPageName() {
    return window.location.pathname.split("/").pop() || "index.html";
  }

  function getAccount() {
    return readJson(USER_KEY, null);
  }

  function getSessionUser() {
    const session = readJson(SESSION_KEY, null);
    const account = getAccount();
    if (!session || !account || session.email !== account.email) return null;
    return account;
  }

  function startSession(account) {
    writeJson(SESSION_KEY, {
      email: account.email,
      startedAt: new Date().toISOString()
    });
  }

  function endSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function isReturningCustomer() {
    const account = getSessionUser();
    return Boolean(account && (Number(account.bookingCount || 0) + Number(account.orderCount || 0) > 0));
  }

  function loyaltyOffer() {
    if (!isReturningCustomer()) return null;
    return {
      code: "MYSTRIC10",
      rate: LOYALTY_RATE,
      title: "Returning Client Privilege",
      description: "10% off your next mehndi booking or product order."
    };
  }

  function recordCustomerActivity(type) {
    const account = getSessionUser();
    if (!account) return;
    const updated = {
      ...account,
      [type === "booking" ? "bookingCount" : "orderCount"]: Number(account[type === "booking" ? "bookingCount" : "orderCount"] || 0) + 1
    };
    writeJson(USER_KEY, updated);
  }

  function getSafeNextPage() {
    const requested = new URLSearchParams(window.location.search).get("next") || "service2.html";
    const page = requested.split("?")[0];
    return PROTECTED_PAGES.includes(page) ? requested : "service2.html";
  }

  function profileInitials(name) {
    return (name || "User")
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0))
      .join("")
      .toUpperCase() || "U";
  }

  function guardProtectedPage() {
    const pageName = currentPageName();
    if (!PROTECTED_PAGES.includes(pageName) || getSessionUser()) return false;
    const requested = `${pageName}${window.location.search}`;
    window.location.replace(`login.html?next=${encodeURIComponent(requested)}`);
    return true;
  }

  function getCart() {
    return readJson(CART_KEY, []);
  }

  function saveCart(cart) {
    writeJson(CART_KEY, cart);
    updateCartBadges();
  }

  function cartTotals() {
    const cart = getCart();
    const base = cart.reduce(
      (totals, item) => {
        totals.count += item.qty;
        totals.subtotal += item.qty * item.price;
        return totals;
      },
      { count: 0, subtotal: 0 }
    );
    const offer = loyaltyOffer();
    const discount = offer ? Math.round(base.subtotal * offer.rate) : 0;
    return {
      ...base,
      discount,
      total: base.subtotal - discount,
      offer
    };
  }

  function updateCartBadges() {
    const totals = cartTotals();
    document.querySelectorAll("[data-cart-count]").forEach((badge) => {
      badge.textContent = totals.count;
    });
    document.querySelectorAll("[data-cart-total]").forEach((node) => {
      node.textContent = money(totals.total);
    });
  }

  function addToCart(name, price, image) {
    const cart = getCart();
    const existing = cart.find((item) => item.name === name);

    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({ name, price: Number(price), image: image || "", qty: 1 });
    }

    saveCart(cart);
    renderCartModal();
    showToast(`${name} added to cart.`);
  }

  function removeFromCart(name) {
    const nextCart = getCart().filter((item) => item.name !== name);
    saveCart(nextCart);
    renderCartModal();
    renderCheckoutSummary();
  }

  function changeCartQty(name, delta) {
    const cart = getCart().map((item) => {
      if (item.name === name) {
        return { ...item, qty: Math.max(1, item.qty + delta) };
      }
      return item;
    });
    saveCart(cart);
    renderCartModal();
    renderCheckoutSummary();
  }

  function clearCart() {
    saveCart([]);
    renderCartModal();
    renderCheckoutSummary();
  }

  function renderCartModal() {
    const list = document.querySelector("[data-cart-items]");
    const empty = document.querySelector("[data-cart-empty]");
    const totals = cartTotals();
    const cart = getCart();

    if (!list) return;

    list.innerHTML = "";
    if (!cart.length) {
      if (empty) empty.classList.remove("hidden");
      return;
    }

    if (empty) empty.classList.add("hidden");
    cart.forEach((item) => {
      const row = document.createElement("li");
      row.className = "cart-item";
      row.innerHTML = `
        <div>
          <strong>${item.name}</strong>
          <div>${money(item.price)} x ${item.qty}</div>
        </div>
        <div>
          <button class="button-secondary" type="button" data-qty-minus="${item.name}">-</button>
          <button class="button-secondary" type="button" data-qty-plus="${item.name}">+</button>
          <button class="button" type="button" data-remove-cart="${item.name}">Remove</button>
        </div>
      `;
      list.appendChild(row);
    });

    document.querySelectorAll("[data-modal-cart-total]").forEach((node) => {
      node.textContent = money(totals.total);
    });
  }

  function ensureCartModal() {
    if (document.querySelector("[data-cart-modal]")) return;

    const modal = document.createElement("div");
    modal.className = "modal";
    modal.setAttribute("data-cart-modal", "");
    modal.innerHTML = `
      <div class="modal-content" role="dialog" aria-modal="true" aria-label="Shopping cart">
        <div class="modal-head">
          <h2>Your Cart</h2>
          <button class="icon-button" type="button" data-close-cart aria-label="Close cart">Close</button>
        </div>
        <p class="hidden" data-cart-empty>Your cart is empty.</p>
        <ul class="cart-list" data-cart-items></ul>
        <div class="cart-total"><span>Total</span><span data-modal-cart-total>LKR 0.00</span></div>
        <div class="hero-actions">
          <a class="button-secondary" href="checkout.html">Checkout</a>
          <a class="button" href="shop.html">Continue Shopping</a>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  function openCart() {
    renderCartModal();
    document.querySelector("[data-cart-modal]")?.classList.add("is-open");
  }

  function closeCart() {
    document.querySelector("[data-cart-modal]")?.classList.remove("is-open");
  }

  function buyNow(name, price, image) {
    addToCart(name, price, image);
    window.location.href = "checkout.html";
  }

  function showToast(message) {
    let toast = document.querySelector("[data-toast]");
    if (!toast) {
      toast = document.createElement("div");
      toast.setAttribute("data-toast", "");
      toast.style.position = "fixed";
      toast.style.right = "18px";
      toast.style.bottom = "18px";
      toast.style.zIndex = "200";
      toast.style.background = "#354024";
      toast.style.color = "#fffaf1";
      toast.style.padding = "12px 16px";
      toast.style.borderRadius = "8px";
      toast.style.boxShadow = "0 14px 34px rgba(32,26,12,.22)";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove("hidden");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => toast.classList.add("hidden"), 2600);
  }

  function renderCheckoutSummary() {
    const summary = document.getElementById("checkoutSummary");
    if (!summary) return;

    const cart = getCart();
    const totals = cartTotals();
    if (!cart.length) {
      summary.innerHTML = `
        <h2>Your order</h2>
        <p>Your cart is empty. Add items from the shop before checkout.</p>
        <a class="button-secondary" href="shop.html">Go to Shop</a>
      `;
      return;
    }

    const rows = cart.map((item) => `
      <div class="summary-row">
        <span>${item.name} x ${item.qty}</span>
        <strong>${money(item.price * item.qty)}</strong>
      </div>
    `).join("");

    const discountRow = totals.discount ? `
      <div class="summary-row loyalty-discount">
        <span>${totals.offer.title} (${totals.offer.code})</span>
        <strong>-${money(totals.discount)}</strong>
      </div>
    ` : "";

    summary.innerHTML = `
      <h2>Your order</h2>
      ${rows}
      ${discountRow}
      <div class="summary-total"><span>Total</span><span>${money(totals.total)}</span></div>
      <button class="button-secondary" type="button" data-clear-cart>Clear Cart</button>
    `;
    renderMemberOffer();
  }

  function setupCheckout() {
    const form = document.getElementById("checkoutForm");
    if (!form) return;

    renderCheckoutSummary();
    const account = getSessionUser();
    if (account) {
      const name = document.getElementById("name");
      const email = document.getElementById("email");
      const phone = document.getElementById("contact");
      if (name) name.value = account.name || "";
      if (email) email.value = account.email || "";
      if (phone) phone.value = account.phone || "";
    }
    document.querySelectorAll('input[name="payment"]').forEach((radio) => {
      radio.addEventListener("change", () => {
        document.body.classList.toggle("card-payment", radio.value === "Card" && radio.checked);
      });
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const cart = getCart();
      const status = document.getElementById("checkoutSuccess");

      if (!cart.length) {
        showStatus(status, "Please add at least one product before placing an order.");
        return;
      }

      const data = Object.fromEntries(new FormData(form).entries());
      if (data.payment === "Card" && (!data.cardNumber || !data.expiry || !data.cvv)) {
        showStatus(status, "Please complete card details or choose cash on delivery.");
        return;
      }

      const orders = readJson(ORDER_KEY, []);
      const orderId = `MM-${Date.now().toString().slice(-6)}`;
      const totals = cartTotals();
      orders.push({
        id: orderId,
        customer: data,
        items: cart,
        subtotal: totals.subtotal,
        discount: totals.discount,
        offerCode: totals.offer?.code || null,
        total: totals.total,
        createdAt: new Date().toISOString()
      });
      writeJson(ORDER_KEY, orders);
      recordCustomerActivity("order");
      clearCart();
      form.reset();
      document.body.classList.remove("card-payment");
      const offerNote = totals.discount ? ` ${totals.offer.code} saved you ${money(totals.discount)}.` : "";
      showStatus(status, `Order ${orderId} placed successfully. We will contact you to confirm delivery.${offerNote}`);
    });
  }

  function populateSubServices(serviceName) {
    const subService = document.getElementById("sub-service");
    if (!subService) return;

    const options = serviceOptions[serviceName] || [];
    subService.innerHTML = '<option value="">Select sub-service</option>';
    options.forEach((option) => {
      const node = document.createElement("option");
      node.value = `${option.name} - ${money(option.price)}`;
      node.textContent = `${option.name} - ${money(option.price)}`;
      subService.appendChild(node);
    });
  }

  function setupBooking() {
    const form = document.getElementById("bookingForm");
    const service = document.getElementById("service");
    if (!form || !service) return;

    const requested = new URLSearchParams(window.location.search).get("service");
    if (requested && serviceOptions[requested]) {
      service.value = requested;
    }
    populateSubServices(service.value);

    const date = document.getElementById("date");
    if (date) {
      date.min = new Date().toISOString().split("T")[0];
    }

    const account = getSessionUser();
    if (account) {
      const name = document.getElementById("customerName");
      const email = document.getElementById("bookingEmail");
      const phone = document.getElementById("phone");
      if (name) name.value = account.name || "";
      if (email) email.value = account.email || "";
      if (phone) phone.value = account.phone || "";
    }

    service.addEventListener("change", () => populateSubServices(service.value));

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const bookings = readJson(BOOKING_KEY, []);
      const bookingId = `BK-${Date.now().toString().slice(-6)}`;
      const offer = loyaltyOffer();
      bookings.push({
        id: bookingId,
        details: Object.fromEntries(new FormData(form).entries()),
        offerCode: offer?.code || null,
        createdAt: new Date().toISOString()
      });
      writeJson(BOOKING_KEY, bookings);
      recordCustomerActivity("booking");
      form.reset();
      populateSubServices("");
      const offerNote = offer ? ` ${offer.code} has been reserved for this request.` : " Your next visit will unlock the returning-client offer.";
      showStatus(document.getElementById("bookingSuccess"), `Booking request ${bookingId} saved. We will call you to confirm.${offerNote}`);
    });
  }

  function showSubServices(service) {
    document.querySelectorAll(".service-panel").forEach((panel) => {
      panel.classList.toggle("is-visible", panel.dataset.servicePanel === service);
    });
    document.querySelector("[data-service-results]")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function setupContact() {
    const form = document.getElementById("contactForm");
    if (form) {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const messages = readJson(MESSAGE_KEY, []);
        messages.push({
          ...Object.fromEntries(new FormData(form).entries()),
          createdAt: new Date().toISOString()
        });
        writeJson(MESSAGE_KEY, messages);
        form.reset();
        showStatus(document.getElementById("contactSuccess"), "Message sent. We will reply as soon as possible.");
      });
    }

    const newsletter = document.getElementById("newsletterForm");
    if (newsletter) {
      newsletter.addEventListener("submit", (event) => {
        event.preventDefault();
        newsletter.reset();
        showStatus(document.getElementById("newsletterSuccess"), "You are subscribed to Mystric Mehandhi updates.");
      });
    }
  }

  function renderMemberOffer() {
    const account = getSessionUser();
    const host = document.querySelector("#bookingForm, #checkoutSummary, body[data-page='service2.html'] .page-hero .container");
    if (!account || !host || host.querySelector(".member-offer")) return;

    const offer = loyaltyOffer();
    const banner = document.createElement("aside");
    banner.className = "member-offer";
    const heroHost = host.closest(".page-hero");
    if (heroHost) banner.classList.add("is-hero-member-offer");

    const eyebrow = document.createElement("span");
    eyebrow.textContent = offer ? offer.title : "Mystric member access";

    const title = document.createElement("strong");
    title.textContent = offer ? `${offer.code} is active` : "Your first booking unlocks 10% off";

    const copy = document.createElement("p");
    copy.textContent = offer
      ? offer.description
      : "Complete a booking or product order, then your next visit receives the Returning Client Privilege.";

    banner.append(eyebrow, title, copy);
    if (heroHost) {
      host.appendChild(banner);
    } else {
      host.prepend(banner);
    }
  }

  function setupAuth() {
    const signup = document.getElementById("signupForm");
    const login = document.getElementById("loginForm");
    const forgot = document.getElementById("forgotForm");
    const reset = document.getElementById("resetForm");

    if (signup) {
      signup.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(signup).entries());
        const saved = getAccount();
        const status = document.getElementById("authStatus");
        if (saved && saved.email.toLowerCase() === data.email.toLowerCase()) {
          showStatus(status, "An account already exists for this email. Please login instead.");
          return;
        }
        if (data.password.length < 6) {
          showStatus(status, "Use at least 6 characters for your password.");
          return;
        }
        writeJson(USER_KEY, {
          ...data,
          bookingCount: 0,
          orderCount: 0,
          createdAt: new Date().toISOString()
        });
        signup.reset();
        showStatus(status, "Account created. Login to unlock services and booking.");
        setTimeout(() => {
          window.location.href = `login.html?next=${encodeURIComponent(getSafeNextPage())}`;
        }, 800);
      });
    }

    if (login) {
      login.addEventListener("submit", (event) => {
        event.preventDefault();
        const saved = getAccount();
        const data = Object.fromEntries(new FormData(login).entries());
        const status = document.getElementById("authStatus");
        if (!saved) {
          showStatus(status, "No account found. Create an account to access services.");
          return;
        }
        if (saved.email.toLowerCase() !== data.email.toLowerCase() || saved.password !== data.password) {
          showStatus(status, "Email or password does not match this account.");
          return;
        }
        startSession(saved);
        showStatus(status, "Login successful. Opening your member services...");
        setTimeout(() => {
          window.location.href = getSafeNextPage();
        }, 700);
      });
    }

    if (forgot) {
      forgot.addEventListener("submit", (event) => {
        event.preventDefault();
        showStatus(document.getElementById("authStatus"), "Reset link generated for this demo. Continue to reset password.");
      });
    }

    if (reset) {
      reset.addEventListener("submit", (event) => {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(reset).entries());
        if (data.password !== data.confirmPassword) {
          showStatus(document.getElementById("authStatus"), "Passwords do not match.");
          return;
        }
        const saved = readJson(USER_KEY, {});
        writeJson(USER_KEY, { ...saved, password: data.password });
        reset.reset();
        showStatus(document.getElementById("authStatus"), "Password updated. You can login now.");
      });
    }
  }

  function setupFaqs() {
    document.querySelectorAll(".faq-item button").forEach((button) => {
      button.addEventListener("click", () => {
        const item = button.closest(".faq-item");
        item.classList.toggle("is-open");
      });
    });
  }

  function setupGallery() {
    document.querySelectorAll("[data-gallery-filter]").forEach((button) => {
      button.addEventListener("click", () => {
        const filter = button.dataset.galleryFilter;
        document.querySelectorAll("[data-gallery-item]").forEach((item) => {
          item.classList.toggle("hidden", filter !== "all" && item.dataset.galleryItem !== filter);
        });
      });
    });
  }

  function setupSiteChrome() {
    const pageName = currentPageName();
    const account = getSessionUser();
    document.body.dataset.page = pageName;

    document.querySelectorAll(".brand:not(.signature-brand)").forEach((brand) => {
      const name = brand.querySelector("strong")?.textContent.trim() || "Mystric Mehandhi";
      const strapline = brand.closest(".auth-card") ? "Back to the studio" : "Bridal henna studio";
      brand.classList.add("signature-brand");
      brand.innerHTML = `<span class="brand-monogram" aria-hidden="true">MM</span><span class="brand-copy"><strong>${name}</strong><span>${strapline}</span></span>`;
    });

    document.querySelectorAll(".site-header").forEach((header) => {
      const nav = header.querySelector("nav");
      const actions = header.querySelector(".nav-actions");
      const cart = actions?.querySelector("[data-open-cart]");

      if (nav) {
        const links = [
          ["index.html", "Home"],
          ["service2.html", "Services"],
          ["shop.html", "Shop"],
          ["gallerynew.html", "Gallery"],
          ["about.html", "About"],
          ["contactl.html", "Contact"],
          ["faqsnew.html", "FAQs"]
        ];
        nav.innerHTML = `<ul class="nav-links">${links.map(([href, label]) => {
          const active = href === pageName ? ' aria-current="page"' : "";
          return `<li><a href="${href}"${active}>${label}</a></li>`;
        }).join("")}</ul>`;
      }

      if (cart?.classList.contains("icon-button")) {
        cart.classList.remove("icon-button");
        cart.classList.add("cart-button");
      }

      actions?.querySelector(".header-booking")?.remove();

      if (nav && actions && !actions.querySelector(".nav-toggle")) {
        const navToggle = document.createElement("button");
        navToggle.type = "button";
        navToggle.className = "nav-toggle";
        navToggle.dataset.navToggle = "";
        navToggle.setAttribute("aria-label", "Open navigation");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.title = "Navigation";
        navToggle.innerHTML = '<span></span><span></span><span></span>';
        actions.insertBefore(navToggle, actions.firstChild);
      }

      if (actions && !actions.querySelector(".profile-control")) {
        const profile = document.createElement("div");
        profile.className = "profile-control";

        const toggle = document.createElement("button");
        toggle.type = "button";
        toggle.className = "profile-trigger";
        toggle.dataset.profileToggle = "";
        toggle.setAttribute("aria-expanded", "false");
        toggle.setAttribute("aria-label", account ? "Open member profile" : "Open member login options");
        toggle.title = account ? "Member profile" : "Member login";

        const avatar = document.createElement("span");
        avatar.className = "profile-avatar";
        avatar.textContent = account ? profileInitials(account.name) : "U";
        toggle.appendChild(avatar);

        const menu = document.createElement("div");
        menu.className = "profile-menu";

        const title = document.createElement("strong");
        title.textContent = account ? account.name || "Mystric member" : "Member access";

        const copy = document.createElement("p");
        copy.textContent = account
          ? loyaltyOffer()?.description || "Complete your first booking or order to unlock 10% off next time."
          : "Login or create an account to unlock services and booking.";

        const action = document.createElement(account ? "button" : "a");
        action.className = "profile-menu-action";
        action.textContent = account ? "Log out" : "Login / Register";
        if (account) {
          action.type = "button";
          action.dataset.logout = "";
        } else {
          action.href = "login.html?next=service2.html";
        }

        menu.append(title, copy, action);
        profile.append(toggle, menu);
        cart ? actions.insertBefore(profile, cart) : actions.appendChild(profile);
      }
    });

    const footer = document.querySelector(".site-footer");
    if (footer && !footer.querySelector(".footer-grid")) {
      footer.classList.add("signature-footer");
      footer.innerHTML = `
        <div class="container">
          <div class="footer-grid">
            <div><h3>Mystric Mehandhi</h3><p>Bespoke henna art for weddings, celebrations and everyday moments.</p></div>
            <div><h4>Explore</h4><div class="footer-links"><a href="service2.html">Services</a><a href="shop.html">Shop</a><a href="gallerynew.html">Gallery</a><a href="book.html">Book now</a></div></div>
            <div><h4>Visit the studio</h4><p>Kandy, Digana</p><p>0778580861</p><p>rahmashafee0430@gmail.com</p></div>
          </div>
          <div class="footer-bottom">&copy; 2026 Mystric Mehandhi. All rights reserved.</div>
        </div>`;
    }
  }

  function setupRevealAnimations() {
    const items = document.querySelectorAll("[data-reveal]");
    if (!items.length) return;

    if (document.body.dataset.page === "index.html") {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    if (!("IntersectionObserver" in window)) {
      items.forEach((item) => item.classList.add("is-visible"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12 });

    items.forEach((item) => observer.observe(item));
  }

  function setupSearch() {
    document.querySelectorAll("[data-site-search]").forEach((form) => {
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        const query = new FormData(form).get("q").toLowerCase().trim();
        const routes = [
          { keys: ["shop", "cone", "powder", "kit", "balm", "sealant"], page: "shop.html" },
          { keys: ["book", "appointment", "bridal", "party", "simple"], page: "book.html" },
          { keys: ["gallery", "arabic", "gulf", "design"], page: "gallerynew.html" },
          { keys: ["contact", "phone", "location", "email"], page: "contactl.html" },
          { keys: ["faq", "question", "aftercare"], page: "faqsnew.html" },
          { keys: ["about", "rahma", "story"], page: "about.html" }
        ];
        const match = routes.find((route) => route.keys.some((key) => query.includes(key)));
        window.location.href = match ? match.page : "service2.html";
      });
    });
  }

  function showStatus(node, message) {
    if (!node) return;
    node.textContent = message;
    node.classList.add("is-visible");
    node.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  document.addEventListener("click", (event) => {
    const open = event.target.closest("[data-open-cart]");
    const close = event.target.closest("[data-close-cart]");
    const modal = event.target.matches("[data-cart-modal]");
    const remove = event.target.closest("[data-remove-cart]");
    const plus = event.target.closest("[data-qty-plus]");
    const minus = event.target.closest("[data-qty-minus]");
    const clear = event.target.closest("[data-clear-cart]");
    const service = event.target.closest("[data-show-service]");
    const logout = event.target.closest("[data-logout]");
    const profileToggle = event.target.closest("[data-profile-toggle]");
    const navToggle = event.target.closest("[data-nav-toggle]");

    if (!event.target.closest(".profile-control")) {
      document.querySelectorAll(".profile-control.is-open").forEach((control) => {
        control.classList.remove("is-open");
        control.querySelector("[data-profile-toggle]")?.setAttribute("aria-expanded", "false");
      });
    }

    if (logout) {
      endSession();
      window.location.href = "index.html";
      return;
    }
    if (navToggle) {
      const header = navToggle.closest(".site-header");
      const open = !header.classList.contains("nav-open");
      header.classList.toggle("nav-open", open);
      navToggle.setAttribute("aria-expanded", String(open));
      navToggle.setAttribute("aria-label", open ? "Close navigation" : "Open navigation");
      return;
    }
    if (profileToggle) {
      const control = profileToggle.closest(".profile-control");
      const open = !control.classList.contains("is-open");
      document.querySelectorAll(".profile-control.is-open").forEach((item) => item.classList.remove("is-open"));
      control.classList.toggle("is-open", open);
      profileToggle.setAttribute("aria-expanded", String(open));
      return;
    }
    if (open) openCart();
    if (close || modal) closeCart();
    if (remove) removeFromCart(remove.dataset.removeCart);
    if (plus) changeCartQty(plus.dataset.qtyPlus, 1);
    if (minus) changeCartQty(minus.dataset.qtyMinus, -1);
    if (clear) clearCart();
    if (service) showSubServices(service.dataset.showService);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    document.querySelectorAll(".profile-control.is-open").forEach((control) => {
      control.classList.remove("is-open");
      control.querySelector("[data-profile-toggle]")?.setAttribute("aria-expanded", "false");
    });
    document.querySelectorAll(".site-header.nav-open").forEach((header) => {
      header.classList.remove("nav-open");
      header.querySelector("[data-nav-toggle]")?.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    if (guardProtectedPage()) return;
    setupSiteChrome();
    ensureCartModal();
    updateCartBadges();
    renderCartModal();
    renderCheckoutSummary();
    setupCheckout();
    setupBooking();
    renderMemberOffer();
    setupContact();
    setupAuth();
    setupFaqs();
    setupGallery();
    setupSearch();
    setupRevealAnimations();
  });

  window.addToCart = addToCart;
  window.buyNow = buyNow;
  window.viewCart = openCart;
  window.closeCart = closeCart;
  window.removeFromCart = removeFromCart;
  window.showSubServices = showSubServices;
})();
