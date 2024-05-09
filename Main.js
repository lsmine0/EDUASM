const bootstrap = require("bootstrap");
const { ipcRenderer } = require('electron');


// Zmienne globalne
let currentQuestion = 0; // Indeks aktualnego pytania
let userAnswer; // Wybrana przez u¿ytkownika odpowiedŸ
let answerChecked = false; // Czy odpowiedŸ zosta³a sprawdzona
let correctAnswers = 0; // Liczba poprawnych odpowiedzi
let wrongAnswers = 0; // Liczba b³êdnych odpowiedzi
let quizData; // Dane z pliku JSON
let initialDataLoaded = false; // Czy dane zosta³y ju¿ wczytane
let isLastAnswerNone = false;
const noneOfTheAboveOption = '¿adne z powy¿szych';
const numberOfQuestions = 15; //15;
const allOfTheAboveOption = 'wszystkie powy¿sze';
let odpowiedzi = [];
let userAnswers = new Array(numberOfQuestions).fill(null);
let quizzes = [];
let variant = false;
let negativ = false;
let isFirstQuiz = true;

/*
REWRITE
*/

//helper functions
function MenuState(boolean) {
    const Div = document.getElementById("Menu")
    if (boolean) { Div.classList.remove("d-none") }
    else { Div.classList.add("d-none") }
}

function QuestionsEditor(boolean) {
    const Div = document.getElementById("Editor")
    if (boolean) { Div.classList.remove("d-none") }
    else { Div.classList.add("d-none") }
}

function QuizState(boolean) {
    const Div = document.getElementById("Quiz")
    if (boolean) { Div.classList.remove("d-none") }
    else { Div.classList.add("d-none") }
}

function ResultState(boolean) {
    const Div = document.getElementById("QuizResult")
    if (boolean) { Div.classList.remove("d-none") }
    else { Div.classList.add("d-none") }
}

function AnwsersState(boolean) {
    const Div = document.getElementById("Awnsers")
    if (boolean) { Div.classList.remove("d-none") }
    else { Div.classList.add("d-none") }
}

function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = () => {
            resolve(reader.result);
        };

        reader.onerror = (error) => {
            reject(error);
        };

        reader.readAsText(file);
    });
}

//end of helper functions

function showToast(message) {
    // Get the toast element
    var toastElement = document.querySelector('.toast');

    // Update the text in the toast header
    var toastHeader = toastElement.querySelector('.toast-header strong');
    toastHeader.textContent = message;

    // Use Bootstrap's toast API to show the toast
    var bsToast = new bootstrap.Toast(toastElement);
    bsToast.show();
}


function Popcorn() {
    const popoverTriggerList = document.querySelectorAll('[data-bs-toggle="popover"]')
    popoverTriggerList.forEach(popoverTriggerEl => {
        new bootstrap.Popover(popoverTriggerEl);
    });
}

function KillPotentialRougePopcorn() {
    const curpop = document.getElementsByClassName('popover')
    for (let i = 0; i < curpop.length; i++) {
        curpop[i].remove();
    }
}

function SaveLocalQuestions() {
    var Extract = {}
    Extract["record"] = quizData;
    var StrExtract = JSON.stringify(Extract, null, 4);
    ipcRenderer.send('save-file-request', StrExtract);
}

function LoadQuestionsJSON() {
    const fileInput = document.getElementById('fileInput');
    fileInput.click(); // Trigger file input click event
}

async function QuestionsFetch() {
    const fileInput = document.getElementById('fileInput');
    const file = fileInput.files[0];
    try {
        const fileContent = await readFileAsText(file);
        const parsedData = JSON.parse(fileContent);
        if (parsedData.record) { 
        quizData = parsedData.record;
        initialDataLoaded = true;
        currentQuestion = 0;
        correctAnswers = 0;
        wrongAnswers = 0;
        }
        else throw "Record Data not found in JSON"
   }
   catch (error)
    { //add toast to the message 
        console.error('Error reading or parsing file:', error);
    }
}

function SupressEdit(event) {
    event.preventDefault(); // Prevent default behavior
    event.stopPropagation(); // Prevent event propagation
}

function findMissingID() {
    if (!initialDataLoaded) return 1;
    quizData.sort((a, b) => a.id - b.id);

    let missingID = null;

    for (let i = 0; i < quizData.length - 1; i++) {
        if (quizData[i].id + 1 !== quizData[i + 1].id) {
            missingID = quizData[i].id + 1;
            break;
        }
    }

    if (missingID === null) {
        missingID = quizData.length > 0 ? quizData[quizData.length - 1].id + 1 : 1;
    }
    return missingID;
}

