import { colors, styleText, unstyleText } from "@jondotsoy/style-text";

const sequence = (n: number, startOf: number = 0) =>
  Array.from(Array(n), (_, key) => key + startOf);

const mapOpenColorsByCode = new Map<
  number,
  { colorName: string; color: [number, number] }
>();
const mapCloseColorsByCode = new Map<
  number,
  { colorName: string; color: [number, number] }[]
>();
const getSettingColorByCode = (code: number) => {
  const openColor = mapOpenColorsByCode.get(code) ?? null;
  const closeColor = mapCloseColorsByCode.get(code) ?? null;
  return openColor
    ? { type: "open" as const, color: openColor }
    : closeColor
      ? { type: "close" as const, colors: closeColor }
      : null;
};
for (const [colorName, color] of Object.entries(colors)) {
  const [codeOpen, codeClose] = color;

  mapOpenColorsByCode.set(codeOpen, { colorName, color });

  const listClose = mapCloseColorsByCode.get(codeClose) ?? [];

  listClose.push({ colorName, color });

  mapCloseColorsByCode.set(codeClose, listClose);
}

type ComponentOptions = {
  colors: boolean;
  columns: number;
  columnsTemplate: (null | { width?: number })[];
  gap: number;
  width: number;
};

type VisualMatrix = {
  width: number;
  height: number;
  /**
   * Can be each line
   */
  matrix: string[];
};

type Part = {
  value: string;
  styles: string[];
};

abstract class Component {
  defaultOptions?: Partial<ComponentOptions>;
  children: Component[] = [];
  toString(options: Partial<ComponentOptions>) {
    const visualMatrix = this.getVisualMatrix(options);
    const { matrix } = visualMatrix;
    return matrix.join("\n");
  }
  abstract getVisualMatrix(options: Partial<ComponentOptions>): VisualMatrix;
}

class TextComponent extends Component {
  value: string = "";

  getVisualMatrix(options: Partial<ComponentOptions>): VisualMatrix {
    const maxWidth = options.width ?? this.defaultOptions?.width ?? Infinity;
    const parts = this.toParts(options);

    const lines: Part[][] = [];
    let currentLine: Part[] = [];
    let currentLineSize = 0;

    function* iterPartsWithControl(parts: Iterable<Part>) {
      const iter = parts[Symbol.iterator]();

      let withSame = false;
      let lastValue: IteratorResult<Part, any> = {
        value: undefined,
        done: true,
      };

      const next = () => {
        lastValue = withSame ? lastValue : iter.next();
        withSame = false;
        return lastValue;
      };

      const control = {
        sameOnNextLoop() {
          withSame = true;
        },
      };

      while (true) {
        const { value, done } = next();
        if (done) break;
        yield { control, value: value };
      }
    }

    for (const { control, value: part } of iterPartsWithControl(parts)) {
      const lineSizeWithPart = currentLineSize + part.value.length;
      if (part.value === "\n") {
        lines.push(currentLine);
        currentLineSize = 0;
        currentLine = [];
        continue;
      }
      if (lineSizeWithPart > maxWidth) {
        const indexToSplitPart = maxWidth - currentLineSize;
        const newPart = {
          value: part.value.substring(0, indexToSplitPart),
          styles: part.styles,
        };

        currentLine.push(newPart);
        lines.push(currentLine);
        currentLineSize = 0;
        currentLine = [];

        part.value = part.value.substring(indexToSplitPart);
        control.sameOnNextLoop();
        continue;
      }
      currentLine.push(part);
      currentLineSize = lineSizeWithPart;
    }
    lines.push(currentLine);

    let matrixWidth = 0;
    let matrixLines: string[] = [];
    for (const line of lines) {
      let widthLine = 0;
      let value = "";
      for (const part of line) {
        widthLine += part.value.length;
        value += styleText(part.styles, part.value);
      }
      matrixWidth = Math.max(matrixWidth, widthLine);
      matrixLines.push(value);
    }

    const matrix: VisualMatrix = {
      width: matrixWidth,
      height: matrixLines.length,
      matrix: matrixLines,
    };

    return matrix;
  }

  toParts(options: Partial<ComponentOptions>): Part[] {
    return this.pipeNewLinesParts(this.toAsciiParts(options), options);
  }

  pipeNewLinesParts(parts: Part[], options: Partial<ComponentOptions>): Part[] {
    const newParts: Part[] = [];
    for (const part of parts) {
      if (part.value.includes("\n")) {
        const chunks = part.value.split("\n");
        chunks.forEach((chunk, index, chunks) => {
          const isBetween = index < chunks.length - 1;
          newParts.push({
            value: chunk,
            styles: part.styles,
          });
          if (isBetween) newParts.push({ value: "\n", styles: [] });
        });

        continue;
      }
      newParts.push(part);
    }
    return newParts;
  }

