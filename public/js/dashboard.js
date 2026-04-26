const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user'));

if (!token || !user) {
    window.location.href = 'login.html';
}

// Display welcome message
document.getElementById('welcome-msg').innerText = `Welcome, ${user.name} (${user.role})`;

async function api(endpoint, options = {}) {
    const url = `/api${endpoint}`;
    console.log(`Fetching: ${url}`);

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
    
    if (options.body instanceof FormData) {
        delete headers['Content-Type'];
    }

    const response = await fetch(url, {
        ...options,
        headers
    });
    
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
        data = await response.json();
    } else {
        const text = await response.text();
        data = { error: text || 'Something went wrong' };
    }

    if (!response.ok) throw new Error(data.error || 'Something went wrong');
    return data;
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = 'login.html';
}

// News
async function loadNews() {
    try {
        const news = await api('/news');
        const newsList = document.getElementById('news-list');
        if (!newsList) return;
        newsList.innerHTML = news.length ? news.map(item => `
            <div class="news-card">
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3>${item.title}</h3>
                    ${user.role === 'rep' ? `<button onclick="deleteNews('${item._id}')" style="width:auto; padding:0.3rem 0.6rem; background:#e74c3c; font-size:0.8rem;">Delete</button>` : ''}
                </div>
                ${item.imageUrl ? `<img src="${item.imageUrl}" alt="${item.title}" style="max-width:100%; height:auto; border-radius:8px; margin: 10px 0;">` : ''}
                <p>${item.content}</p>
                <div class="meta">By ${item.author ? item.author.name : 'Unknown User'} on ${new Date(item.createdAt).toLocaleDateString()}</div>
            </div>
        `).join('') : '<p>No news updates yet.</p>';
        
        // Add stagger effect to cards
        const cards = newsList.querySelectorAll('.news-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    } catch (err) {
        console.error(err);
    }
}

// Resources
async function loadResources() {
    try {
        const resources = await api('/resources');
        const resourcesList = document.getElementById('resources-list');
        if (!resourcesList) return;
        resourcesList.innerHTML = resources.length ? resources.map(item => `
            <div class="resource-card">
                <div style="display:flex; justify-content:space-between; align-items:start; margin-bottom: 1rem;">
                    <h3 style="margin-bottom:0;">${item.courseName}</h3>
                    ${user.role === 'rep' ? `<button onclick="deleteResource('${item._id}')" style="width:auto; padding:0.4rem 0.8rem; background:#ef4444; font-size:0.8rem; border-radius:6px;">Delete</button>` : ''}
                </div>
                <p style="margin-bottom: 0.5rem; font-weight: 500;">${item.fileName}</p>
                <div class="meta">Uploaded by ${item.uploadedBy ? item.uploadedBy.name : 'Unknown User'}</div>
                <a href="${item.filePath}" target="_blank" download="${item.fileName}" class="download-btn">
                    <svg style="width:18px; height:18px; margin-right:8px; fill:currentColor" viewBox="0 0 24 24">
                        <path d="M5,20H19V18H5M19,9H15V3H9V9H5L12,16L19,9Z" />
                    </svg>
                    Download PDF
                </a>
            </div>
        `).join('') : '<p>No resources available yet.</p>';

        // Add stagger effect to cards
        const cards = resourcesList.querySelectorAll('.resource-card');
        cards.forEach((card, index) => {
            card.style.animationDelay = `${index * 0.1}s`;
        });
    } catch (err) {
        console.error(err);
    }
}

async function deleteNews(id) {
    if (!confirm('Are you sure you want to delete this news?')) return;
    try {
        await api(`/news/${id}`, { method: 'DELETE' });
        await loadNews();
    } catch (err) {
        alert(err.message);
    }
}

async function deleteResource(id) {
    if (!confirm('Are you sure you want to delete this resource?')) return;
    try {
        await api(`/resources/${id}`, { method: 'DELETE' });
        await loadResources();
    } catch (err) {
        alert(err.message);
    }
}

// Rep specific logic
const postNewsForm = document.getElementById('post-news-form');
if (postNewsForm) {
    postNewsForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Posting...';

            await api('/news', { method: 'POST', body: formData });
            
            e.target.reset();
            await loadNews();
        } catch (err) {
            alert(err.message);
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerText = 'Post News';
        }
    };
}

const uploadResourceForm = document.getElementById('upload-resource-form');
if (uploadResourceForm) {
    uploadResourceForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        try {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.innerText = 'Uploading...';
            
            await api('/resources', { method: 'POST', body: formData });
            
            e.target.reset();
            await loadResources();
            alert('Upload successful!');
        } catch (err) {
            alert(err.message);
        } finally {
            const submitBtn = e.target.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.innerText = 'Upload PDF';
        }
    };
}

// Initial Load
loadNews();
loadResources();
