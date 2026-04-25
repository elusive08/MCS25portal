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
                <p>${item.content}</p>
                <div class="meta">By ${item.author ? item.author.name : 'Unknown User'} on ${new Date(item.createdAt).toLocaleDateString()}</div>
            </div>
        `).join('') : '<p>No news updates yet.</p>';
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
                <div style="display:flex; justify-content:space-between; align-items:start;">
                    <h3>${item.courseName}</h3>
                    ${user.role === 'rep' ? `<button onclick="deleteResource('${item._id}')" style="width:auto; padding:0.3rem 0.6rem; background:#e74c3c; font-size:0.8rem;">Delete</button>` : ''}
                </div>
                <p>File: ${item.fileName}</p>
                <div class="meta">Uploaded by ${item.uploadedBy ? item.uploadedBy.name : 'Unknown User'}</div>
                <a href="/${item.filePath}" target="_blank" class="download-btn">Download PDF</a>
            </div>
        `).join('') : '<p>No resources available yet.</p>';
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
        const body = Object.fromEntries(formData);
        try {
            await api('/news', { method: 'POST', body: JSON.stringify(body) });
            e.target.reset();
            await loadNews();
        } catch (err) {
            alert(err.message);
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
