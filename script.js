// Number of holes in code
const HOLES = 5;
// Number of guesses allowed
const MAX_GUESSES = 8;

// DOM elements
const secretRow = document.getElementById('secretRow');
const lockCodeBtn = document.getElementById('lockCodeBtn');
const board = document.getElementById('board');
const feedback = document.getElementById('feedback');
const checkGuessBtn = document.getElementById('checkGuessBtn');
const statusDiv = document.getElementById('status');
const finalCodeDiv = document.getElementById('finalCode');
const finalCodeRow = document.getElementById('finalCodeRow');

// Data structures
let secretCode = new Array(HOLES).fill(null);
let currentGuessRow = 0;
let guesses = []; // each guess is an array of color strings
let gameLocked = false; // to indicate if the secret code is locked
let gameOver = false;

// Create guess rows + feedback rows
function setupBoard() {
  board.innerHTML = '';
  feedback.innerHTML = '';
  for (let r = 0; r < MAX_GUESSES; r++) {
    // Create row of holes
    const rowDiv = document.createElement('div');
    rowDiv.classList.add('row');
    rowDiv.setAttribute('data-row', r);

    const guessRow = [];
    for (let c = 0; c < HOLES; c++) {
      const hole = document.createElement('div');
      hole.classList.add('hole');
      hole.setAttribute('data-position', c);
      // Only allow color selection on the current row
      hole.onclick = () => onHoleClick(r, c);
      rowDiv.appendChild(hole);
    }
    board.appendChild(rowDiv);

    // Feedback row
    const feedbackRow = document.createElement('div');
    feedbackRow.classList.add('feedback-row');
    for (let i = 0; i < HOLES; i++) {
      const peg = document.createElement('div');
      peg.classList.add('feedback-peg');
      feedbackRow.appendChild(peg);
    }
    feedback.appendChild(feedbackRow);

    guesses.push(new Array(HOLES).fill(null));
  }
}

// Handle creating the secret code
function onSecretHoleClick(position) {
  // Only if code isn't locked
  if (gameLocked) return;

  if (!selectedColor) return;
  secretCode[position] = selectedColor;
  // Update the hole’s background
  secretRow.children[position].style.backgroundColor = selectedColor;
}

function lockSecretCode() {
  // Validate all holes are filled
  if (secretCode.includes(null)) {
    alert('Prieš patvirtinant kodą, užpildyk visus burbuliukus!');
    return;
  }
  gameLocked = true;
  lockCodeBtn.disabled = true;
  // Gray out the secret code row
  secretRow.classList.add('locked');
  
  // Now the guesser can start playing
  checkGuessBtn.disabled = false;
  statusDiv.textContent = "Kodas užrakintas. Pradėk spėlioti!";
}

// Setup board on load
setupBoard();

// Add click logic to secret row for setting the code
Array.from(secretRow.children).forEach((hole) => {
  hole.onclick = () => onSecretHoleClick(hole.dataset.position);
});

// Lock code button
lockCodeBtn.onclick = lockSecretCode;

// Track what color is currently selected from the palette
let selectedColor = null;

// Palette logic
const colorSwatches = document.querySelectorAll('.color-swatch');
colorSwatches.forEach((swatch) => {
  swatch.addEventListener('click', () => {
    // Mark the chosen color
    selectedColor = swatch.getAttribute('data-color');
    // (Optional) highlight the chosen swatch
    colorSwatches.forEach((s) => {
      s.style.borderColor = '#fff'; 
    });
    swatch.style.borderColor = '#000'; // highlight
  });
});

// Clicking on a hole in the guess row
function onHoleClick(row, position) {
  if (gameOver) return;
  if (!gameLocked) {
    alert('Kodas dar nepatvirtintas!');
    return;
  }
  if (row !== currentGuessRow) {
    // Only current guess row can be edited
    return;
  }
  if (!selectedColor) {
    alert('Pirmiausia pasirink spalvą iš paletės!');
    return;
  }

  // Place color in guess data
  guesses[row][position] = selectedColor;
  // Update the hole’s background
  const rowDiv = board.querySelector(`[data-row='${row}']`);
  const hole = rowDiv.children[position];
  hole.style.backgroundColor = selectedColor;
}

// Check guess button
checkGuessBtn.onclick = function() {
  if (gameOver) return;
  // Make sure current row is completely filled
  if (guesses[currentGuessRow].includes(null)) {
    alert('Prieš tikrinant užpildyk visus burbuliukus!');
    return;
  }

  // Compute feedback
  const { black, white } = computeFeedback(
    secretCode.slice(),
    guesses[currentGuessRow].slice()
  );

  // Update feedback pegs on the screen
  const feedbackRow = feedback.children[currentGuessRow];
  let blackCount = black;
  let whiteCount = white;
  for (let i = 0; i < HOLES; i++) {
    const peg = feedbackRow.children[i];
    if (blackCount > 0) {
      peg.style.backgroundColor = 'black';
      blackCount--;
    } else if (whiteCount > 0) {
      peg.style.backgroundColor = 'white';
      whiteCount--;
    } else {
      peg.style.backgroundColor = '#ddd'; // no match
    }
  }

  // Check for win/loss
  if (black === HOLES) {
    statusDiv.textContent = "Šauniai padirbėjai – atspėjai kodą!";
    gameOver = true;
    checkGuessBtn.disabled = true;
    return;
  } else {
    currentGuessRow++;
    if (currentGuessRow >= MAX_GUESSES) {
      // out of rows - show final code in bubbles
      statusDiv.textContent = "Nepavyko atspėti kodo.";
      showFinalCode(secretCode);
      gameOver = true;
      checkGuessBtn.disabled = true;
    } else {
      statusDiv.textContent = `Nepataikei. Tau liko spėjimų: ${MAX_GUESSES - currentGuessRow}`;
    }
  }
};

/**
 * Show the final code in bubbles rather than just text.
 */
function showFinalCode(codeArray) {
  finalCodeDiv.style.display = 'block';
  finalCodeRow.innerHTML = ''; // clear old stuff if any
  codeArray.forEach((color) => {
    const hole = document.createElement('div');
    hole.classList.add('hole');
    hole.style.backgroundColor = color;
    hole.style.cursor = 'default';
    finalCodeRow.appendChild(hole);
  });
}

/**
 * Computes black (exact) and white (color‐only) matches.
 * Typical Mastermind feedback function.
 */
function computeFeedback(solution, guess) {
  let black = 0;
  let white = 0;

  // First pass: exact matches
  for (let i = 0; i < HOLES; i++) {
    if (solution[i] === guess[i]) {
      black++;
      // Remove matched color from further checks
      solution[i] = null;
      guess[i] = null;
    }
  }

  // Second pass: color-only matches
  for (let i = 0; i < HOLES; i++) {
    if (guess[i] !== null) {
      const matchIndex = solution.indexOf(guess[i]);
      if (matchIndex !== -1) {
        white++;
        solution[matchIndex] = null;
      }
    }
  }

  return { black, white };
}
