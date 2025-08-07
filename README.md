# 🏋️ FIT-HUB PORTAL

A comprehensive fitness management portal with user authentication, admin dashboard, and Google Sign-in integration.

## 🚀 Features

- **User Authentication**: Email/Password and Google Sign-in
- **Admin Dashboard**: User management and statistics
- **Role-based Access**: Admin and User roles
- **MongoDB Integration**: Secure data storage
- **JWT Authentication**: Secure token-based authentication
- **Responsive Design**: Modern React frontend

## 📁 Project Structure

```
fit-hub-portal/
├── client/          # React frontend
├── server/          # Flask backend
└── README.md
```

## 🛠️ Tech Stack

### Backend
- **Flask**: Python web framework
- **MongoDB**: Database
- **JWT**: Authentication tokens
- **Bcrypt**: Password hashing
- **Flask-CORS**: Cross-origin requests

### Frontend
- **React**: UI framework
- **Firebase**: Google authentication
- **CSS3**: Styling

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 14+
- MongoDB

### Backend Setup
```bash
cd server
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python app.py
```

### Frontend Setup
```bash
cd client
npm install
npm start
```

## 🔧 Configuration

Create a `.env` file in the server directory:
```
MONGO_URI=mongodb://localhost:27017/
JWT_SECRET=your-secret-key
```

## 👨‍💻 Author

**Nandhu TS**
- GitHub: [@nandhuts2002](https://github.com/nandhuts2002)

## 📄 License

This project is licensed under the MIT License.