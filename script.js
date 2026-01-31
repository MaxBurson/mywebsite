document.addEventListener('DOMContentLoaded', function() {
    const questionContainer = document.getElementById('questionContainer');
    const questionText = document.getElementById('questionText');
    const answerContainer = document.getElementById('answerContainer');
    const nextButton = document.getElementById('nextButton');
    const currentQuestionSpan = document.getElementById('currentQuestion');
    const totalQuestionsSpan = document.getElementById('totalQuestions');
    const completionMessage = document.getElementById('completionMessage');
    const evaluationContainer = document.getElementById('evaluationContainer');

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
    let responses = {};

    totalQuestionsSpan.textContent = questions.length;

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

            ratingContainer.appendChild(ratingOptions);
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

    nextButton.addEventListener('click', function() {
        if (currentQuestionIndex < questions.length - 1) {
            currentQuestionIndex++;
            displayQuestion();
        } else {
            completeEvaluation();
        }
    });

    function completeEvaluation() {
        const evaluationData = {
            timestamp: new Date().toISOString(),
            responses: responses
        };

        let allEvaluations = JSON.parse(localStorage.getItem('evaluationResponses') || '[]');
        allEvaluations.push(evaluationData);
        localStorage.setItem('evaluationResponses', JSON.stringify(allEvaluations));

        questionContainer.style.display = 'none';
        completionMessage.style.display = 'block';
    }

    displayQuestion();
});
