const N = 8;


const COS = Array.from({ length: N }, (_, k) => 
    Array.from({ length: N }, (_, n) => Math.cos(((2 * n + 1) * k * Math.PI) / (2 * N)))
);


const SCALE = Array.from({ length: N }, (_, k) =>
    k === 0 ? Math.sqrt(1 / N) : Math.sqrt(2 / N)
);


const dct1d = (input) => {
    const out =  new Float64Array(N);
    for (let k = 0; k < N; k++) {
        let sum = 0;
        for (let n = 0; n < N; n++) sum += input[n] * COS[k][n];
        out[k] = SCALE[k] * sum;
    }
    return out;
}


const idct1d = (input) => {
    const out = new Float64Array(N);
    for (let n = 0; n < N; n++) {
        let sum = 0;
        for (let k = 0; k < N; k++) sum += SCALE[k] * input[k] * COS[k][n];
        out[n] = sum;
    }
    return out;
}


const dct = () => {
    const dct2d = (block) => {
        const tmp = new Float64Array(64);
        const out = new Float64Array(64);

        for (let r = 0; r < N; r++) {
            tmp.set(dct1d(block.subarray(r * N, r * N + N)), r * N);
        }

        for (let c = 0; c < N; c++) {
            const col = new Float64Array(N);
            for (let r = 0; r < N; r++) col[r] = tmp[r * N + c];
            const res = dct1d(col);
            for (let r = 0; r < N; r++) out[r * N + c] = res[r];
        }
        return out;
    }


    const idct2d = (coeffs) => {
        const tmp = new Float64Array(64);
        const out = new Float64Array(64);

        for (let c = 0; c < N; c++) {
            const col = new Float64Array(N);
            for (let r = 0; r < N; r++) col[r] = coeffs[r * N + c];
            const res = idct1d(col);
            for (let r = 0; r < N; r++) tmp[r * N + c] = res[r];
        }

        for (let r = 0; r < N; r++) {
            out.set(idct1d(tmp.subarray(r * N, r * N + N)), r * N);
        }
        return out;
    }


    return {
        dct2d,
        idct2d,
    };
};


export default dct;
