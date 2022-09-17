export const load = (path: string) => fetch(path).then((res) => res.text());
