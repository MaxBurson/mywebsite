document.addEventListener('DOMContentLoaded', function() {
    const nameInputContainer = document.getElementById('nameInputContainer');
    const participantNameInput = document.getElementById('participantNameInput');
    const startEvaluationBtn = document.getElementById('startEvaluationBtn');
    const participantNameSpan = document.getElementById('participantName');
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

    let currentQuestionIndex = 0;
    let currentSession = null;
    let responses = {};
    let completedSessions = [];
    let keysPressed = {};
    let currentParticipantName = '';

    totalQuestionsSpan.textContent = questions.length;

    // Name input handling
    participantNameInput.addEventListener('input', function() {
        const name = this.value.trim();
        startEvaluationBtn.disabled = name.length === 0;
    });

    startEvaluationBtn.addEventListener('click', function() {
        const name = participantNameInput.value.trim();
        if (name.length > 0) {
            currentParticipantName = name;
            participantNameSpan.textContent = name;
            showWelcome();
        }
    });

    participantNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !startEvaluationBtn.disabled) {
            startEvaluationBtn.click();
        }
    });

    function showNameInput() {
        nameInputContainer.style.display = 'block';
        welcomeMessage.style.display = 'none';
        questionContainer.style.display = 'none';
        completionMessage.style.display = 'none';
        finalCompletionMessage.style.display = 'none';
        document.querySelector('.session-buttons').style.display = 'none';
    }

    function showWelcome() {
        nameInputContainer.style.display = 'none';
        welcomeMessage.style.display = 'block';
        questionContainer.style.display = 'none';
        completionMessage.style.display = 'none';
        finalCompletionMessage.style.display = 'none';
        document.querySelector('.session-buttons').style.display = 'block';
    }

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

    // Keyboard shortcut for mini menu (Z + Q)
    document.addEventListener('keydown', function(event) {
        keysPressed[event.key.toLowerCase()] = true;
        
        // Check if Z and Q are pressed simultaneously
        if (keysPressed['z'] && keysPressed['q']) {
            event.preventDefault();
            showMiniMenu();
        }
    });

    document.addEventListener('keyup', function(event) {
        keysPressed[event.key.toLowerCase()] = false;
    });

    function showMiniMenu() {
        // Remove existing menu if present
        const existingMenu = document.querySelector('.mini-menu');
        if (existingMenu) {
            document.body.removeChild(existingMenu);
            return;
        }

        const miniMenu = document.createElement('div');
        miniMenu.className = 'mini-menu';
        miniMenu.innerHTML = `
            <div class="mini-menu-content">
                <div class="mini-menu-header">Session Options</div>
                <button class="mini-menu-btn delete-btn" id="deleteSessionBtn">Delete This Session</button>
                <button class="mini-menu-btn new-btn" id="newSessionBtn">New Session</button>
                <button class="mini-menu-btn close-btn" id="closeMenuBtn">Close</button>
            </div>
        `;
        
        document.body.appendChild(miniMenu);

        // Add event listeners
        document.getElementById('deleteSessionBtn').addEventListener('click', function() {
            deleteCurrentSession();
            document.body.removeChild(miniMenu);
        });

        document.getElementById('newSessionBtn').addEventListener('click', function() {
            createNewSession();
            document.body.removeChild(miniMenu);
        });

        document.getElementById('closeMenuBtn').addEventListener('click', function() {
            document.body.removeChild(miniMenu);
        });

        // Close menu when clicking outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!miniMenu.contains(e.target)) {
                    document.body.removeChild(miniMenu);
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 100);
    }

    function deleteCurrentSession() {
        if (currentSession === null) {
            showNotification('No active session to delete');
            return;
        }

        // Remove session from completed sessions if it was completed
        if (completedSessions.includes(currentSession)) {
            completedSessions = completedSessions.filter(session => session !== currentSession);
            saveSessionData();
            updateSessionButtons();
        }

        // Remove session button if it exists
        const sessionButton = document.querySelector(`[data-session="${currentSession}"]`);
        if (sessionButton) {
            sessionButton.remove();
        }

        // Remove session data from localStorage
        let allEvaluations = JSON.parse(localStorage.getItem('evaluationResponses') || '[]');
        allEvaluations = allEvaluations.filter(evaluation => evaluation.sessionId !== currentSession);
        localStorage.setItem('evaluationResponses', JSON.stringify(allEvaluations));

        showNotification(`Session ${currentSession} deleted!`);
        
        // Reset to welcome screen
        currentSession = null;
        responses = {};
        showWelcome();
    }

    function createNewSession() {
        // Save current session if it has data
        if (currentSession !== null && Object.keys(responses).length > 0) {
            completeSession();
        }

        // Create a fresh user experience - reset all session data
        completedSessions = [];
        currentSession = null;
        responses = {};
        currentQuestionIndex = 0;
        
        // Clear session data from localStorage
        localStorage.removeItem('evaluationSessions');
        
        // Reset all session buttons to be unshaded and enabled
        const allSessionButtons = document.querySelectorAll('.session-btn');
        allSessionButtons.forEach(button => {
            button.classList.remove('completed');
            button.disabled = false;
        });
        
        // Remove any extra session buttons (beyond 8)
        const sessionButtonsContainer = document.querySelector('.session-buttons-container');
        const buttons = Array.from(sessionButtonsContainer.querySelectorAll('.session-btn'));
        buttons.forEach(button => {
            const sessionNum = parseInt(button.dataset.session);
            if (sessionNum > 8) {
                button.remove();
            }
        });
        
        // Update session buttons reference
        sessionButtons = document.querySelectorAll('.session-btn');
        
        // Show welcome screen for fresh user
        showWelcome();
        
        // Show a brief notification
        showNotification('New participant session created!');
    }

    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            padding: 15px 20px;
            border: 2px solid rgba(255, 255, 255, 0.3);
            border-radius: 8px;
            font-family: 'Gilroy-Bold', sans-serif;
            letter-spacing: 1px;
            z-index: 1001;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 2000);
    }

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
            participantName: currentParticipantName,
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
    if (currentParticipantName === '') {
        showNameInput();
    } else if (completedSessions.length === 8) {
        showFinalCompletion();
    } else {
        showWelcome();
    }
});
