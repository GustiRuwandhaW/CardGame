/* =====================================================
   GOOGLE APPS SCRIPT WEB APP URL

   Ganti dengan URL Web App Google Apps Script kamu.

   Contoh:

   https://script.google.com/macros/s/XXXXXXXX/exec

===================================================== */

const API_URL =
  "https://script.google.com/macros/s/AKfycbz29iamBRPspbG0hoLgHPSf03F6_gJWF5txmT_h2K3Rib-tJAcJ7P8D1YcmAFTaSSAM/exec";


/* =====================================================
   GAME CONFIG
===================================================== */

const symbols = [

  "🍎",
  "🍋",
  "🍇",
  "🍒",
  "🍉",
  "🍓",
  "🥝",
  "🍊"

];


let authMode = "login";


let token =
  localStorage.getItem("card_token");


let game = {

  score: 0,

  combo: 0,

  time: 60,

  cards: [],

  firstCard: null,

  secondCard: null,

  locked: false,

  playing: false,

  submitted: false,

  timer: null

};


/* =====================================================
   API
===================================================== */

async function api(
  action,
  data = {}
) {

  if (
    !API_URL ||
    API_URL.includes("PASTE_")
  ) {

    throw new Error(
      "API_URL belum diisi."
    );

  }


  const response =
    await fetch(
      API_URL,
      {

        method: "POST",

        headers: {

          "Content-Type":
            "text/plain;charset=utf-8"

        },

        body:
          JSON.stringify({

            action,

            token,

            ...data

          })

      }
    );


  const result =
    await response.json();


  if (!result.ok) {

    throw new Error(
      result.message ||
      "Terjadi kesalahan."
    );

  }


  return result;

}


/* =====================================================
   ELEMENT HELPER
===================================================== */

function $(id) {

  return document.getElementById(id);

}


/* =====================================================
   LOGIN TAB
===================================================== */

$("loginTab").onclick =
function() {

  authMode = "login";


  $("loginTab")
    .classList
    .add("active");


  $("registerTab")
    .classList
    .remove("active");


  $("authButton")
    .textContent =
    "Login";


  $("authMessage")
    .textContent = "";

};


/* =====================================================
   REGISTER TAB
===================================================== */

$("registerTab").onclick =
function() {

  authMode = "register";


  $("registerTab")
    .classList
    .add("active");


  $("loginTab")
    .classList
    .remove("active");


  $("authButton")
    .textContent =
    "Daftar";


  $("authMessage")
    .textContent = "";

};


/* =====================================================
   AUTH
===================================================== */

$("authForm").onsubmit =
async function(event) {

  event.preventDefault();


  const username =
    $("username")
      .value
      .trim();


  const password =
    $("password")
      .value;


  $("authMessage")
    .textContent =
    "Memproses...";


  try {

    const result =
      await api(

        authMode === "login"
          ? "login"
          : "register",

        {
          username,
          password
        }

      );


    token =
      result.token;


    localStorage.setItem(
      "card_token",
      token
    );


    enterGame(
      result.user
    );


  }

  catch(error) {

    $("authMessage")
      .textContent =
      error.message;

  }

};


/* =====================================================
   ENTER GAME
===================================================== */

function enterGame(user) {

  $("playerName")
    .textContent =
    user.username;


  $("authPage")
    .classList
    .add("hidden");


  $("gamePage")
    .classList
    .remove("hidden");


  resetGame();

  loadLeaderboard();

}


/* =====================================================
   CHECK SESSION
===================================================== */

async function checkSession() {

  if (!token) {

    return;

  }


  try {

    const result =
      await api("me");


    enterGame(
      result.user
    );

  }

  catch {

    token = null;

    localStorage.removeItem(
      "card_token"
    );

  }

}


/* =====================================================
   CREATE DECK
===================================================== */

function createDeck() {

  const deck = [

    ...symbols,
    ...symbols

  ];


  deck.sort(
    () =>
      Math.random() - 0.5
  );


  game.cards =
    deck.map(
      (symbol,index) => ({

        id: index,

        symbol,

        flipped: false,

        matched: false

      })
    );


  renderBoard();

}


/* =====================================================
   RENDER BOARD
===================================================== */

function renderBoard() {

  const board =
    $("cardBoard");


  board.innerHTML = "";


  game.cards.forEach(
    card => {

      const element =
        document.createElement(
          "div"
        );


      element.className =
        "card";


      element.dataset.id =
        card.id;


      element.innerHTML = `

        <div class="card-inner">

          <div class="
            card-face
            card-back
          ">
            🂠
          </div>

          <div class="
            card-face
            card-front
          ">
            ${card.symbol}
          </div>

        </div>

      `;


      element.onclick =
        function() {

          flipCard(card.id);

        };


      board.appendChild(
        element
      );

    }
  );

}


/* =====================================================
   RESET GAME
===================================================== */

function resetGame() {

  clearInterval(
    game.timer
  );


  game.score = 0;

  game.combo = 0;

  game.time = 60;

  game.firstCard = null;

  game.secondCard = null;

  game.locked = false;

  game.playing = false;

  game.submitted = false;


  $("score")
    .textContent = "0";


  $("combo")
    .textContent = "x0";


  $("timer")
    .textContent = "60";


  $("startButton")
    .disabled = false;


  $("submitButton")
    .disabled = true;


  createDeck();

}


