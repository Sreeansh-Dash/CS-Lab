<div align="center">
  <h1>CS Lab: Interactive EdTech Platform</h1>
  <p><strong>A premium, high-fidelity visualization suite for computer science and networking education.</strong></p>
  
  [![React](https://img.shields.io/badge/React-18.0+-blue?style=for-the-badge&logo=react)](https://react.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.0+-purple?style=for-the-badge&logo=vite)](https://vitejs.dev/)
  [![Framer Motion](https://img.shields.io/badge/Framer_Motion-11.0+-pink?style=for-the-badge)](https://www.framer.com/motion/)
</div>

<br/>

## 🌟 Overview

**CS Lab** is an advanced interactive learning environment designed to make complex computer science concepts intuitive through high-fidelity visualizations. Built with a "Science-Fiction Lab" aesthetic, the platform provides deep-dive simulations for algorithms, data structures, signals, networking protocols, and operating systems.

---

## 🚀 Interactive Modules

The platform features six specialized laboratories, each with its own unique personality and interactive toolkit:

### 1. ◉ Pathfinding Playground (v3.0)
- **Advanced Graph Search**: Visualize **BFS**, **DFS**, **Dijkstra**, and **A*** with real-time heuristic evaluations.
- **HUD Interface**: Draw walls, erase nodes, and place start/end points using a glassmorphic tool panel.
- **Race Mode**: Compare up to 4 algorithms simultaneously in a synchronized 2x2 grid to see which one finds the optimal path first.
- **Heuristics**: Customizable A* distance metrics (Manhattan, Euclidean, Chebyshev).

### 2. ◈ Data Structures: Memory & Flow
- **The Sorting Race**: Visual comparison of 9 algorithms: **Insertion**, **Selection**, **Bubble**, **Heap**, **Quick**, **Merge**, **Shell**, **Counting**, and **Radix** sort.
- **Linked List Sandbox**: Interactive memory block visualization. Add, remove, and link nodes to understand pointer manipulation (HEAD → NEXT → NULL).

### 3. ∿ Signals & Systems (OSC-LAB)
- **Domain Transformation**: Switch between **Time Domain** (oscilloscope) and **Frequency Domain** (FFT-based histograms).
- **Modulation Station**: Explore signal processing through Amplitude Modulation (AM) and Frequency Modulation (FM) visualizations.

### 4. ∀ Discrete Math & Logic (✧ LOGIC FORGE ✧)
- **Predicate Playground**: Build and evaluate first-order logic formulas dynamically. 
- **Existential/Universal Quantifiers**: Visualize witness and counterexample sets for `∃x` and `∀x` predicates.
- **Logic Simulator**: Use Venn-style diagrams and truth tables to verify complex logical propositions.

### 5. ⊻ Computer Networks (NETWORK MONITOR)
- **ARQ Protocol Laboratory**: Deep-dive into sliding window flow control including **Stop-and-Wait**, **Go-Back-N**, and **Selective Repeat**.
- **Error Injection**: Simulate unreliable channels by injecting packet loss or ACK corruption and observing protocol recovery.
- **Bitstream Integrity**: Comprehensive visualizers for **Even/Odd Parity**, **Checksum**, and **CRC (Cyclic Redundancy Check)** generators.

### 6. ◎ Operating Systems (SYSTEM MONITOR)
- **Deadlock RAG Explorer**: Construct and manipulate Resource Allocation Graphs (RAG) with draggable processes and resources.
- **Safety Engine**: Interactive implementation of the **Banker's Algorithm** with live Allocation/Request/Available matrix updates.
- **Cycle Detection**: Real-time graph analysis using recursive DFS to identify circular wait conditions.

---

## ✨ Upcoming Features (Roadmap)
- [ ] **V4 UI Overhaul**: Full mobile responsiveness and tablet-optimized HUDs.
- [ ] **Global TOC**: Interactive Table of Contents sidebar for rapid module sub-feature navigation.
- [ ] **Heuristic Game Search**: Visualization of Mini-Max and Alpha-Beta Pruning for Tic-Tac-Toe and Chess.
- [ ] **Multi-User Lab**: Real-time collaborative algorithm sessions via WebSockets.
- [ ] **New Sections & Much More**

---

## 🛠 Tech Stack
- **Framework**: [React 18](https://react.dev/) + [Vite](https://vitejs.dev/)
- **State Management**: [Zustand](https://github.com/pmndrs/zustand)
- **Motion**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: Vanilla CSS (Variables & Design Tokens)

---

## ⚙️ Installation

1. **Clone & Install**
   ```bash
   git clone https://github.com/your-username/edtech.git
   cd edtech
   npm install
   ```
2. **Development**
   ```bash
   npm run dev
   ```
3. **Build**
   ```bash
   npm run build
   ```
---

## 👤 Credits & Support
**Author: Sreeansh Dash**

Designed to make computer science beautiful and accessible. 
If you find this helpful, consider starring the repo! ⭐
