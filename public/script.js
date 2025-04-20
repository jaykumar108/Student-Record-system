document.addEventListener("DOMContentLoaded", () => {
    checkAuthStatus();
});

async function checkAuthStatus() {
    try {
        const response = await fetch('/check-auth', {
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        const data = await response.json();
        console.log('Auth check response:', data);
        
        if (data.success) {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('welcomeMessage').style.display = 'block';
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('mainContent').style.display = 'block';
            fetchStudents();
        } else {
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('welcomeMessage').style.display = 'none';
            document.getElementById('mainContent').style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('signupForm').style.display = 'none';
        document.getElementById('welcomeMessage').style.display = 'none';
        document.getElementById('mainContent').style.display = 'none';
    }
}

async function handleLogin() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    if (!email || !password) {
        alert('Please enter both email and password');
        return;
    }

    try {
        const response = await fetch('/login', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        console.log('Login response:', data);
        
        if (data.success) {
            document.getElementById('loginForm').style.display = 'none';
            document.getElementById('signupForm').style.display = 'none';
            document.getElementById('welcomeMessage').style.display = 'block';
            document.getElementById('userName').textContent = data.user.name;
            document.getElementById('mainContent').style.display = 'block';
            
            // Show success message
            const successMessage = document.getElementById('successMessage');
            successMessage.style.display = 'block';
            successMessage.textContent = 'Login successful!';
            setTimeout(() => {
                successMessage.style.display = 'none';
            }, 3000);
            
            fetchStudents();
        } else {
            alert(data.message || 'Login failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Login failed. Please try again.');
    }
}

async function handleSignup() {
    const name = document.getElementById('signupName').value;
    const email = document.getElementById('signupEmail').value;
    const password = document.getElementById('signupPassword').value;
    
    if (!name || !email || !password) {
        alert('Please fill in all fields');
        return;
    }

    try {
        const response = await fetch('/signup', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        console.log('Signup response:', data); // Debug log
        
        if (data.success) {
            showLoginForm();
            alert('Signup successful! Please login.');
        } else {
            alert(data.message || 'Signup failed. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Signup failed. Please try again.');
    }
}

function showLoginForm() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('signupForm').style.display = 'none';
}

function showSignupForm() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('signupForm').style.display = 'block';
}

function logout() {
    fetch('/logout', {
        method: 'GET',
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json'
        }
    })
        .then(() => {
            document.getElementById('welcomeMessage').style.display = 'none';
            document.getElementById('mainContent').style.display = 'none';
            document.getElementById('loginForm').style.display = 'block';
            document.getElementById('signupForm').style.display = 'none';
            checkAuthStatus(); // Re-check auth status after logout
        })
        .catch(error => console.error('Error:', error));
}

async function fetchStudents() {
    try {
        const response = await fetch("/students", {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to fetch students');
        }
        
        const studentTable = document.getElementById("studentTable");
        studentTable.innerHTML = "";
        
        data.students.forEach((student, index) => {
            const row = `<tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.marks}</td>
                <td>${student.mobile}</td>
                <td>${student.email}</td>
                <td>${student.address}</td>
                <td>${student.about}</td>
                <td>
                    <button onclick="openEditModal('${student._id}', '${student.name}', '${student.class}', '${student.marks}', '${student.mobile}', '${student.email}', '${student.address}', '${student.about}')">Edit</button>
                    <button onclick="deleteStudent('${student._id}')">Delete</button>
                    <button onclick="printStudent('${student._id}')">Print</button>
                </td>
            </tr>`;
            studentTable.innerHTML += row;
        });
    } catch (error) {
        console.error('Error fetching students:', error);
        alert('Error fetching students. Please try again.');
    }
}

function openEditModal(id, name, studentClass, marks, mobile, email, address, about) {
    document.getElementById("editId").value = id;
    document.getElementById("editName").value = name;
    document.getElementById("editClass").value = studentClass;
    document.getElementById("editMarks").value = marks;
    document.getElementById("editMobile").value = mobile;
    document.getElementById("editEmail").value = email;
    document.getElementById("editAddress").value = address;
    document.getElementById("editAbout").value = about;
    document.getElementById("editModal").style.display = "block";
}

async function updateStudent() {
    try {
        const id = document.getElementById("editId").value;
        const student = {
            name: document.getElementById("editName").value,
            class: document.getElementById("editClass").value,
            marks: document.getElementById("editMarks").value,
            mobile: document.getElementById("editMobile").value,
            email: document.getElementById("editEmail").value,
            address: document.getElementById("editAddress").value,
            about: document.getElementById("editAbout").value
        };
        
        const response = await fetch(`/update/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(student),
            credentials: 'include'
        });
        
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to update student');
        }
        
        alert("Student Updated Successfully");
        document.getElementById("editModal").style.display = "none";
        fetchStudents();
    } catch (error) {
        console.error('Error updating student:', error);
        alert('Error updating student. Please try again.');
    }
}

function openAddModal() {
    document.getElementById("addModal").style.display = "block";
}

function closeAddModal() {
    document.getElementById("addModal").style.display = "none";
    // Clear form fields
    document.getElementById("addName").value = "";
    document.getElementById("addClass").value = "";
    document.getElementById("addMarks").value = "";
    document.getElementById("addMobile").value = "";
    document.getElementById("addEmail").value = "";
    document.getElementById("addAddress").value = "";
    document.getElementById("addAbout").value = "";
}

async function addStudent() {
    const name = document.getElementById('addName').value;
    const studentClass = document.getElementById('addClass').value;
    const marks = document.getElementById('addMarks').value;
    const mobile = document.getElementById('addMobile').value;
    const email = document.getElementById('addEmail').value;
    const address = document.getElementById('addAddress').value;
    const about = document.getElementById('addAbout').value;

    try {
        const response = await fetch('/add-student', {
            method: 'POST',
            credentials: 'include',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name,
                class: studentClass,
                marks: parseInt(marks),
                mobile,
                email,
                address,
                about
            })
        });

        const data = await response.json();
        
        if (data.success) {
            alert('Student added successfully!');
            closeAddModal();
            fetchStudents();
        } else {
            alert(data.message || 'Failed to add student. Please try again.');
        }
    } catch (error) {
        console.error('Error adding student:', error);
        alert('Error adding student. Please try again.');
    }

    return false; // Prevent form submission
}

async function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student?")) {
        try {
            const response = await fetch(`/delete/${id}`, {
                method: "DELETE",
                credentials: 'include'
            });
            const data = await response.json();
            
            if (!response.ok || !data.success) {
                throw new Error(data.message || 'Failed to delete student');
            }
            
            alert("Student Deleted Successfully");
            fetchStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Error deleting student. Please try again.');
        }
    }
}

async function searchStudent() {
    try {
        const query = document.getElementById("search").value;
        const response = await fetch(`/search?q=${query}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to search students');
        }
        
        const studentTable = document.getElementById("studentTable");
        studentTable.innerHTML = "";
        
        data.students.forEach((student, index) => {
            const row = `<tr>
                <td>${index + 1}</td>
                <td>${student.name}</td>
                <td>${student.class}</td>
                <td>${student.marks}</td>
                <td>${student.mobile}</td>
                <td>${student.email}</td>
                <td>${student.address}</td>
                <td>${student.about}</td>
                <td>
                    <button onclick="openEditModal('${student._id}', '${student.name}', '${student.class}', '${student.marks}', '${student.mobile}', '${student.email}', '${student.address}', '${student.about}')">Edit</button>
                    <button onclick="deleteStudent('${student._id}')">Delete</button>
                    <button onclick="printStudent('${student._id}')">Print</button>
                </td>
            </tr>`;
            studentTable.innerHTML += row;
        });
    } catch (error) {
        console.error('Error searching students:', error);
        alert('Error searching students. Please try again.');
    }
}

async function printStudent(id) {
    try {
        const response = await fetch(`/print/${id}`, {
            credentials: 'include'
        });
        const data = await response.json();
        
        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to print student');
        }
        
        window.open(`/print/${id}`);
    } catch (error) {
        console.error('Error printing student:', error);
        alert('Error printing student. Please try again.');
    }
}
