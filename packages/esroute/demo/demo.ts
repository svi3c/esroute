import { createRouter } from "../src/index";

const router = createRouter({
  routes: {
    "": ({}, next) => next ?? import("./_index.html?raw"),
    foo: () => import("./foo.html?raw"),
  },
});

router.onResolve(({ value }) => {
  document.body.innerHTML = value.default;
});

router.init();
