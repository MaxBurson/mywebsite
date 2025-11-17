document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('questionnaireForm');
    const successMessage = document.getElementById('successMessage');

    // Make clicking on the span select the radio button
    document.querySelectorAll('.likert-option span').forEach(span => {
        span.addEventListener('click', function() {
            const radio = this.previousElementSibling;
            if (radio && radio.type === 'radio') {
                radio.checked = true;
            }
        });
    });

    form.addEventListener('submit', function(e) {
        e.preventDefault();

        // Collect form data
        const formData = new FormData(form);
        const responses = {
            timestamp: new Date().toISOString(),
            sectionA: {
                q1: formData.get('a1'),
                q2: formData.get('a2'),
                q3: formData.get('a3'),
                q4: formData.get('a4'),
                q5: formData.get('a5')
            },
            sectionB: {
                q1: formData.get('b1'),
                q2: formData.get('b2'),
                q3: formData.get('b3'),
                q4: formData.get('b4'),
                q5: formData.get('b5')
            },
            sectionC: {
                q1: formData.get('c1'),
                q2: formData.get('c2'),
                q3: formData.get('c3'),
                q4: formData.get('c4'),
                q5: formData.get('c5')
            },
            sectionD: {
                q1: formData.get('d1'),
                q2: formData.get('d2'),
                q3: formData.get('d3'),
                q4: formData.get('d4'),
                q5: formData.get('d5')
            }
        };

        // Get existing responses from localStorage
        let allResponses = JSON.parse(localStorage.getItem('questionnaireResponses') || '[]');
        
        // Add new response
        allResponses.push(responses);
        
        // Save back to localStorage
        localStorage.setItem('questionnaireResponses', JSON.stringify(allResponses));

        // Scroll to top smoothly
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });

        // Show success message after scroll starts
        setTimeout(function() {
            successMessage.classList.add('show');
        }, 300);

        // Reset form
        form.reset();

        // Hide success message after 4 seconds
        setTimeout(function() {
            successMessage.classList.remove('show');
        }, 4000);
    });

    // Add smooth scroll behavior
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });
});