function AddQuestion() {
    var id = findMissingID()
    var QS = {};
    QS['id'] = id;
    QS['question'] = "Dodaj pytanie"
    QS['explanation'] = "Dodaj wytłumaczenie"
    QS['correctAnswer'] = 0
    QS['answers'] = ['odp 1', 'odp 2', 'odp 3', 'odp 4', 'odp 5'];
    document.getElementById('searchQuestion').value = id;
    setButtonState(true)
    displayQuestionInDeveloperMode(QS);
}

function SaveQuestion() {
    
    var QS = {};
    QS['id'] = parseInt(document.getElementById('searchQuestion').value.trim());
    QS['question'] = document.getElementById('PYTS').innerHTML;
    QS['explanation'] = document.getElementById('TLU').innerHTML;
    QS['correctAnswer'] = parseInt(document.querySelector('.PYTDEV input:checked').value.trim());
    QS['answers'] = [];
    var ANS = document.querySelectorAll('.PYTDEV label a');
    for (var i = 0; i != ANS.length; i++)
    {
        QS['answers'][i] = ANS[i].innerHTML      
    }
    
    if (!initialDataLoaded) quizData = [];
    var index = initialDataLoaded ? quizData.findIndex((questionData) => questionData.id === QS['id']) : 0;
    
    initialDataLoaded = true;
    quizData[index == -1 ? quizData.length : index] = QS;
    showToast("Pytanie Zapisane!")
}



function CancelEdit() {
    const searchId = parseInt(document.getElementById('searchQuestion').value.trim());
    const foundQuestion = quizData.find((questionData) => questionData.id === searchId);
    displayQuestionInDeveloperMode(foundQuestion);
    showToast("Edycja anulowana")
}

function RemoveQuestion() {
    const searchId = parseInt(document.getElementById('searchQuestion').value.trim());
    const indx = quizData.findIndex((questionData) => questionData.id === searchId);
    quizData.splice(indx, 1);
    document.getElementById('searchQuestion').value = "";
    document.getElementById('jsonDisplay').textContent = ""
    showToast("Pytanie Usunięte!")
}

function displayQuestionInDeveloperMode(questionData) {

    var AnswersString = ''

    questionData.answers.forEach((answer, answerIndex) => {
        AnswersString += `<div class="form-check PYTDEV"><input ${questionData.correctAnswer == answerIndex ? "checked" : ""} class="form-check-input" type="radio" id="Q${answerIndex}" value="${answerIndex}" name="ans" value="HTML"><label class="form-check-label" for="Q${answerIndex}" > ${answerIndex + 1}.  <a contenteditable="true" onclick="SupressEdit(event)"> ${answer} </a></label></div>`
    });


    document.getElementById('jsonDisplay').innerHTML = `
        <div class="card m-4 mt-1 border-info">
            <div class="card-header"><h5>ID ${questionData.id}</h5><h5>Pytanie: <a contenteditable="true" id="PYTS">${questionData.question} </a></h5></div>
            <div class="card-body">
            ${AnswersString}
            </div>
            <div class="card-footer">
                <h5>Wytłumaczenie:</h5>
                <a contenteditable="true" id="TLU">${questionData.explanation}</a>
            </div>
        </div>
        `;

}

function createAnswerElement(answer, index, shuffledIndex) {

    return `
        <div class="form-check">
            <input class="form-check-input" type="radio" name="answer" id="answer-${index}" value="${index}">
            <label class="form-check-label" for="answer-${index}">
                ${answer}
            </label>
        </div>`;
}

function Editor() {
    AnwsersState(false);
    ResultState(false);
    QuizState(false);
    MenuState(false);

    QuestionsEditor(true);
}

function GotoMenu() {

    KillPotentialRougePopcorn();
    AnwsersState(false);
    ResultState(false);
    QuizState(false);
    QuestionsEditor(false)
    //clear out questions
    currentQuestion = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    KillPotentialRougePopcorn()
    MenuState(true);
}

function restartQuiz() {
    KillPotentialRougePopcorn()
    ResultState(false);
    AnwsersState(false);
    QuizState(true);
    currentQuestion = 0;
    correctAnswers = 0;
    wrongAnswers = 0;
    fetchData(); 
}  

