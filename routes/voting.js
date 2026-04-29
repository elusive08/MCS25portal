const express = require('express');
const Election = require('../models/Election');
const { auth, checkRole } = require('../middleware/auth');

const router = express.Router();

// Create Election (Admin Only)
router.post('/create', auth, checkRole('admin'), async (req, res) => {
    try {
        const { post, candidates } = req.body;
        
        const formattedCandidates = candidates.map(name => ({ name, votes: 0 }));
        
        const election = new Election({
            post,
            candidates: formattedCandidates
        });

        await election.save();
        res.status(201).send(election);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get Active Elections
router.get('/active', auth, async (req, res) => {
    try {
        const elections = await Election.find({ active: true })
            .select('-votedBy'); // Don't send who voted for privacy
        res.send(elections);
    } catch (error) {
        res.status(500).send();
    }
});

// Vote in an Election
router.post('/:id/vote', auth, async (req, res) => {
    try {
        const { candidateId } = req.body;
        const election = await Election.findById(req.params.id);

        if (!election || !election.active) {
            return res.status(404).send({ error: 'Election not found or inactive' });
        }

        // Check if user has already voted
        if (election.votedBy.includes(req.user.id)) {
            return res.status(400).send({ error: 'You have already voted in this election' });
        }

        // Increment vote count for the candidate
        const candidate = election.candidates.id(candidateId);
        if (!candidate) {
            return res.status(400).send({ error: 'Candidate not found' });
        }

        candidate.votes += 1;
        election.votedBy.push(req.user.id);

        await election.save();

        // Emit socket event for real-time update
        const io = req.app.get('socketio');
        if (io) {
            io.emit('vote-updated', {
                electionId: election._id,
                candidates: election.candidates.map(c => ({ _id: c._id, name: c.name, votes: c.votes }))
            });
        }

        res.send({ message: 'Vote cast successfully' });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Get Results (Students and Reps)
router.get('/:id/results', auth, async (req, res) => {
    try {
        const election = await Election.findById(req.params.id)
            .select('-votedBy');
        
        if (!election) {
            return res.status(404).send({ error: 'Election not found' });
        }

        res.send(election);
    } catch (error) {
        res.status(500).send();
    }
});

module.exports = router;
