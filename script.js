// Number of holes in code
const HOLES = 5;
// Number of guesses allowed
const MAX_GUESSES = 8;

// DOM elements
const secretRow = document.getElementById('secretRow');
const lockCodeBtn = document.getElementById('lockCodeBtn');
const board = document.getElementById('board');
const statusDiv = document.getElementById('status');
const finalCodeDiv = document.getElementById('finalCode');
const finalCodeRow = document.getElementById('finalCodeRow');
const resetBtn = document.getElementById('resetBtn');

// Data structures
let secretCode = new Array(HOLES).fill(null);
let currentGuessRow = 0;
let guesses = []; // each guess is an array of color strings
let gameLocked = false;
let gameOver = false;

// Initialize the board
function setupBoard() {
  board.innerHTML = '';
  for (let r = 0; r < MAX_GUESSES; r++) {
    // The guess-row container (flex)
    const guessRowDiv = document.createElement('div');
    guessRowDiv.classList.add('guess-row');
    guessRowDiv.setAttribute('data-row', r);

    // Hide rows except the first
    guessRowDiv.style.display = r === 0 ? 'flex' : 'none';

    // The holes container
    const rowHolesDiv = document.createElement('div');
    rowHolesDiv.classList.add('row-holes');

    for (let c = 0; c < HOLES; c++) {
      const hole = document.createElement('div');
      hole.classList.add('hole');
      hole.setAttribute('data-position', c);
      // Only allow color selection on the current row
      hole.onclick = () => onHoleClick(r, c);
      rowHolesDiv.appendChild(hole);
    }
    guessRowDiv.appendChild(rowHolesDiv);

    // Feedback text (same line as holes)
    const feedbackDiv = document.createElement('div');
    feedbackDiv.classList.add('row-feedback');
    feedbackDiv.textContent = ''; // will be filled after each guess
    guessRowDiv.appendChild(feedbackDiv);

    // Create inline guess button
    const guessButton = document.createElement('button');
    guessButton.textContent = 'Spėti';
    guessButton.id = `guessBtn-${r}`;
    guessButton.classList.add('guess-button');
    // Only enable button for first row initially
    guessButton.disabled = r !== 0;
    guessButton.onclick = () => onCheckGuess(r);
    guessRowDiv.appendChild(guessButton);

    // Finally, add the guess row to the board
    board.appendChild(guessRowDiv);

    guesses.push(new Array(HOLES).fill(null));
  }
}

// Secret code hole clicks
function onSecretHoleClick(position, color) {
  if (gameLocked) return;
  secretCode[position] = color;
  secretRow.children[position].style.backgroundColor = color;
}

function lockSecretCode() {
  if (secretCode.includes(null)) {
    alert('Prieš patvirtinant kodą, užpildyk visus burbuliukus!');
    return;
  }
  gameLocked = true;
  lockCodeBtn.disabled = true;
  // Gray out the secret code row
  secretRow.classList.add('locked');
  
  // document.getElementById('first_col').click();
  
  // Now the guesser can start playing
  statusDiv.textContent = "Kodas užrakintas. Pradėk spėlioti!";
}

// On page load, create the board
setupBoard();

// Hook up secret code creation
Array.from(secretRow.children).forEach((hole) => {
  hole.onclick = () => onSecretHoleClick(hole.dataset.position);
});

// Lock code button
lockCodeBtn.onclick = lockSecretCode;

// On a hole click in the guess area
function onHoleClick(row, position, color) {
  if (gameOver) return;
  if (!gameLocked) {
    alert('Kodas dar nepatvirtintas!');
    return;
  }
  if (row !== currentGuessRow) {
    return;
  }

  guesses[row][position] = color;
  const guessRowDiv = board.querySelector(`[data-row='${row}']`);
  const rowHolesDiv = guessRowDiv.querySelector('.row-holes');
  const hole = rowHolesDiv.children[position];
  hole.style.backgroundColor = color;
}

