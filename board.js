const numberBoard = document.getElementById('number-board');
const algoSelect = document.getElementById('algo-select');
const sizeSlider = document.getElementById('size-slider');
const speedSlider = document.getElementById('speed-slider');
const generateBtn = document.getElementById('generate-btn');
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const customInput = document.getElementById('custom-input');
const loadCustomBtn = document.getElementById('load-custom-btn');
const passIndicator = document.getElementById('pass-indicator');

let array = []; // Array of objects: { val: number, node: HTMLElement }
let sorting = false;
let abortController = null;
let currentPass = 0;

// Initialize
function init() {
    generateArray();
    
    sizeSlider.addEventListener('input', generateArray);
    generateBtn.addEventListener('click', generateArray);
    startBtn.addEventListener('click', startSorting);
    stopBtn.addEventListener('click', stopSorting);
    
    loadCustomBtn.addEventListener('click', () => {
        const val = customInput.value;
        if (!val.trim()) return;
        const nums = val.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
        if (nums.length > 0) {
            createArrayFromValues(nums);
            sizeSlider.value = nums.length;
        }
    });
}

function createArrayFromValues(values) {
    if (sorting) return;
    array = [];
    numberBoard.innerHTML = '';
    
    values.forEach(val => {
        const box = document.createElement('div');
        box.classList.add('number-box');
        box.textContent = val;
        numberBoard.appendChild(box);
        array.push({ val, node: box });
    });
    resetPass();
}

function generateArray() {
    if (sorting) return;
    const size = parseInt(sizeSlider.value);
    const nums = [];
    for (let i = 0; i < size; i++) {
        nums.push(Math.floor(Math.random() * 90) + 10);
    }
    createArrayFromValues(nums);
}

function updateHighlights(compareIndices = [], swapIndices = [], sortedIndices = []) {
    array.forEach((item, idx) => {
        item.node.className = 'number-box'; // reset
        if (sortedIndices.includes(idx)) {
            item.node.classList.add('sorted');
        } else if (swapIndices.includes(idx)) {
            item.node.classList.add('swap');
        } else if (compareIndices.includes(idx)) {
            item.node.classList.add('compare');
        }
    });
}

function updatePass(pass) {
    if (pass !== currentPass) {
        currentPass = pass;
        passIndicator.textContent = `Pass: ${pass}`;
        passIndicator.style.opacity = '1';
    }
}

function resetPass() {
    currentPass = 0;
    passIndicator.style.opacity = '0';
    passIndicator.textContent = `Pass: 1`;
}

function getDelay() {
    const speed = parseInt(speedSlider.value);
    return 1050 - (speed * 10); 
}

const sleep = (ms, signal) => new Promise((resolve, reject) => {
    const timeout = setTimeout(resolve, ms);
    if (signal) {
        signal.addEventListener('abort', () => {
            clearTimeout(timeout);
            reject(new DOMException('Aborted', 'AbortError'));
        });
    }
});

