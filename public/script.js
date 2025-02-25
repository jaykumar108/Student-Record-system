document.addEventListener("DOMContentLoaded", () => {
    fetchStudents();
});

async function fetchStudents() {
    const response = await fetch("/students");
    const students = await response.json();
    
    const studentTable = document.getElementById("studentTable");
    studentTable.innerHTML = "";
    
    students.forEach((student, index) => {
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
    
    await fetch(`/update/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student)
    });
    
    alert("Student Updated Successfully");
    document.getElementById("editModal").style.display = "none";
    fetchStudents();
}

async function addStudent() {
    const student = {
        name: document.getElementById("name").value,
        class: document.getElementById("class").value,
        marks: document.getElementById("marks").value,
        mobile: document.getElementById("mobile").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        about: document.getElementById("about").value
    };
    
    await fetch("/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(student)
    });
    
    alert("Student Added Successfully");
    fetchStudents();
    document.getElementById("studentForm").reset();
}

async function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student?")) {
        await fetch(`/delete/${id}`, { method: "DELETE" });
        alert("Student Deleted Successfully");
        fetchStudents();
    }
}

async function searchStudent() {
    const query = document.getElementById("search").value;
    const response = await fetch(`/search?q=${query}`);
    const students = await response.json();
    
    const studentTable = document.getElementById("studentTable");
    studentTable.innerHTML = "";
    
    students.forEach((student, index) => {
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
}

async function printStudent(id) {
    window.open(`/print/${id}`);
}
