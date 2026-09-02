document.addEventListener("DOMContentLoaded", () => {
  const links = document.querySelectorAll('a[href^="tel:"]');
  links.forEach((link) => {
    link.setAttribute("aria-label", "Chiama ora");
  });

  const navLinks = document.querySelectorAll(".nav-pill");
  const mobileNavLinks = document.querySelectorAll(".mobile-nav-link");
  const sections = [...document.querySelectorAll("main section[id]")];
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileMenu = document.querySelector(".mobile-menu");
  const menuClose = document.querySelector(".menu-close");
  const compactTitles = document.querySelectorAll(".header-compact-title");
  const themeToggles = document.querySelectorAll(".theme-toggle");

  const setTheme = (isDark) => {
    document.body.classList.toggle("dark-mode", isDark);
    themeToggles.forEach((toggle) => {
      const icon = toggle.querySelector(".theme-icon");
      const label = toggle.querySelector(".theme-label");
      icon.textContent = isDark ? "light_mode" : "dark_mode";
      toggle.setAttribute("aria-label", isDark ? "Attiva modalità chiara" : "Attiva modalità scura");
      toggle.setAttribute("aria-pressed", String(!isDark));
      if (label) label.textContent = isDark ? "Modalità chiara" : "Modalità scura";
    });
    compactTitles.forEach((title) => {
      title.style.color = isDark ? "#fff" : "#000";
    });
    localStorage.setItem("sgomberi-theme", isDark ? "dark" : "light");
  };

  const savedTheme = localStorage.getItem("sgomberi-theme");
  setTheme(savedTheme !== "light");
  themeToggles.forEach((toggle) => {
    toggle.addEventListener("click", () => setTheme(!document.body.classList.contains("dark-mode")));
  });

  const setActiveLink = (id) => {
    [...navLinks, ...mobileNavLinks].forEach((link) => {
      const isActive = link.getAttribute("href") === `#${id}`;
      link.classList.toggle("active", isActive);
    });
  };

  const setMenuOpen = (isOpen) => {
    if (!menuToggle || !mobileMenu) return;
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    mobileMenu.setAttribute("aria-hidden", String(!isOpen));
    mobileMenu.inert = !isOpen;
    document.body.classList.toggle("menu-open", isOpen);
    if (isOpen) menuClose?.focus();
    else menuToggle.focus();
  };

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetId = link.getAttribute("href")?.replace("#", "");
      if (targetId) {
        setActiveLink(targetId);
      }
    });
  });

  mobileNavLinks.forEach((link) => {
    link.addEventListener("click", () => {
      const targetId = link.getAttribute("href")?.replace("#", "");
      if (targetId) setActiveLink(targetId);
      setMenuOpen(false);
    });
  });

  menuToggle?.addEventListener("click", () => {
    setMenuOpen(menuToggle.getAttribute("aria-expanded") !== "true");
  });
  menuClose?.addEventListener("click", () => setMenuOpen(false));
  mobileMenu?.addEventListener("click", (event) => {
    if (event.target === mobileMenu) setMenuOpen(false);
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuToggle?.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
    }
  });

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("motion-ready");

  if (!prefersReducedMotion) {
    const revealItems = document.querySelectorAll(
      ".section-heading, .feature-item, .review-card, .service-list > div, .offer-inner, .contact-box, .contact-panel"
    );
    const revealObserver = new IntersectionObserver(
      (entries, observerInstance) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-revealed");
          observerInstance.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.08 }
    );
    revealItems.forEach((item) => revealObserver.observe(item));

    let scrollFrame = null;
    let lastScrollY = window.scrollY;
    let headerState = "expanded";
    const compactAt = 72;
    const expandDelta = 4;

    const setHeaderState = (nextState) => {
      if (headerState === nextState) return;
      headerState = nextState;
      document.documentElement.dataset.headerState = nextState;
    };

    const updateScrollMotion = () => {
      scrollFrame = null;
      const currentScrollY = window.scrollY;
      const delta = currentScrollY - lastScrollY;
      const scrollingDown = delta > 2;
      const scrollingUp = delta < -expandDelta;

      if (!document.body.classList.contains("menu-open")) {
        if (currentScrollY <= 1 || scrollingUp) {
          setHeaderState("expanded");
        } else if (scrollingDown && currentScrollY >= compactAt) {
          setHeaderState("compact");
        }
      }
      document.documentElement.style.setProperty("--scroll-y", `${Math.min(currentScrollY * 0.06, 34)}px`);
      lastScrollY = currentScrollY;
    };
    document.documentElement.dataset.headerState = headerState;
    window.addEventListener("scroll", () => {
      if (scrollFrame === null) scrollFrame = requestAnimationFrame(updateScrollMotion);
    }, { passive: true });
    updateScrollMotion();
  }

  const contactForm = document.querySelector("#contact-form");
  const photoInput = document.querySelector("#contact-photos");
  const photoPreview = document.querySelector("#photo-preview");
  const formStatus = document.querySelector("#form-status");

  photoInput?.addEventListener("change", () => {
    if (!photoPreview) return;
    photoPreview.replaceChildren();
    [...(photoInput.files || [])].forEach((file) => {
      const image = document.createElement("img");
      image.src = URL.createObjectURL(file);
      image.alt = file.name;
      photoPreview.append(image);
    });
  });

  contactForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!contactForm.reportValidity()) return;

    const formData = new FormData(contactForm);
    const photos = [...(photoInput?.files || [])];
    const lines = [
      "Ciao, vorrei un preventivo per uno sgombero.",
      "",
      `Nome: ${formData.get("name")}`,
      `Telefono: ${formData.get("phone")}`,
    ];

    lines.push(`Spazio: ${formData.get("space") || "Non specificato"}`);
    lines.push(`Piano/ascensore: ${formData.get("access") || "Non specificato"}`);
    lines.push(`Quantita: ${formData.get("quantity") || "Non specificata"}`);
    lines.push(`Tempistica: ${formData.get("timing") || "Da concordare"}`);

    lines.push(`Descrizione: ${formData.get("description")}`);
    if (photos.length) {
      lines.push(`Foto selezionate: ${photos.map((file) => file.name).join(", ")}`);
    }

    const message = lines.join("\n");
    const whatsappUrl = `https://wa.me/393459359445?text=${encodeURIComponent(message)}`;

    try {
      if (photos.length && navigator.share && navigator.canShare?.({ files: photos })) {
        await navigator.share({ title: "Richiesta Sgomberi Catania", text: message, files: photos });
        if (formStatus) formStatus.textContent = "Condivisione pronta: scegli WhatsApp per inviare testo e foto.";
        return;
      }
    } catch (error) {
      if (error.name === "AbortError") return;
    }

    window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    if (formStatus) {
      formStatus.textContent = photos.length
        ? "WhatsApp è pronto. Aggiungi le foto selezionate nella chat prima di inviare."
        : "WhatsApp è pronto con il messaggio compilato.";
    }
  });

  const observer = new IntersectionObserver(
    (entries) => {
      const visibleEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visibleEntry) {
        setActiveLink(visibleEntry.target.id);
      }
    },
    {
      rootMargin: "-25% 0px -55% 0px",
      threshold: [0.2, 0.5, 0.8],
    }
  );

  sections.forEach((section) => observer.observe(section));

});
