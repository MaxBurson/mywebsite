document.addEventListener('DOMContentLoaded', function() {
    // Initialize Supabase client
    const SUPABASE_URL = 'https://ckvoydadpgnrcvuxgfat.supabase.co';
    const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNrdm95ZGFkcGducmN2dXhnZmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzMDg1ODgsImV4cCI6MjA4NTg4NDU4OH0.gsyIb9z75KMEF8ybAyRVHgR7w9wuSjAkjkXXLJ7wT8g';
    const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
    let sessionButtons = document.querySelectorAll('.session-btn');

    let currentQuestionIndex = 0;
    let currentSession = null;
    let responses = {};
    let completedSessions = [];
    let keysPressed = {};
    let currentParticipantName = '';

    // Clear old localStorage session data on page load
    const savedSessions = JSON.parse(localStorage.getItem('evaluationSessions') || '{}');
    if (savedSessions.completedSessions) {
        completedSessions = savedSessions.completedSessions;
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
        }
    ];

    const questionLabels = {
        'response_quality': {
            label: 'Response Quality',
            low: 'Least Clear/Useful',
            high: 'Most Clear/Useful'
        },
        'consistency_character': {
            label: 'Consistency & Character',
            low: 'Least Consistent',
            high: 'Most Consistent'
        },
        'context_awareness': {
            label: 'Context Awareness',
            low: 'Least Aware',
            high: 'Most Aware'
        },
        'engagement': {
            label: 'Engagement',
            low: 'Least Engaging',
            high: 'Most Engaging'
        },
        'responsiveness': {
            label: 'Responsiveness',
            low: 'Slowest',
            high: 'Fastest'
        }
    };

    totalQuestionsSpan.textContent = questions.length;

    // Name input handling
    console.log('Setting up name input handlers');
    console.log('participantNameInput:', participantNameInput);
    console.log('startEvaluationBtn:', startEvaluationBtn);
    
    if (!participantNameInput || !startEvaluationBtn) {
        console.error('Required elements not found!');
        return;
    }

    participantNameInput.addEventListener('input', function() {
        const name = this.value.trim();
        console.log('Name input:', name, 'Length:', name.length);
        startEvaluationBtn.disabled = name.length === 0;
        console.log('Button disabled:', startEvaluationBtn.disabled);
        console.log('Button classes:', startEvaluationBtn.className);
    });

    startEvaluationBtn.addEventListener('click', function() {
        const name = participantNameInput.value.trim();
        console.log('Start button clicked, name:', name);
        console.log('Name length:', name.length);
        console.log('Current participant name before:', currentParticipantName);
        console.log('Participant span element:', participantNameSpan);
        
        if (name.length > 0) {
            currentParticipantName = name;
            console.log('Set currentParticipantName to:', currentParticipantName);
            participantNameSpan.textContent = name;
            console.log('Set participantNameSpan.textContent to:', participantNameSpan.textContent);
            console.log('About to call showWelcome()');
            showWelcome();
        } else {
            console.log('Name was empty, not proceeding');
        }
    });

    participantNameInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !startEvaluationBtn.disabled) {
            console.log('Enter key pressed');
            startEvaluationBtn.click();
        }
    });

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
                if (miniMenu && miniMenu.parentNode && !miniMenu.contains(e.target)) {
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
        // Save current session if it has data and hasn't been completed yet
        if (currentSession !== null && Object.keys(responses).length > 0 && !completedSessions.includes(currentSession)) {
            completeSession();
        }

        // Create a fresh user experience - reset all session data
        completedSessions = [];
        currentSession = null;
        responses = {};
        currentQuestionIndex = 0;
        currentParticipantName = ''; // Reset participant name
        
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
        
        // Update session buttons reference (use let instead of reassigning const)
        sessionButtons = document.querySelectorAll('.session-btn');
        
        // Go back to name input screen for new participant
        showNameInput();
        
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

    function showNameInput() {
        console.log('showNameInput() called');
        nameInputContainer.style.display = 'block';
        welcomeMessage.style.display = 'none';
        questionContainer.style.display = 'none';
        completionMessage.style.display = 'none';
        finalCompletionMessage.style.display = 'none';
        document.querySelector('.session-buttons').style.display = 'none';
        
        // Clear the name input field
        participantNameInput.value = '';
        startEvaluationBtn.disabled = true;
    }

    function showWelcome() {
        console.log('showWelcome() called');
        console.log('Hiding nameInputContainer');
        nameInputContainer.style.display = 'none';
        console.log('Showing welcomeMessage');
        welcomeMessage.style.display = 'block';
        questionContainer.style.display = 'none';
        completionMessage.style.display = 'none';
        finalCompletionMessage.style.display = 'none';
        console.log('Showing session buttons');
        document.querySelector('.session-buttons').style.display = 'block';
        console.log('showWelcome() completed');
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

    function showQuestions() {
        console.log('showQuestions() called');
        nameInputContainer.style.display = 'none';
        welcomeMessage.style.display = 'none';
        questionContainer.style.display = 'block';
        completionMessage.style.display = 'none';
        finalCompletionMessage.style.display = 'none';
        console.log('showQuestions() completed');
    }

    function startSession(sessionNum) {
        console.log('startSession called with sessionNum:', sessionNum);
        currentSession = sessionNum;
        currentQuestionIndex = 0;
        responses = {};
        console.log('About to call showQuestions()');
        showQuestions();
        console.log('About to call displayQuestion()');
        displayQuestion();
    }

    function displayQuestion() {
        const question = questions[currentQuestionIndex];
        console.log('Displaying question:', question);
        
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
                const ratingOption = document.createElement('div');
                ratingOption.className = 'rating-option';
                ratingOption.innerHTML = `<span class="rating-number">${i}</span>`;
                ratingOptions.appendChild(ratingOption);
                
                ratingOption.addEventListener('click', function() {
                    responses[question.id] = i;
                    nextButton.disabled = false;
                    
                    // Visual feedback
                    document.querySelectorAll('.rating-option').forEach(opt => {
                        opt.classList.remove('selected');
                    });
                    this.classList.add('selected');
                });
            }
            
            ratingScale.appendChild(ratingOptions);
            ratingContainer.appendChild(ratingScale);
            answerContainer.appendChild(ratingContainer);
            
        } else if (question.type === 'text') {
            const textArea = document.createElement('textarea');
            textArea.id = question.id;
            textArea.className = 'text-answer';
            textArea.placeholder = 'Please describe any issues...';
            textArea.rows = 4;
            textArea.addEventListener('input', function() {
                responses[question.id] = this.value;
                // Enable next button if there's content (optional question)
                nextButton.disabled = false;
            });
            answerContainer.appendChild(textArea);
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

    async function completeSession() {
        const evaluationData = {
            session_id: currentSession,
            participant_name: currentParticipantName,
            timestamp: new Date().toISOString(),
            response_quality: responses.response_quality || null,
            consistency_character: responses.consistency_character || null,
            context_awareness: responses.context_awareness || null,
            engagement: responses.engagement || null,
            responsiveness: responses.responsiveness || null,
            problems_issues: responses.problems_issues || null
        };

        try {
            // Save to Supabase
            const { data, error } = await supabase
                .from('evaluations')
                .insert([evaluationData]);

            if (error) {
                console.error('Error saving to Supabase:', error);
                alert('Error saving evaluation. Please try again.');
                return;
            }

            console.log('Successfully saved to Supabase:', data);
        } catch (err) {
            console.error('Exception saving to Supabase:', err);
            alert('Error saving evaluation. Please try again.');
            return;
        }

        // Also keep localStorage as backup
        let allEvaluations = JSON.parse(localStorage.getItem('evaluationResponses') || '[]');
        allEvaluations.push({
            sessionId: currentSession,
            participantName: currentParticipantName,
            timestamp: evaluationData.timestamp,
            responses: responses
        });
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
            console.log('Session button clicked:', sessionNum);
            console.log('Completed sessions:', completedSessions);
            console.log('Is session completed?', completedSessions.includes(sessionNum));
            
            if (!completedSessions.includes(sessionNum)) {
                console.log('Starting session:', sessionNum);
                startSession(sessionNum);
            } else {
                console.log('Session already completed, not starting');
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
