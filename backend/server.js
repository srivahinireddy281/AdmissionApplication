const express = require("express")
const cors = require("cors")
const bodyParser = require("body-parser")
const session = require("express-session")
const path = require("path")
const { exec } = require('child_process')

const admissionRoutes = require("./routes/admissionRoutes")

const app = express()

app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}))

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')))

app.use("/", admissionRoutes)

const DEFAULT_PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000

function startServer(port) {
    const server = app.listen(port, () => {
        console.log(`Server running on port ${port}`)
        console.log(`Open your browser to http://localhost:${port}`)
    })

    server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is already in use. Trying port ${port + 1}...`)
            startServer(port + 1)
        } else {
            console.error('Server failed:', err)
            process.exit(1)
        }
    })
}

startServer(DEFAULT_PORT)