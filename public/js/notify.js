// Simple global notification banner helper (non-module, attaches to window)
(function () {
  function getBanner() {
    return document.getElementById("globalBanner");
  }

  function positionBanner(banner) {
    const nav = document.getElementById("navbar-root");
    if (nav) {
      const rect = nav.getBoundingClientRect();
      banner.style.top = rect.height + "px";
    } else {
      banner.style.top = "0px";
    }
  }

  window.showBanner = function (msg) {
    const banner = getBanner();
    if (!banner) return alert(msg);
    positionBanner(banner);
    banner.innerHTML = `<div class="msg">${msg}</div><button class="close" aria-label="Fechar">X</button>`;
    banner.classList.remove("hidden");
    const btn = banner.querySelector(".close");
    if (btn) {
      btn.addEventListener("click", () => {
        banner.classList.add("hidden");
        banner.style.top = "";
      });
    }
  };

  window.hideBanner = function () {
    const banner = getBanner();
    if (!banner) return;
    banner.classList.add("hidden");
    banner.style.top = "";
  };
})();