// Replace checkGuessBtn.onclick logic with row-based approach
function onCheckGuess(rowIndex) {
  if (gameOver) return;
  // Ensure current guess row is filled
  if (guesses[rowIndex].includes(null)) {
    alert('Prieš tikrinant užpildyk visus burbuliukus!');
    return;
  }

  // Disable current button
  const currentButton = document.getElementById(`guessBtn-${rowIndex}`);
  currentButton.style.display = 'none';

  const { black, white } = computeFeedback(secretCode.slice(), guesses[rowIndex].slice());
  const none = HOLES - (black + white);

  const guessRowDiv = board.querySelector(`[data-row='${rowIndex}']`);
  const feedbackDiv = guessRowDiv.querySelector('.row-feedback');
  feedbackDiv.textContent = `${black} ✅ | ${white} 🟡 | ${none} ❌`;

  if (black === HOLES) {
    statusDiv.textContent = "Šauniai padirbėjai – atspėjai kodą!";
    gameOver = true;
  } else {
    currentGuessRow++;
    if (currentGuessRow >= MAX_GUESSES) {
      statusDiv.textContent = "Nepavyko atspėti kodo.";
      showFinalCode(secretCode);
      gameOver = true;
    } else {
      statusDiv.textContent = `Nepataikei. Tau liko spėjimų: ${MAX_GUESSES - currentGuessRow}`;
      // Reveal the next row
      const nextRow = board.querySelector(`[data-row='${currentGuessRow}']`);
      if (nextRow) {
        nextRow.style.display = 'flex';
        const nextButton = document.getElementById(`guessBtn-${currentGuessRow}`);
        nextButton.disabled = false;
      }
    }
  }
}

// Show final code in bubbles if user fails
function showFinalCode(codeArray) {
  finalCodeDiv.style.display = 'block';
  finalCodeRow.innerHTML = '';
  codeArray.forEach((color) => {
    const hole = document.createElement('div');
    hole.classList.add('hole');
    hole.style.backgroundColor = color;
    hole.style.cursor = 'default';
    finalCodeRow.appendChild(hole);
  });
}

/**
 * Typical Mastermind feedback function
 * black = correct color & position
 * white = correct color, wrong position
 */
function computeFeedback(solution, guess) {
  let black = 0;
  let white = 0;

  // First pass: exact matches
  for (let i = 0; i < HOLES; i++) {
    if (solution[i] === guess[i]) {
      black++;
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

// Create floating palette
function createFloatingPalette() {
  const palette = document.createElement('div');
  palette.className = 'floating-palette';
  
  document.querySelectorAll('.color-swatch').forEach(swatch => {
    const clone = swatch.cloneNode(true);
    clone.addEventListener('click', (e) => {
      e.stopPropagation();
      const color = clone.getAttribute('data-color');
      const targetHole = palette.targetHole;
      
      if (targetHole.parentElement.id === 'secretRow') {
        onSecretHoleClick(targetHole.dataset.position, color);
      } else {
        const row = parseInt(targetHole.closest('.guess-row').dataset.row);
        const position = parseInt(targetHole.dataset.position);
        onHoleClick(row, position, color);
      }
      
      hideFloatingPalette();
    });
    palette.appendChild(clone);
  });
  
  document.body.appendChild(palette);
  return palette;
}

const floatingPalette = createFloatingPalette();

function showFloatingPalette(hole, event) {
  if (gameOver) return;
  
  floatingPalette.targetHole = hole;
  floatingPalette.style.display = 'grid';
  
  const rect = hole.getBoundingClientRect();
  floatingPalette.style.left = `${rect.right + 10}px`;
  floatingPalette.style.top = `${rect.top}px`;
}

function hideFloatingPalette() {
  floatingPalette.style.display = 'none';
}

// Update hole click handlers
function setupHoleClickHandlers() {
  // Secret row holes
  Array.from(secretRow.children).forEach((hole) => {
    hole.onclick = (e) => {
      if (!gameLocked) {
        showFloatingPalette(hole, e);
      }
    };
  });
  
  // Board holes
  document.querySelectorAll('.board .hole').forEach(hole => {
    hole.onclick = (e) => {
      if (gameLocked && !gameOver) {
        const row = parseInt(hole.closest('.guess-row').dataset.row);
        if (row === currentGuessRow) {
          showFloatingPalette(hole, e);
        }
      }
    }
  });
}

// Hide palette when clicking outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.floating-palette') && !e.target.closest('.hole')) {
    hideFloatingPalette();
  }
});

// Add reset game function
function resetGame() {
    // Reset variables
    secretCode = new Array(HOLES).fill(null);
    currentGuessRow = 0;
    guesses = [];
    gameLocked = false;
    gameOver = false;

    // Reset UI
    secretRow.classList.remove('locked');
    Array.from(secretRow.children).forEach(hole => {
        hole.style.backgroundColor = '#e2e2e2';
    });
    lockCodeBtn.disabled = false;
    statusDiv.textContent = '';
    finalCodeDiv.style.display = 'none';

    // Reset board
    setupBoard();
    setupHoleClickHandlers();
}

// Add event listener
resetBtn.onclick = resetGame;

// Call this after board setup
setupHoleClickHandlers();
