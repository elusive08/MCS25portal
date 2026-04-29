document.addEventListener('DOMContentLoaded', async () => {
    const resultsContainer = document.getElementById('results-container');
    const electionSelector = document.getElementById('election-selector');
    const socket = io();

    let currentElectionId = null;

    async function loadElectionList() {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/voting/active', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const elections = await response.json();

            if (elections.length === 0) {
                electionSelector.innerHTML = '<p>No active elections.</p>';
                return;
            }

            electionSelector.innerHTML = '<h3>Select an Election to view Live Results:</h3>' + elections.map(e => `
                <button class="select-election" data-id="${e._id}">${e.post}</button>
            `).join('');

            document.querySelectorAll('.select-election').forEach(btn => {
                btn.addEventListener('click', () => {
                    currentElectionId = btn.dataset.id;
                    loadResults(currentElectionId);
                });
            });
        } catch (error) {
            console.error('Error loading elections', error);
        }
    }

    async function loadResults(id) {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`/api/voting/${id}/results`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const election = await response.json();
            displayResults(election);
        } catch (error) {
            resultsContainer.innerHTML = '<p>Error loading results.</p>';
        }
    }

    function displayResults(election) {
        const totalVotes = election.candidates.reduce((sum, c) => sum + c.votes, 0);
        
        resultsContainer.innerHTML = `
            <h2>${election.post}</h2>
            <p>Total Votes: ${totalVotes}</p>
            ${election.candidates.map(candidate => {
                const percentage = totalVotes === 0 ? 0 : Math.round((candidate.votes / totalVotes) * 100);
                return `
                    <div class="candidate-result">
                        <div class="candidate-name">${candidate.name} (${candidate.votes} votes)</div>
                        <div class="result-bar-container">
                            <div class="result-bar" style="width: ${percentage}%">${percentage}%</div>
                        </div>
                    </div>
                `;
            }).join('')}
        `;
    }

    // Listen for real-time updates
    socket.on('vote-updated', (data) => {
        if (currentElectionId === data.electionId) {
            // We can update the UI directly without a full fetch
            const election = {
                post: document.querySelector('#results-container h2').innerText,
                candidates: data.candidates
            };
            displayResults(election);
        }
    });

    loadElectionList();
});
