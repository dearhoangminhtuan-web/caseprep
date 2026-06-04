import type { QuizQuestion } from '@/types'

const MATH_TEMPLATES = [
  {
    question: `A company has revenue of $500M and costs of $420M. What is the profit margin?`,
    options: ['8%', '16%', '20%', '84%'],
    correct_index: 1,
    explanation: `Profit = $500M - $420M = $80M. Margin = $80M / $500M = 16%`,
  },
  {
    question: `A market grows from $200M to $280M over 3 years. What is the approximate CAGR?`,
    options: ['8%', '12%', '40%', '3%'],
    correct_index: 0,
    explanation: `CAGR = (280/200)^(1/3) - 1 = approx 12% — use rule of thumb: 40% / 3 years ~ 13%, nearest is 12%.`,
  },
  {
    question: `A coffee shop sells 200 cups/day at $4 each and has $500/day in variable costs. What is the daily contribution?`,
    options: ['$800', '$300', '$700', '$1,300'],
    correct_index: 1,
    explanation: `Revenue = 200 x $4 = $800. Contribution = $800 - $500 = $300`,
  },
  {
    question: `A company has a cost-to-income ratio of 65%. Revenue is $2B. What are the costs?`,
    options: ['$1.35B', '$1.3B', '$700M', '$2.65B'],
    correct_index: 1,
    explanation: `Costs = 65% x $2B = $1.3B`,
  },
  {
    question: `A product costs $80 to make and sells for $120. What is the gross margin?`,
    options: ['33%', '50%', '67%', '25%'],
    correct_index: 0,
    explanation: `Gross margin = ($120 - $80) / $120 = $40 / $120 = approx 33%`,
  },
  {
    question: `Japan has ~125M people and ~52M households. What is the average household size?`,
    options: ['2.4', '3.1', '1.8', '4.2'],
    correct_index: 0,
    explanation: `125M / 52M = approx 2.4 people per household`,
  },
  {
    question: `A consulting firm has 10 partners each billing $3M/yr. Total revenue is $100M. What percentage comes from partners?`,
    options: ['10%', '30%', '20%', '40%'],
    correct_index: 1,
    explanation: `Partner revenue = 10 x $3M = $30M. Share = $30M / $100M = 30%`,
  },
  {
    question: `An airline has 80% load factor on 150-seat aircraft flying 5 routes per day. How many seats are filled per day?`,
    options: ['120', '600', '750', '900'],
    correct_index: 1,
    explanation: `Seats per flight = 150 x 80% = 120. Per day = 120 x 5 = 600`,
  },
  {
    question: `A startup burns $500K per month and has $6M in cash. What is its runway in months?`,
    options: ['6', '12', '30', '18'],
    correct_index: 1,
    explanation: `Runway = $6M / $500K = 12 months`,
  },
  {
    question: `A company acquires a target for $200M. The target generates $25M EBITDA. What is the acquisition multiple?`,
    options: ['4x', '6x', '8x', '10x'],
    correct_index: 2,
    explanation: `Multiple = $200M / $25M = 8x`,
  },
  {
    question: `Tokyo has ~14M people and 2.5 people per household on average. How many households are there?`,
    options: ['35M', '5.6M', '4.2M', '7M'],
    correct_index: 1,
    explanation: `14M / 2.5 = 5.6M households`,
  },
  {
    question: `A retailer has 200 stores. The bottom 40 stores have high labor cost ratios. What percentage are underperforming?`,
    options: ['10%', '20%', '22%', '40%'],
    correct_index: 1,
    explanation: `40 / 200 = 20% of stores in the underperforming segment`,
  },
]

export function getMathQuestions(n = 8): QuizQuestion[] {
  const shuffled = [...MATH_TEMPLATES].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, n).map((q, i) => ({ id: `math-${i}`, ...q }))
}