function Questionfetch() {
    const searchId = parseInt(document.getElementById('searchQuestion').value.trim());
    if (searchId) {
        if (!initialDataLoaded) return;
        const foundQuestion = quizData.find((questionData) => questionData.id === searchId);
        if (foundQuestion) {
            document.getElementById('jsonDisplay').textContent = JSON.stringify(foundQuestion, null, 2);

            // Usu� istniej�ce elementy pytania i odpowiedzi
            const existingQuestionElement = document.querySelector('.question-container');
            const existingAnswersElement = document.querySelector('.answers-container');
            if (existingQuestionElement) existingQuestionElement.remove();
            if (existingAnswersElement) existingAnswersElement.remove();
            setButtonState(true)
            // Wy�wietl pytanie i odpowiedzi w trybie deweloperskim
            displayQuestionInDeveloperMode(foundQuestion);
        } else {
            setButtonState(false)
            document.getElementById('jsonDisplay').textContent = 'Nie znaleziono pytania.';
        }
    } else {
        document.getElementById('jsonDisplay').textContent = '';
    }
}

function setButtonState(enabled) {
    const buttons = document.querySelectorAll('#btn-group-editor .editbutton');
    buttons.forEach(button => {
        if (enabled) {
            button.removeAttribute('disabled');
        } else {
            button.setAttribute('disabled', 'disabled');
        }
    });
}



//in dev below

function showAllAnswers() {
    ResultState(false);

    const answersContainer = document.getElementById('AllAnwsers');
    answersContainer.innerHTML = '';
    odpowiedzi = odpowiedzi.slice(0, numberOfQuestions);
    quizData.forEach((data, index) => {
        if (!odpowiedzi[index]) {
            return;
        }

        var AnswersString = ''

            const correctAnswerIndex = data.correctAnswer;

            odpowiedzi[index].forEach((answer, answerIndex) => {
                var casestyle = ''
                if (answer.index === data.userAnswer) {
                    casestyle = 'text-primary';
                }
                if (answer.index === correctAnswerIndex) {
                    casestyle = 'text-success-emphasis';
                }
                
                AnswersString += `
                    <label class="d-block p-1 ps-4 ${casestyle}">
                    ${answerIndex + 1}. ${answer.answer}
                    </label>
                `
            });
        
        var Explanation = `<button type="button" class="btn btn-secondary" data-bs-container="body" data-bs-toggle="popover" data-bs-placement="right" data-bs-content="${quizData[index].explanation}" data-bs-original-title="Popover Title">Wyjaśnij</button>`


        answersContainer.innerHTML += `
        <div class="card m-4 ${data.userAnswer === correctAnswerIndex ? 'border-success' : 'border-warning'}">
            <div class="card-header"><h3>Pytanie ${index + 1}: ${data.question}</h3></div>
            <div class="card-body">
            ${AnswersString}
            </div>
            <div class="card-footer">
            ${Explanation}
            </div>
        </div>
        `; 
    });
    Popcorn()
    AnwsersState(true);
}

async function displayQuestion() {
    const questionElement = document.getElementById('question');
    const answersElement = document.getElementById('answers');

    questionElement.innerHTML = `Pytanie ${currentQuestion + 1}/${numberOfQuestions}<br>${quizData[currentQuestion].question}`;
    answersElement.innerHTML = '';

    const answersCopy = quizData[currentQuestion].answers.map((answer, index) => ({ answer, index }));
    const shuffledAnswers = shuffleArray1(answersCopy);
    odpowiedzi[currentQuestion] = shuffledAnswers;

    answersCopy.forEach(({ answer, index }) => {
        const li = createAnswerElement(answer, index);
        answersElement.innerHTML += li;
    });

    // Obsługa zdarzeń klawisza "keydown"
    document.addEventListener('keydown', (event) => {
        setTimeout(() => {
            handleNumericKeyPress(event, answersCopy);
        }, spaceKeyEnabled ? 0 : spaceKeyDelay);
    });

    questionElement.classList.add('question-text');


    // Jeśli jesteśmy przy ostatnim pytaniu, ukryj przycisk "Następne pytanie" i wyświetl przycisk "Zakończ quiz"
    updateButtonsVisibility();
    resetAnswer();
}

