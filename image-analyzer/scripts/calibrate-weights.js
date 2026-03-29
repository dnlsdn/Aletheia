#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('fs');
const path = require('path');

// Dataset format:
// [
//   {
//     "label": "ai" | "real",
//     "scores": {
//       "groq": 0.0-1.0,
//       "gemini": 0.0-1.0,
//       "hf_heem": 0.0-1.0,
//       "hf_organika": 0.0-1.0,
//       "metadata": 0.0-1.0,
//       "reverse": 0.0-1.0
//     }
//   }
// ]

const inputPath = process.argv[2] || path.join(process.cwd(), 'datasets', 'ai-detection-benchmark.json');
const iterations = Number(process.argv[3] || 20000);

if (!fs.existsSync(inputPath)) {
  console.error(`Dataset not found: ${inputPath}`);
  process.exit(1);
}

const rows = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
if (!Array.isArray(rows) || rows.length === 0) {
  console.error('Dataset is empty or invalid.');
  process.exit(1);
}

const KEYS = ['groq', 'gemini', 'hf_heem', 'hf_organika', 'metadata', 'reverse'];

function clamp(v, min = 0, max = 1) {
  return Math.max(min, Math.min(max, v));
}

function normalizeWeights(weights) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0);
  if (sum === 0) return weights;
  const out = {};
  for (const key of Object.keys(weights)) out[key] = weights[key] / sum;
  return out;
}

function predict(row, weights) {
  let totalWeight = 0;
  let weighted = 0;
  for (const key of KEYS) {
    const score = row.scores?.[key];
    if (typeof score !== 'number') continue;
    weighted += clamp(score) * weights[key];
    totalWeight += weights[key];
  }
  return totalWeight ? weighted / totalWeight : 0.5;
}

function evalConfig(weights, aiThreshold, realThreshold) {
  let tp = 0;
  let tn = 0;
  let fp = 0;
  let fn = 0;
  let uncertain = 0;

  for (const row of rows) {
    const score = predict(row, weights);
    const gold = row.label === 'ai' ? 1 : 0;
    let pred;
    if (score >= aiThreshold) pred = 1;
    else if (score <= realThreshold) pred = 0;
    else pred = -1;

    if (pred === -1) {
      uncertain++;
      continue;
    }
    if (pred === 1 && gold === 1) tp++;
    if (pred === 0 && gold === 0) tn++;
    if (pred === 1 && gold === 0) fp++;
    if (pred === 0 && gold === 1) fn++;
  }

  const precision = tp + fp ? tp / (tp + fp) : 0;
  const recall = tp + fn ? tp / (tp + fn) : 0;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  const covered = rows.length - uncertain;
  const coverage = covered / rows.length;
  const accuracy = covered ? (tp + tn) / covered : 0;

  // Objective: maximize F1 while keeping high coverage
  const objective = f1 * 0.8 + coverage * 0.2;
  return { objective, f1, precision, recall, accuracy, coverage, uncertain, tp, tn, fp, fn };
}

let best = null;
for (let i = 0; i < iterations; i++) {
  const rawWeights = {};
  for (const key of KEYS) rawWeights[key] = Math.random();
  const weights = normalizeWeights(rawWeights);
  const aiThreshold = 0.6 + Math.random() * 0.25; // 0.60 - 0.85
  const realThreshold = 0.15 + Math.random() * 0.25; // 0.15 - 0.40
  if (realThreshold >= aiThreshold) continue;

  const metrics = evalConfig(weights, aiThreshold, realThreshold);
  if (!best || metrics.objective > best.metrics.objective) {
    best = { weights, aiThreshold, realThreshold, metrics };
  }
}

if (!best) {
  console.error('Calibration failed.');
  process.exit(1);
}

console.log('\nBest calibration found:\n');
console.log(JSON.stringify(best, null, 2));
