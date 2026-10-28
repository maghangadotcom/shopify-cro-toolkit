/* Section-only progressive enhancement. No credentials or analytics.
 * Shopify remains authoritative. Never auto-retry an uncertain POST.
 */
(() => {
  if (customElements.get('cro-purchase-controller')) return;
  class CroPurchaseController extends HTMLElement {
    connectedCallback() {
      const section = this.parentElement;
      const form = section.querySelector('.cro-product__form');
      if (!form) return;
      this.cleanup = new AbortController();
      const { signal } = this.cleanup;
      const plan = form.querySelector('[data-cro-plan]');
      const submit = form.querySelector('[data-cro-submit]');
      const status = form.querySelector('[data-cro-status]');
      let available = !submit.disabled;
      let pending = false;
      const updatePrice = () => {
        const option = plan.selectedOptions[0];
        const price = form.querySelector('[data-cro-price]');
        const charge = form.querySelector('[data-cro-charge]');
        price.textContent = option?.dataset.priceLabel || 'Unavailable';
        charge.textContent = option?.dataset.chargeLabel || 'No purchase option is available for this variant.';
        price.hidden = false;
        charge.hidden = false;
        submit.disabled = pending || !available || !option;
        submit.textContent = pending ? 'Adding…' : available && option ? 'Add to cart' : 'Sold out';
      };
      plan.addEventListener('change', updatePrice, { signal });
      section.querySelectorAll('[data-cro-variant]').forEach((link) => {
        link.addEventListener('click', (event) => {
          if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
          const options = section.querySelector(`template[data-cro-options="${link.dataset.variantId}"]`);
          if (!options) return;
          event.preventDefault();
          if (pending) return;
          const previousPlan = plan.value;
          plan.replaceChildren(options.content.cloneNode(true));
          if ([...plan.options].some((option) => option.value === previousPlan)) plan.value = previousPlan;
          form.querySelector('[data-cro-variant-input]').value = link.dataset.variantId;
          available = link.dataset.available === 'true';
          section.querySelectorAll('[data-cro-variant]').forEach((item) => item.removeAttribute('aria-current'));
          link.setAttribute('aria-current', 'true');
          status.textContent = available ? 'Variant selected. Review the purchase option and price.' : 'This variant is sold out.';
          updatePrice();
        }, { signal });
      });
      // With no Shopify route context, preserve the native POST fallback.
      if (typeof window.Shopify?.routes?.root === 'string') {
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (pending || !form.reportValidity() || submit.disabled) return;
          const body = new FormData(form);
          if (!body.get('selling_plan')) body.delete('selling_plan');
          pending = true;
          status.textContent = 'Adding your selection…';
          form.setAttribute('aria-busy', 'true');
          const controls = [...form.querySelectorAll('select, input[type="number"]')];
          controls.forEach((control) => { control.disabled = true; });
          updatePrice();
          this.request = new AbortController();
          try {
            const response = await fetch(window.Shopify.routes.root + 'cart/add.js', {
              method: 'POST', headers: { Accept: 'application/json' }, body, signal: this.request.signal,
            });
            const result = await response.json();
            if (!response.ok) {
              status.textContent = typeof result.description === 'string' ? result.description : 'Shopify could not add this selection. Review your cart before trying again.';
              return;
            }
            status.textContent = 'Added to your cart. Use View cart to review your items and subscription terms.';
            section.dispatchEvent(new CustomEvent('cro:cart-added', { bubbles: true, detail: { item: result } }));
          } catch {
            if (this.isConnected) status.textContent = 'The request could not be confirmed. Check View cart before trying again to avoid adding the item twice.';
          } finally {
            pending = false;
            if (this.isConnected) {
              controls.forEach((control) => { control.disabled = false; });
              form.removeAttribute('aria-busy');
              updatePrice();
            }
          }
        }, { signal });
      }
      updatePrice();
    }
    disconnectedCallback() { this.cleanup?.abort(); this.request?.abort(); }
  }
  customElements.define('cro-purchase-controller', CroPurchaseController);
  const initialize = (root) => root.querySelectorAll('[data-cro-product]').forEach((section) => {
    if (!section.querySelector('cro-purchase-controller')) section.append(document.createElement('cro-purchase-controller'));
  });
  initialize(document);
  document.addEventListener('shopify:section:load', (event) => initialize(event.target));
})();