function visualEndQuiz(isPassed) {
    QuizState(false);
    const imgchain = document.getElementsByClassName('meme-img')

    for (let i = 0; i < imgchain.length; i++) {
        imgchain[i].classList.add('d-none');
    }

    let displayCase;
    if (isPassed) {
        displayCase = 'kox';
    } else if (correctAnswers < 3 && !negativ) {
        displayCase = 'poteznybilsko';
    } else if (negativ) {
        displayCase = 'bilskopajak';
    } else {
        displayCase = 'bilsko';
    }

    document.getElementById(displayCase).classList.remove('d-none');
    const scoreElement = document.getElementById('score');
    scoreElement.innerHTML = `Poprawne odpowiedzi: ${correctAnswers}<br><br> B\u0142\u0119dne odpowiedzi: ${wrongAnswers}<br><br>`;
    ResultState(true);
}



function NextQuestion() {
    if (!answerChecked) {
        // Pobierz zaznaczon¹ odpowiedŸ
        const checkedAnswer = document.querySelector('input[name="answer"]:checked');

        if (checkedAnswer) {
            userAnswer = parseInt(checkedAnswer.value); // Przekszta³æ wartoœæ zaznaczonej odpowiedzi na liczbê
            checkAnswer(); // SprawdŸ odpowiedŸ
            answerChecked = true;
        } else {
            // Usuñ event listener na zdarzenie 'keydown' przed wyœwietleniem alertu
            document.removeEventListener('keydown', handleNumericKeyPress);

            // alert('Wybierz odpowiedŸ przed sprawdzeniem!'); // Wyœwietl ostrze¿enie, jeœli nie zaznaczono ¿adnej odpowiedzi

            // Dodaj ponownie event listener na zdarzenie 'keydown' po zamkniêciu alertu
            document.addEventListener('keydown', (event) => handleNumericKeyPress(event, answersCopy));
        }
    }
};

/*
END OF REWRITE
*/

// Funkcja pobieraj¹ca dane z pliku JSON
async function fetchData() {
    console.log('Fetching quiz data...');
    if (!initialDataLoaded) {
        try {
            // Pobierz dane z JSONbin.io
            const response = await fetch('./Questions.json');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const jsonResponse = await response.json(); // Pobierz dane z odpowiedzi
            quizData = jsonResponse.record; // Przypisz dane do quizData

            initialDataLoaded = true;
        } catch (error) {
            console.error('Error while fetching JSON data:', error);
        }
    }
    if (!variant) {
        shuffleArray(quizData);
    }

    displayQuestion();

}

function RandomQuiz() {
    
    answerChecked = false;
    updateStats(false, false);
    updateStatsDisplay();
    MenuState(false);
    QuizState(true);
     // Pobierz dane z pliku JSON
    if (!initialDataLoaded || variant) {
        variant = false;
        isFirstQuiz = false;
        fetchData();
    }
};




document.addEventListener('DOMContentLoaded', () => {
    const quizButtons = document.querySelectorAll('.quiz-btn');
    quizButtons.forEach((button) => {
        button.addEventListener('click', handleQuizButtonClick);
        button.disabled = true; // Wyłączenie przycisków quizów na początku
    });
    setButtonState(false)
});


async function createCustomQuiz(questionIds) {
    await fetchData();  // Pobierz wszystkie dane quizu

    // Stwórz nowy zestaw danych quizu zawierający tylko pytania o określonych ID
    let customQuizData = quizData.filter((question) => questionIds.includes(question.id));


    // Zastąp quizData naszym nowym zestawem danych quizu
    quizData = customQuizData;

    currentQuestion = 0;  // Zacznij od pierwszego pytania
    displayQuestion();  // Wyświetl pytanie
}


function updateButtonsVisibility() {
    if (currentQuestion === numberOfQuestions - 1) {
        document.getElementById('submit').style.display = 'none';
        document.getElementById('endQuiz').style.display = 'block';
    } else {
        document.getElementById('submit').style.display = 'block';
        document.getElementById('endQuiz').style.display = 'none';
    }
}

// Funkcja tworz¹ca element HTML z odpowiedzi¹


