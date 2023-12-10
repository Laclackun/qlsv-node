const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3001;

// Kết nối MongoDB
mongoose.connect('mongodb://localhost:27017/cuoiki', { useNewUrlParser: true, useUnifiedTopology: true });

// Định nghĩa schema sinh viên
const studentSchema = new mongoose.Schema({
  "_id": String, // _id tương ứng với MSSV trong định dạng dữ liệu mới
  "MSSV": String, // Thêm trường MSSV nếu cần thiết
  "Tên": String,
  "Ngành": String,
  "Năm sinh": Number
});

// Tạo model sinh viên từ schema
const Student = mongoose.model('Student', studentSchema);

// Sử dụng body-parser để đọc dữ liệu từ req.body
app.use(bodyParser.urlencoded({ extended: true }));

// Thiết lập thư mục views để chứa các file EJS
app.set('views', './views');
app.set('view engine', 'ejs');

// Thêm route cho đường dẫn gốc
app.get('/', async (req, res) => {
    try {
      const students = await Student.find();
      res.render('index.ejs', { students });
    } catch (error) {
      res.status(500).send(error.message);
    }
  });

  // Thêm route cho trang quản lý sinh viên
app.get('/manageStudents', async (req, res) => {
  try {
    // Lấy danh sách sinh viên từ MongoDB (tương tự như ở route /students)
    const students = await Student.find();
    res.render('manageStudents.ejs', { students });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Thêm route cho trang danh sách sinh viên
app.get('/studentsList', async (req, res) => {
  try {
    // Lấy danh sách sinh viên từ MongoDB (tương tự như ở route /students)
    const students = await Student.find();
    res.render('studentsList.ejs', { students });
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route để hiển thị danh sách sinh viên
app.get('/students', async (req, res) => {
  try {
    const students = await Student.find();
    res.json(students);
    console.log('Students:', students);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route để thêm sinh viên mới
app.post('/students', async (req, res) => {
  const { MSSV, Tên, Ngành, "Năm sinh": yearOfBirth } = req.body;
  const student = new Student({_id: MSSV, MSSV, Tên, Ngành, "Năm sinh": yearOfBirth });

  try {
    await student.save();
    res.status(201).send('Student added successfully');
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route để xử lý yêu cầu cập nhật thông tin sinh viên
app.post('/students/edit/:id', async (req, res) => {
  const studentId = req.params.id;
  const { Tên, Ngành, "Năm sinh": yearOfBirth } = req.body;

  try {
    // Tìm sinh viên theo ID và cập nhật thông tin
    const result = await Student.findByIdAndUpdate(
      studentId,
      { $set: { Tên, Ngành, "Năm sinh": yearOfBirth } },
      { new: true }
    );

    if (!result) {
      // Nếu không tìm thấy sinh viên, gửi mã trạng thái 404
      res.status(404).send('Không tìm thấy sinh viên');
    } else {
      // Nếu thông tin sinh viên được cập nhật thành công, chuyển hướng về trang danh sách sinh viên
      res.redirect('/studentsList');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Route để xóa sinh viên
app.post('/students/delete', async (req, res) => {
  const { deleteMSSV } = req.body;

  try {
    // Tìm sinh viên với MSSV cung cấp và xóa nó
    const result = await Student.deleteOne({ _id: deleteMSSV });

    if (result.deletedCount === 0) {
      // Nếu không có sinh viên nào được xóa, gửi mã trạng thái 404
      res.status(404).send('Không tìm thấy sinh viên');
    } else {
      // Nếu có sinh viên được xóa, gửi thông báo thành công
      res.status(200).send('Xóa sinh viên thành công');
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

// Thêm route cho trang Thống Kê Sinh Viên
app.get('/studentStatistics', async (req, res) => {
  try {
    // Lấy dữ liệu sinh viên từ MongoDB
    const students = await Student.find();

    // Tính toán thống kê theo ngành học
    const nganhStatistics = calculateNganhStatistics(students);

    // Render trang thống kê theo ngành học bằng EJS
    res.render('studentStatistics', { nganhStatistics });
  } catch (error) {
    console.error('Error fetching students:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Hàm tính toán thống kê theo ngành học
function calculateNganhStatistics(students) {
  const nganhStatistics = {};

  students.forEach(student => {
    const nganh = student.Ngành;

    if (nganhStatistics[nganh]) {
      nganhStatistics[nganh].studentCount += 1;
    } else {
      nganhStatistics[nganh] = {
        nganh: nganh,
        studentCount: 1
      };
    }
  });

  return Object.values(nganhStatistics);
}

// Thêm route cho trang Thống Kê Sinh Viên theo Năm Sinh
app.get('/studentStatisticsByYear', async (req, res) => {
  try {
    // Lấy dữ liệu sinh viên từ MongoDB
    const students = await Student.find();

    // Tính toán thống kê theo năm sinh
    const yearStatistics = calculateYearStatistics(students);

    // Render trang thống kê theo năm sinh bằng EJS
    res.render('studentStatisticsByYear', { yearStatistics });
  } catch (error) {
    console.error('Error fetching students:', error.message);
    res.status(500).send('Internal Server Error');
  }
});

// Hàm tính toán thống kê theo năm sinh
function calculateYearStatistics(students) {
  const yearStatistics = {};

  students.forEach(student => {
    const yearOfBirth = student["Năm sinh"];

    if (yearStatistics[yearOfBirth]) {
      yearStatistics[yearOfBirth].studentCount += 1;
    } else {
      yearStatistics[yearOfBirth] = {
        yearOfBirth: yearOfBirth,
        studentCount: 1
      };
    }
  });

  return Object.values(yearStatistics);
}


// Khởi động server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
