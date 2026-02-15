// Module pour les tables de multiplication
const MathModule = {
    score: 0,
    total: 0,
    streak: 0,
    currentQuestion: {},
    hasAnsweredCurrentQuestion: false,
    nextQuestionTimeoutId: null,

    init() {
        this.score = 0;
        this.total = 0;
        this.streak = 0;
        this.hasAnsweredCurrentQuestion = false;
        if (this.nextQuestionTimeoutId) {
            clearTimeout(this.nextQuestionTimeoutId);
            this.nextQuestionTimeoutId = null;
        }
        this.nextQuestion();
        document.getElementById('feedback').innerHTML = '';
        this.updateScore();
    },

    generateQuestion() {
        const tableSelect = document.getElementById('tableSelect').value;
        let num1, num2;

        if (tableSelect === 'all') {
            num1 = Math.floor(Math.random() * 11) + 1;
            num2 = Math.floor(Math.random() * 12);
        } else {
            num1 = parseInt(tableSelect);
            num2 = Math.floor(Math.random() * 12);
        }

        return {
            num1: num1,
            num2: num2,
            answer: num1 * num2
        };
    },

    nextQuestion() {
        if (this.nextQuestionTimeoutId) {
            clearTimeout(this.nextQuestionTimeoutId);
            this.nextQuestionTimeoutId = null;
        }

        this.hasAnsweredCurrentQuestion = false;
        this.currentQuestion = this.generateQuestion();
        document.getElementById('mathQuestion').textContent = 
            `${this.currentQuestion.num1} × ${this.currentQuestion.num2} = ?`;
        document.getElementById('mathAnswer').value = '';
        document.getElementById('mathAnswer').focus();
        document.getElementById('feedback').innerHTML = '';
    },

    checkAnswer() {
        if (this.hasAnsweredCurrentQuestion) {
            return;
        }

        const userAnswer = parseInt(document.getElementById('mathAnswer').value);
        const feedback = document.getElementById('feedback');

        if (isNaN(userAnswer) || userAnswer < 0) {
            feedback.innerHTML = '⚠️ Entre un nombre positif !';
            feedback.className = 'feedback incorrect';
            return;
        }

        this.hasAnsweredCurrentQuestion = true;
        this.total++;

        if (userAnswer === this.currentQuestion.answer) {
            this.score++;
            this.streak++;
            feedback.innerHTML = `🎉 Bravo ! ${this.currentQuestion.num1} × ${this.currentQuestion.num2} = ${this.currentQuestion.answer}`;
            feedback.className = 'feedback correct';
            
            if (this.streak >= 5) {
                feedback.innerHTML += '<br>🔥 Série de ' + this.streak + ' ! Continue comme ça !';
            }
        } else {
            this.streak = 0;
            feedback.innerHTML = `❌ Pas tout à fait... La bonne réponse est ${this.currentQuestion.answer}`;
            feedback.className = 'feedback incorrect';
        }

        this.updateScore();
        this.nextQuestionTimeoutId = setTimeout(() => {
            this.nextQuestionTimeoutId = null;
            this.nextQuestion();
        }, 2000);
    },

    updateScore() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('total').textContent = this.total;
        document.getElementById('streak').textContent = this.streak;
    }
};
