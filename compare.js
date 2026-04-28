document.addEventListener("DOMContentLoaded", () => {
    // UI Elements
    const sizeSlider = document.getElementById("size-slider");
    const speedSlider = document.getElementById("speed-slider");
    const startBtn = document.getElementById("start-btn");
    const generateBtn = document.getElementById("generate-btn");
    
    let isRacing = false;
    let baseArray = [];

    // Context Factory
    class VisualizerContext {
        constructor(id, colorClass) {
            this.container = document.getElementById(`container-${id}`);
            this.compEl = document.getElementById(`comp-${id}`);
            this.swapEl = document.getElementById(`swap-${id}`);
            this.titleEl = document.getElementById(`title-${id}`);
            this.selectEl = document.getElementById(`algo-select-${id}`);
            
            this.lblTime = document.getElementById(`lbl-time-${id}`);
            this.lblComp = document.getElementById(`lbl-comp-${id}`);
            this.lblSwap = document.getElementById(`lbl-swap-${id}`);
            
            this.barTime = document.getElementById(`bar-time-${id}`);
            this.barComp = document.getElementById(`bar-comp-${id}`);
            this.barSwap = document.getElementById(`bar-swap-${id}`);
            
            this.array = [];
            this.bars = [];
            this.comparisons = 0;
            this.swaps = 0;
            this.speed = 80;
            this.id = id;
            this.colorClass = colorClass;
        }

        initBars(arr, spd) {
            this.array = [...arr];
            this.speed = spd;
            this.comparisons = 0;
            this.swaps = 0;
            this.updateStats(0,0);
            
            this.container.innerHTML = '';
            this.bars = [];
            const size = this.array.length;
            
            for(let i=0; i<size; i++) {
                const bar = document.createElement("div");
                bar.className = "array-bar";
                bar.style.height = `${this.array[i]}%`;
                bar.style.width = `${100/size}%`;
                bar.style.margin = `0 ${20/size}px`;
                if(this.id === 2) bar.style.backgroundColor = "var(--bar-sorted)";
                this.container.appendChild(bar);
                this.bars.push(bar);
            }
            this.titleEl.innerText = this.selectEl.options[this.selectEl.selectedIndex].text;
        }

        updateStats(c, s) {
            this.comparisons += c;
            this.swaps += s;
            if(c>0) this.compEl.innerText = this.comparisons;
            if(s>0) this.swapEl.innerText = this.swaps;
        }

        async sleep() {
            return new Promise(r => setTimeout(r, (101 - this.speed) * 2));
        }

        async swapNodes(i, j) {
            const tempHeight = this.bars[i].style.height;
            this.bars[i].style.height = this.bars[j].style.height;
            this.bars[j].style.height = tempHeight;

            const temp = this.array[i];
            this.array[i] = this.array[j];
            this.array[j] = temp;
            this.updateStats(0, 1);
        }

        updateHeight(i, val) {
            this.bars[i].style.height = `${val}%`;
            this.array[i] = val;
        }

        setClass(i, cl) {
            if(this.bars[i]) {
                if(cl === "") {
                    this.bars[i].className = "array-bar";
                    if(this.id === 2) this.bars[i].style.backgroundColor = "var(--bar-sorted)";
                    else this.bars[i].style.backgroundColor = "";
                } else {
                    this.bars[i].className = `array-bar ${cl}`;
                    this.bars[i].style.backgroundColor = "";
                }
            }
        }
    }

    const ctx1 = new VisualizerContext(1, "bar-default");
    const ctx2 = new VisualizerContext(2, "bar-sorted");

    function generateBaseArray() {
        if(isRacing) return;
        const size = parseInt(sizeSlider.value);
        baseArray = [];
        for (let i = 0; i < size; i++) {
            baseArray.push(Math.floor(Math.random() * 95) + 5);
        }
        ctx1.initBars(baseArray, parseInt(speedSlider.value));
        ctx2.initBars(baseArray, parseInt(speedSlider.value));
        resetDashboard();
    }

    // --- ALGORITHMS ---
    async function bubbleSort(ctx) {
        const n = ctx.array.length;
        for(let i=0; i<n-1; i++) {
            for(let j=0; j<n-i-1; j++) {
                ctx.updateStats(1,0); ctx.setClass(j, "compare"); ctx.setClass(j+1, "compare"); await ctx.sleep();
                if(ctx.array[j] > ctx.array[j+1]) { ctx.setClass(j, "swap"); ctx.setClass(j+1, "swap"); await ctx.sleep(); await ctx.swapNodes(j, j+1); }
                ctx.setClass(j, ""); ctx.setClass(j+1, "");
            }
            ctx.setClass(n-i-1, "sorted");
        }
        ctx.setClass(0, "sorted");
    }

    async function selectionSort(ctx) {
        const n = ctx.array.length;
        for(let i=0; i<n; i++) {
            let min = i; ctx.setClass(i, "compare");
            for(let j=i+1; j<n; j++) {
                ctx.updateStats(1,0); ctx.setClass(j, "compare"); await ctx.sleep();
                if(ctx.array[j] < ctx.array[min]) { if(min !== i) ctx.setClass(min, ""); min = j; ctx.setClass(min, "swap"); } else { ctx.setClass(j, ""); }
            }
            if(min !== i) { await ctx.swapNodes(i, min); ctx.setClass(min, ""); }
            ctx.setClass(i, "sorted");
        }
    }

    async function insertionSort(ctx) {
        const n = ctx.array.length; ctx.setClass(0, "sorted");
        for(let i=1; i<n; i++) {
            let key = ctx.array[i]; let j = i-1; ctx.setClass(i, "compare"); await ctx.sleep();
            while(j >= 0) {
                ctx.updateStats(1,0);
                if(ctx.array[j] <= key) break;
                ctx.setClass(j, "swap"); ctx.setClass(j+1, "swap"); await ctx.sleep();
                ctx.updateHeight(j+1, ctx.array[j]); ctx.updateStats(0,1); ctx.setClass(j, "sorted"); ctx.setClass(j+1, "sorted");
                j--;
            }
            ctx.updateHeight(j+1, key); ctx.updateStats(0,1); ctx.setClass(j+1, "sorted");
            for(let k=0; k<=i; k++) ctx.setClass(k, "sorted");
        }
    }

    async function mergeSort(ctx, l=0, r=ctx.array.length -1) {
        if(l >= r) return; const m = l + Math.floor((r-l)/2);
        await mergeSort(ctx, l, m); await mergeSort(ctx, m+1, r); await merge(ctx, l, m, r);
    }
    async function merge(ctx, l, m, r) {
        const n1 = m-l+1; const n2 = r-m; let left = new Array(n1); let right = new Array(n2);
        for(let i=0; i<n1; i++) left[i] = ctx.array[l+i];
        for(let j=0; j<n2; j++) right[j] = ctx.array[m+1+j];
        let i=0, j=0, k=l;
        while(i<n1 && j<n2) {
            ctx.updateStats(1,0); ctx.setClass(k, "compare"); await ctx.sleep();
            if(left[i] <= right[j]) { ctx.updateHeight(k, left[i]); i++; } else { ctx.updateHeight(k, right[j]); j++; }
            ctx.updateStats(0,1); ctx.setClass(k, ""); k++;
        }
        while(i<n1) { ctx.setClass(k, "compare"); await ctx.sleep(); ctx.updateHeight(k, left[i]); ctx.updateStats(0,1); ctx.setClass(k, ""); i++; k++; }
        while(j<n2) { ctx.setClass(k, "compare"); await ctx.sleep(); ctx.updateHeight(k, right[j]); ctx.updateStats(0,1); ctx.setClass(k, ""); j++; k++; }
    }

    async function quickSort(ctx, low=0, high=ctx.array.length-1) {
        if(low < high) { const pi = await partition(ctx, low, high); await quickSort(ctx, low, pi-1); await quickSort(ctx, pi+1, high); } 
        else if(low === high) ctx.setClass(low, "sorted");
    }
    async function partition(ctx, low, high) {
        let pivot = ctx.array[high]; ctx.setClass(high, "swap"); let i = low - 1;
        for(let j=low; j<high; j++) {
            ctx.updateStats(1,0); ctx.setClass(j, "compare"); await ctx.sleep();
            if(ctx.array[j] < pivot) { i++; if(i !== j) await ctx.swapNodes(i, j); }
            ctx.setClass(j, "");
        }
        await ctx.swapNodes(i+1, high); ctx.setClass(high, ""); ctx.setClass(i+1, "sorted");
        return i + 1;
    }

    async function heapSort(ctx) {
        let n = ctx.array.length;
        for(let i = Math.floor(n/2)-1; i>=0; i--) await heapify(ctx, n, i);
        for(let i=n-1; i>0; i--) { ctx.setClass(0, "swap"); ctx.setClass(i, "swap"); await ctx.sleep(); await ctx.swapNodes(0, i); ctx.setClass(0, ""); ctx.setClass(i, "sorted"); await heapify(ctx, i, 0); }
        ctx.setClass(0, "sorted");
    }
    async function heapify(ctx, n, i) {
        let largest = i; let l = 2*i+1; let r = 2*i+2;
        if(l < n) { ctx.updateStats(1,0); ctx.setClass(l, "compare"); ctx.setClass(largest, "compare"); await ctx.sleep(); if(ctx.array[l] > ctx.array[largest]) largest = l; ctx.setClass(l, ""); ctx.setClass(largest, ""); }
        if(r < n) { ctx.updateStats(1,0); ctx.setClass(r, "compare"); ctx.setClass(largest, "compare"); await ctx.sleep(); if(ctx.array[r] > ctx.array[largest]) largest = r; ctx.setClass(r, ""); ctx.setClass(largest, ""); }
        if(largest !== i) { ctx.setClass(i, "swap"); ctx.setClass(largest, "swap"); await ctx.sleep(); await ctx.swapNodes(i, largest); ctx.setClass(i, ""); ctx.setClass(largest, ""); await heapify(ctx, n, largest); }
    }

    async function shellSort(ctx) {
        let n = ctx.array.length;
        for(let gap = Math.floor(n/2); gap>0; gap = Math.floor(gap/2)) {
            for(let i=gap; i<n; i++) {
                let temp = ctx.array[i]; let j; ctx.setClass(i, "compare"); await ctx.sleep();
                for(j=i; j>=gap; j-=gap) {
                    ctx.updateStats(1,0); if(ctx.array[j-gap] <= temp) break;
                    ctx.setClass(j-gap, "swap"); ctx.setClass(j, "swap"); await ctx.sleep();
                    ctx.updateHeight(j, ctx.array[j-gap]); ctx.updateStats(0,1); ctx.setClass(j-gap, ""); ctx.setClass(j, "");
                }
                ctx.updateHeight(j, temp); ctx.updateStats(0,1); ctx.setClass(i, "");
            }
        }
    }

    async function cocktailSort(ctx) {
        let swapped = true; let start = 0; let end = ctx.array.length;
        while(swapped) {
            swapped = false;
            for(let i=start; i<end-1; ++i) {
                ctx.updateStats(1,0); ctx.setClass(i, "compare"); ctx.setClass(i+1, "compare"); await ctx.sleep();
                if(ctx.array[i] > ctx.array[i+1]) { ctx.setClass(i, "swap"); ctx.setClass(i+1, "swap"); await ctx.sleep(); await ctx.swapNodes(i, i+1); swapped = true; }
                ctx.setClass(i, ""); ctx.setClass(i+1, "");
            }
            if(!swapped) break;
            swapped = false; end--; ctx.setClass(end, "sorted");
            for(let i=end-1; i>=start; i--) {
                ctx.updateStats(1,0); ctx.setClass(i, "compare"); ctx.setClass(i+1, "compare"); await ctx.sleep();
                if(ctx.array[i] > ctx.array[i+1]) { ctx.setClass(i, "swap"); ctx.setClass(i+1, "swap"); await ctx.sleep(); await ctx.swapNodes(i, i+1); swapped = true; }
                ctx.setClass(i, ""); ctx.setClass(i+1, "");
            }
            ctx.setClass(start, "sorted"); start++;
        }
    }

    function getAlgoFn(val) {
        switch(val) {
            case "bubble": return bubbleSort;
            case "selection": return selectionSort;
            case "insertion": return insertionSort;
            case "merge": return mergeSort;
            case "quick": return quickSort;
            case "heap": return heapSort;
            case "shell": return shellSort;
            case "cocktail": return cocktailSort;
            default: return bubbleSort;
        }
    }

    // --- Benchmark Logic ---
    class BenchmarkContext {
        constructor(arr) { this.array = [...arr]; this.comparisons = 0; this.swaps = 0; }
        updateStats(c,s) { this.comparisons+=c; this.swaps+=s; }
        async sleep() {} 
        setClass() {}
        async swapNodes(i,j) { let t = this.array[i]; this.array[i] = this.array[j]; this.array[j] = t; this.updateStats(0,1); }
        updateHeight(i,val) { this.array[i] = val; }
    }

    async function computeBenchmark(arr, algoVal) {
        let bCtx = new BenchmarkContext(arr);
        let fn = getAlgoFn(algoVal);
        let t0 = performance.now();
        await fn(bCtx);
        let t1 = performance.now();
        return { time: (t1-t0), comps: bCtx.comparisons, swaps: bCtx.swaps };
    }

    function resetDashboard() {
        [ctx1, ctx2].forEach(ctx => {
            ctx.lblTime.innerText = "--"; ctx.barTime.style.width = "0%";
            ctx.lblComp.innerText = "--"; ctx.barComp.style.width = "0%";
            ctx.lblSwap.innerText = "--"; ctx.barSwap.style.width = "0%";
        });
    }

    function populateDashboard(res1, res2) {
        ctx1.lblTime.innerText = res1.time.toFixed(2); ctx2.lblTime.innerText = res2.time.toFixed(2);
        ctx1.lblComp.innerText = res1.comps;           ctx2.lblComp.innerText = res2.comps;
        ctx1.lblSwap.innerText = res1.swaps;           ctx2.lblSwap.innerText = res2.swaps;

        let maxTime = Math.max(res1.time, res2.time, 0.001);
        let maxComp = Math.max(res1.comps, res2.comps, 1);
        let maxSwap = Math.max(res1.swaps, res2.swaps, 1);

        // Minimum 2% width so it's always slightly visible
        ctx1.barTime.style.width = Math.max((res1.time / maxTime * 100), 2) + "%";
        ctx2.barTime.style.width = Math.max((res2.time / maxTime * 100), 2) + "%";

        ctx1.barComp.style.width = Math.max((res1.comps / maxComp * 100), 2) + "%";
        ctx2.barComp.style.width = Math.max((res2.comps / maxComp * 100), 2) + "%";

        ctx1.barSwap.style.width = Math.max((res1.swaps / maxSwap * 100), 2) + "%";
        ctx2.barSwap.style.width = Math.max((res2.swaps / maxSwap * 100), 2) + "%";
    }

    async function handleStart() {
        if(isRacing) return;
        isRacing = true;
        startBtn.disabled = true;
        generateBtn.disabled = true;
        ctx1.selectEl.disabled = true;
        ctx2.selectEl.disabled = true;
        sizeSlider.disabled = true;
        resetDashboard();

        let spd = parseInt(speedSlider.value);
        ctx1.initBars(baseArray, spd);
        ctx2.initBars(baseArray, spd);

        let v1 = ctx1.selectEl.value;
        let v2 = ctx2.selectEl.value;

        // Run un-throttled benchmarks instantly
        let r1 = await computeBenchmark(baseArray, v1);
        let r2 = await computeBenchmark(baseArray, v2);
        populateDashboard(r1, r2);

        // Run visual
        let p1 = getAlgoFn(v1)(ctx1).then(() => {
            for(let i=0; i<ctx1.array.length; i++) ctx1.setClass(i, "sorted");
        });
        let p2 = getAlgoFn(v2)(ctx2).then(() => {
            for(let i=0; i<ctx2.array.length; i++) ctx2.setClass(i, "sorted");
        });

        await Promise.all([p1, p2]);

        isRacing = false;
        startBtn.disabled = false;
        generateBtn.disabled = false;
        ctx1.selectEl.disabled = false;
        ctx2.selectEl.disabled = false;
        sizeSlider.disabled = false;
    }

    generateBtn.addEventListener("click", generateBaseArray);
    startBtn.addEventListener("click", handleStart);
    sizeSlider.addEventListener("input", generateBaseArray);
    speedSlider.addEventListener("input", () => {
       ctx1.speed = parseInt(speedSlider.value);
       ctx2.speed = parseInt(speedSlider.value);
    });
    
    ctx1.selectEl.addEventListener("change", () => ctx1.titleEl.innerText = ctx1.selectEl.options[ctx1.selectEl.selectedIndex].text);
    ctx2.selectEl.addEventListener("change", () => ctx2.titleEl.innerText = ctx2.selectEl.options[ctx2.selectEl.selectedIndex].text);

    // Initial load
    generateBaseArray();
});
