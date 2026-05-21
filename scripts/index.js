document.addEventListener("DOMContentLoaded", () => {
    const body = document.body;
    const themeToggle = document.getElementById("theme-toggle");
    const sidebarThemeToggle = document.getElementById("sidebar-theme-toggle");
    const searchInput = document.getElementById("search-input");
    const toolCards = document.querySelectorAll(".tool-card");

    function syncThemeToggles(isDark) {
        if (themeToggle) {
            themeToggle.checked = isDark;
        }

        if (sidebarThemeToggle) {
            sidebarThemeToggle.checked = isDark;
        }
    }

    function setTheme(theme) {
        const isDark = theme === "dark";

        body.classList.toggle("dark-mode", isDark);
        body.classList.toggle("light-mode", !isDark);
        syncThemeToggles(isDark);
        localStorage.setItem("theme", isDark ? "dark" : "light");
    }

    if (themeToggle) {
        themeToggle.addEventListener("change", () => {
            setTheme(themeToggle.checked ? "dark" : "light");
        });
    }

    if (sidebarThemeToggle) {
        sidebarThemeToggle.addEventListener("change", () => {
            setTheme(sidebarThemeToggle.checked ? "dark" : "light");
        });
    }

    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
    } else {
        setTheme("light");
    }

    if (searchInput && toolCards.length > 0) {
        searchInput.addEventListener("input", () => {
            const filter = searchInput.value.toLowerCase().trim();

            toolCards.forEach((card) => {
                const text = card.textContent.toLowerCase();
                card.style.display = text.includes(filter) ? "" : "none";
            });
        });
    }

    function handleScrollAnimation() {
        const cards = document.querySelectorAll(".tool-card");

        cards.forEach((card, index) => {
            card.style.setProperty("--card-index", index);
            card.classList.add("scroll-reveal");
        });

        if (typeof IntersectionObserver === "undefined") {
            cards.forEach((card) => card.classList.add("visible"));
            return;
        }

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll(".scroll-reveal").forEach((element) => {
            observer.observe(element);
        });
    }

    function handleCardMouseEffects() {
        const cards = document.querySelectorAll(".tool-card");

        cards.forEach((card) => {
            card.addEventListener("mousemove", (e) => {
                const rect = card.getBoundingClientRect();
                const x = ((e.clientX - rect.left) / card.clientWidth) * 100;
                const y = ((e.clientY - rect.top) / card.clientHeight) * 100;

                card.style.setProperty("--mouse-x", `${x}%`);
                card.style.setProperty("--mouse-y", `${y}%`);

                const rotateY = ((e.clientX - rect.left) / rect.width - 0.5) * 10;
                const rotateX = ((e.clientY - rect.top) / rect.height - 0.5) * -10;

                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-15px)`;
            });

            card.addEventListener("mouseleave", () => {
                card.style.transform = "translateY(0) perspective(1000px)";
                setTimeout(() => {
                    card.style.setProperty("--mouse-x", "50%");
                    card.style.setProperty("--mouse-y", "50%");
                }, 100);
            });
        });
    }

    handleScrollAnimation();
    handleCardMouseEffects();
});
