document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("array-container");
  const sizeSlider = document.getElementById("size-slider");
  const speedSlider = document.getElementById("speed-slider");
  
  const generateBtn = document.getElementById("generate-btn");
  const stopBtn = document.getElementById("stop-btn");
  const manualBtn = document.getElementById("manual-btn");
  const customInput = document.getElementById("custom-input");
  const loadCustomBtn = document.getElementById("load-custom-btn");
  

  const algoSelect = document.getElementById("algo-select");
  
  const compCountEl = document.getElementById("comp-count");
  const swapCountEl = document.getElementById("swap-count");
  const sizeCountEl = document.getElementById("size-count");
  const timerStat = document.getElementById("timer-stat");
  const timerCount = document.getElementById("timer-count");
  const arrayTextEl = document.getElementById("array-text");

  let array = [];
  let isSorting = false;
  let isStopped = false;
  let isManualMode = false;
  
  let comparisons = 0;
  let swaps = 0;
  let draggedIndex = null;
  
  let customMinVal = null;
  let customMaxVal = null;

  let timerInterval = null;
  let startTime = 0;

  // Frame Capture Variables
  let isCapturing = false;
  let frames = [];
  let currentFrame = 0;
  let playTimeout = null;
  let virtualHeights = [];
  let virtualClasses = [];
  let isPlaying = false;

  const prevBtn = document.getElementById("prev-btn");
  const playPauseBtn = document.getElementById("play-pause-btn");
  const nextBtn = document.getElementById("next-btn");

  function setPlayPauseState(state) {
    if (!playPauseBtn) return;
    if (state === 'idle') {
      playPauseBtn.innerText = '\u25b6 Start Sort';
      playPauseBtn.classList.add('btn-primary');
      playPauseBtn.style.fontWeight = 'bold';
      playPauseBtn.disabled = false;
    } else if (state === 'sorting') {
      playPauseBtn.innerText = '\u23f3 Sorting...';
      playPauseBtn.classList.remove('btn-primary');
      playPauseBtn.disabled = true;
    } else if (state === 'playing') {
      playPauseBtn.innerText = '\u23f8 Pause';
      playPauseBtn.classList.add('btn-primary');
      playPauseBtn.disabled = false;
    } else if (state === 'paused') {
      playPauseBtn.innerText = '\u25b6 Resume';
      playPauseBtn.classList.remove('btn-primary');
      playPauseBtn.disabled = false;
    }
  }

  function startTimer() {
      timerStat.style.display = "flex";
      startTime = Date.now();
      timerInterval = setInterval(() => {
          let elapsed = (Date.now() - startTime) / 1000;
          timerCount.innerText = elapsed.toFixed(1) + "s";
      }, 100);
  }

  function stopTimer() {
      if (timerInterval) clearInterval(timerInterval);
  }

  // Initialization
  function init() {
    generateArray();
    updateComplexityInfo();
  }

  function analyzeArrayAndSuggest(arr) {
      if (!arr || arr.length === 0) return;
      const n = arr.length;
      
      let inversions = 0;
      let isReverse = true;
      let sorted = true;
      for (let i = 0; i < n - 1; i++) {
          if (arr[i] > arr[i + 1]) sorted = false;
          if (arr[i] < arr[i + 1]) isReverse = false;
      }
      
      for (let i = 0; i < n; i++) {
          for (let j = i + 1; j < n; j++) {
              if (arr[i] > arr[j]) inversions++;
          }
      }
      
      let maxInversions = (n * (n - 1)) / 2;
      let suggestion = "";
      let algoValue = "quick";
      
      if (sorted && n > 1) {
          suggestion = "Already sorted! Insertion Sort parses this in O(n) speed.";
          algoValue = "insertion";
      } else if (n <= 15) {
          suggestion = "Tiny dataset! Insertion Sort is exceptionally fast due to low overhead.";
          algoValue = "insertion";
      } else if (inversions <= n * 1.5) {
          suggestion = "Nearly sorted! Insertion Sort handles this beautifully.";
          algoValue = "insertion";
      } else if (isReverse || inversions > maxInversions * 0.8) {
          suggestion = "Heavily reversed data. Merge Sort securely executes in O(n log n).";
          algoValue = "merge";
      } else {
          suggestion = "Large randomized data. Quick Sort boasts highly optimal average speeds.";
          algoValue = "quick";
      }
      
      const suggEl = document.getElementById("algo-suggestion");
      const btn = document.getElementById("apply-sugg-btn");
      
      if(suggEl) suggEl.innerText = suggestion;
      if(btn) {
          btn.onclick = () => {
              if (isSorting) return;
              const sel = document.getElementById("algo-select");
              sel.value = algoValue;
              sel.style.boxShadow = "0 0 10px #a78bfa";
              sel.style.borderColor = "#a78bfa";
              setTimeout(() => { sel.style.boxShadow = ""; sel.style.borderColor = ""; }, 1000);
          };
      }
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
    frames = [];
    currentFrame = 0;
    customMinVal = null;
    
    for (let i = 0; i < size; i++) {
      const value = Math.floor(Math.random() * 95) + 5;
      array.push(value);
      createBar(value, size, i);
    }
    updateArrayText();
    analyzeArrayAndSuggest(array);
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
    if (isCapturing) {
        frames.push({
            heights: [...virtualHeights],
            classes: [...virtualClasses],
            comparisons: comparisons,
            swaps: swaps,
            arrayVals: [...array]
        });
        return Promise.resolve();
    }
    return new Promise((resolve) => resolve());
  }

  function toggleUI(disabled) {
    isSorting = disabled;
    sizeSlider.disabled = disabled;
    generateBtn.disabled = disabled;
    manualBtn.disabled = disabled;
    customInput.disabled = disabled;
    loadCustomBtn.disabled = disabled;
    
    stopBtn.disabled = !disabled;
    algoSelect.disabled = disabled;
    if (disabled) setPlayPauseState('sorting');
  }

  async function swapNodes(i, j) {
    if (isCapturing) {
        let tempH = virtualHeights[i];
        virtualHeights[i] = virtualHeights[j];
        virtualHeights[j] = tempH;
    } else {
        const bars = document.getElementsByClassName("array-bar");
        const tempHeight = bars[i].style.height;
        bars[i].style.height = bars[j].style.height;
        bars[j].style.height = tempHeight;
    }

    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
    
    updateStats(0, 1);
    if (!isCapturing) updateArrayText();
  }
  
  function updateHeight(idx, heightVal) {
      if (isCapturing) {
          virtualHeights[idx] = `${heightVal}%`;
      } else {
          const bars = document.getElementsByClassName("array-bar");
          bars[idx].style.height = `${heightVal}%`;
      }
      array[idx] = heightVal;
      if (!isCapturing) updateArrayText();
  }

  function setClass(idx, className) {
      if (isCapturing) {
          virtualClasses[idx] = `array-bar ${className}`;
      } else {
        const bars = document.getElementsByClassName("array-bar");
        if(bars[idx]) {
            bars[idx].className = `array-bar ${className}`;
            if(isManualMode) bars[idx].draggable = true;
        }
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
      timerStat.style.display = "none";
      
      const bars = document.getElementsByClassName("array-bar");
      virtualHeights = [];
      virtualClasses = [];
      for(let i=0; i<bars.length; i++) {
          virtualHeights.push(bars[i].style.height);
          virtualClasses.push("array-bar");
      }
      
      isCapturing = true;
      frames = [];
      currentFrame = 0;
      let originalArray = [...array];
      
      try {
          await sortFn();
          for(let i = 0; i < array.length; i++) {
              setClass(i, "sorted");
              await sleep();
          }
      } catch (e) {
          console.error(e);
      }
      
      isCapturing = false;
      array = originalArray; // restore logical array so renderer uses true values from frames
      
      isPlaying = true;
      setPlayPauseState('playing');
      if (prevBtn) prevBtn.disabled = false;
      if (nextBtn) nextBtn.disabled = false;
      
      playFrames();
  }

  function getSpeedMs() {
      return (101 - parseInt(speedSlider.value)) * 2;
  }

  function playFrames() {
      if (!isPlaying || currentFrame >= frames.length || isStopped) {
          if (currentFrame >= frames.length || isStopped) {
            finishPlayback();
          }
          return;
      }
      renderFrame(currentFrame);
      currentFrame++;
      playTimeout = setTimeout(playFrames, getSpeedMs());
  }

  function finishPlayback() {
      isPlaying = false;
      clearTimeout(playTimeout);
      frames = [];
      currentFrame = 0;
      toggleUI(false);
      setPlayPauseState('idle');
      if (prevBtn) prevBtn.disabled = true;
      if (nextBtn) nextBtn.disabled = true;
      
      const bars = document.getElementsByClassName("array-bar");
      for(let i=0; i<bars.length; i++) {
          let cl = bars[i].className.replace("compare", "").replace("swap", "").trim();
          bars[i].className = cl;
      }
  }

  function renderFrame(index) {
      if (!frames[index]) return;
      const f = frames[index];
      const bars = document.getElementsByClassName("array-bar");
      for(let i=0; i<bars.length; i++) {
         bars[i].style.height = f.heights[i];
         bars[i].className = f.classes[i];
      }
      compCountEl.innerText = f.comparisons;
      swapCountEl.innerText = f.swaps;
      
      if (customMinVal !== null) {
        const originals = f.arrayVals.map(v => Math.round(((v - 5) / 90) * (customMaxVal - customMinVal) + customMinVal));
        arrayTextEl.innerText = `[ ${originals.join(", ")} ]`;
      } else {
        arrayTextEl.innerText = `[ ${f.arrayVals.join(", ")} ]`;
      }
  }

  const complexities = {
      bubble: { algo: "Bubble Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
      selection: { algo: "Selection Sort", best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
      insertion: { algo: "Insertion Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
      merge: { algo: "Merge Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
      quick: { algo: "Quick Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
      heap: { algo: "Heap Sort", best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
      shell: { algo: "Shell Sort", best: "O(n log n)", avg: "O(n(log n)²)", worst: "O(n(log n)²)", space: "O(1)" },
      cocktail: { algo: "Cocktail Sort", best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" }
  };

  let chartInstance = null;

  function updateComplexityInfo() {
      const selected = algoSelect.value;
      drawComplexityChart(selected);
  }

  function drawComplexityChart(selected) {
      const canvas = document.getElementById("complexity-chart");
      if (!canvas) return;
      
      const c = complexities[selected];
      const isOn = c.worst === "O(n)";
      const isOnLogn = c.worst.includes("log n");
      const isOn2 = c.worst.includes("n²") || c.worst.includes("(log n)²");

      const labels = Array.from({length: 20}, (_, i) => i + 1);
      
      // Calculate datasets
      const dataOn = labels.map(x => x);
      const dataOnLogn = labels.map(x => x * Math.log2(x + 1));
      const dataOn2 = labels.map(x => (x * x) / 4); // scaled slightly for visual balance
      
      if (chartInstance) {
          chartInstance.destroy();
      }
      
      // Check if Chart is defined (in case of CDN failure)
      if (typeof Chart === 'undefined') return;

      chartInstance = new Chart(canvas, {
          type: 'line',
          data: {
              labels: labels,
              datasets: [
                  {
                      label: 'O(n)',
                      data: dataOn,
                      borderColor: isOn ? 'rgba(52, 211, 153, 1)' : 'rgba(52, 211, 153, 0.3)',
                      borderWidth: isOn ? 3 : 1.5,
                      borderDash: isOn ? [] : [5, 5],
                      tension: 0.4,
                      pointRadius: 0
                  },
                  {
                      label: 'O(n log n)',
                      data: dataOnLogn,
                      borderColor: isOnLogn ? 'rgba(167, 139, 250, 1)' : 'rgba(167, 139, 250, 0.3)',
                      borderWidth: isOnLogn ? 3 : 1.5,
                      borderDash: isOnLogn ? [] : [5, 5],
                      tension: 0.4,
                      pointRadius: 0
                  },
                  {
                      label: 'O(n²)',
                      data: dataOn2,
                      borderColor: isOn2 ? 'rgba(248, 113, 113, 1)' : 'rgba(248, 113, 113, 0.3)',
                      borderWidth: isOn2 ? 3 : 1.5,
                      borderDash: isOn2 ? [] : [5, 5],
                      tension: 0.4,
                      pointRadius: 0
                  }
              ]
          },
          options: {
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                  legend: {
                      labels: { color: 'rgba(255, 255, 255, 0.7)' }
                  },
                  title: {
                      display: true,
                      text: `Time Complexity Profile: ${c.algo}`,
                      color: 'rgba(255, 255, 255, 0.9)',
                      font: { size: 16 }
                  }
              },
              scales: {
                  x: {
                      title: { display: true, text: 'Data Size (n)', color: 'rgba(255, 255, 255, 0.7)' },
                      ticks: { color: 'rgba(255, 255, 255, 0.5)' },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  },
                  y: {
                      title: { display: true, text: 'Operations (Time)', color: 'rgba(255, 255, 255, 0.7)' },
                      ticks: { display: false },
                      grid: { color: 'rgba(255, 255, 255, 0.1)' }
                  }
              }
          }
      });
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
          generateArray(); // Start fresh array to sort before enabling manual mode
          manualBtn.innerText = "Manual Mode: ON";
          manualBtn.classList.add("active");
          algoSelect.disabled = true;
          if (playPauseBtn) playPauseBtn.disabled = true;
          timerCount.innerText = "0.0s";
          startTimer();
      } else {
          manualBtn.innerText = "Manual Mode: OFF";
          manualBtn.classList.remove("active");
          algoSelect.disabled = false;
          setPlayPauseState('idle');
          stopTimer();
          timerStat.style.display = "none";
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
          stopTimer();
          setTimeout(() => alert("Array is Sorted manually! Great job!\nTime taken: " + timerCount.innerText), 100);
          
          isManualMode = false;
          manualBtn.innerText = "Manual Mode: OFF";
          manualBtn.classList.remove("active");
          algoSelect.disabled = false;
          setPlayPauseState('idle');
          for(let i=0; i<bars.length; i++) bars[i].draggable = false;
      }
  }

  // --- External Input handling ---
  loadCustomBtn.addEventListener("click", () => {
      if (isSorting) return;
      const val = customInput.value;
      if (!val) return;
      
      const parsed = val.split(/[\s,]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
      if (parsed.length === 0) return alert("Please enter valid numbers formatted as comma or space-separated values.");
      
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
      analyzeArrayAndSuggest(array);
  }

  // --- Event Listeners ---
  generateBtn.addEventListener("click", generateArray);
  sizeSlider.addEventListener("input", generateArray);
  algoSelect.addEventListener("change", updateComplexityInfo);
  
  stopBtn.addEventListener("click", () => {
      isStopped = true;
      isPlaying = false;
      clearTimeout(playTimeout);
      finishPlayback();
  });
  
  if (playPauseBtn) {
      playPauseBtn.addEventListener("click", () => {
          // Idle state — no frames yet, start a new sort
          if (frames.length === 0 && !isSorting) {
              const selected = algoSelect.value;
              if (selected === "bubble") runSort(bubbleSort);
              else if (selected === "selection") runSort(selectionSort);
              else if (selected === "insertion") runSort(insertionSort);
              else if (selected === "merge") runSort(mergeSortWrapper);
              else if (selected === "quick") runSort(quickSortWrapper);
              else if (selected === "heap") runSort(heapSort);
              else if (selected === "shell") runSort(shellSort);
              else if (selected === "cocktail") runSort(cocktailSort);
              return;
          }
          // Playing/Paused toggle
          isPlaying = !isPlaying;
          if (isPlaying) {
              setPlayPauseState('playing');
              playFrames();
          } else {
              setPlayPauseState('paused');
              clearTimeout(playTimeout);
          }
      });
  }

  if (prevBtn) {
      prevBtn.addEventListener("click", () => {
          if (isPlaying) { isPlaying = false; setPlayPauseState('paused'); clearTimeout(playTimeout); }
          if (currentFrame > 0) {
              currentFrame--;
              renderFrame(currentFrame);
          }
      });
  }

  if (nextBtn) {
      nextBtn.addEventListener("click", () => {
          if (isPlaying) { isPlaying = false; setPlayPauseState('paused'); clearTimeout(playTimeout); }
          if (currentFrame < frames.length - 1) {
              currentFrame++;
              renderFrame(currentFrame);
          }
      });
  }
  
  manualBtn.addEventListener("click", toggleManualMode);

  // Run on start
  init();
});
