export function redirectSystemPath({
  path,
  initial,
}: { path: string; initial: boolean }) {
  if (path === "") {
    return "/";
  }
  return path;
}
