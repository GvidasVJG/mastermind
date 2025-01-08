// Number of holes in code
const HOLES = 5;
// Number of guesses allowed
const MAX_GUESSES = 8;

// DOM elements
const secretRow = document.getElementById('secretRow');
const lockCodeBtn = document.getElementById('lockCodeBtn');
const board = document.getElementById('board');
const checkGuessBtn = document.getElementById('checkGuessBtn');
const statusDiv = document.getElementById('status');
const finalCodeDiv = document.getElementById('finalCode');
const finalCodeRow = document.getElementById('finalCodeRow');

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
  checkGuessBtn.disabled = false;
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

// Check guess button
checkGuessBtn.onclick = function() {
  if (gameOver) return;
  
  // Ensure current guess row is completely filled
  if (guesses[currentGuessRow].includes(null)) {
    alert('Prieš tikrinant užpildyk visus burbuliukus!');
    return;
  }

  // Calculate black/white feedback
  const { black, white } = computeFeedback(
    secretCode.slice(),
    guesses[currentGuessRow].slice()
  );
  const none = HOLES - (black + white);

  // Place feedback text in the same row
  const guessRowDiv = board.querySelector(`[data-row='${currentGuessRow}']`);
  const feedbackDiv = guessRowDiv.querySelector('.row-feedback');
  feedbackDiv.textContent = `${black} ✅ | ${white} 🟡 | ${none} ❌`;

  // Check win/loss
  if (black === HOLES) {
    statusDiv.textContent = "Šauniai padirbėjai – atspėjai kodą!";
    gameOver = true;
    checkGuessBtn.disabled = true;
  } else {
    currentGuessRow++;
    if (currentGuessRow >= MAX_GUESSES) {
      statusDiv.textContent = "Nepavyko atspėti kodo.";
      showFinalCode(secretCode);
      gameOver = true;
      checkGuessBtn.disabled = true;
    } else {
      statusDiv.textContent = `Nepataikei. Tau liko spėjimų: ${MAX_GUESSES - currentGuessRow}`;
    }
  }
};

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

// Call this after board setup
setupHoleClickHandlers();
