
document.addEventListener("DOMContentLoaded", async () => {
  let products = [];
  let active = "Todas";
  let query = "";
  let selectedProduct = null;

  const grid = document.getElementById("productGrid");
  const filters = document.getElementById("filters");
  const search = document.getElementById("searchInput");
  const waNumber = "573504272105";

  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[c]));

  const toast = message => {
    const t = document.getElementById("toast");
    if (!t) return;
    t.textContent = message;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 2000);
  };

  // Obtener productos y categorías desde Supabase
  const loadProducts = async () => {
    try {
      if (!window.callegoldDB) {
        throw new Error("No se ha inicializado Supabase.");
      }

      const { data: categoriesData, error: categoriesError } =
        await window.callegoldDB
          .from("categories")
          .select("id, name");

      if (categoriesError) throw categoriesError;

      const { data: productsData, error: productsError } =
        await window.callegoldDB
          .from("products")
          .select("id, name, description, reference, price, image_url, category_id, is_active, stock")
          .eq("is_active", true)
          .order("reference", { ascending: true });

      if (productsError) throw productsError;

      products = (productsData || []).map(p => {
        const category = (categoriesData || []).find(
          c => c.id === p.category_id
        );

        return {
          id: Number(p.reference),
          dbId: p.id,
          name: p.name,
          description: p.description || "",
          category: category?.name || "Sin categoría",
          image: p.image_url
            ? new URL(p.image_url, window.location.href).href
            : "",
          price: p.price,
          stock: p.stock
        };
      }).filter(p => Number.isFinite(p.id));

      renderFilters();
      render();

      console.log("Productos cargados desde Supabase:", products.length);
    } catch (error) {
      console.error("Error cargando productos:", error);
      grid.innerHTML = "";
      document.getElementById("resultsCount").textContent = "Error al cargar";
      document.getElementById("emptyState").hidden = false;
      toast("No se pudieron cargar las joyas.");
    }
  };

  const modal = document.getElementById("productModal");
  const modalImg = document.getElementById("modalProductImage");
  const modalName = document.getElementById("modalProductName");
  const modalDesc = document.getElementById("modalProductDescription");
  const modalRef = document.getElementById("modalProductRef");
  const modalCategory = document.getElementById("modalProductCategory");
  const modalWhatsApp = document.getElementById("modalWhatsApp");

  const openProduct = p => {
    selectedProduct = p;
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
      "Descripción: " + p.description +
      "\n\n¿Me pueden confirmar el precio y la disponibilidad?";

    modalWhatsApp.href =
      "https://wa.me/" + waNumber + "?text=" +
      encodeURIComponent(message);

    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
  };

  const closeProduct = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
  };

  document.getElementById("modalClose").addEventListener("click", closeProduct);

  modal.querySelectorAll("[data-modal-close]").forEach(el => {
    el.addEventListener("click", closeProduct);
  });

  document.addEventListener("keydown", e => {
    if (e.key === "Escape") closeProduct();
  });

  document.getElementById("modalAddCart").addEventListener("click", () => {
    if (!selectedProduct) return;
    CallegoldCart.add(selectedProduct.id);
    toast("Añadido a tu selección");
  });

  const renderFilters = () => {
    const categories = [
      "Todas",
      ...new Set(products.map(p => p.category))
    ];

    filters.innerHTML = categories.map(c =>
      `<button class="filter ${active === c ? "active" : ""}" data-cat="${esc(c)}">${esc(c)}</button>`
    ).join("");

    filters.querySelectorAll("button").forEach(b => {
      b.onclick = () => {
        active = b.dataset.cat;
        renderFilters();
        render();
      };
    });
  };

  const render = () => {
    const list = products.filter(p =>
      (active === "Todas" || p.category === active) &&
      `${p.name} ${p.description} ${p.category} ${p.id}`
        .toLowerCase()
        .includes(query.toLowerCase())
    );

    document.getElementById("resultsCount").textContent =
      `${list.length} ${list.length === 1 ? "pieza" : "piezas"}`;

    document.getElementById("emptyState").hidden = !!list.length;

    grid.innerHTML = list.map(p => `
      <article class="card">
        <button class="product-card-open"
          data-product="${p.id}"
          aria-label="Ver detalles de ${esc(p.name)}">
          <div class="photo">
            <img loading="lazy" src="${esc(p.image)}" alt="${esc(p.name)}">
            <span class="ref">REF. ${String(p.id).padStart(2, "0")}</span>
            <span class="view-product">Ver detalles ↗</span>
          </div>
          <div class="info">
            <p class="category">${esc(p.category)}</p>
            <h3>${esc(p.name)}</h3>
            <p class="description">${esc(p.description)}</p>
            <p class="price">Precio por consultar</p>
          </div>
        </button>
        <button class="add" data-add="${p.id}">
          ＋ Añadir a mi selección
        </button>
      </article>
    `).join("");

    grid.querySelectorAll("[data-product]").forEach(b => {
      b.addEventListener("click", () => {
        const p = products.find(x => x.id === Number(b.dataset.product));
        if (p) openProduct(p);
      });
    });

    grid.querySelectorAll("[data-add]").forEach(b => {
      b.addEventListener("click", () => {
        CallegoldCart.add(Number(b.dataset.add));
        toast("Añadido a tu selección");
      });
    });
  };

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

  document.getElementById("cartOpen").onclick = openCart;
  document.getElementById("cartClose").onclick = closeCart;
  shade.onclick = closeCart;

  document.getElementById("clearCart").onclick = () => {
    CallegoldCart.clear();
    toast("Selección vaciada");
  };

  document.getElementById("checkout").onclick = () => {
    const msg = CallegoldCart.message();

    if (!msg) {
      toast("Añade productos primero");
      return;
    }

    window.open(
      "https://wa.me/" + waNumber + "?text=" + encodeURIComponent(msg),
      "_blank",
      "noopener"
    );
  };

  search.oninput = e => {
    query = e.target.value;
    render();
  };

  const nav = document.getElementById("nav");

  document.getElementById("menuToggle").onclick = () => {
    nav.classList.toggle("open");
  };

  nav.querySelectorAll("a").forEach(a => {
    a.onclick = () => nav.classList.remove("open");
  });

  document.getElementById("year").textContent =
    new Date().getFullYear();

  await loadProducts();
  CallegoldCart.render();
});