function endQuiz() {
    // Sprawdzanie ostatniej odpowiedzi
    if (!answerChecked) {
        const checkedAnswer = document.querySelector('input[name="answer"]:checked');
        if (checkedAnswer) {
            const checkedValue = parseInt(checkedAnswer.value);
            if (checkedValue === -1) {
                userAnswer = '¿adne z powy¿szych';
            } else {
                userAnswer = checkedValue;
            }
            const correctAnswer = quizData[currentQuestion].correctAnswer;

            if (userAnswer === correctAnswer) {
                correctAnswers++;
            } else {
                wrongAnswers++;
            }
            answerChecked = true;
        } else {
            // alert('Wybierz odpowiedŸ przed zakoñczeniem quizu!');
            return;
        }
    }
    quizData[currentQuestion].userAnswer = userAnswer; // Zapisz odpowiedŸ u¿ytkownika w quizData

    const isCompleted = true; // Quiz zawsze zostanie ukoñczony, gdy wywo³asz tê funkcjê
    const isPassed = (correctAnswers / numberOfQuestions) >= 0.65;
    updateStats(isCompleted, isPassed);
    //updateStatsDisplay();
    visualEndQuiz(isPassed);
}


// Funkcja zamieniaj¹ca ostatni¹ odpowiedŸ na "¿adne z powy¿szych"
function replaceLastAnswerWithNone(answersElement, answers) {
    const noneExists = checkIfNoneExists(answers);
    const allExists = checkIfAllExists(answers);

    if (!noneExists && !allExists) {
        const lastIndex = answers.length - 1;

        // Pobierz ostatni element odpowiedzi
        const lastAnswer = answersElement.children[lastIndex];
        const input = lastAnswer.querySelector('input');
        const label = lastAnswer.querySelector('label');

        // Zaktualizuj atrybuty dla ostatniej odpowiedzi
        input.value = -1;
        input.id = `answer-${lastIndex}`;
        label.htmlFor = `answer-${lastIndex}`;
        label.textContent = '\u017badne z powy\u017cszych';

        // Zaktualizuj listê odpowiedzi
        answers[lastIndex].answer = '¿adne z powy¿szych';
    }
}

// Funkcja resetuj¹ca zaznaczenie odpowiedzi
function resetAnswer() {
    const checkedAnswer = document.querySelector('input[name="answer"]:checked'); // Pobierz zaznaczon¹ odpowiedŸ
    if (checkedAnswer) {
        checkedAnswer.checked = false; // Odznacz zaznaczon¹ odpowiedŸ
    }
    answerChecked = false; // Ustaw, ¿e odpowiedŸ nie zosta³a sprawdzona
}


let spaceKeyEnabled = true; // Flaga informująca, czy klawisz spacji jest dostępny
const spaceKeyDelay = 5000; // Opóźnienie w milisekundach (0.5 sekundy)

let spaceKeyPressed = false;
function handleNumericKeyPress(event, answersCopy) {
    const key = event.key;
    const numericKeys = ['1', '2', '3', '4', '5'];

    if (numericKeys.includes(key)) {
        let answerIndex = parseInt(key) - 1;
        const answerInput = document.getElementById(`answer-${answersCopy[answerIndex].index}`);
        if (answerInput) {
            answerInput.checked = true;
        }
    } else if (key === ' ') {
        event.preventDefault(); // Zapobiegamy domyślnemu działaniu spacji (przewijanie strony)

        // Jeśli wcześniej został już wcisnięty klawisz spacji, przerywamy działanie
        if (spaceKeyPressed) {
            return;
        }

        spaceKeyPressed = true;

        if (currentQuestion === numberOfQuestions - 1) {
            if (answerChecked === false) {
                document.getElementById('endQuiz').click();
            }
        } else
            if (answerChecked === false) {
                document.getElementById('submit').click();
            }
        updateButtonsVisibility();

        // Resetowanie zmiennej spaceKeyPressed po 1 sekundzie
        setTimeout(() => {
            spaceKeyPressed = false;
        }, 300);
    }
}


function checkIfNoneExists(answers) {
    for (const answer of answers) {
        if (answer.toLowerCase() === 'żadne z powy¿szych') {
            return true;
        }
    }
    return false;
}

function checkIfAllExists(answers) {
    for (const answer of answers) {
        if (answer.toLowerCase() === 'wszystkie powyższe') {
            return true;
        }
    }
    return false;
}


// Funkcja sprawdzająca odpowiedź i zliczająca wyniki
function checkAnswer() {
    const correctAnswer = quizData[currentQuestion].correctAnswer;

    if (userAnswer === correctAnswer) {
        correctAnswers++;
    } else {
        wrongAnswers++;
    }

    quizData[currentQuestion].userAnswer = userAnswer; // Zapisz odpowiedź użytkownika w quizData

    currentQuestion++;

    if (currentQuestion < numberOfQuestions) {
        let delay = 10;
        // Jeśli jest to pierwszy quiz i pierwsze pytanie, zwiększ opóźnienie
        if (isFirstQuiz && currentQuestion === 1) {
            delay = 1000; // Ustaw większe opóźnienie, na przykład 1000 ms (1 sekunda)
        }
        setTimeout(() => {
            displayQuestion();
            resetAnswer();
        }, delay);
    }
}


