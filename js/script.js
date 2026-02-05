document.addEventListener("DOMContentLoaded", function () {
  initNavigation();
  initHeaderScroll();
  initReservationCalculator();
  initMenuFilter();
  initContactForm();
  initSmoothScroll();
  setMinDates();
  initCarousel();
});

function initCarousel() {
  const track = document.querySelector(".carousel-track");
  const slides = document.querySelectorAll(".carousel-slide");
  const prevBtn = document.querySelector(".carousel-btn-prev");
  const nextBtn = document.querySelector(".carousel-btn-next");
  const dotsContainer = document.querySelector(".carousel-dots");

  if (!track || slides.length === 0) return;

  let currentIndex = 0;
  const totalSlides = slides.length;

  // dots for the carousel
  slides.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.classList.add("carousel-dot");
    dot.setAttribute("aria-label", `Go to slide ${index + 1}`);
    if (index === 0) dot.classList.add("active");
    dot.addEventListener("click", () => goToSlide(index));
    dotsContainer.appendChild(dot);
  });

  const dots = document.querySelectorAll(".carousel-dot");

  function updateCarousel() {
    track.style.transform = `translateX(-${currentIndex * 100}%)`;

    // update dots
    dots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentIndex);
    });
  }

  function goToSlide(index) {
    currentIndex = index;
    if (currentIndex < 0) currentIndex = totalSlides - 1;
    if (currentIndex >= totalSlides) currentIndex = 0;
    updateCarousel();
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  if (prevBtn) prevBtn.addEventListener("click", prevSlide);
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);

  // keyboard support
  document.addEventListener("keydown", (e) => {
    if (e.target.closest(".carousel")) {
      if (e.key === "ArrowLeft") prevSlide();
      if (e.key === "ArrowRight") nextSlide();
    }
  });

  // touch support
  let touchStartX = 0;
  let touchEndX = 0;

  track.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
    },
    { passive: true },
  );

  track.addEventListener(
    "touchend",
    (e) => {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    },
    { passive: true },
  );

  function handleSwipe() {
    const swipeThreshold = 50;
    const diff = touchStartX - touchEndX;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  }

  let autoPlayInterval = setInterval(nextSlide, 5000);

  track.addEventListener("mouseenter", () => {
    clearInterval(autoPlayInterval);
  });

  track.addEventListener("mouseleave", () => {
    autoPlayInterval = setInterval(nextSlide, 5000);
  });
}

