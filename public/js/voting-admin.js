document.addEventListener('DOMContentLoaded', () => {
    const electionForm = document.getElementById('election-form');
    const addCandidateBtn = document.getElementById('add-candidate');
    const candidatesContainer = document.getElementById('candidates-container');
    const messageDiv = document.getElementById('message');

    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'admin') {
        window.location.href = '/dashboard';
        return;
    }

    addCandidateBtn.addEventListener('click', () => {
        const div = document.createElement('div');
        div.className = 'candidate-input';
        div.innerHTML = '<input type="text" name="candidate" placeholder="Candidate Name" required>';
        candidatesContainer.appendChild(div);
    });

    electionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const post = document.getElementById('post').value;
        const candidateInputs = document.querySelectorAll('input[name="candidate"]');
        const candidates = Array.from(candidateInputs).map(input => input.value);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/voting/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ post, candidates })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.innerHTML = '<p style="color: green;">Election created successfully!</p>';
                electionForm.reset();
                // Reset to 2 candidate inputs
                candidatesContainer.innerHTML = `
                    <label>Candidates:</label>
                    <div class="candidate-input">
                        <input type="text" name="candidate" placeholder="Candidate Name" required>
                    </div>
                    <div class="candidate-input">
                        <input type="text" name="candidate" placeholder="Candidate Name" required>
                    </div>
                `;
            } else {
                messageDiv.innerHTML = `<p style="color: red;">Error: ${data.error}</p>`;
            }
        } catch (error) {
            messageDiv.innerHTML = '<p style="color: red;">Something went wrong.</p>';
        }
    });
});