async function doSwap(i, j, signal) {
    if (i === j) return;
    const item1 = array[i];
    const item2 = array[j];
    const node1 = item1.node;
    const node2 = item2.node;

    // FLIP: First
    const rect1 = node1.getBoundingClientRect();
    const rect2 = node2.getBoundingClientRect();

    // Swap in DOM
    const next1 = node1.nextSibling;
    const next2 = node2.nextSibling;
    
    if (node1.nextSibling === node2) {
        node2.parentNode.insertBefore(node2, node1);
    } else if (node2.nextSibling === node1) {
        node1.parentNode.insertBefore(node1, node2);
    } else {
        node1.parentNode.insertBefore(node1, next2);
        node2.parentNode.insertBefore(node2, next1);
    }

    // Swap in array
    array[i] = item2;
    array[j] = item1;

    // FLIP: Last
    const newRect1 = node1.getBoundingClientRect();
    const newRect2 = node2.getBoundingClientRect();

    // FLIP: Invert
    const deltaX1 = rect1.left - newRect1.left;
    const deltaY1 = rect1.top - newRect1.top;
    const deltaX2 = rect2.left - newRect2.left;
    const deltaY2 = rect2.top - newRect2.top;

    node1.style.transform = `translate(${deltaX1}px, ${deltaY1}px)`;
    node2.style.transform = `translate(${deltaX2}px, ${deltaY2}px)`;
    node1.style.transition = 'none';
    node2.style.transition = 'none';

    // Force reflow
    void node1.offsetWidth;

    // FLIP: Play
    const delay = getDelay();
    const animDuration = Math.max(10, delay * 0.8);

    node1.style.transition = `transform ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    node2.style.transition = `transform ${animDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`;
    node1.style.transform = '';
    node2.style.transform = '';

    await sleep(delay, signal);

    // Clean up
    node1.style.transition = '';
    node2.style.transition = '';
}

async function updateValue(i, newVal, signal) {
    const node = array[i].node;
    node.style.transition = 'transform 0.1s ease';
    node.style.transform = 'scale(1.2)';
    
    array[i].val = newVal;
    node.textContent = newVal;
    
    const delay = getDelay();
    await sleep(delay / 2, signal);
    
    node.style.transform = '';
    await sleep(delay / 2, signal);
    node.style.transition = '';
}

async function startSorting() {
    if (sorting) return;
    sorting = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    generateBtn.disabled = true;
    sizeSlider.disabled = true;
    
    abortController = new AbortController();
    const signal = abortController.signal;
    resetPass();
    updateHighlights();
    
    const algo = algoSelect.value;
    try {
        if (algo === 'bubble') {
            await bubbleSort(signal);
        } else if (algo === 'selection') {
            await selectionSort(signal);
        } else if (algo === 'insertion') {
            await insertionSort(signal);
        } else if (algo === 'merge') {
            await mergeSortWrapper(signal);
        } else if (algo === 'quick') {
            await quickSortWrapper(signal);
        }
        
        // Final render all sorted
        const sorted = array.map((_, i) => i);
        updateHighlights([], [], sorted);
    } catch (e) {
        if (e.name === 'AbortError') {
            console.log('Sorting stopped');
        } else {
            console.error(e);
        }
    } finally {
        sorting = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
        generateBtn.disabled = false;
        sizeSlider.disabled = false;
    }
}

function stopSorting() {
    if (abortController) {
        abortController.abort();
    }
}

// ================= Algorithms =================

async function bubbleSort(signal) {
    let n = array.length;
    let sortedIndices = [];
    let pass = 1;
    
    for (let i = 0; i < n - 1; i++) {
        updatePass(pass++);
        for (let j = 0; j < n - i - 1; j++) {
            updateHighlights([j, j + 1], [], sortedIndices);
            await sleep(getDelay(), signal);
            
            if (array[j].val > array[j + 1].val) {
                updateHighlights([], [j, j + 1], sortedIndices);
                await doSwap(j, j + 1, signal);
            }
        }
        sortedIndices.push(n - i - 1);
    }
    sortedIndices.push(0);
}

async function selectionSort(signal) {
    let n = array.length;
    let sortedIndices = [];
    let pass = 1;
    
    for (let i = 0; i < n - 1; i++) {
        updatePass(pass++);
        let min_idx = i;
        for (let j = i + 1; j < n; j++) {
            updateHighlights([min_idx, j], [], sortedIndices);
            await sleep(getDelay(), signal);
            
            if (array[j].val < array[min_idx].val) {
                min_idx = j;
            }
        }
        
        if (min_idx !== i) {
            updateHighlights([], [i, min_idx], sortedIndices);
            await doSwap(i, min_idx, signal);
        }
        sortedIndices.push(i);
    }
    sortedIndices.push(n - 1);
}

async function insertionSort(signal) {
    let n = array.length;
    let sortedIndices = [0];
    let pass = 1;
    
    for (let i = 1; i < n; i++) {
        updatePass(pass++);
        let j = i - 1;
        
        updateHighlights([i], [], sortedIndices);
        await sleep(getDelay(), signal);
        
        // Simulating insertion via adjacent swaps to visually show the physical movement
        while (j >= 0 && array[j].val > array[j+1].val) {
            updateHighlights([], [j, j + 1], sortedIndices);
            await doSwap(j, j + 1, signal);
            j--;
        }
        sortedIndices.push(i);
    }
}

async function mergeSortWrapper(signal) {
    let sortedIndices = [];
    let passCounter = 1;
    await mergeSort(0, array.length - 1, signal, sortedIndices, () => passCounter++);
}

async function mergeSort(l, r, signal, sortedIndices, getNextPass) {
    if (l >= r) return;
    let m = l + Math.floor((r - l) / 2);
    
    await mergeSort(l, m, signal, sortedIndices, getNextPass);
    await mergeSort(m + 1, r, signal, sortedIndices, getNextPass);
    await merge(l, m, r, signal, sortedIndices, getNextPass);
}

async function merge(l, m, r, signal, sortedIndices, getNextPass) {
    updatePass(getNextPass());
    let n1 = m - l + 1;
    let n2 = r - m;
    let L = new Array(n1);
    let R = new Array(n2);
    
    for (let i = 0; i < n1; i++) L[i] = array[l + i].val;
    for (let j = 0; j < n2; j++) R[j] = array[m + 1 + j].val;
    
    let i = 0, j = 0, k = l;
    while (i < n1 && j < n2) {
        updateHighlights([l + i, m + 1 + j], [], sortedIndices);
        await sleep(getDelay(), signal);
        
        if (L[i] <= R[j]) {
            updateHighlights([], [k], sortedIndices);
            await updateValue(k, L[i], signal);
            i++;
        } else {
            updateHighlights([], [k], sortedIndices);
            await updateValue(k, R[j], signal);
            j++;
        }
        k++;
    }
    
    while (i < n1) {
        updateHighlights([], [k], sortedIndices);
        await updateValue(k, L[i], signal);
        i++; k++;
    }
    while (j < n2) {
        updateHighlights([], [k], sortedIndices);
        await updateValue(k, R[j], signal);
        j++; k++;
    }
    
    for (let idx = l; idx <= r; idx++) {
        if (!sortedIndices.includes(idx) && l === 0 && r === array.length - 1) {
            sortedIndices.push(idx);
        }
    }
}

async function quickSortWrapper(signal) {
    let sortedIndices = [];
    let passCounter = 1;
    await quickSort(0, array.length - 1, signal, sortedIndices, () => passCounter++);
}

async function quickSort(low, high, signal, sortedIndices, getNextPass) {
    if (low < high) {
        updatePass(getNextPass());
        let pi = await partition(low, high, signal, sortedIndices);
        sortedIndices.push(pi);
        await quickSort(low, pi - 1, signal, sortedIndices, getNextPass);
        await quickSort(pi + 1, high, signal, sortedIndices, getNextPass);
    } else if (low === high) {
        sortedIndices.push(low);
    }
}

async function partition(low, high, signal, sortedIndices) {
    let pivot = array[high].val;
    let i = low - 1;
    
    for (let j = low; j <= high - 1; j++) {
        updateHighlights([j, high], [], sortedIndices);
        await sleep(getDelay(), signal);
        
        if (array[j].val < pivot) {
            i++;
            updateHighlights([], [i, j], sortedIndices);
            await doSwap(i, j, signal);
        }
    }
    
    updateHighlights([], [i + 1, high], sortedIndices);
    await doSwap(i + 1, high, signal);
    
    return i + 1;
}

// Start
document.addEventListener('DOMContentLoaded', init);
