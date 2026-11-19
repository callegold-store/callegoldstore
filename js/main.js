
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

  // Formato de precios en pesos colombianos
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

  // Cargar productos desde Supabase
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

      console.log(
        "Productos cargados desde Supabase:",
        products.length
      );

    } catch (error) {
      console.error("Error cargando productos:", error);
      toast("No fue posible cargar el catálogo.");

      products = window.CALLEGOLD_PRODUCTS || [];
    }
  };

  // Elementos de la ventana de detalles
  const modal = document.getElementById("productModal");
  const modalImg = document.getElementById("modalProductImage");
  const modalName = document.getElementById("modalProductName");
  const modalDesc = document.getElementById("modalProductDescription");
  const modalRef = document.getElementById("modalProductRef");
  const modalCategory = document.getElementById("modalProductCategory");
  const modalWhatsApp = document.getElementById("modalWhatsApp");

  // Elemento que muestra el precio en la ventana de detalles
  const modalPrice = modal?.querySelector(".modal-price");

  // Abrir detalles del producto
  const openProduct = (p) => {
    selectedProduct = p;

    if (!modal) return;

    modalImg.src = p.image;
    modalImg.alt = p.name;
    modalName.textContent = p.name;
    modalDesc.textContent = p.description;

    modalRef.textContent =
      "REF. " + String(p.id).padStart(2, "0");

    modalCategory.textContent = p.category.toUpperCase();

    // Mostrar el precio actualizado desde Supabase
    if (modalPrice) {
      modalPrice.textContent = formatPrice(p.price);
    }

    const message =
      "Hola Callegold, estoy interesado(a) en esta joya:\n\n" +
      "Producto: " + p.name + "\n" +
      "Referencia: " + String(p.id).padStart(2, "0") + "\n" +
      "Descripción: " + p.description + "\n" +
      "Precio: " + formatPrice(p.price) + "\n\n" +
      "¿Me pueden confirmar la disponibilidad?";

    modalWhatsApp.href =
      "https://wa.me/" + waNumber +
      "?text=" + encodeURIComponent(message);

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  // Cerrar detalles
  const closeProduct = () => {
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  document.getElementById("modalClose")
    ?.addEventListener("click", closeProduct);

  modal?.querySelectorAll("[data-modal-close]").forEach((el) => {
    el.addEventListener("click", closeProduct);
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeProduct();
  });

  // Agregar producto al carrito
  document.getElementById("modalAddCart")
    ?.addEventListener("click", () => {
      if (!selectedProduct) return;

      window.CallegoldCart.add(selectedProduct.id);
      toast("Añadido a tu selección");
    });

  // Categorías
  const categoryOrder = ["Anillos","Manillas","Pulseras","Collares","Aretes","Cadenas","Dijes","Relojes","Otros"];
  const categoryForProduct = product => {
    const category = String(product.category || "");
    if (/anill/i.test(category)) return "Anillos";
    if (/manill|pulser/i.test(category)) return "Manillas";
    if (/collar/i.test(category)) return "Collares";
    if (/aret|topo/i.test(category)) return "Aretes";
    if (/cadena/i.test(category)) return "Cadenas";
    if (/dije/i.test(category)) return "Dijes";
    if (/reloj/i.test(category)) return "Relojes";
    return "Otros";
  };
  const getCategories = () => {
    const groups = new Set(products.map(categoryForProduct));
    return ["Todas", ...categoryOrder.filter(category => groups.has(category))];
  };

  const renderFilters = () => {
    const categories = getCategories();

    const counts = products.reduce((acc, product) => {
      const key = categoryForProduct(product);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});
    filters.innerHTML = categories.map((category) => {
      const count = category === "Todas" ? products.length : (counts[category] || 0);
      return `
        <button class="filter ${active === category ? "active" : ""}"
          data-cat="${esc(category)}" aria-pressed="${active === category}">
          <span>${esc(category)}</span><span class="filter-count">${count}</span>
        </button>`;
    }).join("");

    filters.querySelectorAll("button").forEach((button) => {
      button.addEventListener("click", () => {
        active = button.dataset.cat;
        renderFilters();
        render();
      });
    });
  };

  // Mostrar catálogo
  const render = () => {
    const list = products.filter((p) => {
      const matchesCategory =
        active === "Todas" || categoryForProduct(p) === active;

      const text =
        `${p.name} ${p.description} ${p.category} ${p.id}`
          .toLowerCase();

      return matchesCategory &&
        text.includes(query.toLowerCase());
    });

    document.getElementById("resultsCount").textContent =
      `${list.length} ${list.length === 1 ? "pieza" : "piezas"}`;

    document.getElementById("emptyState").hidden =
      list.length > 0;

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

            <span class="view-product">
              Ver detalles ↗
            </span>

          </div>

          <div class="info">

            <p class="category">
              ${esc(p.category)}
            </p>

            <h3>${esc(p.name)}</h3>

            <p class="description">
              ${esc(p.description)}
            </p>

            <p class="price">
              ${formatPrice(p.price)}
            </p>

          </div>

        </button>

        <button class="add" data-add="${esc(p.id)}">
          ＋ Añadir a mi selección
        </button>

      </article>
    `).join("");

    // Eventos para abrir los detalles
    grid.querySelectorAll("[data-product]").forEach((button) => {
      button.addEventListener("click", () => {
        const product = products.find(
          (p) => String(p.id) === button.dataset.product
        );

        if (product) openProduct(product);
      });
    });

    // Eventos para agregar al carrito
    grid.querySelectorAll("[data-add]").forEach((button) => {
      button.addEventListener("click", () => {
        window.CallegoldCart.add(button.dataset.add);
        toast("Añadido a tu selección");
      });
    });
  };

  // Carrito de compras
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

  document.getElementById("cartOpen")
    ?.addEventListener("click", openCart);

  document.getElementById("cartClose")
    ?.addEventListener("click", closeCart);

  shade?.addEventListener("click", closeCart);

  document.getElementById("clearCart")
    ?.addEventListener("click", () => {
      window.CallegoldCart.clear();
      toast("Selección vaciada");
    });

  document.getElementById("checkout")
    ?.addEventListener("click", () => {
      const message = window.CallegoldCart.message();

      if (!message) {
        toast("Añade productos primero");
        return;
      }

      window.open(
        "https://wa.me/" + waNumber +
        "?text=" + encodeURIComponent(message),
        "_blank",
        "noopener"
      );
    });

  // Buscador
  search?.addEventListener("input", (e) => {
    query = e.target.value;
    render();
  });

  // Menú de navegación
  const nav = document.getElementById("nav");

  document.getElementById("menuToggle")
    ?.addEventListener("click", () => {
      nav.classList.toggle("open");
    });

  nav?.querySelectorAll("a").forEach((a) => {
    a.addEventListener("click", () => {
      nav.classList.remove("open");
    });
  });

  // Año del pie de página
  const year = document.getElementById("year");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

  // Inicializar catálogo
  await loadProducts();

  renderFilters();
  render();

  if (window.CallegoldCart) {
    window.CallegoldCart.render();
  }
});
