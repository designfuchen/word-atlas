import { useSyncExternalStore } from "react";
import { transition } from "./motion";

export type Route =
  | { page: "today" }
  | { page: "atlas"; topic?: string; level?: string; q?: string; view?: string }
  | { page: "learn" }
  | { page: "practice" }
  | { page: "poetry"; id?: string; learn?: boolean; poem?: string; q?: string; form?: string; stage?: string; theme?: string; level?: string; status?: string; view?: string }
  | { page: "me" }
  | { page: "about" };

export interface Location {
  route: Route;
  /** Word sheet open on top of the route. */
  word: string | null;
}

function parse(hash: string): Location {
  const [path, query = ""] = hash.replace(/^#/, "").split("?");
  const params = new URLSearchParams(query);
  const word = params.get("w");
  const seg = path.split("/").filter(Boolean);
  let route: Route = { page: "today" };
  if (seg[0] === "atlas")
    route = { page: "atlas", topic: params.get("topic") || undefined, level: params.get("level") || undefined, q: params.get("q") || undefined, view: params.get("view") || undefined };
  else if (seg[0] === "learn") route = { page: "learn" };
  else if (seg[0] === "practice") route = { page: "practice" };
  else if (seg[0] === "poetry" && seg[1] === "learn") route = { page: "poetry", learn: true, poem: params.get("p") || undefined };
  else if (seg[0] === "poetry")
    route = {
      page: "poetry",
      id: seg[1] ? decodeURIComponent(seg[1]) : undefined,
      q: params.get("q") || undefined,
      form: params.get("form") || undefined,
      stage: params.get("stage") || undefined,
      theme: params.get("theme") || undefined,
      level: params.get("level") || undefined,
      status: params.get("status") || undefined,
      view: params.get("view") || undefined,
    };
  else if (seg[0] === "me") route = { page: "me" };
  else if (seg[0] === "about") route = { page: "about" };
  else if (seg[0] === "w" && seg[1]) return { route: { page: "atlas" }, word: decodeURIComponent(seg[1]) };
  return { route, word };
}

export function href(route: Route, word?: string | null) {
  const params = new URLSearchParams();
  if (route.page === "atlas") {
    if (route.topic) params.set("topic", route.topic);
    if (route.level) params.set("level", route.level);
    if (route.q) params.set("q", route.q);
    if (route.view) params.set("view", route.view);
  }
  if (word) params.set("w", word);
  if (route.page === "poetry" && route.learn && route.poem) params.set("p", route.poem);
  if (route.page === "poetry" && !route.learn && !route.id)
    for (const k of ["q", "form", "stage", "theme", "level", "status", "view"] as const) if (route[k]) params.set(k, route[k]!);
  const q = params.toString();
  const path = route.page === "today" ? "" : route.page === "poetry" && route.learn ? "poetry/learn" : route.page === "poetry" && route.id ? `poetry/${encodeURIComponent(route.id)}` : route.page;
  return `#/${path}${q ? `?${q}` : ""}`;
}

let loc = parse(location.hash);
const subs = new Set<() => void>();
window.addEventListener("hashchange", () => {
  const next = parse(location.hash);
  const pageChange = next.route.page !== loc.route.page;
  const update = () => {
    loc = next;
    subs.forEach((f) => f());
  };
  // Crossfade between pages; the word sheet animates on its own.
  if (pageChange && !next.word) transition(update);
  else update();
});

export const useLocation = () =>
  useSyncExternalStore(
    (f) => {
      subs.add(f);
      return () => subs.delete(f);
    },
    () => loc,
  );

export function go(route: Route, word?: string | null, replace = false) {
  const h = href(route, word);
  if (replace) history.replaceState(null, "", h);
  else history.pushState(null, "", h);
  const next = parse(h);
  const pageChange = next.route.page !== loc.route.page;
  const update = () => {
    loc = next;
    subs.forEach((f) => f());
  };
  if (pageChange && !replace) transition(update);
  else update();
}

export const openWord = (id: string) => go(loc.route, id);
export const closeWord = () => go(loc.route, null);
export const currentLocation = () => loc;