  toAsciiParts(options: Partial<ComponentOptions>): Part[] {
    const withColor = options.colors ?? this.defaultOptions?.colors ?? true;
    const value = withColor ? this.value : unstyleText(this.value);
    const expr = /\u001b\[(?<colorCode>\d+)m/g;
    const parts: Part[] = [];
    let m: RegExpExecArray | null;
    let prevCharsIndex = 0;
    let mapStyles = new Set<string>();
    while ((m = expr.exec(value))) {
      const asciiIndex = m.index;
      const nextCharIndex = expr.lastIndex;
      const part = value.substring(prevCharsIndex, asciiIndex);
      if (part)
        parts.push({
          value: part,
          styles: [...mapStyles],
        });

      const settingColor = getSettingColorByCode(parseInt(m.groups!.colorCode));

      if (settingColor?.type === "open") {
        mapStyles.add(settingColor.color.colorName);
      }

      if (settingColor?.type === "close") {
        for (const color of settingColor.colors) {
          mapStyles.delete(color.colorName);
        }
      }

      prevCharsIndex = nextCharIndex;
    }

    if (prevCharsIndex < value.length)
      parts.push({
        value: value.substring(prevCharsIndex),
        styles: [...mapStyles],
      });

    return parts;
  }
}

class ColumnsComponent extends Component {
  getVisualMatrix(options: Partial<ComponentOptions>): VisualMatrix {
    const { children } = this;
    const gap = options.gap ?? this.defaultOptions?.gap ?? 2;
    const maxWidth = options.width ?? this.defaultOptions?.width ?? Infinity;
    const flowColumns = options.columns ?? this.defaultOptions?.columns ?? 1;
    const columnsTemplate =
      options.columnsTemplate ?? this.defaultOptions?.columnsTemplate ?? [];
    const realColumnsTemplate = Array.from(
      sequence(flowColumns),
      (i) => columnsTemplate.at(i) ?? { width: null },
    );

    let conditionalSize = 0;
    let flowColumnsAutoSize = 0;

    for (const realColumnTemplate of realColumnsTemplate) {
      if (realColumnTemplate.width === null) {
        flowColumnsAutoSize += 1;
      }
      if (realColumnTemplate.width) {
        conditionalSize += realColumnTemplate.width;
      }
    }

    const maxWidthPerColumns = Math.floor(
      (maxWidth - conditionalSize - gap * flowColumns) / flowColumnsAutoSize,
    );

    const childMatrixes = this.children.map((child, index) =>
      child.getVisualMatrix({
        ...options,
        width: realColumnsTemplate.at(index)?.width ?? maxWidthPerColumns,
      }),
    );
    const width = maxWidth;
    let height = 0;
    for (const childMatrix of childMatrixes) {
      height = Math.max(height, childMatrix.height);
    }

    const lines: string[] = [];

    for (const rowIndex of sequence(height)) {
      let line = "";
      for (const collIndex of sequence(flowColumns)) {
        const matrix = childMatrixes.at(collIndex);
        // const isEndColumn = collIndex + 1 >= flowColumns;
        const childLine = matrix?.matrix.at(rowIndex) ?? "";
        const padSize =
          realColumnsTemplate.at(collIndex)?.width ?? maxWidthPerColumns;
        line += childLine.padEnd(padSize === Infinity ? 0 : padSize, " ");
        line += " ".repeat(gap);
      }
      lines.push(line);
    }

    return {
      width,
      height,
      matrix: lines,
    };
  }
}

class ContentDivisionComponent extends Component {
  getVisualMatrix(options: Partial<ComponentOptions>): VisualMatrix {
    const childrenMatrixes = this.children.map((child) =>
      child.getVisualMatrix(options),
    );

    const lines: string[] = [];
    let width = 0;
    let height = 0;
    for (const childrenMatrix of childrenMatrixes) {
      width = Math.max(width, childrenMatrix.width);
      height += childrenMatrix.height;
      lines.push(...childrenMatrix.matrix);
    }

    return {
      width,
      height,
      matrix: lines,
    };
  }
}

type CreateElementArguments =
  | []
  | [children?: string | Component | Component[]]
  | [
      options?: Partial<ComponentOptions>,
      children?: string | Component | Component[],
    ];

type resultParseCreateElementArguments = {
  options?: Partial<ComponentOptions>;
  children?: string | Component | Component[];
};

const parseCreateElementArguments = (
  args: CreateElementArguments,
): resultParseCreateElementArguments => {
  if (args.length === 2) {
    const [options, children] = args;
    return { options, children };
  }
  if (args.length === 1) {
    const [optionsOrChildren] = args;
    if (typeof optionsOrChildren === "string")
      return { children: optionsOrChildren };
    if (optionsOrChildren instanceof Component)
      return { children: optionsOrChildren };
    if (Array.isArray(optionsOrChildren))
      return { children: optionsOrChildren };
    return { options: optionsOrChildren };
  }
  return {};
};

class ComponentModules {
  #classComponents = new Map<string, { new (): Component }>();
  constructor() {
    this.definedComponent("text", TextComponent);
    this.definedComponent("columns", ColumnsComponent);
    this.definedComponent("content-division", ContentDivisionComponent);
    this.definedComponent("div", ContentDivisionComponent);
  }
  definedComponent(name: string, definitonComponent: { new (): Component }) {
    this.#classComponents.set(name, definitonComponent);
  }

  createElement(name: string, ...args: CreateElementArguments) {
    const { options, children } = parseCreateElementArguments(args);

    const componentClass =
      this.#classComponents.get(name) ?? this.#classComponents.get("text")!;
    const element = new componentClass();
    if (typeof children === "string") {
      if (element instanceof TextComponent) {
        element.value = children;
      } else if (element instanceof Component) {
        const t = new TextComponent();
        t.value = children;
        element.children = [t];
      }
    } else {
      element.children = Array.isArray(children)
        ? children
        : children instanceof Component
          ? [children]
          : [];
    }
    element.defaultOptions = options;
    return element;
  }
}

export const componentModules = new ComponentModules();

export const render = (
  element: Component,
  options?: Partial<ComponentOptions>,
) => {
  const width = process?.stdout?.columns;
  return element.toString({ width, ...options });
};
