// Application principale - Gestion de la navigation et initialisation

// Navigation entre les sections
function showSection(sectionId) {
    if (sectionId !== 'vocabSection' && typeof VocabularyModule !== 'undefined') {
        VocabularyModule.stopSpeech();
    }

    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
    document.getElementById('backBtn').style.display = sectionId === 'menuSection' ? 'none' : 'flex';
}

// Démarrer le mode mathématiques
function startMath() {
    showSection('mathSection');
    MathModule.init();
}

// Démarrer le mode vocabulaire
function startVocab() {
    showSection('vocabSection');
    VocabularyModule.init();
}

// Fonctions exposées globalement pour les boutons HTML
// (ces fonctions font le pont entre HTML et les modules)

// Math
function checkAnswer() {
    MathModule.checkAnswer();
}

function nextQuestion() {
    MathModule.nextQuestion();
}

// Vocabulaire
function loadVocabList() {
    VocabularyModule.loadVocabList();
}

function flipCard() {
    VocabularyModule.flipCard();
}

function nextCard(event) {
    if (event) {
        event.stopPropagation();
    }
    VocabularyModule.nextCard();
}

function previousCard(event) {
    if (event) {
        event.stopPropagation();
    }
    VocabularyModule.previousCard();
}

function shuffleCards() {
    VocabularyModule.shuffleCards();
}

function toggleSpeakWord(event) {
    if (event) {
        event.stopPropagation();
    }
    VocabularyModule.toggleSpeakWord();
}

function setTtsAccent(accent) {
    VocabularyModule.setAccent(accent);
}

// Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Bouton retour
    document.getElementById('backBtn').addEventListener('click', () => {
        VocabularyModule.stopSpeech();
        showSection('menuSection');
    });

    // Événement Enter pour valider les réponses de maths
    document.getElementById('mathAnswer').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.repeat) {
            checkAnswer();
        }
    });

    // Navigation clavier dans les flashcards de vocabulaire
    document.addEventListener('keydown', (e) => {
        const isVocabVisible = document.getElementById('vocabSection').classList.contains('active');
        if (!isVocabVisible) {
            return;
        }

        const targetTag = e.target && e.target.tagName ? e.target.tagName.toLowerCase() : '';
        const isTypingField = targetTag === 'input' || targetTag === 'textarea' || (e.target && e.target.isContentEditable);
        if (isTypingField) {
            return;
        }

        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            previousCard();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextCard();
        }
    });

    // Mettre à jour la question quand la table change
    document.getElementById('tableSelect').addEventListener('change', () => {
        MathModule.nextQuestion();
    });

    // Initialiser une première question de maths (invisible pour l'instant)
    MathModule.nextQuestion();

    console.log('🎓 Application de révisions chargée avec succès !');
});
