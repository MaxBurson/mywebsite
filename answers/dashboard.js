document.addEventListener('DOMContentLoaded', function() {
    const responsesContainer = document.getElementById('responsesContainer');
    const emptyState = document.getElementById('emptyState');
    const totalResponsesEl = document.getElementById('totalResponses');
    const exportBtn = document.getElementById('exportBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    const questionLabels = {
        sectionA: {
            title: 'SECTION A — IMMERSION & ENGAGEMENT',
            questions: {
                q1: 'I felt immersed in the game world while playing.',
                q2: 'The NPC interactions maintained my attention.',
                q3: 'The dialogue felt believable and natural.',
                q4: 'I felt emotionally invested in the NPC I interacted with.',
                q5: 'The gameplay experience felt enjoyable overall.'
            }
        },
        sectionB: {
            title: 'SECTION B — NPC INTELLIGENCE & PERSONALITY',
            questions: {
                q1: 'The NPC responded appropriately to what I said.',
                q2: 'The NPC\'s personality felt consistent.',
                q3: 'The NPC remembered or referenced things from earlier in the conversation.',
                q4: 'The NPC felt more intelligent than NPCs in typical 2D games.',
                q5: 'My dialogue choices felt like they influenced the NPC\'s responses.'
            }
        },
        sectionC: {
            title: 'SECTION C — COMPARISON: STATIC vs LLM NPC',
            questions: {
                q1: 'The LLM-powered NPC felt more immersive than the static version.',
                q2: 'The LLM-powered NPC felt less predictable than the static version.',
                q3: 'I preferred the LLM NPC overall compared to the static NPC.',
                q4: 'The difference between the two NPC systems was noticeable.',
                q5: 'The LLM NPC improved my understanding of what to do next.'
            }
        },
        sectionD: {
            title: 'SECTION D — OPEN-ENDED FEEDBACK',
            questions: {
                q1: 'Describe one moment that felt especially immersive.',
                q2: 'Describe one moment that broke your immersion.',
                q3: 'What did the LLM NPC do better than the static NPC?',
                q4: 'What did the LLM NPC do worse or struggle with?',
                q5: 'If you could improve one thing about the NPC interactions, what would it be?'
            }
        }
    };

    function loadResponses() {
        const responses = JSON.parse(localStorage.getItem('questionnaireResponses') || '[]');
        
        totalResponsesEl.textContent = responses.length;

        if (responses.length === 0) {
            emptyState.classList.add('show');
            responsesContainer.innerHTML = '';
            return;
        }

        emptyState.classList.remove('show');
        responsesContainer.innerHTML = '';

        responses.forEach((response, index) => {
            const card = createResponseCard(response, index);
            responsesContainer.appendChild(card);
        });
    }

    function createResponseCard(response, index) {
        const card = document.createElement('div');
        card.className = 'response-card';

        const timestamp = new Date(response.timestamp);
        const formattedDate = timestamp.toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        let html = `
            <div class="response-header">
                <div>
                    <div class="response-id">RESPONSE #${index + 1}</div>
                    <div class="response-timestamp">${formattedDate}</div>
                </div>
                <button class="delete-btn" data-index="${index}">DELETE</button>
            </div>
        `;

        // Add Likert scale sections (A, B, C)
        ['sectionA', 'sectionB', 'sectionC'].forEach(section => {
            html += `
                <div class="response-section">
                    <h3>${questionLabels[section].title}</h3>
                    <div class="response-grid">
            `;

            Object.keys(response[section]).forEach(q => {
                html += `
                    <div class="response-item">
                        <div class="response-item-label">Q${q.substring(1)}</div>
                        <div class="response-item-value">${response[section][q]}/5</div>
                    </div>
                `;
            });

            html += `
                    </div>
                </div>
            `;
        });

        // Add open-ended section (D)
        html += `
            <div class="response-section">
                <h3>${questionLabels.sectionD.title}</h3>
        `;

        Object.keys(response.sectionD).forEach(q => {
            html += `
                <div class="response-text">
                    <div class="response-text-label">${questionLabels.sectionD.questions[q]}</div>
                    <div class="response-text-value">${response.sectionD[q]}</div>
                </div>
            `;
        });

        html += `
            </div>
        `;

        card.innerHTML = html;

        // Add delete functionality
        card.querySelector('.delete-btn').addEventListener('click', function() {
            if (confirm('Are you sure you want to delete this response?')) {
                deleteResponse(index);
            }
        });

        return card;
    }

    function deleteResponse(index) {
        let responses = JSON.parse(localStorage.getItem('questionnaireResponses') || '[]');
        responses.splice(index, 1);
        localStorage.setItem('questionnaireResponses', JSON.stringify(responses));
        loadResponses();
    }

    function exportToCSV() {
        const responses = JSON.parse(localStorage.getItem('questionnaireResponses') || '[]');
        
        if (responses.length === 0) {
            alert('No responses to export!');
            return;
        }

        // Create CSV header
        let csv = 'Timestamp,';
        
        // Add Likert scale headers
        ['A', 'B', 'C'].forEach(section => {
            for (let i = 1; i <= 5; i++) {
                csv += `Section ${section} Q${i},`;
            }
        });
        
        // Add open-ended headers
        for (let i = 1; i <= 5; i++) {
            csv += `Section D Q${i}${i < 5 ? ',' : ''}`;
        }
        csv += '\n';

        // Add data rows
        responses.forEach(response => {
            csv += `"${response.timestamp}",`;
            
            // Add Likert responses
            ['sectionA', 'sectionB', 'sectionC'].forEach(section => {
                for (let i = 1; i <= 5; i++) {
                    csv += `${response[section][`q${i}`]},`;
                }
            });
            
            // Add open-ended responses
            for (let i = 1; i <= 5; i++) {
                const text = response.sectionD[`q${i}`].replace(/"/g, '""');
                csv += `"${text}"${i < 5 ? ',' : ''}`;
            }
            csv += '\n';
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `questionnaire-responses-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }

    function clearAllData() {
        if (confirm('Are you sure you want to delete ALL responses? This cannot be undone!')) {
            if (confirm('Really sure? This will permanently delete all data!')) {
                localStorage.removeItem('questionnaireResponses');
                loadResponses();
            }
        }
    }

    // Event listeners
    exportBtn.addEventListener('click', exportToCSV);
    clearAllBtn.addEventListener('click', clearAllData);

    // Initial load
    loadResponses();

    // Refresh every 5 seconds to catch new responses
    setInterval(loadResponses, 5000);
});
