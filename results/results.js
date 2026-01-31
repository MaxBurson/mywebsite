document.addEventListener('DOMContentLoaded', function() {
    const loadingMessage = document.getElementById('loadingMessage');
    const resultsContent = document.getElementById('resultsContent');
    const noResultsMessage = document.getElementById('noResultsMessage');
    const summaryStats = document.getElementById('summaryStats');
    const sessionDetails = document.getElementById('sessionDetails');
    const exportButton = document.getElementById('exportButton');

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
        },
        'overall_impression': {
            label: 'Overall Impression',
            low: 'Worst',
            high: 'Best'
        }
    };

    function loadResults() {
        setTimeout(() => {
            const evaluationData = JSON.parse(localStorage.getItem('evaluationResponses') || '[]');
            const sessionData = JSON.parse(localStorage.getItem('evaluationSessions') || '{}');

            if (evaluationData.length === 0) {
                showNoResults();
                return;
            }

            displayResults(evaluationData, sessionData);
        }, 500);
    }

    function showNoResults() {
        loadingMessage.style.display = 'none';
        noResultsMessage.style.display = 'block';
    }

    function displayResults(evaluations, sessionData) {
        loadingMessage.style.display = 'none';
        resultsContent.style.display = 'block';

        displaySummaryStats(evaluations);
        displayParticipantsList(evaluations);
        setupExport(evaluations);
    }

    function displaySummaryStats(evaluations) {
        const totalSurveys = evaluations.length;
        const participants = calculateParticipants(evaluations);
        
        summaryStats.innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${participants}</div>
                <div class="stat-label">Participants</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${totalSurveys}</div>
                <div class="stat-label">Total Surveys</div>
            </div>
        `;
    }

    function calculateParticipants(evaluations) {
        if (evaluations.length === 0) return 0;
        
        // Count unique participant names
        const uniqueNames = [...new Set(evaluations.map(e => e.participantName))];
        return uniqueNames.length;
    }

    function displayParticipantsList(evaluations) {
        sessionDetails.innerHTML = '';
        
        // Group evaluations by participant name
        const participantsMap = {};
        evaluations.forEach(evaluation => {
            const name = evaluation.participantName;
            if (!participantsMap[name]) {
                participantsMap[name] = [];
            }
            participantsMap[name].push(evaluation);
        });
        
        // Create participant cards
        Object.keys(participantsMap).forEach(participantName => {
            const participantEvaluations = participantsMap[participantName];
            const participantCard = createParticipantCard(participantName, participantEvaluations);
            sessionDetails.appendChild(participantCard);
        });
    }

    function createParticipantCard(participantName, evaluations) {
        const card = document.createElement('div');
        card.className = 'participant-card clickable';
        
        const totalSurveys = evaluations.length;
        const completedSessions = evaluations.map(e => e.sessionId).sort((a, b) => a - b);
        const latestDate = new Date(Math.max(...evaluations.map(e => new Date(e.timestamp))));
        
        card.innerHTML = `
            <div class="participant-header">
                <h3>${participantName}</h3>
                <div class="participant-stats">
                    <span class="survey-count">${totalSurveys} surveys</span>
                    <span class="latest-date">Last: ${latestDate.toLocaleDateString()}</span>
                </div>
            </div>
            <div class="participant-sessions">
                <div class="sessions-label">Completed sessions:</div>
                <div class="sessions-list">
                    ${completedSessions.map(sessionId => `<span class="session-badge">${sessionId}</span>`).join('')}
                </div>
            </div>
            <div class="expand-indicator">Click to view details →</div>
        `;
        
        card.addEventListener('click', function() {
            showParticipantDetails(participantName, evaluations);
        });
        
        return card;
    }

    function showParticipantDetails(participantName, evaluations) {
        const modal = document.createElement('div');
        modal.className = 'session-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${participantName} - Evaluation Details</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="participant-info">
                        <div class="participant-summary">
                            <span class="total-surveys">${evaluations.length} total surveys</span>
                            <span class="date-range">${new Date(Math.min(...evaluations.map(e => new Date(e.timestamp)))).toLocaleDateString()} - ${new Date(Math.max(...evaluations.map(e => new Date(e.timestamp)))).toLocaleDateString()}</span>
                        </div>
                    </div>
                    <div class="evaluations-list">
                        ${evaluations.sort((a, b) => a.sessionId - b.sessionId).map(evaluation => createEvaluationCard(evaluation)).join('')}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }

    function createEvaluationCard(evaluation) {
        const responses = evaluation.responses;
        const date = new Date(evaluation.timestamp);
        
        return `
            <div class="evaluation-card">
                <div class="evaluation-header">
                    <h4>Session ${evaluation.sessionId}</h4>
                    <div class="evaluation-date">${date.toLocaleString()}</div>
                </div>
                <div class="evaluation-ratings">
                    ${Object.keys(questionLabels).map(key => {
                        const labelInfo = questionLabels[key];
                        const value = responses[key];
                        if (value) {
                            return `
                                <div class="rating-item">
                                    <span class="rating-label">${labelInfo.label}:</span>
                                    <span class="rating-value">${value}/5</span>
                                </div>
                            `;
                        }
                        return '';
                    }).join('')}
                </div>
                ${responses.problems_issues ? `
                    <div class="problems-section">
                        <h5>Issues Reported:</h5>
                        <p class="problems-text">${responses.problems_issues}</p>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function calculateStats(evaluations) {
        const stats = {
            totalSessions: evaluations.length,
            avgResponseQuality: 0,
            avgConsistency: 0,
            avgContextAwareness: 0,
            avgEngagement: 0,
            avgResponsiveness: 0,
            avgOverall: 0,
            problemReports: 0
        };

        if (evaluations.length === 0) return stats;

        let totalResponseQuality = 0;
        let totalConsistency = 0;
        let totalContextAwareness = 0;
        let totalEngagement = 0;
        let totalResponsiveness = 0;
        let totalOverall = 0;

        evaluations.forEach(evaluation => {
            const responses = evaluation.responses;
            totalResponseQuality += parseInt(responses.response_quality) || 0;
            totalConsistency += parseInt(responses.consistency_character) || 0;
            totalContextAwareness += parseInt(responses.context_awareness) || 0;
            totalEngagement += parseInt(responses.engagement) || 0;
            totalResponsiveness += parseInt(responses.responsiveness) || 0;
            totalOverall += parseInt(responses.overall_impression) || 0;
            
            if (responses.problems_issues && responses.problems_issues.trim()) {
                stats.problemReports++;
            }
        });

        stats.avgResponseQuality = totalResponseQuality / evaluations.length;
        stats.avgConsistency = totalConsistency / evaluations.length;
        stats.avgContextAwareness = totalContextAwareness / evaluations.length;
        stats.avgEngagement = totalEngagement / evaluations.length;
        stats.avgResponsiveness = totalResponsiveness / evaluations.length;
        stats.avgOverall = totalOverall / evaluations.length;

        return stats;
    }

    function displaySessionDetails(evaluations) {
        sessionDetails.innerHTML = '';
        
        evaluations.sort((a, b) => a.sessionId - b.sessionId);
        
        evaluations.forEach(evaluation => {
            const sessionCard = createSessionCard(evaluation);
            sessionDetails.appendChild(sessionCard);
        });
    }

    function createSessionCard(evaluation) {
        const card = document.createElement('div');
        card.className = 'session-card clickable';
        
        const responses = evaluation.responses;
        const date = new Date(evaluation.timestamp);
        
        card.innerHTML = `
            <div class="session-header">
                <h3>Session ${evaluation.sessionId}</h3>
                <div class="session-date">${date.toLocaleDateString()} ${date.toLocaleTimeString()}</div>
            </div>
            <div class="session-summary">
                <div class="summary-ratings">
                    <div class="rating-item">
                        <span class="rating-label">Response Quality:</span>
                        <span class="rating-value">${responses.response_quality || 'N/A'}/5</span>
                    </div>
                    <div class="rating-item">
                        <span class="rating-label">Consistency:</span>
                        <span class="rating-value">${responses.consistency_character || 'N/A'}/5</span>
                    </div>
                    <div class="rating-item">
                        <span class="rating-label">Context Awareness:</span>
                        <span class="rating-value">${responses.context_awareness || 'N/A'}/5</span>
                    </div>
                    <div class="rating-item">
                        <span class="rating-label">Engagement:</span>
                        <span class="rating-value">${responses.engagement || 'N/A'}/5</span>
                    </div>
                    <div class="rating-item">
                        <span class="rating-label">Responsiveness:</span>
                        <span class="rating-value">${responses.responsiveness || 'N/A'}/5</span>
                    </div>
                    <div class="rating-item">
                        <span class="rating-label">Overall:</span>
                        <span class="rating-value">${responses.overall_impression || 'N/A'}/5</span>
                    </div>
                </div>
            </div>
            ${responses.problems_issues ? `
                <div class="problems-indicator">
                    <span class="problems-badge">Issues Reported</span>
                </div>
            ` : ''}
            <div class="expand-indicator">Click to view details →</div>
        `;
        
        card.addEventListener('click', function() {
            showSessionDetails(evaluation);
        });
        
        return card;
    }

    function showSessionDetails(evaluation) {
        const modal = document.createElement('div');
        modal.className = 'session-modal';
        modal.innerHTML = `
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Session ${evaluation.sessionId} - Detailed Responses</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="session-info">
                        <div class="session-date">${new Date(evaluation.timestamp).toLocaleString()}</div>
                    </div>
                    <div class="detailed-questions">
                        ${createDetailedQuestions(evaluation.responses)}
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        modal.querySelector('.close-modal').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
        
        modal.querySelector('.modal-overlay').addEventListener('click', function() {
            document.body.removeChild(modal);
        });
    }

    function createDetailedQuestions(responses) {
        let html = '';
        
        Object.keys(questionLabels).forEach(key => {
            const labelInfo = questionLabels[key];
            const value = responses[key];
            
            if (value) {
                html += `
                    <div class="question-detail">
                        <div class="question-text">${labelInfo.label}</div>
                        <div class="rating-scale">
                            <div class="rating-labels">
                                <span class="low-label">${labelInfo.low}</span>
                                <span class="high-label">${labelInfo.high}</span>
                            </div>
                            <div class="rating-dots">
                                ${[1, 2, 3, 4, 5].map(num => `
                                    <div class="rating-dot ${num <= value ? 'filled' : ''}">${num}</div>
                                `).join('')}
                            </div>
                            <div class="rating-value-display">Rating: ${value}/5</div>
                        </div>
                    </div>
                `;
            }
        });
        
        if (responses.problems_issues && responses.problems_issues.trim()) {
            html += `
                <div class="question-detail text-response">
                    <div class="question-text">Problems or Issues Reported</div>
                    <div class="text-response-content">${responses.problems_issues}</div>
                </div>
            `;
        }
        
        return html;
    }

    function setupExport(evaluations) {
        exportButton.addEventListener('click', function() {
            const dataStr = JSON.stringify(evaluations, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `evaluation_results_${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        });
    }

    loadResults();
});
