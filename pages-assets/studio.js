(() => {
  "use strict";
  const filters = document.querySelectorAll("[data-filter]");
  const tiles = document.querySelectorAll(".product-tile");
  filters.forEach((button) =>
    button.addEventListener("click", () => {
      filters.forEach((item) =>
        item.setAttribute("aria-pressed", String(item === button)),
      );
      let count = 0;
      tiles.forEach((tile) => {
        tile.hidden =
          button.dataset.filter !== "all" &&
          tile.dataset.category !== button.dataset.filter;
        if (!tile.hidden) {
          count++;
          window.PrintFlowMotion?.enter(tile);
        }
      });
      document.querySelector("#filter-status").textContent =
        `${count} print services shown.`;
    }),
  );
  const productDialog = document.querySelector("#product-dialog");
  document.querySelectorAll(".product-open").forEach((button) =>
    button.addEventListener("click", () => {
      const tile = button.closest(".product-tile");
      document.querySelector("#product-dialog-title").textContent =
        button.querySelector("strong").textContent;
      document.querySelector("#product-dialog-description").textContent =
        tile.querySelector(".product-description").textContent;
      const image = document.querySelector("#product-dialog-image");
      image.src = button.querySelector("img").src;
      image.alt = button.querySelector("img").alt;
      productDialog.showModal();
      window.PrintFlowMotion?.enter(productDialog);
    }),
  );
  document.querySelectorAll("dialog").forEach((dialog) => {
    dialog
      .querySelector(".dialog-close")
      .addEventListener("click", () => dialog.close());
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) {
        const bounds = dialog.getBoundingClientRect();
        if (
          event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom
        )
          dialog.close();
      }
    });
  });
  const accountDialog = document.querySelector("#account-dialog");
  document
    .querySelector("#account-preview-link")
    .addEventListener("click", () => accountDialog.close());
  let appUrl;
  try {
    const configured = new URL(window.HIGP_CONFIG?.appUrl);
    if (
      configured.protocol === "https:" &&
      !configured.username &&
      !configured.password &&
      configured.pathname === "/" &&
      !configured.search &&
      !configured.hash
    )
      appUrl = configured.origin;
  } catch {
    /* Do not present a fake login before the backend is connected. */
  }
  document.querySelectorAll(".portal-trigger").forEach((button) =>
    button.addEventListener("click", () => {
      if (appUrl)
        window.location.assign(
          appUrl +
            (button.dataset.portal === "register" ? "/register" : "/login"),
        );
      else {
        accountDialog.showModal();
        window.PrintFlowMotion?.enter(accountDialog);
      }
    }),
  );
})();
