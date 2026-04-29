async function api(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    const url = `/api${endpoint}`;
    console.log(`Fetching: ${url}`);
    
    const headers = {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
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
    try {
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            data = { error: text || `Error ${response.status}: ${response.statusText}` };
        }
    } catch (e) {
        data = { error: 'Failed to parse response' };
    }

    if (!response.ok) {
        console.error('API Error:', data.error);
        throw new Error(data.error || 'Something went wrong');
    }
    return data;
}

// Login logic
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const body = Object.fromEntries(formData);
        try {
            const data = await api('/auth/login', { method: 'POST', body: JSON.stringify(body) });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = data.user.role === 'rep' ? 'rep-dashboard.html' : 'dashboard.html';
        } catch (err) {
            alert(err.message);
        }
    };
}

// Signup logic
const signupForm = document.getElementById('signup-form');
if (signupForm) {
    signupForm.onsubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dataObj = Object.fromEntries(formData);
        
        if (dataObj.password === 'rep/25/1010') {
            dataObj.role = 'rep';
        } else if (dataObj.password === 'admin/25/1010') {
            dataObj.role = 'admin';
        } else {
            dataObj.role = 'student';
        }

        try {
            const data = await api('/auth/signup', { method: 'POST', body: JSON.stringify(dataObj) });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            window.location.href = data.user.role === 'rep' ? 'rep-dashboard.html' : 'dashboard.html';
        } catch (err) {
            alert(err.message);
        }
    };
}
