
document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("productGrid");
  const filters = document.getElementById("filters");
  const search = document.getElementById("searchInput");
  const waNumber = "573504272105";

  let products = [];
  let active = "Todas";
  let query = "";
  let selectedProduct = null;

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[c]);

  const formatPrice = (price) => {
    if (price === null || price === undefined || price === "") {
      return "Precio por consultar";
    }

    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0
    }).format(price);
  };

  const toast = (message) => {
    const t = document.getElementById("toast");
    if (!t) return;

    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
  };

  // Cargar productos directamente desde Supabase
  const loadProducts = async () => {
    try {
      const db = window.callegoldDB;

      if (!db) {
        throw new Error("No se encontró la conexión con Supabase.");
      }

      const { data, error } = await db
        .from("products")
        .select(`
          id,
          name,
          description,
          reference,
          price,
          image_url,
          is_active,
          stock,
          categories(name)
        `)
        .eq("is_active", true)
        .order("reference", { ascending: true });

      if (error) throw error;

      products = data.map((p) => {
        const reference = String(p.reference || "").trim();

        return {
          id: Number(reference) || reference,
          name: p.name,
          description: p.description || "",
          category: p.categories?.name || "Sin categoría",
          image: p.image_url
            ? new URL(p.image_url, window.location.href).href
            : "",
          price: p.price,
          stock: p.stock,
          active: p.is_active
        };
      });

      window.CALLEGOLD_PRODUCTS = products;

      console.log("Productos cargados desde Supabase:", products.length);

    } catch (error) {
      console.error("Error cargando productos:", error);
      toast("No fue posible cargar el catálogo.");
      products = window.CALLEGOLD_PRODUCTS || [];
    }
  };

  const modal = document.getElementById("productModal");
  const modalImg = document.getElementById("modalProductImage");
  const modalName = document.getElementById("modalProductName");
  const modalDesc = document.getElementById("modalProductDescription");
  const modalRef = document.getElementById("modalProductRef");
  const modalCategory = document.getElementById("modalProductCategory");
  const modalWhatsApp = document.getElementById("modalWhatsApp");

  const openProduct = (p) => {
    selectedProduct = p;

    if (!modal) return;

    modalImg.src = p.image;
    modalImg.alt = p.name;
    modalName.textContent = p.name;
    modalDesc.textContent = p.description;
    modalRef.textContent = "REF. " + String(p.id).padStart(2, "0");
    modalCategory.textContent = p.category.toUpperCase();

    const message =
      "Hola Callegold, estoy interesado(a) en esta joya:\n\n" +
      "Producto: " + p.name + "\n" +
      "Referencia: " + String(p.id).padStart(2, "0") + "\n" +
      "Descripción: " + p.description + "\n" +
      "Precio: " + formatPrice(p.price) + "\n\n" +
      "¿Me pueden confirmar la disponibilidad?";

    modalWhatsApp.href =
      "https://wa.me/" + waNumber + "?text=" +
      encodeURIComponent(message);

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeProduct = () => {
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  document.getElementById("modalClose")?.addEventListener("click", closeProduct);

  modal?.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeProduct);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProduct();
  });

  document.getElementById("modalAddCart")?.addEventListener("click", () => {
    if (!selectedProduct) return;

    window.CallegoldCart.add(selectedProduct.id);
    toast("Añadido a tu selección");
  });

  const getCategories = () => [
    "Todas",
    ...new Set(products.map((p) => p.category))
  ];

  const renderFilters = () => {
    const categories = getCategories();

    filters.innerHTML = categories.map((category) => `
      <button
        class="filter ${active === category ? "active" : ""}"
        data-cat="${esc(category)}">
        ${esc(category)}
      </button>
    `).join("");

    filters.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        active = button.dataset.cat;
        renderFilters();
        render();
      });
    });
  };

  const render = () => {
    const list = products.filter((p) => {
      const matchesCategory =
        active === "Todas" || p.category === active;

      const text = `${p.name} ${p.description} ${p.category} ${p.id}`
        .toLowerCase();

      return matchesCategory && text.includes(query.toLowerCase());
    });

    document.getElementById("resultsCount").textContent =
      `${list.length} ${list.length === 1 ? "pieza" : "piezas"}`;

    document.getElementById("emptyState").hidden = list.length > 0;

    grid.innerHTML = list.map((p) => `
      <article class="card">
        <button
          class="product-card-open"
          data-product="${esc(p.id)}"
          aria-label="Ver detalles de ${esc(p.name)}">

          <div class="photo">
            <img
              loading="lazy"
              src="${esc(p.image)}"
              alt="${esc(p.name)}">

            <span class="ref">
              REF. ${String(p.id).padStart(2, "0")}
            </span>

            <span class="view-product">Ver detalles ↗</span>
          </div>

          <div class="info">
            <p class="category">${esc(p.category)}</p>
            <h3>${esc(p.name)}</h3>
            <p class="description">${esc(p.description)}</p>
            <p class="price">${formatPrice(p.price)}</p>
          </div>
        </button>

        <button class="add" data-add="${esc(p.id)}">
          ＋ Añadir a mi selección
        </button>
      </article>
    `).join("");

    grid.querySelectorAll("[data-product]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = products.find(
          (p) => String(p.id) === button.dataset.product
        );

        if (product) openProduct(product);
      });
    });

    grid.querySelectorAll("[data-add]").forEach((button) => {
      button.addEventListener("click", () => {
        window.CallegoldCart.add(button.dataset.add);
        toast("Añadido a tu selección");
      });
    });
  };

  // Carrito
  const drawer = document.getElementById("drawer");
  const shade = document.getElementById("shade");

  const openCart = () => {
    drawer.classList.add("open");
    shade.classList.add("open");
  };

  const closeCart = () => {
    drawer.classList.remove("open");
    shade.classList.remove("open");
  };

  document.getElementById("cartOpen")?.addEventListener("click", openCart);
  document.getElementById("cartClose")?.addEventListener("click", closeCart);
  shade?.addEventListener("click", closeCart);

  document.getElementById("clearCart")?.addEventListener("click", () => {
    window.CallegoldCart.clear();
    toast("Selección vaciada");
  });

  document.getElementById("checkout")?.addEventListener("click", () => {
    const message = window.CallegoldCart.message();

    if (!message) {
      toast("Añade productos primero");
      return;
    }

    window.open(
      "https://wa.me/" + waNumber + "?text=" +
      encodeURIComponent(message),
      "_blank",
      "noopener"
    );
  });

  // Buscador y navegación
  search?.addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });

  const nav = document.getElementById("nav");

  document.getElementById("menuToggle")?.addEventListener("click", () => {
    nav.classList.toggle("open");
  });

  nav?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => nav.classList.remove("open"));
  });

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();

  // Inicializar catálogo
  await loadProducts();
  renderFilters();
  render();

  if (window.CallegoldCart) {
    window.CallegoldCart.render();
  }
});
