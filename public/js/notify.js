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

  // Enhanced showBanner to support different message types while maintaining backward compatibility
  window.showBanner = function (msg, type = 'error') { // Default to 'error' to maintain backward compatibility
    const banner = getBanner();
    if (!banner) return alert(msg);
    positionBanner(banner);
    
    // Set appropriate class based on message type
    let bannerClass = 'banner ';
    if (type === 'success') {
      bannerClass += 'banner-success';
    } else if (type === 'warning') {
      bannerClass += 'banner-warning';
    } else if (type === 'info') {
      bannerClass += 'banner-info';
    } else {
      bannerClass += 'banner-error'; // default for backward compatibility
    }
    
    banner.className = bannerClass;
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

  // Helper functions for different message types (optional - for convenience)
  window.showSuccessBanner = function (msg) {
    showBanner(msg, 'success');
  };
  
  window.showErrorBanner = function (msg) {
    showBanner(msg, 'error');
  };
  
  window.showWarningBanner = function (msg) {
    showBanner(msg, 'warning');
  };
  
  window.showInfoBanner = function (msg) {
    showBanner(msg, 'info');
  };

  window.hideBanner = function () {
    const banner = getBanner();
    if (!banner) return;
    banner.classList.add("hidden");
    banner.style.top = "";
  };
})();
