<div align="center">
  <img src="public/vite.svg" alt="CS EdTech Logo" width="100"/>
  <h1>CS EdTech Platform</h1>
  <p><strong>An advanced, interactive computer science and networking education platform built with React, Vite, and Framer Motion.</strong></p>
  
  [![React](https://img.shields.io/badge/React-18.0+-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0+-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Zustand](https://img.shields.io/badge/Zustand-State-orange?style=for-the-badge)](https://zustand-demo.pmnd.rs/)
</div>

<br/>

## 🌟 Overview

The **CS EdTech Platform** is a flagship visualization suite that allows students and developers to interactively learn complex computer science algorithms, network protocols, operating system mechanisms, and digital logic concepts. Featuring a high-end "Dark Academic Lab" aesthetic, the platform leverages Framer Motion for buttery-smooth algorithm stepping and state visualization.

---

## 🚀 Interactive Modules

The platform is divided into 6 uniquely styled, interactive learning modules:

### 1. Algorithms (PATHFINDER v2.1)
- **Graph Traversal Visualization**: Watch algorithms like **BFS**, **DFS**, **Dijkstra**, and **A*** hunt for the shortest path on a customizable grid.
- **Interactive Painting**: Draw impassable walls and high-cost weight nodes (for Dijkstra/A* evaluation).
- **Race Mode**: Pit 4 algorithms against each other simultaneously in a 2x2 split-screen to directly compare time complexity and heuristic efficiency.

### 2. Data Structures (MEM://HEAP_VISUALIZER)
- **Sorting Algorithms**: Visualize **Heap Sort**, **Quick Sort**, **Shell Sort**, **Counting Sort**, **Radix Sort**, and more in real-time.
- **Analytics Engine**: Real-time counters for Array Accesses, Swaps, and theoretical Best/Average/Worst-Case time complexities.
- **Linked Lists Sandbox**: Construct and manipulate custom linked lists memory block by memory block (visualizing HEAD to NULL pointers).

### 3. Signals & Systems (OSC-LAB)
- **Oscilloscope Simulator**: Add, tweak, and combine trigonometric waveforms `y = A*sin(B*x + C)`.
- **Modulation**: Explore Amplitude Modulation (AM) and Frequency Modulation (FM). 
- **Time vs. Frequency Domains**: Analyze synthesized signals in both the time domain and directly via discrete frequency histograms.

### 4. Discrete Math & Logic (✧ LOGIC FORGE ✧)
- **Predicate Sandbox**: Evaluate first-order logic formulas dynamically using truth tables and Venn-like logic diagrams.
- **Proof Workbench**: Build formal logic proofs using exactly modeled inference rules (Modus Ponens, Hypothetical Syllogism).
- **Automated Solvers**: Test Direct Proofs, Forward Chaining, Backward Chaining, and Resolution logical models with step-by-step playback evaluation.

### 5. Networks (NETWORK MONITOR)
- **Data Link Protocol Simulator**: Simulates frame streaming between a Sender and Receiver over an unreliable channel.
- **ARQ Flow Control**: Deep-dive into sliding window protocols like **Stop-and-Wait**, **Go-Back-N**, and **Selective Repeat**.
- **Error Injection**: Inject arbitrary packet drop or acknowledgment loss probabilities and let the visualizations dynamically calculate retransmission efficiency.
- **Error Detection**: Construct raw bitstreams with Even/Odd Parity, Checksum, and CRC (Cyclic Redundancy Check) generators.

### 6. Operating Systems (SYSTEM MONITOR)
- **Deadlock Visualization**: Dynamically build Resource Allocation Graphs (RAG) with Draggable Processes and Resources.
- **Cycle Detection**: Single-instance deadlock detection using Wait-For recursive DFS.
- **Banker's Algorithm**: Multi-instance resource safety calculation utilizing an interactive Allocation/Request/Available matrix.

---

## 🛠 Tech Stack

- **Framework**: [React 18](https://react.dev/) via [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/) (Strict Mode)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) (Modular slice architecture)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: Vanilla CSS Variables (Tokens, theming engines, and CSS modules)

---

## ⚙️ Installation & Setup

Ensure you have [Node.js](https://nodejs.org/en/) (v18+) installed.

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/cs-edtech.git
   cd cs-edtech
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The site will be running locally at `http://localhost:5173`.

4. **Build for production**
   ```bash
   npm run build
   ```

---

## ⌨️ Global Keyboard Shortcuts

The app includes an invisible shortcut engine to navigate the modules quickly:

| Key Binding | Action |
|-------------|--------|
| `1` - `6`   | Instantly jump between modules (Pathfinding, Data Structures, etc.) |
| `H`         | Return to the Home Dashboard |
| `Space`     | Play/Pause the current active algorithm (Pathfinding/Sorting/ARQ) |
| `←` / `→`   | Step backward/forward in visualizations |
| `R`         | Reset the current module's canvas |
| `?`         | Toggle the Keyboard Shortcuts overlay |
| `Ctrl+Shift+D`| Toggle Global Light/Dark aesthetic themes |

---

## 👤 Credits

**Created by: Sreeansh Dash**

Designed with passion for the academic community to make lower-level computer science concepts beautiful, interactive, and easy to digest.
