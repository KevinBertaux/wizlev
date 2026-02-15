// Module pour le vocabulaire
const VocabularyModule = {
    currentCardIndex: 0,
    vocabulary: [],
    currentList: 'fruits',
    loadedLists: {},
    ttsSupported: typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window,
    ttsInitialized: false,
    ttsAccent: 'en-GB',
    ttsVoices: [],
    isSpeaking: false,
    currentUtterance: null,
    ttsStorageKey: 'revision_enfants_tts_accent',
    swipeInitialized: false,
    touchStartX: 0,
    touchStartY: 0,
    suppressNextFlip: false,
    lists: {
        fruits: {
            file: 'assets/data/vocab-fruits.json'
        },
        legumes: {
            file: 'assets/data/vocab-legumes.json'
        }
    },

    init() {
        this.setupTts();
        this.setupSwipe();
        this.loadVocabList();
    },

    setupSwipe() {
        if (this.swipeInitialized) {
            return;
        }

        const flashcard = document.getElementById('flashcard');
        if (!flashcard) {
            return;
        }

        flashcard.addEventListener('touchstart', (event) => {
            const touch = event.changedTouches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }, { passive: true });

        flashcard.addEventListener('touchend', (event) => {
            const touch = event.changedTouches[0];
            const deltaX = touch.clientX - this.touchStartX;
            const deltaY = touch.clientY - this.touchStartY;

            const horizontalThreshold = 45;
            const isHorizontalSwipe = Math.abs(deltaX) > horizontalThreshold && Math.abs(deltaX) > Math.abs(deltaY);

            if (!isHorizontalSwipe) {
                return;
            }

            this.suppressNextFlip = true;
            if (deltaX < 0) {
                this.nextCard();
            } else {
                this.previousCard();
            }
        }, { passive: true });

        this.swipeInitialized = true;
    },

    setupTts() {
        if (!this.ttsSupported || this.ttsInitialized) {
            this.updateTtsUi();
            return;
        }

        const savedAccent = localStorage.getItem(this.ttsStorageKey);
        if (savedAccent === 'en-US' || savedAccent === 'en-GB') {
            this.ttsAccent = savedAccent;
        }

        const accentSelect = document.getElementById('ttsAccentSelect');
        if (accentSelect) {
            accentSelect.value = this.ttsAccent;
        }

        this.refreshVoices();
        if (typeof speechSynthesis.onvoiceschanged !== 'undefined') {
            speechSynthesis.onvoiceschanged = () => this.refreshVoices();
        }

        this.ttsInitialized = true;
        this.updateTtsUi();
    },

    refreshVoices() {
        if (!this.ttsSupported) {
            this.ttsVoices = [];
            return;
        }
        this.ttsVoices = speechSynthesis.getVoices();
    },

    setAccent(accent) {
        if (accent !== 'en-GB' && accent !== 'en-US') {
            return;
        }

        this.ttsAccent = accent;
        localStorage.setItem(this.ttsStorageKey, accent);
        this.updateTtsUi();
    },

    toggleSpeakWord() {
        if (!this.ttsSupported) {
            this.updateTtsUi('TTS non disponible sur cet appareil');
            return;
        }

        if (this.isSpeaking) {
            this.stopSpeech();
            return;
        }

        if (this.vocabulary.length === 0) {
            return;
        }

        const currentWord = this.vocabulary[this.currentCardIndex].english;
        const utterance = new SpeechSynthesisUtterance(currentWord);
        utterance.lang = this.ttsAccent;
        utterance.rate = 0.95;

        const preferredVoice = this.findBestVoice();
        if (preferredVoice) {
            utterance.voice = preferredVoice;
            utterance.lang = preferredVoice.lang;
        }

        utterance.onstart = () => {
            this.isSpeaking = true;
            this.updateTtsUi();
        };

        utterance.onend = () => {
            this.isSpeaking = false;
            this.currentUtterance = null;
            this.updateTtsUi();
        };

        utterance.onerror = (event) => {
            this.isSpeaking = false;
            this.currentUtterance = null;

            if (event && (event.error === 'canceled' || event.error === 'interrupted')) {
                this.updateTtsUi();
                return;
            }

            this.updateTtsUi('Lecture impossible');
        };

        this.currentUtterance = utterance;
        speechSynthesis.cancel();
        speechSynthesis.speak(utterance);
    },

    stopSpeech() {
        if (!this.ttsSupported) {
            return;
        }
        speechSynthesis.cancel();
        this.isSpeaking = false;
        this.currentUtterance = null;
        this.updateTtsUi();
    },

    findBestVoice() {
        if (!this.ttsVoices || this.ttsVoices.length === 0) {
            return null;
        }

        const wanted = this.ttsAccent.toLowerCase();
        let voice = this.ttsVoices.find((v) => v.lang && v.lang.toLowerCase() === wanted);
        if (voice) {
            return voice;
        }

        voice = this.ttsVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith(wanted));
        if (voice) {
            return voice;
        }

        return this.ttsVoices.find((v) => v.lang && v.lang.toLowerCase().startsWith('en-')) || null;
    },

    updateTtsUi(statusText = '') {
        const ttsButton = document.getElementById('ttsToggleBtn');
        const ttsStatus = document.getElementById('ttsStatus');
        const accentSelect = document.getElementById('ttsAccentSelect');
        const ttsInlineControl = document.getElementById('ttsInlineControl');

        if (!ttsButton || !ttsStatus || !accentSelect || !ttsInlineControl) {
            return;
        }

        accentSelect.value = this.ttsAccent;

        if (!this.ttsSupported) {
            ttsInlineControl.style.display = 'none';
            ttsStatus.textContent = '';
            return;
        }

        ttsInlineControl.style.display = 'flex';
        ttsButton.disabled = false;
        accentSelect.disabled = false;
        ttsButton.textContent = this.isSpeaking ? '⏹️' : '▶️';
        ttsButton.setAttribute('aria-label', this.isSpeaking ? 'Arrêter la lecture' : 'Écouter le mot');
        ttsStatus.textContent = statusText || '';
    },

    async loadVocabList() {
        const listName = document.getElementById('vocabListSelect').value;
        this.currentList = listName;
        this.stopSpeech();

        try {
            this.vocabulary = await this.getVocabularyList(listName);
            this.currentCardIndex = 0;
            this.showCard();
        } catch (error) {
            console.error('Liste de vocabulaire non trouvée:', listName, error);
            this.vocabulary = [];
            document.getElementById('vocabWord').textContent = 'Erreur de chargement';
            document.getElementById('vocabTranslation').style.display = 'none';
            document.getElementById('cardNumber').textContent = '0';
            document.getElementById('totalCards').textContent = '0';
        }
    },

    async getVocabularyList(listName) {
        if (this.loadedLists[listName]) {
            return this.loadedLists[listName];
        }

        const listConfig = this.lists[listName];
        if (!listConfig) {
            throw new Error(`Configuration de liste inconnue: ${listName}`);
        }

        const response = await fetch(listConfig.file);
        if (!response.ok) {
            throw new Error(`Chargement impossible (${response.status})`);
        }

        const data = await response.json();
        if (!data.words || !Array.isArray(data.words)) {
            throw new Error('Format JSON invalide: words[] manquant');
        }

        this.loadedLists[listName] = data.words;
        return data.words;
    },

    showCard() {
        if (this.vocabulary.length === 0) {
            return;
        }
        
        this.stopSpeech();
        const card = this.vocabulary[this.currentCardIndex];
        document.getElementById('vocabWord').textContent = card.english;
        document.getElementById('vocabTranslation').textContent = card.french;
        document.getElementById('vocabTranslation').style.display = 'none';
        document.getElementById('flashcard').classList.remove('flipped');
        document.getElementById('cardNumber').textContent = this.currentCardIndex + 1;
        document.getElementById('totalCards').textContent = this.vocabulary.length;
    },

    flipCard() {
        if (this.suppressNextFlip) {
            this.suppressNextFlip = false;
            return;
        }

        const flashcard = document.getElementById('flashcard');
        const translation = document.getElementById('vocabTranslation');
        
        if (flashcard.classList.contains('flipped')) {
            translation.style.display = 'none';
            flashcard.classList.remove('flipped');
        } else {
            translation.style.display = 'block';
            flashcard.classList.add('flipped');
        }
    },

    nextCard() {
        if (this.vocabulary.length === 0) {
            return;
        }
        this.currentCardIndex = (this.currentCardIndex + 1) % this.vocabulary.length;
        this.showCard();
    },

    previousCard() {
        if (this.vocabulary.length === 0) {
            return;
        }
        this.currentCardIndex = (this.currentCardIndex - 1 + this.vocabulary.length) % this.vocabulary.length;
        this.showCard();
    },

    shuffleCards() {
        if (this.vocabulary.length === 0) {
            return;
        }
        this.stopSpeech();
        for (let i = this.vocabulary.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.vocabulary[i], this.vocabulary[j]] = [this.vocabulary[j], this.vocabulary[i]];
        }
        this.currentCardIndex = 0;
        this.showCard();
    }
};
