export function useRouter() {
  return {
    refresh() {},
    push() {},
    replace() {},
  };
}

export function usePathname() {
  return "/";
}

export function useSearchParams() {
  return new URLSearchParams();
}

export function redirect(path: string): never {
  throw new Error(`redirect(${path}) is not available in this export.`);
}
