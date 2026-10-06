import test from 'node:test';
import assert from 'node:assert/strict';
import {assess} from '../../src/trainer/learning/answers.js';

test('punctuation remains required by default and when explicitly enabled', () => {
  for (const options of [undefined, {requirePunctuation: true}]) {
    assert.equal(assess('Hello world', {answers: ['Hello, world!']}, options).correct, false);
    assert.equal(assess('  HELLO, WORLD!  ', {answers: ['Hello, world!']}, options).correct, true);
    assert.equal(assess('dont', {answers: ["don't"]}, options).correct, false);
  }
});

test('optional punctuation compares both input and solutions and retains original solutions', () => {
  for (const [typed, solution] of [
    ['Hello world', 'Hello, world!'], ['Hello, world?!', 'Hello world'],
    ['dont', "don't"], ['don’t', 'dont'], ['donʼt', 'dont'], ['icecream', 'ice-cream'],
    ['Hello world', '“Hello world…”'], ['Hello world', '(Hello world);:'],
  ]) {
    assert.deepEqual(assess(typed, {answers: [solution]}, {requirePunctuation: false}), {
      empty: false, correct: true, solutions: [solution],
    });
  }
});

test('optional punctuation still rejects letter errors and meaningful spaces and symbols', () => {
  for (const [typed, solution] of [
    ['helo', 'hello!'], ['ice cream', 'ice-cream'], ['abc', 'a bc'], ['one', 'one+'],
  ]) assert.equal(assess(typed, {answers: [solution]}, {requirePunctuation: false}).correct, false);
  assert.equal(assess('hello', {answers: ['hi!', 'hello!']}, {requirePunctuation: false}).correct, true);
});

test('punctuation alone cannot earn a correct answer when punctuation is optional', () => {
  for (const typed of ['', '   ', '.,!?—“”']) {
    const result = assess(typed, {answers: ['!!!', 'dog']}, {requirePunctuation: false});
    assert.equal(result.empty, true);
    assert.equal(result.correct, false);
  }
});
