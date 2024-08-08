# One Hundred Million Checkboxes

A real-time, interactive web application that renders 100 million checkboxes, allowing multiple users to check and uncheck boxes simultaneously. This project demonstrates efficient rendering techniques, real-time updates, and scalable architecture.

## Table of Contents

- [Features](#features)
- [How It Works](#how-it-works)
- [Technologies Used](#technologies-used)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Performance Optimizations](#performance-optimizations)
- [Contributing](#contributing)
- [License](#license)

## Features

- Render 100 million checkboxes efficiently
- Real-time synchronization of checkbox states across multiple users
- Responsive design for both desktop and mobile devices
- Live chat functionality for connected users
- Progress tracking with a circular progress bar
- Search functionality to quickly navigate to specific checkboxes
- Optimized scrolling and rendering for smooth user experience

## How It Works

The application uses a combination of client-side and server-side technologies to efficiently manage and render 100 million checkboxes:

1. **Virtual Rendering**: Instead of rendering all 100 million checkboxes at once, the application only renders the checkboxes visible in the current viewport, plus a small buffer.

2. **Chunked Data Management**: The server divides the 100 million checkboxes into manageable chunks. When a client requests data, the server sends only the relevant chunks.

3. **Real-time Updates**: Using Socket.IO, the application provides real-time updates when any user checks or unchecks a box. These updates are broadcast to all connected clients.

4. **Efficient State Management**: The application uses Sets to manage the state of checked boxes, allowing for quick lookups and updates.

5. **Responsive Design**: The UI adapts to different screen sizes, providing a seamless experience on both desktop and mobile devices.

6. **Live Chat**: Users can communicate with each other using the built-in chat functionality, which also uses Socket.IO for real-time messaging.

## Technologies Used

- Frontend:
  - HTML5
  - CSS3 (with Tailwind CSS for styling)
  - JavaScript (ES6+)
  - Socket.IO Client
- Backend:
  - Node.js
  - Express.js
  - Socket.IO

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/MohdYahyaMahmodi/hundredmillioncheckboxes.git
   cd hundredmillioncheckboxes
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the server:
   ```
   node server.js
   ```

4. Open your browser and navigate to `http://localhost:3000` (or the port specified in your environment variables).

## Usage

- Scroll through the grid of checkboxes and click to check or uncheck them.
- Use the search box at the bottom right to quickly navigate to a specific checkbox.
- Click the chat icon at the bottom left to open the chat widget and communicate with other users.
- The progress bar at the top right shows the overall percentage of checked boxes.

## Performance Optimizations

- Virtual scrolling technique to render only visible checkboxes
- Chunked data transfer between client and server
- Efficient state management using Set data structure
- Debounced scroll and resize event handlers
- Optimized rendering using `requestAnimationFrame`
- Minimized DOM manipulations by reusing checkbox elements

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

---

Created by [Mohd Mahmodi](https://github.com/MohdYahyaMahmodi/) - feel free to contact me!
