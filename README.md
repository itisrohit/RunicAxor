# RunicAxor  

RunicAxor is a lightweight code execution engine that uses Docker containers to securely execute code in isolated environments. It currently supports **NodeJs** and **Python**.  

## Features  
- Secure execution of code with resource constraints (memory, CPU, and no network access).  
- Uses Docker containers for language-specific runtime environments.  
- Simple REST API for sending code to execute.  

## Setup  

### Prerequisites  
- [Node.js](https://nodejs.org/) (v20+)  
- [Docker](https://www.docker.com/)  

### Installation  

1. Clone the repository:  
   ```bash  
   git clone https://github.com/your-username/RunicAxor.git  
   cd RunicAxor  
   ```  

2. Install dependencies:  
   ```bash  
   npm install  
   ```  

3. Build the Docker images for supported languages:  
   ```bash  
   docker build -t code-engine-javascript ./code-engine-images/nodejs  
   docker build -t code-engine-python ./code-engine-images/python  
   ```  

4. Start the server:  
   ```bash  
   npm start  
   ```  

## API Usage  

### Endpoint  
- **POST** `/execute`  

### Request Body  
Send a JSON payload:  
```json  
{  
  "code": "print('Hello, world!')",  
  "language": "python"  
}  
```  

### Response  
- **Success**:  
  ```json  
  {  
    "success": true,  
    "output": "Hello, world!"  
  }  
  ```  

- **Error**:  
  ```json  
  {  
    "success": false,  
    "error": "Error message"  
  }  
  ```  

## Supported Languages  
- **JavaScript**  
- **Python**  

## Contributing  
Contributions are welcome! If you have ideas, bug fixes, or additional features you'd like to see, feel free to open an issue or submit a pull request.  

This repository is a work in progress, and I aim to improve it further by adding support for more languages and enhancing functionality over time.  

## Notes  
- Ensure Docker is running before starting the server.  
- Each code snippet is executed in a separate, isolated Docker container with limited resources for security.  

## License  
This project is licensed under the [MIT License](LICENSE).  

  

