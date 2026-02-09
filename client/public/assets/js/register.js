const API_URL = 'http://localhost:5000/api';

const combinations = {
    'PCM': 'Physics, Chemistry, Math',
    'PCB': 'Physics, Chemistry, Biology',
    'BCG': 'Biology, Chemistry, Geography',
    'HEG': 'History, Economics, Geography',
    'HEL': 'History, Economics, Literature',
    'MEG': 'Math, Economics, Geography',
    'DEG': 'Divinity, Economics, Geography',
    'MPG': 'Math, Physics, Geography',
    'BCM': 'Biology, Chemistry, Math',
    'HGL': 'History, Geography, Literature',
    'AKR': 'Art, Kiswahili, RE'
};

class RegisterPage {
    constructor() {
        this.formData = {
            level: '',
            class: '',
            combination: ''
        };
        this.render();
    }

    render() {
        const styles = `
            <style>
                body { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; }
                .register-card { max-width: 500px; margin: 50px auto; }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
        document.getElementById('app').innerHTML = this.getLayout();
        this.attachEvents();
    }

    getLayout() {
        return `
            <div class="container">
                <div class="card register-card shadow-lg">
                    <div class="card-body p-5">
                        <h3 class="text-center mb-4">Student Registration</h3>
                        <div id="error" class="alert alert-danger d-none"></div>
                        <form id="registerForm">
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input type="text" class="form-control" id="name" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-control" id="email" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Password</label>
                                <input type="password" class="form-control" id="password" required minlength="6">
                                <small class="text-muted">At least 6 characters</small>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Level</label>
                                <select class="form-select" id="level" required>
                                    <option value="">Select Level</option>
                                    <option value="o-level">O-Level</option>
                                    <option value="a-level">A-Level</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Class</label>
                                <select class="form-select" id="class" required disabled>
                                    <option value="">Select Level First</option>
                                </select>
                            </div>
                            <div class="mb-3 d-none" id="combinationGroup">
                                <label class="form-label">Subject Combination</label>
                                <select class="form-select" id="combination">
                                    <option value="">Select Combination</option>
                                    ${Object.entries(combinations).map(([code, name]) => 
                                        `<option value="${code}">${code} (${name})</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <button type="submit" class="btn btn-primary w-100" id="submitBtn">Register</button>
                        </form>
                        <div class="text-center mt-3">
                            <a href="/pages/login.html">Already have an account? Login</a>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        document.getElementById('level').addEventListener('change', (e) => this.updateClassOptions(e.target.value));
        document.getElementById('registerForm').addEventListener('submit', (e) => this.handleSubmit(e));
    }

    updateClassOptions(level) {
        const classSelect = document.getElementById('class');
        const combinationGroup = document.getElementById('combinationGroup');
        const combinationSelect = document.getElementById('combination');
        
        classSelect.disabled = false;
        classSelect.innerHTML = '<option value="">Select Class</option>';
        
        if (level === 'o-level') {
            classSelect.innerHTML += `
                <option value="s1">S1</option>
                <option value="s2">S2</option>
                <option value="s3">S3</option>
                <option value="s4">S4</option>
            `;
            combinationGroup.classList.add('d-none');
            combinationSelect.removeAttribute('required');
        } else if (level === 'a-level') {
            classSelect.innerHTML += `
                <option value="s5">S5</option>
                <option value="s6">S6</option>
            `;
            combinationGroup.classList.remove('d-none');
            combinationSelect.setAttribute('required', 'required');
        }
    }

    async handleSubmit(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const payload = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            role: 'student',
            level: document.getElementById('level').value,
            class: document.getElementById('class').value
        };
        
        if (payload.level === 'a-level') {
            payload.combination = document.getElementById('combination').value;
        }
        
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Registering...';
        
        try {
            const res = await fetch(`${API_URL}/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            
            const data = await res.json();
            
            if (data.success) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('user', JSON.stringify(data.data.user));
                window.location.href = '/pages/student-dashboard.html';
            } else {
                this.showError(data.message || 'Registration failed');
                submitBtn.disabled = false;
                submitBtn.innerHTML = 'Register';
            }
        } catch (err) {
            this.showError('Network error. Please try again.');
            submitBtn.disabled = false;
            submitBtn.innerHTML = 'Register';
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('error');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
        setTimeout(() => errorDiv.classList.add('d-none'), 5000);
    }
}

window.addEventListener('DOMContentLoaded', () => new RegisterPage());