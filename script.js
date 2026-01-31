document.addEventListener('DOMContentLoaded', function() {
    const welcomeMessage = document.getElementById('welcomeMessage');
    const questionContainer = document.getElementById('questionContainer');
    const questionText = document.getElementById('questionText');
    const answerContainer = document.getElementById('answerContainer');
    const nextButton = document.getElementById('nextButton');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const totalQuestionsSpan = document.getElementById('totalQuestions');
    const completionMessage = document.getElementById('completionMessage');
    const finalCompletionMessage = document.getElementById('finalCompletionMessage');
    const evaluationContainer = document.getElementById('evaluationContainer');
    const sessionButtons = document.querySelectorAll('.session-btn');

    const questions = [
        {
            id: 'response_quality',
            text: 'How would you rate the clarity, relevance, and usefulness of the NPC\'s responses?',
            type: 'rating',
            required: true
        },
        {
            id: 'consistency_character',
            text: 'Did the NPC stay in character and behave consistently throughout the conversation?',
            type: 'rating',
            required: true
        },
        {
            id: 'context_awareness',
            text: 'How well did the NPC remember and respond appropriately to earlier parts of the conversation?',
            type: 'rating',
            required: true
        },
        {
            id: 'engagement',
            text: 'How interesting or enjoyable was the conversation overall?',
            type: 'rating',
            required: true
        },
        {
            id: 'responsiveness',
            text: 'How fast did the NPC\'s responses feel from your perspective?',
            type: 'rating',
            required: true
        },
        {
            id: 'problems_issues',
            text: 'Did the NPC repeat itself, forget things, hallucinate information, or behave in a confusing way?',
            type: 'text',
            required: false
        },
        {
            id: 'overall_impression',
            text: 'How does this NPC compare to other NPCs you have talked to so far?',
            type: 'rating',
            required: true
        }
    ];

    let currentQuestionIndex = 0;
    let currentSession = null;
    let responses = {};
    let completedSessions = [];

    totalQuestionsSpan.textContent = questions.length;

    function initializeSessions() {
        const savedData = localStorage.getItem('evaluationSessions');
        if (savedData) {
            const data = JSON.parse(savedData);
            completedSessions = data.completedSessions || [];
            updateSessionButtons();
        }
    }

    function updateSessionButtons() {
        sessionButtons.forEach(button => {
            const sessionNum = parseInt(button.dataset.session);
            if (completedSessions.includes(sessionNum)) {
                button.classList.add('completed');
                button.disabled = true;
            } else {
                button.classList.remove('completed');
                button.disabled = false;
            }
        });

        if (completedSessions.length === 8) {
            showFinalCompletion();
        }
    }

    function saveSessionData() {
        const sessionData = {
            completedSessions: completedSessions,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('evaluationSessions', JSON.stringify(sessionData));
    }

    function showWelcome() {
        welcomeMessage.style.display = 'block';
        questionContainer.style.display = 'none';
        completionMessage.style.display = 'none';
        finalCompletionMessage.style.display = 'none';
    }

    function showQuestions() {
        welcomeMessage.style.display = 'none';
        questionContainer.style.display = 'block';
        completionMessage.style.display = 'none';
        finalCompletionMessage.style.display = 'none';
    }

    function showCompletion() {
        welcomeMessage.style.display = 'none';
        questionContainer.style.display = 'none';
        completionMessage.style.display = 'block';
        finalCompletionMessage.style.display = 'none';
    }

    function showFinalCompletion() {
        welcomeMessage.style.display = 'none';
        questionContainer.style.display = 'none';
        completionMessage.style.display = 'none';
        finalCompletionMessage.style.display = 'block';
    }

    function startSession(sessionNum) {
        currentSession = sessionNum;
        currentQuestionIndex = 0;
        responses = {};
        showQuestions();
        displayQuestion();
    }

    const questionLabels = {
        'response_quality': {
            low: 'Least Clear/Useful',
            high: 'Most Clear/Useful'
        },
        'consistency_character': {
            low: 'Least Consistent',
            high: 'Most Consistent'
        },
        'context_awareness': {
            low: 'Least Aware',
            high: 'Most Aware'
        },
        'engagement': {
            low: 'Least Engaging',
            high: 'Most Engaging'
        },
        'responsiveness': {
            low: 'Slowest',
            high: 'Fastest'
        },
        'overall_impression': {
            low: 'Worst',
            high: 'Best'
        }
    };

    function displayQuestion() {
        const question = questions[currentQuestionIndex];
        currentQuestionSpan.textContent = currentQuestionIndex + 1;
        questionText.textContent = question.text;
        
        answerContainer.innerHTML = '';
        nextButton.disabled = true;

        if (question.type === 'rating') {
            const ratingContainer = document.createElement('div');
            ratingContainer.className = 'rating-container';
            
            const ratingLabel = document.createElement('div');
            ratingLabel.className = 'rating-label';
            ratingLabel.textContent = 'Please respond with a number from 1 to 5:';
            ratingContainer.appendChild(ratingLabel);

            const ratingScale = document.createElement('div');
            ratingScale.className = 'rating-scale';
            
            const labels = questionLabels[question.id];
            if (labels) {
                const ratingLabels = document.createElement('div');
                ratingLabels.className = 'rating-labels';
                ratingLabels.innerHTML = `
                    <span class="low-label">${labels.low}</span>
                    <span class="high-label">${labels.high}</span>
                `;
                ratingScale.appendChild(ratingLabels);
            }

            const ratingOptions = document.createElement('div');
            ratingOptions.className = 'rating-options';

            for (let i = 1; i <= 5; i++) {
                const option = document.createElement('div');
                option.className = 'rating-option';
                option.textContent = i;
                option.addEventListener('click', function() {
                    selectRating(i);
                });
                ratingOptions.appendChild(option);
            }

            ratingScale.appendChild(ratingOptions);
            ratingContainer.appendChild(ratingScale);
            answerContainer.appendChild(ratingContainer);
        } else if (question.type === 'text') {
            const textArea = document.createElement('textarea');
            textArea.className = 'text-answer';
            textArea.rows = 4;
            textArea.placeholder = 'Please provide a short written response (optional)...';
            textArea.addEventListener('input', function() {
                responses[question.id] = this.value;
                nextButton.disabled = false;
            });
            answerContainer.appendChild(textArea);
        }

        if (responses[question.id]) {
            if (question.type === 'rating') {
                selectRating(responses[question.id]);
            } else if (question.type === 'text') {
                textArea.value = responses[question.id];
                nextButton.disabled = false;
            }
        }
    }

    function selectRating(value) {
        const question = questions[currentQuestionIndex];
        responses[question.id] = value;

        const ratingOptions = document.querySelectorAll('.rating-option');
        ratingOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.textContent == value) {
                option.classList.add('selected');
            }
        });

        nextButton.disabled = false;
    }

    function completeSession() {
        const evaluationData = {
            sessionId: currentSession,
            timestamp: new Date().toISOString(),
            responses: responses
        };

        let allEvaluations = JSON.parse(localStorage.getItem('evaluationResponses') || '[]');
        allEvaluations.push(evaluationData);
        localStorage.setItem('evaluationResponses', JSON.stringify(allEvaluations));

        if (!completedSessions.includes(currentSession)) {
            completedSessions.push(currentSession);
            completedSessions.sort((a, b) => a - b);
            saveSessionData();
            updateSessionButtons();
        }

        if (completedSessions.length === 8) {
            showFinalCompletion();
        } else {
            showCompletion();
        }
    }

    sessionButtons.forEach(button => {
        button.addEventListener('click', function() {
            const sessionNum = parseInt(this.dataset.session);
            if (!completedSessions.includes(sessionNum)) {
                startSession(sessionNum);
            }
        });
    });

    nextButton.addEventListener('click', function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        } else {
            completeSession();
        }
    });

    initializeSessions();
    if (completedSessions.length === 8) {
        showFinalCompletion();
    } else {
        showWelcome();
    }
});
