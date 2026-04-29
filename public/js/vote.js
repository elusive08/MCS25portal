document.addEventListener('DOMContentLoaded', async () => {
    const electionList = document.getElementById('election-list');
    const messageDiv = document.getElementById('message');

    async function loadElections() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/voting/active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const elections = await response.json();

            if (elections.length === 0) {
                electionList.innerHTML = '<p>No active elections at the moment.</p>';
                return;
            }

            electionList.innerHTML = elections.map(election => `
                <div class="election-card">
                    <h3>${election.post}</h3>
                    <div class="candidates">
                        ${election.candidates.map(candidate => `
                            <button class="vote-btn" data-election-id="${election._id}" data-candidate-id="${candidate._id}">
                                Vote for ${candidate.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `).join('');

            // Add event listeners to vote buttons
            document.querySelectorAll('.vote-btn').forEach(btn => {
                btn.addEventListener('click', () => castVote(btn.dataset.electionId, btn.dataset.candidateId));
            });

        } catch (error) {
            electionList.innerHTML = '<p>Error loading elections.</p>';
        }
    }

    async function castVote(electionId, candidateId) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/voting/${electionId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ candidateId })
            });

            const data = await response.json();

            if (response.ok) {
                messageDiv.innerHTML = '<p style="color: green;">Vote cast successfully!</p>';
                loadElections(); // Refresh to hide options or show status
            } else {
                messageDiv.innerHTML = `<p style="color: red;">${data.error}</p>`;
            }
        } catch (error) {
            messageDiv.innerHTML = '<p style="color: red;">Error casting vote.</p>';
        }
    }

    loadElections();
});
