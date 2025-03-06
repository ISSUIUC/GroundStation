import { useTelemetryHistory } from "./gssdata";

const linear_approx_coefficients = (x, y) => {
    const x_offset = x[0]
    if (x.length !== y.length) {
        throw new Error("Input arrays must have the same non-zero length");
    }

    if(x.length === 0) {
        return 0;
    }

    let n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;

    for (let i = 0; i < n; i++) {
        sumX += (x[i]-x_offset);
        sumY += y[i];
        sumXY += (x[i]-x_offset) * y[i];
        sumX2 += (x[i]-x_offset) * (x[i]-x_offset);
    }

    let m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    let b = (sumY - m * sumX) / n;

    return { m, b };
}

export const time_series = (telem_key, num_keys=15) => {
    let time_values = useTelemetryHistory("/time_republished", true, 0).slice(-num_keys);
    let yvals = useTelemetryHistory(telem_key, false, 0).slice(-num_keys);

    return [linear_approx_coefficients(time_values, yvals), time_values, yvals];
}

export const time_series_raw = (x_values, y_values) => {
    return [linear_approx_coefficients(x_values, y_values), x_values, y_values];
}