import { test, expect } from "bun:test";
import { c, render, componentModules } from "./index.js";
import { styleText } from "@jondotsoy/style-text";

test("should render a simple text", () => {
  expect(render(componentModules.createElement("text", "hola"))).toEqual(
    "hola",
  );
});

test("should render a multiple texts", () => {
  expect(
    render(
      componentModules.createElement("div", [
        componentModules.createElement("text", "text 1"),
        componentModules.createElement("text", "text 2"),
      ]),
    ),
  ).toEqual("text 1\ntext 2");
});

test("should render a long text formatted and split the long", () => {
  expect(
    render(
      componentModules.createElement(
        "text",
        `Lorem ipsum ${styleText(["bold", "blue"], `dolor`)} sit ${styleText("red", "amet, consectetur")} adipiscing elit`,
      ),
      { width: 25 },
    ),
  ).toEqual(
    "Lorem ipsum \u001B[1m\u001B[34mdolor\u001B[39m\u001B[22m sit \u001B[31mame\u001B[39m\n\u001B[31mt, consectetur\u001B[39m adipiscing\n elit",
  );
});

test("should render a long text formatted and splitted", () => {
  expect(
    render(
      componentModules.createElement(
        "text",
        `Lorem ipsum ${styleText(["bold", "blue"], `dolor`)}\nsit ${styleText("red", "amet, consectetur")} adipiscing elit`,
      ),
      { width: 30 },
    ),
  ).toEqual(
    "Lorem ipsum \u001B[1m\u001B[34mdolor\u001B[39m\u001B[22m\nsit \u001B[31mamet, consectetur\u001B[39m adipisci\nng elit",
  );
});

test("should render a columns component with a long text formatted", () => {
  const draw = render(
    componentModules.createElement("columns", { columns: 3 }, [
      componentModules.createElement("text", `Lorem ipsum dolor`),
      componentModules.createElement(
        "text",
        `Lorem ipsum dolor sit ${styleText("red", "amet, consectetur")} adipiscing elit`,
      ),
      componentModules.createElement(
        "text",
        `Lorem ipsum ${styleText(["bold", "blue"], `dolor`)} sit ${styleText("red", "amet, consectetur")} adipiscing elit`,
      ),
    ]),
    { width: 80 },
  );
  expect(draw).toMatchSnapshot();
});

test("should render a columns component with a specific size per column", () => {
  const draw = render(
    componentModules.createElement(
      "columns",
      { columns: 3, columnsTemplate: [{ width: 10 }] },
      [
        componentModules.createElement("text", `Lorem ipsum dolor`),
        componentModules.createElement(
          "text",
          `Lorem ipsum dolor sit ${styleText("red", "amet, consectetur")} adipiscing elit. Lorem ipsum ${styleText(["bold", "blue"], `dolor`)} sit ${styleText("red", "amet, consectetur")} adipiscing elit`,
        ),
        componentModules.createElement(
          "text",
          `Lorem ipsum dolor sit ${styleText("red", "amet, consectetur")} adipiscing elit. Lorem ipsum ${styleText(["bold", "blue"], `dolor`)} sit ${styleText("red", "amet, consectetur")} adipiscing elit`,
        ),
      ],
    ),
    { width: 80 },
  );

  expect(draw).toMatchSnapshot();
});

test("should render a simple text with color", () => {
  expect(
    render(
      componentModules.createElement(
        "text",
        {},
        `${styleText("red", "hola")} mundo`,
      ),
    ),
  ).toEqual("\u001B[31mhola\u001B[39m mundo");
});

test("should render a simple text but clean the text style", () => {
  expect(
    render(
      componentModules.createElement(
        "text",
        {
          colors: false,
        },
        `${styleText("red", "hola")} mundo`,
      ),
    ),
  ).toEqual("hola mundo");
});

test("should render a div with border", () => {
  expect(
    render(c("div", { border: {} }, c("text", "hola")), { width: 40 }),
  ).toMatchSnapshot();
});
test("should render a div with border with format on border", () => {
  expect(
    render(c("div", { border: { format: ["blue"] } }, c("text", "hola")), {
      width: 40,
    }),
  ).toMatchSnapshot();
});

test("should render a div with border and padding", () => {
  expect(
    render(c("div", { border: { padding: 1 } }, c("text", "hola")), {
      width: 40,
    }),
  ).toMatchSnapshot();
});

test("should render a div with border and columns", () => {
  const newLocal = render(
    c(
      "div",
      { border: { padding: 1, theme: "thick" } },
      c("columns", { columns: 2 }, [
        c("text", `${styleText("red", "hola")}`),
        c("text", "hola"),
      ]),
    ),
    {
      width: 40,
    },
  );

  expect(newLocal).toMatchSnapshot();
});

test("should make a visual matrix of a text with width 5", () => {
  const visualMatrix = c("text", "hello").getVisualMatrix({});

  expect(visualMatrix.width).toEqual(5);
});

test("should make a visual matrix of a text with style with width 5", () => {
  const visualMatrix = c(
    "text",
    `${styleText(["red", "bold"], "hello")}\nA/${styleText(["red", "bold"], "T")}`,
  ).getVisualMatrix({});

  expect(visualMatrix.width).toEqual(5);
});

test("should make a visual matrix with div, columns and text elements", () => {
  const visualMatrix = c(
    "div",
    { border: { padding: 1, theme: "thick" } },
    c("columns", { columns: 2 }, [
      c("text", `${styleText("red", "hola")}`),
      c("text", "hola"),
    ]),
  ).getVisualMatrix({ width: 40 });

  expect(visualMatrix.width).toEqual(40);
});

test("should render a div with border", () => {
  const output = render(
    c("div", { border: {} }, [
      c("text", "header"),
      c("text"),
      c("text", "footer cool"),
    ]),
    {
      width: 40,
    },
  );

  expect(output).toMatchSnapshot();
});
