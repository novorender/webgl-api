// just a placeholder until this interface becomes part of the standard library types.
interface EXT_disjoint_timer_query_webgl2 {
    readonly QUERY_COUNTER_BITS_EXT: 0x8864; // GL.QUERY_COUNTER_BITS_EXT;
    readonly TIME_ELAPSED_EXT: 0x88BF; // GL.TIME_ELAPSED_EXT;
    readonly TIMESTAMP_EXT: 0x8E28; // GL.TIMESTAMP_EXT;
    readonly GPU_DISJOINT_EXT: 0x8FBB;  // GL.GPU_DISJOINT_EXT;
    queryCounterEXT(query: WebGLQuery, target: 0x8E28 /*GL.TIMESTAMP_EXT*/): void;
}

export type Timer = CPUTimer | GPUTimer | GPUTimerTS;

export function createTimer(gl: WebGL2RenderingContext): Timer {
    const ext = gl.getExtension('EXT_disjoint_timer_query_webgl2') as EXT_disjoint_timer_query_webgl2;
    if (ext) {
        // Clear the disjoint state before starting to work with queries to increase the chances that the results will be valid.
        gl.getParameter(ext.GPU_DISJOINT_EXT);
        const useTimestamps = gl.getQuery(ext.TIMESTAMP_EXT, ext.QUERY_COUNTER_BITS_EXT) ?? 0 > 0;
        if (useTimestamps)
            return new GPUTimerTS(gl, ext);
        else
            return new GPUTimer(gl, ext);
    } else {
        console.log("using cpu timer.")
        return new CPUTimer(gl);
    }
}

class CPUTimer {
    #begin = 0;
    #end = 0;
    readonly creationTime;

    constructor(readonly gl: WebGL2RenderingContext) {
        this.creationTime = performance.now();
    }

    dispose() {
    }

    begin() {
        this.gl.finish();
        this.#begin = performance.now();
    }

    end() {
        this.gl.finish();
        this.#end = performance.now();
    }

    getMeasurement() {
        return (this.#end - this.#begin); // in milliseconds
    }
}

class GPUTimer {
    private readonly query;
    readonly #creationTime;

    constructor(readonly gl: WebGL2RenderingContext, readonly ext: EXT_disjoint_timer_query_webgl2) {
        this.#creationTime = performance.now();
        this.query = gl.createQuery()!;
    }

    dispose() {
        const { gl, query } = this;
        gl.deleteQuery(query);
    }

    begin() {
        const { gl, ext, query } = this;
        gl.beginQuery(ext.TIME_ELAPSED_EXT, query);
    }

    end() {
        const { gl, ext } = this;
        gl.endQuery(ext.TIME_ELAPSED_EXT);
    }

    getMeasurement() {
        const { gl, ext, query } = this;
        let disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
        if (!disjoint) {
            const available = gl.getQueryParameter(query, gl.QUERY_RESULT_AVAILABLE);
            if (available) {
                const timeElapsed = gl.getQueryParameter(query, gl.QUERY_RESULT) as number; // in nanoseconds
                return timeElapsed / 1000000; // in milliseconds
            }
        }
        return performance.now() > this.#creationTime + 1000; // true if measurement failed, false if still pending
    }
}


class GPUTimerTS {
    private readonly startQuery;
    private readonly endQuery;
    readonly #creationTime;

    constructor(readonly gl: WebGL2RenderingContext, readonly ext: EXT_disjoint_timer_query_webgl2) {
        this.#creationTime = performance.now();
        this.startQuery = gl.createQuery()!;
        this.endQuery = gl.createQuery()!;
    }

    dispose() {
        const { gl, startQuery, endQuery } = this;
        gl.deleteQuery(startQuery);
        gl.deleteQuery(endQuery);
    }

    begin() {
        const { ext, startQuery } = this;
        ext.queryCounterEXT(startQuery, ext.TIMESTAMP_EXT);
    }

    end() {
        const { ext, endQuery } = this;
        ext.queryCounterEXT(endQuery, ext.TIMESTAMP_EXT);
    }

    getMeasurement() {
        const { gl, ext, startQuery, endQuery } = this;
        let disjoint = gl.getParameter(ext.GPU_DISJOINT_EXT);
        if (!disjoint) {
            const available = gl.getQueryParameter(endQuery, gl.QUERY_RESULT_AVAILABLE);
            if (available) {
                const timeStart = gl.getQueryParameter(startQuery, gl.QUERY_RESULT);
                const timeEnd = gl.getQueryParameter(endQuery, gl.QUERY_RESULT);
                const timeElapsed = timeEnd - timeStart; // in nanoseconds
                return timeElapsed / 1000000; // in milliseconds
            }
        }
        return performance.now() > this.#creationTime + 1000; // true if measurement failed, false if still pending
    }
}