function initNavigation() {
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  if (!navToggle || !navMenu) return;

  navToggle.addEventListener("click", function () {
    const isExpanded = navToggle.getAttribute("aria-expanded") === "true";

    navToggle.classList.toggle("active");
    navMenu.classList.toggle("active");
    navToggle.setAttribute("aria-expanded", !isExpanded);
  });

  const navLinks = navMenu.querySelectorAll(".nav-link");
  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      navToggle.classList.remove("active");
      navMenu.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  document.addEventListener("click", function (event) {
    if (!navToggle.contains(event.target) && !navMenu.contains(event.target)) {
      navToggle.classList.remove("active");
      navMenu.classList.remove("active");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

function initHeaderScroll() {
  const header = document.getElementById("header");

  if (!header) return;

  let lastScrollY = window.scrollY;

  window.addEventListener("scroll", function () {
    const currentScrollY = window.scrollY;

    if (currentScrollY > 50) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }

    lastScrollY = currentScrollY;
  });
}

function initReservationCalculator() {
  const calculateBtn = document.getElementById("calculateBtn");
  const calculatorResult = document.getElementById("calculatorResult");

  if (!calculateBtn || !calculatorResult) return;

  const PRICING = {
    baseNightlyRate: 1200,
    weekendSurcharge: 300,
    extraGuestRate: 150,

    seasons: {
      low: { months: [1, 2, 3, 11, 12], multiplier: 0.85 }, // Winter
      mid: { months: [4, 10], multiplier: 1.0 }, // Spring / Fall
      high: { months: [5, 6, 7, 8, 9], multiplier: 1.25 }, // Summer
    },

    extras: {
      bbq: { name: "Set Grătar Premium", price: 200 },
      bike: { name: "Închiriere Biciclete", pricePerDay: 100 },
      breakfast: { name: "Mic Dejun Tradițional", pricePerPerson: 150 },
      latecheckout: { name: "Check-out Tardiv", price: 250 },
    },

    minNights: 1,
  };

  calculateBtn.addEventListener("click", function () {
    calculatePrice(PRICING);
  });

  const calculatorForm = document.getElementById("calculatorForm");
  if (calculatorForm) {
    calculatorForm.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        event.preventDefault();
        calculatePrice(PRICING);
      }
    });
  }

  function calculatePrice(pricing) {
    const checkInInput = document.getElementById("checkIn");
    const checkOutInput = document.getElementById("checkOut");
    const guestsInput = document.getElementById("guests");

    const checkInDate = new Date(checkInInput.value);
    const checkOutDate = new Date(checkOutInput.value);
    const guests = parseInt(guestsInput.value);

    if (!checkInInput.value || !checkOutInput.value) {
      showCalculatorError(
        "Vă rugăm să selectați datele de check-in și check-out.",
      );
      return;
    }

    if (checkOutDate <= checkInDate) {
      showCalculatorError(
        "Data de check-out trebuie să fie după data de check-in.",
      );
      return;
    }

    const timeDiff = checkOutDate.getTime() - checkInDate.getTime();
    const nights = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

    if (nights < pricing.minNights) {
      showCalculatorError(
        "Rezervarea minimă este de " + pricing.minNights + " noapte.",
      );
      return;
    }

    let totalNightlyRate = 0;
    const currentDate = new Date(checkInDate);

    for (let i = 0; i < nights; i++) {
      let nightRate = pricing.baseNightlyRate;
      const month = currentDate.getMonth() + 1;
      const dayOfWeek = currentDate.getDay();

      let seasonMultiplier = 1.0;
      for (const season in pricing.seasons) {
        if (pricing.seasons[season].months.includes(month)) {
          seasonMultiplier = pricing.seasons[season].multiplier;
          break;
        }
      }
      nightRate *= seasonMultiplier;

      // On weekends, we have a surcharge (friday and saturday, excluding sunday since its not a working day)
      if (dayOfWeek === 5 || dayOfWeek === 6) {
        nightRate += pricing.weekendSurcharge;
      }

      totalNightlyRate += nightRate;
      currentDate.setDate(currentDate.getDate() + 1);
    }

    let extraGuestCharge = 0;
    if (guests > 2) {
      extraGuestCharge = (guests - 2) * pricing.extraGuestRate * nights;
    }

    let extrasTotal = 0;
    let extrasBreakdownText = [];

    const extraBbq = document.getElementById("extraBbq");
    const extraBike = document.getElementById("extraBike");
    const extraBreakfast = document.getElementById("extraBreakfast");
    const extraLateCheckout = document.getElementById("extraLateCheckout");

    if (extraBbq && extraBbq.checked) {
      extrasTotal += pricing.extras.bbq.price;
      extrasBreakdownText.push(
        pricing.extras.bbq.name + ": " + pricing.extras.bbq.price + " MDL",
      );
    }

    if (extraBike && extraBike.checked) {
      const bikeTotal = pricing.extras.bike.pricePerDay * nights;
      extrasTotal += bikeTotal;
      extrasBreakdownText.push(
        pricing.extras.bike.name +
          ": " +
          bikeTotal +
          " MDL (" +
          nights +
          " zile)",
      );
    }

    if (extraBreakfast && extraBreakfast.checked) {
      const breakfastTotal =
        pricing.extras.breakfast.pricePerPerson * guests * nights;
      extrasTotal += breakfastTotal;
      extrasBreakdownText.push(
        pricing.extras.breakfast.name +
          ": " +
          breakfastTotal +
          " MDL (" +
          guests +
          " pers. × " +
          nights +
          " zile)",
      );
    }

    if (extraLateCheckout && extraLateCheckout.checked) {
      extrasTotal += pricing.extras.latecheckout.price;
      extrasBreakdownText.push(
        pricing.extras.latecheckout.name +
          ": " +
          pricing.extras.latecheckout.price +
          " MDL",
      );
    }

    const subtotal = totalNightlyRate + extraGuestCharge + extrasTotal;
    const averageNightlyRate = Math.round(totalNightlyRate / nights);
    const total = Math.round(subtotal);

    displayCalculatorResult(
      nights,
      averageNightlyRate,
      total,
      extrasBreakdownText,
      extraGuestCharge,
    );
  }

  function displayCalculatorResult(
    nights,
    nightlyRate,
    total,
    extrasBreakdown,
    extraGuestCharge,
  ) {
    const resultDiv = document.getElementById("calculatorResult");
    const totalPriceEl = document.getElementById("totalPrice");
    const nightsCountEl = document.getElementById("nightsCount");
    const nightlyRateEl = document.getElementById("nightlyRate");
    const extrasBreakdownEl = document.getElementById("extrasBreakdown");

    if (totalPriceEl) totalPriceEl.textContent = formatPrice(total) + " MDL";
    if (nightsCountEl) nightsCountEl.textContent = nights;
    if (nightlyRateEl) nightlyRateEl.textContent = formatPrice(nightlyRate);

    if (extrasBreakdownEl) {
      let breakdownHtml = "";
      if (extraGuestCharge > 0) {
        breakdownHtml +=
          "+ Oaspeți suplimentari: " +
          formatPrice(extraGuestCharge) +
          " MDL<br>";
      }
      if (extrasBreakdown.length > 0) {
        breakdownHtml += "+ " + extrasBreakdown.join("<br>+ ");
      }
      extrasBreakdownEl.innerHTML = breakdownHtml;
    }

    resultDiv.style.display = "block";
    resultDiv.scrollIntoView({ behavior: "smooth", block: "center" });

    resultDiv.classList.remove("fade-in");
    void resultDiv.offsetWidth;
    resultDiv.classList.add("fade-in");
  }

  function showCalculatorError(message) {
    const resultDiv = document.getElementById("calculatorResult");
    const totalPriceEl = document.getElementById("totalPrice");
    const nightsCountEl = document.getElementById("nightsCount");
    const nightlyRateEl = document.getElementById("nightlyRate");
    const extrasBreakdownEl = document.getElementById("extrasBreakdown");

    if (totalPriceEl) totalPriceEl.textContent = "---";
    if (nightsCountEl) nightsCountEl.textContent = "0";
    if (nightlyRateEl) nightlyRateEl.textContent = "0";
    if (extrasBreakdownEl) extrasBreakdownEl.textContent = message;

    resultDiv.style.display = "block";

    resultDiv.style.background =
      "linear-gradient(135deg, #dc3545 0%, #c82333 100%)";

    setTimeout(function () {
      resultDiv.style.background = "";
    }, 3000);
  }

  function formatPrice(price) {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
}

function setMinDates() {
  const checkInInput = document.getElementById("checkIn");
  const checkOutInput = document.getElementById("checkOut");

  if (!checkInInput || !checkOutInput) return;

  const today = new Date();
  const todayStr = today.toISOString().split("T")[0];
  checkInInput.setAttribute("min", todayStr);

  checkInInput.addEventListener("change", function () {
    const checkInDate = new Date(checkInInput.value);
    checkInDate.setDate(checkInDate.getDate() + 1);
    const minCheckOut = checkInDate.toISOString().split("T")[0];
    checkOutInput.setAttribute("min", minCheckOut);

    if (checkOutInput.value && checkOutInput.value < minCheckOut) {
      checkOutInput.value = "";
    }
  });
}

function initMenuFilter() {
  const categoryButtons = document.querySelectorAll(".menu-category-btn");
  const menuItems = document.querySelectorAll(".menu-item");

  if (categoryButtons.length === 0 || menuItems.length === 0) return;

  categoryButtons.forEach(function (button) {
    button.addEventListener("click", function () {
      const category = this.getAttribute("data-category");

      categoryButtons.forEach(function (btn) {
        btn.classList.remove("active");
      });
      this.classList.add("active");

      menuItems.forEach(function (item) {
        const itemCategory = item.getAttribute("data-category");

        if (category === "all" || itemCategory === category) {
          item.style.display = "flex";
          item.style.opacity = "0";
          setTimeout(function () {
            item.style.opacity = "1";
          }, 50);
        } else {
          item.style.display = "none";
        }
      });
    });
  });
}

function initContactForm() {
  const contactForm = document.getElementById("contactForm");

  if (!contactForm) return;

  contactForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim();
    const message = document.getElementById("message").value.trim();

    if (!name || !email || !message) {
      showFormMessage(
        "Vă rugăm să completați toate câmpurile obligatorii.",
        "error",
      );
      return;
    }

    if (!isValidEmail(email)) {
      showFormMessage(
        "Vă rugăm să introduceți o adresă de email validă.",
        "error",
      );
      return;
    }

    showFormMessage(
      "Mulțumim! Mesajul dvs. a fost trimis cu succes. Vă vom contacta în curând.",
      "success",
    );
    contactForm.reset();
  });

  function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  function showFormMessage(message, type) {
    const existingMessage = contactForm.querySelector(".form-message");
    if (existingMessage) {
      existingMessage.remove();
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = "form-message";
    messageDiv.textContent = message;

    messageDiv.style.padding = "1rem";
    messageDiv.style.marginTop = "1rem";
    messageDiv.style.borderRadius = "8px";
    messageDiv.style.textAlign = "center";
    messageDiv.style.fontWeight = "500";

    if (type === "success") {
      messageDiv.style.backgroundColor = "#d4edda";
      messageDiv.style.color = "#155724";
      messageDiv.style.border = "1px solid #c3e6cb";
    } else {
      messageDiv.style.backgroundColor = "#f8d7da";
      messageDiv.style.color = "#721c24";
      messageDiv.style.border = "1px solid #f5c6cb";
    }

    contactForm.appendChild(messageDiv);

    setTimeout(function () {
      messageDiv.remove();
    }, 5000);
  }
}

function initSmoothScroll() {
  const anchorLinks = document.querySelectorAll('a[href^="#"]');

  anchorLinks.forEach(function (link) {
    link.addEventListener("click", function (event) {
      const targetId = this.getAttribute("href");

      if (targetId === "#") return;

      const targetElement = document.querySelector(targetId);

      if (targetElement) {
        event.preventDefault();

        const headerHeight =
          document.getElementById("header").offsetHeight || 70;
        const targetPosition =
          targetElement.getBoundingClientRect().top +
          window.pageYOffset -
          headerHeight;

        window.scrollTo({
          top: targetPosition,
          behavior: "smooth",
        });
      }
    });
  });
}


function initLazyLoading() {
  const images = document.querySelectorAll('img[loading="lazy"]');

  if ("IntersectionObserver" in window) {
    const imageObserver = new IntersectionObserver(function (
      entries,
      observer,
    ) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          const image = entry.target;
          image.classList.add("loaded");
          observer.unobserve(image);
        }
      });
    });

    images.forEach(function (img) {
      imageObserver.observe(img);
    });
  }
}

document.addEventListener("DOMContentLoaded", initLazyLoading);
