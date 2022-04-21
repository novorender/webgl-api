export function exhaustiveCheck(value: never) {
    throw new Error(`Unknown kind: ${value}!`);
}

export function createGLContext(canvas: HTMLCanvasElement) {
    // TODO: Add options (for creating context)
    const options: WebGLContextAttributes = {
        alpha: true,
        antialias: false,
        depth: true,
        failIfMajorPerformanceCaveat: false,
        desynchronized: false,
        premultipliedAlpha: false,
        preserveDrawingBuffer: true,
        powerPreference: "high-performance",
        stencil: false
    };
    const gl = canvas.getContext("webgl2", options);
    return gl;
}

// code adapted from https://github.com/sindresorhus/strip-json-comments
export function stripJsonComments(jsonString: string) {
    const singleComment = Symbol('singleComment');
    const multiComment = Symbol('multiComment');
    let isInsideString = false;
    let isInsideComment: typeof singleComment | typeof multiComment | false = false;
    let offset = 0;
    let result = '';

    function isEscaped(jsonString: string, quotePosition: number) {
        let index = quotePosition - 1;
        let backslashCount = 0;

        while (jsonString[index] === '\\') {
            index -= 1;
            backslashCount += 1;
        }

        return Boolean(backslashCount % 2);
    };

    for (let index = 0; index < jsonString.length; index++) {
        const currentCharacter = jsonString[index];
        const nextCharacter = jsonString[index + 1];

        if (!isInsideComment && currentCharacter === '"') {
            const escaped = isEscaped(jsonString, index);
            if (!escaped) {
                isInsideString = !isInsideString;
            }
        }

        if (isInsideString) {
            continue;
        }

        if (!isInsideComment && currentCharacter + nextCharacter === '//') {
            result += jsonString.slice(offset, index);
            offset = index;
            isInsideComment = singleComment;
            index++;
        } else if (isInsideComment === singleComment && currentCharacter + nextCharacter === '\r\n') {
            index++;
            isInsideComment = false;
            offset = index;
            continue;
        } else if (isInsideComment === singleComment && currentCharacter === '\n') {
            isInsideComment = false;
            offset = index;
        } else if (!isInsideComment && currentCharacter + nextCharacter === '/*') {
            result += jsonString.slice(offset, index);
            offset = index;
            isInsideComment = multiComment;
            index++;
            continue;
        } else if (isInsideComment === multiComment && currentCharacter + nextCharacter === '*/') {
            index++;
            isInsideComment = false;
            offset = index + 1;
            continue;
        }
    }

    return result + (isInsideComment ? '' : jsonString.slice(offset));
}