/* =====================================================
   START GAME
===================================================== */

$("startButton").onclick =
function() {

  resetGame();


  game.playing = true;


  $("startButton")
    .disabled = true;


  game.timer =
    setInterval(
      function() {

        game.time--;


        $("timer")
          .textContent =
          game.time;


        if (
          game.time <= 0
        ) {

          finishGame();

        }

      },
      1000
    );

};


/* =====================================================
   FLIP CARD
===================================================== */

function flipCard(id) {

  if (
    !game.playing ||
    game.locked
  ) {

    return;

  }


  const card =
    game.cards[id];


  if (
    card.flipped ||
    card.matched
  ) {

    return;

  }


  card.flipped = true;


  updateCard(card.id);


  if (
    game.firstCard === null
  ) {

    game.firstCard = id;

    return;

  }


  game.secondCard = id;

  game.locked = true;


  const first =
    game.cards[
      game.firstCard
    ];


  const second =
    game.cards[
      game.secondCard
    ];


  /* =================
     MATCH
  ================= */

  if (
    first.symbol ===
    second.symbol
  ) {

    first.matched = true;

    second.matched = true;


    game.combo++;


    game.score +=
      100 +
      game.combo * 25;


    updateCard(
      first.id
    );


    updateCard(
      second.id
    );


    $("score")
      .textContent =
      game.score;


    $("combo")
      .textContent =
      "x" + game.combo;


    setTimeout(
      clearSelection,
      300
    );

  }


  /* =================
     NOT MATCH
  ================= */

  else {

    game.combo = 0;


    $("combo")
      .textContent =
      "x0";


    setTimeout(
      function() {

        first.flipped = false;

        second.flipped = false;


        updateCard(
          first.id
        );


        updateCard(
          second.id
        );


        clearSelection();

      },
      700
    );

  }

}


/* =====================================================
   UPDATE CARD
===================================================== */

function updateCard(id) {

  const card =
    game.cards[id];


  const element =
    document.querySelector(
      `.card[data-id="${id}"]`
    );


  if (!element)
    return;


  element.classList.toggle(
    "flipped",
    card.flipped ||
    card.matched
  );


  element.classList.toggle(
    "matched",
    card.matched
  );

}


/* =====================================================
   CLEAR SELECTION
===================================================== */

function clearSelection() {

  game.firstCard = null;

  game.secondCard = null;

  game.locked = false;


  const completed =
    game.cards.every(
      card =>
        card.matched
    );


  if (completed) {

    finishGame();

  }

}


/* =====================================================
   FINISH GAME
===================================================== */

function finishGame() {

  if (!game.playing)
    return;


  game.playing = false;


  clearInterval(
    game.timer
  );


  $("submitButton")
    .disabled = false;


  showNotification(
    "Game selesai! Skor: " +
    game.score
  );

}


/* =====================================================
   SUBMIT SCORE
===================================================== */

$("submitButton").onclick =
async function() {

  if (
    game.submitted
  ) {

    return;

  }


  try {

    await api(
      "submitScore",
      {
        score: game.score
      }
    );


    game.submitted = true;


    $("submitButton")
      .disabled = true;


    showNotification(
      "Skor berhasil disimpan!"
    );


    loadLeaderboard();

  }

  catch(error) {

    showNotification(
      error.message
    );

  }

};


/* =====================================================
   LEADERBOARD
===================================================== */

async function loadLeaderboard() {

  try {

    const result =
      await api(
        "leaderboard"
      );


    renderLeaderboard(
      result.leaderboard
    );

  }

  catch(error) {

    $("leaderboard")
      .innerHTML =
      "<p>Leaderboard belum tersedia.</p>";

  }

}


function renderLeaderboard(
  players
) {

  const container =
    $("leaderboard");


  if (
    !players ||
    players.length === 0
  ) {

    container.innerHTML =
      "<p>Belum ada skor.</p>";

    return;

  }


  container.innerHTML =
    players
      .map(
        (player,index) => `

        <div class="rank">

          <span class="rank-number">
            ${index + 1}
          </span>

          <span class="rank-name">
            ${escapeHTML(
              player.username
            )}
          </span>

          <span class="rank-score">
            ${player.score}
          </span>

        </div>

      `
      )
      .join("");

}


/* =====================================================
   HTML ESCAPE
===================================================== */

function escapeHTML(value) {

  return String(value)
    .replace(
      /[&<>"']/g,
      character => {

        const entities = {

          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"

        };


        return entities[
          character
        ];

      }
    );

}


/* =====================================================
   LOGOUT
===================================================== */

$("logoutButton").onclick =
function() {

  clearInterval(
    game.timer
  );


  token = null;


  localStorage.removeItem(
    "card_token"
  );


  $("gamePage")
    .classList
    .add("hidden");


  $("authPage")
    .classList
    .remove("hidden");


  $("username").value = "";

  $("password").value = "";

};


/* =====================================================
   NOTIFICATION
===================================================== */

function showNotification(
  message
) {

  const element =
    $("notification");


  element.textContent =
    message;


  element.classList
    .add("show");


  setTimeout(
    () => {

      element.classList
        .remove("show");

    },
    2500
  );

}


/* =====================================================
   INIT
===================================================== */

checkSession();
