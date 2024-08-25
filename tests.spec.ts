import { test, expect } from "bun:test";
import { render, componentModules } from "./index.js";
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
  expect(draw).toEqual(
    "Lorem ipsum dolor         Lorem ipsum dolor sit \u001B[31mam\u001B[39m  Lorem ipsum \u001B[1m\u001B[34mdolor\u001B[39m\u001B[22m sit \u001B[31mam\u001B[39m  \n                          \u001B[31met, consectetur\u001B[39m adipisci  \u001B[31met, consectetur\u001B[39m adipisci  \n                          ng elit                   ng elit                   ",
  );
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

  expect(draw).toEqual(
    "Lorem ipsu  Lorem ipsum dolor sit \u001B[31mamet, cons\u001B[39m  Lorem ipsum dolor sit \u001B[31mamet, cons\u001B[39m  \nm dolor     \u001B[31mectetur\u001B[39m adipiscing elit. Lorem i  \u001B[31mectetur\u001B[39m adipiscing elit. Lorem i  \n            psum \u001B[1m\u001B[34mdolor\u001B[39m\u001B[22m sit \u001B[31mamet, consectetur\u001B[39m  psum \u001B[1m\u001B[34mdolor\u001B[39m\u001B[22m sit \u001B[31mamet, consectetur\u001B[39m  \n             adipiscing elit                   adipiscing elit                  ",
  );
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
