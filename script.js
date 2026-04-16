document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("array-container");
  const sizeSlider = document.getElementById("size-slider");
  const speedSlider = document.getElementById("speed-slider");
  
  const generateBtn = document.getElementById("generate-btn");
  const stopBtn = document.getElementById("stop-btn");
  const manualBtn = document.getElementById("manual-btn");
  const customInput = document.getElementById("custom-input");
  const loadCustomBtn = document.getElementById("load-custom-btn");
  
  const compCountEl = document.getElementById("comp-count");
  const swapCountEl = document.getElementById("swap-count");
  const sizeCountEl = document.getElementById("size-count");
  const arrayTextEl = document.getElementById("array-text");
  
  const algoContainer = document.getElementById("algo-container");
  const algoBtns = {
    bubble: document.getElementById("bubble-btn"),
    selection: document.getElementById("selection-btn"),
    insertion: document.getElementById("insertion-btn"),
    merge: document.getElementById("merge-btn"),
    quick: document.getElementById("quick-btn"),
    heap: document.getElementById("heap-btn"),
    shell: document.getElementById("shell-btn"),
    cocktail: document.getElementById("cocktail-btn")
  };

  let array = [];
  let isSorting = false;
  let isStopped = false;
  let isManualMode = false;
  
  let comparisons = 0;
  let swaps = 0;
  let draggedIndex = null;
  
  let customMinVal = null;
  let customMaxVal = null;

  // Initialization
  function init() {
    generateArray();
  }

  function updateStats(c = 0, s = 0) {
    comparisons += c;
    swaps += s;
    compCountEl.innerText = comparisons;
    swapCountEl.innerText = swaps;
  }

  function updateArrayText() {
    if (customMinVal !== null) {
      const originals = array.map(v => Math.round(((v - 5) / 90) * (customMaxVal - customMinVal) + customMinVal));
      arrayTextEl.innerText = `[ ${originals.join(", ")} ]`;
    } else {
      arrayTextEl.innerText = `[ ${array.join(", ")} ]`;
    }
  }

  // Generate a new random array
  function generateArray() {
    if (isSorting) return;
    
    container.innerHTML = '';
    array = [];
    const size = parseInt(sizeSlider.value);
    sizeCountEl.innerText = size;
    
    comparisons = 0;
    swaps = 0;
    updateStats(0, 0);
    isStopped = false;
    customMinVal = null;
    
    for (let i = 0; i < size; i++) {
      const value = Math.floor(Math.random() * 95) + 5;
      array.push(value);
      createBar(value, size, i);
    }
    updateArrayText();
  }

  function createBar(value, size, index) {
      const bar = document.createElement("div");
      bar.classList.add("array-bar");
      bar.style.height = `${value}%`;
      bar.style.width = `${100 / size}%`;
      bar.style.margin = `0 ${20 / size}px`;
      bar.dataset.index = index;
      
      // Drag & Drop Setup
      bar.draggable = isManualMode;
      
      bar.addEventListener("dragstart", handleDragStart);
      bar.addEventListener("dragover", handleDragOver);
      bar.addEventListener("drop", handleDrop);
      bar.addEventListener("dragend", handleDragEnd);
      bar.addEventListener("dragenter", handleDragEnter);
      bar.addEventListener("dragleave", handleDragLeave);
      
      container.appendChild(bar);
  }

  // Helper to pause execution
  function sleep() {
    return new Promise((resolve, reject) => {
      if (isStopped) return reject("stopped");
      const speed = 101 - parseInt(speedSlider.value);
      setTimeout(() => {
          if (isStopped) return reject("stopped");
          resolve();
      }, speed * 2);
    });
  }

  function toggleUI(disabled) {
    isSorting = disabled;
    sizeSlider.disabled = disabled;
    generateBtn.disabled = disabled;
    manualBtn.disabled = disabled;
    customInput.disabled = disabled;
    loadCustomBtn.disabled = disabled;
    
    stopBtn.disabled = !disabled; // Enable stop button only during sorting
    
    for (let key in algoBtns) {
      algoBtns[key].disabled = disabled;
    }
  }

  async function swapNodes(i, j) {
    if (isStopped) throw "stopped";
    
    const bars = document.getElementsByClassName("array-bar");
    
    const tempHeight = bars[i].style.height;
    bars[i].style.height = bars[j].style.height;
    bars[j].style.height = tempHeight;

    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    
    updateStats(0, 1);
    updateArrayText();
  }
  
  function updateHeight(idx, heightVal) {
      if (isStopped) throw "stopped";
      const bars = document.getElementsByClassName("array-bar");
      bars[idx].style.height = `${heightVal}%`;
      array[idx] = heightVal;
      updateArrayText();
  }

  function setClass(idx, className) {
    const bars = document.getElementsByClassName("array-bar");
    if(bars[idx]) {
        bars[idx].className = `array-bar ${className}`;
        if(isManualMode) bars[idx].draggable = true;
    }
  }

  // --- Runner ---
  async function runSort(sortFn) {
      if (isSorting || isManualMode) return;
      isStopped = false;
      comparisons = 0;
      swaps = 0;
      updateStats(0, 0);
      toggleUI(true);
      
      try {
          // Reset all bar classes first
          const bars = document.getElementsByClassName("array-bar");
          for(let i=0; i<bars.length; i++) bars[i].className = "array-bar";
          
          await sortFn();
          
          // Mark all sorted at the end
          for(let i = 0; i < array.length; i++) {
              setClass(i, "sorted");
              if(i % 5 === 0) await sleep();
          }
      } catch (e) {
          if (e === "stopped") {
              console.log("Sorting halted by user.");
              // Remove active classes
          } else {
              console.error(e);
          }
      } finally {
          toggleUI(false);
          updateArrayText();
          
          const bars = document.getElementsByClassName("array-bar");
          for(let i=0; i<bars.length; i++) {
             let cl = bars[i].className.replace("compare", "").replace("swap", "").trim();
             bars[i].className = cl;
          }
      }
  }

  // --- Algorithms ---

  // 1. Bubble Sort
  async function bubbleSort() {
    const n = array.length;
    for (let i = 0; i < n - 1; i++) {
      for (let j = 0; j < n - i - 1; j++) {
        updateStats(1, 0);
        setClass(j, "compare");
        setClass(j + 1, "compare");
        await sleep();

        if (array[j] > array[j + 1]) {
          setClass(j, "swap");
          setClass(j + 1, "swap");
          await sleep();
          await swapNodes(j, j + 1);
        }

        setClass(j, "");
        setClass(j + 1, "");
      }
      setClass(n - i - 1, "sorted");
    }
    setClass(0, "sorted");
  }

  // 2. Selection Sort
  async function selectionSort() {
    const n = array.length;
    for (let i = 0; i < n; i++) {
      let minIdx = i;
      setClass(i, "compare");

      for (let j = i + 1; j < n; j++) {
        updateStats(1, 0);
        setClass(j, "compare");
        await sleep();

        if (array[j] < array[minIdx]) {
          if (minIdx !== i) setClass(minIdx, "");
          minIdx = j;
          setClass(minIdx, "swap");
        } else {
          setClass(j, "");
        }
      }

      if (minIdx !== i) {
        await swapNodes(i, minIdx);
        setClass(minIdx, "");
      }
      setClass(i, "sorted");
    }
  }

  // 3. Insertion Sort
  async function insertionSort() {
    const n = array.length;
    setClass(0, "sorted");
    
    for (let i = 1; i < n; i++) {
        let key = array[i];
        let j = i - 1;
        
        setClass(i, "compare");
        await sleep();

        while (j >= 0) {
            updateStats(1, 0);
            if (array[j] <= key) break;
            
            setClass(j, "swap");
            setClass(j + 1, "swap");
            await sleep();
            
            updateHeight(j + 1, array[j]);
            updateStats(0, 1);
            setClass(j, "sorted");
            setClass(j + 1, "sorted");
            j = j - 1;
        }
        updateHeight(j + 1, key);
        updateStats(0, 1);
        setClass(j + 1, "sorted");
        
        for(let k = 0; k <= i; k++) setClass(k, "sorted");
    }
  }

  // 4. Merge Sort
  async function mergeSortWrapper() { await mergeSort(0, array.length - 1); }
  
  async function mergeSort(l, r) {
      if (l >= r) return;
      const m = l + Math.floor((r - l) / 2);
      await mergeSort(l, m);
      await mergeSort(m + 1, r);
      await merge(l, m, r);
  }

  async function merge(l, m, r) {
      const n1 = m - l + 1;
      const n2 = r - m;
      let left = new Array(n1);
      let right = new Array(n2);

      for (let i = 0; i < n1; i++) left[i] = array[l + i];
      for (let j = 0; j < n2; j++) right[j] = array[m + 1 + j];

      let i = 0, j = 0, k = l;

      while (i < n1 && j < n2) {
          updateStats(1, 0);
          setClass(k, "compare");
          await sleep();

          if (left[i] <= right[j]) {
              updateHeight(k, left[i]);
              i++;
          } else {
              updateHeight(k, right[j]);
              j++;
          }
          updateStats(0, 1);
          setClass(k, "");
          k++;
      }

      while (i < n1) {
          setClass(k, "compare");
          await sleep();
          updateHeight(k, left[i]);
          updateStats(0,1);
          setClass(k, "");
          i++; k++;
      }

      while (j < n2) {
          setClass(k, "compare");
          await sleep();
          updateHeight(k, right[j]);
          updateStats(0,1);
          setClass(k, "");
          j++; k++;
      }
  }

  // 5. Quick Sort
  async function quickSortWrapper() { await quickSort(0, array.length - 1); }

  async function quickSort(low, high) {
      if (low < high) {
          const pi = await partition(low, high);
          await quickSort(low, pi - 1);
          await quickSort(pi + 1, high);
      } else if (low === high) {
          setClass(low, "sorted");
      }
  }

  async function partition(low, high) {
      const pivot = array[high];
      setClass(high, "swap"); 
      let i = low - 1;

      for (let j = low; j < high; j++) {
          updateStats(1, 0);
          setClass(j, "compare");
          await sleep();

          if (array[j] < pivot) {
              i++;
              if(i !== j) await swapNodes(i, j);
          }
          setClass(j, "");
      }
      
      await swapNodes(i + 1, high);
      setClass(high, "");
      setClass(i + 1, "sorted"); 
      return i + 1;
  }

  // 6. Heap Sort
  async function heapSort() {
      let n = array.length;
      for (let i = Math.floor(n / 2) - 1; i >= 0; i--) await heapify(n, i);
      for (let i = n - 1; i > 0; i--) {
          setClass(0, "swap"); setClass(i, "swap"); await sleep();
          await swapNodes(0, i);
          setClass(0, ""); setClass(i, "sorted");
          await heapify(i, 0);
      }
      setClass(0, "sorted");
  }

  async function heapify(n, i) {
      let largest = i; 
      let l = 2 * i + 1; 
      let r = 2 * i + 2; 
      
      if(l < n) {
          updateStats(1, 0);
          setClass(l, "compare"); setClass(largest, "compare"); await sleep();
          if(array[l] > array[largest]) largest = l;
          setClass(l, ""); setClass(largest, "");
      }
      
      if(r < n) {
           updateStats(1, 0);
           setClass(r, "compare"); setClass(largest, "compare"); await sleep();
           if(array[r] > array[largest]) largest = r;
           setClass(r, ""); setClass(largest, "");
      }
      
      if (largest !== i) {
          setClass(i, "swap"); setClass(largest, "swap"); await sleep();
          await swapNodes(i, largest);
          setClass(i, ""); setClass(largest, "");
          if (!isStopped) await heapify(n, largest);
      }
  }

  // 7. Shell Sort
  async function shellSort() {
      let n = array.length;
      for (let gap = Math.floor(n/2); gap > 0; gap = Math.floor(gap/2)) {
          for (let i = gap; i < n; i += 1) {
              let temp = array[i];
              let j;
              setClass(i, "compare");
              await sleep();
              
              for (j = i; j >= gap; j -= gap) {
                  updateStats(1, 0);
                  if (array[j - gap] <= temp) break;
                  
                  setClass(j - gap, "swap"); setClass(j, "swap"); await sleep();
                  updateHeight(j, array[j - gap]);
                  updateStats(0, 1);
                  setClass(j - gap, ""); setClass(j, "");
              }
              updateHeight(j, temp);
              updateStats(0, 1);
              setClass(i, "");
          }
      }
  }

  // 8. Cocktail Sort
  async function cocktailSort() {
      let swapped = true;
      let start = 0;
      let end = array.length;
      
      while (swapped) {
          swapped = false;
          for (let i = start; i < end - 1; ++i) {
              updateStats(1, 0);
              setClass(i, "compare"); setClass(i+1, "compare"); await sleep();
              if (array[i] > array[i + 1]) {
                  setClass(i, "swap"); setClass(i+1, "swap"); await sleep();
                  await swapNodes(i, i + 1);
                  swapped = true;
              }
              setClass(i, ""); setClass(i+1, "");
          }
          if (!swapped) break;
          
          swapped = false;
          end = end - 1;
          setClass(end, "sorted");
          
          for (let i = end - 1; i >= start; i--) {
              updateStats(1,0);
              setClass(i, "compare"); setClass(i+1, "compare"); await sleep();
              if (array[i] > array[i + 1]) {
                  setClass(i, "swap"); setClass(i+1, "swap"); await sleep();
                  await swapNodes(i, i + 1);
                  swapped = true;
              }
               setClass(i, ""); setClass(i+1, "");
          }
          setClass(start, "sorted");
          start = start + 1;
      }
  }

  // --- Manual Sort Handling ---
  
  function toggleManualMode() {
      if (isSorting) return;
      isManualMode = !isManualMode;
      
      if (isManualMode) {
          manualBtn.innerText = "Manual Mode: ON";
          manualBtn.classList.add("active");
          algoContainer.style.opacity = "0.5";
          algoContainer.style.pointerEvents = "none";
      } else {
          manualBtn.innerText = "Manual Mode: OFF";
          manualBtn.classList.remove("active");
          algoContainer.style.opacity = "1";
          algoContainer.style.pointerEvents = "auto";
      }
      
      const bars = document.getElementsByClassName("array-bar");
      for(let i=0; i<bars.length; i++) {
          bars[i].draggable = isManualMode;
          // Clear active classes if any
          bars[i].className = "array-bar";
      }
  }

  function handleDragStart(e) {
      if (!isManualMode) { e.preventDefault(); return; }
      draggedIndex = parseInt(e.target.dataset.index);
      e.target.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
  }

  function handleDragOver(e) {
      if (!isManualMode) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
  }
  
  function handleDragEnter(e) {
     if(!isManualMode) return;
     if(e.target.classList.contains("array-bar") && parseInt(e.target.dataset.index) !== draggedIndex) {
         e.target.classList.add("drag-over");
     }
  }
  
  function handleDragLeave(e) {
      if(!isManualMode) return;
      e.target.classList.remove("drag-over");
  }

  function handleDrop(e) {
      if (!isManualMode) return;
      e.stopPropagation();
      e.preventDefault();
      
      e.target.classList.remove("drag-over");
      
      // If we dropped on the container instead of a bar, ignore
      if (!e.target.classList.contains("array-bar")) return;

      const dropIndex = parseInt(e.target.dataset.index);
      
      if (draggedIndex !== null && draggedIndex !== dropIndex) {
          // Manual sync swap to skip async sleep
          const bars = document.getElementsByClassName("array-bar");
          const tempHeight = bars[draggedIndex].style.height;
          bars[draggedIndex].style.height = bars[dropIndex].style.height;
          bars[dropIndex].style.height = tempHeight;

          const temp = array[draggedIndex];
          array[draggedIndex] = array[dropIndex];
          array[dropIndex] = temp;
          
          updateStats(0, 1);
          updateArrayText();
          checkIfSorted();
      }
      
      return false;
  }

  function handleDragEnd(e) {
      if (!isManualMode) return;
      e.target.classList.remove("dragging");
      const bars = document.getElementsByClassName("array-bar");
      for(let i=0; i<bars.length; i++) {
          bars[i].classList.remove("drag-over");
      }
      draggedIndex = null;
  }
  
  function checkIfSorted() {
      let sorted = true;
      for(let i=0; i<array.length-1; i++) {
          if(array[i] > array[i+1]) {
              sorted = false;
              break;
          }
      }
      if(sorted) {
          const bars = document.getElementsByClassName("array-bar");
          for(let i=0; i<bars.length; i++) bars[i].className = "array-bar sorted";
          setTimeout(() => alert("Array is Sorted manually! Great job!"), 100);
      }
  }

  // --- External Input handling ---
  loadCustomBtn.addEventListener("click", () => {
      if (isSorting) return;
      const val = customInput.value;
      if (!val) return;
      
      const parsed = val.split(',').map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      if (parsed.length === 0) return alert("Please enter valid numbers formatted as comma-separated values.");
      
      // cap values proportionally or just limit max height. Since scale is 2-100%, let's just cap at 100 or find max.
      // Better: Scale them so max is 95% and min is 5%.
      let maxVal = Math.max(...parsed);
      let minVal = Math.min(...parsed);
      if (maxVal === minVal) { maxVal = minVal + 1; } // Prevent div by 0
      
      customMinVal = minVal;
      customMaxVal = maxVal;
      
      // Map input to height percentages for DOM. Store original in a separate logic or just keep percentages.
      // Wait, we mutate 'array', so if we scale them to 5-100 it's fine for visualization.
      const mapped = parsed.map(n => {
          let scaled = 5 + ((n - minVal) / (maxVal - minVal)) * 90;
          return { orig: n, height: scaled };
      });
      
      if (mapped.length > 200) {
          return alert("Please enter at most 200 numbers to maintain browser performance.");
      }
      
      generateCustomArray(mapped);
  });

  function generateCustomArray(mappedArr) {
      if (isSorting) return;
      
      container.innerHTML = '';
      array = mappedArr.map(m => m.height);
      const size = mappedArr.length;
      sizeCountEl.innerText = size;
      
      // Sync slider if possible, no big deal if out of bounds (just clamps visual)
      if (size >= 5 && size <= 100) sizeSlider.value = size;
      
      comparisons = 0;
      swaps = 0;
      updateStats(0, 0);
      isStopped = false;
      
      for (let i = 0; i < size; i++) {
        createBar(mappedArr[i].height, size, i);
      }
      // Re-map the text explicitly so we show the true user numbers instead of DOM percentages
      updateArrayText();
  }

  // --- Event Listeners ---
  generateBtn.addEventListener("click", generateArray);
  sizeSlider.addEventListener("input", generateArray);
  
  stopBtn.addEventListener("click", () => {
      isStopped = true;
  });
  
  manualBtn.addEventListener("click", toggleManualMode);
  
  algoBtns.bubble.addEventListener("click", () => runSort(bubbleSort));
  algoBtns.selection.addEventListener("click", () => runSort(selectionSort));
  algoBtns.insertion.addEventListener("click", () => runSort(insertionSort));
  algoBtns.merge.addEventListener("click", () => runSort(mergeSortWrapper));
  algoBtns.quick.addEventListener("click", () => runSort(quickSortWrapper));
  algoBtns.heap.addEventListener("click", () => runSort(heapSort));
  algoBtns.shell.addEventListener("click", () => runSort(shellSort));
  algoBtns.cocktail.addEventListener("click", () => runSort(cocktailSort));

  // Run on start
  init();
});
