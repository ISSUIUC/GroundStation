// PREREQ: MUST BE NUMBER !
const cbuf_size = 30

export class Differentiator {
    cbuf_size: number = 30;
    cbuf: number[] = [];
    cbuf_t: number[] = [];
    slope: number = 0;

    constructor(size: number) {
        this.cbuf_size = size;
    }

    calculateSlope() {
        let xValues: number[] = this.cbuf_t.map(t => ((Date.now() - t)/1000));
        let yValues: number[] = this.cbuf

        if (xValues.length !== yValues.length || xValues.length < 2) {
            return 0
        }
    
        let sumX = 0;
        let sumY = 0;
        let sumXY = 0;
        let sumXX = 0;
    
        for (let i = 0; i < xValues.length; i++) {
            sumX += xValues[i];
            sumY += yValues[i];
            sumXY += xValues[i] * yValues[i];
            sumXX += xValues[i] * xValues[i];
        }
    
        const n = xValues.length;
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        return slope;
    }

    push(data: any) {
        this.cbuf.push(data);
        this.cbuf_t.push(Date.now());
        if(this.cbuf.length > this.cbuf_size) {
            this.cbuf.shift();
            this.cbuf_t.shift();
        }

        let m = this.calculateSlope()
        if(isFinite(m)) {
            this.slope = -m
        } else {
            this.slope = 0;
        }
    }

}

