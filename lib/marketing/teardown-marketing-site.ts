/** Remove dc-runtime mount artifacts so the marketing shell can boot again after client nav away (e.g. back from /dashboard). */
export function teardownMarketingSite() {
  document.querySelectorAll("script[data-dc-script]").forEach((node) => node.remove());
  document.getElementById("marketing-site-root")?.remove();
  document.querySelectorAll("#dc-root").forEach((node) => {
    node.remove();
  });
  document.querySelectorAll("x-dc").forEach((node) => {
    node.remove();
  });
  delete window.__marketingApi;
}
