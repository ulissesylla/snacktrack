class Breadcrumbs {
  constructor(containerEl) {
    this.container = containerEl;
    this.key = "snacktrack:breadcrumbs";
    this.items = this.load() || [];
  }

  add(item) {
    // item: { title, route }
    this.items.push(item);
    this.save();
  }

  remove(index) {
    this.items.splice(index, 1);
    this.save();
  }

  clear() {
    this.items = [];
    this.save();
  }

  save() {
    try {
      localStorage.setItem(this.key, JSON.stringify(this.items));
    } catch (e) {
      /* ignore */
    }
  }

  load() {
    try {
      return JSON.parse(localStorage.getItem(this.key) || "[]");
    } catch (e) {
      return [];
    }
  }

  render() {
    if (!this.container) return;
    this.container.innerHTML = "";
    if (!this.items.length) {
      this.container.textContent = "Início";
      return;
    }

    this.items.forEach((it, idx) => {
      const a = document.createElement("a");
      a.href = "#";
      a.textContent = it.title;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        // navigate to this route and remove deeper crumbs
        this.items = this.items.slice(0, idx + 1);
        this.save();
        this.render();
        window.dispatchEvent(
          new CustomEvent("breadcrumb:navigate", {
            detail: { route: it.route },
          })
        );
      });
      this.container.appendChild(a);
      if (idx < this.items.length - 1) {
        const sep = document.createTextNode(" › ");
        this.container.appendChild(sep);
      }
    });
  }
}

// Export for classic script usage
if (typeof window !== "undefined") window.Breadcrumbs = Breadcrumbs;
