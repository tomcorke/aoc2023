import fs from "fs";
import path from "path";

import { readFileSeparated, toNumber, expect } from "../helpers";
import { Solution } from "..";

const DAY = "07";

type Input = string[];
const parseInput = (values: string[]): Input =>
  values.filter((v) => v !== "").map((v) => v);

const getInput = readFileSeparated("\n", DAY, "input").then(parseInput);
const getTestInput = readFileSeparated("\n", DAY, "testInput").then(parseInput);

type Hand = number[];
type Bid = number;

type Player = {
  rawHand: string;
  hand: Hand;
  bid: number;
};

const faceValues: Record<string, number> = {
  T: 10,
  J: 11,
  Q: 12,
  K: 13,
  A: 14,
};

const cardValue = (card: string): number => {
  return faceValues[card] || Number(card);
};

const compareCardValues = (
  withWildcard: boolean,
  handA: Hand,
  handB: Hand
): number => {
  let vHandA = [...handA];
  let vHandB = [...handB];

  if (withWildcard) {
    // Swap joker values (11) for low value (0.5)
    vHandA = handA.map((c) => (c === 11 ? 0.5 : c));
    vHandB = handB.map((c) => (c === 11 ? 0.5 : c));
  }

  for (let i = 0; i < vHandA.length; i++) {
    const a = vHandA[i];
    const b = vHandB[i];
    const c = b - a;
    if (c !== 0) {
      return c;
    }
  }
  return 0;
};

const countCards = (
  cards: Set<number>,
  hand: Hand
): { card: number; count: number }[] => {
  return Array.from(cards)
    .map((c) => ({
      card: c,
      count: hand.filter((h) => h === c).length,
    }))
    .sort((a, b) =>
      a.count > b.count ? -1 : b.count > a.count ? 1 : b.card - a.card
    );
};

const compareHands = (
  withWildcard: boolean,
  handA: Hand,
  handB: Hand
): number => {
  let vHandA = [...handA];
  let vHandB = [...handB];

  if (withWildcard) {
    // Swap joker values (11) for low value (0.5)
    vHandA = handA.map((c) => (c === 11 ? 0.5 : c));
    vHandB = handB.map((c) => (c === 11 ? 0.5 : c));
  }

  let uniqueCardsA = new Set(vHandA);
  let uniqueCardsB = new Set(vHandB);

  // Remove low value jokers from unique cards so they don't count as their own highest group
  if (uniqueCardsA.size > 1) uniqueCardsA.delete(0.5);
  if (uniqueCardsB.size > 1) uniqueCardsB.delete(0.5);

  let countOfCardsA = countCards(uniqueCardsA, vHandA);
  let countOfCardsB = countCards(uniqueCardsB, vHandB);

  if (withWildcard) {
    // Swap jokers out for the best card in the hand
    const bestCardA = countOfCardsA[0].card;
    vHandA = vHandA.map((c) => (c === 0.5 ? bestCardA : c));
    const bestCardB = countOfCardsB[0].card;
    vHandB = vHandB.map((c) => (c === 0.5 ? bestCardB : c));
    // Re-count cards

    uniqueCardsA = new Set(vHandA);
    uniqueCardsB = new Set(vHandB);

    countOfCardsA = countCards(uniqueCardsA, vHandA);
    countOfCardsB = countCards(uniqueCardsB, vHandB);
  }

  if (uniqueCardsA.size < uniqueCardsB.size) {
    return -1;
  } else if (uniqueCardsB.size < uniqueCardsA.size) {
    return 1;
  }

  if (countOfCardsA[0].count > countOfCardsB[0].count) {
    return -1;
  }
  if (countOfCardsB[0].count > countOfCardsA[0].count) {
    return 1;
  }

  return compareCardValues(withWildcard, handA, handB);
};

const comparePlayerHands =
  (withWildcard: boolean = false) =>
  (a: Player, b: Player): number =>
    compareHands(withWildcard, a.hand, b.hand);

class Game {
  players: Player[] = [];
  constructor(input: Input) {
    for (const line of input) {
      const [rawHand, rawBid] = line.split(" ");
      this.players.push({
        rawHand,
        hand: rawHand.split("").map(cardValue),
        bid: Number(rawBid),
      });
    }
  }
  rankedPlayers(withWildcard: boolean = false) {
    return this.players
      .sort(comparePlayerHands(withWildcard))
      .map((p, i) => ({ ...p, rank: this.players.length - i }));
  }
  totalWinnings(withWildcard: boolean = false) {
    return this.rankedPlayers(withWildcard).reduce(
      (sum, p) => sum + p.rank * p.bid,
      0
    );
  }
}

const processPartOne = (input: Input): number => {
  const game = new Game(input);
  return game.totalWinnings();
};

const processPartTwo = (input: Input): number => {
  const game = new Game(input);
  console.log(game.rankedPlayers(true));
  fs.writeFileSync(
    path.join(__dirname, "output.txt"),
    game
      .rankedPlayers(true)
      .map((p) => p.rawHand)
      .join("\n")
  );
  return game.totalWinnings(true);
};

const solution: Solution = async () => {
  const input = await getInput;
  return processPartOne(input);
};

solution.tests = async () => {
  const testInput = await getTestInput;
  await expect(() => processPartOne(testInput), 6440);
  await expect(() => processPartTwo(testInput), 5905);
};

solution.partTwo = async () => {
  const input = await getInput;
  return processPartTwo(input);
};

solution.inputs = [getInput];

export default solution;