// Funkcja mieszająca elementy tablicy
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]]; // Zamienia miejscami elementy i oraz j w tablicy
    }
}

function shuffleArray1(array) {
    const noneExists = checkIfNoneExists(quizData[currentQuestion].answers);
    const allExists = checkIfAllExists(quizData[currentQuestion].answers);

    if (!noneExists && !allExists) {
        for (let i = array.length - 2; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    } else {
        const endIndex = array.length - (allExists && noneExists ? 4 : 3);
        for (let i = endIndex; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }

        if (allExists) {
            const allIndex = quizData[currentQuestion].answers.findIndex(answer =>
                answer.toLowerCase() === 'wszystkie powyższe'
            );
            [array[array.length - 2], array[allIndex]] = [array[allIndex], array[array.length - 2]];
        }
        if (noneExists) {
            const noneIndex = quizData[currentQuestion].answers.findIndex(answer =>
                answer.toLowerCase() === 'żadne z powyższych'
            );
            [array[array.length - 1], array[noneIndex]] = [array[noneIndex], array[array.length - 1]];
        }
    }
    return array;
}

function updateStatsDisplay() {
    //document.getElementById('attempts').textContent = localStorage.getItem('attempts') || '0';
    //document.getElementById('completed').textContent = localStorage.getItem('completed') || '0';
    //document.getElementById('passed').textContent = localStorage.getItem('passed') || '0';
}

function updateStats(isCompleted, isPassed) {
    const attempts = parseInt(localStorage.getItem('attempts') || '0') + 1;
    const completed = parseInt(localStorage.getItem('completed') || '0') + (isCompleted ? 1 : 0);
    const passed = parseInt(localStorage.getItem('passed') || '0') + (isPassed ? 1 : 0);
    const failedInARow = parseInt(localStorage.getItem('failedInARow') || '0');
    let negativePoints = parseInt(localStorage.getItem('negativePoints') || '0');
    negativ = false;

    if (isPassed) {
        localStorage.setItem('failedInARow', '0');
    } else {
        const updatedFailedInARow = failedInARow + 1;
        localStorage.setItem('failedInARow', updatedFailedInARow);

        if (updatedFailedInARow >= 10) {
            negativePoints += 1;
            localStorage.setItem('negativePoints', negativePoints);
            localStorage.setItem('failedInARow', '0');
            negativ = true;
        }
    }

    localStorage.setItem('attempts', attempts);
    localStorage.setItem('completed', completed);
    localStorage.setItem('passed', passed);
}

function podzielPytaniaNaQuizy(pytania, liczbaQuizow, pytaniaNaQuiz) {
    const podzielonePytania = [];

    shuffle(pytania);

    for (let i = 0; i < liczbaQuizow; i++) {
        const start = i * pytaniaNaQuiz;
        const koniec = start + pytaniaNaQuiz;
        const quiz = pytania.slice(start, koniec);
        podzielonePytania.push(quiz);
    }

    return podzielonePytania;
}

function generateQuizzes(allQuestions) {
    const numberOfQuizzes = 9;
    const questionsPerQuiz = 15;

    for (let i = 0; i < numberOfQuizzes; i++) {
        const startIndex = i * questionsPerQuiz;
        const endIndex = startIndex + questionsPerQuiz;
        const quizQuestions = allQuestions.slice(startIndex, endIndex);
        quizzes.push(quizQuestions);
    }
}

function startSelectedQuiz(quizIndex) {
    if (quizzes[quizIndex]) {
        // Resetowanie stanu quizu
        currentQuestion = 0;
        score = 0;
        answeredQuestions = 0;
        correctAnswers = [];
        odpowiedzi = [];
        quizData = quizzes[quizIndex];
        visualNewQuizz()
        displayQuestion();
        variant = true;
        if (isFirstQuiz) {
            isFirstQuiz = false;
        }
    }
}

function handleQuizButtonClick(event) {
    const quizIndex = event.target.dataset.quizIndex;
    if (quizIndex !== undefined) {
        startSelectedQuiz(parseInt(quizIndex));
    }
}

fetchData()